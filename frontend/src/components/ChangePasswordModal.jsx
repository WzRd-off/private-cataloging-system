import { useState } from 'react';
import { profileAPI } from '../services/profile';
import { IconCheck, IconClose } from '../components/icons';

const ChangePasswordModal = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.newPassword !== formData.confirmPassword) {
      setError('Паролі не збігаються');
      return;
    }

    if (formData.newPassword.length < 6) {
      setError('Пароль повинен містити мінімум 6 символів');
      return;
    }

    setIsSubmitting(true);
    try {
      await profileAPI.changePassword(formData.oldPassword, formData.newPassword);
      setFormData({ oldPassword: '', newPassword: '', confirmPassword: '' });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || 'Помилка зміни пароля. Спробуйте ще раз.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          <IconClose size={18} />
        </button>

        <h2>Змінити пароль</h2>
        <p className="modal-sub">Введіть старий та новий пароль</p>

        {error && <div className="modal-error">{error}</div>}

        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="modal-fg">
            <label htmlFor="modal-old-password">Поточний пароль</label>
            <input
              id="modal-old-password"
              className="modal-input"
              type="password"
              name="oldPassword"
              value={formData.oldPassword}
              onChange={handleChange}
              placeholder="Ваш поточний пароль"
              required
            />
          </div>

          <div className="modal-fg">
            <label htmlFor="modal-new-password">Новий пароль</label>
            <input
              id="modal-new-password"
              className="modal-input"
              type="password"
              name="newPassword"
              value={formData.newPassword}
              onChange={handleChange}
              placeholder="Новий пароль (мін. 6 символів)"
              required
            />
          </div>

          <div className="modal-fg">
            <label htmlFor="modal-confirm-password">Підтвердіть пароль</label>
            <input
              id="modal-confirm-password"
              className="modal-input"
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Повторіть новий пароль"
              required
            />
          </div>

          <div className="modal-actions">
            <button
              type="submit"
              className="btn btn-save"
              disabled={isSubmitting}
            >
              <IconCheck /> {isSubmitting ? 'Збереження...' : 'Змінити'}
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={onClose}
            >
              Скасувати
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChangePasswordModal;
