import { getSession, UserRole } from "./session";

// Primeira tela aberta após o login de cada perfil
export const ROLE_HOME: Record<UserRole, string> = {
  administrador: "/dashboard",
  tecnico: "/maquinas",
};

// Telas liberadas para cada perfil. Rotas filhas (ex.: /estoque/registrar-entrada)
// herdam a permissão da rota pai.
const ROLE_PATHS: Record<UserRole, string[]> = {
  administrador: [
    "/dashboard",
    "/usuarios",
    "/maquinas",
    "/manutencao",
    "/estoque",
    "/emprestimo",
    "/relatorios",
  ],
  tecnico: ["/maquinas", "/manutencao", "/estoque"],
};

// Telas de uso pessoal, disponíveis para qualquer perfil autenticado
const SHARED_PATHS = ["/perfil", "/editar-perfil"];

export const getHomePath = (role?: UserRole | null): string =>
  role ? ROLE_HOME[role] : "/login";

export const canAccessPath = (path: string, role?: UserRole | null): boolean => {
  if (!role) return false;

  const normalized = path.replace(/\/+$/, "") || "/";
  const matches = (allowed: string) => normalized === allowed || normalized.startsWith(`${allowed}/`);

  return SHARED_PATHS.some(matches) || ROLE_PATHS[role].some(matches);
};

export const getCurrentRole = (): UserRole | null => getSession()?.user.role ?? null;
