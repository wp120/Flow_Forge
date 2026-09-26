import {
  BrowserRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { AppShell } from "./layouts/AppShell";
import { Login, Register, ForgotPassword } from "./pages/AuthPages";
import { Dashboard } from "./pages/DashboardPage";
import { Forms, FormEditor, FormSubmissions, FillForm } from "./pages/FormsPages";
import { Workflows, WorkflowEditor } from "./pages/WorkflowPages";
import { Requests, RequestDetails, Approvals } from "./pages/RequestPages";
import {
  UsersPage,
  Notifications,
  SettingsPage,
} from "./pages/OrganizationPages";

function ProtectedRoute() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div className="auth-loading">Loading your workspace…</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

function PublicOnlyRoute() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div className="auth-loading">Loading…</div>;
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

function HomeRoute() {
  const { currentUser } = useAuth();
  return currentUser?.role === "ADMIN" ? <Dashboard /> : <Navigate to="/forms" replace />;
}

function AdminOnlyRoute() {
  const { currentUser } = useAuth();
  return currentUser?.role === "ADMIN" ? <Outlet /> : <Navigate to="/forms" replace />;
}

function RegularUserRoute() {
  const { currentUser } = useAuth();
  return currentUser?.role === "USER" ? <Outlet /> : <Navigate to="/forms" replace />;
}

function FormRoute() {
  const { currentUser } = useAuth();
  return currentUser?.role === "ADMIN" ? <FormEditor /> : <FormSubmissions />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route element={<PublicOnlyRoute />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route path="/" element={<HomeRoute />} />
          <Route path="/forms" element={<Forms />} />
          <Route element={<AdminOnlyRoute />}>
            <Route path="/forms/new" element={<FormEditor />} />
            <Route path="/workflows" element={<Workflows />} />
            <Route path="/workflows/new" element={<WorkflowEditor />} />
            <Route path="/workflows/:id" element={<WorkflowEditor />} />
            <Route path="/users" element={<UsersPage />} />
          </Route>
          <Route element={<RegularUserRoute />}>
            <Route path="/forms/:id/fill" element={<FillForm />} />
          </Route>
          <Route path="/forms/:id" element={<FormRoute />} />
          <Route path="/requests" element={<Requests />} />
          <Route path="/requests/:id" element={<RequestDetails />} />
          <Route path="/approvals" element={<Approvals />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
