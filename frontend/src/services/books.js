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

  createBook: (bookData, coverFile) => {
    if (coverFile) {
      const fd = new FormData();
      Object.entries(bookData).forEach(([k, v]) => {
        if (v !== null && v !== undefined) fd.append(k, v);
      });
      fd.append('cover', coverFile);
      return apiFetch('/books', { method: 'POST', body: fd });
    }
    return apiFetch('/books', {
      method: 'POST',
      body: JSON.stringify(bookData),
    });
  },

  uploadCover: (id, coverFile) => {
    const fd = new FormData();
    fd.append('cover', coverFile);
    return apiFetch(`/books/${id}/cover`, { method: 'POST', body: fd });
  },

  updateBook: (id, bookData) =>
    apiFetch(`/books/${id}`, {
      method: 'PUT',
      body: JSON.stringify(bookData),
    }),

  deleteBook: (id) => apiFetch(`/books/${id}`, { method: 'DELETE' }),

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

  getAuthors: () => apiFetch('/books/authors'),
  getGenres: () => apiFetch('/books/genres'),
  getStatuses: () => apiFetch('/books/statuses'),
  updateRating: (id, rating) =>
    apiFetch(`/books/rating/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ rating }),
    }),
};
