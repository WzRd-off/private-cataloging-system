import { useState, useEffect } from 'react';
import { profileAPI } from '../services/profile';
import { IconEdit, IconChart, IconLock } from '../components/icons';
import { formatDate, getInitials } from '../utils/format';
import MainLayout from '../components/layouts/MainLayout';
import ChangeProfileModal from '../components/ChangeProfileModal';
import ChangePasswordModal from '../components/ChangePasswordModal';
import ProfileStatistics from '../components/ProfileStatistics';

const EMPTY_USER = { name: '', email: '', phone: '' };
const MESSAGE_TIMEOUT = 3500;

export default function Profile() {
  const [userData, setUserData] = useState(EMPTY_USER);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [activeTab, setActiveTab] = useState('profile');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await profileAPI.getMyProfile();
        setUserData(data);
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

  const handleProfileUpdate = (updatedUser) => {
    setUserData(updatedUser);
    flashMessage('Профіль успішно оновлено', 'success');
  };

  const handlePasswordChanged = () => {
    flashMessage('Пароль успішно змінено', 'success');
  };

  return (
    <MainLayout>
      <div className="profile-container">
        <div className="profile-header">
          <h1 className="profile-title">
            Мій <span>профіль</span>
          </h1>
          <p className="profile-subtitle">Управління акаунтом</p>
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
                    {userData.name || 'Ім\'я не вказано'}
                  </div>
                  <div className="profile-avatar-email">{userData.email}</div>
                </div>
              </div>

              {message.text && (
                <div className={`profile-message profile-message--${message.type}`}>
                  {message.text}
                </div>
              )}

              <div className="profile-tabs">
                <button
                  className={`profile-tab ${activeTab === 'profile' ? 'active' : ''}`}
                  onClick={() => setActiveTab('profile')}
                >
                  <IconEdit size={15} />
                  Профіль
                </button>
                <button
                  className={`profile-tab ${activeTab === 'stats' ? 'active' : ''}`}
                  onClick={() => setActiveTab('stats')}
                >
                  <IconChart size={15} />
                  Статистика
                </button>
                <button
                  className={`profile-tab ${activeTab === 'security' ? 'active' : ''}`}
                  onClick={() => setActiveTab('security')}
                >
                  <IconLock size={15} />
                  Безпека
                </button>
              </div>

              <div className="profile-tabs-content">
                {activeTab === 'profile' && (
                  <div className="profile-form">
                    <ProfileField label="Ім'я" value={userData.name} />
                    <ProfileField label="Email" value={userData.email} />
                    <ProfileField label="Телефон" value={userData.phone} />

                    <div className="form-divider" />

                    <div className="form-group">
                      <label className="form-label">Дата реєстрації</label>
                      <p className="profile-value profile-value--muted">
                        {formatDate(userData.created_at, '—')}
                      </p>
                    </div>

                    <div className="profile-actions">
                      <button
                        type="button"
                        className="btn btn-edit"
                        onClick={() => setIsProfileModalOpen(true)}
                      >
                        <IconEdit /> Редагувати профіль
                      </button>
                    </div>
                  </div>
                )}

                {activeTab === 'stats' && <ProfileStatistics />}

                {activeTab === 'security' && (
                  <div className="security-section">
                    <div className="security-item">
                      <div className="security-item-header">
                        <h3>Пароль</h3>
                        <p className="security-item-desc">Змініть свій пароль для забезпечення безпеки</p>
                      </div>
                      <button
                        type="button"
                        className="btn btn-edit"
                        onClick={() => setIsPasswordModalOpen(true)}
                      >
                        <IconLock size={15} /> Змінити пароль
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <ChangeProfileModal
        user={userData}
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        onUpdate={handleProfileUpdate}
      />

      <ChangePasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        onSuccess={handlePasswordChanged}
      />
    </MainLayout>
  );
}

// Спрощений компонент поля (тільки для читання)
function ProfileField({ label, value }) {
  return (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <p className="profile-value">{value || '—'}</p>
    </div>
  );
}