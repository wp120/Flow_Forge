import { Bell, MoreHorizontal, UserPlus } from "lucide-react";
import { notifications } from "../data/mockData";
import { Button, Field, PageHeader, StatusBadge } from "../components/ui";

export function UsersPage() {
  const users = [
    ["Alex Morgan", "alex@northstar.studio", "Admin", "Active", "Now"],
    ["Jordan Lee", "jordan@northstar.studio", "Member", "Active", "Today"],
    [
      "Priya Shah",
      "priya@northstar.studio",
      "Member · Approver",
      "Active",
      "Yesterday",
    ],
    ["Marcus Chen", "marcus@northstar.studio", "Member", "Invited", "Never"],
  ];
  return (
    <>
      <PageHeader
        eyebrow="ORGANIZATION"
        title="Users"
        description="Manage who can access your workspace and what they can do."
        action={<Button icon={UserPlus}>Add user</Button>}
      />
      <section className="panel">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Status</th>
                <th>Last active</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {users.map(([name, email, role, status, last]) => (
                <tr key={email}>
                  <td>
                    <div className="user-cell">
                      <span className="avatar">
                        {name
                          .split(" ")
                          .map((part) => part[0])
                          .join("")}
                      </span>
                      <div>
                        <strong>{name}</strong>
                        <small>{email}</small>
                      </div>
                    </div>
                  </td>
                  <td>{role}</td>
                  <td>
                    <StatusBadge status={status} />
                  </td>
                  <td>{last}</td>
                  <td>
                    <button className="icon-button">
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
