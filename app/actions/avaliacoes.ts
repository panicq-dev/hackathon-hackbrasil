"use server";

import { pool } from "@/app/src/db";
import { obterSessao, exigirSessao } from "@/app/src/lib/session";
import { EstruturaQuestao } from "@/app/src/types";

let tabelaInicializada = false;

export async function garantirTabelaRespostas(): Promise<void> {
  if (tabelaInicializada) return;
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS respostas_avaliacoes (
        id SERIAL PRIMARY KEY,
        avaliacao_id UUID NOT NULL REFERENCES avaliacoes(id) ON DELETE CASCADE,
        aluno_id INTEGER NOT NULL REFERENCES alunos(id) ON DELETE CASCADE,
        respostas JSONB NOT NULL,
        criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        UNIQUE(avaliacao_id, aluno_id)
      );
    `);
    tabelaInicializada = true;
  } catch (err) {
    console.error("Erro ao inicializar tabela de respostas:", err);
  }
}

export type AvaliacaoResumida = {
  id: string;
  professorId?: number | null;
  turmaId?: string | null;
  criadoEm: string;
  ativo: boolean;
  questoes: EstruturaQuestao[];
  totalRespostas?: number;
  respondidaPorMim?: boolean;
  minhasRespostas?: Record<string, string | number>;
};

export type RespondenteInfo = {
  alunoId: number;
  nome: string;
  email: string;
  matricula: string;
  turmaId: string;
  enviadoEm: string;
  respostas: Record<string, string | number>;
};

export type DiagnosticoCampo = {
  campoId: string;
  label: string;
  respostaEsperada: string | number;
  respostaAluno: string | number | null;
  correto: boolean;
  erroProvavelSeIncorreto: string | null;
};

export type DiagnosticoQuestao = {
  questaoIndex: number;
  enunciado: string;
  campos: DiagnosticoCampo[];
};

export type AnaliseAluno = {
  aluno: {
    id: number;
    nome: string;
    email: string;
    matricula: string;
    turmaId: string;
  };
  enviadoEm: string;
  diagnostico: DiagnosticoQuestao[];
  totalCampos: number;
  totalAcertos: number;
  porcentagemAcerto: number;
  lacunasIdentificadas: string[];
};

export type RelatorioConsolidado = {
  avaliacao: {
    id: string;
    criadoEm: string;
    turmaId: string | null;
    totalQuestoes: number;
  };
  totalRespondentes: number;
  dataGeracao: string;
  alunos: AnaliseAluno[];
  lacunasGeraisTurma: Record<string, number>;
};

export async function listarAvaliacoes(): Promise<{
  ok?: boolean;
  erro?: string;
  avaliacoes?: AvaliacaoResumida[];
}> {
  try {
    await garantirTabelaRespostas();
    const sessao = await obterSessao();

    if (!sessao) {
      return { erro: "Não autenticado." };
    }

    if (sessao.perfil === "aluno") {
      const alunoId = Number(sessao.id);
      const turmaId = sessao.turmaId ?? "";

      const res = await pool.query<{
        id: string;
        professor_id: number | null;
        turma_id: string | null;
        ativo: boolean;
        criado_em: string;
        conteudo: { questoes?: EstruturaQuestao[] };
        respostas_aluno: Record<string, string | number> | null;
      }>(
        `SELECT a.id, a.professor_id, a.turma_id, a.ativo, a.criado_em, a.conteudo,
                r.respostas as respostas_aluno
           FROM avaliacoes a
      LEFT JOIN respostas_avaliacoes r
             ON r.avaliacao_id = a.id AND r.aluno_id = $1
          WHERE a.ativo = true
            AND (a.turma_id = $2 OR a.turma_id IS NULL OR $2 = '')
          ORDER BY a.criado_em DESC`,
        [alunoId, turmaId]
      );

      const avaliacoes: AvaliacaoResumida[] = res.rows.map((row) => ({
        id: String(row.id),
        professorId: row.professor_id,
        turmaId: row.turma_id,
        ativo: row.ativo,
        criadoEm: new Date(row.criado_em).toISOString(),
        questoes: row.conteudo?.questoes ?? [],
        respondidaPorMim: Boolean(row.respostas_aluno),
        minhasRespostas: row.respostas_aluno ?? undefined,
      }));

      return { ok: true, avaliacoes };
    } else {
      // Professor
      const professorId = Number(sessao.id);

      const res = await pool.query<{
        id: string;
        professor_id: number | null;
        turma_id: string | null;
        ativo: boolean;
        criado_em: string;
        conteudo: { questoes?: EstruturaQuestao[] };
        total_respostas: string;
      }>(
        `SELECT a.id, a.professor_id, a.turma_id, a.ativo, a.criado_em, a.conteudo,
                COUNT(r.id)::text as total_respostas
           FROM avaliacoes a
      LEFT JOIN respostas_avaliacoes r
             ON r.avaliacao_id = a.id
          WHERE (a.professor_id = $1 OR a.professor_id IS NULL)
          GROUP BY a.id, a.professor_id, a.turma_id, a.ativo, a.criado_em, a.conteudo
          ORDER BY a.criado_em DESC`,
        [professorId]
      );

      const avaliacoes: AvaliacaoResumida[] = res.rows.map((row) => ({
        id: String(row.id),
        professorId: row.professor_id,
        turmaId: row.turma_id,
        ativo: row.ativo,
        criadoEm: new Date(row.criado_em).toISOString(),
        questoes: row.conteudo?.questoes ?? [],
        totalRespostas: parseInt(row.total_respostas || "0", 10),
      }));

      return { ok: true, avaliacoes };
    }
  } catch (e) {
    console.error("Erro ao listar avaliações:", e);
    return { erro: "Não foi possível carregar as avaliações." };
  }
}

export async function salvarRespostaAluno(
  avaliacaoId: string,
  respostas: Record<string, string | number>
): Promise<{ ok?: boolean; erro?: string }> {
  try {
    await garantirTabelaRespostas();
    const sessao = await exigirSessao("aluno");
    const alunoId = Number(sessao.id);

    if (!avaliacaoId || typeof avaliacaoId !== "string") {
      return { erro: "Identificador da avaliação inválido." };
    }

    if (!respostas || typeof respostas !== "object") {
      return { erro: "Respostas inválidas." };
    }

    // Verifica se a avaliação existe e está ativa
    const avaliacaoRes = await pool.query<{ id: string; ativo: boolean }>(
      `SELECT id, ativo FROM avaliacoes WHERE id = $1 LIMIT 1`,
      [avaliacaoId]
    );

    if (avaliacaoRes.rowCount === 0) {
      return { erro: "Avaliação não encontrada." };
    }

    if (!avaliacaoRes.rows[0].ativo) {
      return { erro: "Esta avaliação não está mais ativa." };
    }

    // Salva ou atualiza a resposta do aluno
    await pool.query(
      `INSERT INTO respostas_avaliacoes (avaliacao_id, aluno_id, respostas, criado_em)
       VALUES ($1, $2, $3::jsonb, NOW())
       ON CONFLICT (avaliacao_id, aluno_id)
       DO UPDATE SET respostas = EXCLUDED.respostas, criado_em = NOW()`,
      [avaliacaoId, alunoId, JSON.stringify(respostas)]
    );

    return { ok: true };
  } catch (e: unknown) {
    const err = e as Error;
    console.error("Erro ao salvar respostas:", err);
    return { erro: err.message || "Não foi possível registrar as respostas." };
  }
}

export async function obterRespondentes(avaliacaoId: string): Promise<{
  ok?: boolean;
  erro?: string;
  respondentes?: RespondenteInfo[];
}> {
  try {
    await garantirTabelaRespostas();
    await exigirSessao("professor");

    if (!avaliacaoId || typeof avaliacaoId !== "string") {
      return { erro: "Identificador da avaliação inválido." };
    }

    const res = await pool.query<{
      aluno_id: number;
      nome: string;
      email: string;
      matricula: string;
      turma_id: string;
      criado_em: string;
      respostas: Record<string, string | number>;
    }>(
      `SELECT r.aluno_id,
              al.nome,
              al.email,
              al.matricula,
              al.turma_id,
              r.criado_em,
              r.respostas
         FROM respostas_avaliacoes r
         JOIN alunos al ON al.id = r.aluno_id
        WHERE r.avaliacao_id = $1
        ORDER BY r.criado_em DESC`,
      [avaliacaoId]
    );

    const respondentes: RespondenteInfo[] = res.rows.map((r) => ({
      alunoId: r.aluno_id,
      nome: r.nome,
      email: r.email,
      matricula: r.matricula,
      turmaId: r.turma_id,
      enviadoEm: new Date(r.criado_em).toISOString(),
      respostas: r.respostas ?? {},
    }));

    return { ok: true, respondentes };
  } catch (e: unknown) {
    const err = e as Error;
    console.error("Erro ao obter respondentes:", err);
    return { erro: err.message || "Não foi possível carregar os alunos que responderam." };
  }
}

function normalizarTexto(val: string | number | null | undefined): string {
  if (val === null || val === undefined) return "";
  return String(val).trim().toLowerCase().replace(/,/g, ".");
}

function verificarAcerto(esperado: string | number, informado: string | number | null | undefined): boolean {
  if (informado === null || informado === undefined || informado === "") return false;

  const nEsperado = Number(String(esperado).replace(/,/g, "."));
  const nInformado = Number(String(informado).replace(/,/g, "."));

  if (!isNaN(nEsperado) && !isNaN(nInformado)) {
    return Math.abs(nEsperado - nInformado) < 0.0001;
  }

  return normalizarTexto(esperado) === normalizarTexto(informado);
}

export async function obterDadosConsolidadosParaAnalise(avaliacaoId: string): Promise<{
  ok?: boolean;
  erro?: string;
  relatorio?: RelatorioConsolidado;
}> {
  try {
    await garantirTabelaRespostas();
    await exigirSessao("professor");

    if (!avaliacaoId || typeof avaliacaoId !== "string") {
      return { erro: "Identificador da avaliação inválido." };
    }

    const avaliacaoRes = await pool.query<{
      id: string;
      criado_em: string;
      turma_id: string | null;
      conteudo: { questoes?: EstruturaQuestao[] };
    }>(
      `SELECT id, criado_em, turma_id, conteudo
         FROM avaliacoes
        WHERE id = $1
        LIMIT 1`,
      [avaliacaoId]
    );

    if (avaliacaoRes.rowCount === 0) {
      return { erro: "Avaliação não encontrada." };
    }

    const avaliacaoRow = avaliacaoRes.rows[0];
    const questoes: EstruturaQuestao[] = avaliacaoRow.conteudo?.questoes ?? [];

    const respostasRes = await pool.query<{
      aluno_id: number;
      nome: string;
      email: string;
      matricula: string;
      turma_id: string;
      criado_em: string;
      respostas: Record<string, string | number>;
    }>(
      `SELECT r.aluno_id,
              al.nome,
              al.email,
              al.matricula,
              al.turma_id,
              r.criado_em,
              r.respostas
         FROM respostas_avaliacoes r
         JOIN alunos al ON al.id = r.aluno_id
        WHERE r.avaliacao_id = $1
        ORDER BY al.nome ASC`,
      [avaliacaoId]
    );

    const lacunasGerais: Record<string, number> = {};

    const alunosAnalise: AnaliseAluno[] = respostasRes.rows.map((row) => {
      const respostasAluno = row.respostas ?? {};
      let totalCampos = 0;
      let totalAcertos = 0;
      const lacunasAluno: string[] = [];

      const diagnosticoQuestoes: DiagnosticoQuestao[] = questoes.map((q, qIndex) => {
        const mapaErros = new Map<string, string>();
        q.mapeamentoDeErros?.forEach((m) => {
          mapaErros.set(m.id, m.erroProvavel);
        });

        const camposDiagnostico: DiagnosticoCampo[] = q.camposValidacao.map((campo) => {
          totalCampos++;
          const respostaDada = respostasAluno[campo.id] ?? null;
          const acertou = verificarAcerto(campo.respostaCorreta, respostaDada);

          if (acertou) {
            totalAcertos++;
          } else {
            const erroProvavel = mapaErros.get(campo.id) ?? "Conceito Geral do Conteúdo";
            lacunasAluno.push(erroProvavel);
            lacunasGerais[erroProvavel] = (lacunasGerais[erroProvavel] || 0) + 1;
          }

          return {
            campoId: campo.id,
            label: campo.label,
            respostaEsperada: campo.respostaCorreta,
            respostaAluno: respostaDada,
            correto: acertou,
            erroProvavelSeIncorreto: acertou ? null : (mapaErros.get(campo.id) ?? "Conceito Geral"),
          };
        });

        return {
          questaoIndex: qIndex + 1,
          enunciado: q.enunciado,
          campos: camposDiagnostico,
        };
      });

      const porcentagem = totalCampos > 0 ? Math.round((totalAcertos / totalCampos) * 100) : 0;

      return {
        aluno: {
          id: row.aluno_id,
          nome: row.nome,
          email: row.email,
          matricula: row.matricula,
          turmaId: row.turma_id,
        },
        enviadoEm: new Date(row.criado_em).toISOString(),
        diagnostico: diagnosticoQuestoes,
        totalCampos,
        totalAcertos,
        porcentagemAcerto: porcentagem,
        lacunasIdentificadas: Array.from(new Set(lacunasAluno)),
      };
    });

    const relatorio: RelatorioConsolidado = {
      avaliacao: {
        id: avaliacaoRow.id,
        criadoEm: new Date(avaliacaoRow.criado_em).toISOString(),
        turmaId: avaliacaoRow.turma_id,
        totalQuestoes: questoes.length,
      },
      totalRespondentes: alunosAnalise.length,
      dataGeracao: new Date().toISOString(),
      alunos: alunosAnalise,
      lacunasGeraisTurma: lacunasGerais,
    };

    return { ok: true, relatorio };
  } catch (e: unknown) {
    const err = e as Error;
    console.error("Erro ao consolidar análise:", err);
    return { erro: err.message || "Erro ao preparar os dados de análise." };
  }
}
