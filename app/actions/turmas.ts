"use server";

import { pool } from "@/app/src/db";
import { exigirSessao, obterSessao } from "@/app/src/lib/session";
import {
  calcularDesempenhoTurma,
  obterPeriodoLetivo,
  AvaliacaoParaDesempenho,
  RespostaParaDesempenho,
} from "@/app/src/lib/desempenho";
import { EstruturaQuestao } from "@/app/src/types";

export type TurmaItem = {
  id: string; // Código de 8 caracteres (ex: N9AD154Z)
  nome: string;
  professorId: number;
  criadoEm: string;
  totalAlunos: number;
  totalAvaliacoes: number;
};

export type AlunoTurma = {
  id: number;
  nome: string;
};

export type DesempenhoTurma = {
  id: string;
  nome: string;
  ano: number;
  bimestre: number | null;
  anosDisponiveis: number[];
  totalAvaliacoes: number;
  mediaTurma: number | null;
  consolidados: number;
  emDesenvolvimento: number;
  precisamDeApoio: number;
  alunos: {
    id: number;
    nome: string;
    avatarId: string;
    matricula: string;
    totalAvaliacoes: number;
    totalRespondidas: number;
    totalAcertos: number;
    totalCampos: number;
    percentual: number | null;
    faixa: "consolidado" | "desenvolvimento" | "apoio" | "sem-avaliacao";
    avaliacoes: {
      id: string;
      criadoEm: string;
      totalAcertos: number;
      totalCampos: number;
      percentual: number | null;
    }[];
  }[];
};

