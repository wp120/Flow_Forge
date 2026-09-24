import { useEffect, useState } from "react";
import { ChevronRight, MoreHorizontal, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { Button, Field, PageHeader, StatusBadge } from "../components/ui";
import { apiFetch } from "../lib/api";

type WorkflowStepDraft = {
  name: string;
  approverType: string;
  approverValue: string;
};

type WorkflowOptions = {
  users: { id: string; name: string; email: string }[];
  departments: string[];
  roles: string[];
};

export function Workflows() {
  const [workflows, setWorkflows] = useState<any[]>([]);

  useEffect(() => {
    async function loadWorkflows() {
      try {
        const data = await apiFetch<{ workflows: any[] }>("/api/workflows");
        setWorkflows(data.workflows);
      } catch {
        setWorkflows([]);
      }
    }

    loadWorkflows();
  }, []);
  return (
    <>
      <PageHeader
        eyebrow="CONFIGURATION"
        title="Workflows"
        description="Define how requests move from submission to outcome."
        action={
          <Link to="/workflows/new" className="button button-primary">
            <Plus size={16} /> Create workflow
          </Link>
        }
      />
      <div className="panel">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Workflow</th>
                <th>Status</th>
                <th>Associated form</th>
                <th>Steps</th>
                <th>Last updated</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {workflows.map((workflow) => (
                <tr key={workflow.id}>
                  <td>
                    <Link
                      to={`/workflows/${workflow.id}`}
                      className="table-primary"
                    >
                      {workflow.name}
                    </Link>
                    <small>{workflow.description}</small>
                  </td>
                  <td>
                    <StatusBadge status={workflow.status} />
                  </td>
                  <td>{workflow.form}</td>
                  <td>{workflow.steps} steps</td>
                  <td>Sep 12, 2026</td>
                  <td>
                    <Link
                      to={`/workflows/${workflow.id}`}
                      className="icon-button"
                    >
                      <ChevronRight size={16} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

export function WorkflowEditor() {
  const [name, setName] = useState("New approval workflow");
  const [description, setDescription] = useState("Route submitted requests through the appropriate reviewers.");
  const [steps, setSteps] = useState<WorkflowStepDraft[]>([
    { name: "Team manager", approverType: "ROLE", approverValue: "ADMIN" },
    { name: "Finance partner", approverType: "DEPARTMENT", approverValue: "" },
  ]);
  const [options, setOptions] = useState<WorkflowOptions>({ users: [], departments: [], roles: [] });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadOptions() {
      try {
        const data = await apiFetch<WorkflowOptions>("/api/admin/workflow-options");
        setOptions(data);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Unable to load approver options.");
      }
    }

    loadOptions();
  }, []);

  function updateStep(index: number, changes: Partial<WorkflowStepDraft>) {
    setSteps((current) => current.map((step, stepIndex) => stepIndex === index ? { ...step, ...changes } : step));
  }

  function valuesFor(type: string) {
    if (type === "USER") return options.users.map((user) => ({ value: user.id, label: `${user.name} · ${user.email}` }));
    if (type === "DEPARTMENT") return options.departments.map((department) => ({ value: department, label: department }));
    return options.roles.map((role) => ({ value: role, label: role }));
  }

  async function saveWorkflow() {
    setSaving(true);
    setError("");

    try {
      await apiFetch("/api/workflows", {
        method: "POST",
        body: JSON.stringify({ name, description, steps }),
      });
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save workflow.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="WORKFLOW BUILDER"
        title="Create workflow"
        description="Set the people and sequence that decide a request."
        action={
          <Button onClick={saveWorkflow} disabled={saving}>{saving ? "Saving..." : "Save workflow"}</Button>
        }
      />
      <div className="editor-layout">
        <section className="panel editor-panel">
          <div className="panel-heading">
            <div>
              <h2>Workflow details</h2>
              <p>Describe what this workflow is for.</p>
            </div>
          </div>
          <Field label="Workflow name">
            <input value={name} onChange={(event) => setName(event.target.value)} />
          </Field>
          <Field label="Description">
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={3}
            />
          </Field>
          {error && <div className="error-banner">{error}</div>}
        </section>
        <section className="panel editor-panel">
          <div className="panel-heading">
            <div>
              <h2>Approval steps</h2>
              <p>Requests move through these steps in order.</p>
            </div>
            <Button
              variant="secondary"
              icon={Plus}
              onClick={() => setSteps([...steps, { name: `Step ${steps.length + 1}`, approverType: "ROLE", approverValue: options.roles[0] ?? "ADMIN" }])}
            >
              Add step
            </Button>
          </div>
          <div className="step-list">
            {steps.map((step, index) => (
              <div className="workflow-step" key={`${step.name}-${index}`}>
                <div className="step-index">{index + 1}</div>
                <div className="step-line" />
                <div className="step-content">
                  <span className="eyebrow">STEP {index + 1}</span>
                  <input
                    value={step.name}
                    onChange={(event) => updateStep(index, { name: event.target.value })}
                    aria-label={`Step ${index + 1} name`}
                  />
                  <select
                    value={step.approverType}
                    onChange={(event) => {
                      const nextType = event.target.value;
                      updateStep(index, { approverType: nextType, approverValue: valuesFor(nextType)[0]?.value ?? "" });
                    }}
                  >
                    <option value="DEPARTMENT">Department</option>
                    <option value="ROLE">Role</option>
                    <option value="USER">User</option>
                  </select>
                  <select
                    value={step.approverValue}
                    onChange={(event) => updateStep(index, { approverValue: event.target.value })}
                  >
                    {valuesFor(step.approverType).map((option) => (
                      <option value={option.value} key={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
                <button className="icon-button">
                  <MoreHorizontal size={17} />
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
