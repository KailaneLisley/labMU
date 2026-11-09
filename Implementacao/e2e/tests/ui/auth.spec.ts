import { test, expect } from "@playwright/test";
import { ADMIN, TECH, loginAdmin, unique } from "../../support/api";
import { loginUi, recoverPasswordUi, collectPageErrors } from "../../support/ui";

test.describe("Autenticação (UI + backend real)", () => {
  test("técnico com credenciais válidas chega ao painel", async ({ page }) => {
    const errors = collectPageErrors(page);
    await loginUi(page, { ...TECH });

    await expect(page).toHaveURL(/\/dashboard$/);
    const stored = await page.evaluate(() => sessionStorage.getItem("labmu:session") ?? localStorage.getItem("labmu:session"));
    expect(JSON.parse(stored as string).user.role).toBe("tecnico");
    expect(errors).toEqual([]);
  });

  test("administrador entra pelo perfil de administrador", async ({ page }) => {
    await loginUi(page, { ...ADMIN });
    await expect(page.getByRole("heading", { name: "Dashboard do Administrador" })).toBeVisible();
  });

  test("senha errada mostra erro e mantém na tela de login", async ({ page }) => {
    await page.goto("/login");
    await page.locator("#email").fill(TECH.email);
    await page.locator('input[type="password"]').fill("SenhaErrada1");
    await page.getByRole("button", { name: "Entrar no Sistema" }).click();

    await expect(page.getByText("E-mail ou senha incorretos.")).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
  });

  test("perfil escolhido diferente do cadastrado é recusado", async ({ page }) => {
    await page.goto("/login");
    await page.locator("#email").fill(ADMIN.email);
    await page.locator('input[type="password"]').fill(ADMIN.password);
    await page.getByRole("button", { name: "Entrar no Sistema" }).click();

    await expect(page.getByText("Este usuário não possui o perfil de Técnico.")).toBeVisible();
  });

  test("rota protegida sem sessão volta para o login", async ({ page }) => {
    await page.goto("/usuarios");
    await expect(page).toHaveURL(/\/login$/);
  });

  test("conta de aluno criada pelo administrador não entra no sistema", async ({ request, page }) => {
    const admin = await loginAdmin(request);
    const email = `${unique("aluno")}@unicap.br`;
    const created = await admin.post("/users", {
      name: "Aluno E2E",
      email,
      role: "aluno",
      registration: unique("AL"),
      password: "Senha1234",
    });
    await admin.expectJson(created, 201);

    await page.goto("/login");
    await page.locator("#email").fill(email);
    await page.locator('input[type="password"]').fill("Senha1234");
    await page.getByRole("button", { name: "Entrar no Sistema" }).click();

    await expect(page.getByText("Este perfil não possui acesso ao sistema.")).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
  });

  test("cadastro de técnico cria conta que entra no sistema", async ({ page }) => {
    const email = `${unique("novo")}@unicap.br`;
    const password = "SenhaCadastro1";

    await page.goto("/cadastro");
    await page.locator("#register-name").fill("Técnico Cadastrado E2E");
    await page.locator("#register-email").fill(email);
    await page.locator("#register-id").fill(unique("MAT"));
    await page.locator("#register-password").fill(password);
    await page.locator("#register-confirm-password").fill(password);
    await page.locator("#register-security-question").selectOption("Qual o nome do seu primeiro animal de estimação?");
    await page.locator("#register-security-answer").fill("Totó");
    await page.getByRole("button", { name: "Criar minha conta" }).click();

    await expect(page).toHaveURL(/\/login$/);
    await loginUi(page, { email, password, role: "tecnico" });
  });

  test("técnico recupera a senha pela pergunta de segurança e entra com a nova senha", async ({ page, request }) => {
    // Cadastro público, porque só ele grava pergunta e resposta de segurança
    const email = `${unique("rec")}@unicap.br`;
    const registered = await request.post("http://localhost:3001/api/auth/register", {
      data: {
        name: "Técnico Recuperação",
        email,
        registration: unique("REC"),
        password: "SenhaAntiga1",
        securityQuestion: "Qual o nome do seu primeiro animal de estimação?",
        securityAnswer: "Totó",
      },
    });
    expect(registered.status()).toBe(201);

    await recoverPasswordUi(page, {
      email,
      question: "Qual o nome do seu primeiro animal de estimação?",
      answer: "totó",
      newPassword: "NovaSenha2026",
    });

    await loginUi(page, { email, password: "NovaSenha2026", role: "tecnico" });
  });

  test("administrador que pede recuperação recebe o fluxo comum, sem aviso de restrição", async ({ page }) => {
    await page.goto("/recuperar-senha");
    await page.getByPlaceholder("tecnico.musarq@unicap.br").fill(ADMIN.email);
    await page.getByRole("button", { name: "Continuar" }).click();

    await expect(page.getByText("Etapa 2 de 3: Validação de Segurança")).toBeVisible();
    await expect(page.getByText("Recuperação Restrita para Administradores")).toHaveCount(0);
  });

  test("encerrar sessão no perfil devolve à tela de login e bloqueia o painel", async ({ page }) => {
    await loginUi(page, { ...TECH });
    await page.goto("/perfil");
    await page.getByRole("button", { name: "Encerrar Sessão" }).click();

    await expect(page).toHaveURL(/\/login$/);
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login$/);
  });

  // O botão "Encerrar Sessão" chama POST /auth/logout antes de limpar o armazenamento local.
  test("encerrar sessão revoga o token no servidor", async ({ page }) => {
    await loginUi(page, { ...TECH });
    const token = await page.evaluate(() => {
      const raw = sessionStorage.getItem("labmu:session") ?? localStorage.getItem("labmu:session");
      return JSON.parse(raw as string).token as string;
    });

    await page.goto("/perfil");
    await page.getByRole("button", { name: "Encerrar Sessão" }).click();
    await expect(page).toHaveURL(/\/login$/);

    const me = await page.request.get("http://localhost:3001/api/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(me.status()).toBe(401);
  });
});
