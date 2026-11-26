import { describe, it, expect } from "vitest";
import { calcularDificuldadesTurma, calcularEstatisticasAluno } from "./estatisticasAluno";
import { AlunoParaDesempenho, AvaliacaoParaDesempenho, RespostaParaDesempenho } from "./desempenho";

const alunos: AlunoParaDesempenho[] = [
  { id: 1, nome: "Ana", matricula: "A1" },
  { id: 2, nome: "Bia", matricula: "B1" },
  { id: 3, nome: "Caio", matricula: "C1" },
];

const avaliacoes: AvaliacaoParaDesempenho[] = [
  {
    id: "avaliacao-1",
    criadoEm: "2026-03-10T12:00:00.000Z",
    questoes: [
      {
        enunciado: "Resolva a operação",
        camposValidacao: [
          { id: "campo-a", label: "Operações", tipo: "numero", respostaCorreta: "4" },
          { id: "campo-b", label: "Frações", tipo: "texto", respostaCorreta: "1/2" },
        ],
        mapeamentoDeErros: [
          { id: "campo-a", erroProvavel: "Soma de Fração" },
          { id: "campo-b", erroProvavel: "Regra de Sinais" },
        ],
      },
    ],
  },
  {
    id: "avaliacao-2",
    criadoEm: "2026-04-10T12:00:00.000Z",
    questoes: [
      {
        enunciado: "Calcule a fração",
        camposValidacao: [
          { id: "campo-c", label: "Frações", tipo: "texto", respostaCorreta: "1/2" },
        ],
        mapeamentoDeErros: [{ id: "campo-c", erroProvavel: "Soma de Frações" }],
      },
    ],
  },
];

const respostas: RespostaParaDesempenho[] = [
  { avaliacaoId: "avaliacao-1", alunoId: 1, respostas: { "campo-a": "4", "campo-b": "" } },
  { avaliacaoId: "avaliacao-2", alunoId: 1, respostas: { "campo-c": "1/2" } },
  { avaliacaoId: "avaliacao-1", alunoId: 2, respostas: { "campo-a": "errado", "campo-b": "0,5" } },
  { avaliacaoId: "avaliacao-2", alunoId: 2, respostas: { "campo-c": "errado" } },
];

