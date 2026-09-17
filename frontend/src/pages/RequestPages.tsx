import {
  Bell,
  Check,
  ChevronRight,
  ClipboardList,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { requests } from "../data/mockData";
import { Progress } from "../components/Progress";
import { RequestTable } from "../components/RequestTable";
import { Button, PageHeader, StatusBadge } from "../components/ui";

export function Requests() {
  return (
    <>
      <PageHeader
        eyebrow="OPERATIONS"
        title="Requests"
        description="Track every submitted request and its current workflow state."
      />
      <div className="toolbar">
        <div className="search-field">
          <Search size={16} />
          <input placeholder="Search by ID, form, or submitter" />
        </div>
        <button className="button button-secondary">
          <SlidersHorizontal size={16} /> Filter
        </button>
      </div>
      <section className="panel">
        <RequestTable />
      </section>
    </>
  );
}

export function RequestDetails() {
  const approval = useLocation().pathname.includes("REQ-1048");
  return (
    <>
      <PageHeader
        eyebrow={approval ? "REVIEW REQUEST" : "REQUEST DETAILS"}
        title="REQ-1048"
        description="Expense Reimbursement · submitted Sep 14, 2026"
        action={
          approval ? (
            <div className="header-actions">
              <Button variant="danger" icon={X}>
                Reject
              </Button>
              <Button icon={Check}>Approve</Button>
            </div>
          ) : (
            <StatusBadge status="Pending" />
          )
        }
      />
      <div className="detail-layout">
        <div className="detail-main">
          <section className="panel">
            <div className="panel-heading">
              <div>
                <h2>Submitted request</h2>
                <p>Information provided by Jordan Lee</p>
              </div>
              <StatusBadge status="Pending" />
            </div>
            <div className="detail-fields">
              <div>
                <small>Requestor</small>
                <strong>Jordan Lee</strong>
              </div>
              <div>
                <small>Submitted</small>
                <strong>Sep 14, 2026 at 10:42 AM</strong>
              </div>
              <div>
                <small>Business purpose</small>
                <strong>Client workshop travel</strong>
              </div>
              <div>
                <small>Amount</small>
                <strong>$428.50 USD</strong>
              </div>
              <div className="detail-wide">
                <small>Additional notes</small>
                <strong>
                  Travel costs for the Northstar client workshop in Chicago.
                </strong>
              </div>
            </div>
          </section>
          <section className="panel">
            <div className="panel-heading">
              <div>
                <h2>Approval history</h2>
                <p>Every decision is recorded here.</p>
              </div>
            </div>
            <div className="history">
              <div>
                <span className="history-icon success">
                  <Check size={15} />
                </span>
                <div>
                  <strong>Request submitted</strong>
                  <p>Jordan Lee submitted this request.</p>
                </div>
                <small>Sep 14</small>
              </div>
              <div>
                <span className="history-icon success">
                  <Check size={15} />
                </span>
                <div>
                  <strong>Manager review approved</strong>
                  <p>Priya Shah approved this request.</p>
                </div>
                <small>Sep 15</small>
              </div>
              <div>
                <span className="history-icon pending">
                  <Bell size={15} />
                </span>
                <div>
                  <strong>Finance review pending</strong>
                  <p>Awaiting a decision from the finance team.</p>
                </div>
                <small>Now</small>
              </div>
            </div>
          </section>
        </div>
        <aside className="detail-side">
          <section className="panel">
            <div className="panel-heading">
              <div>
                <h2>Workflow progress</h2>
                <p>Finance approval · 2 of 3 complete</p>
              </div>
            </div>
            <Progress approval={approval} />
          </section>
          <section className="panel">
            <div className="panel-heading">
              <div>
                <h2>Request metadata</h2>
              </div>
            </div>
            <div className="metadata">
              <span>Form</span>
              <strong>Expense Reimbursement</strong>
              <span>Workflow</span>
              <strong>Finance approval</strong>
              <span>Current approver</span>
              <strong>Finance team</strong>
            </div>
          </section>
        </aside>
      </div>
    </>
  );
}

export function Approvals() {
  return (
    <>
      <PageHeader
        eyebrow="YOUR WORK QUEUE"
        title="Approvals"
        description="Requests waiting for your decision."
      />
      <div className="approval-banner">
        <div className="approval-banner-icon">
          <ShieldCheck size={22} />
        </div>
        <div>
          <strong>2 requests need your attention</strong>
          <p>Review requests to keep work moving for your team.</p>
        </div>
      </div>
      <div className="approval-list">
        {requests.slice(0, 2).map((request) => (
          <Link
            to={`/requests/${request.id}`}
            className="approval-card"
            key={request.id}
          >
            <div className="approval-card-icon">
              <ClipboardList size={19} />
            </div>
            <div className="approval-card-body">
              <div>
                <span className="eyebrow">{request.id}</span>
                <StatusBadge status={request.status} />
              </div>
              <h2>{request.form}</h2>
              <p>
                Submitted by {request.submittedBy} · {request.date}
              </p>
            </div>
            <div className="approval-card-action">
              Review <ChevronRight size={16} />
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
