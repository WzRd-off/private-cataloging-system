import { useState } from 'react';
import { IconClose, IconUser } from './icons';

const EMPTY_FORM = { name: '', phone: '', email: '', expected_return_date: '' };

export default function BorrowModal({ open, onClose, onSubmit }) {
  const [form, setForm] = useState(EMPTY_FORM);

  if (!open) return null;

  const handleField = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onSubmit(form);
    setForm(EMPTY_FORM);
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal">
        <button className="modal-close" onClick={onClose}>
          <IconClose />
        </button>

        <h2>Передати книгу</h2>
        <p className="modal-sub">Введіть контактні дані людини, якій передаєте книгу</p>

        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="modal-fg">
            <label htmlFor="borrow-name">Ім'я *</label>
            <input
              id="borrow-name"
              className="modal-input"
              type="text"
              required
              placeholder="Ім'я та прізвище"
              value={form.name}
              onChange={handleField('name')}
              autoFocus
            />
          </div>
          <div className="modal-fg">
            <label htmlFor="borrow-phone">Телефон</label>
            <input
              id="borrow-phone"
              className="modal-input"
              type="tel"
              placeholder="+380 XX XXX XX XX"
              value={form.phone}
              onChange={handleField('phone')}
            />
          </div>
          <div className="modal-fg">
            <label htmlFor="borrow-email">Email</label>
            <input
              id="borrow-email"
              className="modal-input"
              type="email"
              placeholder="example@mail.com"
              value={form.email}
              onChange={handleField('email')}
            />
          </div>
          <div className="modal-fg">
            <label htmlFor="borrow-return-date">Очікувана дата повернення</label>
            <input
              id="borrow-return-date"
              className="modal-input"
              type="date"
              value={form.expected_return_date}
              onChange={handleField('expected_return_date')}
            />
          </div>
          <div className="modal-actions">
            <button type="submit" className="btn btn-primary">
              <IconUser /> Передати
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
