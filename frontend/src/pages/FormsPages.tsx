import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Check,
  ChevronRight,
  FilePlus2,
  FileText,
  GitBranch,
  Plus,
  Trash2,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { Progress } from "../components/Progress";
import { Button, Field, PageHeader, StatusBadge } from "../components/ui";
import { apiFetch } from "../lib/api";

export function Forms() {
  const [forms, setForms] = useState<any[]>([]);
  const [section, setSection] = useState<"DRAFT" | "PUBLISHED" | "ARCHIVED">(
    "DRAFT",
  );

  useEffect(() => {
    loadForms();
  }, []);

  async function loadForms() {
    try {
      const data = await apiFetch<{ forms: any[] }>("/api/forms");
      setForms(data.forms);
    } catch {
      setForms([]);
    }
  }

  const visibleForms = forms.filter((form) =>
    section === "DRAFT"
      ? form.status === "DRAFT"
      : section === "PUBLISHED"
        ? form.status === "PUBLISHED"
        : form.status === "ARCHIVED",
  );

  return (
    <>
      <PageHeader
        eyebrow="CONFIGURATION"
        title="Forms"
        description="Design the structured intake experiences your teams use."
        action={
          <Link to="/forms/new" className="button button-primary">
            <FilePlus2 size={16} /> Create form
          </Link>
        }
      />
      <div className="toolbar">
        <div className="search-field">
          <Search size={16} />
          <input placeholder="Search forms" />
        </div>
        <button className="button button-secondary">
          <SlidersHorizontal size={16} /> Filter
        </button>
      </div>
      <div className="section-tabs" role="tablist" aria-label="Form sections">
        {(["DRAFT", "PUBLISHED", "ARCHIVED"] as const).map((tab) => (
          <button
            type="button"
            role="tab"
            aria-selected={section === tab}
            className={`section-tab ${section === tab ? "active" : ""}`}
            onClick={() => setSection(tab)}
            key={tab}
          >
            {tab === "DRAFT"
              ? "Drafts"
              : tab === "PUBLISHED"
                ? "Latest published"
                : "Archived"}
          </button>
        ))}
      </div>
      <div className="resource-grid">
        {visibleForms.map((form) => (
          <article className="resource-card" key={form.versionId}>
            <div className="resource-card-top">
              <span className="resource-icon">
                <FileText size={19} />
              </span>
            </div>
            {section !== "DRAFT" && (
              <span className="form-version-label">
                Version {form.versionNumber}
              </span>
            )}
            <StatusBadge status={form.status} />
            <h2>{form.name}</h2>
            <p>{form.description}</p>
            <div className="resource-meta">
              <span>
                <GitBranch size={14} /> {form.workflow}
              </span>
              <span>{form.fields} fields</span>
            </div>
            <Link
              to={
                form.editable
                  ? `/forms/${form.id}`
                  : `/forms/${form.id}?versionId=${form.versionId}`
              }
              className="card-link"
            >
              {form.editable ? "Edit form" : "View version"}{" "}
              <ChevronRight size={15} />
            </Link>
          </article>
        ))}
        {visibleForms.length === 0 && (
          <div className="empty-state">No forms in this section.</div>
        )}
      </div>
    </>
  );
}

