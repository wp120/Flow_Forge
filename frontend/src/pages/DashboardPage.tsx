import {
  ClipboardList,
  ChevronRight,
  Plus,
  SlidersHorizontal,
} from "lucide-react";
import { Link } from "react-router-dom";
import { requests } from "../data/mockData";
import { RequestTable } from "../components/RequestTable";
import { Button, PageHeader } from "../components/ui";

export function Dashboard() {
  return (
    <>
      <PageHeader
        eyebrow="MONDAY, SEPTEMBER 16, 2026"
        title="Good morning, Alex"
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
          <RequestTable rows={requests.slice(0, 3)} />
        </section>
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>Needs your attention</h2>
              <p>Requests waiting for review</p>
            </div>
          </div>
          <div className="attention-list">
            {requests.slice(0, 2).map((request) => (
              <Link
                to={`/requests/${request.id}`}
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
          </div>
          <Link to="/approvals" className="button button-secondary full-width">
            Open approval queue
          </Link>
        </section>
      </div>
    </>
  );
}
