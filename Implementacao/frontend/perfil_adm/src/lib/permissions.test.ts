import { describe, it, expect } from "vitest";
import { canAccessPath, getHomePath } from "./permissions";

describe("permissões por perfil", () => {
  it("define a tela inicial de cada perfil", () => {
    expect(getHomePath("administrador")).toBe("/dashboard");
    expect(getHomePath("tecnico")).toBe("/maquinas");
  });

  it("técnico acessa apenas máquinas, manutenção, estoque e perfil", () => {
    for (const path of ["/maquinas", "/manutencao", "/estoque", "/estoque/registrar-entrada", "/perfil", "/editar-perfil"]) {
      expect(canAccessPath(path, "tecnico"), path).toBe(true);
    }
    for (const path of ["/dashboard", "/usuarios", "/emprestimo", "/emprestimo/registrar", "/relatorios"]) {
      expect(canAccessPath(path, "tecnico"), path).toBe(false);
    }
  });

  it("administrador acessa todas as telas", () => {
    for (const path of ["/dashboard", "/usuarios", "/maquinas", "/manutencao", "/estoque", "/emprestimo", "/relatorios", "/perfil"]) {
      expect(canAccessPath(path, "administrador"), path).toBe(true);
    }
  });

  it("sem sessão, nenhuma tela é permitida", () => {
    expect(canAccessPath("/maquinas", null)).toBe(false);
    expect(getHomePath(null)).toBe("/login");
  });
});
