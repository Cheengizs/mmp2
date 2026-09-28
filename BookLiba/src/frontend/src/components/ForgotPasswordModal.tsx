import React, { useState } from "react";

interface ForgotPasswordModalProps {
  apiBase: string;
  onClose: () => void;
  onSuccessMessage: (msg: string) => void;
  onError: (msg: string) => void;
}

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({
  apiBase,
  onClose,
  onSuccessMessage,
  onError,
}) => {
  const [step, setStep] = useState<"request" | "reset">("request");
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setPreviewUrl(null);
    try {
      const res = await fetch(`${apiBase}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Ошибка запроса сброса");

      if (data.previewUrl) setPreviewUrl(data.previewUrl);
      if (data.resetToken) setToken(data.resetToken);

      onSuccessMessage(data.message || "Инструкция отправлена на почту");
      setStep("reset");
    } catch (err: any) {
      onError(err.message || "Ошибка сети");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Ошибка смены пароля");

      onSuccessMessage("Пароль успешно изменён! Теперь вы можете войти.");
      onClose();
    } catch (err: any) {
      onError(err.message || "Ошибка сети");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.card}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={styles.title}>Восстановление пароля</h2>
        <button type="button" onClick={onClose} style={styles.closeBtn}>✕</button>
      </div>

      {step === "request" ? (
        <form onSubmit={handleRequestReset} style={styles.form}>
          <p style={styles.subtitle}>
            Введите ваш email. Мы отправим одноразовую ссылку для смены пароля (действует 15 минут).
          </p>

          <div style={styles.formGroup}>
            <label style={styles.label}>Email</label>
            <input
              type="email"
              style={styles.input}
              placeholder="example@mail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <button type="submit" disabled={loading} style={styles.primaryButton}>
            {loading ? "Отправка..." : "Отправить ссылку"}
          </button>
        </form>
      ) : (
        <form onSubmit={handleResetPassword} style={styles.form}>
          <p style={styles.subtitle}>
            Введите полученный токен из письма и новый пароль.
          </p>

          {previewUrl && (
            <div style={styles.previewBox}>
              <span>📬 <strong>Тестовое письмо:</strong></span>{" "}
              <a href={previewUrl} target="_blank" rel="noreferrer" style={styles.previewLink}>
                Открыть отправленное письмо (Ethereal) ↗
              </a>
            </div>
          )}

          <div style={styles.formGroup}>
            <label style={styles.label}>Токен сброса</label>
            <input
              style={styles.input}
              placeholder="Вставьте токен из письма"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              required
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Новый пароль (мин. 6 символов)</label>
            <input
              type="password"
              style={styles.input}
              placeholder="Новый надёжный пароль"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" disabled={loading} style={styles.primaryButton}>
            {loading ? "Сохранение..." : "Сохранить новый пароль"}
          </button>
        </form>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  card: {
    maxWidth: 420,
    margin: "40px auto",
    backgroundColor: "#1c1c21",
    border: "1px solid #2e2e38",
    borderRadius: 10,
    padding: 28,
  },
  title: {
    margin: 0,
    fontSize: 20,
    fontWeight: 700,
    color: "#ffffff",
  },
  closeBtn: {
    background: "transparent",
    border: "none",
    color: "#9ca3af",
    fontSize: 18,
    cursor: "pointer",
  },
  subtitle: {
    margin: "12px 0 16px 0",
    color: "#9ca3af",
    fontSize: 13,
    lineHeight: 1.4,
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
  },
  previewBox: {
    backgroundColor: "#172554",
    border: "1px solid #1e40af",
    borderRadius: 6,
    padding: "10px 12px",
    fontSize: 13,
    color: "#bfdbfe",
  },
  previewLink: {
    color: "#60a5fa",
    fontWeight: 600,
    textDecoration: "underline",
  },
};
