// Contador de tentativas de login falhas, em memória.
// Limite por conta (e-mail) e por IP; a janela começa na primeira falha.
// Reinício do servidor zera os contadores.

const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES_PER_ACCOUNT = 5;
const MAX_FAILURES_PER_IP = 20;

const failures = new Map<string, { count: number; windowStart: number }>();

function failuresFor(key: string, now: number): number {
  const entry = failures.get(key);
  if (!entry || now - entry.windowStart > WINDOW_MS) return 0;
  return entry.count;
}

function accountKey(email: string): string {
  return `account:${email}`;
}

function ipKey(ip: string): string {
  return `ip:${ip}`;
}

export function isLoginBlocked(email: string, ip: string, now = Date.now()): boolean {
  return (
    failuresFor(accountKey(email), now) >= MAX_FAILURES_PER_ACCOUNT ||
    failuresFor(ipKey(ip), now) >= MAX_FAILURES_PER_IP
  );
}

export function recordLoginFailure(email: string, ip: string, now = Date.now()): void {
  for (const key of [accountKey(email), ipKey(ip)]) {
    const current = failures.get(key);
    if (!current || now - current.windowStart > WINDOW_MS) {
      failures.set(key, { count: 1, windowStart: now });
    } else {
      current.count += 1;
    }
  }
}

export function resetAccountFailures(email: string): void {
  failures.delete(accountKey(email));
}
