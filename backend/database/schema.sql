
    -- Статуси книги
    CREATE TABLE book_statuses (
        id SERIAL PRIMARY KEY,
        name VARCHAR(50) NOT NULL  -- Не читав, Читаю, Прочитано, В займах
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
        status VARCHAR(50) NOT NULL DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Реєстр людей, яким користувач може позичати книги
    CREATE TABLE contacts (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        phone VARCHAR(255),
        expected_return_date DATE
    );

    -- Персональні примірники користувачів
    CREATE TABLE user_books (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        isbn VARCHAR(20),
        description TEXT,
        cover_url TEXT,
        publication_year INT,
        author_id INT REFERENCES authors(id) ON DELETE SET NULL,
        genre_id INT REFERENCES genres(id) ON DELETE SET NULL,
        previous_status_id INT REFERENCES book_statuses(id) DEFAULT NULL,
        status_id INT REFERENCES book_statuses(id),
        rating INT CHECK (rating BETWEEN 1 AND 5) DEFAULT NULL,
        is_favorite BOOLEAN DEFAULT FALSE,
        lent_to_contact_id INT REFERENCES contacts(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE notes (
        id SERIAL PRIMARY KEY,
        user_book_id INT REFERENCES user_books(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE notifications (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(id) NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    INSERT INTO book_statuses (name) VALUES
    ('Не читав'),
    ('Читаю'),
    ('Прочитано'),
    ('В займах');

    INSERT INTO genres (name) VALUES
    ('Фантастика'),
    ('Детектив'),
    ('Роман'),
    ('Наукова література'),
    ('Біографія'),
    ('Історія'),
    ('Психологія'),
    ('Саморозвиток');

    INSERT INTO authors (name) VALUES
    ('Айзек Азімов'),
    ('Агата Крісті'),
    ('Джордж Орвелл'),
    ('Деніел Канеман'),
    ('Стівен Кові');

    INSERT INTO users (name, email, phone, password_hash, status) VALUES
    ('Владислав', 'vladyslav@example.com', '+380501112233', '$2b$10$C3WMFGeoP3lECIZOOdf.d.fXzoro3EPLE.jLYvYDLEpLUj/CiLJEG', 'active'),
    ('Олена Коваль', 'olena@example.com', '+380502223344', '$2b$10$zi8u5xLoP8uq3IhDgU5K5ONHooAGe485gy3BtOCaaoQcw1Q1W.UwS', 'active'),
    ('Адмін Системи', 'admin@example.com', '+380503334455', '$2b$10$v5q.qHHeWsMvscp9WXHq8uMxqt8QVCdWx2sHnMUxfBveJ4fHLsiSu', 'active');

    INSERT INTO contacts (user_id, name, email, phone, expected_return_date) VALUES
    (1, 'Андрій Мельник', 'andriy.melnyk@example.com', '+380671234567', CURRENT_DATE + INTERVAL '7 day'),
    (1, 'Марія Шевченко', 'maria.shevchenko@example.com', '+380681234568', CURRENT_DATE + INTERVAL '14 day'),
    (2, 'Сергій Бондар', 'serhii.bondar@example.com', '+380691234569', CURRENT_DATE + INTERVAL '10 day');

    INSERT INTO user_books (
        user_id,
        title,
        isbn,
        description,
        cover_url,
        publication_year,
        author_id,
        genre_id,
        previous_status_id,
        status_id,
        rating,
        is_favorite,
        lent_to_contact_id
    ) VALUES
    (1, 'Фундація', '9780553803710', 'Класичний цикл наукової фантастики.', 'https://example.com/covers/foundation.jpg', 1951, 1, 1, NULL, 2, 5, TRUE, NULL),
    (1, 'Вбивство у Східному експресі', '9780007119318', 'Еркюль Пуаро розслідує загадкове вбивство.', 'https://example.com/covers/orient-express.jpg', 1934, 2, 2, 2, 4, 4, FALSE, 1),
    (1, '1984', '9780452284234', 'Антиутопія про тоталітарне суспільство.', 'https://example.com/covers/1984.jpg', 1949, 3, 3, 1, 3, 5, TRUE, NULL),
    (2, 'Мислення швидке й повільне', '9780374275631', 'Книга про дві системи мислення.', 'https://example.com/covers/thinking-fast-slow.jpg', 2011, 4, 7, NULL, 2, NULL, FALSE, NULL),
    (2, '7 звичок надзвичайно ефективних людей', '9781982139479', 'Практичні принципи особистої ефективності.', 'https://example.com/covers/7-habits.jpg', 1989, 5, 8, 2, 4, 5, TRUE, 3);

    INSERT INTO notes (user_book_id, content) VALUES
    (1, 'Початок дуже захопливий, гарна побудова світу.'),
    (1, 'Перечитати розділ про Селдона перед обговоренням у клубі.'),
    (3, 'Сильна атмосфера контролю та пропаганди, актуально і сьогодні.'),
    (4, 'Корисно виписати приклади когнітивних упереджень.');

    INSERT INTO notifications (user_id, title, message, is_read) VALUES
    (1, 'Нагадування про повернення', 'Книгу "Вбивство у Східному експресі" очікують повернути через 7 днів.', FALSE),
    (1, 'Нова замітка додана', 'Ви додали нову замітку до книги "Фундація".', TRUE),
    (2, 'Книга в займах', 'Книгу "7 звичок надзвичайно ефективних людей" позичено контакту Сергій Бондар.', FALSE);