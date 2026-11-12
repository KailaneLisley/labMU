// Superfície de ataque: cabeçalhos, CORS, tokens, limite de login, enumeração, injeção e erros.
// Não cria registros. Mesmo assim, o teste de limite de login gera 12 falhas no IP de origem:
// rode em produção só uma vez, e espere 15 min antes de logar de novo nesse IP.
// Uso: BASE=... ADMIN_EMAIL=... ADMIN_PASSWORD=... node security-surface.mjs
import crypto from "node:crypto";
import { BASE, call, requireEnv, finish } from "./common.mjs";

requireEnv("ADMIN_EMAIL", "ADMIN_PASSWORD");
const results = [];
const rec = (id, ok, desc, obs) => results.push({ id, res: ok ? "OK" : "FALHA", desc, obs });
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
function jwt(payload, secret, alg = "HS256") {
  const head = b64({ alg, typ: "JWT" });
  const body = b64(payload);
  const sig = alg === "none" ? "" : crypto.createHmac("sha256", secret).update(`${head}.${body}`).digest("base64url");
  return `${head}.${body}.${sig}`;
}
const req = (method, path, opts = {}) => call(method, path, opts);

// 1. Cabeçalhos
const health = await req("GET", "/api/health");
rec("H1", !BASE.startsWith("https") || !!health.headers.get("strict-transport-security"), "HSTS presente (HTTPS)", health.headers.get("strict-transport-security") ?? "ausente");
rec("H2", health.headers.get("x-powered-by") === null, "Sem X-Powered-By", health.headers.get("x-powered-by") ?? "ausente");
rec("H3", health.headers.get("x-content-type-options") === "nosniff", "X-Content-Type-Options: nosniff", health.headers.get("x-content-type-options") ?? "ausente");

// 2. CORS
const evilOrigin = "https://site-malicioso.example";
const evil = await fetch(BASE + "/api/health", { headers: { Origin: evilOrigin } });
rec("C1", evil.headers.get("access-control-allow-origin") !== evilOrigin, "CORS não reflete origem estranha", evil.headers.get("access-control-allow-origin") ?? "sem header");
const pre = await fetch(BASE + "/api/health", { method: "OPTIONS", headers: { Origin: evilOrigin, "Access-Control-Request-Method": "GET" } });
rec("C2", pre.headers.get("access-control-allow-origin") !== evilOrigin, "Preflight de origem estranha não é aceito", pre.headers.get("access-control-allow-origin") ?? "sem header");

// 3. Autenticação sem token e com tokens inválidos
for (const p of ["/api/users", "/api/machines", "/api/dashboard/summary", "/api/auth/me", "/api/loans"]) {
  const r = await req("GET", p);
  rec("A1", r.status === 401, `Sem token: ${p} → 401`, `status=${r.status}`);
}
const forgeries = {
  "token malformado": "Bearer abc.def.ghi",
  "alg=none": "Bearer " + jwt({ sub: "usr-admin-musarq", role: "administrador" }, "", "none"),
  "segredo de desenvolvimento": "Bearer " + jwt({ sub: "usr-admin-musarq", role: "administrador", exp: Math.floor(Date.now() / 1000) + 600 }, "labmu_dev_only_jwt_secret_nao_usar_em_producao"),
  "assinatura errada": "Bearer " + jwt({ sub: "x", exp: Math.floor(Date.now() / 1000) + 600 }, "outro-segredo"),
};
for (const [name, auth] of Object.entries(forgeries)) {
  const r = await req("GET", "/api/machines", { token: auth.replace("Bearer ", "") });
  rec("A2", r.status === 401, `Token forjado (${name}) → 401`, `status=${r.status}`);
}

// 4. Login: limite de tentativas e enumeração (e-mail inexistente, sem criar conta)
const fake = `inexistente.${Date.now()}@unicap.br`;
const codes = [];
for (let i = 0; i < 12; i++) codes.push((await req("POST", "/api/auth/login", { body: { email: fake, password: `x${i}` } })).status);
rec("L1", codes.includes(429), "Limite de tentativas de login (12 falhas seguidas)", `status: ${[...new Set(codes)].join(",")}`);
const v1 = await req("POST", "/api/auth/forgot-password/verify-email", { body: { email: fake } });
const v2 = await req("POST", "/api/auth/forgot-password/verify-email", { body: { email: process.env.ADMIN_EMAIL } });
rec("L2", v1.status === v2.status && v1.json?.error?.code === v2.json?.error?.code, "Recuperação não enumera contas", `inexistente=${v1.status} admin=${v2.status}`);
const weak = await req("POST", "/api/auth/register", { body: { name: "Senha Fraca", email: `fraca.${Date.now()}@unicap.br`, registration: `F${Date.now()}`, password: "x", securityQuestion: "cor", securityAnswer: "azul" } });
rec("L3", weak.status === 400, "Cadastro público recusa senha fraca (sem criar conta)", `status=${weak.status}`);

// 5. Injeção e entrada maliciosa (com token de administrador, obtido do ambiente)
const adminLogin = await req("POST", "/api/auth/login", { body: { email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD } });
const adminToken = adminLogin.json?.token;
rec("I0", !!adminToken, "Login do administrador para os testes seguintes", `status=${adminLogin.status}`);
const sqli = await req("GET", "/api/machines?q=' OR '1'='1", { token: adminToken });
rec("I1", sqli.status === 200 && !/sqlite|syntax/i.test(sqli.text), "SQL injection em filtro de texto não quebra", `status=${sqli.status}`);
// O corpo acima do limite é recusado antes da autenticação, então a rota não precisa existir para o teste
const bigBody = JSON.stringify({ name: "x".repeat(2_000_000) });
const bigReq = await fetch(BASE + "/api/machines", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken}` }, body: bigBody });
rec("I2", bigReq.status === 413, "Payload de 2 MB é recusado com 413", `status=${bigReq.status}`);
const malformed = await fetch(BASE + "/api/machines", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken}` }, body: "{ nao json" });
const malformedText = await malformed.text();
rec("I3", malformed.status === 400 && !/\bat\s|stack/i.test(malformedText), "JSON malformado: 400 sem stack trace", `status=${malformed.status}`);
const trav = await req("GET", "/api/../../etc/passwd");
rec("I4", trav.status !== 200 || !/root:/.test(trav.text), "Path traversal bloqueado", `status=${trav.status}`);

// 6. Erros sem detalhe interno
const nf = await req("GET", "/api/nao-existe");
rec("E1", nf.status === 404 && !/\bat\s|node_modules/.test(nf.text), "404 genérico sem detalhes internos", `status=${nf.status}`);

finish(results);
