'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppState } from '@/lib/stateContext';
import { User, TaskTemplate, DailyQuota } from '@/types';
import * as dbService from '@/lib/dbService';

export default function AdminPage() {
  const router = useRouter();
  const { state, updateState } = useAppState();
  const [activeTab, setActiveTab] = useState<'users' | 'tasks' | 'quotas'>('users');
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const currentUser = state.users.find(u => u.id === state.currentUserId);

  useEffect(() => {
    if (!state.currentUserId) {
      router.push('/login');
      return;
    }
    // Если пользователь - родитель, автоматически разрешаем доступ
    if (currentUser?.role === 'parent') {
      setIsAuthorized(true);
    }
  }, [state.currentUserId, currentUser, router]);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPassword === '1234') {
      setIsAuthorized(true);
      setPasswordError('');
    } else {
      setPasswordError('Неверный пароль');
    }
  };

  if (!isAuthorized) {
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
            Админ-пароль
          </h1>
          <form onSubmit={handlePasswordSubmit}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: '#666' }}>
                Пароль администратора
              </label>
              <input
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
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
            {passwordError && (
              <div style={{
                marginBottom: '1rem',
                padding: '0.75rem',
                background: '#fee',
                color: '#c33',
                borderRadius: '4px',
                fontSize: '0.9rem'
              }}>
                {passwordError}
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
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 style={{ marginBottom: '1.5rem', fontSize: '2rem', color: '#333' }}>
        Админ-кабинет
      </h1>

      {/* Вкладки */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        marginBottom: '2rem',
        borderBottom: '2px solid #e5e7eb'
      }}>
        <button
          onClick={() => setActiveTab('users')}
          style={{
            padding: '0.75rem 1.5rem',
            background: activeTab === 'users' ? '#667eea' : 'transparent',
            color: activeTab === 'users' ? 'white' : '#666',
            border: 'none',
            borderBottom: activeTab === 'users' ? '2px solid #667eea' : '2px solid transparent',
            cursor: 'pointer',
            fontWeight: activeTab === 'users' ? 'bold' : 'normal',
            marginBottom: '-2px'
          }}
        >
          Пользователи
        </button>
        <button
          onClick={() => setActiveTab('tasks')}
          style={{
            padding: '0.75rem 1.5rem',
            background: activeTab === 'tasks' ? '#667eea' : 'transparent',
            color: activeTab === 'tasks' ? 'white' : '#666',
            border: 'none',
            borderBottom: activeTab === 'tasks' ? '2px solid #667eea' : '2px solid transparent',
            cursor: 'pointer',
            fontWeight: activeTab === 'tasks' ? 'bold' : 'normal',
            marginBottom: '-2px'
          }}
        >
          Справочник дел
        </button>
        <button
          onClick={() => setActiveTab('quotas')}
          style={{
            padding: '0.75rem 1.5rem',
            background: activeTab === 'quotas' ? '#667eea' : 'transparent',
            color: activeTab === 'quotas' ? 'white' : '#666',
            border: 'none',
            borderBottom: activeTab === 'quotas' ? '2px solid #667eea' : '2px solid transparent',
            cursor: 'pointer',
            fontWeight: activeTab === 'quotas' ? 'bold' : 'normal',
            marginBottom: '-2px'
          }}
        >
          План по дням недели
        </button>
      </div>

      {/* Контент вкладок */}
      {activeTab === 'users' && <UsersTab />}
      {activeTab === 'tasks' && <TasksTab />}
      {activeTab === 'quotas' && <QuotasTab />}
    </div>
  );
}

