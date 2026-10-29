import test from "node:test";
import assert from "node:assert/strict";
import { app } from "../src/app.js";
import { env } from "../src/config/env.js";
import { seedDatabase } from "../src/database/seed.js";
import http from "node:http";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const backendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

let server: http.Server;
let baseUrl: string;

function makeRequest(
  path: string,
  options: {
    method?: string;
    headers?: Record<string, string>;
    body?: any;
  } = {}
): Promise<{ status: number; data: any }> {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const req = http.request(
      url,
      {
        method: options.method || "GET",
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
      },
      (res) => {
        let rawData = "";
        res.on("data", (chunk) => (rawData += chunk));
        res.on("end", () => {
          let data: any = rawData;
          try {
            data = JSON.parse(rawData);
          } catch {
            // keep raw string
          }
          resolve({ status: res.statusCode || 500, data });
        });
      }
    );

    req.on("error", reject);

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    req.end();
  });
}

test.before(() => {
  seedDatabase();
  return new Promise<void>((resolve) => {
    server = app.listen(0, () => {
      const address = server.address() as any;
      baseUrl = `http://localhost:${address.port}`;
      resolve();
    });
  });
});

test.after(() => {
  return new Promise<void>((resolve) => {
    server.close(() => resolve());
  });
});

test("GET /api/health retorna 200 OK", async () => {
  const res = await makeRequest("/api/health");
  assert.equal(res.status, 200);
  assert.equal(res.data.status, "ok");
});

test("POST /api/auth/login com Administrador padrão tem sucesso", async () => {
  const res = await makeRequest("/api/auth/login", {
    method: "POST",
    body: {
      email: env.DEFAULT_ADMIN_EMAIL,
      password: env.DEFAULT_ADMIN_PASSWORD,
      role: "administrador",
    },
  });

  assert.equal(res.status, 200);
  assert.ok(res.data.token);
  assert.equal(res.data.user.role, "administrador");
  assert.equal(res.data.user.email, env.DEFAULT_ADMIN_EMAIL);
});

test("POST /api/auth/login com senha errada falha com 401", async () => {
  const res = await makeRequest("/api/auth/login", {
    method: "POST",
    body: {
      email: env.DEFAULT_ADMIN_EMAIL,
      password: "SenhaIncorreta",
      role: "administrador",
    },
  });

  assert.equal(res.status, 401);
  assert.equal(res.data.error.code, "INVALID_CREDENTIALS");
});

test("POST /api/auth/register cria novo Técnico e permite login imediato", async () => {
  const uniqueReg = `REG-${Date.now()}`;
  const techEmail = `novo.tecnico.${Date.now()}@unicap.br`;

  const regRes = await makeRequest("/api/auth/register", {
    method: "POST",
    body: {
      name: "Técnico de Testes Automatizados",
      email: techEmail,
      registration: uniqueReg,
      phone: "(81) 99887-1122",
      password: "SenhaForte@123",
      securityQuestion: "Qual o nome do seu animal de estimação?",
      securityAnswer: "Totó",
    },
  });

  assert.equal(regRes.status, 201);
  assert.ok(regRes.data.token);
  assert.equal(regRes.data.user.role, "tecnico");
  assert.equal(regRes.data.user.email, techEmail);

  // Agora testa login com o usuário recém-criado
  const loginRes = await makeRequest("/api/auth/login", {
    method: "POST",
    body: {
      email: techEmail,
      password: "SenhaForte@123",
      role: "tecnico",
    },
  });

  assert.equal(loginRes.status, 200);
  assert.ok(loginRes.data.token);
  assert.equal(loginRes.data.user.name, "Técnico de Testes Automatizados");
});

