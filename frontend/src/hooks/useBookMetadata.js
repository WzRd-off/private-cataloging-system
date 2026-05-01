import { useEffect, useState } from 'react';
import { booksAPI } from '../services/books';

const createCachedLoader = (fetcher) => {
  let cache = null;
  let pending = null;
  const subs = new Set();

  const load = () => {
    if (cache) return Promise.resolve(cache);
    if (!pending) {
      pending = fetcher()
        .then((data) => {
          cache = data;
          subs.forEach((cb) => cb(cache));
          return cache;
        })
        .catch((err) => {
          pending = null;
          throw err;
        });
    }
    return pending;
  };

  const useData = () => {
    const [value, setValue] = useState(cache ?? []);
    useEffect(() => {
      let active = true;
      if (!cache) {
        load()
          .then((data) => { if (active) setValue(data); })
          .catch((err) => console.error(err));
      }
      subs.add(setValue);
      return () => {
        active = false;
        subs.delete(setValue);
      };
    }, []);
    return value;
  };

  const invalidate = () => {
    cache = null;
    pending = null;
  };

  return { useData, load, invalidate };
};

const authorsLoader = createCachedLoader(() => booksAPI.getAuthors());
const genresLoader = createCachedLoader(() => booksAPI.getGenres());

export const useAuthors = authorsLoader.useData;
export const useGenres = genresLoader.useData;
export const invalidateAuthors = authorsLoader.invalidate;
export const invalidateGenres = genresLoader.invalidate;
