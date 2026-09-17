import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./layouts/AppShell";
import { Login, Register, ForgotPassword } from "./pages/AuthPages";
import { Dashboard } from "./pages/DashboardPage";
import { Forms, FormEditor, FillForm } from "./pages/FormsPages";
import { Workflows, WorkflowEditor } from "./pages/WorkflowPages";
import { Requests, RequestDetails, Approvals } from "./pages/RequestPages";
import {
  UsersPage,
  Notifications,
  SettingsPage,
} from "./pages/OrganizationPages";

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route element={<AppShell />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/forms" element={<Forms />} />
        <Route path="/forms/new" element={<FormEditor />} />
        <Route path="/forms/:id/fill" element={<FillForm />} />
        <Route path="/forms/:id" element={<FormEditor />} />
        <Route path="/workflows" element={<Workflows />} />
        <Route path="/workflows/new" element={<WorkflowEditor />} />
        <Route path="/workflows/:id" element={<WorkflowEditor />} />
        <Route path="/requests" element={<Requests />} />
        <Route path="/requests/:id" element={<RequestDetails />} />
        <Route path="/users" element={<UsersPage />} />
        <Route path="/approvals" element={<Approvals />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;
