import type { LucideIcon } from "lucide-react";

export type Status = "Pending" | "Approved" | "Rejected" | "Draft" | "Active";
export type Role = "admin" | "member";
export type Icon = LucideIcon;

export type FormSummary = {
  id: string;
  name: string;
  description: string;
  status: Status;
  workflow: string;
  fields: number;
};

export type WorkflowSummary = {
  id: string;
  name: string;
  description: string;
  status: Status;
  form: string;
  steps: number;
};

export type RequestSummary = {
  id: string;
  form: string;
  submittedBy: string;
  date: string;
  status: Status;
  step: string;
  amount: string;
};
