import { useState } from "react";
import { Bell, ChevronRight, LogOut, Menu, Settings, X } from "lucide-react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { Logo } from "./AuthLayout";
import type { Icon, Role } from "../types/workflow";
import {
  LayoutDashboard,
  FileText,
  ClipboardList,
  ShieldCheck,
  GitBranch,
  Users,
} from "lucide-react";

const navItems: { label: string; to: string; icon: Icon; roles?: Role[] }[] = [
  { label: "Overview", to: "/", icon: LayoutDashboard },
  { label: "Forms", to: "/forms", icon: FileText },
  { label: "Requests", to: "/requests", icon: ClipboardList },
  { label: "Approvals", to: "/approvals", icon: ShieldCheck },
  { label: "Workflows", to: "/workflows", icon: GitBranch, roles: ["admin"] },
  { label: "Users", to: "/users", icon: Users, roles: ["admin"] },
];

export function AppShell() {
  const [role, setRole] = useState<Role>("admin");
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const items = navItems.filter(
    (item) => !item.roles || item.roles.includes(role),
  );
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
            <strong>Northstar Studio</strong>
            <small>Acme organization</small>
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
              <span className="avatar">AM</span>
              <div>
                <strong>Alex Morgan</strong>
                <small>
                  {role === "admin" ? "Administrator" : "Team member"}
                </small>
              </div>
              <select
                aria-label="Preview role"
                value={role}
                onChange={(e) => setRole(e.target.value as Role)}
              >
                <option value="admin">Admin view</option>
                <option value="member">Member view</option>
              </select>
            </div>
            <Link to="/login" className="logout" title="Log out">
              <LogOut size={17} />
            </Link>
          </div>
        </header>
        <main className="main-content">
          <Outlet />
        </main>
        <footer>
          FlowForge <span>·</span> Northstar Studio <span>·</span>{" "}
          <Link to="/settings">Workspace settings</Link>
        </footer>
      </div>
    </div>
  );
}
