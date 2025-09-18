class HttpClient {
  private static instance: HttpClient;
  private baseUrl: string;
  private token: string;

  private constructor() {
    this.baseUrl = import.meta.env.VITE_API_BASE_URL || '';
    this.token = '';
  }

  public static getInstance(): HttpClient {
    if (!HttpClient.instance) {
      HttpClient.instance = new HttpClient();
    }
    // TODO move to other place to set token
    HttpClient.instance.setToken('user:user');
    return HttpClient.instance;
  }

  public setToken(token: string) {
    this.token = token;
  }

  private async request<T>(endpoint: string, config: RequestInit): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      ...{ 'Content-Type': 'application/json' },
      ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
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

  public get<T>(endpoint: string, config?: RequestInit): Promise<T> {
    return this.request(endpoint, { ...config, method: 'GET' });
  }

  public post<T>(endpoint: string, body: unknown, config?: RequestInit): Promise<T> {
    return this.request(endpoint, {
      ...config,
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  public put<T>(endpoint: string, body: unknown, config?: RequestInit): Promise<T> {
    return this.request(endpoint, {
      ...config,
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  public delete<T>(endpoint: string, config?: RequestInit): Promise<T> {
    return this.request(endpoint, { ...config, method: 'DELETE' });
  }
}

export default HttpClient;
