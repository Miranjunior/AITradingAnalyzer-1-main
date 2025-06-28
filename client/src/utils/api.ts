import { config, API_ENDPOINTS } from '../config';

class ApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = config.apiBaseUrl;
  }

  private async fetchWithError(url: string, options?: RequestInit) {
    const response = await fetch(this.baseUrl + url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erro na requisição');
    }

    return response.json();
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.fetchWithError(endpoint);
  }

  async post<T>(endpoint: string, data: any): Promise<T> {
    return this.fetchWithError(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put<T>(endpoint: string, data: any): Promise<T> {
    return this.fetchWithError(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async delete(endpoint: string): Promise<void> {
    return this.fetchWithError(endpoint, {
      method: 'DELETE',
    });
  }
}

export const api = new ApiService();
