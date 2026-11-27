import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockQuery, mockObterSessao, mockGroqCreate, mockBuscarBanco, mockPublicar } = vi.hoisted(() => ({
  mockQuery: vi.fn(),
  mockObterSessao: vi.fn(),
  mockGroqCreate: vi.fn(),
  mockBuscarBanco: vi.fn(),
  mockPublicar: vi.fn(),
}));

vi.mock("../src/db", () => ({
  pool: { query: mockQuery },
}));

vi.mock("../src/lib/session", () => ({
  obterSessao: mockObterSessao,
}));

vi.mock("./questoes", () => ({
  buscarQuestoesParaReaproveitar: mockBuscarBanco,
  publicarQuestaoComunidade: mockPublicar,
}));

vi.mock("groq-sdk", () => ({
  default: vi.fn(() => ({
    chat: {
      completions: {
        create: mockGroqCreate,
      },
    },
  })),
}));

import { gerarAvaliacao } from "./prompt";

function respostaGroqValida() {
  return {
    choices: [{
      message: {
        content: JSON.stringify({
          questoes: [
            {
              id: "q1",
              enunciado: "Calcule a soma das frações 1/2 + 1/3.",
              camposValidacao: [
                { id: "mmc", label: "MMC", tipo: "numero", respostaCorreta: "6" },
                { id: "soma", label: "Soma", tipo: "texto", respostaCorreta: "5/6" },
              ],
              mapeamentoDeErros: [
                { id: "mmc", erroProvavel: "Soma de Fração" },
                { id: "idQueNaoExiste", erroProvavel: "Porcentagem" },
              ],
            },
          ],
        }),
      },
    }],
  };
}

describe("gerarAvaliacao", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGroqCreate.mockReset();
    mockObterSessao.mockResolvedValue({
      id: 10,
      nome: "Prof. Ana",
      email: "ana@escola.com",
      perfil: "professor",
    });
    mockBuscarBanco.mockResolvedValue([]);
    mockPublicar.mockResolvedValue({ sucesso: true, questaoId: 77 });
    mockQuery.mockResolvedValue({ rows: [{ id: "av-123" }] });
  });

  it("bloqueia geração quando o conteúdo menciona outra matéria", async () => {
    const res = await gerarAvaliacao("Análise sintática de Português", "", 5);
    expect(res).toBeNull();
    expect(mockGroqCreate).not.toHaveBeenCalled();
  });

  it("bloqueia geração quando materiaTag não é Matemática", async () => {
    const res = await gerarAvaliacao("Funções", "", 5, undefined, {
      materiaTag: "História",
    });
    expect(res).toBeNull();
    expect(mockGroqCreate).not.toHaveBeenCalled();
  });

  it("bloqueia geração para perfil aluno", async () => {
    mockObterSessao.mockResolvedValue({
      id: 20,
      nome: "Aluno",
      email: "aluno@escola.com",
      perfil: "aluno",
    });
    const res = await gerarAvaliacao("Equação de 2º Grau", "", 5);
    expect(res).toBeNull();
  });

  it("gera questões via Groq, normaliza causas raiz e salva no banco", async () => {
    mockGroqCreate.mockResolvedValue(respostaGroqValida());

    const res = await gerarAvaliacao("Frações", "Estilo vestibular", 1, "T1", {
      usarBancoComunidade: false,
      publicarNovasQuestoes: true,
    });

    expect(res).not.toBeNull();
    expect(res!.id).toBe("av-123");
    expect(mockGroqCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "openai/gpt-oss-120b",
        response_format: { type: "json_object" },
      }),
    );
    expect(res!.questoes[0].mapeamentoDeErros).toEqual([
      { id: "mmc", erroProvavel: "Soma de Frações" },
      { id: "soma", erroProvavel: "Interpretação de Enunciado" },
    ]);
    expect(mockPublicar).toHaveBeenCalledWith(expect.any(Object), "Matemática");
  });

  it("tenta uma vez novamente quando o Groq rejeita o JSON", async () => {
    mockGroqCreate
      .mockRejectedValueOnce({
        status: 400,
        error: { error: { code: "json_validate_failed" } },
      })
      .mockResolvedValueOnce(respostaGroqValida());

    const res = await gerarAvaliacao("Frações", "Estilo vestibular", 1, "T1", {
      usarBancoComunidade: false,
    });

    expect(res).not.toBeNull();
    expect(mockGroqCreate).toHaveBeenCalledTimes(2);
    expect(mockGroqCreate.mock.calls[1][0]).toMatchObject({
      temperature: 0.1,
      messages: expect.arrayContaining([
        expect.objectContaining({
          role: "system",
          content: expect.stringContaining("JSON estava malformado"),
        }),
      ]),
    });
  });
});
