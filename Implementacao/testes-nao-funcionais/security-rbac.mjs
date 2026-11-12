// Autorização por perfil, revogação de sessão e reuso de token de recuperação.
// Cria técnicos e registros de teste: exige WRITE=1 e não deve rodar na produção sem combinar com o time.
// Uso: WRITE=1 BASE=... ADMIN_EMAIL=... ADMIN_PASSWORD=... node security-rbac.mjs
import { call, adminToken, requireEnv, requireWrite, finish } from "./common.mjs";

requireWrite("security-rbac.mjs");
requireEnv("ADMIN_EMAIL", "ADMIN_PASSWORD");
const results = [];
const rec = (id, ok, desc, obs, res) => results.push({ id, res: res ?? (ok ? "OK" : "FALHA"), desc, obs });
const PASSWORD = "Senha12345";
const sfx = Date.now();
const login = (email, password) => call("POST", "/api/auth/login", { body: { email, password } });

const admin = await adminToken();

// Dois técnicos de teste, criados pelo administrador
async function createTech(name, tag) {
  const email = `rbac.${tag}.${sfx}@unicap.br`;
  const r = await call("POST", "/api/users", { token: admin, body: { name, email, role: "tecnico", registration: `R${tag}${sfx}`, password: PASSWORD } });
  const l = await login(email, PASSWORD);
  return { id: r.json?.user?.id, email, token: l.json?.token };
}
const techA = await createTech("Técnico A", "a");
const techB = await createTech("Técnico B", "b");
if (!techA.token || !techB.token) {
  console.error("Não foi possível criar os técnicos de teste.");
  process.exit(2);
}

// Máquina de teste (para produção e DELETE)
const mach = await call("POST", "/api/machines", { token: admin, body: { name: "RBAC FDM", tag: `RBAC-${sfx}`, type: "printer_3d_fdm" } });
const machineId = mach.json?.machine?.id;

// Autorização
const p1 = await call("POST", "/api/users", { token: techA.token, body: { name: "X Y", email: `x.${sfx}@unicap.br`, role: "tecnico", registration: `X${sfx}` } });
rec("P1", p1.status === 403, "Técnico não cria usuário", `status=${p1.status}`);
const p2 = await call("PATCH", `/api/users/${techA.id}`, { token: techA.token, body: { role: "administrador" } });
rec("P2", p2.status === 403, "Técnico não altera perfil de usuário", `status=${p2.status}`);
const p3 = await call("PATCH", "/api/users/me", { token: techA.token, body: { role: "administrador" } });
const p3ok = p3.status === 200 && p3.json?.user?.role === "tecnico";
rec("P3", p3ok, "PATCH /users/me não escala privilégio", `status=${p3.status} role=${p3.json?.user?.role}`);
const p4 = await call("DELETE", `/api/machines/${machineId}`, { token: techA.token });
rec("P4", p4.status === 403, "Técnico não remove máquina", `status=${p4.status}`);
const p5 = await call("POST", "/api/supplies/adjustments", { token: techA.token, body: { supplyId: "sup-inexistente", quantity: 1, reason: "teste" } });
rec("P5", p5.status === 403, "Técnico não ajusta estoque", `status=${p5.status}`);

const prod = await call("POST", "/api/productions", { token: techB.token, body: { type: "impressao_3d", description: "Produção do B", machineId, supplyConsumed: 0 } });
const prodId = prod.json?.production?.id;
if (!prodId) {
  rec("P6", false, "Produção de teste criada pelo técnico B", `status=${prod.status}`);
} else {
  const p6 = await call("POST", `/api/productions/${prodId}/cancel`, { token: techA.token });
  rec("P6", p6.status === 403, "Técnico A não cancela produção do técnico B", `status=${p6.status}`);
}

const p7 = await call("GET", "/api/users", { token: techA.token });
rec("P7", null, "Técnico lista usuários (decisão de produto pendente, informativo)", `status=${p7.status} total=${p7.json?.total}`, "INFO");

// Revogação de sessão
const sess = await login(techB.email, PASSWORD);
const out = await call("POST", "/api/auth/logout", { token: sess.json?.token });
const after = await call("GET", "/api/auth/me", { token: sess.json?.token });
rec("R1", out.status === 200 && after.status === 401, "Logout revoga o token", `logout=${out.status} me_depois=${after.status}`);

// Reuso do token de recuperação: técnico novo com pergunta de segurança
const recEmail = `rbac.rec.${sfx}@unicap.br`;
await call("POST", "/api/auth/register", { body: { name: "Técnico Recupera", email: recEmail, registration: `RC${sfx}`, password: PASSWORD, securityQuestion: "Qual sua cor favorita?", securityAnswer: "azul" } });
const verify = await call("POST", "/api/auth/forgot-password/verify-answer", { body: { email: recEmail, answer: "azul" } });
const resetToken = verify.json?.resetToken;
if (!resetToken) {
  rec("R2", false, "Token de recuperação obtido com a resposta correta", `status=${verify.status}`);
} else {
  const first = await call("POST", "/api/auth/forgot-password/reset", { body: { email: recEmail, resetToken, newPassword: "NovaSenha123" } });
  const second = await call("POST", "/api/auth/forgot-password/reset", { body: { email: recEmail, resetToken, newPassword: "OutraSenha123" } });
  rec("R2", first.status === 200 && second.status === 401, "Token de recuperação é de uso único", `1º uso=${first.status} 2º uso=${second.status}`);
}

// Cadastro público não concede privilégio
const l4 = await call("POST", "/api/auth/register", { body: { name: "Escalada", email: `escalada.${sfx}@unicap.br`, role: "administrador", registration: `E${sfx}`, password: PASSWORD, securityQuestion: "Qual sua cor favorita?", securityAnswer: "azul" } });
rec("L4", l4.status === 201 && l4.json?.user?.role === "tecnico", "Cadastro público ignora role=administrador", `status=${l4.status} role=${l4.json?.user?.role}`);

// Erro de validação sem detalhe interno
const e2 = await call("POST", "/api/users", { token: admin, body: { name: "Erro", email: `erro.${sfx}@unicap.br`, role: "hacker", registration: `ER${sfx}` } });
rec("E2", e2.status === 400 && !/\bat\s|sqlite|Error:/i.test(e2.text), "Papel inválido: 400 sem detalhe interno", `status=${e2.status}`);

finish(results);
