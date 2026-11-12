// Testes de segurança não destrutivos. Uso: BASE=<url> node security.mjs
import crypto from "node:crypto";
const BASE = process.env.BASE;
const results = [];
const rec = (id, ok, desc, obs) => results.push({ id, res: ok ? "OK" : "FALHA", desc, obs });
async function req(method, path, { headers = {}, body, raw, timeout = 90000 } = {}) {
  const h = { ...headers };
  if (body !== undefined || raw !== undefined) h["Content-Type"] = "application/json";
  try {
    const r = await fetch(BASE + path, { method, headers: h, body: raw ?? (body !== undefined ? JSON.stringify(body) : undefined), signal: AbortSignal.timeout(timeout) });
    const t = await r.text(); let j = null; try { j = JSON.parse(t); } catch {}
    return { status: r.status, h: r.headers, text: t, json: j };
  } catch (e) { return { status: 0, err: e.message, h: new Headers(), text: "", json: null }; }
}
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
function jwt(payload, secret, alg = "HS256") {
  const head = b64({ alg, typ: "JWT" }); const body = b64(payload);
  const sig = alg === "none" ? "" : crypto.createHmac("sha256", secret).update(`${head}.${body}`).digest("base64url");
  return `${head}.${body}.${sig}`;
}

// 1. Cabeçalhos
const root = await req("GET", "/api/health");
rec("H1", !!root.h.get("strict-transport-security") || !BASE.startsWith("https"), "HSTS presente (HTTPS)", root.h.get("strict-transport-security") ?? "ausente");
rec("H2", root.h.get("x-powered-by") === null, "Sem X-Powered-By (esconde Express)", root.h.get("x-powered-by") ?? "ausente");
rec("H3", root.h.get("x-content-type-options") === "nosniff", "X-Content-Type-Options: nosniff", root.h.get("x-content-type-options") ?? "ausente");

// 2. CORS
const good = await req("GET", "/api/health", { headers: { Origin: "https://labmu.vercel.app" } });
const evil = await req("GET", "/api/health", { headers: { Origin: "https://site-malicioso.example" } });
rec("C1", evil.h.get("access-control-allow-origin") !== "https://site-malicioso.example", "CORS não reflete origem estranha", evil.h.get("access-control-allow-origin") ?? "sem header");
rec("C2", true, "CORS para origem do frontend (informativo)", good.h.get("access-control-allow-origin") ?? "sem header");

// 3. Autenticação
for (const p of ["/api/users", "/api/machines", "/api/dashboard/summary", "/api/auth/me", "/api/loans"]) {
  const r = await req("GET", p);
  rec("A1", r.status === 401, `Sem token: ${p} → 401`, `status=${r.status}`);
}
const bad = await req("GET", "/api/machines", { headers: { Authorization: "Bearer abc.def.ghi" } });
rec("A2", bad.status === 401, "Token malformado → 401", `status=${bad.status}`);
const none = await req("GET", "/api/machines", { headers: { Authorization: "Bearer " + jwt({ sub: "usr-admin-musarq", role: "administrador" }, "", "none") } });
rec("A3", none.status === 401, "JWT alg=none → 401", `status=${none.status}`);
const forged = await req("GET", "/api/machines", { headers: { Authorization: "Bearer " + jwt({ sub: "usr-admin-musarq", role: "administrador", exp: Math.floor(Date.now() / 1000) + 600 }, "labmu_dev_only_jwt_secret_nao_usar_em_producao") } });
rec("A4", forged.status === 401, "JWT forjado com segredo de desenvolvimento → 401", `status=${forged.status}`);
const badSig = await req("GET", "/api/machines", { headers: { Authorization: "Bearer " + jwt({ sub: "x", exp: Math.floor(Date.now() / 1000) + 600 }, "outro-segredo") } });
rec("A5", badSig.status === 401, "JWT com assinatura errada → 401", `status=${badSig.status}`);

