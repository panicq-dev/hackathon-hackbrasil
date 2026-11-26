import { describe, it, expect } from "vitest";
import {
  detectarMateriaProibida,
  ehConteudoMatematica,
  ehTagMatematica,
  normalizarQuestoesGeradas,
} from "./matematicaFiltro";

describe("matematicaFiltro", () => {
  it("bloqueia conteúdos de outras matérias e aceita Matemática", () => {
    expect(detectarMateriaProibida("Equação do 2º Grau e Bhaskara")).toBeNull();
    expect(ehConteudoMatematica("Funções e Geometria Espacial")).toBe(true);
    expect(detectarMateriaProibida("Análise sintática de Português")).toBe("português");
    expect(ehConteudoMatematica("Revolução Francesa em História")).toBe(false);
  });

  it("valida tag de matéria aceitando apenas Matemática", () => {
    expect(ehTagMatematica(undefined)).toBe(true);
    expect(ehTagMatematica("Matemática")).toBe(true);
    expect(ehTagMatematica("matematica")).toBe(true);
    expect(ehTagMatematica("Português")).toBe(false);
    expect(ehTagMatematica("Geral")).toBe(false);
  });

  it("normaliza questões removendo IDs inexistentes, preenchendo faltantes e unificando causas raiz", () => {
    const resultado = normalizarQuestoesGeradas([
      {
        id: "q1",
        enunciado: "Enunciado 1",
        camposValidacao: [
          { id: "c1", label: "Passo 1", tipo: "numero", respostaCorreta: "5" },
          { id: "c2", label: "Passo 2", tipo: "numero", respostaCorreta: "10" },
        ],
        mapeamentoDeErros: [
          { id: "c1", erroProvavel: "Soma de Fração" },
          { id: "idInexistente", erroProvavel: "Porcentagem" },
        ],
      },
      {
        id: "q2",
        enunciado: "Enunciado 2",
        camposValidacao: [
          { id: "  ", label: "Passo único", tipo: "numero", respostaCorreta: "15" },
        ],
        mapeamentoDeErros: [
          { id: "q2Campo1", erroProvavel: "soma de fracoes" },
        ],
      },
    ]);

    expect(resultado[0].mapeamentoDeErros).toEqual([
      { id: "c1", erroProvavel: "Soma de Frações" },
      { id: "c2", erroProvavel: "Interpretação de Enunciado" },
    ]);
    expect(resultado[1].camposValidacao[0].id).toBe("q2Campo1");
    expect(resultado[1].mapeamentoDeErros).toEqual([
      { id: "q2Campo1", erroProvavel: "Soma de Frações" },
    ]);
  });
});
