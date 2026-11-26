import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockQuery } = vi.hoisted(() => ({
  mockQuery: vi.fn(),
}));

vi.mock("@/app/src/db", () => ({
  pool: { query: mockQuery },
}));

import { carregarDadosTurma } from "./dadosTurma";

describe("carregarDadosTurma", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejeita parâmetros inválidos antes de consultar o banco", async () => {
    await expect(carregarDadosTurma(0.5, "turma-1", 2026, null)).resolves.toBeNull();
    await expect(carregarDadosTurma(1, "  ", 2026, null)).resolves.toBeNull();
    await expect(carregarDadosTurma(1, "turma-1", 1999, null)).rejects.toThrow(
      "Ano letivo inválido."
    );
    await expect(carregarDadosTurma(1, "turma-1", 2026, 5)).rejects.toThrow(
      "Bimestre inválido."
    );
    expect(mockQuery).not.toHaveBeenCalled();
  });

  it("retorna null quando a turma não existe ou não pertence ao professor", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    await expect(carregarDadosTurma(1, "turma-1", 2026, null)).resolves.toBeNull();
    expect(mockQuery).toHaveBeenCalledTimes(1);
  });

  it("normaliza e filtra dados por ano e bimestre, preservando respostas vazias", async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ id: "turma-1", nome: "Matemática" }] })
      .mockResolvedValueOnce({
        rows: [{ id: 8, nome: "Ana", matricula: "A8" }],
      })
      .mockResolvedValueOnce({
        rows: [
          {
            id: "av-mar",
            criado_em: "2026-03-10T12:00:00.000Z",
            conteudo: JSON.stringify({ questoes: [{ enunciado: "questão" }] }),
          },
          {
            id: "av-abr",
            criado_em: "2026-04-10T12:00:00.000Z",
            conteudo: { questoes: [] },
          },
          {
            id: "av-2025",
            criado_em: "2025-03-10T12:00:00.000Z",
            conteudo: null,
          },
        ],
      })
      .mockResolvedValueOnce({
        rows: [
          {
            avaliacao_id: "av-mar",
            aluno_id: 8,
            respostas: null,
          },
        ],
      });

    const resultado = await carregarDadosTurma(1, "turma-1", 2026, 1);

    expect(resultado).toEqual({
      turma: { id: "turma-1", nome: "Matemática" },
      alunos: [{ id: 8, nome: "Ana", matricula: "A8" }],
      avaliacoes: [
        {
          id: "av-mar",
          criadoEm: "2026-03-10T12:00:00.000Z",
          questoes: [{ enunciado: "questão" }],
        },
      ],
      respostas: [{ avaliacaoId: "av-mar", alunoId: 8, respostas: {} }],
      anosDisponiveis: [2026, 2025],
    });
    expect(mockQuery).toHaveBeenCalledTimes(4);
    expect(mockQuery.mock.calls[3][1]).toEqual([["av-mar"], [8]]);
  });

  it("inclui o ano solicitado e não consulta respostas sem avaliações ou alunos", async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ id: "turma-1", nome: "Matemática" }] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] });

    const resultado = await carregarDadosTurma(1, "turma-1", 2026, null);

    expect(resultado).toEqual({
      turma: { id: "turma-1", nome: "Matemática" },
      alunos: [],
      avaliacoes: [],
      respostas: [],
      anosDisponiveis: [2026],
    });
    expect(mockQuery).toHaveBeenCalledTimes(3);
  });

  it("não consulta respostas quando apenas um dos conjuntos está vazio", async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ id: "turma-1", nome: "Matemática" }] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({
        rows: [
          {
            id: "av-1",
            criado_em: "2026-03-10T12:00:00.000Z",
            conteudo: {},
          },
        ],
      })
      .mockResolvedValueOnce({ rows: [{ id: "turma-1", nome: "Matemática" }] })
      .mockResolvedValueOnce({
        rows: [{ id: 8, nome: "Ana", matricula: "A8" }],
      })
      .mockResolvedValueOnce({ rows: [] });

    await carregarDadosTurma(1, "turma-1", 2026, null);
    await carregarDadosTurma(1, "turma-1", 2026, null);

    expect(mockQuery).toHaveBeenCalledTimes(6);
  });
});
