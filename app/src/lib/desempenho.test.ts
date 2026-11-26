import { describe, it, expect } from "vitest";
import {
  calcularDesempenhoTurma,
  obterPeriodoLetivo,
  verificarAcerto,
} from "./desempenho";

describe("desempenho", () => {
  describe("obterPeriodoLetivo", () => {
    it("divide o ano em quatro bimestres no fuso letivo brasileiro", () => {
      expect(obterPeriodoLetivo("2026-03-01T03:00:00.000Z")).toEqual({
        ano: 2026,
        bimestre: 1,
      });
      expect(obterPeriodoLetivo("2026-04-01T03:00:00.000Z")).toEqual({
        ano: 2026,
        bimestre: 2,
      });
      expect(obterPeriodoLetivo("2026-08-15T12:00:00.000Z")).toEqual({
        ano: 2026,
        bimestre: 3,
      });
      expect(obterPeriodoLetivo("2027-01-01T02:59:59.000Z")).toEqual({
        ano: 2026,
        bimestre: 4,
      });
    });

    it("lança erro para datas inválidas", () => {
      expect(() => obterPeriodoLetivo("data-invalida")).toThrow(/Data inválida/i);
    });
  });

  describe("verificarAcerto", () => {
    it("valida equivalências numéricas, decimais com vírgula/ponto e frações", () => {
      expect(verificarAcerto("0,5", "1/2")).toBe(true);
      expect(verificarAcerto("0.25", "1/4")).toBe(true);
      expect(verificarAcerto("-3/2", "-1,5")).toBe(true);
      expect(verificarAcerto(42, " 42 ")).toBe(true);
      expect(verificarAcerto("1/0", "0")).toBe(false);
    });

    it("normaliza espaços nas bordas e caixa para respostas textuais e rejeita vazios", () => {
      expect(verificarAcerto("  Equação de 2º Grau ", "equação de 2º grau")).toBe(true);
      expect(verificarAcerto("4", "")).toBe(false);
      expect(verificarAcerto("4", null)).toBe(false);
      expect(verificarAcerto("4", undefined)).toBe(false);
    });
  });

  describe("calcularDesempenhoTurma", () => {
    it("calcula média proporcional e classifica faixas corretamente", () => {
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

      expect(resultado.alunos[0].percentual).toBe(100);
      expect(resultado.alunos[0].faixa).toBe("consolidado");
      expect(resultado.alunos[1].percentual).toBe(50);
      expect(resultado.alunos[1].faixa).toBe("desenvolvimento");
      expect(resultado.alunos[2].percentual).toBeNull();
      expect(resultado.alunos[2].faixa).toBe("sem-avaliacao");
      expect(resultado.alunos[3].percentual).toBe(0);
      expect(resultado.alunos[3].faixa).toBe("apoio");
      expect(resultado.mediaTurma).toBe(50);
      expect(resultado.consolidados).toBe(1);
      expect(resultado.emDesenvolvimento).toBe(1);
      expect(resultado.precisamDeApoio).toBe(1);
    });

    it("retorna mediaTurma null quando nenhum aluno respondeu", () => {
      const resultado = calcularDesempenhoTurma(
        [{ id: 1, nome: "Ana", matricula: "A1" }],
        [],
        []
      );
      expect(resultado.mediaTurma).toBeNull();
      expect(resultado.alunos[0].faixa).toBe("sem-avaliacao");
    });
  });
});