export async function obterDesempenhoDaTurma(
  turmaId: string,
  ano: number,
  bimestre: number | null
): Promise<{ ok?: boolean; erro?: string; desempenho?: DesempenhoTurma }> {
  try {
    const sessao = await exigirSessao("professor");
    const professorId = Number(sessao.id);

    if (!turmaId.trim()) return { erro: "Turma inválida." };
    if (!Number.isInteger(ano) || ano < 2000 || ano > 9999) {
      return { erro: "Ano letivo inválido." };
    }
    if (bimestre !== null && ![1, 2, 3, 4].includes(bimestre)) {
      return { erro: "Bimestre inválido." };
    }

    const turmaRes = await pool.query<{ id: string; nome: string }>(
      `SELECT id, nome
         FROM turmas
        WHERE id = $1 AND professor_id = $2 AND arquivada_em IS NULL
        LIMIT 1`,
      [turmaId, professorId]
    );

    if (turmaRes.rowCount === 0) {
      return { erro: "Turma não encontrada ou acesso não autorizado." };
    }

    const alunosRes = await pool.query<{
      id: number;
      nome: string;
      matricula: string;
      avatar_id: string;
    }>(
      `SELECT id, nome, matricula, avatar_id
         FROM alunos
        WHERE turma_id = $1 AND ativo = true
        ORDER BY nome ASC`,
      [turmaId]
    );

    const avaliacoesRes = await pool.query<{
      id: string;
      criado_em: string;
      conteudo: { questoes?: EstruturaQuestao[] } | null;
    }>(
      `SELECT id, criado_em, conteudo
         FROM avaliacoes
        WHERE turma_id = $1 AND ativo = true
        ORDER BY criado_em DESC`,
      [turmaId]
    );

    const todasAvaliacoes: AvaliacaoParaDesempenho[] = avaliacoesRes.rows.map((row) => ({
      id: String(row.id),
      criadoEm: new Date(row.criado_em).toISOString(),
      questoes: row.conteudo?.questoes ?? [],
    }));

    const anosDisponiveis = Array.from(
      new Set(todasAvaliacoes.map((avaliacao) => obterPeriodoLetivo(avaliacao.criadoEm).ano))
    ).sort((a, b) => b - a);
    if (!anosDisponiveis.includes(ano)) anosDisponiveis.unshift(ano);

    const avaliacoesPeriodo = todasAvaliacoes.filter((avaliacao) => {
      const periodo = obterPeriodoLetivo(avaliacao.criadoEm);
      return periodo.ano === ano && (bimestre === null || periodo.bimestre === bimestre);
    });

    const idsAvaliacoes = avaliacoesPeriodo.map((avaliacao) => avaliacao.id);
    const idsAlunos = alunosRes.rows.map((aluno) => aluno.id);
    let respostas: RespostaParaDesempenho[] = [];

    if (idsAvaliacoes.length > 0 && idsAlunos.length > 0) {
      const respostasRes = await pool.query<{
        avaliacao_id: string;
        aluno_id: number;
        respostas: Record<string, string | number>;
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

    const resultado = calcularDesempenhoTurma(
      alunosRes.rows.map(({ id, nome, matricula }) => ({ id, nome, matricula })),
      avaliacoesPeriodo,
      respostas
    );
    const avatarIdPorAluno = new Map(
      alunosRes.rows.map((aluno) => [aluno.id, aluno.avatar_id])
    );
    const alunosComAvatar = resultado.alunos.map((aluno) => {
      const avatarId = avatarIdPorAluno.get(aluno.id);
      if (!avatarId) {
        throw new Error(`Avatar não encontrado para o aluno ${aluno.id}.`);
      }
      return { ...aluno, avatarId };
    });

    return {
      ok: true,
      desempenho: {
        id: turmaRes.rows[0].id,
        nome: turmaRes.rows[0].nome,
        ano,
        bimestre,
        anosDisponiveis,
        totalAvaliacoes: avaliacoesPeriodo.length,
        ...resultado,
        alunos: alunosComAvatar,
      },
    };
  } catch (e: unknown) {
    const err = e as Error;
    console.error("Erro ao calcular desempenho da turma:", err);
    return { erro: err.message || "Não foi possível carregar o desempenho da turma." };
  }
}

export async function criarTurma(nome: string): Promise<{
  ok?: boolean;
  erro?: string;
  turma?: TurmaItem;
}> {
  try {
    const sessao = await exigirSessao("professor");
    const professorId = Number(sessao.id);

    const nomeFormatado = typeof nome === "string" ? nome.trim() : "";
    if (!nomeFormatado) {
      return { erro: "Informe o nome da turma (ex: 7º ano A)." };
    }

    if (nomeFormatado.length > 80) {
      return { erro: "O nome da turma deve ter no máximo 80 caracteres." };
    }

    const nomeExistente = await pool.query(
      `SELECT 1
         FROM turmas
        WHERE professor_id = $1
          AND LOWER(BTRIM(nome)) = LOWER(BTRIM($2))
        LIMIT 1`,
      [professorId, nomeFormatado]
    );
    if (nomeExistente.rows.length > 0) {
      return { erro: "Você já possui uma turma com esse nome, inclusive na lixeira." };
    }

    const res = await pool.query<{
      id: string;
      professor_id: number;
      nome: string;
      criado_em: string;
    }>(
      `INSERT INTO turmas (professor_id, nome)
       VALUES ($1, $2)
       RETURNING id, professor_id, nome, criado_em`,
      [professorId, nomeFormatado]
    );

    const row = res.rows[0];

    return {
      ok: true,
      turma: {
        id: row.id,
        nome: row.nome,
        professorId: row.professor_id,
        criadoEm: new Date(row.criado_em).toISOString(),
        totalAlunos: 0,
        totalAvaliacoes: 0,
      },
    };
  } catch (e: unknown) {
    const err = e as Error;
    const erroBanco = e as Error & { code?: string; constraint?: string };
    if (erroBanco.code === "23505" && erroBanco.constraint === "turmas_professor_nome_unico_idx") {
      return { erro: "Você já possui uma turma com esse nome, inclusive na lixeira." };
    }
    console.error("Erro ao criar turma:", err);
    return { erro: err.message || "Não foi possível criar a turma." };
  }
}

export async function listarTurmasProfessor(): Promise<{
  ok?: boolean;
  erro?: string;
  turmas?: TurmaItem[];
}> {
  try {
    const sessao = await exigirSessao("professor");
    const professorId = Number(sessao.id);

    const res = await pool.query<{
      id: string;
      nome: string;
      professor_id: number;
      criado_em: string;
      total_alunos: string;
      total_avaliacoes: string;
    }>(
      `SELECT t.id,
              t.nome,
              t.professor_id,
              t.criado_em,
              COUNT(DISTINCT a.id)::text AS total_alunos,
              COUNT(DISTINCT av.id)::text AS total_avaliacoes
         FROM turmas t
    LEFT JOIN alunos a ON a.turma_id = t.id AND a.ativo = true
    LEFT JOIN avaliacoes av ON av.turma_id = t.id AND av.ativo = true
        WHERE t.professor_id = $1 AND t.arquivada_em IS NULL
        GROUP BY t.id, t.nome, t.professor_id, t.criado_em
        ORDER BY t.criado_em DESC`,
      [professorId]
    );

    const turmas: TurmaItem[] = res.rows.map((r) => ({
      id: r.id,
      nome: r.nome,
      professorId: r.professor_id,
      criadoEm: new Date(r.criado_em).toISOString(),
      totalAlunos: parseInt(r.total_alunos || "0", 10),
      totalAvaliacoes: parseInt(r.total_avaliacoes || "0", 10),
    }));

    return { ok: true, turmas };
  } catch (e: unknown) {
    const err = e as Error;
    console.error("Erro ao listar turmas do professor:", err);
    return { erro: err.message || "Não foi possível buscar as turmas." };
  }
}

export async function obterAlunosDaTurma(turmaId: string): Promise<{
  ok?: boolean;
  erro?: string;
  turmaNome?: string;
  alunos?: AlunoTurma[];
}> {
  try {
    const sessao = await exigirSessao("professor");
    const professorId = Number(sessao.id);

    if (!turmaId) return { erro: "Turma inválida." };

    // Valida que a turma pertence a esse professor
    const turmaVal = await pool.query<{ id: string; nome: string }>(
      `SELECT id, nome FROM turmas
        WHERE id = $1 AND professor_id = $2 AND arquivada_em IS NULL
        LIMIT 1`,
      [turmaId, professorId]
    );

    if (turmaVal.rowCount === 0) {
      return { erro: "Turma não encontrada ou acesso não autorizado." };
    }

    const res = await pool.query<{
      id: number;
      nome: string;
    }>(
      `SELECT id, nome
         FROM alunos
        WHERE turma_id = $1 AND ativo = true
        ORDER BY nome ASC`,
      [turmaId]
    );

    const alunos: AlunoTurma[] = res.rows.map((r) => ({
      id: r.id,
      nome: r.nome,
    }));

    return { ok: true, turmaNome: turmaVal.rows[0].nome, alunos };
  } catch (e: unknown) {
    const err = e as Error;
    console.error("Erro ao obter alunos da turma:", err);
    return { erro: err.message || "Não foi possível carregar os alunos da turma." };
  }
}

export async function obterTurmaDoAluno(): Promise<{
  ok?: boolean;
  erro?: string;
  turma?: { id: string; nome: string };
}> {
  try {
    const sessao = await obterSessao();
    if (!sessao || sessao.perfil !== "aluno" || !sessao.turmaId) {
      return { erro: "Aluno não possui turma vinculada." };
    }

    const res = await pool.query<{ id: string; nome: string }>(
      `SELECT t.id, t.nome
         FROM turmas t
         JOIN alunos a ON a.turma_id = t.id
        WHERE t.id = $1 AND t.arquivada_em IS NULL AND a.id = $2 AND a.ativo = true
        LIMIT 1`,
      [sessao.turmaId, Number(sessao.id)]
    );

    if (res.rowCount === 0) {
      return { erro: "Turma não encontrada." };
    }

    return { ok: true, turma: res.rows[0] };
  } catch (e: unknown) {
    const err = e as Error;
    console.error("Erro ao obter turma do aluno:", err);
    return { erro: err.message || "Erro ao consultar turma." };
  }
}
