import { apiFetch } from './client';

export const recommendationsAPI = {
  generate: () => apiFetch('/recommendations'),
};
