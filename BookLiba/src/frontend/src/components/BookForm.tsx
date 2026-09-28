import React, { useRef } from 'react';

interface BookFormProps {
  title: string;
  setTitle: (val: string) => void;
  author: string;
  setAuthor: (val: string) => void;
  year: string;
  setYear: (val: string) => void;
  setFile: (file: File | null) => void;
  editingId: number | null;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}

export const BookForm: React.FC<BookFormProps> = ({
  title,
  setTitle,
  author,
  setAuthor,
  year,
  setYear,
  setFile,
  editingId,
  onSubmit,
  onCancel,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleCancelClick = () => {
    if (fileInputRef.current) fileInputRef.current.value = '';
    onCancel();
  };

  return (
    <form onSubmit={onSubmit} style={styles.card}>
      <h2 style={styles.sectionTitle}>
        {editingId ? `Редактирование книги (ID: ${editingId})` : 'Добавить новую книгу'}
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
          {editingId ? 'Сохранить изменения' : 'Добавить книгу'}
        </button>
        {editingId && (
          <button type="button" onClick={handleCancelClick} style={styles.cancelButton}>
            Отмена
          </button>
        )}
      </div>
    </form>
  );
};

const styles: Record<string, React.CSSProperties> = {
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
};
