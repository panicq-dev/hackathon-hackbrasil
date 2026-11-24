'use server';

import { revalidatePath } from 'next/cache';
import { pool } from '@/app/src/db';
import { obterSessao } from '@/app/src/lib/session';
import { EstruturaQuestao, QuestaoComunidade } from '@/app/src/types';

/**
 * Garante ou busca o ID da tag de matéria na tabela `materias_tag`
 */
async function obterOuCriarMateriaTagId(tagNome: string): Promise<number> {
  const tagNormalizada = (tagNome || 'Geral').trim().toLowerCase();
  
  // Tenta buscar existente
  const resBusca = await pool.query(
    'SELECT id FROM materias_tag WHERE LOWER(tag) = LOWER($1) LIMIT 1',
    [tagNormalizada]
  );

  if (resBusca.rows.length > 0) {
    return resBusca.rows[0].id;
  }

  // Insere se não existir
  const resInsert = await pool.query(
    'INSERT INTO materias_tag (tag) VALUES ($1) ON CONFLICT (tag) DO UPDATE SET tag = EXCLUDED.tag RETURNING id',
    [tagNormalizada]
  );

  return resInsert.rows[0].id;
}

/**
 * Publica uma questão na Comunidade (Banco de Questões público)
 */
export async function publicarQuestaoComunidade(
  questao: EstruturaQuestao,
  tagMateria: string = 'Geral'
): Promise<{ sucesso: boolean; questaoId?: number; erro?: string }> {
  try {
    const sessao = await obterSessao();
    if (!sessao || sessao.perfil !== 'professor') {
      return { sucesso: false, erro: 'Apenas professores podem publicar questões na comunidade.' };
    }

    const professorId = Number(sessao.id);
    const materiaTagId = await obterOuCriarMateriaTagId(tagMateria);

    // Se a questão já tiver um bancoId existente, atualizamos para pública
    if (questao.bancoId) {
      const resUpdate = await pool.query(
        'UPDATE questoes SET publica = true, materia_tag_id = $1 WHERE id = $2 AND professor_id = $3 RETURNING id',
        [materiaTagId, questao.bancoId, professorId]
      );
      if (resUpdate.rows.length > 0) {
        revalidatePath('/banco-de-questoes');
        return { sucesso: true, questaoId: resUpdate.rows[0].id };
      }
    }

    // Insere como nova questão pública
    const resInsert = await pool.query(
      `INSERT INTO questoes (professor_id, materia_tag_id, questao, publica)
       VALUES ($1, $2, $3::jsonb, true)
       RETURNING id`,
      [professorId, materiaTagId, JSON.stringify(questao)]
    );

    revalidatePath('/banco-de-questoes');
    return { sucesso: true, questaoId: resInsert.rows[0].id };
  } catch (error) {
    console.error('Erro ao publicar questão:', error);
    return { sucesso: false, erro: 'Falha ao salvar questão no banco de dados.' };
  }
}

/**
 * Remove a publicação de uma questão da comunidade
 */
export async function despublicarQuestaoComunidade(
  questaoId: number
): Promise<{ sucesso: boolean; erro?: string }> {
  try {
    const sessao = await obterSessao();
    if (!sessao || sessao.perfil !== 'professor') {
      return { sucesso: false, erro: 'Apenas professores podem alterar questões.' };
    }

    const professorId = Number(sessao.id);

    await pool.query(
      'UPDATE questoes SET publica = false WHERE id = $1 AND professor_id = $2',
      [questaoId, professorId]
    );

    revalidatePath('/banco-de-questoes');
    return { sucesso: true };
  } catch (error) {
    console.error('Erro ao despublicar questão:', error);
    return { sucesso: false, erro: 'Falha ao despublicar questão.' };
  }
}

/**
 * Helper para remover acentos em strings para buscas resilientes
 */