test("Fluxo de Recuperação de Senha: Admin tem recuperação restrita e Técnico recupera por pergunta de segurança", async () => {
  // 1. Tentar recuperar senha com e-mail de Administrador deve falhar com 403 e aviso para falar com devs
  const adminForgot = await makeRequest("/api/auth/forgot-password/verify-email", {
    method: "POST",
    body: { email: env.DEFAULT_ADMIN_EMAIL },
  });
  assert.equal(adminForgot.status, 403);
  assert.equal(adminForgot.data.error.code, "ADMIN_RECOVERY_RESTRICTED");

  // 2. Verificar e-mail com Técnico Padrão retorna a pergunta cadastrada
  const techForgot = await makeRequest("/api/auth/forgot-password/verify-email", {
    method: "POST",
    body: { email: env.DEFAULT_TECH_EMAIL },
  });
  assert.equal(techForgot.status, 200);
  assert.equal(techForgot.data.email, env.DEFAULT_TECH_EMAIL);
  assert.ok(techForgot.data.question.includes("primeiro animal de estimação"));

  // 3. Resposta incorreta falha
  const wrongAnswer = await makeRequest("/api/auth/forgot-password/verify-answer", {
    method: "POST",
    body: { email: env.DEFAULT_TECH_EMAIL, answer: "RespostaErrada" },
  });
  assert.equal(wrongAnswer.status, 400);
  assert.equal(wrongAnswer.data.error.code, "INCORRECT_ANSWER");

  // 4. Resposta correta (case-insensitive) gera resetToken
  const rightAnswer = await makeRequest("/api/auth/forgot-password/verify-answer", {
    method: "POST",
    body: { email: env.DEFAULT_TECH_EMAIL, answer: "rex" },
  });
  assert.equal(rightAnswer.status, 200);
  assert.ok(rightAnswer.data.resetToken);

  // 5. Redefinir senha com token válido
  const resetRes = await makeRequest("/api/auth/forgot-password/reset", {
    method: "POST",
    body: {
      email: env.DEFAULT_TECH_EMAIL,
      resetToken: rightAnswer.data.resetToken,
      newPassword: "NovaSenha@2026",
    },
  });
  assert.equal(resetRes.status, 200);

  // 6. Login com a nova senha tem sucesso
  const newLogin = await makeRequest("/api/auth/login", {
    method: "POST",
    body: {
      email: env.DEFAULT_TECH_EMAIL,
      password: "NovaSenha@2026",
      role: "tecnico",
    },
  });
  assert.equal(newLogin.status, 200);
  assert.ok(newLogin.data.token);
});

test("Operações de Estoque, Empréstimo e Dashboard", async () => {
  // Login como Admin para obter token
  const adminLogin = await makeRequest("/api/auth/login", {
    method: "POST",
    body: {
      email: env.DEFAULT_ADMIN_EMAIL,
      password: env.DEFAULT_ADMIN_PASSWORD,
      role: "administrador",
    },
  });
  const token = adminLogin.data.token;
  const authHeaders = { Authorization: `Bearer ${token}` };

  // 1. Listar Máquinas
  const machinesRes = await makeRequest("/api/machines", { headers: authHeaders });
  assert.equal(machinesRes.status, 200);
  assert.ok(machinesRes.data.machines.length > 0);

  // 2. Registrar Entrada de Estoque
  const entryRes = await makeRequest("/api/supplies/entries", {
    method: "POST",
    headers: authHeaders,
    body: {
      name: "PLA 1.75mm",
      color: "Azul Cobalto",
      type: "Termoplástico",
      quantity: 3.5,
      lot: "LOTE-TEST-01",
      observations: "Entrada de teste",
    },
  });
  assert.equal(entryRes.status, 201);
  assert.ok(entryRes.data.supply.balance >= 3.5);

  // 3. Cadastrar Equipamento Portátil
  const code = `TEST-${Date.now()}`;
  const equipRes = await makeRequest("/api/equipment", {
    method: "POST",
    headers: authHeaders,
    body: {
      name: "Lupa de Inspeção Óptica",
      code,
      category: "Metrologia",
    },
  });
  assert.equal(equipRes.status, 201);
  const equipId = equipRes.data.item.id;

  // 4. Empréstimo do equipamento
  const loanRes = await makeRequest("/api/loans", {
    method: "POST",
    headers: authHeaders,
    body: {
      equipmentId: equipId,
      responsibleName: "Aluno Teste",
      dueDate: "2026-10-25T18:00:00Z",
    },
  });
  assert.equal(loanRes.status, 201);
  const loanId = loanRes.data.loan.id;

  // 5. Tentativa de empréstimo duplo no mesmo item DEVE FALHAR (Regra de Negócio)
  const duplicateLoanRes = await makeRequest("/api/loans", {
    method: "POST",
    headers: authHeaders,
    body: {
      equipmentId: equipId,
      responsibleName: "Outro Aluno",
      dueDate: "2026-10-25T18:00:00Z",
    },
  });
  assert.equal(duplicateLoanRes.status, 409);

  // 6. Devolução do empréstimo
  const returnRes = await makeRequest(`/api/loans/${loanId}/return`, {
    method: "POST",
    headers: authHeaders,
  });
  assert.equal(returnRes.status, 200);
  assert.equal(returnRes.data.loan.status, "devolvido");

  // 7. Dashboard Summary
  const dashRes = await makeRequest("/api/dashboard/summary", { headers: authHeaders });
  assert.equal(dashRes.status, 200);
  assert.ok(dashRes.data.machines.total >= 1);
  assert.ok(dashRes.data.users.total >= 1);
});


