import test from "node:test";
import assert from "node:assert/strict";
import { app } from "../src/app.js";
import { env } from "../src/config/env.js";
import { seedDatabase } from "../src/database/seed.js";
import http from "node:http";

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

