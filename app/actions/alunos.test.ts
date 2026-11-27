import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockExigirSessao,
  mockCarregarDadosTurma,
  mockCalcularEstatisticasAluno,
  mockCriarPromptInsightsAluno,
  mockGroqCreate,
} = vi.hoisted(() => ({
  mockExigirSessao: vi.fn(),
  mockCarregarDadosTurma: vi.fn(),
  mockCalcularEstatisticasAluno: vi.fn(),
  mockCriarPromptInsightsAluno: vi.fn(),
  mockGroqCreate: vi.fn(),
}));

vi.mock("@/app/src/lib/session", () => ({
  exigirSessao: mockExigirSessao,
}));

vi.mock("@/app/src/lib/dadosTurma", () => ({
  carregarDadosTurma: mockCarregarDadosTurma,
}));

vi.mock("@/app/src/lib/estatisticasAluno", () => ({
  calcularDificuldadesTurma: vi.fn(),
  calcularEstatisticasAluno: mockCalcularEstatisticasAluno,
}));

vi.mock("@/app/src/lib/insightsPedagogicos", () => ({
  criarPromptInsightsAluno: mockCriarPromptInsightsAluno,
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

import { gerarInsightsAluno } from "./alunos";

describe("gerarInsightsAluno", () => {
  const groqApiKeyAnterior = process.env.GROQ_API_KEY;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.GROQ_API_KEY = "test-groq-key";
    mockExigirSessao.mockResolvedValue({ id: 10 });
    mockCarregarDadosTurma.mockResolvedValue({
      alunos: [{ id: 20 }],
      avaliacoes: [],
      respostas: [],
    });
    mockCalcularEstatisticasAluno.mockReturnValue({
      totalCampos: 1,
      totalRespondidas: 1,
    });
    mockCriarPromptInsightsAluno.mockReturnValue("evidências do aluno");
    mockGroqCreate.mockResolvedValue({
      choices: [{
        message: {
          content: JSON.stringify({
            resumo: "Retome frações.",
            conteudosParaRetomar: ["Frações"],
            recomendacoesDeEstudo: ["Resolva uma questão sem consultar o exemplo."],
            proximaPratica: "Simplifique 2/4.",
          }),
        },
      }],
    });
  });

  afterEach(() => {
    if (groqApiKeyAnterior === undefined) {
      delete process.env.GROQ_API_KEY;
    } else {
      process.env.GROQ_API_KEY = groqApiKeyAnterior;
    }
  });

  it("solicita insights em JSON pelo Groq e valida o retorno", async () => {
    const resultado = await gerarInsightsAluno("turma-1", 20, 2026, 1);

    expect(resultado.ok).toBe(true);
    expect(resultado.insights?.resumo).toBe("Retome frações.");
    expect(mockGroqCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "openai/gpt-oss-120b",
        response_format: { type: "json_object" },
        reasoning_effort: "low",
        reasoning_format: "hidden",
        max_completion_tokens: 1200,
      }),
    );
  });

  it("tenta novamente se o Groq rejeitar o JSON dos insights", async () => {
    mockGroqCreate.mockRejectedValueOnce({
      status: 400,
      error: { error: { code: "json_validate_failed" } },
    });

    const resultado = await gerarInsightsAluno("turma-1", 20, 2026, 1);

    expect(resultado.ok).toBe(true);
    expect(mockGroqCreate).toHaveBeenCalledTimes(2);
    expect(mockGroqCreate.mock.calls[1][0]).toMatchObject({
      temperature: 0.2,
      max_completion_tokens: 1800,
    });
  });
});
