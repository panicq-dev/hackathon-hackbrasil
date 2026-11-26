import assert from "node:assert/strict";
import test from "node:test";
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
        mapeamentoDeErros: [{ id: "campo-a", erroProvavel: "Operações básicas" }],
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
        mapeamentoDeErros: [{ id: "campo-c", erroProvavel: "Frações" }],
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

test("calcula causas raiz, campos em branco e resposta esperada versus dada", () => {
  const resultado = calcularEstatisticasAluno(1, alunos, avaliacoes, respostas);

  assert.ok(resultado);
  assert.equal(resultado.camposEmBranco, 1);
  assert.deepEqual(resultado.causasRaiz.map((causa) => causa.causaRaiz), ["Conceito geral do conteúdo"]);
  assert.equal(resultado.questoesCriticas[0].respostaDada, "");
  assert.equal(resultado.questoesCriticas[0].respostaEsperada, "1/2");
});

test("calcula evolução, tendência e faixa de acompanhamento sem classificar alunos", () => {
  const resultado = calcularEstatisticasAluno(1, alunos, avaliacoes, respostas);

  assert.ok(resultado);
  assert.deepEqual(resultado.evolucao.map((ponto) => ponto.percentual), [50, 100]);
  assert.equal(resultado.tendencia, "melhora");
  assert.equal(resultado.variacaoRecente, 50);
  assert.equal(resultado.faixa, "desenvolvimento");
});

test("calcula pendências e retorna indicadores neutros para aluno sem respostas", () => {
  const resultado = calcularEstatisticasAluno(3, alunos, avaliacoes, respostas);

  assert.ok(resultado);
  assert.equal(resultado.percentual, null);
  assert.equal(resultado.totalRespondidas, 0);
  assert.equal(resultado.pendencias, 2);
  assert.equal(resultado.taxaEntrega, 0);
  assert.equal(resultado.faixa, "sem-avaliacao");
  assert.equal(resultado.tendencia, "sem-dados");
  assert.deepEqual(resultado.causasRaiz, []);
  assert.deepEqual(resultado.porTipoCampo, []);
});

test("retorna null quando o aluno não pertence à lista fornecida", () => {
  assert.equal(calcularEstatisticasAluno(999, alunos, avaliacoes, respostas), null);
});

test("agrega dificuldades da turma e ignora avaliações sem respostas", () => {
  const resultado = calcularDificuldadesTurma(alunos, avaliacoes, respostas);

  assert.deepEqual(resultado.causasRaiz.map((causa) => [causa.causaRaiz, causa.totalErros]), [
    ["Conceito geral do conteúdo", 1],
    ["Frações", 1],
    ["Operações básicas", 1],
  ]);
  assert.equal(resultado.questoesCriticas.length, 2);
  assert.deepEqual(resultado.questoesCriticas.map((questao) => questao.percentualErros), [50, 50]);
  assert.deepEqual(resultado.evolucao.map((ponto) => ponto.percentual), [50, 50]);
});

test("mantém dificuldades vazias quando a turma ainda não tem avaliações", () => {
  const resultado = calcularDificuldadesTurma(alunos, [], []);

  assert.deepEqual(resultado, { causasRaiz: [], questoesCriticas: [], evolucao: [] });
});