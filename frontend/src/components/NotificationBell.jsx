import { useCallback, useEffect, useRef, useState } from 'react';
import { IconBell } from './icons';
import { notificationsAPI } from '../services/notifications';
import { formatDate } from '../utils/format';

const POLL_MS = 60_000;

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const wrapRef = useRef(null);

  const load = useCallback(async () => {
    try {
      const data = await notificationsAPI.list();
      setItems(Array.isArray(data?.items) ? data.items : []);
    } catch {
      setItems([]);
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, POLL_MS);
    return () => clearInterval(id);
  }, [load]);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    load().finally(() => setLoading(false));
  }, [open, load]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const unread = items.filter((n) => !n.is_read).length;

  const handleMarkOne = async (id) => {
    try {
      await notificationsAPI.markRead(id);
      setItems((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
      );
    } catch {
      /* ignore */
    }
  };

  const handleMarkAll = async () => {
    try {
      await notificationsAPI.markAllRead();
      setItems((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="notif-bell-wrap" ref={wrapRef}>
      <button
        type="button"
        className="notif-bell-btn"
        aria-label="Сповіщення"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <IconBell size={20} />
        {unread > 0 && <span className="notif-bell-badge">{unread > 99 ? '99+' : unread}</span>}
      </button>

      {open && (
        <div className="notif-panel" role="dialog" aria-label="Сповіщення">
          <div className="notif-panel-head">
            <span>Сповіщення</span>
            {unread > 0 && (
              <button type="button" className="notif-panel-markall" onClick={handleMarkAll}>
                Прочитати всі
              </button>
            )}
          </div>
          <div className="notif-panel-body">
            {loading && <div className="notif-panel-loading">Завантаження…</div>}
            {!loading && items.length === 0 && (
              <div className="notif-panel-empty">Немає сповіщень</div>
            )}
            {!loading &&
              items.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  className={`notif-item${n.is_read ? ' notif-item--read' : ''}`}
                  onClick={() => !n.is_read && handleMarkOne(n.id)}
                >
                  <div className="notif-item-title">{n.title}</div>
                  <div className="notif-item-msg">{n.message}</div>
                  {n.created_at && (
                    <div className="notif-item-date">{formatDate(n.created_at)}</div>
                  )}
                </button>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
