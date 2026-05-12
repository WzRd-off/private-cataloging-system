import { useMemo, useState } from 'react';
import MainLayout from '../components/layouts/MainLayout';
import { recommendationsAPI } from '../services/recommendations';
import { resolveMediaUrl } from '../services/client';
import { IconSparkles, IconBook } from '../components/icons';

function parseRecommendations(rawText) {
  if (!rawText || typeof rawText !== 'string') return [];

  try {
    const parsed = JSON.parse(rawText);
    if (Array.isArray(parsed)) return parsed;
    if (Array.isArray(parsed.recommendations)) return parsed.recommendations;
    return [];
  } catch {
    return [];
  }
}

export default function Recommendations() {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const hasItems = useMemo(() => items.length > 0, [items]);

  const handleGenerate = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await recommendationsAPI.generate();
      const parsedItems = parseRecommendations(response?.recommendations);

      if (!parsedItems.length) {
        setItems([]);
        setError('Сервіс повернув порожній або невалідний JSON рекомендацій.');
        return;
      }

      setItems(parsedItems);
    } catch (err) {
      setError(err?.message || 'Не вдалося отримати рекомендації');
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="catalog-container">
        <div className="catalog-header">
          <h1>
            AI <span>рекомендації</span>
          </h1>
          <p className="catalog-subtitle">Добірка книжок на основі вашої бібліотеки</p>
        </div>

        <div className="recommendations-toolbar">
          <button className="btn btn-primary" onClick={handleGenerate} disabled={isLoading}>
            <IconSparkles />
            <span>{isLoading ? 'Генеруємо…' : 'Згенерувати рекомендації'}</span>
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}

        {isLoading && (
          <div className="page-loader">
            <div className="loader-ring" />
            <span>Почекайте кілька секунд...</span>
          </div>
        )}

        {!isLoading && hasItems && (
          <div className="recommendations-grid">
            {items.map((item, index) => {
              const cover = resolveMediaUrl(item.cover_url);
              return (
                <article key={`${item.title || 'book'}-${index}`} className="recommendation-card">
                  <div className="recommendation-cover">
                    {cover ? (
                      <img src={cover} alt={item.title || 'Обкладинка книги'} />
                    ) : (
                      <div className="cover-placeholder">📘</div>
                    )}
                  </div>

                  <div className="recommendation-content">
                    <h3>{item.title || 'Без назви'}</h3>
                    <p className="recommendation-author">{item.author || 'Невідомий автор'}</p>
                    <span className="badge badge-genre">{item.genre || 'Без жанру'}</span>
                    <p className="recommendation-description">
                      {item.description || 'Опис відсутній.'}
                    </p>
                    {item.cover_url && (
                      <a href={cover} target="_blank" rel="noreferrer" className="recommendation-link">
                        Відкрити обкладинку
                      </a>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {!isLoading && !hasItems && !error && (
          <div className="empty-message">
            <IconBook />
            <h3>Рекомендацій поки немає</h3>
            <p>Натисніть кнопку вище, щоб згенерувати персональну добірку.</p>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
