import React, { useEffect, useState } from "react";
import type { Book, User } from "./types";
import { Navbar } from "./components/Navbar";
import { LoginForm } from "./components/LoginForm";
import { RegisterForm } from "./components/RegisterForm";
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
  const [authView, setAuthView] = useState<"login" | "register">("login");

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
  ) => {
    const userData: User = { username, role: role as any };
    setToken(newToken);
    setUser(userData);
    localStorage.setItem("token", newToken);
    localStorage.setItem("user", JSON.stringify(userData));
    setErrorMessage(null);
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setBooks([]);
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
    window.scrollTo({ top: 0, behavior: "smooth" });
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
    <div style={styles.pageWrapper}>
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

        {!token || !user ? (
          authView === "login" ? (
            <LoginForm
              apiBase={API_BASE}
              onSuccess={handleLoginSuccess}
              onSwitchToRegister={() => {
                setErrorMessage(null);
                setAuthView("register");
              }}
              onError={setErrorMessage}
            />
          ) : (
            <RegisterForm
              apiBase={API_BASE}
              onSuccess={handleLoginSuccess}
              onSwitchToLogin={() => {
                setErrorMessage(null);
                setAuthView("login");
              }}
              onError={setErrorMessage}
            />
          )
        ) : (
          <>
            <Navbar user={user} onLogout={handleLogout} />

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
};
