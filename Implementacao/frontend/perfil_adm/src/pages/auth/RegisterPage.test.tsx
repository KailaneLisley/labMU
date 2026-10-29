import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { RegisterPage } from "./RegisterPage";
import { api } from "../../services/api";
import { ACCOUNTS_STORAGE_KEY } from "../../lib/accounts";

const FUTURE_FLAGS = { v7_startTransition: true, v7_relativeSplatPath: true };
const PASSWORD = "SenhaForte@123";

function renderRegister() {
  const view = render(
    <MemoryRouter initialEntries={["/cadastro"]} future={FUTURE_FLAGS}>
      <Routes>
        <Route path="/cadastro" element={<RegisterPage />} />
        <Route path="/login" element={<p>TELA_LOGIN</p>} />
      </Routes>
    </MemoryRouter>
  );
  const byId = (id: string) => view.container.querySelector(`#${id}`) as HTMLInputElement;
  return {
    ...view,
    name: () => byId("register-name"),
    email: () => byId("register-email"),
    registration: () => byId("register-id"),
    password: () => byId("register-password"),
    confirm: () => byId("register-confirm-password"),
    question: () => byId("register-security-question") as unknown as HTMLSelectElement,
    answer: () => byId("register-security-answer"),
    submit: () => screen.getByRole("button", { name: "Criar minha conta" }),
  };
}

async function fillValid(page: ReturnType<typeof renderRegister>, overrides: Partial<Record<string, string>> = {}) {
  const values = {
    name: "Maria Técnica",
    email: "maria.tecnica@unicap.br",
    registration: "2019123",
    password: PASSWORD,
    confirm: PASSWORD,
    answer: "Totó",
    ...overrides,
  };
  await userEvent.type(page.name(), values.name);
  await userEvent.type(page.email(), values.email);
  await userEvent.type(page.registration(), values.registration);
  await userEvent.type(page.password(), values.password);
  await userEvent.type(page.confirm(), values.confirm);
  fireEvent.change(page.question(), { target: { value: "Qual o nome do seu primeiro animal de estimação?" } });
  await userEvent.type(page.answer(), values.answer);
}

describe("RegisterPage: validação", () => {
  it("exige e-mail institucional", async () => {
    const register = vi.spyOn(api, "register");
    const page = renderRegister();

    await fillValid(page, { email: "maria@gmail.com" });
    fireEvent.click(page.submit());

    expect(await screen.findByText("Use um e-mail institucional no formato nome@unicap.br.")).toBeTruthy();
    expect(register).not.toHaveBeenCalled();
  });

  it("exige letra e número na senha", async () => {
    const register = vi.spyOn(api, "register");
    const page = renderRegister();

    await fillValid(page, { password: "somentetexto", confirm: "somentetexto" });
    fireEvent.click(page.submit());

    expect(await screen.findByText("A senha deve conter pelo menos uma letra e um número.")).toBeTruthy();
    expect(register).not.toHaveBeenCalled();
  });

  it("recusa confirmação de senha diferente", async () => {
    const register = vi.spyOn(api, "register");
    const page = renderRegister();

    await fillValid(page, { confirm: "OutraSenha@123" });
    fireEvent.click(page.submit());

    expect(await screen.findByText("As senhas não conferem.")).toBeTruthy();
    expect(register).not.toHaveBeenCalled();
  });
});

describe("RegisterPage: envio", () => {
  it("cria a conta pela API e vai para o login", async () => {
    const register = vi.spyOn(api, "register").mockResolvedValue({ token: "t", user: {} });
    const page = renderRegister();

    await fillValid(page);
    fireEvent.click(page.submit());

    expect(await screen.findByText("TELA_LOGIN", {}, { timeout: 3000 })).toBeTruthy();
    expect(register.mock.calls[0][0]).toMatchObject({
      email: "maria.tecnica@unicap.br",
      registration: "2019123",
      securityQuestion: "Qual o nome do seu primeiro animal de estimação?",
      securityAnswer: "Totó",
    });
  });

  it("mostra o erro devolvido pela API, como e-mail já cadastrado", async () => {
    vi.spyOn(api, "register").mockRejectedValue(new Error("Este e-mail já possui um cadastro ativo."));
    const page = renderRegister();

    await fillValid(page);
    fireEvent.click(page.submit());

    expect(await screen.findByText("Este e-mail já possui um cadastro ativo.")).toBeTruthy();
    expect(screen.queryByText("TELA_LOGIN")).toBeNull();
  });
});

describe("RegisterPage: segurança", () => {
  // F2 do relatório: sem servidor, o cadastro local grava a senha em texto puro no localStorage.
  // Marcado como "falha esperada" até o cadastro offline deixar de guardar a senha.
  it.fails("F2: sem servidor, a senha não é gravada em texto puro", async () => {
    vi.spyOn(api, "register").mockRejectedValue(new Error("Não foi possível conectar ao servidor do labMU."));
    const page = renderRegister();

    await fillValid(page);
    fireEvent.click(page.submit());

    await new Promise((resolve) => setTimeout(resolve, 800));
    const stored = localStorage.getItem(ACCOUNTS_STORAGE_KEY) ?? "";
    expect(stored.includes(PASSWORD)).toBe(false);
  });
});
