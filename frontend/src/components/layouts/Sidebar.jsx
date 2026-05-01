import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { IconBook, IconUser, IconClose, IconLogout } from '../icons';
import { getInitials } from '../../utils/format';

const NAV_LINKS = [
  { to: '/', label: 'Каталог', Icon: IconBook },
  { to: '/profile', label: 'Профіль', Icon: IconUser },
];

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
        {NAV_LINKS.map(({ to, label, Icon }) => (
          <Link
            key={to}
            className={`sidebar-link${pathname === to ? ' sidebar-link--active' : ''}`}
            to={to}
            onClick={onClose}
          >
            <Icon size={18} />
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
