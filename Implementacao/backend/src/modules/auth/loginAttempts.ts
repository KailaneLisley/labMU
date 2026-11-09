import { createAttemptLimiter } from "./attemptLimiter.js";

// Tentativas de login com senha errada: 5 por conta ou 20 por IP em 15 minutos.
const login = createAttemptLimiter({
  windowMs: 15 * 60 * 1000,
  maxPerKey: 5,
  maxPerIp: 20,
});

export const isLoginBlocked = login.isBlocked;
export const recordLoginFailure = login.recordFailure;
export const resetAccountFailures = login.reset;
