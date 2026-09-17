import type { FormSummary, RequestSummary, WorkflowSummary } from "../types/workflow";

export const forms: FormSummary[] = [
  { id: "expense", name: "Expense Reimbursement", description: "Request repayment for approved business expenses.", status: "Active", workflow: "Finance approval", fields: 6 },
  { id: "leave", name: "Leave Request", description: "Plan time away and route it to the right approver.", status: "Active", workflow: "People manager review", fields: 4 },
  { id: "purchase", name: "Purchase Request", description: "Get approval for equipment, software, and services.", status: "Draft", workflow: "Procurement review", fields: 5 },
];

export const workflows: WorkflowSummary[] = [
  { id: "finance", name: "Finance approval", description: "Manager and finance review for spending requests.", status: "Active", form: "Expense Reimbursement", steps: 3 },
  { id: "people", name: "People manager review", description: "A lightweight manager review for planned leave.", status: "Active", form: "Leave Request", steps: 2 },
  { id: "procurement", name: "Procurement review", description: "Route purchasing decisions through the right team.", status: "Draft", form: "Purchase Request", steps: 4 },
];

export const requests: RequestSummary[] = [
  { id: "REQ-1048", form: "Expense Reimbursement", submittedBy: "Jordan Lee", date: "Sep 14, 2026", status: "Pending", step: "Finance review", amount: "$428.50" },
  { id: "REQ-1047", form: "Leave Request", submittedBy: "Priya Shah", date: "Sep 13, 2026", status: "Approved", step: "Complete", amount: "Oct 2 - 4" },
  { id: "REQ-1046", form: "Purchase Request", submittedBy: "Marcus Chen", date: "Sep 12, 2026", status: "Pending", step: "Manager review", amount: "$1,240.00" },
  { id: "REQ-1045", form: "Expense Reimbursement", submittedBy: "Elena Rossi", date: "Sep 10, 2026", status: "Rejected", step: "Complete", amount: "$86.20" },
];

export const notifications = [
  { title: "Approval needed: REQ-1048", body: "Jordan Lee submitted an expense reimbursement for your review.", time: "12 minutes ago", unread: true },
  { title: "Request approved", body: "Your Leave Request REQ-1047 was approved by Priya Shah.", time: "Yesterday", unread: true },
  { title: "New form published", body: "Purchase Request is now available to your organization.", time: "2 days ago", unread: false },
];
