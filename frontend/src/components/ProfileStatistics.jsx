import { useEffect, useState } from 'react';
import { profileAPI } from '../services/profile';

const ProfileStatistics = () => {
  const [stats, setStats] = useState(null);
  const [period, setPeriod] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [exportError, setExportError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true);
      try {
        const data = await profileAPI.getProfileStats(period === 'all' ? null : period);
        setStats(data);
      } catch (err) {
        console.error('Error fetching stats:', err);
        setError('Помилка завантаження статистики');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [period]);

  const handleExport = async (format) => {
    setExportError('');
    try {
      await profileAPI.exportStats(format, period === 'all' ? null : period);
    } catch (err) {
      setExportError('Помилка експорту статистики');
      console.error('Export error:', err);
    }
  };

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
    <div className="profile-stats-container">
      <div className="stats-controls">
        <div className="period-filter">
          <label>Період:</label>
          <select value={period} onChange={(e) => setPeriod(e.target.value)}>
            <option value="all">За все час</option>
            <option value="month">За 30 днів</option>
            <option value="year">За рік</option>
          </select>
        </div>
        <div className="export-buttons">
          <button onClick={() => handleExport('csv')} className="btn btn-secondary" title="Експорт CSV">
            📥 CSV
          </button>
          <button onClick={() => handleExport('pdf')} className="btn btn-secondary" title="Експорт PDF">
            📄 PDF
          </button>
        </div>
      </div>
      {exportError && <div className="error-message">{exportError}</div>}
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
    </div>
  );
};

export default ProfileStatistics;