describe("estatisticasAluno", () => {
  it("ignora erro isolado (distrator) e preserva campos em branco e questão crítica", () => {
    const resultado = calcularEstatisticasAluno(1, alunos, avaliacoes, respostas);

    expect(resultado).not.toBeNull();
    expect(resultado!.camposEmBranco).toBe(1);
    expect(resultado!.causasRaiz).toEqual([]);
    expect(resultado!.questoesCriticas[0].respostaDada).toBe("");
    expect(resultado!.questoesCriticas[0].respostaEsperada).toBe("1/2");
    expect(resultado!.pontosFortes.map(({ campo, percentual }) => [campo, percentual])).toEqual([
      ["Operações", 100],
      ["Frações", 50],
    ]);
  });

  it("mapeia causa raiz quando o aluno erra 2 ou mais vezes na mesma habilidade (mesmo com singular/plural)", () => {
    const resultado = calcularEstatisticasAluno(2, alunos, avaliacoes, respostas);

    expect(resultado).not.toBeNull();
    expect(resultado!.causasRaiz).toEqual([
      {
        causaRaiz: "Soma de Frações",
        totalErros: 2,
        percentualSobreErros: 100,
      },
    ]);
  });

  it("calcula evolução, tendência e faixa de acompanhamento sem classificar alunos", () => {
    const resultado = calcularEstatisticasAluno(1, alunos, avaliacoes, respostas);

    expect(resultado).not.toBeNull();
    expect(resultado!.evolucao.map((ponto) => ponto.percentual)).toEqual([50, 100]);
    expect(resultado!.evolucao.map((ponto) => ponto.mediaTurma)).toEqual([50, 50]);
    expect(resultado!.tendencia).toBe("melhora");
    expect(resultado!.variacaoRecente).toBe(50);
    expect(resultado!.faixa).toBe("desenvolvimento");
  });

  it("calcula a média de cada avaliação apenas com alunos que responderam", () => {
    const respostasParciais = respostas.filter(
      (resposta) => !(resposta.alunoId === 2 && resposta.avaliacaoId === "avaliacao-2")
    );

    const resultado = calcularEstatisticasAluno(1, alunos, avaliacoes, respostasParciais);

    expect(resultado!.evolucao.map(({ percentual, mediaTurma }) => [percentual, mediaTurma])).toEqual([
      [50, 50],
      [100, 100],
    ]);
    expect(resultado!.diferencaDaTurma).toBe(8);
  });

  it("classifica tendência estável quando o percentual não muda", () => {
    const avaliacoesEstaveis: AvaliacaoParaDesempenho[] = avaliacoes.map((avaliacao) => ({
      ...avaliacao,
      questoes: [
        {
          ...avaliacao.questoes[0],
          camposValidacao: [
            { id: `${avaliacao.id}-certo`, label: "Acertos", tipo: "texto", respostaCorreta: "sim" },
            { id: `${avaliacao.id}-erro`, label: "Erros", tipo: "texto", respostaCorreta: "sim" },
          ],
        },
      ],
    }));

    const resultado = calcularEstatisticasAluno(
      1,
      alunos,
      avaliacoesEstaveis,
      avaliacoesEstaveis.map((avaliacao) => ({
        avaliacaoId: avaliacao.id,
        alunoId: 1,
        respostas: {
          [`${avaliacao.id}-certo`]: "sim",
          [`${avaliacao.id}-erro`]: "não",
        },
      }))
    );

    expect(resultado!.variacaoRecente).toBe(0);
    expect(resultado!.tendencia).toBe("estavel");
  });

  it("usa a causa geral e o identificador do campo quando faltam metadados opcionais", () => {
    const avaliacoesSemMapeamento: AvaliacaoParaDesempenho[] = [
      {
        id: "avaliacao-sem-mapeamento",
        criadoEm: "2026-03-10T12:00:00.000Z",
        questoes: [
          {
            enunciado: "Questão sem causa mapeada",
            camposValidacao: [
              { id: "campo-sem-label", label: "  ", tipo: "texto", respostaCorreta: "certo" },
            ],
            mapeamentoDeErros: [],
          },
        ],
      },
    ];

    const resultado = calcularEstatisticasAluno(
      1,
      alunos,
      avaliacoesSemMapeamento,
      [{ avaliacaoId: "avaliacao-sem-mapeamento", alunoId: 1, respostas: {} }]
    );

    expect(resultado!.questoesCriticas[0]).toMatchObject({
      numeroQuestao: 1,
      campoLabel: "Campo campo-sem-label",
      causaRaiz: "Conceito geral do conteúdo",
    });
  });

  it("calcula pendências e retorna indicadores neutros para aluno sem respostas", () => {
    const resultado = calcularEstatisticasAluno(3, alunos, avaliacoes, respostas);

    expect(resultado).not.toBeNull();
    expect(resultado!.percentual).toBeNull();
    expect(resultado!.totalRespondidas).toBe(0);
    expect(resultado!.pendencias).toBe(2);
    expect(resultado!.taxaEntrega).toBe(0);
    expect(resultado!.faixa).toBe("sem-avaliacao");
    expect(resultado!.tendencia).toBe("sem-dados");
    expect(resultado!.causasRaiz).toEqual([]);
    expect(resultado!.porTipoCampo).toEqual([]);
  });

  it("retorna null quando o aluno não pertence à lista fornecida", () => {
    expect(calcularEstatisticasAluno(999, alunos, avaliacoes, respostas)).toBeNull();
  });

  it("agrega dificuldades da turma exigindo >= 2 erros e unificando variantes", () => {
    const resultado = calcularDificuldadesTurma(alunos, avaliacoes, respostas);

    expect(resultado.causasRaiz.map((c) => [c.causaRaiz, c.totalErros])).toEqual([
      ["Soma de Frações", 2],
    ]);
    expect(resultado.questoesCriticas).toHaveLength(2);
    expect(resultado.questoesCriticas.map((q) => q.percentualErros)).toEqual([50, 50]);
    expect(resultado.evolucao.map((p) => p.percentual)).toEqual([50, 50]);
  });

  it("mantém dificuldades vazias quando a turma ainda não tem avaliações", () => {
    const resultado = calcularDificuldadesTurma(alunos, [], []);

    expect(resultado).toEqual({ causasRaiz: [], questoesCriticas: [], evolucao: [] });
  });
});