export function FormEditor() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const versionId = new URLSearchParams(location.search).get("versionId");
  const readOnly = Boolean(versionId);
  const [name, setName] = useState("New request form");
  const [description, setDescription] = useState(
    "Collect the information needed to review this request.",
  );
  const [workflowId, setWorkflowId] = useState("");
  const [workflows, setWorkflows] = useState<{ id: string; name: string }[]>(
    [],
  );
  const [fields, setFields] = useState([
    {
      id: "field-business-purpose",
      label: "Business purpose",
      type: "text",
      required: true,
    },
    { id: "field-amount", label: "Amount", type: "number", required: true },
    { id: "field-receipt", label: "Receipt", type: "file", required: true },
    {
      id: "field-additional-notes",
      label: "Additional notes",
      type: "textarea",
      required: false,
    },
  ]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadEditor() {
      try {
        const workflowData = await apiFetch<{
          workflows: { id: string; name: string }[];
        }>("/api/workflows");
        setWorkflows(workflowData.workflows);

        if (id) {
          const formData = await apiFetch<{
            form: {
              name: string;
              description: string | null;
              workflowId: string | null;
              fields: {
                id?: string;
                label: string;
                type: string;
                required: boolean;
              }[];
            };
          }>(`/api/forms/${id}${versionId ? `?versionId=${versionId}` : ""}`);
          setName(formData.form.name);
          setDescription(formData.form.description ?? "");
          setWorkflowId(formData.form.workflowId ?? "");
          setFields(
            formData.form.fields.length > 0
              ? formData.form.fields.map((field, index) => ({
                  ...field,
                  id: field.id ?? `${id}-${versionId ?? "draft"}-${index}`,
                }))
              : [],
          );
        } else if (workflowData.workflows[0]) {
          setWorkflowId(workflowData.workflows[0].id);
        }
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load form editor data.",
        );
      }
    }

    loadEditor();
  }, [id, versionId]);

  function updateField(
    index: number,
    changes: Partial<(typeof fields)[number]>,
  ) {
    setFields((current) =>
      current.map((field, fieldIndex) =>
        fieldIndex === index ? { ...field, ...changes } : field,
      ),
    );
  }

  async function saveDraft() {
    setSaving(true);
    setError("");
    try {
      const response = await apiFetch<{ form?: { id: string } }>(
        id ? `/api/forms/${id}` : "/api/forms",
        {
          method: id ? "PATCH" : "POST",
          body: JSON.stringify({ name, description, workflowId, fields }),
        },
      );
      if (!id && response.form?.id) {
        navigate(`/forms/${response.form.id}`);
      }
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to save draft.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function publishForm() {
    setSaving(true);
    setError("");
    try {
      let formId = id;
      if (!formId) {
        const response = await apiFetch<{ form: { id: string } }>(
          "/api/forms",
          {
            method: "POST",
            body: JSON.stringify({ name, description, workflowId, fields }),
          },
        );
        formId = response.form.id;
      } else {
        await apiFetch(`/api/forms/${formId}`, {
          method: "PATCH",
          body: JSON.stringify({ name, description, workflowId, fields }),
        });
      }
      await apiFetch(`/api/forms/${formId}/publish`, { method: "POST" });
      navigate("/forms");
    } catch (publishError) {
      setError(
        publishError instanceof Error
          ? publishError.message
          : "Unable to publish form.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="FORM BUILDER"
        title={
          readOnly ? "View form version" : id ? "Edit form" : "Create form"
        }
        description="Configure the information requesters need to provide."
        action={
          !readOnly ? (
            <div className="header-actions">
              <Button variant="secondary" onClick={saveDraft} disabled={saving}>
                Save draft
              </Button>
              <Button icon={Check} onClick={publishForm} disabled={saving}>
                Publish form
              </Button>
            </div>
          ) : undefined
        }
      />
      <div className="editor-layout">
        <section className="panel editor-panel">
          <div className="panel-heading">
            <div>
              <h2>Form details</h2>
              <p>Give this form a clear identity.</p>
            </div>
          </div>
          <div className="form-grid">
            <Field label="Form name">
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                disabled={readOnly}
              />
            </Field>
            <Field label="Associated workflow">
              <select
                value={workflowId}
                onChange={(event) => setWorkflowId(event.target.value)}
                disabled={readOnly}
              >
                <option value="">Select a workflow</option>
                {workflows.map((workflow) => (
                  <option value={workflow.id} key={workflow.id}>
                    {workflow.name}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <Field label="Description">
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              disabled={readOnly}
              rows={3}
            />
          </Field>
          {error && <div className="error-banner">{error}</div>}
        </section>
        <section className="panel editor-panel">
          <div className="panel-heading">
            <div>
              <h2>Form fields</h2>
              <p>Arrange fields and set their behavior.</p>
            </div>
            {!readOnly && (
              <Button
                variant="secondary"
                icon={Plus}
                onClick={() =>
                  setFields([
                    ...fields,
                    {
                      id: `field-${Date.now()}`,
                      label: "New field",
                      type: "text",
                      required: false,
                    },
                  ])
                }
              >
                Add field
              </Button>
            )}
          </div>
          <div className="field-list">
            {fields.map((field, index) => (
              <div className="builder-field" key={field.id}>
                <span className="drag-handle">⋮⋮</span>
                <div className="builder-number">
                  {String(index + 1).padStart(2, "0")}
                </div>
                <div className="builder-details">
                  <input
                    value={field.label}
                    onChange={(event) =>
                      updateField(index, { label: event.target.value })
                    }
                    aria-label={`Field ${index + 1} name`}
                    disabled={readOnly}
                  />
                  <select
                    value={field.type}
                    onChange={(event) =>
                      updateField(index, { type: event.target.value })
                    }
                    aria-label={`Field ${index + 1} type`}
                    disabled={readOnly}
                  >
                    <option value="text">Short text</option>
                    <option value="textarea">Long text</option>
                    <option value="number">Number</option>
                    <option value="date">Date</option>
                    <option value="file">File</option>
                  </select>
                  <label className="field-required">
                    <input
                      type="checkbox"
                      checked={field.required}
                      onChange={(event) =>
                        updateField(index, { required: event.target.checked })
                      }
                      disabled={readOnly}
                    />{" "}
                    Required
                  </label>
                </div>
                {!readOnly && (
                  <button
                    className="icon-button field-delete"
                    type="button"
                    aria-label={`Delete ${field.label || `field ${index + 1}`}`}
                    title="Delete field"
                    onClick={() =>
                      setFields(
                        fields.filter((_, fieldIndex) => fieldIndex !== index),
                      )
                    }
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>
          {!readOnly && (
            <button
              className="add-field"
              onClick={() =>
                setFields([
                  ...fields,
                  {
                    id: `field-${Date.now()}`,
                    label: "New field",
                    type: "text",
                    required: false,
                  },
                ])
              }
            >
              <Plus size={16} /> Add another field
            </button>
          )}
        </section>
      </div>
    </>
  );
}
export function FillForm() {
  return (
    <>
      <PageHeader
        eyebrow="NEW REQUEST"
        title="Expense Reimbursement"
        description="Submit this form to start the Finance approval workflow."
        action={
          <Link to="/forms" className="back-link">
            <ArrowLeft size={15} /> Back to forms
          </Link>
        }
      />
      <div className="editor-layout">
        <section className="panel editor-panel">
          <div className="panel-heading">
            <div>
              <h2>Request information</h2>
              <p>Complete all required fields before submitting.</p>
            </div>
          </div>
          <div className="form-grid">
            <Field label="Business purpose">
              <input placeholder="What was this expense for?" />
            </Field>
            <Field label="Amount">
              <input type="number" placeholder="0.00" />
            </Field>
          </div>
          <Field label="Receipt">
            <input type="file" />
          </Field>
          <Field label="Additional notes">
            <textarea
              placeholder="Add context for the approvers (optional)."
              rows={4}
            />
          </Field>
          <div className="submit-row">
            <Button variant="secondary">Save draft</Button>
            <Button icon={Check}>Submit request</Button>
          </div>
        </section>
        <aside className="panel">
          <div className="panel-heading">
            <div>
              <h2>What happens next?</h2>
              <p>Your request follows this workflow.</p>
            </div>
          </div>
          <Progress />
        </aside>
      </div>
    </>
  );
}
