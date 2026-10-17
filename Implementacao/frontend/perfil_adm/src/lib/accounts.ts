export interface RegisteredAccount {
  email: string;
  password: string;
  name: string;
  role?: "administrador" | "tecnico";
  securityQuestion?: string;
  securityAnswer?: string;
}

export const ACCOUNTS_STORAGE_KEY = "labmu:accounts";
