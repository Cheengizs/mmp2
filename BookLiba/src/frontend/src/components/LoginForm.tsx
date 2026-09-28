import React, { useState } from "react";

interface LoginFormProps {
  apiBase: string;
  onSuccess: (token: string, username: string, role: string) => void;
  onSwitchToRegister: () => void;
  onError: (msg: string) => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  apiBase,
  onSuccess,
  onSwitchToRegister,
  onError,
}) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Ошибка авторизации");
      }

      const payload = JSON.parse(atob(data.accessToken.split(".")[1]));
      onSuccess(
        data.accessToken,
        payload.username || username,
        payload.role || "user",
      );
    } catch (err: any) {
      onError(err.message || "Ошибка сети");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.card}>
      <h2 style={styles.title}>Вход в систему</h2>
      <p style={styles.subtitle}>
        Введите логин и пароль для доступа к библиотеке
      </p>

      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.formGroup}>
          <label style={styles.label}>Логин</label>
          <input
            style={styles.input}
            placeholder="Ваш логин"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Пароль</label>
          <input
            type="password"
            style={styles.input}
            placeholder="Ваш пароль"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <button type="submit" disabled={loading} style={styles.primaryButton}>
          {loading ? "Вход..." : "Войти"}
        </button>

        <div style={styles.switchWrapper}>
          <span style={{ color: "#9ca3af", fontSize: 13 }}>Нет аккаунта?</span>{" "}
          <button
            type="button"
            onClick={onSwitchToRegister}
            style={styles.linkButton}
          >
            Зарегистрироваться
          </button>
        </div>
      </form>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  card: {
    maxWidth: 420,
    margin: "60px auto",
    backgroundColor: "#1c1c21",
    border: "1px solid #2e2e38",
    borderRadius: 10,
    padding: 32,
  },
  title: {
    margin: "0 0 6px 0",
    fontSize: 22,
    fontWeight: 700,
    color: "#ffffff",
  },
  subtitle: {
    margin: "0 0 24px 0",
    color: "#9ca3af",
    fontSize: 13,
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  formGroup: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: 600,
    color: "#d1d5db",
  },
  input: {
    backgroundColor: "#121214",
    color: "#f3f4f6",
    border: "1px solid #3f3f46",
    borderRadius: 6,
    padding: "10px 12px",
    fontSize: 14,
    outline: "none",
  },
  primaryButton: {
    backgroundColor: "#2563eb",
    color: "#ffffff",
    border: "none",
    borderRadius: 6,
    padding: "12px",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    marginTop: 8,
  },
  switchWrapper: {
    textAlign: "center",
    marginTop: 8,
  },
  linkButton: {
    background: "none",
    border: "none",
    color: "#60a5fa",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    textDecoration: "underline",
  },
};
