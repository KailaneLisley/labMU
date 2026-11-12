// Helpers compartilhados pelos scripts. Credenciais vêm do ambiente; nada é fixo no código.
export const BASE = process.env.BASE ?? "http://localhost:3055";

// Falha cedo com mensagem clara, em vez de chamar a API com "undefined"
export function requireEnv(...names) {
  const missing = names.filter((n) => !process.env[n]);
  if (missing.length) {
    console.error(`Variáveis obrigatórias não definidas: ${missing.join(", ")}`);
    process.exit(2);
  }
}

// Scripts que criam registros (usuários, produções, empréstimos...) só rodam com WRITE=1.
// Use apenas em ambiente local ou de teste, nunca na produção sem combinar com o time.
export function requireWrite(scriptName) {
  if (process.env.WRITE !== "1") {
    console.error(`${scriptName} cria dados de teste no banco. Para executar, defina WRITE=1.`);
    process.exit(2);
  }
}

// Imprime o resultado e sai com código 1 se houver qualquer falha
export function finish(results) {
  const fails = results.filter((r) => r.res === "FALHA").length;
  const oks = results.filter((r) => r.res === "OK").length;
  const infos = results.filter((r) => r.res === "INFO").length;
  console.table(results);
  console.log(`Total=${results.length} OK=${oks} INFO=${infos} FALHA=${fails}`);
  process.exit(fails ? 1 : 0);
}

export async function call(method, path, { token, body } = {}) {
  const headers = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;
  const t0 = performance.now();
  const r = await fetch(BASE + path, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined });
  const text = await r.text();
  let json = null; try { json = JSON.parse(text); } catch {}
  return { status: r.status, json, text, headers: r.headers, ms: performance.now() - t0 };
}

export async function adminToken() {
  requireEnv("ADMIN_EMAIL", "ADMIN_PASSWORD");
  const r = await call("POST", "/api/auth/login", { body: { email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD } });
  if (!r.json?.token) {
    console.error(`Login do administrador falhou (status ${r.status}).`);
    process.exit(2);
  }
  return r.json.token;
}
