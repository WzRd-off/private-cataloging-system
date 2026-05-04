import { apiFetch, apiDownload } from './client';

export const profileAPI = {
  getMyProfile: () => apiFetch('/profile/'),

  updateProfile: (name, email, phone) =>
    apiFetch('/profile/', {
      method: 'PUT',
      body: JSON.stringify({ name, email, phone }),
    }),

  changePassword: (oldPassword, newPassword) =>
    apiFetch('/profile/password', {
      method: 'PUT',
      body: JSON.stringify({ oldPassword, newPassword }),
    }),

  getProfileStats: (period) => {
    const params = new URLSearchParams();
    if (period) params.append('period', period);
    return apiFetch(`/profile/stats?${params.toString()}`);
  },

  exportBooks: (format) => {
    const ext = format === 'pdf' ? 'pdf' : 'csv';
    return apiDownload(`/profile/export?format=${format}`, `books_${Date.now()}.${ext}`);
  },
  exportStats: (format, period) => {
    const params = new URLSearchParams({ format });
    if (period) params.append('period', period);
    const ext = format === 'pdf' ? 'pdf' : 'csv';
    return apiDownload(
      `/profile/export-stats?${params.toString()}`,
      `stats_${period || 'all'}_${Date.now()}.${ext}`,
    );
  },
};
