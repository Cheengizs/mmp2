import React, { useState } from 'react';
import { X } from 'lucide-react';

export function QuickAuthorModal({ isOpen, onClose, onAuthorCreated, api }) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [bio, setBio] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    const fieldErrors = {};
    if (!firstName.trim()) fieldErrors.firstName = 'Имя обязательно';
    if (!lastName.trim()) fieldErrors.lastName = 'Фамилия обязательна';

    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      return;
    }

    try {
      setLoading(true);
      const newAuthor = await api.createAuthor({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        bio: bio.trim() || null
      });
      onAuthorCreated(newAuthor);
      setFirstName('');
      setLastName('');
      setBio('');
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
          <h2>Добавить автора</h2>
          <button className="icon-btn" onClick={onClose} type="button">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {errors.general && <div className="form-error">{errors.general}</div>}
            <div className="form-group">
              <label className="form-label">
                Имя <span className="req">*</span>
              </label>
              <input
                type="text"
                className={`form-input ${errors.firstName ? 'has-error' : ''}`}
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="например, Федор"
                autoFocus
              />
              {errors.firstName && <span className="form-error">{errors.firstName}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">
                Фамилия <span className="req">*</span>
              </label>
              <input
                type="text"
                className={`form-input ${errors.lastName ? 'has-error' : ''}`}
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="например, Достоевский"
              />
              {errors.lastName && <span className="form-error">{errors.lastName}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Биография (необязательно)</label>
              <textarea
                className="form-textarea"
                rows="3"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Краткая биография автора..."
              />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Отмена
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Сохранение...' : 'Добавить автора'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
