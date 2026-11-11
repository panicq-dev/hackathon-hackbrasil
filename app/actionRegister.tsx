"use server";

import bcrypt from "bcryptjs";
import { pool } from "@/app/src/db";

// ==========================================
// 1. TIPOS
// ==========================================

type Perfil = "professor" | "aluno";

type Dados = {
  perfil: Perfil;
  nome: string;
  email: string;
  senha: string;
  idTurma?: string;
  matricula?: string;

  // Compatibilidade temporária com o front-end antigo.
  idMatricula?: string;
};

type Resultado = {
  ok?: boolean;
  erro?: string;
};

// Erro retornado pelo PostgreSQL
type PostgresError = Error & {
  code?: string;
  constraint?: string;
  table?: string;
};

// ==========================================
// 2. CONSTANTES
// ==========================================

// Aceita códigos alfanuméricos de 1 a 8 caracteres (ex: N9AD154Z)
const TURMA_CODE_REGEX = /^[a-z0-9]{1,8}$/i;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ==========================================
// 3. FUNÇÕES AUXILIARES
// ==========================================

function erro(mensagem: string): Resultado {
  return { erro: mensagem };
}

function normalizarEmail(email: string): string {
  return email.trim().toLowerCase();
}

function normalizarNome(nome: string): string {
  return nome.trim().replace(/\s+/g, " ");
}

function identificarErroBanco(e: unknown): Resultado {
  if (!(e instanceof Error)) {
    return erro("Não foi possível criar a conta.");
  }

  const pgError = e as PostgresError;

  console.error("Erro no PostgreSQL:", {
    code: pgError.code,
    constraint: pgError.constraint,
    table: pgError.table,
  });

  // Violação de UNIQUE
  if (pgError.code === "23505") {
    const constraint = pgError.constraint?.toLowerCase() ?? "";

    if (constraint.includes("email")) {
      return erro("Este e-mail já está cadastrado.");
    }

    if (constraint.includes("matricula")) {
      return erro("Esta matrícula já está cadastrada.");
    }

    return erro("Já existe um registro com esses dados.");
  }

  // Violação de FOREIGN KEY
  if (pgError.code === "23503") {
    return erro("A turma informada não foi encontrada.");
  }

  // Violação de NOT NULL
  if (pgError.code === "23502") {
    return erro("Preencha todos os campos obrigatórios.");
  }

  return erro("Não foi possível criar a conta. Tente novamente.");
}

// ==========================================
// 4. REGISTRAR USUÁRIO
// ==========================================

export async function registrarUsuario(d: Dados): Promise<Resultado> {
  try {
    // --------------------------------------
    // VALIDAÇÕES INICIAIS
    // --------------------------------------

    if (!d || typeof d !== "object") {
      return erro("Dados inválidos.");
    }

    if (d.perfil !== "professor" && d.perfil !== "aluno") {
      return erro("Perfil inválido.");
    }

    if (
      typeof d.nome !== "string" ||
      typeof d.email !== "string" ||
      typeof d.senha !== "string"
    ) {
      return erro("Preencha todos os campos.");
    }

    const nome = normalizarNome(d.nome);
    const email = normalizarEmail(d.email);
    const senha = d.senha;

    if (!nome || !email || !senha) {
      return erro("Preencha todos os campos.");
    }

    if (nome.length > 100) {
      return erro("O nome deve ter no máximo 100 caracteres.");
    }

    if (!EMAIL_REGEX.test(email) || email.length > 254) {
      return erro("Informe um e-mail válido.");
    }

    if (senha.length < 8) {
      return erro("A senha precisa ter pelo menos 8 caracteres.");
    }

    // bcrypt possui limite de 72 bytes
    if (Buffer.byteLength(senha, "utf8") > 72) {
      return erro("A senha ultrapassa o limite permitido.");
    }

    // --------------------------------------
    // HASH DA SENHA
    // --------------------------------------

    const senhaHash = await bcrypt.hash(senha, 10);

    // --------------------------------------
    // CADASTRO DO PROFESSOR
    // --------------------------------------

    if (d.perfil === "professor") {
      await pool.query(
        `
          INSERT INTO professores
            (nome, email, senha_hash)
          VALUES
            ($1, $2, $3)
        `,
        [nome, email, senhaHash]
      );

      return { ok: true };
    }

    // --------------------------------------
    // CADASTRO DO ALUNO
    // --------------------------------------

    const turmaId =
      typeof d.idTurma === "string" ? d.idTurma.trim() : "";

    const matricula =
      typeof d.matricula === "string"
        ? d.matricula.trim()
        : typeof d.idMatricula === "string"
        ? d.idMatricula.trim()
        : "";

    if (!turmaId || !matricula) {
      return erro("Informe o ID da turma e a matrícula.");
    }

    if (!TURMA_CODE_REGEX.test(turmaId)) {
      return erro("O ID da turma possui formato inválido.");
    }

    if (matricula.length > 50) {
      return erro("A matrícula deve ter no máximo 50 caracteres.");
    }

    // Verifica se a turma existe
    const turma = await pool.query<{ id: string }>(
      `
        SELECT id
        FROM turmas
        WHERE id = $1
        LIMIT 1
      `,
      [turmaId]
    );

    if (turma.rowCount === 0) {
      return erro("ID da turma inválido.");
    }

    // Insere o aluno
    await pool.query(
      `
        INSERT INTO alunos
          (nome, email, senha_hash, turma_id, matricula)
        VALUES
          ($1, $2, $3, $4, $5)
      `,
      [nome, email, senhaHash, turma.rows[0].id, matricula]
    );

    return { ok: true };
  } catch (e: unknown) {
    return identificarErroBanco(e);
  }
}