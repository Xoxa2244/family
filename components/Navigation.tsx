'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAppState } from '@/lib/stateContext';

export default function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const { state, updateState } = useAppState();

  const currentUser = state.users.find(u => u.id === state.currentUserId);

  const handleLogout = () => {
    updateState(prev => ({
      ...prev,
      currentUserId: undefined,
    }));
    router.push('/login');
  };

  if (pathname === '/login') {
    return null;
  }

  return (
    <nav style={{
      background: 'white',
      padding: '1rem 2rem',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      marginBottom: '2rem'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
          <Link href="/today" style={{
            color: pathname === '/today' ? '#667eea' : '#666',
            fontWeight: pathname === '/today' ? 'bold' : 'normal',
            textDecoration: 'none'
          }}>
            Сегодня
          </Link>
          <Link href="/calendar" style={{
            color: pathname === '/calendar' ? '#667eea' : '#666',
            fontWeight: pathname === '/calendar' ? 'bold' : 'normal',
            textDecoration: 'none'
          }}>
            Календарь
          </Link>
          <Link href="/stats" style={{
            color: pathname === '/stats' ? '#667eea' : '#666',
            fontWeight: pathname === '/stats' ? 'bold' : 'normal',
            textDecoration: 'none'
          }}>
            Статистика
          </Link>
          {(currentUser?.role === 'parent' || pathname === '/admin') && (
            <Link href="/admin" style={{
              color: pathname === '/admin' ? '#667eea' : '#666',
              fontWeight: pathname === '/admin' ? 'bold' : 'normal',
              textDecoration: 'none'
            }}>
              Админка
            </Link>
          )}
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <span style={{ color: '#666' }}>{currentUser?.name}</span>
          <button
            onClick={handleLogout}
            style={{
              padding: '0.5rem 1rem',
              background: '#f5f5f5',
              border: '1px solid #ddd',
              borderRadius: '4px',
              cursor: 'pointer',
              color: '#666'
            }}
          >
            Выйти
          </button>
        </div>
      </div>
    </nav>
  );
}

