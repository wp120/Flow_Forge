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
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Progress } from "../components/Progress";
import { RequestTable } from "../components/RequestTable";
import { Button, PageHeader, StatusBadge } from "../components/ui";
import { apiFetch } from "../lib/api";
import { useAuth } from "../contexts/AuthContext";

type Pagination = { page: number; pageSize: number; total: number; totalPages: number };

function PageControls({ pagination, onPageChange }: { pagination: Pagination; onPageChange: (page: number) => void }) {
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

export function Requests() {
  const { currentUser } = useAuth();
  const [requests, setRequests] = useState<any[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, pageSize: 10, total: 0, totalPages: 0 });
  const regularUser = currentUser?.role === "USER";

  useEffect(() => {
    async function loadRequests() {
      try {
        const data = await apiFetch<{ requests: any[]; pagination?: Pagination }>(
          regularUser ? `/api/my-submissions?page=${pagination.page}&pageSize=${pagination.pageSize}` : "/api/requests",
        );
        setRequests(data.requests);
        if (data.pagination) setPagination(data.pagination);
      } catch {
        setRequests([]);
      }
    }

    loadRequests();
  }, [regularUser, pagination.page, pagination.pageSize]);

  return (
    <>
      <PageHeader
        eyebrow="OPERATIONS"
        title={regularUser ? "My Submissions" : "Requests"}
        description={regularUser ? "Track submissions you have sent for approval." : "Track every submitted request and its current workflow state."}
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
      {regularUser && <PageControls pagination={pagination} onPageChange={(page) => setPagination((current) => ({ ...current, page }))} />}
    </>
  );
}

export function RequestDetails() {
  const [searchParams] = useSearchParams();
  const approval = searchParams.get("approval") === "1";
  const { id } = useParams();
  const navigate = useNavigate();
  const [request, setRequest] = useState<any | null>(null);
  const [decisionPending, setDecisionPending] = useState(false);
  const [decisionError, setDecisionError] = useState("");

  useEffect(() => {
    if (id) {
      apiFetch<{ request: any }>(`/api/requests/${id}`)
        .then((data) => setRequest(data.request))
        .catch(() => setRequest(null));
    }
  }, [id]);

  async function decide(decision: "APPROVED" | "REJECTED") {
    if (!id) return;
    setDecisionPending(true);
    setDecisionError("");
    try {
      await apiFetch(`/api/approvals/${id}/decision`, {
        method: "POST",
        body: JSON.stringify({ decision }),
      });
      navigate("/approvals");
    } catch (error) {
      setDecisionError(error instanceof Error ? error.message : "Unable to record your decision.");
    } finally {
      setDecisionPending(false);
    }
  }

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
              <Button variant="danger" icon={X} onClick={() => decide("REJECTED")} disabled={decisionPending}>
                Reject
              </Button>
              <Button icon={Check} onClick={() => decide("APPROVED")} disabled={decisionPending}>Approve</Button>
            </div>
          ) : (
            <StatusBadge status={request.status} />
          )
        }
      />
      {decisionError && <div className="error-banner">{decisionError}</div>}
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
              {request.steps.map((step: any) => {
                const rejected = step.status === "REJECTED";
                const approved = step.status === "APPROVED";
                const skipped = step.status === "SKIPPED";
                const upcoming = step.status === "UPCOMING";
                return (
                <div key={step.id}>
                  <span className={`history-icon ${approved ? "success" : rejected ? "rejected" : skipped || upcoming ? "skipped" : "pending"}`}>
                    {approved ? <Check size={15} /> : rejected ? <X size={15} /> : skipped || upcoming ? <ChevronRight size={15} /> : <Bell size={15} />}
                  </span>
                  <div>
                    <strong>{step.name}</strong>
                    <p>{step.actedBy ? `Acted by ${step.actedBy}${step.actedAt ? ` · ${new Date(step.actedAt).toLocaleString()}` : ""}` : `Status: ${upcoming ? "upcoming" : step.status.toLowerCase()}`}</p>
                    {step.comment && <p>{step.comment}</p>}
                  </div>
                </div>
                );
              })}
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
            <Progress
              approval={approval}
              steps={request.steps}
              currentStepId={request.currentStepId}
              submissionStatus={request.status}
              submittedAt={request.date}
              submittedBy={request.submittedBy}
            />
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
  const [pagination, setPagination] = useState<Pagination>({ page: 1, pageSize: 10, total: 0, totalPages: 0 });

  useEffect(() => {
    async function loadApprovals() {
      try {
        const data = await apiFetch<{ approvals: any[]; pagination?: Pagination }>(`/api/approvals?page=${pagination.page}&pageSize=${pagination.pageSize}`);
        setApprovals(data.approvals);
        if (data.pagination) setPagination(data.pagination);
      } catch {
        setApprovals([]);
      }
    }

    loadApprovals();
  }, [pagination.page, pagination.pageSize]);

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
          <strong>{pagination.total} {pagination.total === 1 ? "request needs" : "requests need"} your attention</strong>
          <p>Review requests to keep work moving for your team.</p>
        </div>
      </div>
      <div className="approval-list">
        {approvals.map((request) => (
          <Link
            to={`/requests/${request.id}?approval=1`}
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
        {approvals.length === 0 && <div className="empty-state">No submissions are currently assigned to you for approval.</div>}
      </div>
      <PageControls pagination={pagination} onPageChange={(page) => setPagination((current) => ({ ...current, page }))} />
    </>
  );
}
