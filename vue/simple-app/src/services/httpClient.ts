import { defineStore } from 'pinia';

const useHttpClient = defineStore('httpClient', () => {
  let baseUrl = import.meta.env.VITE_API_BASE_URL || '';
  let token = 'user:user';
  function setToken(newToken: string) {
    token = newToken;
  }
  function setBaseUrl(newUrl: string) {
    baseUrl = newUrl;
  }
  async function request<T>(endpoint: string, config: RequestInit): Promise<T> {
    const url = `${baseUrl}${endpoint}`;
    const headers = {
      ...{ 'Content-Type': 'application/json' },
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...config.headers,
    };
    const response = await fetch(url, {
      ...config,
      headers: headers,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }
  function get<T>(endpoint: string, config?: RequestInit): Promise<T> {
    return request(endpoint, { ...config, method: 'GET' });
  }
  function post<T>(endpoint: string, body: unknown, config?: RequestInit): Promise<T> {
    return request(endpoint, {
      ...config,
      method: 'POST',
      body: JSON.stringify(body),
    });
  }
  function put<T>(endpoint: string, body: unknown, config?: RequestInit): Promise<T> {
    return request(endpoint, {
      ...config,
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }
  function remove<T>(endpoint: string, config?: RequestInit): Promise<T> {
    return request(endpoint, { ...config, method: 'DELETE' });
  }
  return { setToken, setBaseUrl, request, get, post, put, delete: remove };
});

export default useHttpClient;
