import { create } from 'zustand';
import { SystemState, SystemError } from '../types/system';

interface SystemStore extends SystemState {
  setConnection: (isConnected: boolean) => void;
  setActiveSymbol: (symbol: string | null) => void;
  setActiveTimeframe: (timeframe: string) => void;
  addError: (error: Omit<SystemError, 'id' | 'timestamp'>) => void;
  removeError: (id: string) => void;
  clearErrors: () => void;
}

export const useSystemStore = create<SystemStore>((set) => ({
  isConnected: false,
  lastUpdate: new Date().toISOString(),
  errors: [],
  activeSymbol: null,
  activeTimeframe: '1h',

  setConnection: (isConnected) =>
    set((state) => ({ 
      isConnected,
      lastUpdate: new Date().toISOString()
    })),

  setActiveSymbol: (symbol) =>
    set({ activeSymbol: symbol }),

  setActiveTimeframe: (timeframe) =>
    set({ activeTimeframe: timeframe }),

  addError: (error) =>
    set((state) => ({
      errors: [
        ...state.errors,
        {
          ...error,
          id: Math.random().toString(36).substr(2, 9),
          timestamp: new Date().toISOString()
        }
      ]
    })),

  removeError: (id) =>
    set((state) => ({
      errors: state.errors.filter((error) => error.id !== id)
    })),

  clearErrors: () =>
    set({ errors: [] })
}));