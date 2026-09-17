import type { ReactNode } from "react";
import type { Icon, Status } from "../types/workflow";

export function StatusBadge({ status }: { status: Status | string }) {
  return (
    <span className={`badge badge-${status.toLowerCase()}`}>
      <span className="badge-dot" />
      {status}
    </span>
  );
}

export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
      {hint && <small>{hint}</small>}
    </label>
  );
}

export function Button({
  children,
  variant = "primary",
  icon: Icon,
  type = "button",
  onClick,
}: {
  children: ReactNode;
  variant?: string;
  icon?: Icon;
  type?: "button" | "submit";
  onClick?: () => void;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      className={`button button-${variant}`}
    >
      {Icon && <Icon size={16} />}
      {children}
    </button>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="page-header">
      <div>
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {action}
    </div>
  );
}
