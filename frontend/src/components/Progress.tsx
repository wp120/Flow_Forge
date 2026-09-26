import { Bell, Check, Minus, X } from "lucide-react";

type WorkflowProgressStep = {
  id: string;
  name: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "SKIPPED" | "UPCOMING";
  actedBy: string | null;
  actedAt: string | null;
};

export function Progress({
  approval = false,
  steps,
  currentStepId,
  submissionStatus,
  submittedAt,
  submittedBy,
}: {
  approval?: boolean;
  steps: WorkflowProgressStep[];
  currentStepId: string | null;
  submissionStatus: "PENDING" | "APPROVED" | "REJECTED";
  submittedAt: string;
  submittedBy: string;
}) {
  const rows = [
    {
      id: "submitted",
      name: "Submitted",
      status: "APPROVED" as const,
      detail: `${new Date(submittedAt).toLocaleString()} · ${submittedBy}`,
    },
    ...steps.map((step) => ({
      ...step,
      detail: step.actedBy
        ? `${step.actedAt ? `${new Date(step.actedAt).toLocaleString()} · ` : ""}${step.actedBy}`
        : step.id === currentStepId
          ? approval ? "Your approval is needed" : "Awaiting approval"
          : step.status === "SKIPPED" ? "Skipped" : "Upcoming",
    })),
    ...(submissionStatus === "APPROVED" || submissionStatus === "REJECTED"
      ? [{
          id: "outcome",
          name: submissionStatus === "APPROVED" ? "Complete" : "Rejected",
          status: submissionStatus,
          detail: "Workflow finished",
        }]
      : []),
  ];

  return (
    <div className="timeline">
      {rows.map((step) => {
          const done = step.status === "APPROVED";
          const current = step.id === currentStepId && submissionStatus === "PENDING";
          const rejected = step.status === "REJECTED";
          const skipped = step.status === "SKIPPED" || step.status === "UPCOMING";
          return (
            <div
              className={`timeline-item ${done ? "done" : ""} ${current ? "current" : ""} ${rejected ? "rejected" : ""} ${skipped ? "skipped" : ""}`}
              key={step.id}
            >
              <span className="timeline-marker">
                {done ? <Check size={13} /> : rejected ? <X size={13} /> : skipped ? <Minus size={13} /> : current ? <Bell size={13} /> : ""}
              </span>
              <div>
                <strong>{step.name}</strong>
                <small>{step.detail}</small>
              </div>
            </div>
          );
        })}
    </div>
  );
}
