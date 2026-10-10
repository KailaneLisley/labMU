import { getSession } from "../lib/session";

const API_BASE = (import.meta as any).env?.VITE_API_URL || "/api";

async function request<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const session = getSession();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (session?.token) {
    headers["Authorization"] = `Bearer ${session.token}`;
  }

  // Se a rota já tiver /api e API_BASE for /api, evita duplicar
  const cleanEndpoint = endpoint.startsWith("/api") ? endpoint.replace(/^\/api/, "") : endpoint;
  const url = `${API_BASE}${cleanEndpoint.startsWith("/") ? "" : "/"}${cleanEndpoint}`;

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
    });
  } catch (err) {
    throw new Error("Não foi possível conectar ao servidor do labMU. Verifique se o backend está ativo.");
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      data?.error?.message ||
      (response.status === 401
        ? "Sessão expirada ou credenciais inválidas."
        : response.status === 403
        ? "Você não possui permissão para executar esta ação."
        : "Ocorreu um erro na requisição.");
    throw new Error(message);
  }

  return data as T;
}

export const api = {
  // Autenticação
  login: (payload: { email: string; password: string; role?: string }) =>
    request<{ token: string; user: any }>("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  register: (payload: { name: string; email: string; registration: string; phone?: string; password: string }) =>
    request<{ token: string; user: any }>("/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  getMe: () => request<{ user: any }>("/auth/me"),

  logout: () =>
    request("/auth/logout", {
      method: "POST",
    }).catch(() => null),

  // Usuários
  getUsers: (params: { q?: string; role?: string; status?: string; page?: number; limit?: number } = {}) => {
    const query = new URLSearchParams();
    if (params.q) query.set("q", params.q);
    if (params.role) query.set("role", params.role);
    if (params.status) query.set("status", params.status);
    if (params.page) query.set("page", String(params.page));
    if (params.limit) query.set("limit", String(params.limit));
    return request<{ data: any[]; total: number; page: number; limit: number }>(`/users?${query}`);
  },

  createUser: (userData: any) =>
    request<{ user: any }>("/users", {
      method: "POST",
      body: JSON.stringify(userData),
    }),

  updateUser: (id: string, userData: any) =>
    request<{ user: any }>(`/users/${id}`, {
      method: "PATCH",
      body: JSON.stringify(userData),
    }),

  updateUserStatus: (id: string, status: string) =>
    request<{ user: any }>(`/users/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),

  updateProfile: (profileData: any) =>
    request<{ user: any }>("/users/me", {
      method: "PATCH",
      body: JSON.stringify(profileData),
    }),

  // Máquinas
  getMachines: (params: { q?: string; type?: string; status?: string } = {}) => {
    const query = new URLSearchParams();
    if (params.q) query.set("q", params.q);
    if (params.type) query.set("type", params.type);
    if (params.status) query.set("status", params.status);
    return request<{ machines: any[] }>(`/machines?${query}`);
  },

  createMachine: (machineData: any) =>
    request<{ machine: any }>("/machines", {
      method: "POST",
      body: JSON.stringify(machineData),
    }),

  updateMachine: (id: string, machineData: any) =>
    request<{ machine: any }>(`/machines/${id}`, {
      method: "PATCH",
      body: JSON.stringify(machineData),
    }),

  deleteMachine: (id: string) =>
    request(`/machines/${id}`, {
      method: "DELETE",
    }),

  // Manutenções
  getMaintenances: (params: { machineId?: string; type?: string; status?: string; from?: string; to?: string } = {}) => {
    const query = new URLSearchParams();
    if (params.machineId) query.set("machineId", params.machineId);
    if (params.type) query.set("type", params.type);
    if (params.status) query.set("status", params.status);
    if (params.from) query.set("from", params.from);
    if (params.to) query.set("to", params.to);
    return request<{ records: any[] }>(`/maintenances?${query}`);
  },

  createMaintenance: (maintenanceData: any) =>
    request<{ record: any }>("/maintenances", {
      method: "POST",
      body: JSON.stringify(maintenanceData),
    }),

  // Suprimentos e Estoque
  getSupplies: (params: { q?: string; status?: string; type?: string } = {}) => {
    const query = new URLSearchParams();
    if (params.q) query.set("q", params.q);
    if (params.status) query.set("status", params.status);
    if (params.type) query.set("type", params.type);
    return request<{ supplies: any[] }>(`/supplies?${query}`);
  },

  registerSupplyEntry: (entryData: any) =>
    request<{ supply: any; movementId: string }>("/supplies/entries", {
      method: "POST",
      body: JSON.stringify(entryData),
    }),

  getStockMovements: (params: { supplyId?: string; from?: string; to?: string } = {}) => {
    const query = new URLSearchParams();
    if (params.supplyId) query.set("supplyId", params.supplyId);
    if (params.from) query.set("from", params.from);
    if (params.to) query.set("to", params.to);
    return request<{ movements: any[] }>(`/supplies/movements?${query}`);
  },

  // Equipamentos Portáteis e Empréstimos
  getEquipment: (params: { q?: string; status?: string; category?: string } = {}) => {
    const query = new URLSearchParams();
    if (params.q) query.set("q", params.q);
    if (params.status) query.set("status", params.status);
    if (params.category) query.set("category", params.category);
    return request<{ equipment: any[] }>(`/equipment?${query}`);
  },

  createEquipment: (equipmentData: any) =>
    request<{ item: any }>("/equipment", {
      method: "POST",
      body: JSON.stringify(equipmentData),
    }),

  getLoans: (params: { status?: string; equipmentId?: string } = {}) => {
    const query = new URLSearchParams();
    if (params.status) query.set("status", params.status);
    if (params.equipmentId) query.set("equipmentId", params.equipmentId);
    return request<{ loans: any[] }>(`/loans?${query}`);
  },

  checkoutLoan: (loanData: any) =>
    request<{ loan: any }>("/loans", {
      method: "POST",
      body: JSON.stringify(loanData),
    }),

  returnLoan: (id: string) =>
    request<{ loan: any }>(`/loans/${id}/return`, {
      method: "POST",
    }),

  // Produções
  getProductions: (params: { machineId?: string; technicianId?: string; type?: string } = {}) => {
    const query = new URLSearchParams();
    if (params.machineId) query.set("machineId", params.machineId);
    if (params.technicianId) query.set("technicianId", params.technicianId);
    if (params.type) query.set("type", params.type);
    return request<{ productions: any[] }>(`/productions?${query}`);
  },

  createProduction: (prodData: any) =>
    request<{ production: any }>("/productions", {
      method: "POST",
      body: JSON.stringify(prodData),
    }),

  // Relatórios
  getReports: (reportType: "production" | "production-by-technician" | "stock-consumption" | "loans" | "maintenances", params: any = {}) => {
    const query = new URLSearchParams(params);
    return request(`/reports/${reportType}?${query}`);
  },

  // Dashboard
  getDashboardSummary: () => request<any>("/dashboard/summary"),
};

