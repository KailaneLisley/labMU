import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { LoginPage } from "./LoginPage";
import { api } from "../../services/api";

function renderLogin() {
  const view = render(
    <MemoryRouter
      initialEntries={["/login"]}
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={<p>PAINEL</p>} />
      </Routes>
    </MemoryRouter>
  );
  return {
    ...view,
    email: () => screen.getByPlaceholderText("tecnico.musarq@unicap.br") as HTMLInputElement,
    password: () => view.container.querySelector('input[type="password"]') as HTMLInputElement,
    submit: () => screen.getByRole("button", { name: /Entrar no Sistema/ }),
    roleRadio: (role: "tecnico" | "administrador") =>
      view.container.querySelector(`input[name="role"][value="${role}"]`) as HTMLInputElement,
  };
}

const TECH_SESSION = { token: "jwt-real", user: { name: "Técnico MUSARQ", email: "tecnico.musarq@unicap.br", role: "tecnico" } };

afterEach(() => {
  vi.restoreAllMocks();
});

describe("LoginPage: validação do formulário", () => {
  it("exige o e-mail antes de chamar a API", async () => {
    const login = vi.spyOn(api, "login");
    const page = renderLogin();

    await userEvent.type(page.password(), "Tecnico@123");
    fireEvent.click(page.submit());

    expect(await screen.findByText("Informe seu e-mail institucional.")).toBeTruthy();
    expect(login).not.toHaveBeenCalled();
  });

  it("recusa e-mail fora do domínio institucional", async () => {
    const login = vi.spyOn(api, "login");
    const page = renderLogin();

    await userEvent.type(page.email(), "pessoa@gmail.com");
    await userEvent.type(page.password(), "Tecnico@123");
    fireEvent.click(page.submit());

    expect(await screen.findByText(/Use seu e-mail institucional/)).toBeTruthy();
    expect(login).not.toHaveBeenCalled();
  });

  it("recusa senha vazia", async () => {
    const page = renderLogin();

    await userEvent.type(page.email(), "tecnico.musarq@unicap.br");
    fireEvent.click(page.submit());

    expect(await screen.findByText("Informe sua senha.")).toBeTruthy();
  });
});

describe("LoginPage: autenticação pela API", () => {
  it("grava a sessão e vai para o painel quando a API aceita", async () => {
    vi.spyOn(api, "login").mockResolvedValue({ token: TECH_SESSION.token, user: TECH_SESSION.user });
    const page = renderLogin();

    await userEvent.type(page.email(), "tecnico.musarq@unicap.br");
    await userEvent.type(page.password(), "Tecnico@123");
    fireEvent.click(page.submit());

    expect(await screen.findByText("PAINEL", {}, { timeout: 3000 })).toBeTruthy();
    expect(JSON.parse(sessionStorage.getItem("labmu:session") as string).token).toBe("jwt-real");
  });

  it("envia o perfil escolhido junto com as credenciais", async () => {
    const login = vi.spyOn(api, "login").mockRejectedValue(new Error("E-mail ou senha incorretos."));
    const page = renderLogin();

    fireEvent.click(page.roleRadio("administrador"));
    await userEvent.type(page.email(), "admin.musarq@unicap.br");
    await userEvent.type(page.password(), "Admin@123");
    fireEvent.click(page.submit());

    await waitFor(() => expect(login).toHaveBeenCalled());
    expect(login.mock.calls[0][0]).toEqual({
      email: "admin.musarq@unicap.br",
      password: "Admin@123",
      role: "administrador",
    });
  });

  it("mostra o erro devolvido pela API e limpa a senha", async () => {
    vi.spyOn(api, "login").mockRejectedValue(new Error("Este usuário não possui o perfil de Técnico."));
    const page = renderLogin();

    await userEvent.type(page.email(), "tecnico.musarq@unicap.br");
    await userEvent.type(page.password(), "Tecnico@123");
    fireEvent.click(page.submit());

    expect(await screen.findByText("Este usuário não possui o perfil de Técnico.")).toBeTruthy();
    expect(page.password().value).toBe("");
    expect(sessionStorage.getItem("labmu:session")).toBeNull();
  });

  it("mostra o bloqueio por excesso de tentativas", async () => {
    vi.spyOn(api, "login").mockRejectedValue(
      new Error("Muitas tentativas de login. Aguarde 15 minutos e tente novamente.")
    );
    const page = renderLogin();

    await userEvent.type(page.email(), "tecnico.musarq@unicap.br");
    await userEvent.type(page.password(), "Tecnico@123");
    fireEvent.click(page.submit());

    expect(await screen.findByText(/Muitas tentativas de login/)).toBeTruthy();
  });
});

describe("LoginPage: segurança", () => {
  // F3 do relatório: com o servidor fora do ar, a tela aceita as credenciais fixas do código.
  // O teste está marcado como "falha esperada": quando o fallback for removido, ele passa a falhar
  // e deve ser trocado por um teste normal.
  it.fails("F3: sem servidor, não aceita credenciais fixas do código", async () => {
    vi.spyOn(api, "login").mockRejectedValue(new Error("Não foi possível conectar ao servidor do labMU."));
    const page = renderLogin();

    fireEvent.click(page.roleRadio("administrador"));
    await userEvent.type(page.email(), "admin.musarq@unicap.br");
    await userEvent.type(page.password(), "Admin@123");
    fireEvent.click(page.submit());

    // Espera o fluxo de fallback terminar (atraso simulado de 500 ms + redirecionamento de 600 ms)
    await new Promise((resolve) => setTimeout(resolve, 1500));
    expect(screen.queryByText("PAINEL")).toBeNull();
  });
});
