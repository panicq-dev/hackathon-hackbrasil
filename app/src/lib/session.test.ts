import { describe, it, expect, vi, beforeEach } from "vitest";

const cookieStoreMock = {
  get: vi.fn(),
  set: vi.fn(),
  delete: vi.fn(),
};

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => cookieStoreMock),
}));

import { criarSessao, obterSessao, destruirSessao, exigirSessao } from "./session";

describe("session", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("cria e valida token de sessão de professor", async () => {
    await criarSessao({
      id: 1,
      nome: "Prof. Carlos",
      email: "carlos@escola.com",
      perfil: "professor",
    });

    expect(cookieStoreMock.set).toHaveBeenCalledTimes(1);
    const tokenGerado = cookieStoreMock.set.mock.calls[0][1] as string;
    cookieStoreMock.get.mockReturnValue({ value: tokenGerado });

    const sessao = await obterSessao();
    expect(sessao).toMatchObject({
      id: 1,
      nome: "Prof. Carlos",
      email: "carlos@escola.com",
      perfil: "professor",
    });
  });

  it("rejeita token adulterado ou malformado", async () => {
    cookieStoreMock.get.mockReturnValue({ value: "payload.assinatura_invalida" });
    expect(await obterSessao()).toBeNull();

    cookieStoreMock.get.mockReturnValue({ value: "sem-ponto" });
    expect(await obterSessao()).toBeNull();

    cookieStoreMock.get.mockReturnValue(undefined);
    expect(await obterSessao()).toBeNull();
  });

  it("destruirSessao remove o cookie de sessão", async () => {
    await destruirSessao();
    expect(cookieStoreMock.delete).toHaveBeenCalledWith("hackbrasil_session");
  });

  it("exigirSessao valida autenticação e perfil esperado", async () => {
    cookieStoreMock.get.mockReturnValue(undefined);
    await expect(exigirSessao()).rejects.toThrow(/sessão não encontrada/i);

    await criarSessao({
      id: 2,
      nome: "Aluno Teste",
      email: "aluno@escola.com",
      perfil: "aluno",
    });
    const tokenAluno = cookieStoreMock.set.mock.calls[0][1] as string;
    cookieStoreMock.get.mockReturnValue({ value: tokenAluno });

    await expect(exigirSessao("professor")).rejects.toThrow(/permiss|acesso|professor/i);
    await expect(exigirSessao("aluno")).resolves.toMatchObject({ perfil: "aluno" });
  });
});
