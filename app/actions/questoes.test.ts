import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockQuery, mockObterSessao } = vi.hoisted(() => ({
  mockQuery: vi.fn(),
  mockObterSessao: vi.fn(),
}));

vi.mock("@/app/src/db", () => ({
  pool: { query: mockQuery },
}));

vi.mock("@/app/src/lib/session", () => ({
  obterSessao: mockObterSessao,
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import {
  listarQuestoesComunidade,
  listarTagsMaterias,
  publicarQuestaoComunidade,
} from "./questoes";

const QUESTAO_EXEMPLO = {
  id: "q1",
  enunciado: "Resolva 2x + 4 = 10.",
  camposValidacao: [{ id: "x", label: "Valor de x", tipo: "numero" as const, respostaCorreta: "3" }],
  mapeamentoDeErros: [{ id: "x", erroProvavel: "Equação de 1º Grau" }],
};

describe("questoes actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockObterSessao.mockResolvedValue({
      id: 1,
      nome: "Prof. João",
      email: "joao@escola.com",
      perfil: "professor",
    });
  });

  it("listarTagsMaterias retorna apenas Matemática", async () => {
    expect(await listarTagsMaterias()).toEqual(["Matemática"]);
  });

  it("publicarQuestaoComunidade rejeita aluno e rejeita tags de outras matérias", async () => {
    mockObterSessao.mockResolvedValue({ id: 2, nome: "Aluno", email: "a@a.com", perfil: "aluno" });
    const resAluno = await publicarQuestaoComunidade(QUESTAO_EXEMPLO, "Matemática");
    expect(resAluno.sucesso).toBe(false);

    mockObterSessao.mockResolvedValue({ id: 1, nome: "Prof", email: "p@p.com", perfil: "professor" });
    const resOutraMateria = await publicarQuestaoComunidade(QUESTAO_EXEMPLO, "Português");
    expect(resOutraMateria.sucesso).toBe(false);
    expect(resOutraMateria.erro).toMatch(/Matemática/i);
  });

  it("publicarQuestaoComunidade salva questão válida como Matemática", async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ id: 5 }] }) // SELECT materias_tag
      .mockResolvedValueOnce({ rows: [{ id: 99 }] }); // INSERT questoes

    const res = await publicarQuestaoComunidade(QUESTAO_EXEMPLO);
    expect(res).toEqual({ sucesso: true, questaoId: 99 });
  });

  it("listarQuestoesComunidade retorna lista vazia para filtro de outra matéria", async () => {
    const res = await listarQuestoesComunidade({ tag: "História" });
    expect(res).toEqual({ sucesso: true, questoes: [] });
    expect(mockQuery).not.toHaveBeenCalled();
  });
});
