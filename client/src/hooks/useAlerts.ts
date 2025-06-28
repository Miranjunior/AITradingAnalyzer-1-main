import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert, AlertInput } from '../types/alerts';

export function useAlerts(symbol: string | undefined) {
  const queryClient = useQueryClient();

  const alertsQuery = useQuery<Alert[]>({
    queryKey: ['alerts', symbol],
    queryFn: async () => {
      if (!symbol) throw new Error('Symbol is required');
      
      const response = await fetch(`/api/alerts?symbol=${symbol}`);
      if (!response.ok) {
        throw new Error('Failed to fetch alerts');
      }
      
      return response.json();
    },
    enabled: !!symbol
  });

  const createAlert = useMutation({
    mutationFn: async (alertInput: AlertInput) => {
      const response = await fetch('/api/alerts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(alertInput)
      });
      
      if (!response.ok) {
        throw new Error('Failed to create alert');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts', symbol] });
    }
  });

  const deleteAlert = useMutation({
    mutationFn: async (alertId: string) => {
      const response = await fetch(`/api/alerts/${alertId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete alert');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts', symbol] });
    }
  });

  const updateAlert = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Alert> }) => {
      const response = await fetch(`/api/alerts/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        throw new Error('Failed to update alert');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts', symbol] });
    }
  });

  return {
    alerts: alertsQuery.data || [],
    isLoading: alertsQuery.isLoading,
    error: alertsQuery.error,
    createAlert,
    deleteAlert,
    updateAlert
  };
}
