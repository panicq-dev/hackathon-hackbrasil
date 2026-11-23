import { CampoValidacao, EstruturaQuestao } from "@/app/src/types";

export type PeriodoLetivo = {
  ano: number;
  bimestre: 1 | 2 | 3 | 4;
};

export type AvaliacaoParaDesempenho = {
  id: string;
  criadoEm: string;
  questoes: EstruturaQuestao[];
};

export type AlunoParaDesempenho = {
  id: number;
  nome: string;
  matricula: string;
};

export type RespostaParaDesempenho = {
  avaliacaoId: string;
  alunoId: number;
  respostas: Record<string, string | number>;
};

export type FaixaDesempenho =
  | "consolidado"
  | "desenvolvimento"
  | "apoio"
  | "sem-avaliacao";

export type ResultadoAvaliacaoAluno = {
  id: string;
  criadoEm: string;
  totalAcertos: number;
  totalCampos: number;
  percentual: number | null;
};

export type AlunoComDesempenho = AlunoParaDesempenho & {
  totalAvaliacoes: number;
  totalRespondidas: number;
  totalAcertos: number;
  totalCampos: number;
  percentual: number | null;
  faixa: FaixaDesempenho;
  avaliacoes: ResultadoAvaliacaoAluno[];
};

export function obterPeriodoLetivo(data: string | Date): PeriodoLetivo {
  const dataValida = data instanceof Date ? data : new Date(data);
  if (Number.isNaN(dataValida.getTime())) {
    throw new Error("Data inválida ao calcular o período letivo.");
  }

  const partesData = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "numeric",
  }).formatToParts(dataValida);
  const ano = Number(partesData.find((parte) => parte.type === "year")?.value);
  const mes = Number(partesData.find((parte) => parte.type === "month")?.value);

  return {
    ano,
    bimestre: (Math.floor((mes - 1) / 3) + 1) as PeriodoLetivo["bimestre"],
  };
}

function normalizarTexto(valor: string | number | null | undefined): string {
  if (valor === null || valor === undefined) return "";
  return String(valor).trim().toLowerCase().replace(/,/g, ".");
}

function avaliarFracao(valor: string): number | null {
  const match = valor.trim().match(/^(-?\d+)\s*\/\s*(\d+)$/);
  if (!match) return null;

  const numerador = Number(match[1]);
  const denominador = Number(match[2]);
  if (denominador === 0) return null;

  return numerador / denominador;
}

export function verificarAcerto(
  esperado: string | number,
  informado: string | number | null | undefined
): boolean {
  if (informado === null || informado === undefined || String(informado).trim() === "") {
    return false;
  }

  const esperadoTexto = String(esperado).trim();
  const informadoTexto = String(informado).trim();
  if (normalizarTexto(esperadoTexto) === normalizarTexto(informadoTexto)) {
    return true;
  }

  const esperadoFracao = avaliarFracao(esperadoTexto);
  const informadoFracao = avaliarFracao(informadoTexto);
  const esperadoNumero =
    esperadoFracao !== null
      ? esperadoFracao
      : Number(esperadoTexto.replace(/,/g, "."));
  const informadoNumero =
    informadoFracao !== null
      ? informadoFracao
      : Number(informadoTexto.replace(/,/g, "."));

  return (
    !Number.isNaN(esperadoNumero) &&
    !Number.isNaN(informadoNumero) &&
    Math.abs(esperadoNumero - informadoNumero) < 0.0001
  );
}

function extrairCampos(questoes: EstruturaQuestao[]): CampoValidacao[] {
  return questoes.flatMap((questao) =>
    Array.isArray(questao.camposValidacao) ? questao.camposValidacao : []
  );
}

function obterFaixa(percentual: number | null): FaixaDesempenho {
  if (percentual === null) return "sem-avaliacao";
  if (percentual >= 80) return "consolidado";
  if (percentual >= 50) return "desenvolvimento";
  return "apoio";
}

export function calcularDesempenhoTurma(
  alunos: AlunoParaDesempenho[],
  avaliacoes: AvaliacaoParaDesempenho[],
  respostas: RespostaParaDesempenho[]
): {
  alunos: AlunoComDesempenho[];
  mediaTurma: number | null;
  consolidados: number;
  emDesenvolvimento: number;
  precisamDeApoio: number;
} {
  const avaliacoesPorId = new Map(avaliacoes.map((avaliacao) => [avaliacao.id, avaliacao]));
  const respostasPorAluno = new Map<number, RespostaParaDesempenho[]>();

  for (const resposta of respostas) {
    const respostasDoAluno = respostasPorAluno.get(resposta.alunoId) ?? [];
    respostasDoAluno.push(resposta);
    respostasPorAluno.set(resposta.alunoId, respostasDoAluno);
  }

  const alunosCalculados: AlunoComDesempenho[] = alunos.map((aluno) => {
    const respostasDoAluno = respostasPorAluno.get(aluno.id) ?? [];
    const resultadosAvaliacao: ResultadoAvaliacaoAluno[] = [];

    for (const resposta of respostasDoAluno) {
      const avaliacao = avaliacoesPorId.get(resposta.avaliacaoId);
      if (!avaliacao) continue;

      const campos = extrairCampos(avaliacao.questoes);
      const totalAcertos = campos.reduce(
        (total, campo) =>
          total + (verificarAcerto(campo.respostaCorreta, resposta.respostas[campo.id]) ? 1 : 0),
        0
      );
      const totalCampos = campos.length;

      resultadosAvaliacao.push({
        id: avaliacao.id,
        criadoEm: avaliacao.criadoEm,
        totalAcertos,
        totalCampos,
        percentual:
          totalCampos > 0 ? Math.round((totalAcertos / totalCampos) * 100) : null,
      });
    }

    resultadosAvaliacao.sort(
      (a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime()
    );

    const totalAcertos = resultadosAvaliacao.reduce(
      (total, avaliacao) => total + avaliacao.totalAcertos,
      0
    );
    const totalCampos = resultadosAvaliacao.reduce(
      (total, avaliacao) => total + avaliacao.totalCampos,
      0
    );
    const percentual =
      totalCampos > 0 ? Math.round((totalAcertos / totalCampos) * 100) : null;

    return {
      ...aluno,
      totalAvaliacoes: avaliacoes.length,
      totalRespondidas: resultadosAvaliacao.length,
      totalAcertos,
      totalCampos,
      percentual,
      faixa: obterFaixa(percentual),
      avaliacoes: resultadosAvaliacao,
    };
  });

  const alunosComResultado = alunosCalculados.filter(
    (aluno) => aluno.percentual !== null
  );
  const mediaTurma =
    alunosComResultado.length > 0
      ? Math.round(
          alunosComResultado.reduce(
            (total, aluno) => total + (aluno.percentual ?? 0),
            0
          ) / alunosComResultado.length
        )
      : null;

  return {
    alunos: alunosCalculados,
    mediaTurma,
    consolidados: alunosCalculados.filter((aluno) => aluno.faixa === "consolidado").length,
    emDesenvolvimento: alunosCalculados.filter(
      (aluno) => aluno.faixa === "desenvolvimento"
    ).length,
    precisamDeApoio: alunosCalculados.filter((aluno) => aluno.faixa === "apoio").length,
  };
}
