CREATE TABLE IF NOT EXISTS authors (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    bio TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS genres (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT
);

CREATE TABLE IF NOT EXISTS books (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    author_id INT NOT NULL REFERENCES authors(id) ON DELETE RESTRICT,
    genre_id INT NOT NULL REFERENCES genres(id) ON DELETE RESTRICT,
    year INT NOT NULL CHECK (year >= 0 AND year <= EXTRACT(YEAR FROM CURRENT_TIMESTAMP)),
    status VARCHAR(20) NOT NULL CHECK (status IN ('planned', 'reading', 'completed')),
    description TEXT,
    cover_blob_name VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_books_author_id ON books(author_id);
CREATE INDEX IF NOT EXISTS idx_books_genre_id ON books(genre_id);
CREATE INDEX IF NOT EXISTS idx_books_status ON books(status);

INSERT INTO genres (name, description) VALUES
    ('Фантастика', 'Научная фантастика, космоопера, альтернативная история'),
    ('Детектив', 'Классические детективы, триллеры и расследования'),
    ('Классическая литература', 'Мировая и отечественная классика'),
    ('Фэнтези', 'Магические миры, эпические приключения и мифология'),
    ('Компьютерная литература', 'Программирование, системный дизайн, базы данных')
ON CONFLICT (name) DO NOTHING;

INSERT INTO authors (first_name, last_name, bio) VALUES
    ('Федор', 'Достоевский', 'Великий русский писатель, классик мировой литературы.'),
    ('Артур Конан', 'Дойл', 'Английский писатель, создатель Шерлока Холмса.'),
    ('Мартин', 'Фаулер', 'Специалист по архитектуре ПО, автор книг по рефакторингу.'),
    ('Джордж', 'Оруэлл', 'Английский писатель и публицист, автор романов-антиутопий.'),
    ('Айзек', 'Азимов', 'Писатель-фантаст, популяризатор науки, автор законов робототехники.')
ON CONFLICT DO NOTHING;
