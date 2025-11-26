'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AppState } from '@/types';
import * as dbService from './dbService';

interface AppStateContextType {
  state: AppState;
  updateState: (updater: (prev: AppState) => AppState) => void;
  isLoading: boolean;
  refreshState: () => Promise<void>;
}

const AppStateContext = createContext<AppStateContextType | undefined>(undefined);

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>({
    users: [],
    taskTemplates: [],
    dailyQuotas: [],
    taskInstances: [],
    currentUserId: undefined,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  const loadState = useCallback(async () => {
    try {
      // Инициализируем данные по умолчанию, если их ещё нет
      await dbService.initializeDefaultData();

      // Загружаем все данные
      const [users, taskTemplates, dailyQuotas, taskInstances, currentUserId] = await Promise.all([
        dbService.getUsers(),
        dbService.getTaskTemplates(),
        dbService.getDailyQuotas(),
        dbService.getTaskInstances(),
        dbService.getCurrentUserId(),
      ]);

      setState({
        users,
        taskTemplates,
        dailyQuotas,
        taskInstances,
        currentUserId,
      });
    } catch (error) {
      console.error('Failed to load state from database:', error);
    } finally {
      setIsLoading(false);
      setIsInitialized(true);
    }
  }, []);

  useEffect(() => {
    loadState();
  }, [loadState]);

  const updateState = useCallback((updater: (prev: AppState) => AppState) => {
    const newState = updater(state);
    setState(newState);

    // Сохраняем изменения в базу данных асинхронно в фоне
    (async () => {
      try {
        // Обновляем currentUserId
        if (newState.currentUserId !== state.currentUserId) {
          await dbService.setCurrentUserId(newState.currentUserId);
        }

        // Обновляем task instances
        const oldInstances = state.taskInstances;
        const newInstances = newState.taskInstances;

        // Находим новые и изменённые инстансы
        const oldInstanceMap = new Map(oldInstances.map(i => [i.id, i]));
        const newInstanceMap = new Map(newInstances.map(i => [i.id, i]));

        // Добавляем новые инстансы
        for (const instance of newInstances) {
          if (!oldInstanceMap.has(instance.id)) {
            await dbService.createTaskInstance(instance);
          }
        }

        // Обновляем изменённые инстансы
        for (const instance of newInstances) {
          const oldInstance = oldInstanceMap.get(instance.id);
          if (oldInstance && (
            oldInstance.status !== instance.status ||
            oldInstance.moveCount !== instance.moveCount ||
            oldInstance.date !== instance.date ||
            oldInstance.userId !== instance.userId ||
            oldInstance.templateId !== instance.templateId
          )) {
            await dbService.updateTaskInstance(instance.id, instance);
          }
        }
      } catch (error) {
        console.error('Failed to save state to database:', error);
      }
    })();
  }, [state]);

  const refreshState = useCallback(async () => {
    setIsLoading(true);
    await loadState();
  }, [loadState]);

  if (!isInitialized) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Загрузка...</div>;
  }

  return (
    <AppStateContext.Provider value={{ state, updateState, isLoading, refreshState }}>
      {children}
    </AppStateContext.Provider>
  );
}

export function useAppState() {
  const context = useContext(AppStateContext);
  if (context === undefined) {
    throw new Error('useAppState must be used within an AppStateProvider');
  }
  return context;
}
