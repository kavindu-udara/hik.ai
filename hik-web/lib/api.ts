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

  // Usage (requires API key)
  async getUsage(
    apiKey: string,
  ): Promise<{
    logs: UsageLog[];
    total: { inputTokens: number; outputTokens: number };
  }> {
    const response = await fetch(`${API_URL}/api/v1/usage`, {
      headers: { "x-api-key": apiKey },
    });
    if (!response.ok) throw new Error("Failed to fetch usage");
    return response.json();
  }
}

export const api = new ApiClient();
