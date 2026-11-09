import { createAttemptLimiter } from "./attemptLimiter.js";

// Respostas erradas da pergunta de segurança: a resposta é de baixa entropia e pode ser
// adivinhada, então o limite é o mesmo do login (5 por conta ou 20 por IP em 15 minutos).
const answers = createAttemptLimiter({
  windowMs: 15 * 60 * 1000,
  maxPerKey: 5,
  maxPerIp: 20,
});

export const isAnswerBlocked = answers.isBlocked;
export const recordAnswerFailure = answers.recordFailure;
export const resetAnswerFailures = answers.reset;
