import { Check } from "lucide-react";

export function Progress({ approval = false }: { approval?: boolean }) {
  return (
    <div className="timeline">
      {["Submitted", "Manager review", "Finance review", "Complete"].map(
        (step, index) => {
          const done = index < 2;
          const current = index === 2;
          return (
            <div
              className={`timeline-item ${done ? "done" : ""} ${current ? "current" : ""}`}
              key={step}
            >
              <span className="timeline-marker">
                {done ? <Check size={13} /> : index + 1}
              </span>
              <div>
                <strong>{step}</strong>
                <small>
                  {done
                    ? index === 0
                      ? "Sep 14, 2026 · Jordan Lee"
                      : "Sep 15, 2026 · Priya Shah"
                    : current
                      ? approval
                        ? "Your approval is needed"
                        : "Pending assignment"
                      : "Upcoming"}
                </small>
              </div>
            </div>
          );
        },
      )}
    </div>
  );
}
