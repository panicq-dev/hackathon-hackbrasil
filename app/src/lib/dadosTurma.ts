import { pool } from "@/app/src/db";
import {
  obterPeriodoLetivo,
  AlunoParaDesempenho,
  AvaliacaoParaDesempenho,
  RespostaParaDesempenho,
} from "./desempenho";
import { EstruturaQuestao } from "@/app/src/types";

export type DadosTurma = {
  turma: { id: string; nome: string };
  alunos: AlunoParaDesempenho[];
  avaliacoes: AvaliacaoParaDesempenho[];
  respostas: RespostaParaDesempenho[];
  anosDisponiveis: number[];
};

function normalizarQuestoes(conteudo: { questoes?: EstruturaQuestao[] } | string | null): EstruturaQuestao[] {
  if (!conteudo) return [];
  const dados = typeof conteudo === "string" ? JSON.parse(conteudo) as { questoes?: EstruturaQuestao[] } : conteudo;
  return Array.isArray(dados.questoes) ? dados.questoes : [];
}

export async function carregarDadosTurma(
  professorId: number,
  turmaId: string,
  ano: number,
  bimestre: number | null
): Promise<DadosTurma | null> {
  if (!Number.isInteger(professorId) || !turmaId.trim()) return null;
  if (!Number.isInteger(ano) || ano < 2000 || ano > 9999) {
    throw new Error("Ano letivo inválido.");
  }
  if (bimestre !== null && ![1, 2, 3, 4].includes(bimestre)) {
    throw new Error("Bimestre inválido.");
  }

  const turmaRes = await pool.query<{ id: string; nome: string }>(
    `SELECT id, nome
       FROM turmas
      WHERE id = $1 AND professor_id = $2
      LIMIT 1`,
    [turmaId, professorId]
  );
  const turma = turmaRes.rows[0];
  if (!turma) return null;

  const [alunosRes, avaliacoesRes] = await Promise.all([
    pool.query<{ id: number; nome: string; matricula: string }>(
      `SELECT id, nome, matricula
         FROM alunos
        WHERE turma_id = $1
        ORDER BY nome ASC`,
      [turmaId]
    ),
    pool.query<{
      id: string;
      criado_em: string;
      conteudo: { questoes?: EstruturaQuestao[] } | string | null;
    }>(
      `SELECT id, criado_em, conteudo
         FROM avaliacoes
        WHERE turma_id = $1
        ORDER BY criado_em DESC`,
      [turmaId]
    ),
  ]);

  const todasAvaliacoes: AvaliacaoParaDesempenho[] = avaliacoesRes.rows.map((row) => ({
    id: String(row.id),
    criadoEm: new Date(row.criado_em).toISOString(),
    questoes: normalizarQuestoes(row.conteudo),
  }));
  const anosDisponiveis = Array.from(new Set(
    todasAvaliacoes.map((avaliacao) => obterPeriodoLetivo(avaliacao.criadoEm).ano)
  )).sort((a, b) => b - a);
  if (!anosDisponiveis.includes(ano)) anosDisponiveis.unshift(ano);

  const avaliacoes = todasAvaliacoes.filter((avaliacao) => {
    const periodo = obterPeriodoLetivo(avaliacao.criadoEm);
    return periodo.ano === ano && (bimestre === null || periodo.bimestre === bimestre);
  });
  const idsAvaliacoes = avaliacoes.map((avaliacao) => avaliacao.id);
  const idsAlunos = alunosRes.rows.map((aluno) => aluno.id);
  let respostas: RespostaParaDesempenho[] = [];

  if (idsAvaliacoes.length > 0 && idsAlunos.length > 0) {
    const respostasRes = await pool.query<{
      avaliacao_id: string;
      aluno_id: number;
      respostas: Record<string, string | number> | null;
    }>(
      `SELECT avaliacao_id, aluno_id, respostas
         FROM respostas_avaliacoes
        WHERE avaliacao_id = ANY($1::uuid[])
          AND aluno_id = ANY($2::integer[])`,
      [idsAvaliacoes, idsAlunos]
    );
    respostas = respostasRes.rows.map((row) => ({
      avaliacaoId: String(row.avaliacao_id),
      alunoId: row.aluno_id,
      respostas: row.respostas ?? {},
    }));
  }

  return {
    turma: { id: turma.id, nome: turma.nome },
    alunos: alunosRes.rows,
    avaliacoes,
    respostas,
    anosDisponiveis,
  };
}