import { generateJson, Type, type Schema } from "./gemini";

export type WorkflowApproverType = "USER" | "ROLE" | "DEPARTMENT";
export type WorkflowStepSuggestion = {
  name: string;
  approverType: WorkflowApproverType;
  approverValue: string;
};
export type WorkflowSuggestion = {
  name: string;
  description: string;
  steps: WorkflowStepSuggestion[];
};
export type WorkflowContext = {
  departments: string[];
  roles: string[];
  approverTypes: WorkflowApproverType[];
  users: Array<{ id: string; name: string }>;
};

const schema: Schema = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING },
    description: { type: Type.STRING },
    steps: {
      type: Type.ARRAY,
      minItems: "1",
      maxItems: "20",
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          approverType: { type: Type.STRING, format: "enum", enum: ["USER", "ROLE", "DEPARTMENT"] },
          approverValue: { type: Type.STRING },
        },
        required: ["name", "approverType", "approverValue"],
        propertyOrdering: ["name", "approverType", "approverValue"],
      },
    },
  },
  required: ["name", "description", "steps"],
  propertyOrdering: ["name", "description", "steps"],
};

function tidy(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export async function generateWorkflowSuggestion(prompt: string, context: WorkflowContext): Promise<WorkflowSuggestion> {
  const generated = await generateJson<Partial<WorkflowSuggestion>>(
    [
      "Design a new approval workflow for FlowForge. Return a workflow blueprint only; never claim it has been saved.",
      "Use only the supplied company departments, roles, and user IDs for approverValue.",
      `Approver types are exactly: ${context.approverTypes.join(", ")}. Roles and departments must match their supplied values exactly; user approverValue must be a supplied user ID.`,
      "Provide between 1 and 20 named sequential steps. Do not add other properties.",
      `Company approver context:\n${JSON.stringify(context)}`,
      `Admin request:\n${prompt}`,
    ].join("\n\n"),
    schema,
  );

  const allowedDepartments = new Set(context.departments);
  const allowedRoles = new Set(context.roles);
  const allowedUsers = new Set(context.users.map((user) => user.id));
  const steps: WorkflowStepSuggestion[] = [];

  for (const candidate of Array.isArray(generated.steps) ? generated.steps : []) {
    if (!candidate || typeof candidate !== "object") continue;
    const item = candidate as Record<string, unknown>;
    const name = tidy(item.name, 100);
    const approverType = item.approverType;
    const approverValue = tidy(item.approverValue, 200);
    if (!name || !approverValue || (approverType !== "USER" && approverType !== "ROLE" && approverType !== "DEPARTMENT")) continue;
    const valid = approverType === "USER"
      ? allowedUsers.has(approverValue)
      : approverType === "ROLE"
        ? allowedRoles.has(approverValue)
        : approverType === "DEPARTMENT"
          ? allowedDepartments.has(approverValue)
          : false;
    if (!valid) continue;
    steps.push({ name, approverType, approverValue });
    if (steps.length === 20) break;
  }

  if (steps.length === 0) throw new Error("Gemini returned no approver steps valid for this company.");
  return {
    name: tidy(generated.name, 120) || "New approval workflow",
    description: tidy(generated.description, 1000),
    steps,
  };
}
