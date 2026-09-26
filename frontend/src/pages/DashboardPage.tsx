import {
  ClipboardList,
  ChevronRight,
  Plus,
  SlidersHorizontal,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { RequestTable } from "../components/RequestTable";
import { Button, PageHeader } from "../components/ui";
import { useAuth } from "../contexts/AuthContext";
import { apiFetch } from "../lib/api";
import type { RequestSummary } from "../types/workflow";

export function Dashboard() {
  const { currentUser } = useAuth();
  const [requests, setRequests] = useState<RequestSummary[]>([]);
  const [approvals, setApprovals] = useState<RequestSummary[]>([]);

  useEffect(() => {
    async function loadRequests() {
      try {
        const data = await apiFetch<{ requests: RequestSummary[] }>(
          "/api/requests",
        );
        setRequests(data.requests.slice(0, 3));
      } catch {
        setRequests([]);
      }
    }

    async function loadApprovals() {
      try {
        const data = await apiFetch<{ approvals: RequestSummary[] }>("/api/approvals?page=1&pageSize=2");
        setApprovals(data.approvals);
      } catch {
        setApprovals([]);
      }
    }

    loadRequests();
    loadApprovals();
  }, []);

  return (
    <>
      <PageHeader
        eyebrow="MONDAY, SEPTEMBER 16, 2026"
        title={`Good morning, ${currentUser?.name}`}
        description="Here’s what is moving through Northstar Studio today."
        action={<Button icon={Plus}>New request</Button>}
      />
      <div className="metric-grid">
        {[
          ["Total requests", "128", "+12%", "this month"],
          ["Pending approvals", "08", "4", "need your attention"],
          ["Approved requests", "94", "+18%", "this month"],
          ["Rejected requests", "06", "2", "this month"],
        ].map(([label, value, delta, note]) => (
          <div className="metric" key={label}>
            <div className="metric-top">
              <span>{label}</span>
              <SlidersHorizontal size={16} />
            </div>
            <strong>{value}</strong>
            <small>
              <b className={delta.startsWith("+") ? "positive" : "neutral"}>
                {delta}
              </b>{" "}
              {note}
            </small>
          </div>
        ))}
      </div>
      <div className="content-grid">
        <section className="panel panel-wide">
          <div className="panel-heading">
            <div>
              <h2>Recent requests</h2>
              <p>Activity across your organization</p>
            </div>
            <Link to="/requests" className="text-link">
              View all <ChevronRight size={15} />
            </Link>
          </div>
          <RequestTable rows={requests} />
        </section>
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>Needs your attention</h2>
              <p>Requests waiting for review</p>
            </div>
          </div>
          <div className="attention-list">
            {approvals.map((request) => (
              <Link
                to={`/requests/${request.id}?approval=1`}
                className="attention-item"
                key={request.id}
              >
                <span className="attention-icon">
                  <ClipboardList size={16} />
                </span>
                <div>
                  <strong>{request.id}</strong>
                  <p>{request.form}</p>
                  <small>{request.step}</small>
                </div>
                <ChevronRight size={15} />
              </Link>
            ))}
            {approvals.length === 0 && <p className="attention-empty">No approvals currently require your attention.</p>}
          </div>
          <Link to="/approvals" className="button button-secondary full-width">
            Open approval queue
          </Link>
        </section>
      </div>
    </>
  );
}
