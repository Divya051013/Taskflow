import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getInitials } from '../utils/helpers';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: '▦' },
  { path: '/projects', label: 'Projects', icon: '⬡' },
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div style={styles.shell}>
      <aside style={styles.sidebar}>
        <div style={styles.sidebarTop}>
          <div style={styles.logo}>
            <span style={{ color: 'var(--accent3)', fontSize: 20 }}>⬡</span>
            <span style={styles.logoText}>TaskFlow</span>
          </div>
          <nav style={styles.nav}>
            {navItems.map(item => {
              const active = location.pathname === item.path || (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
              return (
                <Link key={item.path} to={item.path} style={{ ...styles.navItem, ...(active ? styles.navItemActive : {}) }}>
                  <span style={styles.navIcon}>{item.icon}</span>
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div style={styles.sidebarBottom}>
          <div style={styles.userCard} onClick={() => setMenuOpen(!menuOpen)}>
            <div className="avatar" style={{ width: 34, height: 34, background: 'var(--accent)', color: '#fff', fontSize: 13 }}>
              {getInitials(user?.name)}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={styles.userName}>{user?.name}</div>
              <div style={styles.userEmail}>{user?.email}</div>
            </div>
            <span style={{ color: 'var(--text3)', fontSize: 12 }}>⋯</span>
          </div>
          {menuOpen && (
            <div style={styles.userMenu}>
              <button style={styles.menuItem} onClick={handleLogout}>Sign out</button>
            </div>
          )}
        </div>
      </aside>
      <main style={styles.main}>
        {children}
      </main>
    </div>
  );
}

const styles = {
  shell: { display: 'flex', minHeight: '100vh' },
  sidebar: {
    width: 230, flexShrink: 0, background: 'var(--bg2)',
    borderRight: '1px solid var(--border)',
    display: 'flex', flexDirection: 'column',
    position: 'sticky', top: 0, height: '100vh'
  },
  sidebarTop: { flex: 1, padding: '24px 16px', overflow: 'auto' },
  logo: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 32, paddingLeft: 8 },
  logoText: { fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 18, color: 'var(--text)' },
  nav: { display: 'flex', flexDirection: 'column', gap: 2 },
  navItem: {
    display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px',
    borderRadius: 8, color: 'var(--text2)', fontSize: 14, fontWeight: 500,
    transition: 'all 0.15s', textDecoration: 'none'
  },
  navItemActive: { background: 'rgba(124,106,247,0.15)', color: 'var(--accent3)' },
  navIcon: { fontSize: 16, width: 20, textAlign: 'center' },
  sidebarBottom: { padding: '16px', borderTop: '1px solid var(--border)', position: 'relative' },
  userCard: { display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: 8, borderRadius: 8, transition: 'background 0.15s' },
  userName: { fontSize: 13, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  userEmail: { fontSize: 11, color: 'var(--text3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  userMenu: {
    position: 'absolute', bottom: '100%', left: 16, right: 16,
    background: 'var(--bg3)', border: '1px solid var(--border2)',
    borderRadius: 8, overflow: 'hidden', marginBottom: 4
  },
  menuItem: {
    display: 'block', width: '100%', padding: '10px 14px',
    background: 'none', border: 'none', color: 'var(--danger)',
    fontSize: 14, textAlign: 'left', cursor: 'pointer',
    transition: 'background 0.15s'
  },
  main: { flex: 1, minWidth: 0, overflow: 'auto' }
};