test("Status de empréstimo é calculado pelo prazo (fuso de Recife)", async () => {
  const loginRes = await makeRequest("/api/auth/login", {
    method: "POST",
    body: { email: env.DEFAULT_ADMIN_EMAIL, password: env.DEFAULT_ADMIN_PASSWORD, role: "administrador" },
  });
  assert.equal(loginRes.status, 200);
  const authHeaders = { Authorization: `Bearer ${loginRes.data.token}` };

  // Data de hoje no fuso de Recife (AAAA-MM-DD)
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Recife" }).format(new Date());
  const yesterday = new Date(Date.parse(`${today}T12:00:00Z`) - 86_400_000).toISOString().slice(0, 10);
  const tomorrow = new Date(Date.parse(`${today}T12:00:00Z`) + 86_400_000).toISOString().slice(0, 10);

  async function checkout(dueDate: string) {
    const eq = await makeRequest("/api/equipment", {
      method: "POST",
      headers: authHeaders,
      body: { name: "Equipamento de Prazo", code: `PRAZO-${Date.now()}-${Math.random()}`, category: "Teste" },
    });
    assert.equal(eq.status, 201);
    const loan = await makeRequest("/api/loans", {
      method: "POST",
      headers: authHeaders,
      body: { equipmentId: eq.data.item.id, responsibleName: "Prazo Teste", dueDate },
    });
    assert.equal(loan.status, 201);
    return { equipmentId: eq.data.item.id, loanId: loan.data.loan.id };
  }

  const overdue = await checkout(yesterday);
  const dueToday = await checkout(today);
  const future = await checkout(tomorrow);

  // Status exibido é o efetivo, mesmo com o registro gravado como 'em_campo'
  const overdueRes = await makeRequest(`/api/loans/${overdue.loanId}`, { headers: authHeaders });
  assert.equal(overdueRes.data.loan.status, "atrasado");
  const todayRes = await makeRequest(`/api/loans/${dueToday.loanId}`, { headers: authHeaders });
  assert.equal(todayRes.data.loan.status, "devolucao_hoje");
  const futureRes = await makeRequest(`/api/loans/${future.loanId}`, { headers: authHeaders });
  assert.equal(futureRes.data.loan.status, "em_campo");

  // Filtro por status usa o status efetivo
  const filtered = await makeRequest("/api/loans?status=atrasado", { headers: authHeaders });
  const overdueIds = filtered.data.loans.map((l: any) => l.id);
  assert.ok(overdueIds.includes(overdue.loanId));
  assert.ok(!overdueIds.includes(future.loanId));

  // Equipamento com empréstimo atrasado aparece como 'atrasado'
  const equipList = await makeRequest(`/api/equipment/${overdue.equipmentId}`, { headers: authHeaders });
  assert.equal(equipList.data.item.status, "atrasado");

  // Devolução encerra o empréstimo independentemente do prazo
  const ret = await makeRequest(`/api/loans/${overdue.loanId}/return`, { method: "POST", headers: authHeaders });
  assert.equal(ret.data.loan.status, "devolvido");
});

