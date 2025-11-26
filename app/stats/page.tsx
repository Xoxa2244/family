'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import dayjs from 'dayjs';
import { useAppState } from '@/lib/stateContext';

export default function StatsPage() {
  const router = useRouter();
  const { state } = useAppState();
  const [currentMonth, setCurrentMonth] = useState(dayjs());

  useEffect(() => {
    if (!state.currentUserId) {
      router.push('/login');
    }
  }, [state.currentUserId, router]);

  if (!state.currentUserId) {
    return <div>Загрузка...</div>;
  }

  const monthStart = currentMonth.startOf('month');
  const monthEnd = currentMonth.endOf('month');

  // Вычислить статистику для каждого пользователя
  const userStats = state.users.map(user => {
    const userQuotas = state.dailyQuotas.filter(q => q.userId === user.id);
    
    // Пройти по всем дням месяца
    let tasksRequiredTotal = 0;
    let tasksDoneTotal = 0;
    let movesTotal = 0;

    let currentDate = monthStart;
    while (currentDate.isBefore(monthEnd, 'day') || currentDate.isSame(monthEnd, 'day')) {
      const weekday = currentDate.day();
      const quota = userQuotas.find(q => q.weekday === weekday);
      const tasksRequired = quota?.tasksRequired ?? 0;
      tasksRequiredTotal += tasksRequired;

      const dateStr = currentDate.format('YYYY-MM-DD');
      const dayInstances = state.taskInstances.filter(
        i => i.userId === user.id && i.date === dateStr
      );
      tasksDoneTotal += dayInstances.filter(i => i.status === 'done').length;
      movesTotal += dayInstances.filter(i => i.status === 'moved').length;

      currentDate = currentDate.add(1, 'day');
    }

    const completionRate = tasksRequiredTotal > 0 
      ? (tasksDoneTotal / tasksRequiredTotal) * 100 
      : 0;

    return {
      user,
      tasksRequiredTotal,
      tasksDoneTotal,
      movesTotal,
      completionRate,
    };
  }).filter(stat => stat.tasksRequiredTotal > 0); // Только те, у кого есть квоты

  // Найти чемпиона и аутсайдера
  const champion = userStats.reduce((max, stat) => 
    stat.completionRate > max.completionRate ? stat : max,
    userStats[0] || { completionRate: 0, user: null }
  );

  const outsider = userStats.reduce((min, stat) => 
    stat.completionRate < min.completionRate ? stat : min,
    userStats[0] || { completionRate: 100, user: null }
  );

  return (
    <div>
      <h1 style={{ marginBottom: '1.5rem', fontSize: '2rem', color: '#333' }}>
        Сводная статистика
      </h1>

      {/* Выбор месяца */}
      <div style={{
        background: 'white',
        padding: '1rem',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        marginBottom: '1.5rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <button
          onClick={() => setCurrentMonth(prev => prev.subtract(1, 'month'))}
          style={{
            padding: '0.5rem 1rem',
            background: '#f5f5f5',
            border: '1px solid #ddd',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '1.2rem'
          }}
        >
          ←
        </button>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#333' }}>
          {currentMonth.format('MMMM YYYY')}
        </h2>
        <button
          onClick={() => setCurrentMonth(prev => prev.add(1, 'month'))}
          style={{
            padding: '0.5rem 1rem',
            background: '#f5f5f5',
            border: '1px solid #ddd',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '1.2rem'
          }}
        >
          →
        </button>
      </div>

      {/* Чемпион и аутсайдер */}
      {champion.user && (
        <div style={{
          background: 'white',
          padding: '1.5rem',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          marginBottom: '1.5rem',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '1rem'
        }}>
          <div style={{
            padding: '1rem',
            background: '#f0fdf4',
            borderRadius: '4px',
            border: '2px solid #10b981'
          }}>
            <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.5rem' }}>
              🏆 Чемпион месяца
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#10b981' }}>
              {champion.user.name}
            </div>
            <div style={{ fontSize: '1.2rem', color: '#666' }}>
              {champion.completionRate.toFixed(1)}%
            </div>
          </div>
          <div style={{
            padding: '1rem',
            background: '#fef2f2',
            borderRadius: '4px',
            border: '2px solid #ef4444'
          }}>
            <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.5rem' }}>
              ⚠️ Больше всех проседает
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#ef4444' }}>
              {outsider.user?.name || 'Нет данных'}
            </div>
            <div style={{ fontSize: '1.2rem', color: '#666' }}>
              {outsider.completionRate.toFixed(1)}%
            </div>
          </div>
        </div>
      )}

      {/* Таблица статистики */}
      <div style={{
        background: 'white',
        padding: '1.5rem',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        overflowX: 'auto'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
              <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 'bold', color: '#333' }}>
                Пользователь
              </th>
              <th style={{ padding: '0.75rem', textAlign: 'center', fontWeight: 'bold', color: '#333' }}>
                Плановых дел
              </th>
              <th style={{ padding: '0.75rem', textAlign: 'center', fontWeight: 'bold', color: '#333' }}>
                Выполнено
              </th>
              <th style={{ padding: '0.75rem', textAlign: 'center', fontWeight: 'bold', color: '#333' }}>
                % выполнения
              </th>
              <th style={{ padding: '0.75rem', textAlign: 'center', fontWeight: 'bold', color: '#333' }}>
                Переносов
              </th>
            </tr>
          </thead>
          <tbody>
            {userStats.map((stat, index) => {
              const isChampion = stat.user.id === champion.user?.id;
              const isOutsider = stat.user.id === outsider.user?.id;
              return (
                <tr
                  key={stat.user.id}
                  style={{
                    borderBottom: '1px solid #e5e7eb',
                    background: isChampion ? '#f0fdf4' : isOutsider ? '#fef2f2' : 'white'
                  }}
                >
                  <td style={{ padding: '0.75rem', fontWeight: 'bold' }}>
                    {stat.user.name}
                    {isChampion && ' 🏆'}
                    {isOutsider && ' ⚠️'}
                  </td>
                  <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                    {stat.tasksRequiredTotal}
                  </td>
                  <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                    {stat.tasksDoneTotal}
                  </td>
                  <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                    <span style={{
                      fontWeight: 'bold',
                      color: stat.completionRate >= 80 ? '#10b981' :
                        stat.completionRate >= 50 ? '#f59e0b' : '#ef4444'
                    }}>
                      {stat.completionRate.toFixed(1)}%
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                    {stat.movesTotal}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