function removerAcentos(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

const TRANSLATE_ACENTOS_SQL = `'áàâãäéèêëíìîïóòôõöúùûüç', 'aaaaaeeeeiiiiooooouuuuc'`;

/**
 * Lista as questões públicas da comunidade com contagem de likes/dislikes
 * e garante que questões do próprio professor responsável sempre apareçam
 */
export async function listarQuestoesComunidade(filtros?: {
  busca?: string;
  tag?: string;
  apenasMinhas?: boolean;
  ordenarPor?: 'recentes' | 'populares';
}): Promise<{ sucesso: boolean; questoes?: QuestaoComunidade[]; erro?: string }> {
  try {
    const sessao = await obterSessao();
    const professorId = sessao?.perfil === 'professor' ? Number(sessao.id) : -1;

    let sql = `
      SELECT 
        q.id,
        q.questao,
        q.criado_em as "criadoEm",
        q.professor_id as "professorId",
        COALESCE(p.nome, 'Professor') as "professorNome",
        COALESCE(m.tag, 'Geral') as "materiaTag",
        COALESCE(COUNT(CASE WHEN r.tipo = 'like' THEN 1 END), 0)::int as "likesCount",
        COALESCE(COUNT(CASE WHEN r.tipo = 'dislike' THEN 1 END), 0)::int as "dislikesCount",
        MAX(CASE WHEN r.professor_id = $1 THEN r.tipo ELSE NULL END) as "meuVoto"
      FROM questoes q
      LEFT JOIN professores p ON p.id = q.professor_id
      LEFT JOIN materias_tag m ON m.id = q.materia_tag_id
      LEFT JOIN questoes_reacoes r ON r.questao_id = q.id
      WHERE (q.publica = true OR q.professor_id = $1)
    `;

    const params: (string | number)[] = [professorId];
    let paramIndex = 2;

    // Filtro apenas minhas questões
    if (filtros?.apenasMinhas) {
      sql += ` AND q.professor_id = $1`;
    }

    // Filtro por tag de matéria (insensível a maiúsculas e acentos)
    if (filtros?.tag && filtros.tag !== 'todas') {
      sql += ` AND TRANSLATE(LOWER(TRIM(m.tag)), ${TRANSLATE_ACENTOS_SQL}) = TRANSLATE(LOWER(TRIM($${paramIndex})), ${TRANSLATE_ACENTOS_SQL})`;
      params.push(filtros.tag);
      paramIndex++;
    }

    // Busca textual resiliente (enunciado, json da questão, matéria e nome do professor)
    if (filtros?.busca && filtros.busca.trim()) {
      const termoNormalizado = `%${removerAcentos(filtros.busca.trim())}%`;
      sql += ` AND (
        TRANSLATE(LOWER(COALESCE(q.questao->>'enunciado', '')), ${TRANSLATE_ACENTOS_SQL}) ILIKE $${paramIndex} 
        OR TRANSLATE(LOWER(COALESCE(q.questao::text, '')), ${TRANSLATE_ACENTOS_SQL}) ILIKE $${paramIndex}
        OR TRANSLATE(LOWER(COALESCE(m.tag, '')), ${TRANSLATE_ACENTOS_SQL}) ILIKE $${paramIndex}
        OR TRANSLATE(LOWER(COALESCE(p.nome, '')), ${TRANSLATE_ACENTOS_SQL}) ILIKE $${paramIndex}
      )`;
      params.push(termoNormalizado);
      paramIndex++;
    }

    sql += ` GROUP BY q.id, q.questao, q.criado_em, q.professor_id, p.nome, m.tag`;

    if (filtros?.ordenarPor === 'populares') {
      sql += ` ORDER BY
        COUNT(CASE WHEN r.tipo = 'like' THEN 1 END) -
        COUNT(CASE WHEN r.tipo = 'dislike' THEN 1 END) DESC,
        q.criado_em DESC`;
    } else {
      sql += ` ORDER BY q.criado_em DESC`;
    }

    const { rows } = await pool.query(sql, params);

    const questoes: QuestaoComunidade[] = rows.map((r) => ({
      id: r.id,
      questao: typeof r.questao === 'string' ? JSON.parse(r.questao) : r.questao,
      materiaTag: r.materiaTag,
      professorNome: r.professorNome,
      professorId: r.professorId,
      criadoEm: new Date(r.criadoEm).toISOString(),
      likesCount: Number(r.likesCount),
      dislikesCount: Number(r.dislikesCount),
      meuVoto: r.meuVoto,
      ehMinha: r.professorId === professorId,
    }));

    return { sucesso: true, questoes };
  } catch (error) {
    console.error('Erro ao listar questões da comunidade:', error);
    return { sucesso: false, erro: 'Falha ao buscar questões da comunidade.' };
  }
}

/**
 * Registra ou remove voto (like / dislike) do professor
 */
export async function votarQuestao(
  questaoId: number,
  tipo: 'like' | 'dislike'
): Promise<{
  sucesso: boolean;
  likesCount?: number;
  dislikesCount?: number;
  meuVoto?: 'like' | 'dislike' | null;
  erro?: string;
}> {
  try {
    const sessao = await obterSessao();
    if (!sessao || sessao.perfil !== 'professor') {
      return { sucesso: false, erro: 'Apenas professores logados podem votar em questões.' };
    }

    const professorId = Number(sessao.id);

    // Verifica voto atual
    const votoAtualRes = await pool.query(
      'SELECT tipo FROM questoes_reacoes WHERE questao_id = $1 AND professor_id = $2',
      [questaoId, professorId]
    );

    let novoVoto: 'like' | 'dislike' | null = tipo;

    if (votoAtualRes.rows.length > 0) {
      const votoExistente = votoAtualRes.rows[0].tipo;
      if (votoExistente === tipo) {
        // Clicou no mesmo voto: remove a reação (toggle)
        await pool.query(
          'DELETE FROM questoes_reacoes WHERE questao_id = $1 AND professor_id = $2',
          [questaoId, professorId]
        );
        novoVoto = null;
      } else {
        // Trocou o voto (ex: like -> dislike)
        await pool.query(
          'UPDATE questoes_reacoes SET tipo = $1, criado_em = NOW() WHERE questao_id = $2 AND professor_id = $3',
          [tipo, questaoId, professorId]
        );
      }
    } else {
      // Novo voto
      await pool.query(
        'INSERT INTO questoes_reacoes (questao_id, professor_id, tipo) VALUES ($1, $2, $3)',
        [questaoId, professorId, tipo]
      );
    }

    // Retorna os totais atualizados
    const totaisRes = await pool.query(
      `SELECT 
        COALESCE(COUNT(CASE WHEN tipo = 'like' THEN 1 END), 0)::int as "likes",
        COALESCE(COUNT(CASE WHEN tipo = 'dislike' THEN 1 END), 0)::int as "dislikes"
       FROM questoes_reacoes WHERE questao_id = $1`,
      [questaoId]
    );

    return {
      sucesso: true,
      likesCount: Number(totaisRes.rows[0]?.likes ?? 0),
      dislikesCount: Number(totaisRes.rows[0]?.dislikes ?? 0),
      meuVoto: novoVoto,
    };
  } catch (error) {
    console.error('Erro ao votar na questão:', error);
    return { sucesso: false, erro: 'Falha ao computar reação.' };
  }
}

/**
 * Busca questões públicas no banco para reaproveitar na geração de avaliação
 * Reduzindo uso de tokens na IA
 */
export async function buscarQuestoesParaReaproveitar(
  conteudosPrincipais: string,
  quantidadeDesejada: number
): Promise<EstruturaQuestao[]> {
  try {
    if (!conteudosPrincipais || quantidadeDesejada <= 0) return [];

    // Limpa palavras curtas para busca de palavras-chave e normaliza acentos
    const palavras = conteudosPrincipais
      .split(/\s+/)
      .map((p) => removerAcentos(p.replace(/[^a-zA-Z0-9À-ÿ]/g, '').trim()))
      .filter((p) => p.length > 2);

    if (palavras.length === 0) return [];

    // Monta cláusula OR com ILIKE e TRANSLATE para ignorar acentos
    const condicoes = palavras
      .map((_, i) => `(
        TRANSLATE(LOWER(COALESCE(q.questao->>'enunciado', '')), ${TRANSLATE_ACENTOS_SQL}) ILIKE $${i + 1}
        OR TRANSLATE(LOWER(COALESCE(m.tag, '')), ${TRANSLATE_ACENTOS_SQL}) ILIKE $${i + 1}
      )`)
      .join(' OR ');

    const params: (string | number)[] = palavras.map((p) => `%${p}%`);
    params.push(quantidadeDesejada);

    const sql = `
      SELECT 
        q.id,
        q.questao,
        m.tag as "materiaTag",
        COALESCE(COUNT(CASE WHEN r.tipo = 'like' THEN 1 END), 0)::int as "likes",
        COALESCE(COUNT(CASE WHEN r.tipo = 'dislike' THEN 1 END), 0)::int as "dislikes"
      FROM questoes q
      JOIN materias_tag m ON m.id = q.materia_tag_id
      LEFT JOIN questoes_reacoes r ON r.questao_id = q.id
      WHERE q.publica = true AND (${condicoes})
      GROUP BY q.id, q.questao, m.tag
      ORDER BY (
        COALESCE(COUNT(CASE WHEN r.tipo = 'like' THEN 1 END), 0) -
        COALESCE(COUNT(CASE WHEN r.tipo = 'dislike' THEN 1 END), 0)
      ) DESC, q.criado_em DESC
      LIMIT $${params.length}
    `;

    const { rows } = await pool.query(sql, params);

    return rows.map((r) => {
      const q: EstruturaQuestao = typeof r.questao === 'string' ? JSON.parse(r.questao) : r.questao;
      return {
        ...q,
        bancoId: r.id,
        publicadaNaComunidade: true,
      };
    });
  } catch (error) {
    console.error('Erro ao buscar questões para reaproveitar:', error);
    return [];
  }
}

/**
 * Lista todas as tags de matéria cadastradas para filtro
 */
export async function listarTagsMaterias(): Promise<string[]> {
  try {
    const { rows } = await pool.query(
      'SELECT DISTINCT tag FROM materias_tag ORDER BY tag ASC'
    );
    return rows.map((r) => r.tag);
  } catch (error) {
    console.error('Erro ao buscar tags de matéria:', error);
    return [];
  }
}

/**
 * Cria uma nova avaliação a partir de questões selecionadas na comunidade (Zero Tokens!)
 */
export async function criarAvaliacaoComQuestoesBanco(
  questoesBancoIds: number[],
  turmaId?: string
): Promise<{ sucesso: boolean; avaliacaoId?: string; erro?: string }> {
  try {
    const sessao = await obterSessao();
    if (!sessao || sessao.perfil !== 'professor') {
      return { sucesso: false, erro: 'Apenas professores podem criar avaliações.' };
    }

    if (!questoesBancoIds || questoesBancoIds.length === 0) {
      return { sucesso: false, erro: 'Nenhuma questão selecionada.' };
    }

    const { rows } = await pool.query(
      'SELECT id, questao FROM questoes WHERE id = ANY($1::int[])',
      [questoesBancoIds]
    );

    if (rows.length === 0) {
      return { sucesso: false, erro: 'Questões não encontradas.' };
    }

    const questoes: EstruturaQuestao[] = rows.map((r) => {
      const q = typeof r.questao === 'string' ? JSON.parse(r.questao) : r.questao;
      return {
        ...q,
        bancoId: r.id,
        publicadaNaComunidade: true,
      };
    });

    const conteudo = { questoes };
    const professorId = Number(sessao.id);
    const turmaFinal = turmaId && turmaId.trim() ? turmaId.trim() : null;

    const resInsert = await pool.query(
      `INSERT INTO avaliacoes (conteudo, professor_id, turma_id)
       VALUES ($1::jsonb, $2, $3)
       RETURNING id`,
      [JSON.stringify(conteudo), professorId, turmaFinal]
    );

    return { sucesso: true, avaliacaoId: resInsert.rows[0].id };
  } catch (error) {
    console.error('Erro ao criar avaliação com questões do banco:', error);
    return { sucesso: false, erro: 'Falha ao salvar avaliação.' };
  }
}
