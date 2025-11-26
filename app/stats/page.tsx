'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import dayjs from 'dayjs';
import { useAppState } from '@/lib/stateContext';

export default function StatsPage() {
  const router = useRouter();
  const { state } = useAppState();
  const [currentMonth, setCurrentMonth] = useState(dayjs());
  const [selectedUserId, setSelectedUserId] = useState<string>('');

  useEffect(() => {
    if (!state.currentUserId) {
      router.push('/login');
    }
  }, [state.currentUserId, router]);

  if (!state.currentUserId) {
    return <div>Загрузка...</div>;
  }

  // Устанавливаем выбранного пользователя по умолчанию
  useEffect(() => {
    if (!selectedUserId && state.users.length > 0) {
      setSelectedUserId(state.users[0].id);
    }
  }, [selectedUserId, state.users]);

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

  // Найти чемпиона и аутсайдера по абсолютному количеству выполнений
  const champion = userStats.reduce((max, stat) => 
    stat.tasksDoneTotal > max.tasksDoneTotal ? stat : max,
    userStats[0] || { tasksDoneTotal: 0, user: null }
  );

  const outsider = userStats.reduce((min, stat) => 
    stat.tasksDoneTotal < min.tasksDoneTotal ? stat : min,
    userStats[0] || { tasksDoneTotal: Infinity, user: null }
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
              {champion.tasksDoneTotal} дел
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
              {outsider.tasksDoneTotal} дел
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

      {/* Детальная статистика по задачам */}
      <div style={{
        background: 'white',
        padding: '1.5rem',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        marginTop: '2rem'
      }}>
        <h2 style={{ marginBottom: '1rem', fontSize: '1.5rem', color: '#333' }}>
          Статистика по задачам
        </h2>

        {/* Переключалка между людьми */}
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          marginBottom: '1.5rem',
          flexWrap: 'wrap'
        }}>
          {state.users.map(user => (
            <button
              key={user.id}
              onClick={() => setSelectedUserId(user.id)}
              style={{
                padding: '0.5rem 1rem',
                background: selectedUserId === user.id ? '#667eea' : '#f5f5f5',
                color: selectedUserId === user.id ? 'white' : '#333',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: selectedUserId === user.id ? 'bold' : 'normal'
              }}
            >
              {user.name}
            </button>
          ))}
        </div>

        {/* Статистика по задачам выбранного пользователя */}
        {selectedUserId && <TaskStatsForUser userId={selectedUserId} monthStart={monthStart} monthEnd={monthEnd} />}
      </div>
    </div>
  );
}

// Компонент для отображения статистики по задачам конкретного пользователя
function TaskStatsForUser({ userId, monthStart, monthEnd }: { userId: string; monthStart: dayjs.Dayjs; monthEnd: dayjs.Dayjs }) {
  const { state } = useAppState();

  // Собираем статистику по каждому типу задачи
  const taskStats = state.taskTemplates.map(template => {
    let totalRequired = 0;
    let totalDone = 0;

    // Проходим по всем дням месяца
    let currentDate = monthStart;
    while (currentDate.isBefore(monthEnd, 'day') || currentDate.isSame(monthEnd, 'day')) {
      const weekday = currentDate.day();
      const quota = state.dailyQuotas.find(q => q.userId === userId && q.weekday === weekday);
      const tasksRequired = quota?.tasksRequired ?? 0;

      // Проверяем, назначена ли эта задача пользователю
      if (template.active && template.assignedUserIds.includes(userId)) {
        totalRequired += tasksRequired;

        // Считаем выполненные инстансы этой задачи в этот день
        const dateStr = currentDate.format('YYYY-MM-DD');
        const dayInstances = state.taskInstances.filter(
          i => i.userId === userId && i.date === dateStr && i.templateId === template.id && i.status === 'done'
        );
        totalDone += dayInstances.length;
      }

      currentDate = currentDate.add(1, 'day');
    }

    const completionRate = totalRequired > 0 ? (totalDone / totalRequired) * 100 : 0;

    return {
      template,
      totalRequired,
      totalDone,
      completionRate,
    };
  }).filter(stat => stat.totalRequired > 0) // Только задачи, которые были назначены
    .sort((a, b) => {
      // Сортируем: сначала по относительному проценту (убывание), потом по абсолютному количеству
      if (Math.abs(a.completionRate - b.completionRate) > 0.1) {
        return b.completionRate - a.completionRate;
      }
      return b.totalDone - a.totalDone;
    });

  if (taskStats.length === 0) {
    return <div style={{ color: '#666', textAlign: 'center', padding: '2rem' }}>Нет данных за этот период</div>;
  }

  const maxDone = Math.max(...taskStats.map(s => s.totalDone), 1);
  const maxRate = Math.max(...taskStats.map(s => s.completionRate), 1);

  // Функция для вычисления цвета на основе процента выполнения
  // От красного (0%) к зеленому (100%)
  const getColorByRate = (rate: number): string => {
    // Нормализуем процент от 0 до 1
    const normalized = Math.max(0, Math.min(100, rate)) / 100;
    
    // Используем более плавный переход через квадратичную функцию для лучшей визуализации
    const smoothNormalized = normalized * normalized;
    
    // Красный компонент: уменьшается от 239 (0xEF) до 16 (0x10)
    // При 0%: rgb(239, 68, 68) - красный
    // При 100%: rgb(16, 185, 33) - зеленый
    const red = Math.round(239 - (239 - 16) * smoothNormalized);
    const green = Math.round(68 + (185 - 68) * smoothNormalized);
    const blue = Math.round(68 - (68 - 33) * smoothNormalized);
    
    return `rgb(${red}, ${green}, ${blue})`;
  };

  return (
    <div>
      {taskStats.map((stat, index) => {
        const barColor = getColorByRate(stat.completionRate);
        return (
          <div
            key={stat.template.id}
            style={{
              marginBottom: '1rem',
              padding: '1rem',
              border: '1px solid #e5e7eb',
              borderRadius: '4px',
              background: '#f9fafb'
            }}
          >
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '0.5rem'
            }}>
              <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
                {stat.template.title}
              </div>
              <div style={{ fontSize: '0.9rem', color: '#666' }}>
                {stat.totalDone} / {stat.totalRequired}
              </div>
            </div>

            {/* Горизонтальные столбики */}
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              {/* Относительный процент */}
              <div style={{ flex: 1, minWidth: '200px' }}>
                <div style={{
                  height: '24px',
                  background: '#e5e7eb',
                  borderRadius: '4px',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    height: '100%',
                    width: `${(stat.completionRate / maxRate) * 100}%`,
                    background: barColor,
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    paddingRight: '0.5rem',
                    color: 'white',
                    fontSize: '0.85rem',
                    fontWeight: 'bold'
                  }}>
                    {stat.completionRate > 5 && `${stat.completionRate.toFixed(0)}%`}
                  </div>
                </div>
              </div>

              {/* Абсолютное количество */}
              <div style={{ minWidth: '100px', textAlign: 'right' }}>
                <div style={{
                  height: '24px',
                  background: '#e5e7eb',
                  borderRadius: '4px',
                  position: 'relative',
                  overflow: 'hidden',
                  width: '100px',
                  display: 'inline-block'
                }}>
                  <div style={{
                    height: '100%',
                    width: `${(stat.totalDone / maxDone) * 100}%`,
                    background: '#667eea',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    paddingRight: '0.5rem',
                    color: 'white',
                    fontSize: '0.85rem',
                    fontWeight: 'bold'
                  }}>
                    {stat.totalDone > 0 && stat.totalDone}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

