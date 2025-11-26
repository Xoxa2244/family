'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AppState } from '@/types';
import { defaultState } from './defaultState';

const STORAGE_KEY = 'home-tracker-state';

interface AppStateContextType {
  state: AppState;
  updateState: (updater: (prev: AppState) => AppState) => void;
}

const AppStateContext = createContext<AppStateContextType | undefined>(undefined);

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(defaultState);
  const [isInitialized, setIsInitialized] = useState(false);

  // Загрузка из localStorage при монтировании
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as AppState;
        setState(parsed);
      }
    } catch (error) {
      console.error('Failed to load state from localStorage:', error);
    } finally {
      setIsInitialized(true);
    }
  }, []);

  // Сохранение в localStorage при изменении
  useEffect(() => {
    if (!isInitialized) return;

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error('Failed to save state to localStorage:', error);
    }
  }, [state, isInitialized]);

  const updateState = useCallback((updater: (prev: AppState) => AppState) => {
    setState(prev => updater(prev));
  }, []);

  if (!isInitialized) {
    return <div>Загрузка...</div>;
  }

  return (
    <AppStateContext.Provider value={{ state, updateState }}>
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