// 4. Login / enumeração / força bruta (usa e-mail inexistente para não bloquear contas reais)
const fake = `teste.${Date.now()}@unicap.br`;
const codes = [];
for (let i = 0; i < 12; i++) codes.push((await req("POST", "/api/auth/login", { body: { email: fake, password: "x" + i } })).status);
rec("L1", codes.includes(429), "Limite de tentativas de login (12 falhas em sequência)", `status: ${[...new Set(codes)].join(",")}`);
const rv1 = await req("POST", "/api/auth/forgot-password/verify-email", { body: { email: fake } });
const rv2 = await req("POST", "/api/auth/forgot-password/verify-email", { body: { email: "tecnico.musarq@unicap.br" } });
rec("L2", rv1.status === rv2.status && rv1.json?.error?.code !== "USER_NOT_FOUND", "Recuperação não enumera contas", `inexistente=${rv1.status}/${rv1.json?.error?.code} existente=${rv2.status}`);
const reg = await req("POST", "/api/auth/register", { body: { name: "Teste Seg", email: `seg.${Date.now()}@unicap.br`, registration: `S${Date.now()}`, password: "x", securityQuestion: "q", securityAnswer: "a" } });
rec("L3", reg.status === 400 || reg.status === 429, "Cadastro público rejeita senha fraca (não cria conta)", `status=${reg.status}`);
const role = await req("POST", "/api/auth/register", { body: { name: "Escalada", email: `esc.${Date.now()}@unicap.br`, role: "administrador", registration: `E${Date.now()}`, password: "Senha12345", securityQuestion: "cor favorita", securityAnswer: "azul" } });
rec("L4", role.status === 201 ? role.json.user.role === "tecnico" : true, "Cadastro público ignora role=administrador", role.status === 201 ? `role=${role.json.user.role}` : `status=${role.status}`);

// 5. Injeção e entrada maliciosa
const adminLogin = process.env.ADMIN_EMAIL ? await req("POST", "/api/auth/login", { body: { email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD } }) : null;
const authH = adminLogin?.json?.token ? { Authorization: "Bearer " + adminLogin.json.token } : {};
const sqli = await req("GET", "/api/machines?q=' OR '1'='1", { headers: authH });
rec("I1", sqli.status === 200 && !/sqlite|SQLITE|syntax/i.test(sqli.text), "SQL injection em filtro de texto não quebra", `status=${sqli.status}`);
const big = await req("POST", "/api/auth/login", { raw: JSON.stringify({ email: "a@b.c", password: "x".repeat(2_000_000) }) });
rec("I2", big.status === 413 || big.status === 400 || big.status === 429, "Payload de 2 MB é recusado", `status=${big.status}`);
const malformed = await req("POST", "/api/auth/login", { raw: "{ nao json" });
rec("I3", malformed.status === 400 && !/at .*\.js|stack/i.test(malformed.text), "JSON malformado: 400 sem stack trace", `status=${malformed.status}`);
const traversal = await req("GET", "/api/../../etc/passwd");
rec("I4", traversal.status !== 200 || !/root:/.test(traversal.text), "Path traversal bloqueado", `status=${traversal.status}`);
const cors2 = await req("OPTIONS", "/api/health", { headers: { Origin: "https://site-malicioso.example", "Access-Control-Request-Method": "GET" } });
rec("I5", cors2.h.get("access-control-allow-origin") !== "https://site-malicioso.example", "Preflight de origem estranha não é aceito", cors2.h.get("access-control-allow-origin") ?? "sem header");

// 6. Vazamento de informação em 404
const nf = await req("GET", "/api/nao-existe");
rec("E1", nf.status === 404 && !/at |node_modules/.test(nf.text), "404 genérico sem detalhes internos", `status=${nf.status}`);

console.table(results);
console.log(`Total=${results.length} OK=${results.filter((r) => r.res === "OK").length} FALHA=${results.filter((r) => r.res === "FALHA").length}`);
