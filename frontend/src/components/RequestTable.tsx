import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { requests } from "../data/mockData";
import type { RequestSummary } from "../types/workflow";
import { StatusBadge } from "./ui";

export function RequestTable({ rows = requests }: { rows?: RequestSummary[] }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Request</th>
            <th>Submitted by</th>
            <th>Date</th>
            <th>Status</th>
            <th>Current step</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {rows.map((request) => (
            <tr key={request.id}>
              <td>
                <Link to={`/requests/${request.id}`} className="table-primary">
                  {request.id}
                </Link>
                <small>{request.form}</small>
              </td>
              <td>{request.submittedBy}</td>
              <td>{request.date}</td>
              <td>
                <StatusBadge status={request.status} />
              </td>
              <td>{request.step}</td>
              <td>
                <Link to={`/requests/${request.id}`} className="icon-button">
                  <ChevronRight size={16} />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
