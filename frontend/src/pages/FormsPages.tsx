import { useState } from "react";
import {
  ArrowLeft,
  Check,
  ChevronRight,
  FilePlus2,
  FileText,
  GitBranch,
  MoreHorizontal,
  Plus,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { Link } from "react-router-dom";
import { forms } from "../data/mockData";
import { Progress } from "../components/Progress";
import { Button, Field, PageHeader, StatusBadge } from "../components/ui";
export function Forms() {
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
      <div className="resource-grid">
        {forms.map((form) => (
          <article className="resource-card" key={form.id}>
            <div className="resource-card-top">
              <span className="resource-icon">
                <FileText size={19} />
              </span>
              <button className="icon-button">
                <MoreHorizontal size={18} />
              </button>
            </div>
            <StatusBadge status={form.status} />
            <h2>{form.name}</h2>
            <p>{form.description}</p>
            <div className="resource-meta">
              <span>
                <GitBranch size={14} /> {form.workflow}
              </span>
              <span>{form.fields} fields</span>
            </div>
            <Link to={`/forms/${form.id}`} className="card-link">
              Edit form <ChevronRight size={15} />
            </Link>
          </article>
        ))}
      </div>
    </>
  );
}

export function FormEditor() {
  const [fields, setFields] = useState([
    "Business purpose",
    "Amount",
    "Receipt",
    "Additional notes",
  ]);
  return (
    <>
      <PageHeader
        eyebrow="FORM BUILDER"
        title="Create form"
        description="Configure the information requesters need to provide."
        action={
          <div className="header-actions">
            <Button variant="secondary">Save draft</Button>
            <Button icon={Check}>Publish form</Button>
          </div>
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
              <input defaultValue="New request form" />
            </Field>
            <Field label="Associated workflow">
              <select>
                <option>Finance approval</option>
                <option>People manager review</option>
                <option>Procurement review</option>
              </select>
            </Field>
          </div>
          <Field label="Description">
            <textarea
              defaultValue="Collect the information needed to review this request."
              rows={3}
            />
          </Field>
        </section>
        <section className="panel editor-panel">
          <div className="panel-heading">
            <div>
              <h2>Form fields</h2>
              <p>Arrange fields and set their behavior.</p>
            </div>
            <Button variant="secondary" icon={Plus}>
              Add field
            </Button>
          </div>
          <div className="field-list">
            {fields.map((field, index) => (
              <div className="builder-field" key={`${field}-${index}`}>
                <span className="drag-handle">⋮⋮</span>
                <div className="builder-number">
                  {String(index + 1).padStart(2, "0")}
                </div>
                <div className="builder-details">
                  <strong>{field}</strong>
                  <small>
                    {index === 1
                      ? "Number · Required"
                      : "Short text · Required"}
                  </small>
                </div>
                <button className="icon-button">
                  <MoreHorizontal size={17} />
                </button>
              </div>
            ))}
          </div>
          <button
            className="add-field"
            onClick={() => setFields([...fields, "New field"])}
          >
            <Plus size={16} /> Add another field
          </button>
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
