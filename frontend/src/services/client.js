const API_BASE_URL = import.meta.env.VITE_NODE_URL || 'http://localhost:8000';

const jsonHeaders = () => ({ 'Content-Type': 'application/json' });

function buildHeaders(options, token) {
  const isFormData = options.body instanceof FormData;
  const headers = isFormData ? {} : { ...(options.headers || jsonHeaders()) };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return { headers, isFormData };
}

async function parseError(response) {
  const errorData = await response.json().catch(() => ({}));

  if (response.status === 422 && Array.isArray(errorData.detail)) {
    const errors = errorData.detail
      .map((err) => `${err.loc?.join('.')}: ${err.msg}`)
      .join('; ');
    return new Error(`Ошибка валидации: ${errors}`);
  }

  return new Error(errorData.detail || `Ошибка ${response.status}`);
}

export const apiFetch = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');
  const { headers, isFormData } = buildHeaders(options, token);

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: isFormData && !token ? undefined : headers,
      credentials: 'include',
    });

    if (!response.ok) throw await parseError(response);
    if (response.status === 204) return null;
    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};
