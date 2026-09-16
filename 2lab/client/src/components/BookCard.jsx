import React, { useState } from 'react';
import { BookOpen, Edit2, Trash2, Clock, CheckCircle2, Bookmark } from 'lucide-react';

const STATUS_CONFIG = {
  planned: {
    label: 'В планах',
    className: 'status-planned',
    icon: Bookmark
  },
  reading: {
    label: 'Читаю',
    className: 'status-reading',
    icon: Clock
  },
  completed: {
    label: 'Прочитано',
    className: 'status-completed',
    icon: CheckCircle2
  }
};

export function BookCard({ book, onEdit, onDelete, onStatusChange }) {
  const [statusLoading, setStatusLoading] = useState(false);
  const statusInfo = STATUS_CONFIG[book.status] || STATUS_CONFIG.planned;
  const StatusIcon = statusInfo.icon;

  const handleStatusClick = async () => {
    const nextStatusMap = {
      planned: 'reading',
      reading: 'completed',
      completed: 'planned'
    };
    const nextStatus = nextStatusMap[book.status] || 'reading';

    try {
      setStatusLoading(true);
      await onStatusChange(book.id, nextStatus);
    } finally {
      setStatusLoading(false);
    }
  };

  return (
    <div className="book-card">
      <div className="book-cover-wrap">
        {book.coverUrl ? (
          <img
            src={book.coverUrl}
            alt={`Обложка книги ${book.title}`}
            className="book-cover-img"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
        ) : null}

        <div
          className="book-cover-placeholder"
          style={{ display: book.coverUrl ? 'none' : 'flex' }}
        >
          <BookOpen size={48} strokeWidth={1.5} />
          <span>Нет обложки</span>
        </div>

        {book.genre && <span className="genre-tag">{book.genre.name}</span>}
      </div>

      <div className="book-body">
        <div className="book-meta-top">
          <span className="book-year">{book.year} г.</span>
        </div>

        <h3 className="book-title" title={book.title}>
          {book.title}
        </h3>

        <div className="book-author">
          {book.author ? `${book.author.firstName} ${book.author.lastName}` : 'Неизвестный автор'}
        </div>

        <p className="book-description">
          {book.description || 'Нет описания.'}
        </p>

        <div className="book-footer">
          <button
            type="button"
            className={`status-badge ${statusInfo.className}`}
            onClick={handleStatusClick}
            disabled={statusLoading}
            title="Нажмите для смены статуса (Запланировано -> Читаю -> Прочитано)"
          >
            <StatusIcon size={13} />
            <span>{statusLoading ? '...' : statusInfo.label}</span>
          </button>

          <div className="card-actions">
            <button
              type="button"
              className="icon-btn"
              onClick={() => onEdit(book)}
              title="Редактировать книгу"
            >
              <Edit2 size={15} />
            </button>
            <button
              type="button"
              className="icon-btn icon-btn-danger"
              onClick={() => onDelete(book.id, book.title)}
              title="Удалить книгу"
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
