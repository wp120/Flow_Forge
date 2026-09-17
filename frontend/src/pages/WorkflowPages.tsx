import { useState } from "react";
import { Check, ChevronRight, MoreHorizontal, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { workflows } from "../data/mockData";
import { Button, Field, PageHeader, StatusBadge } from "../components/ui";

export function Workflows() {
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
  const [steps, setSteps] = useState(["Team manager", "Finance partner"]);
  return (
    <>
      <PageHeader
        eyebrow="WORKFLOW BUILDER"
        title="Create workflow"
        description="Set the people and sequence that decide a request."
        action={
          <div className="header-actions">
            <Button variant="secondary">Save draft</Button>
            <Button icon={Check}>Publish workflow</Button>
          </div>
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
            <input defaultValue="New approval workflow" />
          </Field>
          <Field label="Description">
            <textarea
              defaultValue="Route submitted requests through the appropriate reviewers."
              rows={3}
            />
          </Field>
          <Field label="Form this workflow serves">
            <select>
              <option>Expense Reimbursement</option>
              <option>Leave Request</option>
              <option>Purchase Request</option>
            </select>
          </Field>
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
              onClick={() => setSteps([...steps, "New approver"])}
            >
              Add step
            </Button>
          </div>
          <div className="step-list">
            {steps.map((step, index) => (
              <div className="workflow-step" key={`${step}-${index}`}>
                <div className="step-index">{index + 1}</div>
                <div className="step-line" />
                <div className="step-content">
                  <span className="eyebrow">STEP {index + 1}</span>
                  <strong>{step}</strong>
                  <select>
                    <option>{step}</option>
                    <option>Alex Morgan · Admin</option>
                    <option>Finance team</option>
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
