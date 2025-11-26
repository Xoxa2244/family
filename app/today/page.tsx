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
  const [confirmModal, setConfirmModal] = useState<{ instanceId: string; condition: string } | null>(null);
  const [moveModal, setMoveModal] = useState<{ instance: TaskInstance } | null>(null);

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

  const handleMarkDoneClick = (instanceId: string) => {
    const instance = state.taskInstances.find(t => t.id === instanceId);
    if (!instance) return;
    
    const template = state.taskTemplates.find(t => t.id === instance.templateId);
    const condition = template?.condition || '';
    
    setConfirmModal({ instanceId, condition });
  };

  const handleConfirmDone = (confirmed: boolean) => {
    if (!confirmModal) return;
    
    if (confirmed) {
      // Пользователь подтвердил выполнение
      updateState(prev => ({
        ...prev,
        taskInstances: prev.taskInstances.map(t =>
          t.id === confirmModal.instanceId ? { ...t, status: 'done' as TaskStatus } : t
        ),
      }));
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2000);
    }
    // Если не подтвердил - просто закрываем модальное окно, статус не меняем
    setConfirmModal(null);
  };

  const handleMoveToTomorrowClick = (instance: TaskInstance) => {
    setMoveModal({ instance });
  };

  const handleConfirmMove = (confirmed: boolean) => {
    if (!moveModal) return;
    
    if (confirmed) {
      const instance = moveModal.instance;
      
      // Создаём новый инстанс на завтра
      const newInstance: TaskInstance = {
        id: crypto.randomUUID(),
        userId: instance.userId,
        templateId: instance.templateId,
        date: tomorrow,
        status: 'pending',
        moveCount: instance.moveCount,
      };

      // Обновляем текущий инстанс и добавляем новый в одном обновлении
      updateState(prev => ({
        ...prev,
        taskInstances: [
          ...prev.taskInstances.map(t =>
            t.id === instance.id
              ? { ...t, status: 'moved' as TaskStatus, moveCount: t.moveCount + 1 }
              : t
          ),
          newInstance,
        ],
      }));
    }
    
    setMoveModal(null);
  };

  const handleResetDay = () => {
    if (!confirm('Вы уверены, что хотите сбросить все дела на сегодня? Все данные будут удалены.')) {
      return;
    }

    // Удаляем все инстансы задач на сегодня для текущего пользователя
    updateState(prev => ({
      ...prev,
      taskInstances: prev.taskInstances.filter(
        t => !(t.userId === currentUser.id && t.date === today)
      ),
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
                      {isMoved && '➡️ Перенесено'}
                      {instance.status === 'pending' && '⏳ В процессе'}
                      {instance.moveCount > 0 && ` (переносов: ${instance.moveCount})`}
                    </div>
                  </div>
                  {!isDone && !isMoved && (
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => handleMarkDoneClick(instance.id)}
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
                        onClick={() => handleMoveToTomorrowClick(instance)}
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

      {/* Модальное окно подтверждения выполнения */}
      {confirmModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000
        }}
        onClick={() => setConfirmModal(null)}
        >
          <div style={{
            background: 'white',
            padding: '2rem',
            borderRadius: '8px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            maxWidth: '400px',
            width: '90%',
            textAlign: 'center'
          }}
          onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem', color: '#333' }}>
              {confirmModal.condition 
                ? `Условие "${confirmModal.condition}" выполнено?`
                : 'Дело выполнено?'
              }
            </h2>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button
                onClick={() => handleConfirmDone(true)}
                style={{
                  padding: '0.75rem 2rem',
                  background: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '1rem'
                }}
              >
                Да!
              </button>
              <button
                onClick={() => handleConfirmDone(false)}
                style={{
                  padding: '0.75rem 2rem',
                  background: '#f59e0b',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '1rem'
                }}
              >
                Не совсем. Еще поделаю
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно подтверждения переноса */}
      {moveModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000
        }}
        onClick={() => setMoveModal(null)}
        >
          <div style={{
            background: 'white',
            padding: '2rem',
            borderRadius: '8px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            maxWidth: '400px',
            width: '90%',
            textAlign: 'center'
          }}
          onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem', color: '#333' }}>
              Перенести "{getTaskTitle(moveModal.instance.templateId)}" на завтра?
            </h2>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button
                onClick={() => handleConfirmMove(true)}
                style={{
                  padding: '0.75rem 2rem',
                  background: '#f59e0b',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '1rem'
                }}
              >
                Да, перенести
              </button>
              <button
                onClick={() => handleConfirmMove(false)}
                style={{
                  padding: '0.75rem 2rem',
                  background: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '1rem'
                }}
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast уведомление */}
      {showToast && (
        <div style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          padding: '2rem 4rem',
          background: '#10b981',
          color: 'white',
          borderRadius: '16px',
          boxShadow: '0 8px 16px rgba(0,0,0,0.2)',
          fontSize: '2.5rem',
          fontWeight: 'bold',
          zIndex: 2000,
          textAlign: 'center',
          animation: 'fadeIn 0.3s ease-in'
        }}>
          Ты молодец! 🎉
        </div>
      )}

      {/* Кнопка сброса дня (только для родителя) */}
      {currentUser.role === 'parent' && (
        <div style={{
          marginTop: '3rem',
          paddingTop: '2rem',
          borderTop: '1px solid #e5e7eb',
          textAlign: 'center'
        }}>
          <button
            onClick={handleResetDay}
            style={{
              padding: '0.5rem 1rem',
              background: 'transparent',
              color: '#6b7280',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: 'normal'
            }}
          >
            Сбросить день
          </button>
          <div style={{
            marginTop: '0.25rem',
            fontSize: '0.75rem',
            color: '#9ca3af'
          }}>
            Делает только папа
          </div>
        </div>
      )}
    </div>
  );
}

