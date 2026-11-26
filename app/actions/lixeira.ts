"use server";

import { randomUUID } from "node:crypto";
import type { PoolClient } from "pg";
import { pool } from "@/app/src/db";
import { exigirSessao } from "@/app/src/lib/session";

export type TipoItemLixeira = "turma" | "aluno" | "avaliacao";

export type ItemLixeiraProfessor = {
  tipo: TipoItemLixeira;
  id: string;
  nome: string;
  turmaNome: string | null;
  arquivadaEm: string;
  alunosInativados?: number;
  turmaArquivada?: boolean;
};

type ResultadoAcao = { ok?: boolean; erro?: string };

async function emTransacao<T>(operacao: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const resultado = await operacao(client);
    await client.query("COMMIT");
    return resultado;
  } catch (erro) {
    try {
      await client.query("ROLLBACK");
    } catch (erroRollback) {
      console.error("Erro ao reverter transação da lixeira:", erroRollback);
    }
    throw erro;
  } finally {
    client.release();
  }
}

function idAlunoValido(id: string): number | null {
  if (!/^[1-9]\d*$/.test(id)) return null;
  const numero = Number(id);
  return Number.isSafeInteger(numero) ? numero : null;
}

export async function listarLixeiraProfessor(): Promise<{
  ok?: boolean;
  erro?: string;
  itens?: ItemLixeiraProfessor[];
}> {
  try {
    const sessao = await exigirSessao("professor");
    const professorId = Number(sessao.id);
    const [turmas, alunos, avaliacoes] = await Promise.all([
      pool.query<{
        id: string;
        nome: string;
        arquivada_em: string;
        alunos_inativados: number;
      }>(
        `SELECT t.id,
                t.nome,
                t.arquivada_em,
                (SELECT COUNT(*)::int
                   FROM alunos a
                  WHERE a.turma_id = t.id
                    AND a.ativo = false
                    AND a.lixeira_id = t.lixeira_id) AS alunos_inativados
           FROM turmas t
          WHERE t.professor_id = $1 AND t.arquivada_em IS NOT NULL
          ORDER BY t.arquivada_em DESC`,
        [professorId]
      ),
      pool.query<{
        id: number;
        nome: string;
        turma_nome: string;
        arquivada_em: string;
        turma_arquivada: boolean;
      }>(
        `SELECT a.id,
                a.nome,
                t.nome AS turma_nome,
                a.arquivada_em,
                (t.arquivada_em IS NOT NULL) AS turma_arquivada
           FROM alunos a
           JOIN turmas t ON t.id = a.turma_id
          WHERE t.professor_id = $1
            AND a.ativo = false
            AND a.lixeira_id IS NOT NULL
          ORDER BY a.arquivada_em DESC`,
        [professorId]
      ),
      pool.query<{
        id: string;
        arquivada_em: string;
        turma_nome: string | null;
        turma_arquivada: boolean;
      }>(
        `SELECT a.id,
                a.arquivada_em,
                t.nome AS turma_nome,
                (t.arquivada_em IS NOT NULL) AS turma_arquivada
           FROM avaliacoes a
      LEFT JOIN turmas t ON t.id = a.turma_id
          WHERE (a.professor_id = $1 OR t.professor_id = $1)
            AND a.ativo = false
            AND a.lixeira_id IS NOT NULL
          ORDER BY a.arquivada_em DESC`,
        [professorId]
      ),
    ]);

    const itens: ItemLixeiraProfessor[] = [
      ...turmas.rows.map((item) => ({
        tipo: "turma" as const,
        id: item.id,
        nome: item.nome,
        turmaNome: null,
        arquivadaEm: new Date(item.arquivada_em).toISOString(),
        alunosInativados: item.alunos_inativados,
      })),
      ...alunos.rows.map((item) => ({
        tipo: "aluno" as const,
        id: String(item.id),
        nome: item.nome,
        turmaNome: item.turma_nome,
        arquivadaEm: new Date(item.arquivada_em).toISOString(),
        turmaArquivada: item.turma_arquivada,
      })),
      ...avaliacoes.rows.map((item) => ({
        tipo: "avaliacao" as const,
        id: String(item.id),
        nome: `Avaliação #${String(item.id).slice(0, 8)}`,
        turmaNome: item.turma_nome,
        arquivadaEm: new Date(item.arquivada_em).toISOString(),
        turmaArquivada: item.turma_arquivada,
      })),
    ].sort((a, b) => Date.parse(b.arquivadaEm) - Date.parse(a.arquivadaEm));

    return { ok: true, itens };
  } catch (erro) {
    console.error("Erro ao listar lixeira do professor:", erro);
    return { erro: "Não foi possível carregar a lixeira." };
  }
}

