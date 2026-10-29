import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { ForgotPasswordPage } from "./ForgotPasswordPage";
import { api } from "../../services/api";

const FUTURE_FLAGS = { v7_startTransition: true, v7_relativeSplatPath: true };
const QUESTION = "Qual o nome do seu primeiro animal de estimação?";

function renderPage() {
  const view = render(
    <MemoryRouter future={FUTURE_FLAGS}>
      <ForgotPasswordPage />
    </MemoryRouter>
  );
  return {
    ...view,
    email: () => screen.getByPlaceholderText("tecnico.musarq@unicap.br") as HTMLInputElement,
    continueButton: () => screen.getByRole("button", { name: "Continuar" }),
    answer: () => screen.getByPlaceholderText("Digite a resposta correta") as HTMLInputElement,
    confirmAnswer: () => screen.getByRole("button", { name: "Confirmar Resposta" }),
    newPassword: () => screen.getByPlaceholderText("Mínimo 8 caracteres (letras e números)") as HTMLInputElement,
    repeatPassword: () => screen.getByPlaceholderText("Repita a nova senha") as HTMLInputElement,
  };
}

describe("ForgotPasswordPage", () => {
  it("recusa e-mail que não é institucional sem chamar a API", async () => {
    const verify = vi.spyOn(api, "verifyForgotEmail");
    const page = renderPage();

    await userEvent.type(page.email(), "tecnico@gmail.com");
    fireEvent.click(page.continueButton());

    expect(await screen.findByText("Use seu e-mail institucional (@unicap.br).")).toBeTruthy();
    expect(verify).not.toHaveBeenCalled();
  });

  it("mostra a pergunta de segurança devolvida pela API", async () => {
    vi.spyOn(api, "verifyForgotEmail").mockResolvedValue({ email: "tecnico.musarq@unicap.br", question: QUESTION });
    const page = renderPage();

    await userEvent.type(page.email(), "tecnico.musarq@unicap.br");
    fireEvent.click(page.continueButton());

    expect(await screen.findByText(QUESTION)).toBeTruthy();
    expect(screen.getByText("Etapa 2 de 3: Validação de Segurança")).toBeTruthy();
  });

  it("mostra a mensagem de erro da API ao verificar o e-mail", async () => {
    vi.spyOn(api, "verifyForgotEmail").mockRejectedValue(new Error("E-mail não encontrado no sistema."));
    const page = renderPage();

    await userEvent.type(page.email(), "ninguem@unicap.br");
    fireEvent.click(page.continueButton());

    expect(await screen.findByText("E-mail não encontrado no sistema.")).toBeTruthy();
  });

  it("não deixa avançar com resposta incorreta e mostra o erro da API", async () => {
    vi.spyOn(api, "verifyForgotEmail").mockResolvedValue({ email: "tecnico.musarq@unicap.br", question: QUESTION });
    const verifyAnswer = vi
      .spyOn(api, "verifyForgotAnswer")
      .mockRejectedValue(new Error("Resposta de segurança incorreta. Tente novamente."));
    const page = renderPage();

    await userEvent.type(page.email(), "tecnico.musarq@unicap.br");
    fireEvent.click(page.continueButton());
    await screen.findByText(QUESTION);

    await userEvent.type(page.answer(), "Errada");
    fireEvent.click(page.confirmAnswer());

    expect(await screen.findByText("Resposta de segurança incorreta. Tente novamente.")).toBeTruthy();
    expect(verifyAnswer).toHaveBeenCalledWith("tecnico.musarq@unicap.br", "Errada");
    expect(screen.queryByText("Etapa 3 de 3: Definição da Nova Senha")).toBeNull();
  });

  it("recusa senhas que não conferem antes de chamar a API", async () => {
    vi.spyOn(api, "verifyForgotEmail").mockResolvedValue({ email: "tecnico.musarq@unicap.br", question: QUESTION });
    vi.spyOn(api, "verifyForgotAnswer").mockResolvedValue({ verified: true, resetToken: "tok" });
    const reset = vi.spyOn(api, "resetPassword");
    const page = renderPage();

    await userEvent.type(page.email(), "tecnico.musarq@unicap.br");
    fireEvent.click(page.continueButton());
    await screen.findByText(QUESTION);
    await userEvent.type(page.answer(), "Rex");
    fireEvent.click(page.confirmAnswer());

    await screen.findByText("Etapa 3 de 3: Definição da Nova Senha");
    await userEvent.type(page.newPassword(), "NovaSenha@2026");
    await userEvent.type(page.repeatPassword(), "OutraSenha@2026");
    fireEvent.click(screen.getByRole("button", { name: /Salvar Nova Senha/ }));

    expect(await screen.findByText("As senhas não conferem.")).toBeTruthy();
    expect(reset).not.toHaveBeenCalled();
  });

  it("fluxo completo: e-mail, resposta, nova senha e conclusão", async () => {
    vi.spyOn(api, "verifyForgotEmail").mockResolvedValue({ email: "tecnico.musarq@unicap.br", question: QUESTION });
    vi.spyOn(api, "verifyForgotAnswer").mockResolvedValue({ verified: true, resetToken: "token-reset" });
    const reset = vi.spyOn(api, "resetPassword").mockResolvedValue({ message: "ok" });
    const page = renderPage();

    await userEvent.type(page.email(), "tecnico.musarq@unicap.br");
    fireEvent.click(page.continueButton());
    await screen.findByText(QUESTION);

    await userEvent.type(page.answer(), "Rex");
    fireEvent.click(page.confirmAnswer());
    await screen.findByText("Etapa 3 de 3: Definição da Nova Senha");

    await userEvent.type(page.newPassword(), "NovaSenha@2026");
    await userEvent.type(page.repeatPassword(), "NovaSenha@2026");
    fireEvent.click(screen.getByRole("button", { name: /Salvar Nova Senha/ }));

    await waitFor(() => expect(reset).toHaveBeenCalled());
    expect(reset.mock.calls[0][0]).toEqual({
      email: "tecnico.musarq@unicap.br",
      resetToken: "token-reset",
      newPassword: "NovaSenha@2026",
    });
    expect(await screen.findByText("Recuperação Concluída")).toBeTruthy();
  });
});

