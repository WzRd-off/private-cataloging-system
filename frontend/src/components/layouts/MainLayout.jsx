import { useState } from 'react';
import Sidebar from './Sidebar';
import { IconMenu } from '../icons';

export default function MainLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const close = () => setSidebarOpen(false);
  const open = () => setSidebarOpen(true);

  return (
    <div className="layout">
      <Sidebar isOpen={sidebarOpen} onClose={close} />

      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={close} aria-hidden="true" />
      )}

      <main className="layout-content">
        <button className="mobile-menu-btn" onClick={open} aria-label="Відкрити меню">
          <IconMenu />
        </button>
        {children}
      </main>
    </div>
  );
}
