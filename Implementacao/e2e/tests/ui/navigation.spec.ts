import { test, expect } from "@playwright/test";
import { TECH } from "../../support/api";
import { loginUi, collectPageErrors } from "../../support/ui";

// Todas as telas protegidas. Algumas leem dados locais (localStorage), não a API: aqui
// verificamos que cada tela abre, mostra seu título e não quebra a aplicação.
const SCREENS: Array<{ path: string; heading: RegExp }> = [
  { path: "/dashboard", heading: /Dashboard/ },
  { path: "/usuarios", heading: /Gestão de Usuários/ },
  { path: "/maquinas", heading: /./ },
  { path: "/manutencao", heading: /Manutenç/ },
  { path: "/estoque", heading: /Estoque/ },
  { path: "/estoque/registrar-entrada", heading: /./ },
  { path: "/emprestimo", heading: /Empréstimos/ },
  { path: "/emprestimo/registrar", heading: /Registrar Equipamento/ },
  { path: "/relatorios", heading: /Relatórios/ },
  { path: "/perfil", heading: /Meu Perfil/ },
  { path: "/editar-perfil", heading: /Editar Perfil/ },
];

test.describe("Telas protegidas (UI)", () => {
  test("todas as telas abrem para o técnico, sem erro de aplicação", async ({ page }) => {
    const errors = collectPageErrors(page);
    await loginUi(page, { ...TECH });

    for (const screen of SCREENS) {
      await page.goto(screen.path);
      await expect(page, `${screen.path} não deve redirecionar para o login`).not.toHaveURL(/\/login$/);
      await expect(page.locator("h1").filter({ hasText: screen.heading }).first(), `título de ${screen.path}`).toBeVisible();
    }

    expect(errors, "erros não tratados na aplicação").toEqual([]);
  });

  test("menu lateral leva a cada tela principal", async ({ page }) => {
    await loginUi(page, { ...TECH });

    const items: Array<{ label: string; path: string }> = [
      { label: "Gestão de Usuários", path: "/usuarios" },
      { label: "Máquinas", path: "/maquinas" },
      { label: "Manutenção", path: "/manutencao" },
      { label: "Estoque e Suprimentos", path: "/estoque" },
      { label: "Empréstimo", path: "/emprestimo" },
      { label: "Relatórios Gerenciais", path: "/relatorios" },
      { label: "Dashboard", path: "/dashboard" },
    ];

    for (const item of items) {
      await page.getByRole("button", { name: item.label, exact: true }).click();
      await expect(page).toHaveURL(new RegExp(`${item.path}$`));
    }
  });

  test("rota inexistente redireciona para o painel", async ({ page }) => {
    await loginUi(page, { ...TECH });
    await page.goto("/rota-que-nao-existe");
    await expect(page).toHaveURL(/\/dashboard$/);
  });
});
