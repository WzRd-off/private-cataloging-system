import { useState, useEffect, useMemo, useCallback } from 'react';

import { booksAPI } from '../services/books';
import { BOOK_STATUSES } from '../constants/bookStatus';
import { IconSearch, IconGrid, IconList, IconBook } from '../components/icons';
import BookCard from '../components/BookCard';

export default function BookCatalog() {
  const [books, setBooks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterGenre, setFilterGenre] = useState('');

  useEffect(() => {
    const fetchBooks = async () => {
      setIsLoading(true);
      try {
        const data = await booksAPI.getBooks({ status: filterStatus, genre: filterGenre });
        setBooks(data);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBooks();
  }, [filterStatus, filterGenre]);

  const handleToggleFavorite = useCallback(async (userBookId, currentFavoriteStatus) => {
    try {
      await booksAPI.toggleFavorite(userBookId, !currentFavoriteStatus);
      setBooks((prev) =>
        prev.map((b) =>
          b.user_book_id === userBookId ? { ...b, is_favorite: !currentFavoriteStatus } : b,
        ),
      );
    } catch (err) {
      console.error(err);
    }
  }, []);

  const filteredBooks = useMemo(() => {
    if (!searchQuery) return books;
    const q = searchQuery.toLowerCase();
    return books.filter(
      (book) =>
        book.title?.toLowerCase().includes(q) || book.author?.toLowerCase().includes(q),
    );
  }, [books, searchQuery]);

  const genres = useMemo(
    () => [...new Set(books.map((b) => b.genre).filter(Boolean))],
    [books],
  );

  return (
    <div className="catalog-container">
      <div className="catalog-header">
        <h1>
          Моя <span>бібліотека</span>
        </h1>
        <p className="catalog-subtitle">
          {isLoading ? 'Завантаження…' : `${filteredBooks.length} книг`}
        </p>
      </div>

      <div className="catalog-toolbar">
        <div className="search-wrapper">
          <IconSearch />
          <input
            type="text"
            className="search-input"
            placeholder="Пошук за назвою або автором…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <select
          className="filter-select"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="">Усі статуси</option>
          {BOOK_STATUSES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>

        <select
          className="filter-select"
          value={filterGenre}
          onChange={(e) => setFilterGenre(e.target.value)}
        >
          <option value="">Усі жанри</option>
          {genres.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>

        <div className="toolbar-divider" />

        <div className="view-toggle">
          <button
            className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
            onClick={() => setViewMode('grid')}
            title="Сітка"
          >
            <IconGrid />
          </button>
          <button
            className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => setViewMode('list')}
            title="Список"
          >
            <IconList />
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="loader">
          <div className="loader-spinner" />
          <span>Завантажуємо книги…</span>
        </div>
      ) : filteredBooks.length === 0 ? (
        <div className="empty-message">
          <IconBook />
          <h3>Книг не знайдено</h3>
          <p>Спробуйте змінити пошуковий запит або фільтри</p>
        </div>
      ) : (
        <div className={viewMode === 'grid' ? 'books-grid' : 'books-list'}>
          {filteredBooks.map((book, idx) => (
            <BookCard
              key={book.user_book_id}
              book={book}
              index={idx}
              onToggleFavorite={handleToggleFavorite}
            />
          ))}
        </div>
      )}
    </div>
  );
}
