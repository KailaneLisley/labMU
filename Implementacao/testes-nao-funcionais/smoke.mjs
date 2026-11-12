// Smoke do caminho crítico na API de produção (build dist). Uso: BASE=... ADMIN_EMAIL=... ADMIN_PASSWORD=... node smoke.mjs
const B = process.env.BASE; let fails = 0;
const log = (ok, name, extra = "") => { if (!ok) fails++; console.log(`${ok ? "PASS" : "FAIL"} ${name} ${extra}`); };
async function call(method, path, { token, body } = {}) {
  const h = {}; if (body !== undefined) h["Content-Type"] = "application/json"; if (token) h.Authorization = "Bearer " + token;
  const r = await fetch(B + path, { method, headers: h, body: body !== undefined ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(30000) });
  const t = await r.text(); let j = null; try { j = JSON.parse(t); } catch {} return { s: r.status, j };
}
const s = Date.now();
const health = await call("GET", "/api/health"); log(health.s === 200, "health");
const login = await call("POST", "/api/auth/login", { body: { email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD } });
log(login.s === 200 && login.j.user.role === "administrador", "login administrador");
const adm = login.j.token;
const me = await call("GET", "/api/auth/me", { token: adm }); log(me.s === 200, "auth/me");
const sfx = Date.now().toString().slice(-6);
const tec = await call("POST", "/api/users", { token: adm, body: { name: "Smoke Tec", email: `smoke.${sfx}@unicap.br`, role: "tecnico", registration: `SM${sfx}`, password: "Senha12345" } });
log(tec.s === 201, "admin cria técnico");
const tlogin = await call("POST", "/api/auth/login", { body: { email: `smoke.${sfx}@unicap.br`, password: "Senha12345" } });
log(tlogin.s === 200, "técnico faz login");
const t = tlogin.j.token;
const mach = await call("POST", "/api/machines", { token: t, body: { name: "Smoke FDM", tag: `SM-${sfx}`, type: "printer_3d_fdm" } });
log(mach.s === 201, "técnico cadastra máquina");
const sup = await call("POST", "/api/supplies", { token: adm, body: { name: "PLA Smoke", type: "PLA", color: `Cor ${sfx}`, balance: 0 } });
const entry = await call("POST", "/api/supplies/entries", { token: t, body: { supplyId: sup.j.supply.id, quantity: 5 } });
log(entry.s === 201 && entry.j.supply.balance === 5, "entrada de estoque 5 kg");
const prod = await call("POST", "/api/productions", { token: t, body: { type: "impressao_3d", description: "Smoke peça", machineId: mach.j.machine.id, supplyId: sup.j.supply.id, supplyConsumed: 1.5, durationMinutes: 45 } });
log(prod.s === 201, "produção com consumo de 1,5 kg");
const bal = await call("GET", `/api/supplies/${sup.j.supply.id}`, { token: t });
log(bal.j.supply.balance === 3.5, "saldo debitado para 3,5 kg", `saldo=${bal.j.supply.balance}`);
const cancel = await call("POST", `/api/productions/${prod.j.production.id}/cancel`, { token: t });
const bal2 = await call("GET", `/api/supplies/${sup.j.supply.id}`, { token: t });
log(cancel.s === 200 && bal2.j.supply.balance === 5, "cancelamento devolve o saldo");
const maint = await call("POST", "/api/maintenances", { token: t, body: { machineId: mach.j.machine.id, type: "preventiva", date: new Date().toISOString().slice(0, 10), description: "Smoke", cost: 10 } });
log(maint.s === 201, "registro de manutenção");
const eq = await call("POST", "/api/equipment", { token: t, body: { name: "Smoke Tablet", code: `SMK-${sfx}` } });
const loan = await call("POST", "/api/loans", { token: t, body: { equipmentId: eq.j.item.id, responsibleName: "Responsável Smoke", dueDate: "2030-01-01" } });
log(loan.s === 201, "retirada de equipamento portátil");
const again = await call("POST", "/api/loans", { token: t, body: { equipmentId: eq.j.item.id, responsibleName: "Outro", dueDate: "2030-01-01" } });
log(again.s === 409, "segunda retirada recusada (409)");
const ret = await call("POST", `/api/loans/${loan.j.loan.id}/return`, { token: t });
log(ret.s === 200, "devolução do equipamento");
const today = new Date().toISOString().slice(0, 10);
for (const r of ["production", "production-by-technician", "stock-consumption", "loans", "maintenances"]) {
  const rep = await call("GET", `/api/reports/${r}?from=${today}&to=${today}`, { token: t });
  log(rep.s === 200, `relatório ${r}`);
}
const dash = await call("GET", "/api/dashboard/summary", { token: t }); log(dash.s === 200, "dashboard");
const users = await call("GET", "/api/users?limit=5", { token: adm }); log(users.s === 200 && users.j.data.length <= 5, "lista de usuários paginada");
const forbidden = await call("POST", "/api/users", { token: t, body: { name: "X Y", email: `x.${sfx}@unicap.br`, role: "tecnico", registration: `X${sfx}` } });
log(forbidden.s === 403, "técnico não cria usuário (403)");
const out = await call("POST", "/api/auth/logout", { token: t });
const after = await call("GET", "/api/auth/me", { token: t });
log(out.s === 200 && after.s === 401, "logout revoga a sessão");
console.log(`\nSMOKE: ${fails === 0 ? "APROVADO" : `REPROVADO (${fails} falhas)`} em ${((Date.now() - s) / 1000).toFixed(1)}s`);
process.exit(fails ? 1 : 0);
