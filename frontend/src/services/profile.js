import { apiFetch } from './client';

export const profileAPI = {
  getMyProfile: () => apiFetch('/profile/'),

  updateProfile: (name, email, phone) =>
    apiFetch('/profile/update', {
      method: 'PUT',
      body: JSON.stringify({ name, email, phone }),
    }),

  changePassword: (oldPassword, newPassword) =>
    apiFetch('/profile/change-password', {
      method: 'POST',
      body: JSON.stringify({ oldPassword, newPassword }),
    }),

  getProfileStats: () => apiFetch('/profile/stats'),
};
