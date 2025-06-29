import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UserPreferences {
  theme: 'light' | 'dark';
  chartType: 'candles' | 'line';
  indicators: string[];
  layout: 'default' | 'compact' | 'advanced';
}

interface UserStore {
  watchlist: string[];
  preferences: UserPreferences;
  addToWatchlist: (symbol: string) => void;
  removeFromWatchlist: (symbol: string) => void;
  updatePreferences: (preferences: Partial<UserPreferences>) => void;
}

export const useUserStore = create<UserStore>()(
  persist(
    (set) => ({
      watchlist: [],
      preferences: {
        theme: 'dark',
        chartType: 'candles',
        indicators: ['MA', 'RSI', 'MACD'],
        layout: 'default'
      },

      addToWatchlist: (symbol) =>
        set((state) => ({
          watchlist: [...new Set([...state.watchlist, symbol])]
        })),

      removeFromWatchlist: (symbol) =>
        set((state) => ({
          watchlist: state.watchlist.filter((s) => s !== symbol)
        })),

      updatePreferences: (newPreferences) =>
        set((state) => ({
          preferences: {
            ...state.preferences,
            ...newPreferences
          }
        }))
    }),
    {
      name: 'user-storage',
      partialize: (state) => ({
        watchlist: state.watchlist,
        preferences: state.preferences
      })
    }
  )
);