test("Produção: valida consumo e duração negativos e exige insumo quando há consumo", async () => {
  const loginRes = await makeRequest("/api/auth/login", {
    method: "POST",
    body: { email: env.DEFAULT_ADMIN_EMAIL, password: env.DEFAULT_ADMIN_PASSWORD, role: "administrador" },
  });
  assert.equal(loginRes.status, 200);
  const authHeaders = { Authorization: `Bearer ${loginRes.data.token}` };

  const machinesRes = await makeRequest("/api/machines", { headers: authHeaders });
  const machineId = machinesRes.data.machines[0].id;

  const supplyRes = await makeRequest("/api/supplies", { headers: authHeaders });
  const supply = supplyRes.data.supplies[0];
  const balanceBefore = supply.balance;

  const base = { type: "impressao_3d", description: "Teste de validação", machineId };

  // Consumo negativo é recusado
  const negative = await makeRequest("/api/productions", {
    method: "POST",
    headers: authHeaders,
    body: { ...base, supplyId: supply.id, supplyConsumed: -2.5 },
  });
  assert.equal(negative.status, 400);
  assert.equal(negative.data.error.code, "INVALID_CONSUMPTION");

  // Duração negativa é recusada
  const negDuration = await makeRequest("/api/productions", {
    method: "POST",
    headers: authHeaders,
    body: { ...base, durationMinutes: -10 },
  });
  assert.equal(negDuration.status, 400);
  assert.equal(negDuration.data.error.code, "INVALID_DURATION");

  // Consumo sem insumo informado é recusado e não é gravado
  const noSupply = await makeRequest("/api/productions", {
    method: "POST",
    headers: authHeaders,
    body: { ...base, supplyConsumed: 1.5 },
  });
  assert.equal(noSupply.status, 400);
  assert.equal(noSupply.data.error.code, "SUPPLY_REQUIRED");

  // Nenhuma das recusas alterou o estoque
  const supplyAfter = await makeRequest(`/api/supplies/${supply.id}`, { headers: authHeaders });
  assert.equal(supplyAfter.data.supply.balance, balanceBefore);
});

test("Ajuste manual de estoque: administrador ajusta com motivo e técnico é bloqueado", async () => {
  const adminLogin = await makeRequest("/api/auth/login", {
    method: "POST",
    body: { email: env.DEFAULT_ADMIN_EMAIL, password: env.DEFAULT_ADMIN_PASSWORD, role: "administrador" },
  });
  assert.equal(adminLogin.status, 200);
  const adminHeaders = { Authorization: `Bearer ${adminLogin.data.token}` };

  // Cria um técnico próprio para o teste de permissão
  const techEmail = `ajuste.tecnico.${Date.now()}@unicap.br`;
  const reg = await makeRequest("/api/auth/register", {
    method: "POST",
    body: {
      name: "Técnico Ajuste",
      email: techEmail,
      registration: `AJ-${Date.now()}`,
      phone: "(81) 99000-0000",
      password: "SenhaForte@123",
      securityQuestion: "Qual o nome do seu animal de estimação?",
      securityAnswer: "Totó",
    },
  });
  assert.equal(reg.status, 201);
  const techLogin = await makeRequest("/api/auth/login", {
    method: "POST",
    body: { email: techEmail, password: "SenhaForte@123", role: "tecnico" },
  });
  assert.equal(techLogin.status, 200);
  const techHeaders = { Authorization: `Bearer ${techLogin.data.token}` };

  // Insumo com saldo conhecido
  const entry = await makeRequest("/api/stock/entries", {
    method: "POST",
    headers: adminHeaders,
    body: { name: `Insumo Ajuste ${Date.now()}`, color: "Teste", type: "Termoplástico", quantity: 2, lot: "AJ-1" },
  });
  assert.equal(entry.status, 201);
  const supplyId = entry.data.supply.id;
  const before = entry.data.supply.balance;

  const adjustBody = { supplyId, quantity: -0.5, reason: "Perda por falha de impressão" };

  // Técnico não pode ajustar
  const forbidden = await makeRequest("/api/stock/adjustments", { method: "POST", headers: techHeaders, body: adjustBody });
  assert.equal(forbidden.status, 403);

  // Valor zero é recusado
  const zero = await makeRequest("/api/stock/adjustments", {
    method: "POST",
    headers: adminHeaders,
    body: { supplyId, quantity: 0, reason: "Teste" },
  });
  assert.equal(zero.status, 400);

  // Motivo é obrigatório
  const noReason = await makeRequest("/api/stock/adjustments", {
    method: "POST",
    headers: adminHeaders,
    body: { supplyId, quantity: -0.5, reason: "  " },
  });
  assert.equal(noReason.status, 400);

  // Saldo não pode ficar negativo
  const tooMuch = await makeRequest("/api/stock/adjustments", {
    method: "POST",
    headers: adminHeaders,
    body: { supplyId, quantity: -999, reason: "Teste" },
  });
  assert.equal(tooMuch.status, 400);
  assert.equal(tooMuch.data.error.code, "INSUFFICIENT_STOCK");

  // Ajuste válido debita o saldo e registra movimento do tipo 'ajuste'
  const ok = await makeRequest("/api/stock/adjustments", { method: "POST", headers: adminHeaders, body: adjustBody });
  assert.equal(ok.status, 201);
  assert.equal(ok.data.supply.balance, Number((before - 0.5).toFixed(3)));

  const movements = await makeRequest(`/api/stock/movements?supplyId=${supplyId}`, { headers: adminHeaders });
  const adj = movements.data.movements.find((m: any) => m.id === ok.data.movementId);
  assert.ok(adj, "movimento de ajuste deve existir");
  assert.equal(adj.type, "ajuste");
  assert.equal(adj.quantity, -0.5);
});

