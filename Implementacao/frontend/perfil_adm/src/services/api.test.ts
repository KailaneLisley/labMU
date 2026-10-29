import { describe, it, expect, vi, beforeEach } from "vitest";
import { api } from "./api";
import { saveSession } from "../lib/session";

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

describe("api: requisições", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, { ok: true }));
    vi.stubGlobal("fetch", fetchMock);
  });

  it("envia o login como JSON para /api/auth/login", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(200, { token: "t", user: {} }));

    await api.login({ email: "tecnico.musarq@unicap.br", password: "Tecnico@123", role: "tecnico" });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/auth/login");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body)).toEqual({
      email: "tecnico.musarq@unicap.br",
      password: "Tecnico@123",
      role: "tecnico",
    });
  });

  it("anexa o token da sessão salva no cabeçalho Authorization", async () => {
    saveSession({ token: "token-da-sessao", user: { name: "Técnico", email: "t@unicap.br", role: "tecnico" } }, true);

    await api.getMe();

    const [, init] = fetchMock.mock.calls[0];
    expect(init.headers.Authorization).toBe("Bearer token-da-sessao");
  });

  it("não envia Authorization sem sessão", async () => {
    await api.getMe();

    const [, init] = fetchMock.mock.calls[0];
    expect(init.headers.Authorization).toBeUndefined();
  });

  it("monta a query string de listagens sem parâmetros vazios", async () => {
    await api.getMachines({ type: "scanner", q: "" });

    expect(fetchMock.mock.calls[0][0]).toBe("/api/machines?type=scanner");
  });

  it("usa a mensagem de erro devolvida pela API", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse(400, { error: { code: "INCORRECT_ANSWER", message: "Resposta de segurança incorreta." } })
    );

    await expect(api.verifyForgotAnswer("t@unicap.br", "x")).rejects.toThrow("Resposta de segurança incorreta.");
  });

  it("traduz 401 e 403 sem mensagem da API para textos padrão", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(401, {}));
    await expect(api.getMe()).rejects.toThrow("Sessão expirada ou credenciais inválidas.");

    fetchMock.mockResolvedValueOnce(jsonResponse(403, {}));
    await expect(api.getMe()).rejects.toThrow("Você não possui permissão para executar esta ação.");
  });

  it("informa falha de conexão quando o servidor não responde", async () => {
    fetchMock.mockRejectedValueOnce(new TypeError("Failed to fetch"));

    await expect(api.getMe()).rejects.toThrow("Não foi possível conectar ao servidor do labMU.");
  });

  it("logout não falha mesmo se o servidor estiver fora", async () => {
    fetchMock.mockRejectedValueOnce(new TypeError("Failed to fetch"));

    await expect(api.logout()).resolves.toBeNull();
  });
});
