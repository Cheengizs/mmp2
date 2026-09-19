import React, { useEffect, useRef, useState } from 'react';

interface Book {
  id: number;
  title: string;
  author: string;
  year: number | null;
  cover_url: string | null;
}

const API_BASE = 'http://localhost:5000';

export default function App() {
  const [books, setBooks] = useState<Book[]>([]);
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [year, setYear] = useState('');
  const [file, setFile] = useState<File | null>(null);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const clearForm = () => {
    setTitle('');
    setAuthor('');
    setYear('');
    setFile(null);
    setEditingId(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const fetchBooks = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/books`);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Ошибка загрузки книг');
      }
      const data = await res.json();
      setBooks(data);
    } catch (err: any) {
      setErrorMessage(err.message || 'Ошибка сети при обращении к серверу');
    }
  };

  useEffect(() => {
    fetchBooks();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const formData = new FormData();
    formData.append('title', title);
    formData.append('author', author);
    if (year) formData.append('year', year);
    if (file) formData.append('cover', file);

    const isEdit = editingId !== null;
    const endpoint = isEdit ? `${API_BASE}/api/books/${editingId}` : `${API_BASE}/api/books`;
    const method = isEdit ? 'PUT' : 'POST';

    try {
      const res = await fetch(endpoint, {
        method,
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || 'Ошибка при сохранении книги');
        return;
      }

      if (isEdit) {
        setBooks((prev) => prev.map((b) => (b.id === editingId ? data : b)));
      } else {
        setBooks((prev) => [data, ...prev]);
      }
      clearForm();
    } catch (err: any) {
      setErrorMessage(err.message || 'Не удалось связаться с сервером');
    }
  };

  const handleEditClick = (book: Book) => {
    setEditingId(book.id);
    setTitle(book.title);
    setAuthor(book.author);
    setYear(book.year ? String(book.year) : '');
    setErrorMessage(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteBook = async (id: number) => {
    setErrorMessage(null);
    try {
      const res = await fetch(`${API_BASE}/api/books/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        setErrorMessage(data.error || 'Ошибка при удалении книги');
        return;
      }

      setBooks((prev) => prev.filter((b) => b.id !== id));
      if (editingId === id) clearForm();
    } catch (err: any) {
      setErrorMessage(err.message || 'Не удалось связаться с сервером');
    }
  };

  return (
    <div style={styles.pageWrapper}>
      <div style={styles.container}>
        <header style={{ marginBottom: 28 }}>
          <h1 style={styles.mainTitle}>Библиотека (SPA CRUD)</h1>
          <p style={styles.subTitle}>
            Node.js REST API + PostgreSQL • Тёмная тема
          </p>
        </header>

        {/* Баннер ошибок */}
        {errorMessage && (
          <div style={styles.errorAlert}>
            <span><strong>Ошибка:</strong> {errorMessage}</span>
            <button
              onClick={() => setErrorMessage(null)}
              style={styles.closeErrorButton}
            >
              ✕
            </button>
          </div>
        )}

        {/* Форма */}
        <form onSubmit={handleSubmit} style={styles.card}>
          <h2 style={styles.sectionTitle}>
            {editingId ? `Редактирование (ID: ${editingId})` : 'Добавить новую книгу'}
          </h2>

          <div style={styles.formGroup}>
            <label style={styles.label}>Название книги *</label>
            <input
              style={styles.input}
              placeholder="например, 1984"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Автор *</label>
            <input
              style={styles.input}
              placeholder="например, Джордж Оруэлл"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              required
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Год издания</label>
            <input
              style={styles.input}
              placeholder="например, 1949"
              type="number"
              value={year}
              onChange={(e) => setYear(e.target.value)}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>
              {editingId ? 'Заменить обложку (опционально)' : 'Обложка книги (файл)'}
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              style={styles.fileInput}
            />
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
            <button type="submit" style={styles.primaryButton}>
              {editingId ? 'Сохранить' : 'Добавить книгу'}
            </button>
            {editingId && (
              <button type="button" onClick={clearForm} style={styles.cancelButton}>
                Отмена
              </button>
            )}
          </div>
        </form>

        {/* Список книг */}
        <h2 style={{ ...styles.sectionTitle, borderBottom: '1px solid #2e2e38', paddingBottom: 12, marginTop: 36 }}>
          Каталог ({books.length})
        </h2>

        {books.length === 0 ? (
          <div style={{ color: '#9ca3af', textAlign: 'center', padding: '30px 0' }}>
            Список книг пуст.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16 }}>
            {books.map((book) => (
              <div key={book.id} style={styles.bookCard}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  {book.cover_url ? (
                    <img
                      src={`${API_BASE}${book.cover_url}`}
                      alt={book.title}
                      style={styles.coverImage}
                    />
                  ) : (
                    <div style={styles.noCoverPlaceholder}>
                      Нет фото
                    </div>
                  )}
                  <div>
                    <h3 style={styles.bookTitle}>{book.title}</h3>
                    <p style={styles.bookAuthor}>
                      Автор: <span style={{ color: '#e5e7eb' }}>{book.author}</span>
                    </p>
                    <p style={styles.bookYear}>
                      Год: {book.year || 'Не указан'}
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => handleEditClick(book)} style={styles.editButton}>
                    Изменить
                  </button>
                  <button onClick={() => handleDeleteBook(book.id)} style={styles.deleteButton}>
                    Удалить
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  pageWrapper: {
    minHeight: '100vh',
    backgroundColor: '#121214',
    color: '#f3f4f6',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    padding: '40px 16px',
    boxSizing: 'border-box',
  },
  container: {
    maxWidth: 760,
    margin: '0 auto',
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: 700,
    color: '#ffffff',
    margin: '0 0 6px 0',
  },
  subTitle: {
    margin: 0,
    color: '#9ca3af',
    fontSize: 14,
  },
  card: {
    backgroundColor: '#1c1c21',
    border: '1px solid #2e2e38',
    borderRadius: 8,
    padding: 24,
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  sectionTitle: {
    margin: '0 0 6px 0',
    fontSize: 18,
    fontWeight: 600,
    color: '#f9fafb',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: 600,
    color: '#d1d5db',
  },
  input: {
    backgroundColor: '#121214',
    color: '#f3f4f6',
    border: '1px solid #3f3f46',
    borderRadius: 6,
    padding: '10px 12px',
    fontSize: 14,
    outline: 'none',
  },
  fileInput: {
    color: '#9ca3af',
    fontSize: 13,
    marginTop: 4,
  },
  primaryButton: {
    backgroundColor: '#2563eb',
    color: '#ffffff',
    border: 'none',
    borderRadius: 6,
    padding: '10px 18px',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
  },
  cancelButton: {
    backgroundColor: '#3f3f46',
    color: '#f3f4f6',
    border: 'none',
    borderRadius: 6,
    padding: '10px 16px',
    fontSize: 14,
    cursor: 'pointer',
  },
  errorAlert: {
    backgroundColor: '#3f1518',
    border: '1px solid #7f1d1d',
    color: '#fca5a5',
    padding: '12px 16px',
    borderRadius: 6,
    marginBottom: 20,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: 14,
  },
  closeErrorButton: {
    background: 'transparent',
    border: 'none',
    color: '#fca5a5',
    cursor: 'pointer',
    fontSize: 16,
    fontWeight: 'bold',
  },
  bookCard: {
    backgroundColor: '#1c1c21',
    border: '1px solid #2e2e38',
    borderRadius: 8,
    padding: 16,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  coverImage: {
    width: 60,
    height: 85,
    objectFit: 'cover',
    borderRadius: 6,
    border: '1px solid #3f3f46',
  },
  noCoverPlaceholder: {
    width: 60,
    height: 85,
    backgroundColor: '#27272a',
    border: '1px solid #3f3f46',
    borderRadius: 6,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 11,
    color: '#71717a',
    textAlign: 'center',
  },
  bookTitle: {
    margin: '0 0 6px 0',
    fontSize: 17,
    fontWeight: 600,
    color: '#ffffff',
  },
  bookAuthor: {
    margin: 0,
    fontSize: 14,
    color: '#9ca3af',
  },
  bookYear: {
    margin: '4px 0 0 0',
    fontSize: 13,
    color: '#71717a',
  },
  editButton: {
    backgroundColor: '#27272a',
    color: '#e5e7eb',
    border: '1px solid #3f3f46',
    borderRadius: 6,
    padding: '6px 12px',
    fontSize: 13,
    cursor: 'pointer',
  },
  deleteButton: {
    backgroundColor: '#7f1d1d',
    color: '#fee2e2',
    border: 'none',
    borderRadius: 6,
    padding: '6px 12px',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
  },
};