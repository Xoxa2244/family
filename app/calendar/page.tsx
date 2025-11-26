'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import dayjs from 'dayjs';
import 'dayjs/locale/ru';
import { useAppState } from '@/lib/stateContext';

dayjs.locale('ru');

// Дата начала истории - 26 ноября 2024
const HISTORY_START_DATE = dayjs('2024-11-26');

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
  // Включаем все инстансы, которые были созданы в этом месяце или перенесены сюда
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

  const getDayInfo = (day: number) => {
    const date = monthStart.add(day - 1, 'day');
    const weekday = date.day();
    const quota = userQuotas.find(q => q.weekday === weekday);
    const tasksRequired = quota?.tasksRequired ?? 0;
    const isBeforeHistory = date.isBefore(HISTORY_START_DATE, 'day');
    const isToday = date.isSame(dayjs(), 'day');
    const isPast = date.isBefore(dayjs(), 'day') && !isToday;

    // Если дата до начала истории - не показываем количество задач
    if (isBeforeHistory || tasksRequired === 0) {
      return { 
        status: 'empty', 
        required: 0, 
        done: 0, 
        isBeforeHistory,
        isPast,
        isToday 
      };
    }

    const dayInstances = getDayInstances(day);
    const tasksDone = dayInstances.filter(i => i.status === 'done').length;
    const tasksPending = dayInstances.filter(i => i.status === 'pending').length;
    const tasksMoved = dayInstances.filter(i => i.status === 'moved').length;

    return {
      required: tasksRequired,
      done: tasksDone,
      pending: tasksPending,
      moved: tasksMoved,
      isBeforeHistory: false,
      isPast,
      isToday,
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
            const dayInfo = getDayInfo(day);
            const date = monthStart.add(day - 1, 'day');

            // Рендерим слоты для задач
            const renderSlots = () => {
              const slots = [];
              
              // До начала истории - показываем только серые плашки без данных
              if (dayInfo.isBeforeHistory) {
                if (dayInfo.required === 0) {
                  return null;
                }
                // Показываем серые плашки с вопросиками
                for (let i = 0; i < dayInfo.required; i++) {
                  slots.push(
                    <div
                      key={`slot-${i}`}
                      style={{
                        marginBottom: '0.25rem',
                        padding: '0.25rem',
                        background: '#f3f4f6',
                        borderRadius: '2px',
                        fontSize: '0.7rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        opacity: 0.5
                      }}
                    >
                      <span style={{ color: '#666' }}>❓</span>
                    </div>
                  );
                }
                return slots;
              }

              // С 26 ноября - показываем реальные данные
              // Разделяем инстансы на обычные (в рамках квоты) и перенесенные (сверх квоты)
              // Обычные: done, pending (moveCount = 0), moved (показываются в слотах по квоте)
              // Перенесенные: pending с moveCount > 0 (перенесены с предыдущего дня, показываются сверх квоты)
              const regularInstances: typeof dayInstances = [];
              const movedInstances: typeof dayInstances = [];
              
              dayInstances.forEach(instance => {
                // Перенесенные задачи - это pending с moveCount > 0 (перенесены с предыдущего дня)
                // Они показываются сверх квоты
                if (instance.status === 'pending' && instance.moveCount > 0) {
                  movedInstances.push(instance);
                } else {
                  // Обычные задачи: done, pending (moveCount = 0), moved
                  // Показываются в слотах по квоте
                  regularInstances.push(instance);
                }
              });

              // Сортируем обычные инстансы: сначала выполненные, потом pending, потом moved
              const sortedRegularInstances = [...regularInstances].sort((a, b) => {
                if (a.status === 'done' && b.status !== 'done') return -1;
                if (a.status !== 'done' && b.status === 'done') return 1;
                if (a.status === 'pending' && b.status === 'moved') return -1;
                if (a.status === 'moved' && b.status === 'pending') return 1;
                return 0;
              });

              // Рендерим слоты по квоте (с 26 ноября всегда показываем слоты)
              for (let i = 0; i < dayInfo.required; i++) {
                const instance = sortedRegularInstances[i];
                let slotStatus: 'done' | 'pending' | 'moved' | 'empty' | 'failed' = 'empty';
                let taskTitle = '';

                if (instance) {
                  slotStatus = instance.status;
                  taskTitle = getTaskTitle(instance.templateId);
                } else if (dayInfo.isPast) {
                  // Если день прошел и слот не заполнен - красный крестик (только с 26 ноября)
                  slotStatus = 'failed';
                }

                const isDone = slotStatus === 'done';
                const isFailed = slotStatus === 'failed';
                const isEmpty = slotStatus === 'empty';
                const isPending = slotStatus === 'pending';
                const isMoved = slotStatus === 'moved';

                slots.push(
                  <div
                    key={`slot-${i}`}
                    style={{
                      marginBottom: '0.25rem',
                      padding: '0.25rem',
                      background: isDone ? '#dcfce7' :
                        isFailed ? '#fee2e2' :
                        isMoved ? '#fef3c7' :
                        '#f3f4f6',
                      borderRadius: '2px',
                      fontSize: '0.7rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      border: isFailed ? '1px solid #ef4444' : 'none'
                    }}
                  >
                    {taskTitle && <span>{taskTitle}:</span>}
                    {isDone && <span>✅</span>}
                    {isFailed && <span style={{ color: '#ef4444', fontWeight: 'bold' }}>❌</span>}
                    {isMoved && <span>➡️</span>}
                    {isPending && <span>⏳</span>}
                    {isEmpty && <span style={{ color: '#666' }}>❓</span>}
                  </div>
                );
              }

              // Рендерим перенесенные задачи сверх квоты
              movedInstances.forEach((instance, index) => {
                const taskTitle = getTaskTitle(instance.templateId);
                slots.push(
                  <div
                    key={`moved-${instance.id}`}
                    style={{
                      marginBottom: '0.25rem',
                      padding: '0.25rem',
                      background: '#fef3c7',
                      borderRadius: '2px',
                      fontSize: '0.7rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      border: '1px dashed #f59e0b'
                    }}
                  >
                    <span>{taskTitle}:</span>
                    <span>⏳</span>
                    <span style={{ fontSize: '0.65rem', color: '#92400e', marginLeft: 'auto' }}>
                      (перенесено)
                    </span>
                  </div>
                );
              });

              return slots.length > 0 ? slots : null;
            };

            return (
              <div
                key={day}
                style={{
                  minHeight: '100px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '4px',
                  padding: '0.5rem',
                  background: dayInfo.isBeforeHistory ? '#f9fafb' : 'white',
                  position: 'relative',
                  opacity: dayInfo.isBeforeHistory ? 0.7 : 1
                }}
              >
                <div style={{
                  fontWeight: 'bold',
                  marginBottom: '0.25rem',
                  color: dayInfo.isBeforeHistory ? '#999' : '#666'
                }}>
                  {day}
                </div>
                {dayInfo.required > 0 && (
                  <div style={{ 
                    fontSize: '0.75rem', 
                    marginBottom: '0.5rem', 
                    color: dayInfo.isBeforeHistory ? '#999' : '#666' 
                  }}>
                    {dayInfo.isBeforeHistory ? (
                      '0/0'
                    ) : (
                      <>
                        {dayInfo.done}/{dayInfo.required}
                        {(() => {
                          // Считаем перенесенные задачи (pending с moveCount > 0)
                          const movedCount = dayInstances.filter(i => i.status === 'pending' && i.moveCount > 0).length;
                          return movedCount > 0 ? ` +${movedCount} перенесено` : '';
                        })()}
                      </>
                    )}
                  </div>
                )}
                <div style={{ fontSize: '0.7rem' }}>
                  {renderSlots()}
                </div>
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

