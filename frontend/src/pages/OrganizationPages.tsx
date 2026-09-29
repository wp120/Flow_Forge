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
  const [notifications, setNotifications] = useState<
    Array<{
      id: string;
      type: string;
      title: string;
      message: string;
      isRead: boolean;
      createdAt: string;
      relatedEntityType: string | null;
      relatedEntityId: string | null;
    }>
  >([]);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 0,
  });
  const [error, setError] = useState("");

  async function loadNotifications(targetPage = page) {
    try {
      const data = await apiFetch<{
        notifications: typeof notifications;
        pagination: typeof pagination;
      }>(`/api/notifications?page=${targetPage}&pageSize=10`);
      setNotifications(data.notifications);
      setPagination(data.pagination);
      setError("");
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load notifications.",
      );
    }
  }

  useEffect(() => {
    loadNotifications(page);
  }, [page]);

  async function markRead(notificationId: string) {
    try {
      await apiFetch(`/api/notifications/${notificationId}/read`, {
        method: "PATCH",
      });
      window.dispatchEvent(new Event("flowforge:notifications-updated"));
      await loadNotifications();
    } catch (readError) {
      setError(
        readError instanceof Error
          ? readError.message
          : "Unable to update notification.",
      );
    }
  }

  async function markAllRead() {
    try {
      await apiFetch("/api/notifications/read-all", { method: "PATCH" });
      window.dispatchEvent(new Event("flowforge:notifications-updated"));
      await loadNotifications();
    } catch (readError) {
      setError(
        readError instanceof Error
          ? readError.message
          : "Unable to update notifications.",
      );
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="INBOX"
        title="Notifications"
        description="Updates about your requests and workspace."
        action={
          <button className="text-link" type="button" onClick={markAllRead}>
            Mark all as read
          </button>
        }
      />
      {error && <div className="error-banner">{error}</div>}
      <section className="panel notification-list">
        {notifications.map((notification) => (
          <div
            className={`notification-item ${notification.isRead ? "" : "unread"}`}
            key={notification.id}
          >
            <span className="notification-icon">
              <Bell size={17} />
            </span>
            <div>
              <strong>{notification.title}</strong>
              <p>{notification.message}</p>
              <small>{new Date(notification.createdAt).toLocaleString()}</small>
            </div>
            {!notification.isRead && (
              <button
                className="text-link"
                type="button"
                onClick={() => markRead(notification.id)}
              >
                Mark read
              </button>
            )}
          </div>
        ))}
        {notifications.length === 0 && (
          <p className="attention-empty">No notifications yet.</p>
        )}
      </section>
      {pagination.totalPages > 1 && (
        <div className="pagination-controls">
          <span>{pagination.total} total</span>
          <div>
            <Button
              variant="secondary"
              disabled={page <= 1}
              onClick={() => setPage((current) => current - 1)}
            >
              Previous
            </Button>
            <span>
              Page {page} of {pagination.totalPages}
            </span>
            <Button
              variant="secondary"
              disabled={page >= pagination.totalPages}
              onClick={() => setPage((current) => current + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
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
