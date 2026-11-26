import { describe, it, expect } from "vitest";
import {
  agruparCausasRaiz,
  canonicalizarCausaRaiz,
  normalizarChaveCausaRaiz,
} from "./causasRaiz";

describe("causasRaiz", () => {
  describe("normalizarChaveCausaRaiz", () => {
    it("unifica singular, plural, acentos, conectores e ordinais", () => {
      expect(normalizarChaveCausaRaiz("Soma de Frações")).toBe(
        normalizarChaveCausaRaiz("Soma de Fração")
      );
      expect(normalizarChaveCausaRaiz("Equações do 2º Grau")).toBe(
        normalizarChaveCausaRaiz("Equação de 2o Grau")
      );
      expect(normalizarChaveCausaRaiz("Regras dos Sinais")).toBe(
        normalizarChaveCausaRaiz("Regra de Sinais")
      );
      expect(normalizarChaveCausaRaiz("Operações com Decimais")).toBe(
        normalizarChaveCausaRaiz("Operação Decimal")
      );
    });

    it("lida com terminações -ães, -éis, -óis e palavras curtas", () => {
      expect(normalizarChaveCausaRaiz("Pães")).toBe("pao");
      expect(normalizarChaveCausaRaiz("Papéis")).toBe("papel");
      expect(normalizarChaveCausaRaiz("Anzóis")).toBe("anzol");
      expect(normalizarChaveCausaRaiz("em")).toBe("");
    });
  });

  describe("canonicalizarCausaRaiz", () => {
    it("mapeia variantes para o nome canônico exato", () => {
      expect(canonicalizarCausaRaiz("Soma de Fração")).toBe("Soma de Frações");
      expect(canonicalizarCausaRaiz("soma de fracoes")).toBe("Soma de Frações");
      expect(canonicalizarCausaRaiz("Equações do 2º Grau")).toBe("Equação de 2º Grau");
      expect(canonicalizarCausaRaiz("Cálculos de Discriminantes")).toBe("Cálculo de Discriminante");
    });

    it("retorna fallback quando vazio ou apenas pontuação", () => {
      expect(canonicalizarCausaRaiz("   ")).toBe("Conceito Geral");
      expect(canonicalizarCausaRaiz("---", "Sem Causa")).toBe("Sem Causa");
    });

    it("preserva causa customizada quando não há correspondência canônica", () => {
      expect(canonicalizarCausaRaiz("Logaritmos Naturais")).toBe("Logaritmos Naturais");
    });
  });

  describe("agruparCausasRaiz", () => {
    it("soma variantes equivalentes e aplica mínimo de 2 erros", () => {
      const resultado = agruparCausasRaiz([
        ["Soma de Fração", 1],
        ["Soma de Frações", 1],
        ["Regra de Sinais", 1],
        ["Inválido", 0],
      ]);

      expect(resultado).toEqual([{ causaRaiz: "Soma de Frações", totalErros: 2 }]);
    });

    it("ordena por total de erros decrescente e desempata alfabeticamente", () => {
      const resultado = agruparCausasRaiz([
        ["Porcentagem", 2],
        ["Regra de Sinais", 2],
        ["Equação de 1º Grau", 3],
      ]);

      expect(resultado).toEqual([
        { causaRaiz: "Equação de 1º Grau", totalErros: 3 },
        { causaRaiz: "Porcentagem", totalErros: 2 },
        { causaRaiz: "Regra de Sinais", totalErros: 2 },
      ]);
    });
  });
});
