import React, { useEffect, useState } from "react";
import type { Book, User } from "./types";
import { Navbar } from "./components/Navbar";
import { LoginForm } from "./components/LoginForm";
import { RegisterForm } from "./components/RegisterForm";
import { ForgotPasswordModal } from "./components/ForgotPasswordModal";
import { BookForm } from "./components/BookForm";
import { BookList } from "./components/BookList";

const API_BASE = "http://localhost:5000";

export default function App() {
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem("token"),
  );
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem("user");
    return saved ? JSON.parse(saved) : null;
  });
  const [bgColor, setBgColor] = useState<string>(() => {
    return localStorage.getItem("bgColor") || "#121214";
  });
  const [authView, setAuthView] = useState<"login" | "register" | "forgot">("login");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [books, setBooks] = useState<Book[]>([]);
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [year, setYear] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLoginSuccess = (
    newToken: string,
    username: string,
    role: string,
    newBgColor?: string,
  ) => {
    const savedBg = newBgColor || "#121214";
    const userData: User = { username, role: role as any, bgColor: savedBg };
    setToken(newToken);
    setUser(userData);
    setBgColor(savedBg);
    localStorage.setItem("token", newToken);
    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.setItem("bgColor", savedBg);
    setErrorMessage(null);
  };

  const handleLogout = async () => {
    if (token) {
      try {
        await fetch(`${API_BASE}/api/auth/logout`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (err) {
      }
    }
    setToken(null);
    setUser(null);
    setBgColor("#121214");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("bgColor");
    setBooks([]);
  };

  const handleThemeChange = async (newColor: string) => {
    setBgColor(newColor);
    localStorage.setItem("bgColor", newColor);
    if (user) {
      const updatedUser = { ...user, bgColor: newColor };
      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));
    }
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/api/users/theme`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ bgColor: newColor }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setErrorMessage(data.error || "Не удалось сохранить тему на сервере");
      }
    } catch (err: any) {
      console.error("Ошибка при сохранении темы:", err);
    }
  };

  const clearBookForm = () => {
    setTitle("");
    setAuthor("");
    setYear("");
    setFile(null);
    setEditingId(null);
  };

  const fetchBooks = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/api/books`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401 || res.status === 403) {
        handleLogout();
        throw new Error("Сессия истекла. Пожалуйста, войдите снова");
      }
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Ошибка загрузки книг");
      }
      const data = await res.json();
      setBooks(data);
    } catch (err: any) {
      setErrorMessage(err.message || "Ошибка связи с сервером");
    }
  };

  useEffect(() => {
    if (token) {
      fetchBooks();
    }
  }, [token]);

  const handleBookSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setErrorMessage(null);

    const formData = new FormData();
    formData.append("title", title);
    formData.append("author", author);
    if (year) formData.append("year", year);
    if (file) formData.append("cover", file);

    const isEdit = editingId !== null;
    const endpoint = isEdit
      ? `${API_BASE}/api/books/${editingId}`
      : `${API_BASE}/api/books`;
    const method = isEdit ? "PUT" : "POST";

    try {
      const res = await fetch(endpoint, {
        method,
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (res.status === 401 || res.status === 403) {
        handleLogout();
        throw new Error("Сессия истекла. Войдите снова");
      }

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || "Ошибка при сохранении книги");
        return;
      }

      if (isEdit) {
        setBooks((prev) => prev.map((b) => (b.id === editingId ? data : b)));
      } else {
        setBooks((prev) => [data, ...prev]);
      }
      clearBookForm();
    } catch (err: any) {
      setErrorMessage(err.message || "Не удалось связаться с сервером");
    }
  };

  const handleEditClick = (book: Book) => {
    setEditingId(book.id);
    setTitle(book.title);
    setAuthor(book.author);
    setYear(book.year ? String(book.year) : "");
    setErrorMessage(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteBook = async (id: number) => {
    if (!token) return;
    setErrorMessage(null);
    try {
      const res = await fetch(`${API_BASE}/api/books/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 401 || res.status === 403) {
        handleLogout();
        throw new Error("Сессия истекла. Войдите снова");
      }

      if (!res.ok) {
        const data = await res.json();
        setErrorMessage(data.error || "Ошибка при удалении книги");
        return;
      }

      setBooks((prev) => prev.filter((b) => b.id !== id));
      if (editingId === id) clearBookForm();
    } catch (err: any) {
      setErrorMessage(err.message || "Не удалось связаться с сервером");
    }
  };

  return (
    <div
      style={{
        ...styles.pageWrapper,
        backgroundColor: bgColor,
      }}
    >
      <div style={styles.container}>
        {errorMessage && (
          <div style={styles.errorAlert}>
            <span>
              <strong>Ошибка:</strong> {errorMessage}
            </span>
            <button
              onClick={() => setErrorMessage(null)}
              style={styles.closeErrorButton}
            >
              ✕
            </button>
          </div>
        )}

        {successMessage && (
          <div style={styles.successAlert}>
            <span>
              <strong>Успешно:</strong> {successMessage}
            </span>
            <button
              onClick={() => setSuccessMessage(null)}
              style={styles.closeSuccessButton}
            >
              ✕
            </button>
          </div>
        )}

        {!token || !user ? (
          authView === "login" ? (
            <LoginForm
              apiBase={API_BASE}
              onSuccess={handleLoginSuccess}
              onSwitchToRegister={() => {
                setErrorMessage(null);
                setSuccessMessage(null);
                setAuthView("register");
              }}
              onForgotPassword={() => {
                setErrorMessage(null);
                setSuccessMessage(null);
                setAuthView("forgot");
              }}
              onError={setErrorMessage}
            />
          ) : authView === "register" ? (
            <RegisterForm
              apiBase={API_BASE}
              onSuccess={handleLoginSuccess}
              onSwitchToLogin={() => {
                setErrorMessage(null);
                setSuccessMessage(null);
                setAuthView("login");
              }}
              onError={setErrorMessage}
            />
          ) : (
            <ForgotPasswordModal
              apiBase={API_BASE}
              onClose={() => {
                setErrorMessage(null);
                setAuthView("login");
              }}
              onSuccessMessage={(msg) => {
                setSuccessMessage(msg);
              }}
              onError={setErrorMessage}
            />
          )
        ) : (
          <>
            <Navbar
              user={user}
              onLogout={handleLogout}
              onThemeChange={handleThemeChange}
              currentBg={bgColor}
            />

            <BookForm
              title={title}
              setTitle={setTitle}
              author={author}
              setAuthor={setAuthor}
              year={year}
              setYear={setYear}
              setFile={setFile}
              editingId={editingId}
              onSubmit={handleBookSubmit}
              onCancel={clearBookForm}
            />

            <BookList
              books={books}
              apiBase={API_BASE}
              onEdit={handleEditClick}
              onDelete={handleDeleteBook}
            />
          </>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  pageWrapper: {
    minHeight: "100vh",
    backgroundColor: "#121214",
    color: "#f3f4f6",
    fontFamily:
      'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    padding: "40px 16px",
    boxSizing: "border-box",
    transition: "background-color 0.3s ease",
  },
  container: {
    maxWidth: 760,
    margin: "0 auto",
  },
  errorAlert: {
    backgroundColor: "#3f1518",
    border: "1px solid #7f1d1d",
    color: "#fca5a5",
    padding: "12px 16px",
    borderRadius: 6,
    marginBottom: 20,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: 14,
  },
  closeErrorButton: {
    background: "transparent",
    border: "none",
    color: "#fca5a5",
    cursor: "pointer",
    fontSize: 16,
    fontWeight: "bold",
  },
  successAlert: {
    backgroundColor: "#064e3b",
    border: "1px solid #047857",
    color: "#a7f3d0",
    padding: "12px 16px",
    borderRadius: 6,
    marginBottom: 20,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: 14,
  },
  closeSuccessButton: {
    background: "transparent",
    border: "none",
    color: "#a7f3d0",
    cursor: "pointer",
    fontSize: 16,
    fontWeight: "bold",
  },
};
