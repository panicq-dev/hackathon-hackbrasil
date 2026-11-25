import {
  calcularDesempenhoTurma,
  verificarAcerto,
  AlunoParaDesempenho,
  AvaliacaoParaDesempenho,
  RespostaParaDesempenho,
} from "./desempenho";
import { CampoValidacao, EstruturaQuestao } from "@/app/src/types";

const CAUSA_GERAL = "Conceito geral do conteúdo";

export type CausaRaizEstatistica = {
  causaRaiz: string;
  totalErros: number;
  percentualSobreErros: number;
};

export type QuestaoCriticaAluno = {
  avaliacaoId: string;
  criadoEm: string;
  numeroQuestao: number;
  enunciado: string;
  campoId: string;
  campoLabel: string;
  respostaEsperada: string | number;
  respostaDada: string | number | null;
  causaRaiz: string;
};

export type EstatisticaPorTipoCampo = {
  tipo: CampoValidacao["tipo"];
  totalCampos: number;
  totalAcertos: number;
  percentual: number;
};

export type PontoEvolucaoAluno = {
  avaliacaoId: string;
  criadoEm: string;
  percentual: number;
  mediaTurma: number | null;
};

export type EstatisticasAluno = {
  totalAvaliacoes: number;
  totalRespondidas: number;
  pendencias: number;
  taxaEntrega: number | null;
  totalAcertos: number;
  totalCampos: number;
  percentual: number | null;
  mediaTurma: number | null;
  diferencaDaTurma: number | null;
  posicaoNaTurma: number | null;
  totalAlunosComDesempenho: number;
  tendencia: "melhora" | "queda" | "estavel" | "sem-dados";
  variacaoRecente: number | null;
  evolucao: PontoEvolucaoAluno[];
  causasRaiz: CausaRaizEstatistica[];
  pontosFortes: { campo: string; totalAcertos: number; totalCampos: number; percentual: number }[];
  questoesCriticas: QuestaoCriticaAluno[];
  porTipoCampo: EstatisticaPorTipoCampo[];
  camposEmBranco: number;
};

export type QuestaoCriticaTurma = {
  avaliacaoId: string;
  criadoEm: string;
  numeroQuestao: number;
  enunciado: string;
  totalTentativas: number;
  totalErros: number;
  percentualErros: number;
};

export type PontoEvolucaoTurma = {
  avaliacaoId: string;
  criadoEm: string;
  percentual: number;
};

export type DificuldadesTurma = {
  causasRaiz: CausaRaizEstatistica[];
  questoesCriticas: QuestaoCriticaTurma[];
  evolucao: PontoEvolucaoTurma[];
};

function listarCampos(questoes: EstruturaQuestao[]): { questao: EstruturaQuestao; numeroQuestao: number; campo: CampoValidacao }[] {
  return questoes.flatMap((questao, indice) =>
    (Array.isArray(questao.camposValidacao) ? questao.camposValidacao : []).map((campo) => ({
      questao,
      numeroQuestao: indice + 1,
      campo,
    }))
  );
}

function obterCausaRaiz(questao: EstruturaQuestao, campoId: string): string {
  const mapeamento = questao.mapeamentoDeErros?.find((item) => item.id === campoId);
  return mapeamento?.erroProvavel?.trim() || CAUSA_GERAL;
}

function calcularRankingCausas(contagens: Map<string, number>): CausaRaizEstatistica[] {
  const totalErros = Array.from(contagens.values()).reduce((total, quantidade) => total + quantidade, 0);
  return Array.from(contagens.entries())
    .map(([causaRaiz, total]) => ({
      causaRaiz,
      totalErros: total,
      percentualSobreErros: totalErros > 0 ? Math.round((total / totalErros) * 100) : 0,
    }))
    .sort((a, b) => b.totalErros - a.totalErros || a.causaRaiz.localeCompare(b.causaRaiz, "pt-BR"));
}

