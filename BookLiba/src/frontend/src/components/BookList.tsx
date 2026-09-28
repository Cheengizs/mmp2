import React from 'react';
import type { Book } from '../types';

interface BookListProps {
  books: Book[];
  apiBase: string;
  onEdit: (book: Book) => void;
  onDelete: (id: number) => void;
}

export const BookList: React.FC<BookListProps> = ({
  books,
  apiBase,
  onEdit,
  onDelete,
}) => {
  return (
    <div>
      <h2 style={styles.sectionHeader}>
        Каталог ({books.length})
      </h2>

      {books.length === 0 ? (
        <div style={styles.emptyNotice}>Список книг пуст.</div>
      ) : (
        <div style={styles.list}>
          {books.map((book) => (
            <div key={book.id} style={styles.bookCard}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                {book.cover_url ? (
                  <img
                    src={`${apiBase}${book.cover_url}`}
                    alt={book.title}
                    style={styles.coverImage}
                  />
                ) : (
                  <div style={styles.noCoverPlaceholder}>Нет фото</div>
                )}
                <div>
                  <h3 style={styles.bookTitle}>{book.title}</h3>
                  <p style={styles.bookAuthor}>
                    Автор: <span style={{ color: '#e5e7eb' }}>{book.author}</span>
                  </p>
                  <p style={styles.bookYear}>Год: {book.year || 'Не указан'}</p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => onEdit(book)} style={styles.editButton}>
                  Изменить
                </button>
                <button onClick={() => onDelete(book.id)} style={styles.deleteButton}>
                  Удалить
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  sectionHeader: {
    fontSize: 18,
    fontWeight: 600,
    color: '#f9fafb',
    borderBottom: '1px solid #2e2e38',
    paddingBottom: 12,
    marginTop: 36,
  },
  emptyNotice: {
    color: '#9ca3af',
    textAlign: 'center',
    padding: '30px 0',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    marginTop: 16,
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