export async function enviarParaLixeira(
  tipo: TipoItemLixeira,
  id: string
): Promise<ResultadoAcao> {
  try {
    const sessao = await exigirSessao("professor");
    const professorId = Number(sessao.id);
    const lixeiraId = randomUUID();

    return await emTransacao(async (client) => {
      if (tipo === "turma") {
        const turma = await client.query(
          `SELECT id FROM turmas
            WHERE id = $1 AND professor_id = $2 AND arquivada_em IS NULL
            FOR UPDATE`,
          [id, professorId]
        );
        if (turma.rowCount === 0) return { erro: "Turma não encontrada ou já arquivada." };

        await client.query(
          `UPDATE turmas
              SET arquivada_em = NOW(), lixeira_id = $1
            WHERE id = $2`,
          [lixeiraId, id]
        );
        await client.query(
          `UPDATE alunos
              SET ativo = false, arquivada_em = NOW(), lixeira_id = $1
            WHERE turma_id = $2 AND ativo = true`,
          [lixeiraId, id]
        );
        await client.query(
          `UPDATE avaliacoes
              SET ativo = false, arquivada_em = NOW(), lixeira_id = $1
            WHERE turma_id = $2 AND ativo = true`,
          [lixeiraId, id]
        );
        return { ok: true };
      }

      if (tipo === "aluno") {
        const alunoId = idAlunoValido(id);
        if (alunoId === null) return { erro: "Identificador do aluno inválido." };
        const aluno = await client.query(
          `SELECT a.id
             FROM alunos a
             JOIN turmas t ON t.id = a.turma_id
            WHERE a.id = $1 AND t.professor_id = $2
              AND a.ativo = true AND t.arquivada_em IS NULL
            FOR UPDATE OF a`,
          [alunoId, professorId]
        );
        if (aluno.rowCount === 0) return { erro: "Aluno não encontrado ou já arquivado." };
        await client.query(
          `UPDATE alunos
              SET ativo = false, arquivada_em = NOW(), lixeira_id = $1
            WHERE id = $2`,
          [lixeiraId, alunoId]
        );
        return { ok: true };
      }

      if (tipo === "avaliacao") {
        const avaliacao = await client.query(
          `SELECT a.id
             FROM avaliacoes a
        LEFT JOIN turmas t ON t.id = a.turma_id
            WHERE a.id = $1
              AND (a.professor_id = $2 OR t.professor_id = $2)
              AND a.ativo = true
              AND (t.id IS NULL OR t.arquivada_em IS NULL)
            FOR UPDATE OF a`,
          [id, professorId]
        );
        if (avaliacao.rowCount === 0) {
          return { erro: "Avaliação não encontrada ou já arquivada." };
        }
        await client.query(
          `UPDATE avaliacoes
              SET ativo = false, arquivada_em = NOW(), lixeira_id = $1
            WHERE id = $2`,
          [lixeiraId, id]
        );
        return { ok: true };
      }

      return { erro: "Tipo de item inválido." };
    });
  } catch (erro) {
    console.error("Erro ao arquivar item:", erro);
    return { erro: "Não foi possível mover o item para a lixeira." };
  }
}

