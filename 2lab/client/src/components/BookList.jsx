import React from 'react';
import { BookCard } from './BookCard.jsx';
import { BookOpen } from 'lucide-react';

export function BookList({ books, loading, onEdit, onDelete, onStatusChange, onOpenCreateModal }) {
  if (loading && (!books || books.length === 0)) {
    return (
      <div className="empty-state">
        <p>Загрузка книг...</p>
      </div>
    );
  }

  if (!books || books.length === 0) {
    return (
      <div className="empty-state">
        <BookOpen className="empty-icon" size={48} />
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: 6 }}>Книги не найдены</h3>
        <p style={{ marginBottom: 16 }}>Попробуйте изменить параметры поиска или добавьте первую книгу в каталог.</p>
        <button type="button" className="btn btn-primary" onClick={onOpenCreateModal}>
          Добавить книгу
        </button>
      </div>
    );
  }

  return (
    <div className="books-grid">
      {books.map((book) => (
        <BookCard
          key={book.id}
          book={book}
          onEdit={onEdit}
          onDelete={onDelete}
          onStatusChange={onStatusChange}
        />
      ))}
    </div>
  );
}
