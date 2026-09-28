import React, { useEffect, useState } from "react";
import type { Role } from "../types";

interface AdminUser {
  id: number;
  username: string;
  role: Role;
  email?: string;
  bg_color?: string;
  created_at: string;
}

interface AdminSession {
  userId: number;
  username: string;
  role: Role;
  jwtToken: string;
  ip: string;
  userAgent: string;
  isActive: boolean;
  createdAt: string;
}

interface AdminPanelModalProps {
  apiBase: string;
  token: string;
  currentUsername: string;
  onClose: () => void;
  onError: (msg: string) => void;
  onLogoutSelf?: () => void;
}

export const AdminPanelModal: React.FC<AdminPanelModalProps> = ({
  apiBase,
  token,
  currentUsername,
  onClose,
  onError,
  onLogoutSelf,
}) => {
  const [activeTab, setActiveTab] = useState<"users" | "sessions">("users");
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [sessions, setSessions] = useState<AdminSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/api/admin/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Не удалось загрузить пользователей");
      setUsers(data);
    } catch (err: any) {
      onError(err.message || "Ошибка загрузки пользователей");
    } finally {
      setLoading(false);
    }
  };

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/api/admin/sessions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Не удалось загрузить сессии");
      setSessions(data);
    } catch (err: any) {
      onError(err.message || "Ошибка загрузки сессий");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "users") {
      fetchUsers();
    } else {
      fetchSessions();
    }
  }, [activeTab]);

  const handleDeleteUser = async (userId: number, username: string) => {
    if (!window.confirm(`Вы уверены, что хотите удалить пользователя "${username}"?`)) {
      return;
    }

    try {
      const res = await fetch(`${apiBase}/api/admin/users/${userId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Ошибка удаления");
      setStatusMessage(`Пользователь "${username}" успешно удалён`);
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      if (username === currentUsername && onLogoutSelf) {
        onLogoutSelf();
      }
    } catch (err: any) {
      onError(err.message || "Не удалось удалить пользователя");
    }
  };

  const handleDeactivateSession = async (sessionToken: string, username: string) => {
    try {
      const res = await fetch(`${apiBase}/api/admin/sessions/deactivate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ token: sessionToken }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Ошибка деактивации");
      setStatusMessage(`Сессия пользователя "${username}" деактивирована в Redis`);
      setSessions((prev) =>
        prev.map((s) => (s.jwtToken === sessionToken ? { ...s, isActive: false } : s)),
      );
      if (sessionToken === token && onLogoutSelf) {
        onLogoutSelf();
      }
    } catch (err: any) {
      onError(err.message || "Не удалось деактивировать сессию");
    }
  };

  const formatShortUserAgent = (ua: string) => {
    if (ua.includes("Firefox")) return "Firefox";
    if (ua.includes("Edg")) return "Edge";
    if (ua.includes("Chrome")) return "Chrome";
    if (ua.includes("Safari")) return "Safari";
    if (ua.includes("Postman")) return "Postman";
    if (ua.includes("curl")) return "curl";
    return ua.slice(0, 24);
  };

  const getRoleBadgeStyle = (role: string): React.CSSProperties => {
    switch (role) {
      case "admin":
        return { backgroundColor: "#7c3aed", color: "#ede9fe" };
      case "vip":
        return { backgroundColor: "#d97706", color: "#fef3c7" };
      default:
        return { backgroundColor: "#2563eb", color: "#dbeafe" };
    }
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <h2 style={styles.title}>⚙️ Панель администратора</h2>
            <span style={styles.adminBadge}>ADMIN</span>
          </div>
          <button type="button" onClick={onClose} style={styles.closeBtn}>
            ✕
          </button>
        </div>

        <div style={styles.navBar}>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              onClick={() => setActiveTab("users")}
              style={{
                ...styles.tabBtn,
                ...(activeTab === "users" ? styles.tabBtnActive : {}),
              }}
            >
              👥 Пользователи ({users.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("sessions")}
              style={{
                ...styles.tabBtn,
                ...(activeTab === "sessions" ? styles.tabBtnActive : {}),
              }}
            >
              ⚡ Активные сессии Redis ({sessions.filter((s) => s.isActive).length})
            </button>
          </div>
          <button
            type="button"
            onClick={activeTab === "users" ? fetchUsers : fetchSessions}
            disabled={loading}
            style={styles.refreshBtn}
          >
            {loading ? "..." : "🔄 Обновить"}
          </button>
        </div>

        {statusMessage && (
          <div style={styles.statusBox}>
            <span>{statusMessage}</span>
            <button
              type="button"
              onClick={() => setStatusMessage(null)}
              style={styles.closeStatusBtn}
            >
              ✕
            </button>
          </div>
        )}

        <div style={styles.body}>
          {activeTab === "users" ? (
            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>ID</th>
                    <th style={styles.th}>Логин</th>
                    <th style={styles.th}>Роль</th>
                    <th style={styles.th}>Email</th>
                    <th style={styles.th}>Регистрация</th>
                    <th style={styles.th}>Действие</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} style={styles.tr}>
                      <td style={styles.td}>#{u.id}</td>
                      <td style={styles.tdBold}>
                        {u.username}
                        {u.username === currentUsername && (
                          <span style={styles.youBadge}>вы</span>
                        )}
                      </td>
                      <td style={styles.td}>
                        <span style={{ ...styles.roleBadge, ...getRoleBadgeStyle(u.role) }}>
                          {u.role.toUpperCase()}
                        </span>
                      </td>
                      <td style={styles.td}>{u.email || "—"}</td>
                      <td style={styles.tdMuted}>
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>
                      <td style={styles.td}>
                        <button
                          type="button"
                          onClick={() => handleDeleteUser(u.id, u.username)}
                          disabled={u.username === currentUsername}
                          style={{
                            ...styles.dangerBtn,
                            ...(u.username === currentUsername ? styles.disabledBtn : {}),
                          }}
                        >
                          Удалить
                        </button>
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && !loading && (
                    <tr>
                      <td colSpan={6} style={styles.emptyTd}>
                        Пользователи не найдены
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Пользователь</th>
                    <th style={styles.th}>Роль</th>
                    <th style={styles.th}>IP-адрес</th>
                    <th style={styles.th}>Браузер / Клиент</th>
                    <th style={styles.th}>Статус Redis</th>
                    <th style={styles.th}>Вход</th>
                    <th style={styles.th}>Действие</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((s, idx) => (
                    <tr key={s.jwtToken || idx} style={styles.tr}>
                      <td style={styles.tdBold}>
                        {s.username}
                        {s.username === currentUsername && (
                          <span style={styles.youBadge}>вы</span>
                        )}
                      </td>
                      <td style={styles.td}>
                        <span style={{ ...styles.roleBadge, ...getRoleBadgeStyle(s.role) }}>
                          {s.role.toUpperCase()}
                        </span>
                      </td>
                      <td style={styles.tdCode}>{s.ip}</td>
                      <td style={styles.td} title={s.userAgent}>
                        {formatShortUserAgent(s.userAgent)}
                      </td>
                      <td style={styles.td}>
                        {s.isActive ? (
                          <span style={styles.activeBadge}>● Активна</span>
                        ) : (
                          <span style={styles.inactiveBadge}>○ Отключена</span>
                        )}
                      </td>
                      <td style={styles.tdMuted}>
                        {new Date(s.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td style={styles.td}>
                        {s.isActive ? (
                          <button
                            type="button"
                            onClick={() => handleDeactivateSession(s.jwtToken, s.username)}
                            style={styles.revokeBtn}
                          >
                            Отключить
                          </button>
                        ) : (
                          <span style={{ color: "#71717a", fontSize: 12 }}>Отключена</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {sessions.length === 0 && !loading && (
                    <tr>
                      <td colSpan={7} style={styles.emptyTd}>
                        Активных сессий в Redis не обнаружено
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    backdropFilter: "blur(4px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    padding: 16,
  },
  modal: {
    backgroundColor: "#18181b",
    border: "1px solid #3f3f46",
    borderRadius: 12,
    width: "100%",
    maxWidth: 860,
    maxHeight: "90vh",
    display: "flex",
    flexDirection: "column",
    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
    overflow: "hidden",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "20px 24px",
    borderBottom: "1px solid #27272a",
  },
  title: {
    margin: 0,
    fontSize: 20,
    fontWeight: 700,
    color: "#f3f4f6",
  },
  adminBadge: {
    backgroundColor: "#7c3aed",
    color: "#ede9fe",
    fontSize: 11,
    fontWeight: 700,
    padding: "3px 8px",
    borderRadius: 4,
    letterSpacing: "0.5px",
  },
  closeBtn: {
    background: "transparent",
    border: "none",
    color: "#9ca3af",
    fontSize: 20,
    cursor: "pointer",
  },
  navBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 24px",
    borderBottom: "1px solid #27272a",
    backgroundColor: "#121214",
    flexWrap: "wrap",
    gap: 12,
  },
  tabBtn: {
    backgroundColor: "transparent",
    border: "1px solid #3f3f46",
    color: "#9ca3af",
    padding: "8px 16px",
    borderRadius: 6,
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
  },
  tabBtnActive: {
    backgroundColor: "#7c3aed",
    borderColor: "#7c3aed",
    color: "#ffffff",
  },
  refreshBtn: {
    backgroundColor: "#27272a",
    border: "1px solid #3f3f46",
    color: "#e5e7eb",
    padding: "8px 14px",
    borderRadius: 6,
    fontSize: 13,
    cursor: "pointer",
  },
  statusBox: {
    backgroundColor: "#064e3b",
    borderBottom: "1px solid #047857",
    color: "#a7f3d0",
    padding: "10px 24px",
    fontSize: 13,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  closeStatusBtn: {
    background: "transparent",
    border: "none",
    color: "#a7f3d0",
    cursor: "pointer",
    fontWeight: "bold",
  },
  body: {
    padding: 24,
    overflowY: "auto",
    flex: 1,
  },
  tableWrapper: {
    overflowX: "auto",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    textAlign: "left",
    fontSize: 13,
  },
  th: {
    padding: "10px 12px",
    borderBottom: "1px solid #3f3f46",
    color: "#9ca3af",
    fontWeight: 600,
  },
  tr: {
    borderBottom: "1px solid #27272a",
  },
  td: {
    padding: "12px",
    color: "#d1d5db",
  },
  tdBold: {
    padding: "12px",
    color: "#f3f4f6",
    fontWeight: 600,
  },
  tdCode: {
    padding: "12px",
    color: "#60a5fa",
    fontFamily: "ui-monospace, monospace",
    fontSize: 12,
  },
  tdMuted: {
    padding: "12px",
    color: "#71717a",
  },
  emptyTd: {
    padding: "36px",
    textAlign: "center",
    color: "#9ca3af",
  },
  youBadge: {
    marginLeft: 6,
    backgroundColor: "#27272a",
    color: "#a1a1aa",
    fontSize: 10,
    padding: "2px 6px",
    borderRadius: 4,
  },
  roleBadge: {
    fontSize: 11,
    fontWeight: 700,
    padding: "2px 8px",
    borderRadius: 4,
  },
  activeBadge: {
    color: "#34d399",
    fontWeight: 600,
  },
  inactiveBadge: {
    color: "#ef4444",
  },
  dangerBtn: {
    backgroundColor: "#7f1d1d",
    color: "#fee2e2",
    border: "none",
    borderRadius: 4,
    padding: "5px 10px",
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
  },
  revokeBtn: {
    backgroundColor: "#991b1b",
    color: "#fef2f2",
    border: "none",
    borderRadius: 4,
    padding: "5px 10px",
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
  },
  disabledBtn: {
    opacity: 0.4,
    cursor: "not-allowed",
  },
};
