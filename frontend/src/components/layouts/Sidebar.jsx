import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { IconBook, IconUser, IconClose, IconLogout, IconSparkles } from '../icons';
import { getInitials } from '../../utils/format';

const NAV_LINKS = [
  { to: '/', label: 'Каталог', icon: 'book' },
  { to: '/recommendations', label: 'Рекомендації', icon: 'sparkles' },
  { to: '/profile', label: 'Профіль', icon: 'user' },
];

function renderNavIcon(iconName) {
  if (iconName === 'sparkles') return <IconSparkles size={18} />;
  if (iconName === 'user') return <IconUser size={18} />;
  return <IconBook size={18} />;
}

export default function Sidebar({ isOpen, onClose }) {
  const { pathname } = useLocation();
  const { user, logout } = useAuth();

  return (
    <aside className={`sidebar${isOpen ? ' sidebar--open' : ''}`}>
      <div className="sidebar-header">
        <span className="sidebar-logo">
          <IconBook size={20} />
          Бібліотека
        </span>
        <button className="sidebar-close-btn" onClick={onClose} aria-label="Закрити меню">
          <IconClose size={18} />
        </button>
      </div>

      <nav className="sidebar-nav">
        {NAV_LINKS.map(({ to, label, icon }) => (
          <Link
            key={to}
            className={`sidebar-link${pathname === to ? ' sidebar-link--active' : ''}`}
            to={to}
            onClick={onClose}
          >
            {renderNavIcon(icon)}
            <span>{label}</span>
          </Link>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-user-avatar">
            {getInitials(user?.name) || '?'}
          </div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{user?.name || 'Користувач'}</div>
            <div className="sidebar-user-email">{user?.email}</div>
          </div>
        </div>
        <button className="sidebar-logout-btn" onClick={logout}>
          <IconLogout />
          <span>Вийти</span>
        </button>
      </div>
    </aside>
  );
}
