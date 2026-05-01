import { apiFetch } from './client';

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

  getProfileStats: () => apiFetch('/profile/stats'),
};
