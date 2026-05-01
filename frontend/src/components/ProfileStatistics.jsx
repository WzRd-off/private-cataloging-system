import { useEffect, useState } from 'react';
import { profileAPI } from '../services/profile';

const ProfileStatistics = () => {
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await profileAPI.getProfileStats();
        setStats(data);
      } catch (err) {
        console.error('Error fetching stats:', err);
        setError('Помилка завантаження статистики');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <div className="profile-loader">
        <div className="loader-ring" />
        <span>Завантажуємо статистику…</span>
      </div>
    );
  }

  if (error) {
    return <div className="profile-message profile-message--error">{error}</div>;
  }

  if (!stats) {
    return <div className="profile-message profile-message--error">Не вдалося завантажити статистику</div>;
  }

  return (
    <div className="profile-stats">
      <div className="stat-card">
        <div className="stat-label">Всього книг</div>
        <div className="stat-value">{stats.totalBooks || 0}</div>
        <div className="stat-subtext">у бібліотеці</div>
      </div>

      <div className="stat-card">
        <div className="stat-label">Прочитано</div>
        <div className="stat-value">{stats.readBooks || 0}</div>
        <div className="stat-subtext">книг</div>
      </div>

      <div className="stat-card">
        <div className="stat-label">Читаю</div>
        <div className="stat-value">{stats.readingBooks || 0}</div>
        <div className="stat-subtext">книг</div>
      </div>

      <div className="stat-card">
        <div className="stat-label">У списку</div>
        <div className="stat-value">{stats.unreadBooks || 0}</div>
        <div className="stat-subtext">книг</div>
      </div>

      <div className="stat-card">
        <div className="stat-label">Позичено</div>
        <div className="stat-value">{stats.borrowedBooks || 0}</div>
        <div className="stat-subtext">книг</div>
      </div>

      <div className="stat-card">
        <div className="stat-label">Улюблені</div>
        <div className="stat-value">{stats.favoriteBooks || 0}</div>
        <div className="stat-subtext">книг</div>
      </div>

      {stats.totalNotes !== undefined && (
        <div className="stat-card">
          <div className="stat-label">Замітки</div>
          <div className="stat-value">{stats.totalNotes || 0}</div>
          <div className="stat-subtext">створено</div>
        </div>
      )}
    </div>
  );
};

export default ProfileStatistics;
