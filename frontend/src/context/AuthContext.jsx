import { createContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../services/auth';
import { profileAPI } from '../services/profile';

export const AuthContext = createContext();

const TOKEN_KEY = 'token';

const saveToken = (response) => {
  if (response?.access_token) {
    localStorage.setItem(TOKEN_KEY, response.access_token);
  }
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        setIsLoading(true);
        const userData = await profileAPI.getMyProfile();
        setUser(userData);
        setError(null);
      } catch {
        setUser(null);
        setError(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = useCallback(async (email, password) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await authAPI.login(email, password);
      saveToken(response);

      const userData = await profileAPI.getMyProfile();
      setUser(userData);

      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (username, email, password, phone = '') => {
    try {
      setIsLoading(true);
      setError(null);

      await authAPI.register(username, email, password, phone);

      const response = await authAPI.login(email, password);
      saveToken(response);

      const userData = await profileAPI.getMyProfile();
      setUser(userData);

      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      setIsLoading(true);
      await authAPI.logout();
    } catch (err) {
      console.error('Помилка під час виходу:', err);
    } finally {
      localStorage.removeItem(TOKEN_KEY);
      setUser(null);
      setError(null);
      setIsLoading(false);
    }
  }, []);

  const value = {
    user,
    isLoading,
    error,
    login,
    register,
    logout,
    isAuthenticated: !!user,
    userRole: user?.role_id,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