async function loginAs(email: string, password: string, role: string): Promise<{ Authorization: string }> {
  const res = await makeRequest("/api/auth/login", { method: "POST", body: { email, password, role } });
  assert.equal(res.status, 200);
  return { Authorization: `Bearer ${res.data.token}` };
}

// Cria um técnico próprio para cada teste: a senha do técnico padrão muda no teste de recuperação
async function createTechnician(): Promise<{ id: string; headers: { Authorization: string } }> {
  const adminHeaders = await loginAs(env.DEFAULT_ADMIN_EMAIL, env.DEFAULT_ADMIN_PASSWORD, "administrador");
  const suffix = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
  const email = `tec.${suffix}@unicap.br`;
  const password = "SenhaTeste@123";
  const created = await makeRequest("/api/users", {
    method: "POST",
    headers: adminHeaders,
    body: { name: "Técnico de Regras", email, role: "tecnico", registration: `REG-${suffix}`, password },
  });
  assert.equal(created.status, 201);

  const login = await makeRequest("/api/auth/login", { method: "POST", body: { email, password, role: "tecnico" } });
  assert.equal(login.status, 200);
  return { id: login.data.user.id, headers: { Authorization: `Bearer ${login.data.token}` } };
}

test("R1: técnico não registra produção em nome de outro usuário", async () => {
  const tech = await createTechnician();

  const other = await makeRequest("/api/productions", {
    method: "POST",
    headers: tech.headers,
    body: { type: "impressao_3d", description: "Em nome de outro", machineId: "mach-1", technicianId: "usr-admin-musarq" },
  });
  assert.equal(other.status, 403);
  assert.equal(other.data.error.code, "PRODUCTION_TECHNICIAN_MISMATCH");

  const own = await makeRequest("/api/productions", {
    method: "POST",
    headers: tech.headers,
    body: { type: "impressao_3d", description: "Próprio", machineId: "mach-1", technicianId: tech.id },
  });
  assert.equal(own.status, 201);
  assert.equal(own.data.production.technician_id, tech.id);

  const noTechnician = await makeRequest("/api/productions", {
    method: "POST",
    headers: tech.headers,
    body: { type: "impressao_3d", description: "Sem técnico informado", machineId: "mach-1" },
  });
  assert.equal(noTechnician.status, 201);
  assert.equal(noTechnician.data.production.technician_id, tech.id);
});

