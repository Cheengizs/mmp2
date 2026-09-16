import React, { useState, useEffect, useCallback } from 'react';
import { api } from './api/client.js';
import { BookFilters } from './components/BookFilters.jsx';
import { BookList } from './components/BookList.jsx';
import { BookFormModal } from './components/BookFormModal.jsx';
import { QuickAuthorModal } from './components/QuickAuthorModal.jsx';
import { QuickGenreModal } from './components/QuickGenreModal.jsx';
import { Toast } from './components/Toast.jsx';
import { BookMarked, Plus, Library } from 'lucide-react';

export function App() {
  const [books, setBooks] = useState([]);
  const [authors, setAuthors] = useState([]);
  const [genres, setGenres] = useState([]);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState({
    search: '',
    authorId: '',
    genreId: '',
    status: ''
  });

  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState(null);
  const [isAuthorModalOpen, setIsAuthorModalOpen] = useState(false);
  const [isGenreModalOpen, setIsGenreModalOpen] = useState(false);

  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'success') => {
    const id = Date.now().toString() + Math.random().toString();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const loadDictionaries = useCallback(async () => {
    try {
      const [fetchedAuthors, fetchedGenres] = await Promise.all([
        api.getAuthors(),
        api.getGenres()
      ]);
      setAuthors(fetchedAuthors);
      setGenres(fetchedGenres);
    } catch (err) {
      console.error('Failed to load authors or genres:', err);
      addToast('Не удалось загрузить справочники авторов и жанров', 'error');
    }
  }, []);

  const loadBooks = useCallback(async (currentFilters) => {
    try {
      setLoading(true);
      const data = await api.getBooks(currentFilters);
      setBooks(data);
    } catch (err) {
      console.error('Failed to fetch books:', err);
      addToast(err.message || 'Ошибка загрузки каталога книг', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDictionaries();
  }, [loadDictionaries]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadBooks(filters);
    }, 250);
    return () => clearTimeout(timer);
  }, [filters, loadBooks]);

  const handleOpenCreateModal = () => {
    setEditingBook(null);
    setIsBookModalOpen(true);
  };

  const handleOpenEditModal = (book) => {
    setEditingBook(book);
    setIsBookModalOpen(true);
  };

  const handleBookSubmit = async (formData, bookId) => {
    if (bookId) {
      const updated = await api.updateBook(bookId, formData, true);
      setBooks((prev) => prev.map((b) => (b.id === bookId ? updated : b)));
      addToast(`Книга "${updated.title}" успешно обновлена!`, 'success');
    } else {
      const created = await api.createBook(formData);
      setBooks((prev) => [created, ...prev]);
      addToast(`Книга "${created.title}" успешно добавлена!`, 'success');
    }
  };

  const handleStatusChange = async (bookId, nextStatus) => {
    try {
      const updated = await api.updateBookStatus(bookId, nextStatus);
      setBooks((prev) => prev.map((b) => (b.id === bookId ? updated : b)));
      addToast('Статус книги обновлен', 'info');
    } catch (err) {
      console.error('Failed to update status:', err);
      addToast(err.message || 'Не удалось обновить статус', 'error');
    }
  };

  const handleDeleteBook = async (bookId, title) => {
    if (!window.confirm(`Вы уверены, что хотите удалить книгу "${title}"?`)) {
      return;
    }

    try {
      await api.deleteBook(bookId);
      setBooks((prev) => prev.filter((b) => b.id !== bookId));
      addToast(`Книга "${title}" удалена`, 'info');
    } catch (err) {
      console.error('Failed to delete book:', err);
      addToast(err.message || 'Ошибка при удалении книги', 'error');
    }
  };

  const handleAuthorCreated = (newAuthor) => {
    setAuthors((prev) => [...prev, newAuthor]);
    addToast(`Автор ${newAuthor.firstName} ${newAuthor.lastName} добавлен`, 'success');
  };

  const handleGenreCreated = (newGenre) => {
    setGenres((prev) => [...prev, newGenre]);
    addToast(`Жанр "${newGenre.name}" добавлен`, 'success');
  };

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <div className="brand">
          <div className="brand-icon">
            <Library size={24} />
          </div>
          <div>
            <h1>Book Catalog SPA</h1>
            <p>Управление домашней библиотекой • PostgreSQL & Azure Blob Storage</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button type="button" className="btn btn-primary" onClick={handleOpenCreateModal}>
            <Plus size={18} /> Добавить книгу
          </button>
        </div>
      </header>

      {/* Filters and search */}
      <BookFilters
        filters={filters}
        onFilterChange={setFilters}
        authors={authors}
        genres={genres}
      />

      {/* Book List / Cards */}
      <BookList
        books={books}
        loading={loading}
        onEdit={handleOpenEditModal}
        onDelete={handleDeleteBook}
        onStatusChange={handleStatusChange}
        onOpenCreateModal={handleOpenCreateModal}
      />

      {/* Modals */}
      <BookFormModal
        isOpen={isBookModalOpen}
        onClose={() => setIsBookModalOpen(false)}
        onSubmit={handleBookSubmit}
        initialBook={editingBook}
        authors={authors}
        genres={genres}
        onOpenAuthorModal={() => setIsAuthorModalOpen(true)}
        onOpenGenreModal={() => setIsGenreModalOpen(true)}
      />

      <QuickAuthorModal
        isOpen={isAuthorModalOpen}
        onClose={() => setIsAuthorModalOpen(false)}
        onAuthorCreated={handleAuthorCreated}
        api={api}
      />

      <QuickGenreModal
        isOpen={isGenreModalOpen}
        onClose={() => setIsGenreModalOpen(false)}
        onGenreCreated={handleGenreCreated}
        api={api}
      />

      {/* Toast notifications */}
      <Toast toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
export default App;
