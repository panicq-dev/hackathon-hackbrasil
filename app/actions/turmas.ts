"use server";

import { pool } from "@/app/src/db";
import { exigirSessao, obterSessao } from "@/app/src/lib/session";

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
  email: string;
  matricula: string;
  criadoEm: string;
};

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
    LEFT JOIN alunos a ON a.turma_id = t.id
    LEFT JOIN avaliacoes av ON av.turma_id = t.id
        WHERE t.professor_id = $1
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
  alunos?: AlunoTurma[];
}> {
  try {
    const sessao = await exigirSessao("professor");
    const professorId = Number(sessao.id);

    if (!turmaId) return { erro: "Turma inválida." };

    // Valida que a turma pertence a esse professor
    const turmaVal = await pool.query(
      `SELECT id FROM turmas WHERE id = $1 AND professor_id = $2 LIMIT 1`,
      [turmaId, professorId]
    );

    if (turmaVal.rowCount === 0) {
      return { erro: "Turma não encontrada ou acesso não autorizado." };
    }

    const res = await pool.query<{
      id: number;
      nome: string;
      email: string;
      matricula: string;
      criado_em: string;
    }>(
      `SELECT id, nome, email, matricula, criado_em
         FROM alunos
        WHERE turma_id = $1
        ORDER BY nome ASC`,
      [turmaId]
    );

    const alunos: AlunoTurma[] = res.rows.map((r) => ({
      id: r.id,
      nome: r.nome,
      email: r.email,
      matricula: r.matricula,
      criadoEm: new Date(r.criado_em).toISOString(),
    }));

    return { ok: true, alunos };
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
      `SELECT id, nome FROM turmas WHERE id = $1 LIMIT 1`,
      [sessao.turmaId]
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
