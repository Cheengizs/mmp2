import React from 'react';
import type { User } from '../types';

interface NavbarProps {
  user: User;
  onLogout: () => void;
  onThemeChange?: (color: string) => void;
  currentBg?: string;
  onOpenAdminPanel?: () => void;
}

const THEME_PRESETS = [
  { name: 'По умолчанию', color: '#121214' },
  { name: 'Navy Blue', color: '#0f172a' },
  { name: 'Графит', color: '#18181b' },
  { name: 'Изумруд', color: '#064e3b' },
  { name: 'Аметист', color: '#2e1065' },
];

export const Navbar: React.FC<NavbarProps> = ({
  user,
  onLogout,
  onThemeChange,
  currentBg,
  onOpenAdminPanel,
}) => {
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

  const isVipOrAdmin = user.role === 'vip' || user.role === 'admin';

  return (
    <header style={styles.header}>
      <div>
        <h1 style={styles.title}>Библиотека</h1>
        <p style={styles.subTitle}>Node.js REST API + PostgreSQL • SPA</p>
      </div>

      <div style={styles.userInfo}>
        {isVipOrAdmin && (
          <div style={styles.themePicker}>
            <span style={styles.themeLabel}>⭐ VIP Фон:</span>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              {THEME_PRESETS.map((t) => {
                const isSelected = currentBg === t.color;
                return (
                  <button
                    key={t.color}
                    type="button"
                    title={t.name}
                    onClick={() => onThemeChange?.(t.color)}
                    style={{
                      ...styles.colorDot,
                      backgroundColor: t.color,
                      border: isSelected ? '2px solid #60a5fa' : '1px solid #4b5563',
                      transform: isSelected ? 'scale(1.15)' : 'scale(1)',
                    }}
                  />
                );
              })}
            </div>
          </div>
        )}

        <div style={styles.userBadge}>
          <span style={styles.userName}>👤 {user.username}</span>
          <span style={{ ...styles.roleBadge, ...getRoleBadgeStyle(user.role) }}>
            {user.role.toUpperCase()}
          </span>
        </div>
        {user.role === 'admin' && (
          <button
            type="button"
            onClick={onOpenAdminPanel}
            style={styles.adminButton}
          >
            ⚙️ Админ-панель
          </button>
        )}
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
    flexWrap: 'wrap',
    gap: 16,
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
    flexWrap: 'wrap',
  },
  themePicker: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#1c1c21',
    border: '1px solid #2e2e38',
    padding: '6px 12px',
    borderRadius: 8,
  },
  themeLabel: {
    fontSize: 12,
    fontWeight: 600,
    color: '#fbbf24',
  },
  colorDot: {
    width: 20,
    height: 20,
    borderRadius: '50%',
    cursor: 'pointer',
    padding: 0,
    transition: 'transform 0.15s ease, border-color 0.15s ease',
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
  adminButton: {
    backgroundColor: '#7c3aed',
    color: '#ffffff',
    border: 'none',
    borderRadius: 6,
    padding: '8px 14px',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
  },
};
