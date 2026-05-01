import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const EMPTY_FORM = {
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  phone: '',
};

export default function Auth() {
  const navigate = useNavigate();
  const { login, register, isLoading } = useAuth();

  const [activeTab, setActiveTab] = useState('login');
  const [form, setForm] = useState(EMPTY_FORM);
  const [errorMessage, setErrorMessage] = useState('');

  const isRegister = activeTab === 'register';

  const handleField = (field) => (e) => {
    const value =
      field === 'phone' ? e.target.value.replace(/[^\d+]/g, '') : e.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setErrorMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    try {
      if (isRegister && form.password !== form.confirmPassword) {
        setErrorMessage('Паролі не співпадають');
        return;
      }

      const result = isRegister
        ? await register(form.username, form.email, form.password, form.phone)
        : await login(form.email, form.password);

      if (result.success) {
        navigate('/');
      } else {
        setErrorMessage(result.error || (isRegister ? 'Помилка реєстрації' : 'Помилка входу'));
      }
    } catch {
      setErrorMessage("Помилка з'єднання з сервером");
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-tabs">
          <div
            className={`auth-tab ${!isRegister ? 'active' : ''}`}
            onClick={() => handleTabChange('login')}
          >
            Вхід
          </div>
          <div
            className={`auth-tab ${isRegister ? 'active' : ''}`}
            onClick={() => handleTabChange('register')}
          >
            Реєстрація
          </div>
        </div>

        {errorMessage && <div className="error-message">{errorMessage}</div>}

        <form onSubmit={handleSubmit}>
          {isRegister && (
            <div className="input-group">
              <input
                type="text"
                className="auth-input"
                placeholder="Ваше ім'я"
                value={form.username}
                onChange={handleField('username')}
                required
              />
            </div>
          )}

          <div className="input-group">
            <input
              type="email"
              className="auth-input"
              placeholder="Електронна пошта"
              value={form.email}
              onChange={handleField('email')}
              required
            />
          </div>

          {isRegister && (
            <div className="input-group">
              <input
                type="tel"
                className="auth-input"
                placeholder="Телефон"
                value={form.phone}
                onChange={handleField('phone')}
              />
            </div>
          )}

          <div className="input-group">
            <input
              type="password"
              className="auth-input"
              placeholder="Пароль"
              value={form.password}
              onChange={handleField('password')}
              required
            />
          </div>

          {isRegister && (
            <div className="input-group">
              <input
                type="password"
                className="auth-input"
                placeholder="Підтвердження пароля"
                value={form.confirmPassword}
                onChange={handleField('confirmPassword')}
                required
              />
            </div>
          )}

          <button type="submit" className="btn-filled" disabled={isLoading}>
            {isLoading ? 'Завантаження...' : isRegister ? 'Зареєструватися' : 'Увійти'}
          </button>
        </form>
      </div>
    </div>
  );
}
