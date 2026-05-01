import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';

import { booksAPI } from '../services/books';
import { BOOK_STATUSES, getBookStatus } from '../constants/bookStatus';
import {
  IconBack,
  IconHeart,
  IconUser,
  IconReturn,
  IconCheck,
  IconBookError,
} from '../components/icons';
import BorrowModal from '../components/BorrowModal';
import NotesSection from '../components/NotesSection';

export default function Book() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [book, setBook] = useState(null);
  const [notes, setNotes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [isBorrowModalOpen, setIsBorrowModalOpen] = useState(false);
  const [savedStatus, setSavedStatus] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);

  const showSaved = () => {
    setSavedStatus(true);
    setTimeout(() => setSavedStatus(false), 2000);
  };

  const fetchBook = useCallback(async () => {
    try {
      setBook(await booksAPI.getBookById(id));
    } catch {
      setNotFound(true);
    }
  }, [id]);

  const fetchNotes = useCallback(async () => {
    try {
      setNotes(await booksAPI.getNotes(id));
    } catch {
      /* нема заміток — не критично */
    }
  }, [id]);

  useEffect(() => {
    Promise.all([fetchBook(), fetchNotes()]).finally(() => setIsLoading(false));
  }, [fetchBook, fetchNotes]);

  const handleStatusChange = async (e) => {
    const status = e.target.value;
    setBook((prev) => ({ ...prev, status }));
    try {
      await booksAPI.updateBook(id, { status });
      showSaved();
    } catch {
      console.error('Помилка зміни статусу');
    }
  };

  const handleRatingChange = async (rating) => {
    setBook((prev) => ({ ...prev, rating }));
    try {
      await booksAPI.updateBook(id, { rating });
      showSaved();
    } catch {
      console.error('Помилка зміни рейтингу');
    }
  };

  const handleToggleFavorite = async () => {
    const next = !book.is_favorite;
    setBook((prev) => ({ ...prev, is_favorite: next }));
    try {
      await booksAPI.toggleFavorite(id, next);
    } catch {
      console.error('Помилка обраного');
    }
  };

  const handleBorrow = async (form) => {
    try {
      const data = await booksAPI.borrowBook(id, form);
      setBook((prev) => ({ ...prev, status: 'lent', lent_to_name: form.name, ...data }));
      setIsBorrowModalOpen(false);
    } catch {
      console.error('Помилка передачі книги');
    }
  };

  const handleReturn = async () => {
    try {
      const data = await booksAPI.returnBook(id);
      setBook((prev) => ({ ...prev, status: data.status ?? 'unread', lent_to_name: null }));
    } catch {
      console.error('Помилка повернення');
    }
  };

  const handleAddNote = async (text) => {
    try {
      const note = await booksAPI.addNote(id, text);
      setNotes((prev) => [note, ...prev]);
    } catch {
      console.error('Помилка додавання замітки');
    }
  };

  if (isLoading) {
    return (
      <div className="book-page">
        <div className="page-loader">
          <div className="loader-ring" />
          <span>Завантажуємо книгу…</span>
        </div>
      </div>
    );
  }

  if (notFound || !book) {
    return (
      <div className="book-page">
        <div className="error-container">
          <IconBookError />
          <h2>Книгу не знайдено</h2>
          <p>Можливо, вона була видалена або вказано невірний ідентифікатор.</p>
          <button className="btn btn-primary" onClick={() => navigate('/catalog')}>
            <IconBack /> Повернутись до каталогу
          </button>
        </div>
      </div>
    );
  }

  const displayRating = hoverRating || book.rating || 0;
  const status = getBookStatus(book.status);

  return (
    <div className="book-page">
      <div className="book-header">
        <Link className="back-btn" to="/catalog">
          <IconBack /> До каталогу
        </Link>

        <div className="book-header-info">
          {book.genre && <span className="book-genre-pill">{book.genre}</span>}
          <h1 className="book-title">{book.title}</h1>
          <p className="book-author">{book.author}</p>
        </div>

        <div className="book-header-actions">
          <button
            className={`fav-btn ${book.is_favorite ? 'active' : ''}`}
            onClick={handleToggleFavorite}
            title={book.is_favorite ? 'Прибрати з обраного' : 'Додати до обраного'}
          >
            <IconHeart filled={book.is_favorite} />
          </button>
        </div>
      </div>

      <div className="book-main">
        <div className="book-aside">
          <div className="book-cover-wrap">
            {book.cover_url ? (
              <img src={book.cover_url} alt={book.title} />
            ) : (
              <div className="cover-placeholder">📖</div>
            )}
          </div>

          <div className="rating-card">
            <p className="rating-label">Ваша оцінка</p>
            <div className="stars">
              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
                  className={`star ${star <= displayRating ? 'active' : ''}`}
                  onClick={() => handleRatingChange(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  role="button"
                  aria-label={`${star} зірок`}
                >
                  ⭐
                </span>
              ))}
            </div>
            <p className={`rating-saved ${savedStatus ? 'show' : ''}`}>✓ Збережено</p>
          </div>
        </div>

        <div className="book-details">
          <div className="details-card">
            <h3>Інформація</h3>
            <div className="meta-grid">
              {book.genre && (
                <div className="meta-item">
                  <label>Жанр</label>
                  <span>{book.genre}</span>
                </div>
              )}
              {book.isbn && (
                <div className="meta-item">
                  <label>ISBN</label>
                  <span>{book.isbn}</span>
                </div>
              )}
              {book.year && (
                <div className="meta-item">
                  <label>Рік видання</label>
                  <span>{book.year}</span>
                </div>
              )}
              {book.pages && (
                <div className="meta-item">
                  <label>Сторінок</label>
                  <span>{book.pages}</span>
                </div>
              )}
            </div>
          </div>

          {book.description && (
            <div className="details-card">
              <h3>Опис</h3>
              <p className="book-description">{book.description}</p>
            </div>
          )}

          <div className="book-management">
            <h3>Управління примірником</h3>

            <div className="manage-row">
              <label>Статус</label>
              <select
                className="status-select"
                value={book.status || 'unread'}
                onChange={handleStatusChange}
              >
                {BOOK_STATUSES.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <span className={`status-badge ${status.detailClass}`}>{status.label}</span>
            </div>

            <div className="manage-row">
              <label>Місце</label>
              {book.status === 'lent' ? (
                <>
                  <div className="borrow-info">
                    <IconUser />
                    <div className="borrow-info-text">
                      Книга у <strong>{book.lent_to_name || 'невідомого'}</strong>
                    </div>
                  </div>
                  <button className="btn btn-danger" onClick={handleReturn}>
                    <IconReturn /> Повернути
                  </button>
                </>
              ) : (
                <button className="btn btn-ghost" onClick={() => setIsBorrowModalOpen(true)}>
                  <IconUser /> Передати другу
                </button>
              )}
            </div>

            {savedStatus && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  color: '#4dd47c',
                  fontSize: '.82rem',
                  marginTop: 4,
                }}
              >
                <IconCheck /> Зміни збережено
              </div>
            )}
          </div>
        </div>
      </div>

      <NotesSection notes={notes} onAdd={handleAddNote} />

      <BorrowModal
        open={isBorrowModalOpen}
        onClose={() => setIsBorrowModalOpen(false)}
        onSubmit={handleBorrow}
      />
    </div>
  );
}
