import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Asset } from '../types/trading';

export function useWatchlist() {
  const queryClient = useQueryClient();

  const watchlistQuery = useQuery<Asset[]>({
    queryKey: ['watchlist'],
    queryFn: async () => {
      const response = await fetch('/api/watchlist');
      if (!response.ok) {
        throw new Error('Failed to fetch watchlist');
      }
      return response.json();
    }
  });

  const addToWatchlist = useMutation({
    mutationFn: async (symbol: string) => {
      const response = await fetch('/api/watchlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ symbol })
      });
      
      if (!response.ok) {
        throw new Error('Failed to add to watchlist');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watchlist'] });
    }
  });

  const removeFromWatchlist = useMutation({
    mutationFn: async (symbol: string) => {
      const response = await fetch(`/api/watchlist/${symbol}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error('Failed to remove from watchlist');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watchlist'] });
    }
  });

  const reorderWatchlist = useMutation({
    mutationFn: async (symbols: string[]) => {
      const response = await fetch('/api/watchlist/reorder', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ symbols })
      });
      
      if (!response.ok) {
        throw new Error('Failed to reorder watchlist');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watchlist'] });
    }
  });

  return {
    watchlist: watchlistQuery.data || [],
    isLoading: watchlistQuery.isLoading,
    error: watchlistQuery.error,
    addToWatchlist,
    removeFromWatchlist,
    reorderWatchlist
  };
}
