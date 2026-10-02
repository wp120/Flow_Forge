import { randomUUID } from "node:crypto";
import { generateJson, Type, type Schema } from "./gemini";

export const supportedFormFieldTypes = ["text", "textarea", "number", "date", "file"] as const;
export type SupportedFormFieldType = typeof supportedFormFieldTypes[number];

export type FormField = {
  id: string;
  label: string;
  type: SupportedFormFieldType;
  required: boolean;
};

export type FormDraft = {
  name: string;
  description: string;
  workflowId?: string;
  fields: FormField[];
};

const schema: Schema = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING },
    description: { type: Type.STRING },
    fields: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          label: { type: Type.STRING },
          type: { type: Type.STRING, format: "enum", enum: [...supportedFormFieldTypes] },
          required: { type: Type.BOOLEAN },
        },
        required: ["id", "label", "type", "required"],
        propertyOrdering: ["id", "label", "type", "required"],
      },
    },
  },
  required: ["name", "description", "fields"],
  propertyOrdering: ["name", "description", "fields"],
};

function cleanString(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

export async function generateFormDraft(prompt: string, current?: Partial<FormDraft>): Promise<FormDraft> {
  const existingFields = Array.isArray(current?.fields) ? current.fields : [];
  const generated = await generateJson<Partial<FormDraft>>(
    [
      "Create or modify an intake form for FlowForge.",
      "Return only fields supported by the schema. Field type must be one of text, textarea, number, date, file.",
      "When modifying an existing form, preserve every existing field ID for any retained/modified field; do not invent replacement IDs for existing fields.",
      "Use unique field IDs for new fields. Do not include data or executable content.",
      `Admin request:\n${prompt}`,
      `Current form (empty for creation):\n${JSON.stringify(current ?? {})}`,
    ].join("\n\n"),
    schema,
  );

  if (!Array.isArray(generated.fields)) throw new Error("Gemini did not return a valid fields array.");
  const usedIds = new Set<string>();
  const fields: FormField[] = [];

  for (const [index, candidate] of generated.fields.entries()) {
    if (!candidate || typeof candidate !== "object") continue;
    const item = candidate as Record<string, unknown>;
    const label = cleanString(item.label, 100);
    const type = item.type;
    if (!label || typeof type !== "string" || !supportedFormFieldTypes.includes(type as SupportedFormFieldType)) continue;

    const proposedId = cleanString(item.id, 120);
    const existingById = existingFields.find((field) => field.id === proposedId);
    const existingAtPosition = existingFields[index];
    const existingByLabel = existingFields.find((field) => cleanString(field.label, 100).toLowerCase() === label.toLowerCase());
    let id = existingById?.id ?? existingByLabel?.id ?? (existingAtPosition && !usedIds.has(existingAtPosition.id) ? existingAtPosition.id : "");
    if (!id || usedIds.has(id)) id = `field-${randomUUID()}`;
    usedIds.add(id);

    fields.push({
      id,
      label,
      type: type as SupportedFormFieldType,
      required: typeof item.required === "boolean" ? item.required : false,
    });
  }

  if (fields.length === 0) throw new Error("Gemini did not return any valid form fields.");

  return {
    name: cleanString(generated.name, 120) || cleanString(current?.name, 120) || "New request form",
    description: cleanString(generated.description, 1000),
    ...(current?.workflowId ? { workflowId: current.workflowId } : {}),
    fields,
  };
}
