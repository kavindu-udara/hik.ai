const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export interface User {
  id: string;
  email: string;
  plan: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface Session {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

export interface UsageLog {
  id: string;
  provider: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  createdAt: string;
}

class ApiClient {
  private getToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("hik_token");
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const token = this.getToken();
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...options.headers,
    };

    if (token) {
      (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ error: "Request failed" }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Auth
  async register(email: string, password: string): Promise<AuthResponse> {
    return this.request<AuthResponse>("/api/v1/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    return this.request<AuthResponse>("/api/v1/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  }

  // API Keys (requires JWT)
  async generateApiKey(
    name: string,
  ): Promise<{ apiKey: string; keyId: string }> {
    return this.request("/api/v1/api-keys", {
      method: "POST",
      body: JSON.stringify({ name }),
    });
  }

  async listApiKeys(): Promise<{
    keys: Array<{ id: string; name: string; createdAt: string }>;
  }> {
    return this.request("/api/v1/api-keys");
  }

  async deleteApiKey(keyId: string): Promise<void> {
    await this.request(`/api/v1/api-keys/${keyId}`, { method: "DELETE" });
  }

  // Sessions (requires API key)
  async listSessions(apiKey: string): Promise<{ sessions: Session[] }> {
    const response = await fetch(`${API_URL}/api/v1/sessions`, {
      headers: { "x-api-key": apiKey },
    });
    if (!response.ok) throw new Error("Failed to fetch sessions");
    return response.json();
  }

  async getSession(
    apiKey: string,
    sessionId: string,
  ): Promise<{
    session: Session;
    messages: Message[];
  }> {
    const response = await fetch(`${API_URL}/api/v1/sessions/${sessionId}`, {
      headers: { "x-api-key": apiKey },
    });
    if (!response.ok) throw new Error("Failed to fetch session");
    return response.json();
  }

  // Dashboard Sessions (requires JWT)
  async listDashboardSessions(): Promise<{ sessions: Session[] }> {
    return this.request("/api/v1/dashboard/sessions");
  }

  async getDashboardSession(sessionId: string): Promise<{
    session: Session;
    messages: Message[];
  }> {
    return this.request(`/api/v1/dashboard/sessions/${sessionId}`);
  }

  // Dashboard Settings (requires JWT)
  async listProviderKeys(): Promise<{
    keys: Array<{
      id: string;
      provider: string;
      createdAt: string;
      updatedAt: string;
    }>;
  }> {
    return this.request("/api/v1/dashboard/settings/keys");
  }

  async saveProviderKey(
    provider: string,
    apiKey: string,
  ): Promise<{ message: string }> {
    return this.request("/api/v1/dashboard/settings/keys", {
      method: "POST",
      body: JSON.stringify({ provider, apiKey }),
    });
  }

  async deleteProviderKey(provider: string): Promise<{ message: string }> {
    return this.request(`/api/v1/dashboard/settings/keys/${provider}`, {
      method: "DELETE",
    });
  }

  async getUsage(): Promise<{
    logs: Array<{
      id: string;
      provider: string;
      model: string;
      inputTokens: number;
      outputTokens: number;
      createdAt: string;
    }>;
    totals: { inputTokens: number; outputTokens: number; totalTokens: number };
    byProvider: Record<
      string,
      { inputTokens: number; outputTokens: number; requests: number }
    >;
  }> {
    return this.request("/api/v1/dashboard/settings/usage");
  }

  async getOverview(): Promise<{
    totalSessions: number;
    totalTokens: { input: number; output: number; total: number };
    totalRequests: number;
    activeProviders: string[];
    apiKeysCount: number;
    recentSessions: Array<{
      id: string;
      title: string;
      createdAt: string;
      updatedAt: string;
    }>;
    user: {
      email: string;
      plan: string;
      createdAt: string;
    };
  }> {
    return this.request("/api/v1/dashboard/overview");
  }
}

export const api = new ApiClient();