describe("ForgotPasswordPage: administrador", () => {
  // Desde a correção S6 do backend, o administrador recebe a mesma pergunta-isca de qualquer conta
  // que não é técnico. A tela não tem mais aviso específico para administrador.
  it("segue o fluxo normal e não mostra aviso de recuperação restrita", async () => {
    vi.spyOn(api, "verifyForgotEmail").mockResolvedValue({ email: "admin.musarq@unicap.br", question: QUESTION });
    const page = renderPage();

    await userEvent.type(page.email(), "admin.musarq@unicap.br");
    fireEvent.click(page.continueButton());

    expect(await screen.findByText(QUESTION)).toBeTruthy();
    expect(screen.queryByText("Recuperação Restrita para Administradores")).toBeNull();
  });

  it("mostra a mensagem da API quando a resposta do administrador é recusada", async () => {
    vi.spyOn(api, "verifyForgotEmail").mockResolvedValue({ email: "admin.musarq@unicap.br", question: QUESTION });
    vi.spyOn(api, "verifyForgotAnswer").mockRejectedValue(
      new Error("Resposta de segurança incorreta. Tente novamente.")
    );
    const page = renderPage();

    await userEvent.type(page.email(), "admin.musarq@unicap.br");
    fireEvent.click(page.continueButton());
    await screen.findByText(QUESTION);
    await userEvent.type(page.answer(), "qualquer");
    fireEvent.click(page.confirmAnswer());

    expect(await screen.findByText("Resposta de segurança incorreta. Tente novamente.")).toBeTruthy();
  });
});
