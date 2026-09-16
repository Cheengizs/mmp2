import React from 'react';
import { Search, RotateCcw } from 'lucide-react';

export function BookFilters({
  filters,
  onFilterChange,
  authors = [],
  genres = []
}) {
  const hasActiveFilters =
    Boolean(filters.search) ||
    Boolean(filters.authorId) ||
    Boolean(filters.genreId) ||
    Boolean(filters.status);

  const handleReset = () => {
    onFilterChange({
      search: '',
      authorId: '',
      genreId: '',
      status: ''
    });
  };

  return (
    <div className="filters-container">
      <div className="search-row">
        <div className="search-input-wrapper">
          <Search className="search-icon" size={18} />
          <input
            type="text"
            className="search-input"
            placeholder="Поиск по названию, автору или описанию книги..."
            value={filters.search || ''}
            onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
          />
        </div>
      </div>

      <div className="filters-row">
        {/* Author filter */}
        <select
          className="filter-select"
          value={filters.authorId || ''}
          onChange={(e) => onFilterChange({ ...filters, authorId: e.target.value })}
        >
          <option value="">Все авторы</option>
          {authors.map((author) => (
            <option key={author.id} value={author.id}>
              {author.lastName} {author.firstName}
            </option>
          ))}
        </select>

        {/* Genre filter */}
        <select
          className="filter-select"
          value={filters.genreId || ''}
          onChange={(e) => onFilterChange({ ...filters, genreId: e.target.value })}
        >
          <option value="">Все жанры</option>
          {genres.map((genre) => (
            <option key={genre.id} value={genre.id}>
              {genre.name}
            </option>
          ))}
        </select>

        {/* Status Pills */}
        <div className="status-pills">
          <button
            type="button"
            className={`status-pill-btn ${!filters.status ? 'active' : ''}`}
            onClick={() => onFilterChange({ ...filters, status: '' })}
          >
            Все
          </button>
          <button
            type="button"
            className={`status-pill-btn ${filters.status === 'planned' ? 'active' : ''}`}
            onClick={() => onFilterChange({ ...filters, status: 'planned' })}
          >
            В планах
          </button>
          <button
            type="button"
            className={`status-pill-btn ${filters.status === 'reading' ? 'active' : ''}`}
            onClick={() => onFilterChange({ ...filters, status: 'reading' })}
          >
            Читаю
          </button>
          <button
            type="button"
            className={`status-pill-btn ${filters.status === 'completed' ? 'active' : ''}`}
            onClick={() => onFilterChange({ ...filters, status: 'completed' })}
          >
            Прочитано
          </button>
        </div>

        {/* Reset button */}
        {hasActiveFilters && (
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handleReset}
            style={{ marginLeft: 'auto' }}
          >
            <RotateCcw size={14} /> Сбросить фильтры
          </button>
        )}
      </div>
    </div>
  );
}
