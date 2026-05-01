
-- Статуси книги
CREATE TABLE book_statuses (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL  -- Не читав, Читаю, Прочитано, В займах
);

-- Роли користувачів
CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(20) UNIQUE NOT NULL -- Користувач, Адмін
);

-- Перелік літературних жанрів
CREATE TABLE genres (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL
);

-- Автори
CREATE TABLE authors (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL
);

-- Дані користувачів
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role_id INT REFERENCES roles(id) ON DELETE SET NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Реєстр людей, яким користувач може позичати книги
CREATE TABLE contacts (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(255)
);

-- Персональні примірники користувачів (поглинає колишню таблицю books)
CREATE TABLE user_books (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    isbn VARCHAR(20),
    description TEXT,
    cover_url TEXT,
    author_id INT REFERENCES authors(id) ON DELETE SET NULL,
    genre_id INT REFERENCES genres(id) ON DELETE SET NULL,
    previous_status_id INT REFERENCES book_statuses(id) DEFAULT NULL,
    status_id INT REFERENCES book_statuses(id),
    rating INT CHECK (rating BETWEEN 1 AND 5),
    is_favorite BOOLEAN DEFAULT FALSE,
    lent_to_contact_id INT REFERENCES contacts(id) ON DELETE SET NULL
);

CREATE TABLE notes (
    id SERIAL PRIMARY KEY,
    user_book_id INT REFERENCES user_books(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO book_statuses (name) VALUES
('Не читав'),
('Читаю'),
('Прочитано'),
('В займах');

INSERT INTO roles (name) VALUES
('Користувач'),
('Адмін');

INSERT INTO genres (name) VALUES
('Фантастика'),
('Детектив'),
('Роман'),
('Наукова література'),
('Біографія'),
('Історія'),
('Психологія'),
('Саморозвиток');