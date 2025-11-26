'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppState } from '@/lib/stateContext';

export default function LoginPage() {
  const router = useRouter();
  const { state, updateState } = useAppState();
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== '1234') {
      setError('Неверный пароль');
      return;
    }

    const user = state.users.find(u => u.login === login);
    if (!user) {
      setError('Пользователь не найден');
      return;
    }

    updateState(prev => ({
      ...prev,
      currentUserId: user.id,
    }));

    router.push('/today');
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      <div style={{
        background: 'white',
        padding: '2rem',
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        width: '100%',
        maxWidth: '400px'
      }}>
        <h1 style={{ marginBottom: '1.5rem', textAlign: 'center', color: '#333' }}>
          Вход в систему
        </h1>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#666' }}>
              Логин
            </label>
            <input
              type="text"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '1rem'
              }}
            />
          </div>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#666' }}>
              Пароль
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '1rem'
              }}
            />
          </div>
          {error && (
            <div style={{
              marginBottom: '1rem',
              padding: '0.75rem',
              background: '#fee',
              color: '#c33',
              borderRadius: '4px',
              fontSize: '0.9rem'
            }}>
              {error}
            </div>
          )}
          <button
            type="submit"
            style={{
              width: '100%',
              padding: '0.75rem',
              background: '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '1rem',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            Войти
          </button>
        </form>
        <div style={{ marginTop: '1rem', fontSize: '0.85rem', color: '#999', textAlign: 'center' }}>
          Пароль для всех: 1234
        </div>
      </div>
    </div>
  );
}