export function calcularEstatisticasAluno(
  alunoId: number,
  alunos: AlunoParaDesempenho[],
  avaliacoes: AvaliacaoParaDesempenho[],
  respostas: RespostaParaDesempenho[]
): EstatisticasAluno | null {
  const aluno = alunos.find((item) => item.id === alunoId);
  if (!aluno) return null;

  const desempenho = calcularDesempenhoTurma(alunos, avaliacoes, respostas);
  const alunoCalculado = desempenho.alunos.find((item) => item.id === alunoId);
  if (!alunoCalculado) return null;

  const respostasDoAluno = respostas.filter((resposta) => resposta.alunoId === alunoId);
  const avaliacoesPorId = new Map(avaliacoes.map((avaliacao) => [avaliacao.id, avaliacao]));
  const errosPorCausa = new Map<string, number>();
  const acertosPorCampo = new Map<string, { totalAcertos: number; totalCampos: number }>();
  const acertosPorTipo = new Map<CampoValidacao["tipo"], { totalAcertos: number; totalCampos: number }>();
  const questoesCriticas: QuestaoCriticaAluno[] = [];
  let camposEmBranco = 0;

  for (const resposta of respostasDoAluno) {
    const avaliacao = avaliacoesPorId.get(resposta.avaliacaoId);
    if (!avaliacao) continue;

    for (const { questao, numeroQuestao, campo } of listarCampos(avaliacao.questoes)) {
      const respostaDada = resposta.respostas[campo.id] ?? null;
      const emBranco = respostaDada === null || String(respostaDada).trim() === "";
      if (emBranco) camposEmBranco++;

      const acertou = verificarAcerto(campo.respostaCorreta, respostaDada);
      const labelCampo = campo.label.trim() || `Campo ${campo.id}`;
      const porCampo = acertosPorCampo.get(labelCampo) ?? { totalAcertos: 0, totalCampos: 0 };
      porCampo.totalCampos++;
      if (acertou) porCampo.totalAcertos++;
      acertosPorCampo.set(labelCampo, porCampo);

      const porTipo = acertosPorTipo.get(campo.tipo) ?? { totalAcertos: 0, totalCampos: 0 };
      porTipo.totalCampos++;
      if (acertou) porTipo.totalAcertos++;
      acertosPorTipo.set(campo.tipo, porTipo);

      if (!acertou) {
        const causaRaiz = obterCausaRaiz(questao, campo.id);
        errosPorCausa.set(causaRaiz, (errosPorCausa.get(causaRaiz) ?? 0) + 1);
        questoesCriticas.push({
          avaliacaoId: avaliacao.id,
          criadoEm: avaliacao.criadoEm,
          numeroQuestao,
          enunciado: questao.enunciado,
          campoId: campo.id,
          campoLabel: labelCampo,
          respostaEsperada: campo.respostaCorreta,
          respostaDada,
          causaRaiz,
        });
      }
    }
  }

  const evolucao = alunoCalculado.avaliacoes
    .filter((avaliacao) => avaliacao.percentual !== null)
    .map((avaliacao) => {
      const resultadosAlunos = desempenho.alunos.flatMap((alunoDaTurma) =>
        alunoDaTurma.avaliacoes
          .filter((resultado) => resultado.id === avaliacao.id && resultado.percentual !== null)
          .map((resultado) => resultado.percentual as number)
      );
      const mediaTurma = resultadosAlunos.length > 0
        ? Math.round(resultadosAlunos.reduce((total, percentual) => total + percentual, 0) / resultadosAlunos.length)
        : null;
      return {
        avaliacaoId: avaliacao.id,
        criadoEm: avaliacao.criadoEm,
        percentual: avaliacao.percentual as number,
        mediaTurma,
      };
    })
    .sort((a, b) => new Date(a.criadoEm).getTime() - new Date(b.criadoEm).getTime());

  const variacaoRecente = evolucao.length >= 2
    ? evolucao[evolucao.length - 1].percentual - evolucao[evolucao.length - 2].percentual
    : null;
  const tendencia: EstatisticasAluno["tendencia"] = variacaoRecente === null
    ? "sem-dados"
    : variacaoRecente > 5
      ? "melhora"
      : variacaoRecente < -5
        ? "queda"
        : "estavel";

  const alunosComResultado = desempenho.alunos
    .filter((item) => item.percentual !== null)
    .sort((a, b) => (b.percentual ?? -1) - (a.percentual ?? -1) || a.nome.localeCompare(b.nome, "pt-BR"));
  const posicaoNaTurma = alunoCalculado.percentual === null
    ? null
    : 1 + alunosComResultado.filter((item) => (item.percentual ?? -1) > alunoCalculado.percentual!).length;
  const totalRespondidas = alunoCalculado.totalRespondidas;

  return {
    totalAvaliacoes: avaliacoes.length,
    totalRespondidas,
    pendencias: Math.max(0, avaliacoes.length - totalRespondidas),
    taxaEntrega: avaliacoes.length > 0 ? Math.round((totalRespondidas / avaliacoes.length) * 100) : null,
    totalAcertos: alunoCalculado.totalAcertos,
    totalCampos: alunoCalculado.totalCampos,
    percentual: alunoCalculado.percentual,
    mediaTurma: desempenho.mediaTurma,
    diferencaDaTurma: alunoCalculado.percentual !== null && desempenho.mediaTurma !== null
      ? alunoCalculado.percentual - desempenho.mediaTurma
      : null,
    posicaoNaTurma,
    totalAlunosComDesempenho: alunosComResultado.length,
    tendencia,
    variacaoRecente,
    evolucao,
    causasRaiz: calcularRankingCausas(errosPorCausa),
    pontosFortes: Array.from(acertosPorCampo.entries())
      .filter(([, contagem]) => contagem.totalAcertos > 0)
      .map(([campo, contagem]) => ({
        campo,
        totalAcertos: contagem.totalAcertos,
        totalCampos: contagem.totalCampos,
        percentual: Math.round((contagem.totalAcertos / contagem.totalCampos) * 100),
      }))
      .sort((a, b) => b.percentual - a.percentual || b.totalAcertos - a.totalAcertos)
      .slice(0, 5),
    questoesCriticas: questoesCriticas.sort(
      (a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime() || a.numeroQuestao - b.numeroQuestao
    ),
    porTipoCampo: Array.from(acertosPorTipo.entries()).map(([tipo, contagem]) => ({
      tipo,
      totalCampos: contagem.totalCampos,
      totalAcertos: contagem.totalAcertos,
      percentual: Math.round((contagem.totalAcertos / contagem.totalCampos) * 100),
    })),
    camposEmBranco,
  };
}

export function calcularDificuldadesTurma(
  alunos: AlunoParaDesempenho[],
  avaliacoes: AvaliacaoParaDesempenho[],
  respostas: RespostaParaDesempenho[]
): DificuldadesTurma {
  const errosPorCausa = new Map<string, number>();
  const questoes = new Map<string, QuestaoCriticaTurma>();
  const avaliacoesPorId = new Map(avaliacoes.map((avaliacao) => [avaliacao.id, avaliacao]));

  for (const resposta of respostas) {
    const avaliacao = avaliacoesPorId.get(resposta.avaliacaoId);
    if (!avaliacao) continue;

    for (const { questao, numeroQuestao, campo } of listarCampos(avaliacao.questoes)) {
      const respostaDada = resposta.respostas[campo.id] ?? null;
      const chaveQuestao = `${avaliacao.id}:${numeroQuestao}`;
      const item = questoes.get(chaveQuestao) ?? {
        avaliacaoId: avaliacao.id,
        criadoEm: avaliacao.criadoEm,
        numeroQuestao,
        enunciado: questao.enunciado,
        totalTentativas: 0,
        totalErros: 0,
        percentualErros: 0,
      };
      item.totalTentativas++;

      if (!verificarAcerto(campo.respostaCorreta, respostaDada)) {
        item.totalErros++;
        const causaRaiz = obterCausaRaiz(questao, campo.id);
        errosPorCausa.set(causaRaiz, (errosPorCausa.get(causaRaiz) ?? 0) + 1);
      }
      item.percentualErros = Math.round((item.totalErros / item.totalTentativas) * 100);
      questoes.set(chaveQuestao, item);
    }
  }

  const desempenho = calcularDesempenhoTurma(alunos, avaliacoes, respostas);
  const evolucao = avaliacoes.map((avaliacao) => {
    const percentuais = desempenho.alunos.flatMap((aluno) =>
      aluno.avaliacoes
        .filter((resultado) => resultado.id === avaliacao.id && resultado.percentual !== null)
        .map((resultado) => resultado.percentual as number)
    );
    return {
      avaliacaoId: avaliacao.id,
      criadoEm: avaliacao.criadoEm,
      percentual: percentuais.length > 0
        ? Math.round(percentuais.reduce((total, percentual) => total + percentual, 0) / percentuais.length)
        : null,
    };
  })
    .filter((item): item is PontoEvolucaoTurma => item.percentual !== null)
    .sort((a, b) => new Date(a.criadoEm).getTime() - new Date(b.criadoEm).getTime());

  return {
    causasRaiz: calcularRankingCausas(errosPorCausa),
    questoesCriticas: Array.from(questoes.values())
      .filter((item) => item.totalErros > 0)
      .sort((a, b) => b.percentualErros - a.percentualErros || b.totalErros - a.totalErros),
    evolucao,
  };
}