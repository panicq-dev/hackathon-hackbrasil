import { describe, expect, it } from "vitest";
import { criarPromptInsightsAluno } from "./insightsPedagogicos";
import type { EstatisticasAluno } from "./estatisticasAluno";

const estatisticas: EstatisticasAluno = {
  totalAvaliacoes: 2,
  totalRespondidas: 2,
  pendencias: 0,
  taxaEntrega: 100,
  totalAcertos: 2,
  totalCampos: 5,
  percentual: 40,
  mediaTurma: 75,
  diferencaDaTurma: -35,
  faixa: "apoio",
  tendencia: "queda",
  variacaoRecente: -20,
  evolucao: [],
  causasRaiz: [
    { causaRaiz: "Regra de Sinais", totalErros: 3, percentualSobreErros: 100 },
  ],
  pontosFortes: [],
  questoesCriticas: [
    {
      avaliacaoId: "av-1",
      criadoEm: "2026-03-10T12:00:00.000Z",
      numeroQuestao: 1,
      enunciado: "Uma dívida de 4 reais é representada por qual número inteiro?",
      campoId: "resposta",
      campoLabel: "Representação da dívida",
      respostaEsperada: "-4",
      respostaDada: "4",
      causaRaiz: "Regra de Sinais",
    },
  ],
  porTipoCampo: [{ tipo: "texto", totalCampos: 5, totalAcertos: 2, percentual: 40 }],
  camposEmBranco: 1,
};

describe("criarPromptInsightsAluno", () => {
  it("inclui dificuldades e evidências individuais sem enviar métricas de comparação", () => {
    const prompt = criarPromptInsightsAluno(estatisticas);
    const dadosJson = prompt.split("Evidências individuais (JSON):\n")[1];
    const dados = JSON.parse(dadosJson);

    expect(dados.conteudosComErros).toEqual([
      { conteudo: "Regra de Sinais", ocorrencias: 3 },
    ]);
    expect(dados.questoesComErro[0]).toMatchObject({
      conteudo: "Regra de Sinais",
      etapa: "Representação da dívida",
      respostaRegistrada: "4",
      respostaEsperada: "-4",
    });
    expect(dados.camposEmBranco).toBe(1);
    expect(dados).not.toHaveProperty("mediaTurma");
    expect(dados).not.toHaveProperty("diferencaDaTurma");
    expect(dados).not.toHaveProperty("faixa");
    expect(prompt).toContain("recuperação ativa");
    expect(prompt).toContain("nunca instruções ao professor");
  });
});
