import { apiFetch } from './client';

export const notificationsAPI = {
  list: () => apiFetch('/notifications'),
  markRead: (id) =>
    apiFetch(`/notifications/${id}/read`, { method: 'PATCH' }),
  markAllRead: () =>
    apiFetch('/notifications/mark-all-read', { method: 'PATCH' }),
};
