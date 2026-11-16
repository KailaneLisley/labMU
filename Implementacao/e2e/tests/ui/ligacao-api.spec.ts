import { test, expect } from "@playwright/test";
import { ADMIN, TECH, ApiClient, loginAdmin, unique } from "../../support/api";
import { loginUi } from "../../support/ui";

// As telas leem os dados do servidor: o que foi criado pela API precisa aparecer na interface.
test.describe("Telas ligadas à API", () => {
  test("máquina cadastrada pela API aparece na tela de máquinas", async ({ page, request }) => {
    const admin = await loginAdmin(request);
    const name = unique("Impressora E2E");
    await admin.expectJson(
      await admin.post("/machines", { name, tag: unique("E2E").toUpperCase(), type: "printer_3d_fdm" }),
      201
    );

    await loginUi(page, { ...TECH });
    await page.goto("/maquinas");
    await page.getByPlaceholder("Buscar por código ou modelo...").fill(name);
    await expect(page.getByText(name).first()).toBeVisible();
  });

  test("formulário não cria técnico sem senha inicial", async ({ page, request }) => {
    await loginUi(page, { ...ADMIN });
    await page.goto("/usuarios");
    await page.getByRole("button", { name: "+ Novo Técnico" }).click();

    const suffix = unique("sem-senha");
    await page.getByLabel("Nome completo").fill("Técnico Sem Senha");
    await page.getByLabel("E-mail").fill(`${suffix}@unicap.br`);
    await page.getByLabel("Matrícula / RA").fill(`REG-${suffix}`);
    await page.getByRole("button", { name: "Salvar usuário" }).click();

    // A senha inicial é obrigatória: o formulário não é enviado e continua aberto
    await expect(page.getByRole("button", { name: "Salvar usuário" })).toBeVisible();
    const api = await ApiClient.login(request, ADMIN);
    const users = await api.expectJson<{ data: Array<{ email: string }> }>(await api.get("/users?limit=200"), 200);
    expect(users.data.some((u) => u.email === `${suffix}@unicap.br`)).toBe(false);
  });
});
