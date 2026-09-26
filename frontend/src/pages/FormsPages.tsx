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
import { Button, Field, PageHeader, StatusBadge } from "../components/ui";
import { useAuth } from "../contexts/AuthContext";
import { apiFetch } from "../lib/api";

type Pagination = { page: number; pageSize: number; total: number; totalPages: number };

function PaginationControls({ pagination, onPageChange }: { pagination: Pagination; onPageChange: (page: number) => void }) {
  if (pagination.totalPages <= 1) return null;

  return (
    <div className="pagination-controls">
      <span>{pagination.total} total</span>
      <div>
        <Button variant="secondary" disabled={pagination.page <= 1} onClick={() => onPageChange(pagination.page - 1)}>Previous</Button>
        <span>Page {pagination.page} of {pagination.totalPages}</span>
        <Button variant="secondary" disabled={pagination.page >= pagination.totalPages} onClick={() => onPageChange(pagination.page + 1)}>Next</Button>
      </div>
    </div>
  );
}

export function Forms() {
  const { currentUser } = useAuth();
  if (currentUser?.role === "USER") return <UserForms />;

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

function UserForms() {
  const [forms, setForms] = useState<any[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, pageSize: 10, total: 0, totalPages: 0 });

  useEffect(() => {
    apiFetch<{ forms: any[]; pagination: Pagination }>(`/api/user/forms?page=${pagination.page}&pageSize=${pagination.pageSize}`)
      .then((data) => {
        setForms(data.forms);
        setPagination(data.pagination);
      })
      .catch(() => setForms([]));
  }, [pagination.page, pagination.pageSize]);

  return (
    <>
      <PageHeader eyebrow="AVAILABLE FORMS" title="Forms" description="Choose a published form to start a submission or view your previous submissions." />
      <div className="resource-grid">
        {forms.map((form) => (
          <article className="resource-card" key={form.id}>
            <span className="resource-icon"><FileText size={19} /></span>
            <span className="form-version-label">Version {form.versionNumber}</span>
            <h2>{form.name}</h2>
            <p>{form.description}</p>
            <div className="resource-meta">
              <span><GitBranch size={14} /> {form.workflow}</span>
              <span>{form.fields} fields</span>
            </div>
            <Link to={`/forms/${form.id}`} className="card-link">Open form <ChevronRight size={15} /></Link>
          </article>
        ))}
        {forms.length === 0 && <div className="empty-state">No published forms are currently available.</div>}
      </div>
      <PaginationControls pagination={pagination} onPageChange={(page) => setPagination((current) => ({ ...current, page }))} />
    </>
  );
}

export function FormSubmissions() {
  const { id } = useParams();
  const [form, setForm] = useState<{ name: string } | null>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, pageSize: 10, total: 0, totalPages: 0 });

  useEffect(() => {
    if (!id) return;
    apiFetch<{ form: { name: string }; submissions: any[]; pagination: Pagination }>(`/api/user/forms/${id}/submissions?page=${pagination.page}&pageSize=${pagination.pageSize}`)
      .then((data) => {
        setForm(data.form);
        setSubmissions(data.submissions);
        setPagination(data.pagination);
      })
      .catch(() => {
        setForm(null);
        setSubmissions([]);
      });
  }, [id, pagination.page, pagination.pageSize]);

  return (
    <>
      <PageHeader
        eyebrow="FORM SUBMISSIONS"
        title={form?.name ?? "Form submissions"}
        description="Your past and current submissions for this form."
        action={id ? <Link to={`/forms/${id}/fill`} className="button button-primary"><Plus size={16} /> New submission</Link> : undefined}
      />
      <section className="panel"><div className="table-wrap"><table>
        <thead><tr><th>Submission ID</th><th>Status</th><th>Submitted</th><th>Current workflow step</th><th /></tr></thead>
        <tbody>
          {submissions.length === 0 ? <tr><td colSpan={5}>No submissions for this form yet.</td></tr> : submissions.map((submission) => (
            <tr key={submission.id}>
              <td><Link to={`/requests/${submission.id}`} className="table-primary">{submission.id}</Link></td>
              <td><StatusBadge status={submission.status} /></td>
              <td>{new Date(submission.date).toLocaleString()}</td>
              <td>{submission.step}</td>
              <td><Link to={`/requests/${submission.id}`} className="icon-button" aria-label="View submission"><ChevronRight size={16} /></Link></td>
            </tr>
          ))}
        </tbody>
      </table></div></section>
      <PaginationControls pagination={pagination} onPageChange={(page) => setPagination((current) => ({ ...current, page }))} />
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
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState<any | null>(null);
  const [values, setValues] = useState<Record<string, unknown>>({});
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;
    apiFetch<{ form: any }>(`/api/user/forms/${id}`)
      .then((data) => setForm(data.form))
      .catch(() => setForm(null));
  }, [id]);

  async function submitForm(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!id) return;

    setSubmitting(true);
    setError("");
    try {
      const result = await apiFetch<{ submission: { id: string } }>("/api/requests", {
        method: "POST",
        body: JSON.stringify({ formId: id, dataJson: values }),
      });
      navigate(`/requests/${result.submission.id}`);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to submit this form.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!form) {
    return <PageHeader eyebrow="NEW SUBMISSION" title="Form unavailable" description="This form may no longer be published." />;
  }

  return (
    <>
      <PageHeader
        eyebrow="NEW REQUEST"
        title={form.name}
        description={form.description ?? `Submit to start the ${form.workflow} workflow.`}
        action={
          <Link to="/forms" className="back-link">
            <ArrowLeft size={15} /> Back to forms
          </Link>
        }
      />
      <div className="editor-layout">
        <form className="panel editor-panel" onSubmit={submitForm}>
          <div className="panel-heading">
            <div>
              <h2>Request information</h2>
              <p>Complete the fields below before submitting.</p>
            </div>
          </div>
          {form.fields.map((field: { id?: string; label: string; type: string; required: boolean }, index: number) => {
            const key = field.id ?? field.label;
            const inputId = `submission-field-${index}`;
            const updateValue = (value: unknown) => setValues((current) => ({ ...current, [field.label]: value }));
            return (
              <Field label={field.label} key={key}>
                {field.type === "textarea" ? (
                  <textarea id={inputId} required={field.required} rows={4} value={String(values[field.label] ?? "")} onChange={(event) => updateValue(event.target.value)} />
                ) : field.type === "file" ? (
                  <input id={inputId} type="file" required={field.required} onChange={(event) => updateValue(event.target.files?.[0]?.name ?? "")} />
                ) : (
                  <input id={inputId} type={field.type === "number" || field.type === "date" ? field.type : "text"} required={field.required} value={String(values[field.label] ?? "")} onChange={(event) => updateValue(event.target.value)} />
                )}
              </Field>
            );
          })}
          {error && <div className="error-banner">{error}</div>}
          <div className="submit-row">
            <Button type="submit" icon={Check} disabled={submitting}>{submitting ? "Submitting..." : "Submit request"}</Button>
          </div>
        </form>
        <aside className="panel">
          <div className="panel-heading">
            <div>
              <h2>What happens next?</h2>
              <p>Your submission will follow this workflow.</p>
            </div>
          </div>
          <div className="history">
            <div>
              <span className="history-icon pending"><GitBranch size={15} /></span>
              <div>
                <strong>{form.workflow}</strong>
                <p>Approval steps begin after submission.</p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}
