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
import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { Progress } from "../components/Progress";
import { RequestTable } from "../components/RequestTable";
import { Button, PageHeader, StatusBadge } from "../components/ui";
import { apiFetch } from "../lib/api";

export function Requests() {
  const [requests, setRequests] = useState<any[]>([]);

  useEffect(() => {
    async function loadRequests() {
      try {
        const data = await apiFetch<{ requests: any[] }>("/api/requests");
        setRequests(data.requests);
      } catch {
        setRequests([]);
      }
    }

    loadRequests();
  }, []);

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
        <RequestTable rows={requests} />
      </section>
    </>
  );
}

export function RequestDetails() {
  const approval = useLocation().pathname.includes("approvals");
  const { id } = useParams();
  const [request, setRequest] = useState<any | null>(null);

  useEffect(() => {
    if (id) {
      apiFetch<{ request: any }>(`/api/requests/${id}`)
        .then((data) => setRequest(data.request))
        .catch(() => setRequest(null));
    }
  }, [id]);

  if (!request) {
    return <PageHeader eyebrow="REQUEST DETAILS" title="Request not found" description="This request may no longer be available." />;
  }

  return (
    <>
      <PageHeader
        eyebrow={approval ? "REVIEW REQUEST" : "REQUEST DETAILS"}
        title={request.id}
        description={`${request.form} · submitted ${new Date(request.date).toLocaleString()}`}
        action={
          approval ? (
            <div className="header-actions">
              <Button variant="danger" icon={X}>
                Reject
              </Button>
              <Button icon={Check}>Approve</Button>
            </div>
          ) : (
            <StatusBadge status={request.status} />
          )
        }
      />
      <div className="detail-layout">
        <div className="detail-main">
          <section className="panel">
            <div className="panel-heading">
              <div>
                <h2>Submitted request</h2>
                <p>Information provided by {request.submittedBy}</p>
              </div>
              <StatusBadge status={request.status} />
            </div>
            <div className="detail-fields">
              <div>
                <small>Requestor</small>
                <strong>{request.submittedBy}</strong>
              </div>
              <div>
                <small>Submitted</small>
                <strong>{new Date(request.date).toLocaleString()}</strong>
              </div>
              {Object.entries(request.data ?? {}).map(([key, value]) => (
                <div key={key}>
                  <small>{key}</small>
                  <strong>{String(value)}</strong>
                </div>
              ))}
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
              {request.steps.map((step: any) => (
                <div key={step.id}>
                  <span className={`history-icon ${step.status === "APPROVED" ? "success" : "pending"}`}>
                    {step.status === "APPROVED" ? <Check size={15} /> : <Bell size={15} />}
                  </span>
                  <div>
                    <strong>{step.name}</strong>
                    <p>{step.actedBy ? `Acted by ${step.actedBy}` : `Status: ${step.status.toLowerCase()}`}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
        <aside className="detail-side">
          <section className="panel">
            <div className="panel-heading">
              <div>
                <h2>Workflow progress</h2>
                <p>{request.workflow}</p>
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
              <strong>{request.form}</strong>
              <span>Workflow</span>
              <strong>{request.workflow}</strong>
              <span>Current approver</span>
              <strong>{request.step}</strong>
            </div>
          </section>
        </aside>
      </div>
    </>
  );
}

export function Approvals() {
  const [approvals, setApprovals] = useState<any[]>([]);

  useEffect(() => {
    async function loadApprovals() {
      try {
        const data = await apiFetch<{ approvals: any[] }>("/api/approvals");
        setApprovals(data.approvals);
      } catch {
        setApprovals([]);
      }
    }

    loadApprovals();
  }, []);

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
        {approvals.slice(0, 2).map((request) => (
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