test("R2: produção recusa máquina inativa, tipo incompatível e consumo em escaneamento", async () => {
  const adminHeaders = await loginAs(env.DEFAULT_ADMIN_EMAIL, env.DEFAULT_ADMIN_PASSWORD, "administrador");
  const tech = await createTechnician();

  await makeRequest("/api/machines/mach-1", { method: "PATCH", headers: adminHeaders, body: { status: "inativa" } });
  const inactive = await makeRequest("/api/productions", {
    method: "POST",
    headers: tech.headers,
    body: { type: "impressao_3d", description: "Máquina inativa", machineId: "mach-1" },
  });
  assert.equal(inactive.status, 400);
  assert.equal(inactive.data.error.code, "MACHINE_INACTIVE");
  await makeRequest("/api/machines/mach-1", { method: "PATCH", headers: adminHeaders, body: { status: "ativa" } });

  const wrongType = await makeRequest("/api/productions", {
    method: "POST",
    headers: tech.headers,
    body: { type: "impressao_3d", description: "Impressão no scanner", machineId: "mach-5" },
  });
  assert.equal(wrongType.status, 400);
  assert.equal(wrongType.data.error.code, "MACHINE_TYPE_MISMATCH");

  const supplies = await makeRequest("/api/supplies", { headers: adminHeaders });
  const supplyId = supplies.data.supplies[0].id;
  const scanWithConsumption = await makeRequest("/api/productions", {
    method: "POST",
    headers: tech.headers,
    body: { type: "escaneamento", description: "Scan com consumo", machineId: "mach-5", supplyId, supplyConsumed: 1 },
  });
  assert.equal(scanWithConsumption.status, 400);
  assert.equal(scanWithConsumption.data.error.code, "SCAN_NO_CONSUMPTION");
});

test("R3: empréstimo recusa data prevista em formato inválido", async () => {
  const adminHeaders = await loginAs(env.DEFAULT_ADMIN_EMAIL, env.DEFAULT_ADMIN_PASSWORD, "administrador");
  const equip = await makeRequest("/api/equipment", {
    method: "POST",
    headers: adminHeaders,
    body: { name: "Tablet de Validação", code: `VAL-${Date.now()}` },
  });
  const equipmentId = equip.data.item.id;

  const invalid = await makeRequest("/api/loans", {
    method: "POST",
    headers: adminHeaders,
    body: { equipmentId, responsibleName: "Teste", dueDate: "abc" },
  });
  assert.equal(invalid.status, 400);
  assert.equal(invalid.data.error.code, "INVALID_DUE_DATE");

  const loansAfter = await makeRequest("/api/loans", { headers: adminHeaders });
  assert.equal(loansAfter.data.loans.filter((l: any) => l.equipment_id === equipmentId).length, 0);
});

test("R4: relatório com 'até' igual à data inclui os registros do último dia", async () => {
  const tech = await createTechnician();
  const today = new Date().toISOString().slice(0, 10);

  const before = await makeRequest(`/api/reports/production?from=${today}&to=${today}`, { headers: tech.headers });
  await makeRequest("/api/productions", {
    method: "POST",
    headers: tech.headers,
    body: { type: "impressao_3d", description: "Para o relatório", machineId: "mach-1" },
  });
  const after = await makeRequest(`/api/reports/production?from=${today}&to=${today}`, { headers: tech.headers });

  assert.equal(after.data.metrics.totalJobs, before.data.metrics.totalJobs + 1);
});

test("R5: movimento de consumo referencia o ID da produção e não o da máquina", async () => {
  const adminHeaders = await loginAs(env.DEFAULT_ADMIN_EMAIL, env.DEFAULT_ADMIN_PASSWORD, "administrador");
  const tech = await createTechnician();
  const entry = await makeRequest("/api/supplies/entries", {
    method: "POST",
    headers: adminHeaders,
    body: { name: `Insumo Ref ${Date.now()}`, color: "Preto", type: "PLA", quantity: 5, lot: "LOTE-REF" },
  });
  assert.equal(entry.status, 201);
  const supplyId = entry.data.supply.id;

  const prod = await makeRequest("/api/productions", {
    method: "POST",
    headers: tech.headers,
    body: { type: "impressao_3d", description: "Ref", machineId: "mach-1", supplyId, supplyConsumed: 0.5 },
  });
  assert.equal(prod.status, 201, JSON.stringify(prod.data));

  const movements = await makeRequest(`/api/supplies/movements?supplyId=${supplyId}`, { headers: tech.headers });
  const movement = movements.data.movements.find((m: any) => m.type === "saida_producao" && m.reference_id === prod.data.production.id);
  assert.ok(movement, "movimento de saída deve referenciar o ID da produção");
});

