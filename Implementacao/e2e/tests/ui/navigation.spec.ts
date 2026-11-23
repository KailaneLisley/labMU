import { test, expect } from "@playwright/test";
import { ADMIN, TECH } from "../../support/api";
import { loginUi, collectPageErrors } from "../../support/ui";

// Telas que devem abrir para cada perfil (título usado como senha de que a tela carregou)
const ADMIN_SCREENS: Array<{ path: string; heading: RegExp }> = [
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

const TECH_SCREENS: Array<{ path: string; heading: RegExp }> = [
  { path: "/maquinas", heading: /./ },
  { path: "/manutencao", heading: /Manutenç/ },
  { path: "/estoque", heading: /Estoque/ },
  { path: "/estoque/registrar-entrada", heading: /./ },
  { path: "/perfil", heading: /Meu Perfil/ },
  { path: "/editar-perfil", heading: /Editar Perfil/ },
];

const ADMIN_ONLY_PATHS = ["/dashboard", "/usuarios", "/emprestimo", "/emprestimo/registrar", "/relatorios"];

test.describe("Telas protegidas (UI)", () => {
  test("todas as telas abrem para o administrador, sem erro de aplicação", async ({ page }) => {
    const errors = collectPageErrors(page);
    await loginUi(page, { ...ADMIN });

    for (const screen of ADMIN_SCREENS) {
      await page.goto(screen.path);
      await expect(page, `${screen.path} não deve redirecionar para o login`).not.toHaveURL(/\/login$/);
      await expect(page.locator("h1").filter({ hasText: screen.heading }).first(), `título de ${screen.path}`).toBeVisible();
    }

    expect(errors, "erros não tratados na aplicação").toEqual([]);
  });

  test("técnico abre somente máquinas, manutenção e estoque, sem erro de aplicação", async ({ page }) => {
    const errors = collectPageErrors(page);
    await loginUi(page, { ...TECH });

    for (const screen of TECH_SCREENS) {
      await page.goto(screen.path);
      await expect(page, `${screen.path} não deve redirecionar para o login`).not.toHaveURL(/\/login$/);
      await expect(page.locator("h1").filter({ hasText: screen.heading }).first(), `título de ${screen.path}`).toBeVisible();
    }

    expect(errors, "erros não tratados na aplicação").toEqual([]);
  });

  test("técnico é redirecionado para máquinas ao abrir tela de administrador", async ({ page }) => {
    await loginUi(page, { ...TECH });

    for (const path of ADMIN_ONLY_PATHS) {
      await page.goto(path);
      await expect(page, path).toHaveURL(/\/maquinas$/);
    }
  });

  test("menu lateral do técnico mostra só as telas permitidas", async ({ page }) => {
    await loginUi(page, { ...TECH });
    for (const label of ["Máquinas", "Manutenção", "Estoque e Suprimentos"]) {
      await expect(page.getByRole("button", { name: label, exact: true })).toBeVisible();
    }
    for (const label of ["Dashboard", "Gestão de Usuários", "Empréstimo", "Relatórios Gerenciais"]) {
      await expect(page.getByRole("button", { name: label, exact: true }), label).toHaveCount(0);
    }
  });

  test("menu lateral do administrador leva a todas as telas", async ({ page }) => {
    await loginUi(page, { ...ADMIN });
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

  test("rota inexistente redireciona para a tela inicial do perfil", async ({ page }) => {
    await loginUi(page, { ...TECH });
    await page.goto("/rota-que-nao-existe");
    await expect(page).toHaveURL(/\/maquinas$/);
  });
});
