import { Bell, MoreHorizontal, UserPlus } from "lucide-react";
import { useEffect, useState } from "react";
import { Button, Field, PageHeader, StatusBadge } from "../components/ui";
import { apiFetch } from "../lib/api";

type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "USER";
  status: "ACTIVE" | "INACTIVE";
  department: string | null;
  createdAt: string;
};

export function UsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "USER" as "ADMIN" | "USER",
    department: "",
  });

  async function loadUsers() {
    try {
      const data = await apiFetch<{ users: AdminUser[] }>("/api/admin/users");
      setUsers(data.users);
    } catch {
      setUsers([]);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  async function handleCreateUser(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");
    setSaving(true);

    try {
      await apiFetch<{ user: AdminUser }>("/api/admin/users", {
        method: "POST",
        body: JSON.stringify(form),
      });
      setForm({
        name: "",
        email: "",
        password: "",
        role: "USER",
        department: "",
      });
      await loadUsers();
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Unable to add user.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="ORGANIZATION"
        title="Users"
        description="Manage who can access your workspace and what they can do."
        action={<Button icon={UserPlus}>Add user</Button>}
      />
      <section className="panel">
        <form
          onSubmit={handleCreateUser}
          className="settings-form"
          style={{ marginBottom: 24 }}
        >
          <h2>Add user</h2>
          <div className="form-grid">
            <Field label="Name">
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Jordan Lee"
                required
              />
            </Field>
            <Field label="Email">
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="jordan@company.com"
                required
              />
            </Field>
            <Field label="Department">
              <input
                value={form.department}
                onChange={(e) =>
                  setForm({ ...form, department: e.target.value })
                }
                placeholder="Finance"
              />
            </Field>
            <Field label="Role">
              <select
                value={form.role}
                onChange={(e) =>
                  setForm({ ...form, role: e.target.value as "ADMIN" | "USER" })
                }
              >
                <option value="USER">Member</option>
                <option value="ADMIN">Admin</option>
              </select>
            </Field>
            <Field label="Temporary password">
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="At least 8 characters"
                required
              />
            </Field>
          </div>
          {formError && <div className="error-banner">{formError}</div>}
          <Button type="submit" disabled={saving}>
            {saving ? "Adding user…" : "Add user"}
          </Button>
        </form>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Department</th>
                <th>Status</th>
                <th>Created</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>
                    <div className="user-cell">
                      <span className="avatar">
                        {user.name
                          .split(" ")
                          .map((part) => part[0])
                          .join("")}
                      </span>
                      <div>
                        <strong>{user.name}</strong>
                        <small>{user.email}</small>
                      </div>
                    </div>
                  </td>
                  <td>{user.role}</td>
                  <td>{user.department ?? "—"}</td>
                  <td>
                    <StatusBadge status={user.status} />
                  </td>
                  <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                  <td>
                    <button className="icon-button" type="button">
                      <MoreHorizontal size={17} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

export function Notifications() {
  const notifications = [
    {
      title: "Approval needed",
      body: "A new request is waiting for your decision.",
      time: "Just now",
      unread: true,
    },
    {
      title: "Workflow update",
      body: "A workflow was updated for this workspace.",
      time: "Yesterday",
      unread: false,
    },
  ];

  return (
    <>
      <PageHeader
        eyebrow="INBOX"
        title="Notifications"
        description="Updates about your requests and workspace."
        action={<button className="text-link">Mark all as read</button>}
      />
      <section className="panel notification-list">
        {notifications.map((notification) => (
          <div
            className={`notification-item ${notification.unread ? "unread" : ""}`}
            key={notification.title}
          >
            <span className="notification-icon">
              <Bell size={17} />
            </span>
            <div>
              <strong>{notification.title}</strong>
              <p>{notification.body}</p>
              <small>{notification.time}</small>
            </div>
            {notification.unread && <span className="unread-dot" />}
          </div>
        ))}
      </section>
    </>
  );
}

export function SettingsPage() {
  return (
    <>
      <PageHeader
        eyebrow="WORKSPACE"
        title="Settings"
        description="Manage the basics of your FlowForge organization."
      />
      <section className="panel settings-panel">
        <div className="settings-nav">
          <button className="settings-tab active">Organization</button>
          <button className="settings-tab">Preferences</button>
          <button className="settings-tab">Notifications</button>
        </div>
        <div className="settings-form">
          <h2>Organization details</h2>
          <p className="muted">
            This information appears throughout your workspace.
          </p>
          <Field label="Organization name">
            <input defaultValue="Northstar Studio" />
          </Field>
          <Field label="Workspace URL">
            <div className="input-prefix">
              <span>flowforge.app/</span>
              <input defaultValue="northstar" />
            </div>
          </Field>
          <Button>Save changes</Button>
        </div>
      </section>
    </>
  );
}
