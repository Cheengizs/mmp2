import React, { useState } from 'react';
import { X } from 'lucide-react';

export function QuickGenreModal({ isOpen, onClose, onGenreCreated, api }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    if (!name.trim()) {
      setErrors({ name: 'Название жанра обязательно' });
      return;
    }

    try {
      setLoading(true);
      const newGenre = await api.createGenre({
        name: name.trim(),
        description: description.trim() || null
      });
      onGenreCreated(newGenre);
      setName('');
      setDescription('');
      onClose();
    } catch (err) {
      if (err.errors) {
        setErrors(err.errors);
      } else {
        setErrors({ general: err.message });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 440 }}>
        <div className="modal-header">
          <h2>Добавить жанр</h2>
          <button className="icon-btn" onClick={onClose} type="button">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {errors.general && <div className="form-error">{errors.general}</div>}
            <div className="form-group">
              <label className="form-label">
                Название <span className="req">*</span>
              </label>
              <input
                type="text"
                className={`form-input ${errors.name ? 'has-error' : ''}`}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="например, Детектив"
                autoFocus
              />
              {errors.name && <span className="form-error">{errors.name}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Описание (необязательно)</label>
              <textarea
                className="form-textarea"
                rows="3"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Описание жанра..."
              />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Отмена
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Сохранение...' : 'Добавить жанр'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
