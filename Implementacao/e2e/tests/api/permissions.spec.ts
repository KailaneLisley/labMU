import { test, expect } from "@playwright/test";
import { TECH, ApiClient, createTechnician, loginAdmin, unique } from "../../support/api";

test.describe("Autenticação e permissões (API)", () => {
  test("rotas protegidas recusam chamadas sem token", async ({ request }) => {
    const anonymous = new ApiClient(request);
    for (const path of ["/users", "/machines", "/supplies", "/equipment", "/loans", "/productions", "/maintenances", "/reports/production", "/dashboard/summary"]) {
      const res = await anonymous.get(path);
      expect(res.status(), path).toBe(401);
    }
  });

  test("token inválido é recusado", async ({ request }) => {
    const forged = new ApiClient(request, "token.falso.assinado");
    const res = await forged.get("/machines");
    expect(res.status()).toBe(401);
  });

  test("técnico só acessa máquinas, manutenção e estoque", async ({ request }) => {
    const tech = await ApiClient.login(request, TECH);

    expect((await tech.post("/users", { name: "X", email: `${unique("x")}@unicap.br`, role: "tecnico", registration: unique("R") })).status()).toBe(403);
    expect((await tech.post("/supplies/adjustments", { supplyId: "sup-x", quantity: 1, reason: "teste" })).status()).toBe(403);
    expect((await tech.delete("/machines/mach-5")).status()).toBe(403);

    // Telas liberadas para o técnico
    expect((await tech.get("/machines")).status()).toBe(200);
    expect((await tech.get("/maintenances")).status()).toBe(200);
    expect((await tech.get("/supplies")).status()).toBe(200);
    expect((await tech.get("/reports/maintenances")).status()).toBe(200);

    // Telas exclusivas do administrador
    expect((await tech.get("/users")).status()).toBe(403);
    expect((await tech.get("/dashboard/summary")).status()).toBe(403);
    expect((await tech.get("/reports/production")).status()).toBe(403);
    expect((await tech.get("/loans")).status()).toBe(403);
    expect((await tech.get("/equipment")).status()).toBe(403);
  });

  test("administrador acessa as rotas de técnico e de administrador", async ({ request }) => {
    const admin = await loginAdmin(request);
    expect((await admin.get("/users")).status()).toBe(200);
    expect((await admin.get("/machines")).status()).toBe(200);
    expect((await admin.get("/reports/production")).status()).toBe(200);
  });

  test("logout via API revoga o token imediatamente", async ({ request }) => {
    const tech = await createTechnician(request, "Técnico Logout");
    expect((await tech.api.get("/auth/me")).status()).toBe(200);

    expect((await tech.api.post("/auth/logout")).status()).toBe(200);
    expect((await tech.api.get("/auth/me")).status()).toBe(401);
  });

  test("conta de aluno não obtém token pela API de login", async ({ request }) => {
    const admin = await loginAdmin(request);
    const email = `${unique("al")}@unicap.br`;
    await admin.expectJson(await admin.post("/users", { name: "Aluno", email, role: "aluno", registration: unique("A"), password: "Senha1234" }), 201);

    const res = await request.post("http://localhost:3001/api/auth/login", { data: { email, password: "Senha1234" } });
    expect(res.status()).toBe(403);
    expect((await res.json()).error.code).toBe("ROLE_NOT_ALLOWED");
  });

  test("login com senha errada repetidas vezes é bloqueado com 429", async ({ request }) => {
    const email = `${unique("bf")}@unicap.br`;
    const statuses: number[] = [];
    for (let i = 0; i < 6; i++) {
      const res = await request.post("http://localhost:3001/api/auth/login", { data: { email, password: "errada" } });
      statuses.push(res.status());
    }
    expect(statuses).toEqual([401, 401, 401, 401, 401, 429]);
  });
});
