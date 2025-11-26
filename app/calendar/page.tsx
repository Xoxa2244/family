'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import dayjs from 'dayjs';
import 'dayjs/locale/ru';
import { useAppState } from '@/lib/stateContext';

dayjs.locale('ru');

export default function CalendarPage() {
  const router = useRouter();
  const { state } = useAppState();
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [currentMonth, setCurrentMonth] = useState(dayjs());

  useEffect(() => {
    if (!state.currentUserId) {
      router.push('/login');
      return;
    }
    if (!selectedUserId && state.currentUserId) {
      setSelectedUserId(state.currentUserId);
    }
  }, [state.currentUserId, router, selectedUserId]);

  if (!state.currentUserId) {
    return <div>Загрузка...</div>;
  }

  const selectedUser = state.users.find(u => u.id === selectedUserId);
  const monthStart = currentMonth.startOf('month');
  const monthEnd = currentMonth.endOf('month');
  const daysInMonth = monthEnd.date();
  const startDay = monthStart.day();

  // Получить все инстансы для выбранного пользователя в этом месяце
  const monthInstances = state.taskInstances.filter(instance => {
    if (instance.userId !== selectedUserId) return false;
    const instanceDate = dayjs(instance.date);
    return instanceDate.isSame(currentMonth, 'month');
  });

  // Получить квоты для выбранного пользователя
  const userQuotas = state.dailyQuotas.filter(q => q.userId === selectedUserId);

  const getDayInstances = (day: number) => {
    const date = monthStart.add(day - 1, 'day');
    const dateStr = date.format('YYYY-MM-DD');
    return monthInstances.filter(i => i.date === dateStr);
  };

  const getDayStatus = (day: number) => {
    const date = monthStart.add(day - 1, 'day');
    const weekday = date.day();
    const quota = userQuotas.find(q => q.weekday === weekday);
    const tasksRequired = quota?.tasksRequired ?? 0;

    if (tasksRequired === 0) {
      return { status: 'empty', required: 0, done: 0 };
    }

    const dayInstances = getDayInstances(day);
    const tasksDone = dayInstances.filter(i => i.status === 'done').length;

    return {
      status: tasksDone >= tasksRequired ? 'success' : 'fail',
      required: tasksRequired,
      done: tasksDone,
    };
  };

  const getTaskTitle = (templateId: string) => {
    return state.taskTemplates.find(t => t.id === templateId)?.title || 'Неизвестное дело';
  };

  const totalMoves = monthInstances.filter(i => i.status === 'moved').length;

  const weekDays = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];

  return (
    <div>
      <h1 style={{ marginBottom: '1.5rem', fontSize: '2rem', color: '#333' }}>
        Календарь-репортинг
      </h1>

      {/* Выбор пользователя */}
      <div style={{
        background: 'white',
        padding: '1rem',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        marginBottom: '1.5rem',
        display: 'flex',
        gap: '0.5rem',
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

      {/* Календарь */}
      <div style={{
        background: 'white',
        padding: '1.5rem',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        marginBottom: '1.5rem'
      }}>
        {/* Заголовки дней недели */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: '0.5rem',
          marginBottom: '0.5rem'
        }}>
          {weekDays.map(day => (
            <div
              key={day}
              style={{
                textAlign: 'center',
                fontWeight: 'bold',
                color: '#666',
                padding: '0.5rem'
              }}
            >
              {day}
            </div>
          ))}
        </div>

        {/* Дни месяца */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: '0.5rem'
        }}>
          {/* Пустые ячейки до начала месяца */}
          {Array.from({ length: startDay }).map((_, i) => (
            <div key={`empty-${i}`} style={{ minHeight: '100px' }} />
          ))}

          {/* Дни месяца */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dayInstances = getDayInstances(day);
            const dayStatus = getDayStatus(day);
            const date = monthStart.add(day - 1, 'day');

            return (
              <div
                key={day}
                style={{
                  minHeight: '100px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '4px',
                  padding: '0.5rem',
                  background: dayStatus.status === 'success' ? '#f0fdf4' :
                    dayStatus.status === 'fail' ? '#fef2f2' : 'white',
                  position: 'relative'
                }}
              >
                <div style={{
                  fontWeight: 'bold',
                  marginBottom: '0.25rem',
                  color: dayStatus.status === 'success' ? '#10b981' :
                    dayStatus.status === 'fail' ? '#ef4444' : '#666'
                }}>
                  {day}
                </div>
                {dayStatus.status !== 'empty' && (
                  <div style={{ fontSize: '0.75rem', marginBottom: '0.25rem', color: '#666' }}>
                    {dayStatus.done}/{dayStatus.required}
                  </div>
                )}
                <div style={{ fontSize: '0.7rem' }}>
                  {dayInstances.map(instance => (
                    <div
                      key={instance.id}
                      style={{
                        marginBottom: '0.25rem',
                        padding: '0.25rem',
                        background: instance.status === 'done' ? '#dcfce7' :
                          instance.status === 'moved' ? '#fef3c7' : '#f3f4f6',
                        borderRadius: '2px',
                        fontSize: '0.7rem'
                      }}
                    >
                      {getTaskTitle(instance.templateId)}:{' '}
                      {instance.status === 'done' && '✅'}
                      {instance.status === 'moved' && '⏭️'}
                      {instance.status === 'pending' && '⏳'}
                    </div>
                  ))}
                </div>
                {dayStatus.status === 'success' && (
                  <div style={{
                    position: 'absolute',
                    top: '0.25rem',
                    right: '0.25rem',
                    fontSize: '1.2rem'
                  }}>
                    ✅
                  </div>
                )}
                {dayStatus.status === 'fail' && dayStatus.required > 0 && (
                  <div style={{
                    position: 'absolute',
                    top: '0.25rem',
                    right: '0.25rem',
                    fontSize: '1.2rem'
                  }}>
                    ❌
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Статистика переносов */}
      <div style={{
        background: 'white',
        padding: '1.5rem',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <div style={{ fontSize: '1.1rem', color: '#333' }}>
          <strong>Всего переносов в этом месяце:</strong> {totalMoves}
        </div>
      </div>
    </div>
  );
}

