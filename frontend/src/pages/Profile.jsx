import { useState, useEffect, useRef } from 'react';

import { profileAPI } from '../services/profile';
import { IconEdit, IconCheck, IconClose } from '../components/icons';
import { formatDate, getInitials } from '../utils/format';

const EMPTY_USER = { name: '', email: '', phone: '', created_at: '' };
const MESSAGE_TIMEOUT = 3500;

export default function Profile() {
  const [userData, setUserData] = useState(EMPTY_USER);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState({ text: '', type: '' });

  const originalData = useRef(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await profileAPI.getMyProfile();
        setUserData(data);
        originalData.current = data;
      } catch (err) {
        console.error(err);
        setMessage({ text: 'Помилка завантаження профілю', type: 'error' });
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const flashMessage = (text, type) => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), MESSAGE_TIMEOUT);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUserData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      const { name, email, phone } = userData;
      const updated = await profileAPI.updateProfile(name, email, phone);
      setUserData(updated);
      originalData.current = updated;
      setIsEditing(false);
      flashMessage('Профіль успішно оновлено', 'success');
    } catch (err) {
      console.error(err);
      flashMessage('Помилка збереження. Спробуйте ще раз.', 'error');
    }
  };

  const handleCancel = () => {
    if (originalData.current) setUserData(originalData.current);
    setIsEditing(false);
  };

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h1 className="profile-title">
          Мій <span>профіль</span>
        </h1>
        <p className="profile-subtitle">Особиста інформація</p>
      </div>

      <div className="profile-card">
        {isLoading ? (
          <div className="profile-loader">
            <div className="loader-ring" />
            <span>Завантажуємо дані…</span>
          </div>
        ) : (
          <>
            <div className="profile-avatar-row">
              <div className="profile-avatar">{getInitials(userData.name) || '?'}</div>
              <div>
                <div className="profile-avatar-name">
                  {userData.name || 'Імя не вказано'}
                </div>
                <div className="profile-avatar-email">{userData.email}</div>
              </div>
            </div>

            {message.text && (
              <div className={`profile-message profile-message--${message.type}`}>
                {message.text}
              </div>
            )}

            <form className="profile-form" onSubmit={handleSaveProfile}>
              <ProfileField
                id="name"
                label="Ім'я"
                type="text"
                value={userData.name}
                onChange={handleInputChange}
                placeholder="Ваше ім'я"
                isEditing={isEditing}
                autoFocus
              />

              <ProfileField
                id="email"
                label="Email"
                type="email"
                value={userData.email}
                onChange={handleInputChange}
                placeholder="example@mail.com"
                isEditing={isEditing}
              />

              <ProfileField
                id="phone"
                label="Телефон"
                type="tel"
                value={userData.phone}
                onChange={handleInputChange}
                placeholder="+380 XX XXX XX XX"
                isEditing={isEditing}
              />

              <div className="form-divider" />

              <div className="form-group">
                <label className="form-label">Дата реєстрації</label>
                <p className="profile-value profile-value--muted">
                  {formatDate(userData.created_at, '—')}
                </p>
              </div>

              <div className="profile-actions">
                {isEditing ? (
                  <>
                    <button type="submit" className="btn btn-save">
                      <IconCheck /> Зберегти
                    </button>
                    <button type="button" className="btn btn-cancel" onClick={handleCancel}>
                      <IconClose size={15} /> Скасувати
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    className="btn btn-edit"
                    onClick={() => setIsEditing(true)}
                  >
                    <IconEdit /> Редагувати профіль
                  </button>
                )}
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

function ProfileField({ id, label, type, value, onChange, placeholder, isEditing, autoFocus }) {
  return (
    <div className="form-group">
      <label className="form-label" htmlFor={id}>
        {label}
      </label>
      {isEditing ? (
        <input
          id={id}
          className="form-input"
          type={type}
          name={id}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoFocus={autoFocus}
        />
      ) : (
        <p className="profile-value">{value || '—'}</p>
      )}
    </div>
  );
}
