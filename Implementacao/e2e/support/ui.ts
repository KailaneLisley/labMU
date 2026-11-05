import { expect, Page } from "@playwright/test";

type Role = "administrador" | "tecnico";

// Entra pela tela de login, como o usuário faria
export async function loginUi(page: Page, account: { email: string; password: string; role: Role }) {
  await page.goto("/login");
  if (account.role === "administrador") {
    // O input de rádio é invisível; o clique vai no rótulo que o contém
    await page.locator('label:has(input[name="role"][value="administrador"])').click();
  }
  await page.locator("#email").fill(account.email);
  await page.locator('input[type="password"]').fill(account.password);
  await page.getByRole("button", { name: "Entrar no Sistema" }).click();
  await page.waitForURL("**/dashboard");
}

// Fluxo de recuperação completo, pela tela de recuperação de senha
export async function recoverPasswordUi(
  page: Page,
  input: { email: string; question: string; answer: string; newPassword: string }
) {
  await page.goto("/recuperar-senha");
  await page.getByPlaceholder("tecnico.musarq@unicap.br").fill(input.email);
  await page.getByRole("button", { name: "Continuar" }).click();
  await expect(page.getByText(input.question)).toBeVisible();

  await page.getByPlaceholder("Digite a resposta correta").fill(input.answer);
  await page.getByRole("button", { name: "Confirmar Resposta" }).click();

  await page.getByPlaceholder("Mínimo 8 caracteres (letras e números)").fill(input.newPassword);
  await page.getByPlaceholder("Repita a nova senha").fill(input.newPassword);
  await page.getByRole("button", { name: "Salvar Nova Senha" }).click();
  await expect(page.getByText("Recuperação Concluída")).toBeVisible();
}

// Erros de página (exceções não tratadas) durante a navegação
export function collectPageErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("pageerror", (err) => errors.push(err.message));
  return errors;
}
