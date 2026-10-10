export interface RegisteredAccount {
  email: string;
  password: string;
  name: string;
}

export const ACCOUNTS_STORAGE_KEY = "labmu:accounts";
