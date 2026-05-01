import { useEffect, useState } from 'react';
import { booksAPI } from '../services/books';

const STATUS_CLASS_MAP = {
  'Не читав':  { detailClass: 'status-unread',   catalogClass: 'badge-unread' },
  'Читаю':     { detailClass: 'status-reading',  catalogClass: 'badge-reading' },
  'Прочитано': { detailClass: 'status-read',     catalogClass: 'badge-read' },
  'В займах':  { detailClass: 'status-borrowed', catalogClass: 'badge-lent' },
};

const FALLBACK_CLASSES = { detailClass: 'status-unread', catalogClass: 'badge-unread' };

export const getStatusClasses = (name) => STATUS_CLASS_MAP[name] ?? FALLBACK_CLASSES;

export const getBookStatus = (name) => ({
  value: name ?? 'Не читав',
  label: name ?? 'Не читав',
  ...getStatusClasses(name),
});

let statusesCache = null;
let statusesPromise = null;
const subscribers = new Set();

const loadStatuses = () => {
  if (statusesCache) return Promise.resolve(statusesCache);
  if (!statusesPromise) {
    statusesPromise = booksAPI
      .getStatuses()
      .then((rows) => {
        statusesCache = rows.map((s) => ({
          value: s.name,
          label: s.name,
          ...getStatusClasses(s.name),
        }));
        subscribers.forEach((cb) => cb(statusesCache));
        return statusesCache;
      })
      .catch((err) => {
        statusesPromise = null;
        throw err;
      });
  }
  return statusesPromise;
};

export const useBookStatuses = () => {
  const [statuses, setStatuses] = useState(statusesCache ?? []);

  useEffect(() => {
    let active = true;
    if (!statusesCache) {
      loadStatuses()
        .then((data) => { if (active) setStatuses(data); })
        .catch((err) => console.error('Помилка завантаження статусів:', err));
    }
    subscribers.add(setStatuses);
    return () => {
      active = false;
      subscribers.delete(setStatuses);
    };
  }, []);

  return statuses;
};
