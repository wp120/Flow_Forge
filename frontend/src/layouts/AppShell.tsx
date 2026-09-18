import { useState } from "react";
import { Bell, ChevronRight, LogOut, Menu, Settings, X } from "lucide-react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Logo } from "./AuthLayout";
import type { Icon } from "../types/workflow";
import {
  LayoutDashboard,
  FileText,
  ClipboardList,
  ShieldCheck,
  GitBranch,
  Users,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

const navItems: { label: string; to: string; icon: Icon; roles?: ("ADMIN" | "USER")[] }[] = [
  { label: "Overview", to: "/", icon: LayoutDashboard },
  { label: "Forms", to: "/forms", icon: FileText },
  { label: "Requests", to: "/requests", icon: ClipboardList },
  { label: "Approvals", to: "/approvals", icon: ShieldCheck },
  { label: "Workflows", to: "/workflows", icon: GitBranch, roles: ["ADMIN"] },
  { label: "Users", to: "/users", icon: Users, roles: ["ADMIN"] },
];

export function AppShell() {
  const { currentUser, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const role = currentUser?.role ?? "USER";
  const items = navItems.filter(
    (item) => !item.roles || item.roles.includes(role),
  );

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  return (
    <div className="app-shell">
      <aside className={`sidebar ${open ? "sidebar-open" : ""}`}>
        <div className="sidebar-top">
          <Logo />
          <button
            className="icon-button mobile-only"
            onClick={() => setOpen(false)}
          >
            <X size={18} />
          </button>
        </div>
        <div className="workspace-switch">
          <span className="workspace-avatar">N</span>
          <div>
            <strong>{currentUser?.companyId ? "Company workspace" : "FlowForge"}</strong>
            <small>{currentUser?.email ?? "Authenticated user"}</small>
          </div>
          <ChevronRight size={15} />
        </div>
        <nav>
          {items.map(({ label, to, icon: ItemIcon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                `nav-item ${isActive ? "active" : ""}`
              }
              onClick={() => setOpen(false)}
            >
              <ItemIcon size={17} />
              <span>{label}</span>
              {label === "Approvals" && <span className="nav-count">2</span>}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <NavLink to="/notifications" className="nav-item">
            <Bell size={17} />
            <span>Notifications</span>
            <span className="notification-dot" />
          </NavLink>
          <NavLink to="/settings" className="nav-item">
            <Settings size={17} />
            <span>Settings</span>
          </NavLink>
        </div>
      </aside>
      <div className="shell-content">
        <header className="topbar">
          <button
            className="icon-button mobile-only"
            onClick={() => setOpen(true)}
          >
            <Menu size={19} />
          </button>
          <div className="breadcrumbs">
            {location.pathname === "/"
              ? "Overview"
              : location.pathname
                  .split("/")
                  .filter(Boolean)
                  .map((part) => part[0].toUpperCase() + part.slice(1))
                  .join(" / ")}
          </div>
          <div className="topbar-actions">
            <Link
              className="icon-button"
              aria-label="Notifications"
              to="/notifications"
            >
              <Bell size={18} />
              <span className="notification-dot" />
            </Link>
            <div className="profile">
              <span className="avatar">{currentUser?.name.slice(0, 2).toUpperCase() ?? "US"}</span>
              <div>
                <strong>{currentUser?.name ?? "User"}</strong>
                <small>
                  {role === "ADMIN" ? "Administrator" : "Team member"}
                </small>
              </div>
            </div>
            <button type="button" onClick={handleLogout} className="logout" title="Log out">
              <LogOut size={17} />
            </button>
          </div>
        </header>
        <main className="main-content">
          <Outlet />
        </main>
        <footer>
          FlowForge <span>·</span> {currentUser?.name ?? "Workspace"} <span>·</span>{" "}
          <Link to="/settings">Workspace settings</Link>
        </footer>
      </div>
    </div>
  );
}