test("V1: entradas inválidas devolvem 400, nunca 500", async () => {
  const adminHeaders = await loginAs(env.DEFAULT_ADMIN_EMAIL, env.DEFAULT_ADMIN_PASSWORD, "administrador");
  const tech = await createTechnician();

  const badRole = await makeRequest("/api/users", {
    method: "POST",
    headers: adminHeaders,
    body: { name: "Fulano X", email: `x.${Date.now()}@unicap.br`, role: "hacker", registration: `H${Date.now()}` },
  });
  assert.equal(badRole.status, 400);

  const badJson = await new Promise<number>((resolve, reject) => {
    const req = http.request(new URL("/api/productions", baseUrl), {
      method: "POST",
      headers: { "Content-Type": "application/json", ...tech.headers },
    }, (res) => { res.resume(); res.on("end", () => resolve(res.statusCode || 500)); });
    req.on("error", reject);
    req.write("{ isto nao e json");
    req.end();
  });
  assert.equal(badJson, 400);

  const noBody = await makeRequest("/api/machines", { method: "POST", headers: adminHeaders });
  assert.equal(noBody.status, 400);

  const badDate = await makeRequest("/api/maintenances", {
    method: "POST",
    headers: tech.headers,
    body: { machineId: "mach-1", type: "preventiva", date: "abc", description: "x" },
  });
  assert.equal(badDate.status, 400);
  assert.equal(badDate.data.error.code, "INVALID_DATE");
});

test("V2: saldo inicial e custo de manutenção negativos são recusados", async () => {
  const adminHeaders = await loginAs(env.DEFAULT_ADMIN_EMAIL, env.DEFAULT_ADMIN_PASSWORD, "administrador");
  const tech = await createTechnician();

  const negBalance = await makeRequest("/api/supplies", {
    method: "POST",
    headers: adminHeaders,
    body: { name: "Teste", type: "PLA", color: "Azul", balance: -5 },
  });
  assert.equal(negBalance.status, 400);
  assert.equal(negBalance.data.error.code, "INVALID_BALANCE");

  const negCost = await makeRequest("/api/maintenances", {
    method: "POST",
    headers: tech.headers,
    body: { machineId: "mach-1", type: "corretiva", date: "2026-10-19", description: "x", cost: -100 },
  });
  assert.equal(negCost.status, 400);
  assert.equal(negCost.data.error.code, "INVALID_COST");
});

function getRawHeaders(requestPath: string, headers: Record<string, string>): Promise<http.IncomingHttpHeaders> {
  return new Promise((resolve, reject) => {
    const req = http.request(new URL(requestPath, baseUrl), { method: "GET", headers }, (res) => {
      res.resume();
      res.on("end", () => resolve(res.headers));
    });
    req.on("error", reject);
    req.end();
  });
}

async function createUserWithPassword(role: string, password: string): Promise<{ id: string; email: string }> {
  const adminHeaders = await loginAs(env.DEFAULT_ADMIN_EMAIL, env.DEFAULT_ADMIN_PASSWORD, "administrador");
  const suffix = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
  const email = `${role}.${suffix}@unicap.br`;
  const created = await makeRequest("/api/users", {
    method: "POST",
    headers: adminHeaders,
    body: { name: `Conta ${role}`, email, role, registration: `REG-${suffix}`, password },
  });
  assert.equal(created.status, 201);
  return { id: created.data.user.id, email };
}

test("S1: conta de aluno não autentica no sistema", async () => {
  const { email } = await createUserWithPassword("aluno", "Senha1234");

  const login = await makeRequest("/api/auth/login", { method: "POST", body: { email, password: "Senha1234" } });
  assert.equal(login.status, 403);
  assert.equal(login.data.error.code, "ROLE_NOT_ALLOWED");
});

test("S2: CORS libera apenas a origem do frontend", async () => {
  const evil = await getRawHeaders("/api/health", { Origin: "https://site-malicioso.exemplo" });
  assert.equal(evil["access-control-allow-origin"], undefined);

  const frontend = await getRawHeaders("/api/health", { Origin: "http://localhost:3000" });
  assert.equal(frontend["access-control-allow-origin"], "http://localhost:3000");
});