// Вкладка "Пользователи"
function UsersTab() {
  const { state, updateState, refreshState } = useAppState();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newUser, setNewUser] = useState({ name: '', login: '', role: 'child' as 'parent' | 'child' });
  const [showAddForm, setShowAddForm] = useState(false);

  const handleSaveUser = async (userId: string, updates: Partial<User>) => {
    try {
      await dbService.updateUser(userId, updates);
      updateState(prev => ({
        ...prev,
        users: prev.users.map(u =>
          u.id === userId ? { ...u, ...updates } : u
        ),
      }));
      setEditingId(null);
    } catch (error) {
      console.error('Failed to save user:', error);
      alert('Ошибка при сохранении пользователя');
    }
  };

  const handleAddUser = async () => {
    if (!newUser.name.trim() || !newUser.login.trim()) {
      alert('Заполните все поля');
      return;
    }

    // Проверяем, что логин уникален
    const existingUser = state.users.find(u => u.login.toLowerCase() === newUser.login.toLowerCase());
    if (existingUser) {
      alert('Пользователь с таким логином уже существует');
      return;
    }

    const user: User = {
      id: crypto.randomUUID(),
      name: newUser.name,
      login: newUser.login,
      role: newUser.role,
    };

    try {
      await dbService.createUser(user);
      await refreshState(); // Перезагружаем состояние, чтобы получить обновлённый список
      setNewUser({ name: '', login: '', role: 'child' });
      setShowAddForm(false);
    } catch (error) {
      console.error('Failed to add user:', error);
      alert('Ошибка при добавлении пользователя');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Вы уверены, что хотите удалить этого пользователя? Все его данные (дела, квоты) будут удалены.')) {
      return;
    }

    try {
      await dbService.deleteUser(userId);
      await refreshState(); // Перезагружаем состояние
    } catch (error) {
      console.error('Failed to delete user:', error);
      alert('Ошибка при удалении пользователя');
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          style={{
            padding: '0.75rem 1.5rem',
            background: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          {showAddForm ? 'Отмена' : '+ Добавить пользователя'}
        </button>
      </div>

      {showAddForm && (
        <div style={{
          background: 'white',
          padding: '1.5rem',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          marginBottom: '1.5rem'
        }}>
          <h3 style={{ marginBottom: '1rem' }}>Новый пользователь</h3>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Имя</label>
            <input
              type="text"
              value={newUser.name}
              onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #ddd',
                borderRadius: '4px'
              }}
              placeholder="Например: Роман"
            />
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Логин</label>
            <input
              type="text"
              value={newUser.login}
              onChange={(e) => setNewUser({ ...newUser, login: e.target.value })}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #ddd',
                borderRadius: '4px'
              }}
              placeholder="Например: Roman"
            />
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Роль</label>
            <select
              value={newUser.role}
              onChange={(e) => setNewUser({ ...newUser, role: e.target.value as 'parent' | 'child' })}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #ddd',
                borderRadius: '4px'
              }}
            >
              <option value="child">Ребёнок</option>
              <option value="parent">Родитель</option>
            </select>
          </div>
          <button
            onClick={handleAddUser}
            style={{
              padding: '0.75rem 1.5rem',
              background: '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            Сохранить
          </button>
        </div>
      )}

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
              <th style={{ padding: '0.75rem', textAlign: 'left' }}>Имя</th>
              <th style={{ padding: '0.75rem', textAlign: 'left' }}>Логин</th>
              <th style={{ padding: '0.75rem', textAlign: 'left' }}>Роль</th>
              <th style={{ padding: '0.75rem', textAlign: 'center' }}>Действия</th>
            </tr>
          </thead>
          <tbody>
            {state.users.map(user => (
              <tr key={user.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td style={{ padding: '0.75rem' }}>
                  {editingId === user.id ? (
                    <input
                      type="text"
                      defaultValue={user.name}
                      onBlur={(e) => handleSaveUser(user.id, { name: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.5rem',
                        border: '1px solid #ddd',
                        borderRadius: '4px'
                      }}
                    />
                  ) : (
                    <span style={{ fontWeight: 'bold' }}>{user.name}</span>
                  )}
                </td>
                <td style={{ padding: '0.75rem' }}>
                  {editingId === user.id ? (
                    <input
                      type="text"
                      defaultValue={user.login}
                      onBlur={(e) => handleSaveUser(user.id, { login: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.5rem',
                        border: '1px solid #ddd',
                        borderRadius: '4px'
                      }}
                    />
                  ) : (
                    <span>{user.login}</span>
                  )}
                </td>
                <td style={{ padding: '0.75rem' }}>
                  {editingId === user.id ? (
                    <select
                      defaultValue={user.role}
                      onChange={(e) => handleSaveUser(user.id, { role: e.target.value as 'parent' | 'child' })}
                      style={{
                        width: '100%',
                        padding: '0.5rem',
                        border: '1px solid #ddd',
                        borderRadius: '4px'
                      }}
                    >
                      <option value="child">Ребёнок</option>
                      <option value="parent">Родитель</option>
                    </select>
                  ) : (
                    <span style={{
                      padding: '0.25rem 0.75rem',
                      background: user.role === 'parent' ? '#667eea' : '#10b981',
                      color: 'white',
                      borderRadius: '4px',
                      fontSize: '0.85rem',
                      fontWeight: 'bold'
                    }}>
                      {user.role === 'parent' ? 'Родитель' : 'Ребёнок'}
                    </span>
                  )}
                </td>
                <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                    <button
                      onClick={() => setEditingId(editingId === user.id ? null : user.id)}
                      style={{
                        padding: '0.5rem 1rem',
                        background: '#667eea',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '0.9rem'
                      }}
                    >
                      {editingId === user.id ? 'Сохранить' : 'Редактировать'}
                    </button>
                    <button
                      onClick={() => handleDeleteUser(user.id)}
                      style={{
                        padding: '0.5rem 1rem',
                        background: '#ef4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '0.9rem'
                      }}
                    >
                      Удалить
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Вкладка "Справочник дел"
function TasksTab() {
  const { state, updateState, refreshState } = useAppState();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newTask, setNewTask] = useState({ title: '', condition: '', assignedUserIds: [] as string[] });
  const [showAddForm, setShowAddForm] = useState(false);

  const handleSaveTask = async (taskId: string, updates: Partial<TaskTemplate>) => {
    try {
      await dbService.updateTaskTemplate(taskId, updates);
      updateState(prev => ({
        ...prev,
        taskTemplates: prev.taskTemplates.map(t =>
          t.id === taskId ? { ...t, ...updates } : t
        ),
      }));
      setEditingId(null);
    } catch (error) {
      console.error('Failed to save task:', error);
      alert('Ошибка при сохранении дела');
    }
  };

  const handleAddTask = async () => {
    if (!newTask.title.trim()) return;

    const newTemplate: TaskTemplate = {
      id: crypto.randomUUID(),
      title: newTask.title,
      condition: newTask.condition,
      active: true,
      assignedUserIds: newTask.assignedUserIds,
    };

    try {
      await dbService.createTaskTemplate(newTemplate);
      updateState(prev => ({
        ...prev,
        taskTemplates: [...prev.taskTemplates, newTemplate],
      }));
      setNewTask({ title: '', condition: '', assignedUserIds: [] });
      setShowAddForm(false);
    } catch (error) {
      console.error('Failed to add task:', error);
      alert('Ошибка при добавлении дела');
    }
  };

  const handleToggleUser = async (taskId: string, userId: string) => {
    const task = state.taskTemplates.find(t => t.id === taskId);
    if (!task) return;

    const hasUser = task.assignedUserIds.includes(userId);
    const newAssignedUserIds = hasUser
      ? task.assignedUserIds.filter(id => id !== userId)
      : [...task.assignedUserIds, userId];

    try {
      await dbService.updateTaskTemplate(taskId, { assignedUserIds: newAssignedUserIds });
      updateState(prev => ({
        ...prev,
        taskTemplates: prev.taskTemplates.map(t =>
          t.id === taskId ? { ...t, assignedUserIds: newAssignedUserIds } : t
        ),
      }));
    } catch (error) {
      console.error('Failed to toggle user:', error);
      alert('Ошибка при обновлении назначения');
    }
  };

  const handleToggleActive = async (taskId: string) => {
    const task = state.taskTemplates.find(t => t.id === taskId);
    if (!task) return;

    try {
      await dbService.updateTaskTemplate(taskId, { active: !task.active });
      updateState(prev => ({
        ...prev,
        taskTemplates: prev.taskTemplates.map(t =>
          t.id === taskId ? { ...t, active: !t.active } : t
        ),
      }));
    } catch (error) {
      console.error('Failed to toggle active:', error);
      alert('Ошибка при обновлении статуса');
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          style={{
            padding: '0.75rem 1.5rem',
            background: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          {showAddForm ? 'Отмена' : '+ Добавить дело'}
        </button>
      </div>

      {showAddForm && (
        <div style={{
          background: 'white',
          padding: '1.5rem',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          marginBottom: '1.5rem'
        }}>
          <h3 style={{ marginBottom: '1rem' }}>Новое дело</h3>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Название</label>
            <input
              type="text"
              value={newTask.title}
              onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #ddd',
                borderRadius: '4px'
              }}
            />
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Условие</label>
            <textarea
              value={newTask.condition}
              onChange={(e) => setNewTask({ ...newTask, condition: e.target.value })}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #ddd',
                borderRadius: '4px',
                minHeight: '80px'
              }}
            />
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Кому доступно</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {state.users.map(user => (
                <label key={user.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type="checkbox"
                    checked={newTask.assignedUserIds.includes(user.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setNewTask({ ...newTask, assignedUserIds: [...newTask.assignedUserIds, user.id] });
                      } else {
                        setNewTask({ ...newTask, assignedUserIds: newTask.assignedUserIds.filter(id => id !== user.id) });
                      }
                    }}
                  />
                  {user.name}
                </label>
              ))}
            </div>
          </div>
          <button
            onClick={handleAddTask}
            style={{
              padding: '0.75rem 1.5rem',
              background: '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            Сохранить
          </button>
        </div>
      )}

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
              <th style={{ padding: '0.75rem', textAlign: 'left' }}>Название</th>
              <th style={{ padding: '0.75rem', textAlign: 'left' }}>Условие</th>
              <th style={{ padding: '0.75rem', textAlign: 'left' }}>Кому доступно</th>
              <th style={{ padding: '0.75rem', textAlign: 'center' }}>Активно</th>
              <th style={{ padding: '0.75rem', textAlign: 'center' }}>Действия</th>
            </tr>
          </thead>
          <tbody>
            {state.taskTemplates.map(task => (
              <tr key={task.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td style={{ padding: '0.75rem' }}>
                  {editingId === task.id ? (
                    <input
                      type="text"
                      defaultValue={task.title}
                      onBlur={(e) => handleSaveTask(task.id, { title: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.5rem',
                        border: '1px solid #ddd',
                        borderRadius: '4px'
                      }}
                    />
                  ) : (
                    <span style={{ fontWeight: 'bold' }}>{task.title}</span>
                  )}
                </td>
                <td style={{ padding: '0.75rem' }}>
                  {editingId === task.id ? (
                    <textarea
                      defaultValue={task.condition}
                      onBlur={(e) => handleSaveTask(task.id, { condition: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.5rem',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        minHeight: '60px'
                      }}
                    />
                  ) : (
                    <span>{task.condition || '-'}</span>
                  )}
                </td>
                <td style={{ padding: '0.75rem' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {state.users.map(user => (
                      <label key={user.id} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.9rem' }}>
                        <input
                          type="checkbox"
                          checked={task.assignedUserIds.includes(user.id)}
                          onChange={() => handleToggleUser(task.id, user.id)}
                        />
                        {user.name}
                      </label>
                    ))}
                  </div>
                </td>
                <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                  <button
                    onClick={() => handleToggleActive(task.id)}
                    style={{
                      padding: '0.25rem 0.75rem',
                      background: task.active ? '#10b981' : '#ef4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '0.85rem'
                    }}
                  >
                    {task.active ? 'Да' : 'Нет'}
                  </button>
                </td>
                <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                  <button
                    onClick={() => setEditingId(editingId === task.id ? null : task.id)}
                    style={{
                      padding: '0.5rem 1rem',
                      background: '#667eea',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '0.9rem'
                    }}
                  >
                    {editingId === task.id ? 'Сохранить' : 'Редактировать'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Вкладка "План по дням недели"
function QuotasTab() {
  const { state, updateState } = useAppState();
  const weekDays = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];

  const handleQuotaChange = async (userId: string, weekday: number, value: number) => {
    const numValue = Math.max(0, Math.min(3, parseInt(String(value)) || 0));
    
    const quota: DailyQuota = { userId, weekday, tasksRequired: numValue };
    
    try {
      await dbService.upsertDailyQuota(quota);
      updateState(prev => {
        const existing = prev.dailyQuotas.find(
          q => q.userId === userId && q.weekday === weekday
        );

        if (existing) {
          return {
            ...prev,
            dailyQuotas: prev.dailyQuotas.map(q =>
              q.userId === userId && q.weekday === weekday
                ? { ...q, tasksRequired: numValue }
                : q
            ),
          };
        } else {
          return {
            ...prev,
            dailyQuotas: [...prev.dailyQuotas, quota],
          };
        }
      });
    } catch (error) {
      console.error('Failed to save quota:', error);
      alert('Ошибка при сохранении квоты');
    }
  };

  const getQuota = (userId: string, weekday: number): number => {
    const quota = state.dailyQuotas.find(q => q.userId === userId && q.weekday === weekday);
    return quota?.tasksRequired ?? 0;
  };

  return (
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
            <th style={{ padding: '0.75rem', textAlign: 'left' }}>День недели</th>
            {state.users.map(user => (
              <th key={user.id} style={{ padding: '0.75rem', textAlign: 'center' }}>
                {user.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {weekDays.map((dayName, weekday) => (
            <tr key={weekday} style={{ borderBottom: '1px solid #e5e7eb' }}>
              <td style={{ padding: '0.75rem', fontWeight: 'bold' }}>{dayName}</td>
              {state.users.map(user => (
                <td key={user.id} style={{ padding: '0.75rem', textAlign: 'center' }}>
                  <input
                    type="number"
                    min="0"
                    max="3"
                    value={getQuota(user.id, weekday)}
                    onChange={(e) => handleQuotaChange(user.id, weekday, Number(e.target.value))}
                    style={{
                      width: '60px',
                      padding: '0.5rem',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      textAlign: 'center'
                    }}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

