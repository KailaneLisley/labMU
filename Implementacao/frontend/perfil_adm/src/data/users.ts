export type UserRole = "tecnico" | "aluno" | "professor" | "administrador";
export type UserStatus = "ativo" | "inativo" | "pendente";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  registration: string;
  phone: string;
  status: UserStatus;
  initials: string;
  avatarColor: string;
}

export const USERS_STORAGE_KEY = "labmu:users";

