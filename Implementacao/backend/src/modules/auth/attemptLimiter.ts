// Contador de falhas em memória, com limite por chave (ex.: conta/e-mail) e por IP.
// A janela começa na primeira falha. Reinício do servidor zera os contadores.

export interface AttemptPolicy {
  windowMs: number;
  maxPerKey: number;
  maxPerIp: number;
}

export function createAttemptLimiter(policy: AttemptPolicy) {
  const failures = new Map<string, { count: number; windowStart: number }>();

  function failuresFor(key: string, now: number): number {
    const entry = failures.get(key);
    if (!entry || now - entry.windowStart > policy.windowMs) return 0;
    return entry.count;
  }

  const keyOf = (key: string) => `key:${key}`;
  const ipOf = (ip: string) => `ip:${ip}`;

  function isBlocked(key: string, ip: string, now = Date.now()): boolean {
    return (
      failuresFor(keyOf(key), now) >= policy.maxPerKey ||
      failuresFor(ipOf(ip), now) >= policy.maxPerIp
    );
  }

  function recordFailure(key: string, ip: string, now = Date.now()): void {
    for (const id of [keyOf(key), ipOf(ip)]) {
      const current = failures.get(id);
      if (!current || now - current.windowStart > policy.windowMs) {
        failures.set(id, { count: 1, windowStart: now });
      } else {
        current.count += 1;
      }
    }
  }

  function reset(key: string): void {
    failures.delete(keyOf(key));
  }

  return { isBlocked, recordFailure, reset };
}
