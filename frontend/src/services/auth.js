import { apiFetch } from './client';

export const authAPI = {
  register: (username, email, password, phone = '') =>
    apiFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name: username, email, phone, password }),
    }),

  login: (email, password) =>
    apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  logout: () => apiFetch('/auth/logout', { method: 'POST' }),
};
