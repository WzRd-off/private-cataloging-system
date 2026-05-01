import { Link } from 'react-router-dom';
import { IconArrow, IconHeart } from './icons';
import { getBookStatus } from '../constants/bookStatus';
import { resolveMediaUrl } from '../services/client';

export default function BookCard({ book, index = 0, onToggleFavorite }) {
  const status = getBookStatus(book.status);

  return (
    <div className="book-card" style={{ animationDelay: `${index * 0.04}s` }}>
      <div className="book-cover">
        {book.cover_url ? (
          <img src={resolveMediaUrl(book.cover_url)} alt={book.title} loading="lazy" />
        ) : (
          <div className="cover-placeholder">📖</div>
        )}
      </div>

      <div className="book-info">
        <div className="book-title">{book.title}</div>
        <div className="book-author">{book.author}</div>

        <div className="book-badges">
          {book.genre && <span className="badge badge-genre">{book.genre}</span>}
          <span className={`badge ${status.catalogClass}`}>{status.label}</span>
        </div>

        <div className="book-actions">
          <button
            className={`favorite-btn ${book.is_favorite ? 'active' : ''}`}
            onClick={() => onToggleFavorite(book.user_book_id, book.is_favorite)}
            title={book.is_favorite ? 'Прибрати з обраного' : 'Додати до обраного'}
          >
            <IconHeart filled={book.is_favorite} size={15} />
            {book.is_favorite ? 'Обране' : 'В обране'}
          </button>

          <Link className="details-link" to={`/book/${book.user_book_id}`}>
            Детальніше <IconArrow />
          </Link>
        </div>
      </div>
    </div>
  );
}
