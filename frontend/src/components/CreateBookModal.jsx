import { useState, useEffect, useMemo } from 'react';
import { booksAPI } from '../services/books';
import { useBookStatuses } from '../constants/bookStatus';
import { useAuthors, useGenres, invalidateAuthors, invalidateGenres } from '../hooks/useBookMetadata';
import { IconClose, IconPlus } from './icons';

const EMPTY_FORM = {
  title: '',
  isbn: '',
  description: '',
  author_name: '',
  genre_name: '',
  status: 'Не читав',
  rating: '',
  is_favorite: false,
};

export default function CreateBookModal({ open, onClose, onSuccess }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState('');
  const authors = useAuthors();
  const genres = useGenres();
  const statuses = useBookStatuses();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const selectableStatuses = useMemo(
    () => statuses.filter((s) => s.value !== 'В займах'),
    [statuses],
  );

  useEffect(() => {
    if (!open) return;
    setForm((prev) => ({
      ...EMPTY_FORM,
      status: statuses[0]?.value ?? prev.status,
    }));
    setCoverFile(null);
    setCoverPreview('');
    setError('');
  }, [open, statuses]);

  useEffect(() => {
    if (!coverFile) {
      setCoverPreview('');
      return;
    }
    const url = URL.createObjectURL(coverFile);
    setCoverPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [coverFile]);

  if (!open) return null;

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Дозволені тільки зображення');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Розмір зображення не повинен перевищувати 5 МБ');
      return;
    }
    setError('');
    setCoverFile(file);
  };

  const set = (field) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      setError("Назва книги обов'язкова");
      return;
    }
    setIsSubmitting(true);
    setError('');
    try {
      // Resolve text names to IDs — null if no match (new value or left blank)
      const author_id = authors.find((a) => a.name === form.author_name)?.id ?? null;
      const genre_id = genres.find((g) => g.name === form.genre_name)?.id ?? null;

      const payload = {
        title: form.title.trim(),
        isbn: form.isbn.trim() || null,
        description: form.description.trim() || null,
        author_id,
        genre_id,
        status: form.status,
        rating: form.rating ? Number(form.rating) : null,
        is_favorite: form.is_favorite,
      };
      const result = await booksAPI.createBook(payload, coverFile);
      if (form.author_name && author_id === null) invalidateAuthors();
      if (form.genre_name && genre_id === null) invalidateGenres();
      onSuccess?.(result);
      onClose();
    } catch (err) {
      setError(err.message || 'Помилка збереження');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal modal--wide">
        <button className="modal-close" onClick={onClose} aria-label="Закрити">
          <IconClose />
        </button>

        <h2>Додати книгу</h2>
        <p className="modal-sub">Заповніть інформацію про нову книгу</p>

        {error && <div className="modal-error">{error}</div>}

        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="modal-grid-2">

            <div className="modal-fg modal-fg--full">
              <label htmlFor="cb-title">Назва *</label>
              <input
                id="cb-title"
                className="modal-input"
                type="text"
                required
                placeholder="Назва книги"
                value={form.title}
                onChange={set('title')}
                autoFocus
              />
            </div>

            <div className="modal-fg">
              <label htmlFor="cb-author">Автор</label>
              <div className="datalist-wrapper">
                <input
                  id="cb-author"
                  className="modal-input datalist-input"
                  list="cb-authors-list"
                  placeholder="Почніть вводити або оберіть…"
                  value={form.author_name}
                  onChange={set('author_name')}
                  autoComplete="off"
                />
                <datalist id="cb-authors-list">
                  {authors.map((a) => (
                    <option key={a.id} value={a.name} />
                  ))}
                </datalist>
              </div>
            </div>

            <div className="modal-fg">
              <label htmlFor="cb-genre">Жанр</label>
              <div className="datalist-wrapper">
                <input
                  id="cb-genre"
                  className="modal-input datalist-input"
                  list="cb-genres-list"
                  placeholder="Почніть вводити або оберіть…"
                  value={form.genre_name}
                  onChange={set('genre_name')}
                  autoComplete="off"
                />
                <datalist id="cb-genres-list">
                  {genres.map((g) => (
                    <option key={g.id} value={g.name} />
                  ))}
                </datalist>
              </div>
            </div>

            <div className="modal-fg">
              <label htmlFor="cb-isbn">ISBN</label>
              <input
                id="cb-isbn"
                className="modal-input"
                type="text"
                placeholder="978-3-16-148410-0"
                value={form.isbn}
                onChange={set('isbn')}
              />
            </div>

            <div className="modal-fg">
              <label htmlFor="cb-status">Статус</label>
              <select
                id="cb-status"
                className="modal-input"
                value={form.status}
                onChange={set('status')}
              >
                {selectableStatuses.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>

            <div className="modal-fg modal-fg--full">
              <label>Обкладинка</label>
              <div className="cover-upload">
                {coverPreview ? (
                  <img src={coverPreview} alt="Прев'ю обкладинки" className="cover-upload-preview" />
                ) : (
                  <div className="cover-upload-placeholder">📖</div>
                )}
                <div className="cover-upload-controls">
                  <label htmlFor="cb-cover" className="btn btn-secondary cover-upload-btn">
                    {coverFile ? 'Замінити файл' : 'Обрати файл'}
                  </label>
                  <input
                    id="cb-cover"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="cover-upload-input"
                  />
                  <span className="cover-upload-name">
                    {coverFile ? coverFile.name : 'Файл не обрано'}
                  </span>
                  {coverFile && (
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() => setCoverFile(null)}
                    >
                      Прибрати
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="modal-fg modal-fg--full">
              <label htmlFor="cb-desc">Опис</label>
              <textarea
                id="cb-desc"
                className="modal-input modal-textarea"
                placeholder="Короткий опис книги…"
                value={form.description}
                onChange={set('description')}
                rows={3}
              />
            </div>

          </div>

          <div className="modal-actions">
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              <IconPlus /> {isSubmitting ? 'Зберігаємо…' : 'Додати книгу'}
            </button>
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Скасувати
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
