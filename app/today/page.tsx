'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import dayjs from 'dayjs';
import { useAppState } from '@/lib/stateContext';
import { TaskInstance, TaskStatus } from '@/types';

export default function TodayPage() {
  const router = useRouter();
  const { state, updateState } = useAppState();
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [showToast, setShowToast] = useState(false);

  const currentUser = state.users.find(u => u.id === state.currentUserId);
  const today = dayjs().format('YYYY-MM-DD');
  const tomorrow = dayjs().add(1, 'day').format('YYYY-MM-DD');
  const weekday = dayjs().day();

  useEffect(() => {
    if (!state.currentUserId) {
      router.push('/login');
    }
  }, [state.currentUserId, router]);

  if (!currentUser) {
    return <div>Загрузка...</div>;
  }

  // Найти квоту на сегодня
  const quota = state.dailyQuotas.find(
    q => q.userId === currentUser.id && q.weekday === weekday
  );
  const tasksRequiredToday = quota?.tasksRequired ?? 0;

  // Найти все инстансы на сегодня
  const instancesToday = state.taskInstances.filter(
    t => t.userId === currentUser.id && t.date === today
  );

  // Найти доступные шаблоны
  const availableTemplates = state.taskTemplates.filter(
    t => t.active && t.assignedUserIds.includes(currentUser.id)
  );

  // Шаблоны, которые ещё не выбраны сегодня
  const unusedTemplates = availableTemplates.filter(
    t => !instancesToday.some(i => i.templateId === t.id)
  );

  const tasksDone = instancesToday.filter(t => t.status === 'done').length;
  const tasksPending = instancesToday.filter(t => t.status === 'pending').length;

  const handleAddTask = () => {
    if (!selectedTemplateId) return;

    const newInstance: TaskInstance = {
      id: crypto.randomUUID(),
      userId: currentUser.id,
      templateId: selectedTemplateId,
      date: today,
      status: 'pending',
      moveCount: 0,
    };

    updateState(prev => ({
      ...prev,
      taskInstances: [...prev.taskInstances, newInstance],
    }));

    setSelectedTemplateId('');
  };

  const handleMarkDone = (instanceId: string) => {
    updateState(prev => ({
      ...prev,
      taskInstances: prev.taskInstances.map(t =>
        t.id === instanceId ? { ...t, status: 'done' as TaskStatus } : t
      ),
    }));
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  };

  const handleMoveToTomorrow = (instance: TaskInstance) => {
    // Обновляем текущий инстанс
    updateState(prev => ({
      ...prev,
      taskInstances: prev.taskInstances.map(t =>
        t.id === instance.id
          ? { ...t, status: 'moved' as TaskStatus, moveCount: t.moveCount + 1 }
          : t
      ),
    }));

    // Создаём новый инстанс на завтра
    const newInstance: TaskInstance = {
      id: crypto.randomUUID(),
      userId: instance.userId,
      templateId: instance.templateId,
      date: tomorrow,
      status: 'pending',
      moveCount: instance.moveCount,
    };

    updateState(prev => ({
      ...prev,
      taskInstances: [...prev.taskInstances, newInstance],
    }));
  };

  const getTaskTitle = (templateId: string) => {
    return state.taskTemplates.find(t => t.id === templateId)?.title || 'Неизвестное дело';
  };

  return (
    <div>
      <h1 style={{ marginBottom: '1.5rem', fontSize: '2rem', color: '#333' }}>
        Мои дела сегодня
      </h1>

      {/* Блок "План на сегодня" */}
      <div style={{
        background: 'white',
        padding: '1.5rem',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        marginBottom: '2rem'
      }}>
        <h2 style={{ marginBottom: '1rem', fontSize: '1.25rem', color: '#333' }}>
          План на сегодня
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div>
            <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.25rem' }}>Нужно дел по плану</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#667eea' }}>{tasksRequiredToday}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.25rem' }}>Уже выбрано</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#333' }}>{instancesToday.length}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.25rem' }}>Выполнено</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#10b981' }}>{tasksDone}</div>
          </div>
        </div>
        {tasksRequiredToday > 0 && (
          <div style={{ marginTop: '1rem', padding: '0.75rem', background: '#f0f9ff', borderRadius: '4px' }}>
            <strong>Сделано {tasksDone} из {tasksRequiredToday} по плану</strong>
          </div>
        )}
      </div>

      {/* Форма добавления дела */}
      {unusedTemplates.length > 0 && (
        <div style={{
          background: 'white',
          padding: '1.5rem',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          marginBottom: '2rem'
        }}>
          <h2 style={{ marginBottom: '1rem', fontSize: '1.25rem', color: '#333' }}>
            Добавить дело на сегодня
          </h2>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <select
              value={selectedTemplateId}
              onChange={(e) => setSelectedTemplateId(e.target.value)}
              style={{
                flex: 1,
                padding: '0.75rem',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '1rem'
              }}
            >
              <option value="">Выберите дело...</option>
              {unusedTemplates.map(t => (
                <option key={t.id} value={t.id}>{t.title}</option>
              ))}
            </select>
            <button
              onClick={handleAddTask}
              disabled={!selectedTemplateId}
              style={{
                padding: '0.75rem 2rem',
                background: selectedTemplateId ? '#667eea' : '#ccc',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '1rem',
                fontWeight: 'bold',
                cursor: selectedTemplateId ? 'pointer' : 'not-allowed'
              }}
            >
              Добавить
            </button>
          </div>
        </div>
      )}

      {/* Список дел на сегодня */}
      {instancesToday.length > 0 ? (
        <div style={{
          background: 'white',
          padding: '1.5rem',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ marginBottom: '1rem', fontSize: '1.25rem', color: '#333' }}>
            Мои дела
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {instancesToday.map(instance => {
              const isDone = instance.status === 'done';
              const isMoved = instance.status === 'moved';
              return (
                <div
                  key={instance.id}
                  style={{
                    padding: '1rem',
                    border: '1px solid #e5e7eb',
                    borderRadius: '4px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: isDone ? '#f0fdf4' : isMoved ? '#fef3c7' : 'white'
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>
                      {getTaskTitle(instance.templateId)}
                    </div>
                    <div style={{ fontSize: '0.9rem', color: '#666' }}>
                      {isDone && '✅ Выполнено'}
                      {isMoved && '⏭️ Перенесено'}
                      {instance.status === 'pending' && '⏳ В процессе'}
                      {instance.moveCount > 0 && ` (переносов: ${instance.moveCount})`}
                    </div>
                  </div>
                  {!isDone && !isMoved && (
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => handleMarkDone(instance.id)}
                        style={{
                          padding: '0.5rem 1rem',
                          background: '#10b981',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontWeight: 'bold'
                        }}
                      >
                        Сделано
                      </button>
                      <button
                        onClick={() => handleMoveToTomorrow(instance)}
                        style={{
                          padding: '0.5rem 1rem',
                          background: '#f59e0b',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontWeight: 'bold'
                        }}
                      >
                        Перенести на завтра
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div style={{
          background: 'white',
          padding: '2rem',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          textAlign: 'center',
          color: '#666'
        }}>
          Нет дел на сегодня. Добавьте дело из списка выше.
        </div>
      )}

      {/* Toast уведомление */}
      {showToast && (
        <div style={{
          position: 'fixed',
          bottom: '2rem',
          right: '2rem',
          padding: '1rem 2rem',
          background: '#10b981',
          color: 'white',
          borderRadius: '8px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          fontSize: '1.1rem',
          fontWeight: 'bold',
          zIndex: 1000
        }}>
          Я молодец! 🎉
        </div>
      )}
    </div>
  );
}

