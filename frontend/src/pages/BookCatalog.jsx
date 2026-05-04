import { useState, useEffect, useMemo, useCallback } from 'react';

import { booksAPI } from '../services/books';
import { profileAPI } from '../services/profile';
import { useBookStatuses } from '../constants/bookStatus';
import { useGenres } from '../hooks/useBookMetadata';
import { IconSearch, IconGrid, IconList, IconBook } from '../components/icons';
import BookCard from '../components/BookCard';
import CreateBookModal from '../components/CreateBookModal';
import MainLayout from '../components/layouts/MainLayout';

function AddBookCard({ onClick }) {
  return (
    <button className="add-book-card" onClick={onClick} aria-label="Додати книгу">
      <div className="add-book-icon">+</div>
      <span className="add-book-label">Додати книгу</span>
    </button>
  );
}

export default function BookCatalog() {
  const statuses = useBookStatuses();
  const genres = useGenres();
  const [books, setBooks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterGenre, setFilterGenre] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const fetchBooks = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await booksAPI.getBooks({ status: filterStatus, genre: filterGenre });
      setBooks(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [filterStatus, filterGenre]);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

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

  const handleBookCreated = useCallback(() => {
    fetchBooks();
  }, [fetchBooks]);

  const handleExport = async (format) => {
    setIsExporting(true);
    try {
      await profileAPI.exportBooks(format);
    } catch (err) {
      console.error('Export error:', err);
      alert('Помилка при експорті файлу');
    } finally {
      setIsExporting(false);
    }
  };

  const filteredBooks = useMemo(() => {
    if (!searchQuery) return books;
    const q = searchQuery.toLowerCase();
    return books.filter(
      (book) =>
        book.title?.toLowerCase().includes(q) || book.author?.toLowerCase().includes(q),
    );
  }, [books, searchQuery]);

  return (
    <MainLayout>
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
            {statuses.map((s) => (
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
              <option key={g.id} value={g.name}>
                {g.name}
              </option>
            ))}
          </select>

          <div className="toolbar-divider" />

          <div className="export-buttons">
            <button
              onClick={() => handleExport('csv')}
              disabled={isExporting}
              title="Експорт CSV"
              className="btn btn-secondary"
            >
              📥 CSV
            </button>
            <button
              onClick={() => handleExport('pdf')}
              disabled={isExporting}
              title="Експорт PDF"
              className="btn btn-secondary"
            >
              📄 PDF
            </button>
          </div>

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

        <div className={viewMode === 'grid' ? 'books-grid' : 'books-list'}>
          <AddBookCard onClick={() => setIsCreateModalOpen(true)} />

          {isLoading ? (
            <div
              style={{
                gridColumn: '1 / -1',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                color: 'var(--text-muted)',
                padding: '32px 0',
              }}
            >
              <div className="loader-spinner" />
              <span>Завантажуємо книги…</span>
            </div>
          ) : (
            filteredBooks.map((book, idx) => (
              <BookCard
                key={book.user_book_id}
                book={book}
                index={idx + 1}
                onToggleFavorite={handleToggleFavorite}
              />
            ))
          )}
        </div>

        {!isLoading && filteredBooks.length === 0 && (
          <div className="empty-message">
            <IconBook />
            <h3>Книг не знайдено</h3>
            <p>Спробуйте змінити пошуковий запит або натисніть «+» щоб додати першу книгу</p>
          </div>
        )}

        <CreateBookModal
          open={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={handleBookCreated}
        />
      </div>
    </MainLayout>
  );
}