export async function restaurarDaLixeira(
  tipo: TipoItemLixeira,
  id: string
): Promise<ResultadoAcao> {
  try {
    const sessao = await exigirSessao("professor");
    const professorId = Number(sessao.id);

    return await emTransacao(async (client) => {
      if (tipo === "turma") {
        const turma = await client.query<{ lixeira_id: string }>(
          `SELECT lixeira_id FROM turmas
            WHERE id = $1 AND professor_id = $2 AND arquivada_em IS NOT NULL
            FOR UPDATE`,
          [id, professorId]
        );
        const marcador = turma.rows[0]?.lixeira_id;
        if (!marcador) return { erro: "Turma não encontrada na lixeira." };
        await client.query(
          `UPDATE turmas SET arquivada_em = NULL, lixeira_id = NULL WHERE id = $1`,
          [id]
        );
        await client.query(
          `UPDATE alunos
              SET ativo = true, arquivada_em = NULL, lixeira_id = NULL
            WHERE turma_id = $1 AND lixeira_id = $2`,
          [id, marcador]
        );
        await client.query(
          `UPDATE avaliacoes
              SET ativo = true, arquivada_em = NULL, lixeira_id = NULL
            WHERE turma_id = $1 AND lixeira_id = $2`,
          [id, marcador]
        );
        return { ok: true };
      }

      if (tipo === "aluno") {
        const alunoId = idAlunoValido(id);
        if (alunoId === null) return { erro: "Identificador do aluno inválido." };
        const aluno = await client.query(
          `SELECT a.id
             FROM alunos a
             JOIN turmas t ON t.id = a.turma_id
            WHERE a.id = $1 AND t.professor_id = $2
              AND a.ativo = false AND a.lixeira_id IS NOT NULL
            FOR UPDATE OF a`,
          [alunoId, professorId]
        );
        if (aluno.rowCount === 0) return { erro: "Aluno não encontrado na lixeira." };
        await client.query(
          `UPDATE alunos
              SET ativo = true, arquivada_em = NULL, lixeira_id = NULL
            WHERE id = $1`,
          [alunoId]
        );
        return { ok: true };
      }

      if (tipo === "avaliacao") {
        const avaliacao = await client.query(
          `SELECT a.id
             FROM avaliacoes a
        LEFT JOIN turmas t ON t.id = a.turma_id
            WHERE a.id = $1
              AND (a.professor_id = $2 OR t.professor_id = $2)
              AND a.ativo = false AND a.lixeira_id IS NOT NULL
            FOR UPDATE OF a`,
          [id, professorId]
        );
        if (avaliacao.rowCount === 0) {
          return { erro: "Avaliação não encontrada na lixeira ou turma inativa." };
        }
        await client.query(
          `UPDATE avaliacoes
              SET ativo = true, arquivada_em = NULL, lixeira_id = NULL
            WHERE id = $1`,
          [id]
        );
        return { ok: true };
      }

      return { erro: "Tipo de item inválido." };
    });
  } catch (erro) {
    console.error("Erro ao restaurar item da lixeira:", erro);
    return { erro: "Não foi possível restaurar o item." };
  }
}

export async function excluirPermanentementeDaLixeira(
  tipo: TipoItemLixeira,
  id: string
): Promise<ResultadoAcao> {
  try {
    const sessao = await exigirSessao("professor");
    const professorId = Number(sessao.id);

    return await emTransacao(async (client) => {
      if (tipo === "turma") {
        const turma = await client.query(
          `SELECT id FROM turmas
            WHERE id = $1 AND professor_id = $2 AND arquivada_em IS NOT NULL
            FOR UPDATE`,
          [id, professorId]
        );
        if (turma.rowCount === 0) return { erro: "Turma não encontrada na lixeira." };
        await client.query(
          `DELETE FROM respostas_avaliacoes
            WHERE aluno_id IN (SELECT id FROM alunos WHERE turma_id = $1)
               OR avaliacao_id IN (SELECT id FROM avaliacoes WHERE turma_id = $1)`,
          [id]
        );
        await client.query(`DELETE FROM avaliacoes WHERE turma_id = $1`, [id]);
        await client.query(`DELETE FROM alunos WHERE turma_id = $1`, [id]);
        await client.query(`DELETE FROM turmas WHERE id = $1`, [id]);
        return { ok: true };
      }

      if (tipo === "aluno") {
        const alunoId = idAlunoValido(id);
        if (alunoId === null) return { erro: "Identificador do aluno inválido." };
        const aluno = await client.query(
          `SELECT a.id
             FROM alunos a
             JOIN turmas t ON t.id = a.turma_id
            WHERE a.id = $1 AND t.professor_id = $2
              AND a.ativo = false AND a.lixeira_id IS NOT NULL
            FOR UPDATE OF a`,
          [alunoId, professorId]
        );
        if (aluno.rowCount === 0) return { erro: "Aluno não encontrado na lixeira." };
        await client.query(`DELETE FROM respostas_avaliacoes WHERE aluno_id = $1`, [alunoId]);
        await client.query(`DELETE FROM alunos WHERE id = $1`, [alunoId]);
        return { ok: true };
      }

      if (tipo === "avaliacao") {
        const avaliacao = await client.query(
          `SELECT a.id
             FROM avaliacoes a
        LEFT JOIN turmas t ON t.id = a.turma_id
            WHERE a.id = $1
              AND (a.professor_id = $2 OR t.professor_id = $2)
              AND a.ativo = false AND a.lixeira_id IS NOT NULL
            FOR UPDATE OF a`,
          [id, professorId]
        );
        if (avaliacao.rowCount === 0) {
          return { erro: "Avaliação não encontrada na lixeira." };
        }
        await client.query(`DELETE FROM respostas_avaliacoes WHERE avaliacao_id = $1`, [id]);
        await client.query(`DELETE FROM avaliacoes WHERE id = $1`, [id]);
        return { ok: true };
      }

      return { erro: "Tipo de item inválido." };
    });
  } catch (erro) {
    console.error("Erro ao excluir item da lixeira:", erro);
    return { erro: "Não foi possível excluir o item permanentemente." };
  }
}