test("S3: logout revoga o token", async () => {
  const tech = await createTechnician();

  const before = await makeRequest("/api/auth/me", { headers: tech.headers });
  assert.equal(before.status, 200);

  const logout = await makeRequest("/api/auth/logout", { method: "POST", headers: tech.headers });
  assert.equal(logout.status, 200);

  const after = await makeRequest("/api/auth/me", { headers: tech.headers });
  assert.equal(after.status, 401);
  assert.equal(after.data.error.code, "TOKEN_REVOKED");
});

test("S4: login é bloqueado após tentativas seguidas com senha errada", async () => {
  const email = `forca.bruta.${Date.now()}@unicap.br`;

  const statuses: number[] = [];
  for (let i = 0; i < 6; i++) {
    const res = await makeRequest("/api/auth/login", { method: "POST", body: { email, password: "errada" } });
    statuses.push(res.status);
    if (res.status === 429) {
      assert.equal(res.data.error.code, "TOO_MANY_ATTEMPTS");
    }
  }
  assert.deepEqual(statuses, [401, 401, 401, 401, 401, 429]);
});

test("S5: token de recuperação só redefine a senha uma vez", async () => {
  const suffix = `${Date.now()}`;
  const email = `recupera.${suffix}@unicap.br`;

  const reg = await makeRequest("/api/auth/register", {
    method: "POST",
    body: {
      name: "Técnico Recuperação",
      email,
      registration: `REG-${suffix}`,
      password: "SenhaForte@123",
      securityQuestion: "Qual o nome do seu animal de estimação?",
      securityAnswer: "Totó",
    },
  });
  assert.equal(reg.status, 201);

  const verify = await makeRequest("/api/auth/forgot-password/verify-answer", {
    method: "POST",
    body: { email, answer: "Totó" },
  });
  const resetToken = verify.data.resetToken;

  const first = await makeRequest("/api/auth/forgot-password/reset", {
    method: "POST",
    body: { email, resetToken, newPassword: "NovaSenha@2026" },
  });
  assert.equal(first.status, 200);

  const second = await makeRequest("/api/auth/forgot-password/reset", {
    method: "POST",
    body: { email, resetToken, newPassword: "OutraSenha@2026" },
  });
  assert.equal(second.status, 401);
  assert.equal(second.data.error.code, "INVALID_TOKEN");
});

test("S6: conta inativa não revela o status antes da senha", async () => {
  const { id, email } = await createUserWithPassword("tecnico", "Senha1234");
  const adminHeaders = await loginAs(env.DEFAULT_ADMIN_EMAIL, env.DEFAULT_ADMIN_PASSWORD, "administrador");
  const deactivated = await makeRequest(`/api/users/${id}/status`, {
    method: "PATCH",
    headers: adminHeaders,
    body: { status: "inativo" },
  });
  assert.equal(deactivated.status, 200);

  const wrongPassword = await makeRequest("/api/auth/login", { method: "POST", body: { email, password: "errada1" } });
  assert.equal(wrongPassword.status, 401);
  assert.equal(wrongPassword.data.error.code, "INVALID_CREDENTIALS");
});

test("S7: em produção, o servidor não inicia sem JWT_SECRET", () => {
  const result = spawnSync(process.execPath, ["--import", "tsx", "-e", 'import("./src/config/env.ts")'], {
    cwd: backendRoot,
    env: { ...process.env, NODE_ENV: "production", JWT_SECRET: "" },
    encoding: "utf8",
  });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /JWT_SECRET/);
});

test("S7: em produção, nenhuma conta padrão é criada", () => {
  const dir = mkdtempSync(path.join(os.tmpdir(), "labmu-prod-"));
  const script = [
    'import("./src/bootstrap.ts")',
    '  .then(({ initializeData }) => { initializeData(); return import("./src/database/connection.ts"); })',
    '  .then(({ query }) => console.log(query.get("SELECT COUNT(*) AS n FROM users").n));',
  ].join("\n");

  const result = spawnSync(process.execPath, ["--import", "tsx", "-e", script], {
    cwd: backendRoot,
    env: { ...process.env, NODE_ENV: "production", JWT_SECRET: "segredo-de-teste", DATABASE_FILE: path.join(dir, "prod.sqlite") },
    encoding: "utf8",
  });
  rmSync(dir, { recursive: true, force: true });

  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout.trim(), "0");
});
