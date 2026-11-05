import { test, expect } from "@playwright/test";
import { ApiClient, createTechnician, loginAdmin, unique } from "../../support/api";

const today = () => new Date().toISOString().slice(0, 10);

async function newMachine(admin: ApiClient, type: "printer_3d_fdm" | "scanner" = "printer_3d_fdm") {
  const res = await admin.post("/machines", { name: unique("Máquina"), tag: unique("T"), type });
  return (await admin.expectJson<{ machine: { id: string } }>(res, 201)).machine.id;
}

test.describe("Fluxos entre módulos (API)", () => {
  test("estoque: entrada, produção com consumo, relatório e cancelamento que devolve o saldo", async ({ request }) => {
    const admin = await loginAdmin(request);
    const tech = await createTechnician(request);

    const entry = await admin.expectJson<{ supply: { id: string; balance: number } }>(
      await admin.post("/supplies/entries", { name: unique("PLA"), color: "Azul", type: "PLA", quantity: 5, lot: "L-1" }),
      201
    );
    const supplyId = entry.supply.id;
    const machineId = await newMachine(admin);

    const prod = await tech.api.expectJson<{ production: { id: string } }>(
      await tech.api.post("/productions", { type: "impressao_3d", description: "Peça A", machineId, supplyId, supplyConsumed: 2 }),
      201
    );

    const afterUse = await admin.expectJson<{ supply: { balance: number } }>(await admin.get(`/supplies/${supplyId}`), 200);
    expect(afterUse.supply.balance).toBe(3);

    const stock = await admin.expectJson<{ report: Array<{ supplyId: string; totalConsumedKg: number }> }>(
      await admin.get(`/reports/stock-consumption?from=2020-01-01&to=2099-12-31`),
      200
    );
    expect(stock.report.find((r) => r.supplyId === supplyId)?.totalConsumedKg).toBe(2);

    await tech.api.expectJson(await tech.api.post(`/productions/${prod.production.id}/cancel`, { reason: "Erro de impressão" }), 200);

    const restored = await admin.expectJson<{ supply: { balance: number } }>(await admin.get(`/supplies/${supplyId}`), 200);
    expect(restored.supply.balance).toBe(5);

    const stockAfter = await admin.expectJson<{ report: Array<{ supplyId: string; totalConsumedKg: number }> }>(
      await admin.get(`/reports/stock-consumption?from=2020-01-01&to=2099-12-31`),
      200
    );
    expect(stockAfter.report.find((r) => r.supplyId === supplyId)?.totalConsumedKg).toBe(0);
  });

  test("empréstimo: retirada, segunda retirada recusada, devolução libera o equipamento", async ({ request }) => {
    const admin = await loginAdmin(request);
    const equip = await admin.expectJson<{ item: { id: string } }>(
      await admin.post("/equipment", { name: unique("Multímetro"), code: unique("EQ") }),
      201
    );
    const equipmentId = equip.item.id;

    const loan = await admin.expectJson<{ loan: { id: string } }>(
      await admin.post("/loans", { equipmentId, responsibleName: "Aluna E2E", dueDate: "2099-12-01" }),
      201
    );

    const busy = await admin.post("/loans", { equipmentId, responsibleName: "Outra pessoa", dueDate: "2099-12-01" });
    expect(busy.status()).toBe(409);

    const inUse = await admin.expectJson<{ item: { status: string } }>(await admin.get(`/equipment/${equipmentId}`), 200);
    expect(inUse.item.status).toBe("em_campo");

    await admin.expectJson(await admin.post(`/loans/${loan.loan.id}/return`), 200);

    const back = await admin.expectJson<{ item: { status: string } }>(await admin.get(`/equipment/${equipmentId}`), 200);
    expect(back.item.status).toBe("disponivel");
  });

  test("manutenção: máquina em manutenção recusa produção até a conclusão", async ({ request }) => {
    const admin = await loginAdmin(request);
    const tech = await createTechnician(request);
    const machineId = await newMachine(admin);

    const open = await admin.expectJson<{ record: { id: string } }>(
      await admin.post("/maintenances", { machineId, type: "corretiva", status: "em_andamento", date: today(), description: "Bico entupido" }),
      201
    );

    const blocked = await tech.api.post("/productions", { type: "impressao_3d", description: "Durante manutenção", machineId });
    expect(blocked.status()).toBe(400);
    expect((await blocked.json()).error.code).toBe("MACHINE_INACTIVE");

    await admin.expectJson(await admin.patch(`/maintenances/${open.record.id}`, { status: "concluida", cost: 30 }), 200);

    const machine = await admin.expectJson<{ machine: { status: string; lastMaintenance: string } }>(
      await admin.get(`/machines/${machineId}`),
      200
    );
    expect(machine.machine.status).toBe("ativa");
    expect(machine.machine.lastMaintenance).toBe(today());

    await tech.api.expectJson(await tech.api.post("/productions", { type: "impressao_3d", description: "Depois da manutenção", machineId }), 201);
  });

  test("insumo inativo não recebe consumo, mas volta a ser usado quando reativado", async ({ request }) => {
    const admin = await loginAdmin(request);
    const tech = await createTechnician(request);
    const machineId = await newMachine(admin);
    const entry = await admin.expectJson<{ supply: { id: string } }>(
      await admin.post("/supplies/entries", { name: unique("Resina"), color: "Cinza", type: "Resina", quantity: 1, lot: "L-2" }),
      201
    );
    const supplyId = entry.supply.id;

    await admin.expectJson(await admin.patch(`/supplies/${supplyId}`, { active: false }), 200);
    const blocked = await tech.api.post("/productions", { type: "impressao_3d", description: "Insumo parado", machineId, supplyId, supplyConsumed: 0.5 });
    expect(blocked.status()).toBe(409);

    await admin.expectJson(await admin.patch(`/supplies/${supplyId}`, { active: true }), 200);
    await tech.api.expectJson(
      await tech.api.post("/productions", { type: "impressao_3d", description: "Insumo de volta", machineId, supplyId, supplyConsumed: 0.5 }),
      201
    );
  });

  test("relatório de produção por técnico reflete a produção e o agrupamento mensal", async ({ request }) => {
    const admin = await loginAdmin(request);
    const tech = await createTechnician(request);
    const machineId = await newMachine(admin, "scanner");

    await tech.api.expectJson(await tech.api.post("/productions", { type: "escaneamento", description: "Scan 1", machineId }), 201);

    const grouped = await admin.expectJson<{ report: Array<{ technicianId: string; month?: string; totalJobs: number }> }>(
      await admin.get(`/reports/production-by-technician?from=${today()}&to=${today()}&groupBy=month`),
      200
    );
    const row = grouped.report.find((r) => r.technicianId === (tech.id));
    expect(row?.totalJobs).toBe(1);
    expect(row?.month).toBe(today().slice(0, 7));
  });

  test("recuperação de senha: resposta de segurança de uso único", async ({ request }) => {
    const email = `${unique("rec")}@unicap.br`;
    const password = "SenhaInicial1";
    await request.post("http://localhost:3001/api/auth/register", {
      data: { name: "Técnico Rec", email, registration: unique("RC"), password, securityQuestion: "Qual o nome da sua escola?", securityAnswer: "Unicap" },
    }).then((r) => expect(r.status()).toBe(201));

    const verify = await request.post("http://localhost:3001/api/auth/forgot-password/verify-answer", { data: { email, answer: "UNICAP" } });
    const { resetToken } = await verify.json();

    const first = await request.post("http://localhost:3001/api/auth/forgot-password/reset", { data: { email, resetToken, newPassword: "NovaSenha2026" } });
    expect(first.status()).toBe(200);
    const second = await request.post("http://localhost:3001/api/auth/forgot-password/reset", { data: { email, resetToken, newPassword: "OutraSenha2026" } });
    expect(second.status()).toBe(401);

    const login = await request.post("http://localhost:3001/api/auth/login", { data: { email, password: "NovaSenha2026", role: "tecnico" } });
    expect(login.status()).toBe(200);
  });
});
