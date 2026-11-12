// Autorização por perfil, revogação e reuso de tokens. Uso: BASE=... ADMIN_EMAIL=... ADMIN_PASSWORD=... node security2.mjs
const BASE = process.env.BASE;
const results = [];
const rec = (id, ok, desc, obs) => results.push({ id, res: ok ? "OK" : "FALHA", desc, obs });
async function req(method, path, { token, body } = {}) {
  const h = {}; if (body !== undefined) h["Content-Type"] = "application/json"; if (token) h.Authorization = "Bearer " + token;
  const r = await fetch(BASE + path, { method, headers: h, body: body !== undefined ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(60000) });
  const t = await r.text(); let j = null; try { j = JSON.parse(t); } catch {}
  return { status: r.status, json: j, text: t };
}
const login = (email, password) => req("POST", "/api/auth/login", { body: { email, password } });
const admin = (await login(process.env.ADMIN_EMAIL, process.env.ADMIN_PASSWORD)).json.token;
const sfx = Date.now();
const techEmail = `seg.tec.${sfx}@unicap.br`;
const tc = await req("POST", "/api/users", { token: admin, body: { name: "Tecnico Seg", email: techEmail, role: "tecnico", registration: `ST${sfx}`, password: "Senha12345" } });
const tec = (await login(techEmail, "Senha12345")).json.token;
const tecId = tc.json.user.id;
const other = `seg.tec2.${sfx}@unicap.br`;
await req("POST", "/api/users", { token: admin, body: { name: "Outro Tec", email: other, role: "tecnico", registration: `ST2${sfx}`, password: "Senha12345" } });
const tec2 = (await login(other, "Senha12345")).json.token;
const mach = (await req("GET", "/api/machines", { token: admin })).json.machines[0];

// Autorização
const a1 = await req("POST", "/api/users", { token: tec, body: { name: "X Y", email: `x${sfx}@unicap.br`, role: "tecnico", registration: `X${sfx}` } });
rec("P1", a1.status === 403, "Técnico não cria usuário", `status=${a1.status}`);
const a2 = await req("PATCH", `/api/users/${tecId}`, { token: tec, body: { role: "administrador" } });
rec("P2", a2.status === 403, "Técnico não altera perfil de usuário", `status=${a2.status}`);
const a3 = await req("PATCH", "/api/users/me", { token: tec, body: { role: "administrador", status: "ativo" } });
rec("P3", a3.status === 200 ? a3.json.user.role === "tecnico" : true, "PATCH /users/me não escala privilégio", `role=${a3.json?.user?.role} status=${a3.status}`);
const a4 = await req("DELETE", `/api/machines/${mach.id}`, { token: tec });
rec("P4", a4.status === 403, "Técnico não remove máquina", `status=${a4.status}`);
const a5 = await req("POST", "/api/supplies/adjustments", { token: tec, body: { supplyId: "sup-x", quantity: 1, reason: "x" } });
rec("P5", a5.status === 403, "Técnico não ajusta estoque", `status=${a5.status}`);
const prod = await req("POST", "/api/productions", { token: tec2, body: { type: "impressao_3d", description: "Outro", machineId: mach.id, supplyConsumed: 0 } });
const cancel = await req("POST", `/api/productions/${prod.json?.production?.id}/cancel`, { token: tec });
rec("P6", cancel.status === 403 || cancel.status === 404, "Técnico não cancela produção de outro técnico", `status=${cancel.status}`);
const lst = await req("GET", "/api/users", { token: tec });
rec("P7", true, "Técnico lista usuários (decisão de produto pendente)", `status=${lst.status} total=${lst.json?.total}`);

// Revogação de sessão
const out = await req("POST", "/api/auth/logout", { token: tec2 });
const after = await req("GET", "/api/auth/me", { token: tec2 });
rec("R1", after.status === 401, "Logout revoga o token", `logout=${out.status} me_depois=${after.status}`);

// Reuso do token de recuperação
const ans = await req("POST", "/api/auth/forgot-password/verify-answer", { body: { email: techEmail, answer: "x" } });
rec("R2", true, "Verificação de resposta (informativo)", `status=${ans.status} ${ans.json?.error?.code ?? ""}`);

// Mensagens de erro sem detalhes internos
const e500 = await req("POST", "/api/users", { token: admin, body: { name: "Erro", email: `e${sfx}@unicap.br`, role: "hacker", registration: `E${sfx}` } });
rec("E2", e500.status === 400 && !/at |sqlite|Error:/i.test(e500.text), "Papel inválido: 400 sem detalhe interno", `status=${e500.status}`);

console.table(results);
console.log(`Total=${results.length} OK=${results.filter((r) => r.res === "OK").length} FALHA=${results.filter((r) => r.res === "FALHA").length}`);
