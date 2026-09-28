import React from 'react';
import type { User } from '../types';

interface NavbarProps {
  user: User;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ user, onLogout }) => {
  const getRoleBadgeStyle = (role: string): React.CSSProperties => {
    switch (role) {
      case 'admin':
        return { backgroundColor: '#7c3aed', color: '#ede9fe' };
      case 'vip':
        return { backgroundColor: '#d97706', color: '#fef3c7' };
      default:
        return { backgroundColor: '#2563eb', color: '#dbeafe' };
    }
  };

  return (
    <header style={styles.header}>
      <div>
        <h1 style={styles.title}>Библиотека</h1>
        <p style={styles.subTitle}>Node.js REST API + PostgreSQL • SPA</p>
      </div>

      <div style={styles.userInfo}>
        <div style={styles.userBadge}>
          <span style={styles.userName}>👤 {user.username}</span>
          <span style={{ ...styles.roleBadge, ...getRoleBadgeStyle(user.role) }}>
            {user.role.toUpperCase()}
          </span>
        </div>
        <button onClick={onLogout} style={styles.logoutButton}>
          Выйти
        </button>
      </div>
    </header>
  );
};

const styles: Record<string, React.CSSProperties> = {
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 28,
    borderBottom: '1px solid #2e2e38',
    paddingBottom: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: 700,
    color: '#ffffff',
    margin: '0 0 4px 0',
  },
  subTitle: {
    margin: 0,
    color: '#9ca3af',
    fontSize: 13,
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  userBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#1c1c21',
    border: '1px solid #2e2e38',
    padding: '6px 12px',
    borderRadius: 8,
  },
  userName: {
    fontSize: 14,
    fontWeight: 600,
    color: '#f3f4f6',
  },
  roleBadge: {
    fontSize: 11,
    fontWeight: 700,
    padding: '2px 8px',
    borderRadius: 4,
    letterSpacing: '0.5px',
  },
  logoutButton: {
    backgroundColor: '#27272a',
    color: '#fca5a5',
    border: '1px solid #3f3f46',
    borderRadius: 6,
    padding: '8px 14px',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
  },
};
