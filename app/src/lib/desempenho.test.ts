import assert from "node:assert/strict";
import test from "node:test";
import {
  calcularDesempenhoTurma,
  obterPeriodoLetivo,
  verificarAcerto,
} from "./desempenho";

test("divide o ano em quatro períodos no fuso letivo brasileiro", () => {
  assert.deepEqual(obterPeriodoLetivo("2026-03-01T03:00:00.000Z"), {
    ano: 2026,
    bimestre: 1,
  });
  assert.deepEqual(obterPeriodoLetivo("2026-04-01T03:00:00.000Z"), {
    ano: 2026,
    bimestre: 2,
  });
  assert.deepEqual(obterPeriodoLetivo("2027-01-01T02:59:59.000Z"), {
    ano: 2026,
    bimestre: 4,
  });
});

test("mantém correção textual, decimal e por fração", () => {
  assert.equal(verificarAcerto("A", " a "), true);
  assert.equal(verificarAcerto("0,5", "1/2"), true);
  assert.equal(verificarAcerto("4", ""), false);
});

test("calcula média proporcional e não classifica alunos sem respostas", () => {
  const resultado = calcularDesempenhoTurma(
    [
      { id: 1, nome: "Ana", matricula: "A1" },
      { id: 2, nome: "Bia", matricula: "B1" },
      { id: 3, nome: "Caio", matricula: "C1" },
      { id: 4, nome: "Davi", matricula: "D1" },
    ],
    [
      {
        id: "avaliacao-1",
        criadoEm: "2026-03-10T12:00:00.000Z",
        questoes: [
          {
            enunciado: "Questão com dois campos",
            camposValidacao: [
              { id: "campo-1", label: "Parte 1", tipo: "texto", respostaCorreta: "certo" },
              { id: "campo-2", label: "Parte 2", tipo: "texto", respostaCorreta: "correto" },
            ],
            mapeamentoDeErros: [],
          },
        ],
      },
    ],
    [
      { avaliacaoId: "avaliacao-1", alunoId: 1, respostas: { "campo-1": "certo", "campo-2": "correto" } },
      { avaliacaoId: "avaliacao-1", alunoId: 2, respostas: { "campo-1": "certo", "campo-2": "errado" } },
      { avaliacaoId: "avaliacao-1", alunoId: 4, respostas: { "campo-1": "errado", "campo-2": "errado" } },
    ]
  );

  assert.equal(resultado.alunos[0].percentual, 100);
  assert.equal(resultado.alunos[0].faixa, "consolidado");
  assert.equal(resultado.alunos[1].percentual, 50);
  assert.equal(resultado.alunos[1].faixa, "desenvolvimento");
  assert.equal(resultado.alunos[2].percentual, null);
  assert.equal(resultado.alunos[2].faixa, "sem-avaliacao");
  assert.equal(resultado.alunos[3].percentual, 0);
  assert.equal(resultado.alunos[3].faixa, "apoio");
  assert.equal(resultado.mediaTurma, 50);
  assert.equal(resultado.consolidados, 1);
  assert.equal(resultado.emDesenvolvimento, 1);
  assert.equal(resultado.precisamDeApoio, 1);
});
