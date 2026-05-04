import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';

import { booksAPI } from '../services/books';
import { resolveMediaUrl } from '../services/client';
import { useBookStatuses, getBookStatus } from '../constants/bookStatus';
import {
  IconBack,
  IconHeart,
  IconUser,
  IconReturn,
  IconCheck,
  IconBookError,
  IconTrash,
} from '../components/icons';
import BorrowModal from '../components/BorrowModal';
import NotesSection from '../components/NotesSection';
import MainLayout from '../components/layouts/MainLayout';

export default function Book() {
  const { id } = useParams();
  const navigate = useNavigate();
  const statuses = useBookStatuses();

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
      await booksAPI.updateRating(id, rating);
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
      setBook((prev) => ({
        ...prev,
        status: data.status ?? 'В займах',
        lent_to_name: data.lent_to_name ?? form.name,
      }));
      setIsBorrowModalOpen(false);
    } catch {
      console.error('Помилка передачі книги');
    }
  };

  const handleReturn = async () => {
    try {
      const data = await booksAPI.returnBook(id);
      setBook((prev) => ({ ...prev, status: data.status ?? 'Не читав', lent_to_name: null }));
    } catch {
      console.error('Помилка повернення');
    }
  };

  const handleCoverChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) return;
    if (file.size > 5 * 1024 * 1024) return;
    try {
      const data = await booksAPI.uploadCover(id, file);
      setBook((prev) => ({ ...prev, cover_url: data.cover_url }));
      showSaved();
    } catch (err) {
      console.error('Помилка завантаження обкладинки:', err);
    }
  };

  const handleDeleteBook = async () => {
    if (!window.confirm(`Видалити книгу "${book.title}"? Цю дію не можна скасувати.`)) {
      return;
    }
    try {
      await booksAPI.deleteBook(id);
      navigate('/catalog');
    } catch (err) {
      console.error('Помилка видалення книги:', err);
      alert('Не вдалося видалити книгу');
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
      <MainLayout>
        <div className="book-page">
          <div className="page-loader">
            <div className="loader-ring" />
            <span>Завантажуємо книгу…</span>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (notFound || !book) {
    return (
      <MainLayout>
        <div className="book-page">
          <div className="error-container">
            <IconBookError />
            <h2>Книгу не знайдено</h2>
            <p>Можливо, вона була видалена або вказано невірний ідентифікатор.</p>
            <button className="btn btn-primary" onClick={() => navigate('/')}>
              <IconBack /> Повернутись до каталогу
            </button>
          </div>
        </div>
      </MainLayout>
    );
  }

  const displayRating = hoverRating || book.rating || 0;
  const status = getBookStatus(book.status);

  return (
    <MainLayout>
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
          <button
            className="delete-btn"
            onClick={handleDeleteBook}
            title="Видалити книгу"
          >
            <IconTrash />
          </button>
        </div>
      </div>

      <div className="book-main">
        <div className="book-aside">
          <div className="book-cover-wrap">
            {book.cover_url ? (
              <img src={resolveMediaUrl(book.cover_url)} alt={book.title} />
            ) : (
              <div className="cover-placeholder">📖</div>
            )}
            <label className="btn btn-ghost cover-upload-btn">
              {book.cover_url ? 'Замінити обкладинку' : 'Завантажити обкладинку'}
              <input
                type="file"
                accept="image/*"
                onChange={handleCoverChange}
                style={{ display: 'none' }}
              />
            </label>
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
                value={book.status || 'Не читав'}
                onChange={handleStatusChange}
              >
                {statuses.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <span className={`status-badge ${status.detailClass}`}>{status.label}</span>
            </div>

            <div className="manage-row">
              <label>Місце</label>
              {book.status === 'В займах' ? (
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
    </MainLayout>
  );
}
