import { apiFetch } from './client';

export const booksAPI = {
  getBooks: (filters = {}) => {
    const { search = '', page = 1, limit = 10, status, genre } = filters;
    const params = new URLSearchParams({ search, page, limit });
    if (status) params.append('status', status);
    if (genre) params.append('genre', genre);
    return apiFetch(`/books?${params.toString()}`);
  },

  getBookById: (id) => apiFetch(`/books/${id}`),

  createBook: (bookData) =>
    apiFetch('/books', {
      method: 'POST',
      body: JSON.stringify(bookData),
    }),

  updateBook: (id, bookData) =>
    apiFetch(`/books/${id}`, {
      method: 'PUT',
      body: JSON.stringify(bookData),
    }),

  borrowBook: (id, borrowData) =>
    apiFetch(`/books/${id}/borrow`, {
      method: 'POST',
      body: JSON.stringify(borrowData),
    }),

  returnBook: (id) => apiFetch(`/books/${id}/return`, { method: 'POST' }),

  toggleFavorite: (id, isFavorite) =>
    apiFetch(`/books/${id}/favorite`, {
      method: 'PUT',
      body: JSON.stringify({ is_favorite: isFavorite }),
    }),

  getNotes: (bookId) => apiFetch(`/books/${bookId}/notes`),

  addNote: (bookId, text) =>
    apiFetch(`/books/${bookId}/notes`, {
      method: 'POST',
      body: JSON.stringify({ text }),
    }),
};
