export type UserRole = "administrador" | "tecnico";

export interface UserSession {
  token: string;
  user: {
    name: string;
    email: string;
    role: UserRole;
  };
}

const SESSION_KEY = "labmu:session";
const PROFILE_KEY_PREFIX = "labmu:profile:";

export const getSession = (): UserSession | null => {
  for (const storage of [sessionStorage, localStorage]) {
    const rawSession = storage.getItem(SESSION_KEY);
    if (!rawSession) continue;

    try {
      const session: UserSession = JSON.parse(rawSession);
      if (
        session.token &&
        session.user?.name &&
        session.user?.email &&
        (session.user.role === "administrador" || session.user.role === "tecnico")
      ) {
        return session;
      }
    } catch {
      storage.removeItem(SESSION_KEY);
    }
    storage.removeItem(SESSION_KEY);
  }

  return null;
};

export const saveSession = (session: UserSession, remember: boolean): void => {
  sessionStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(SESSION_KEY);
  (remember ? localStorage : sessionStorage).setItem(SESSION_KEY, JSON.stringify(session));
};

export const clearSession = (): void => {
  sessionStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(SESSION_KEY);
};

export const getProfileStorageKey = (email: string): string =>
  `${PROFILE_KEY_PREFIX}${email.toLowerCase()}`;
