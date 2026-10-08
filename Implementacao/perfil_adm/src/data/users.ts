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

export const initialUsers: User[] = [
  {
    id: "1",
    name: "Lucas Vasconcolos",
    email: "lucas.vasconcolos@unicap.br",
    role: "tecnico",
    registration: "282119489",
    phone: "(81) 2119-4102 • Ramal 14",
    status: "ativo",
    initials: "LV",
    avatarColor: "bg-orange-200",
  },
  {
    id: "2",
    name: "Beatriz Albuquerque",
    email: "b.albuquerque@aluno.unicap.br",
    role: "aluno",
    registration: "282208192",
    phone: "(81) 99614-2209",
    status: "ativo",
    initials: "BA",
    avatarColor: "bg-gray-200",
  },
  {
    id: "3",
    name: "Prof. Carlos Eduardo",
    email: "carlos.mendes@unicap.br",
    role: "professor",
    registration: "199843210",
    phone: "(81) 2119-4088 • Ópio Arq",
    status: "ativo",
    initials: "CE",
    avatarColor: "bg-blue-200",
  },
  {
    id: "4",
    name: "Renata Mendes",
    email: "renata.mendes@unicap.br",
    role: "tecnico",
    registration: "201904732",
    phone: "(81) 2119-4102 • Ramal 18",
    status: "ativo",
    initials: "RM",
    avatarColor: "bg-orange-200",
  },
  {
    id: "5",
    name: "Dra. Sofia Arcoverde",
    email: "sofia.arcoverde@unicap.br",
    role: "administrador",
    registration: "201692100",
    phone: "(81) 2119-4000 • Ramal 01",
    status: "ativo",
    initials: "SA",
    avatarColor: "bg-pink-200",
  },
  {
    id: "6",
    name: "Mariana Lima",
    email: "mariana.lima@aluno.unicap.br",
    role: "aluno",
    registration: "282361988",
    phone: "(81) 98822-1094",
    status: "ativo",
    initials: "ML",
    avatarColor: "bg-purple-200",
  },
];
