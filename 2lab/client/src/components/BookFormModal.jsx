import React, { useState, useEffect, useRef } from 'react';
import { X, Upload, Plus, Trash2, Image as ImageIcon } from 'lucide-react';

export function BookFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialBook = null,
  authors = [],
  genres = [],
  onOpenAuthorModal,
  onOpenGenreModal
}) {
  const isEditing = Boolean(initialBook);

  const [title, setTitle] = useState('');
  const [authorId, setAuthorId] = useState('');
  const [genreId, setGenreId] = useState('');
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [status, setStatus] = useState('planned');
  const [description, setDescription] = useState('');
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [existingCoverUrl, setExistingCoverUrl] = useState(null);

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const fileInputRef = useRef(null);

  useEffect(() => {
    if (initialBook) {
      setTitle(initialBook.title || '');
      setAuthorId(initialBook.authorId ? initialBook.authorId.toString() : '');
      setGenreId(initialBook.genreId ? initialBook.genreId.toString() : '');
      setYear(initialBook.year ? initialBook.year.toString() : '');
      setStatus(initialBook.status || 'planned');
      setDescription(initialBook.description || '');
      setExistingCoverUrl(initialBook.coverUrl || null);
      setCoverFile(null);
      setCoverPreview(null);
    } else {
      setTitle('');
      setAuthorId(authors[0]?.id?.toString() || '');
      setGenreId(genres[0]?.id?.toString() || '');
      setYear(new Date().getFullYear().toString());
      setStatus('planned');
      setDescription('');
      setCoverFile(null);
      setCoverPreview(null);
      setExistingCoverUrl(null);
    }
    setErrors({});
  }, [initialBook, isOpen, authors, genres]);

  useEffect(() => {
    return () => {
      if (coverPreview && coverPreview.startsWith('blob:')) {
        URL.revokeObjectURL(coverPreview);
      }
    };
  }, [coverPreview]);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      setErrors((prev) => ({ ...prev, cover: 'Разрешены только файлы JPEG, PNG, WEBP' }));
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, cover: 'Файл слишком большой. Максимум 5 МБ' }));
      return;
    }

    setErrors((prev) => {
      const next = { ...prev };
      delete next.cover;
      return next;
    });

    setCoverFile(file);
    const objectUrl = URL.createObjectURL(file);
    setCoverPreview(objectUrl);
  };

  const handleRemoveCover = (e) => {
    e.stopPropagation();
    setCoverFile(null);
    if (coverPreview && coverPreview.startsWith('blob:')) {
      URL.revokeObjectURL(coverPreview);
    }
    setCoverPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    const clientErrors = {};
    if (!title.trim()) clientErrors.title = 'Название обязательно';
    if (!authorId) clientErrors.authorId = 'Выберите автора';
    if (!genreId) clientErrors.genreId = 'Выберите жанр';
    const parsedYear = parseInt(year, 10);
    if (isNaN(parsedYear) || parsedYear < 0 || parsedYear > new Date().getFullYear()) {
      clientErrors.year = `Год должен быть от 0 до ${new Date().getFullYear()}`;
    }

    if (Object.keys(clientErrors).length > 0) {
      setErrors(clientErrors);
      return;
    }

    const formData = new FormData();
    formData.append('title', title.trim());
    formData.append('authorId', authorId);
    formData.append('genreId', genreId);
    formData.append('year', year);
    formData.append('status', status);
    formData.append('description', description.trim());

    if (coverFile) {
      formData.append('cover', coverFile);
    }

    try {
      setLoading(true);
      await onSubmit(formData, initialBook?.id);
      onClose();
    } catch (err) {
      if (err.errors) {
        setErrors(err.errors);
      } else {
        setErrors({ general: err.message || 'Ошибка сохранения книги' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isEditing ? 'Редактировать книгу' : 'Добавить книгу в каталог'}</h2>
          <button className="icon-btn" onClick={onClose} type="button">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {errors.general && (
              <div className="form-error" style={{ fontSize: '0.9rem', marginBottom: 8 }}>
                {errors.general}
              </div>
            )}

            {/* Title */}
            <div className="form-group">
              <label className="form-label">
                Название книги <span className="req">*</span>
              </label>
              <input
                type="text"
                className={`form-input ${errors.title ? 'has-error' : ''}`}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="например, Преступление и наказание"
                autoFocus
              />
              {errors.title && <span className="form-error">{errors.title}</span>}
            </div>

            {/* Author */}
            <div className="form-group">
              <label className="form-label">
                Автор <span className="req">*</span>
              </label>
              <div className="select-with-btn">
                <select
                  className={`form-select ${errors.authorId ? 'has-error' : ''}`}
                  value={authorId}
                  onChange={(e) => setAuthorId(e.target.value)}
                >
                  <option value="">-- Выберите автора --</option>
                  {authors.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.lastName} {a.firstName}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={onOpenAuthorModal}
                  title="Добавить нового автора"
                >
                  <Plus size={16} /> Новый
                </button>
              </div>
              {errors.authorId && <span className="form-error">{errors.authorId}</span>}
            </div>

            {/* Genre */}
            <div className="form-group">
              <label className="form-label">
                Жанр <span className="req">*</span>
              </label>
              <div className="select-with-btn">
                <select
                  className={`form-select ${errors.genreId ? 'has-error' : ''}`}
                  value={genreId}
                  onChange={(e) => setGenreId(e.target.value)}
                >
                  <option value="">-- Выберите жанр --</option>
                  {genres.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={onOpenGenreModal}
                  title="Добавить новый жанр"
                >
                  <Plus size={16} /> Новый
                </button>
              </div>
              {errors.genreId && <span className="form-error">{errors.genreId}</span>}
            </div>

            {/* Year & Status */}
            <div className="form-row-2">
              <div className="form-group">
                <label className="form-label">
                  Год издания <span className="req">*</span>
                </label>
                <input
                  type="number"
                  className={`form-input ${errors.year ? 'has-error' : ''}`}
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  min="0"
                  max={new Date().getFullYear()}
                />
                {errors.year && <span className="form-error">{errors.year}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">
                  Статус <span className="req">*</span>
                </label>
                <select
                  className={`form-select ${errors.status ? 'has-error' : ''}`}
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="planned">Запланировано</option>
                  <option value="reading">Читаю</option>
                  <option value="completed">Прочитано</option>
                </select>
                {errors.status && <span className="form-error">{errors.status}</span>}
              </div>
            </div>

            {/* Description */}
            <div className="form-group">
              <label className="form-label">Описание / Заметки</label>
              <textarea
                className="form-textarea"
                rows="3"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Краткое описание сюжета, впечатления или цитаты..."
              />
            </div>

            {/* Cover Upload */}
            <div className="form-group">
              <label className="form-label">Обложка книги (Azure Blob Storage)</label>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />

              {coverPreview ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div className="dropzone-preview">
                    <img src={coverPreview} alt="Превью новой обложки" />
                    <button
                      type="button"
                      className="dropzone-remove-btn"
                      onClick={handleRemoveCover}
                      title="Удалить выбранный файл"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    <div>Новый файл: <strong>{coverFile?.name}</strong></div>
                    <div>Размер: {Math.round((coverFile?.size || 0) / 1024)} КБ</div>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      style={{ marginTop: 8 }}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Заменить файл
                    </button>
                  </div>
                </div>
              ) : existingCoverUrl ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div className="dropzone-preview">
                    <img src={existingCoverUrl} alt="Текущая обложка книги" />
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    <div>Текущая обложка загружена в Azure Blob Storage.</div>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      style={{ marginTop: 8 }}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload size={14} /> Загрузить новую
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  className="dropzone"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload size={28} style={{ color: 'var(--primary)', marginBottom: 6 }} />
                  <div style={{ fontWeight: 500, fontSize: '0.88rem' }}>
                    Нажмите для выбора файла или перетащите сюда
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
                    PNG, JPEG или WEBP до 5 МБ
                  </div>
                </div>
              )}

              {errors.cover && <span className="form-error">{errors.cover}</span>}
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Отмена
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Сохранение...' : isEditing ? 'Сохранить изменения' : 'Создать книгу'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
