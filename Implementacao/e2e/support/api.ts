import { APIRequestContext, APIResponse } from "@playwright/test";

// Backend direto (sem o proxy do Vite), para testar a API como ela é
export const API_URL = "http://localhost:3001/api";

export const ADMIN = {
  email: "admin.musarq@unicap.br",
  password: "Admin@123",
  role: "administrador" as const,
};

export const TECH = {
  email: "tecnico.musarq@unicap.br",
  password: "Tecnico@123",
  role: "tecnico" as const,
};

// Sufixo único para dados criados por um teste, evitando colisão entre testes que usam o mesmo banco
export const unique = (label: string) => `${label}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

export class ApiClient {
  constructor(
    private readonly request: APIRequestContext,
    public readonly token?: string
  ) {}

  static async login(request: APIRequestContext, account: { email: string; password: string; role?: string }) {
    const res = await request.post(`${API_URL}/auth/login`, { data: account });
    if (res.status() !== 200) {
      throw new Error(`Login falhou (${res.status()}): ${await res.text()}`);
    }
    const body = await res.json();
    return new ApiClient(request, body.token);
  }

  private headers() {
    return this.token ? { Authorization: `Bearer ${this.token}` } : {};
  }

  get(path: string): Promise<APIResponse> {
    return this.request.get(`${API_URL}${path}`, { headers: this.headers() });
  }

  post(path: string, data?: unknown): Promise<APIResponse> {
    return this.request.post(`${API_URL}${path}`, { headers: this.headers(), data });
  }

  patch(path: string, data?: unknown): Promise<APIResponse> {
    return this.request.patch(`${API_URL}${path}`, { headers: this.headers(), data });
  }

  delete(path: string): Promise<APIResponse> {
    return this.request.delete(`${API_URL}${path}`, { headers: this.headers() });
  }

  // Versão que já valida o status e devolve o JSON
  async expectJson<T = any>(res: APIResponse, status: number): Promise<T> {
    const body = await res.json().catch(() => null);
    if (res.status() !== status) {
      throw new Error(`Esperado ${status}, veio ${res.status()}: ${JSON.stringify(body)}`);
    }
    return body as T;
  }
}

export async function loginAdmin(request: APIRequestContext) {
  return ApiClient.login(request, ADMIN);
}

// Cria um técnico com senha conhecida, usando a API de administrador
export async function createTechnician(request: APIRequestContext, label = "Tecnico E2E") {
  const admin = await loginAdmin(request);
  const suffix = unique("tec");
  const email = `${suffix}@unicap.br`;
  const password = "SenhaE2E@123";
  const created = await admin.post("/users", {
    name: label,
    email,
    role: "tecnico",
    registration: `REG-${suffix}`,
    password,
  });
  const user = await admin.expectJson<{ user: { id: string } }>(created, 201);
  const login = await ApiClient.login(request, { email, password, role: "tecnico" });
  return { id: user.user.id, email, password, api: login };
}
