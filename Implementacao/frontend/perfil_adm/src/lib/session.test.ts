import { describe, it, expect } from "vitest";
import { getSession, saveSession, clearSession } from "./session";

const session = { token: "abc", user: { name: "Técnico", email: "t@unicap.br", role: "tecnico" as const } };

describe("session", () => {
  it("guarda em localStorage quando 'lembrar de mim' está marcado", () => {
    saveSession(session, true);

    expect(localStorage.getItem("labmu:session")).not.toBeNull();
    expect(sessionStorage.getItem("labmu:session")).toBeNull();
    expect(getSession()).toEqual(session);
  });

  it("guarda em sessionStorage quando 'lembrar de mim' não está marcado", () => {
    saveSession(session, false);

    expect(sessionStorage.getItem("labmu:session")).not.toBeNull();
    expect(localStorage.getItem("labmu:session")).toBeNull();
  });

  it("não aceita perfil fora de administrador e técnico", () => {
    sessionStorage.setItem(
      "labmu:session",
      JSON.stringify({ token: "x", user: { name: "Aluno", email: "a@unicap.br", role: "aluno" } })
    );

    expect(getSession()).toBeNull();
  });

  it("descarta sessão corrompida sem lançar erro", () => {
    localStorage.setItem("labmu:session", "{não é json");

    expect(getSession()).toBeNull();
    expect(localStorage.getItem("labmu:session")).toBeNull();
  });

  it("clearSession remove a sessão dos dois armazenamentos", () => {
    saveSession(session, true);
    clearSession();

    expect(getSession()).toBeNull();
  });
});
