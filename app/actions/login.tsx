"use server";

import bcrypt from "bcryptjs";
import { pool } from "@/app/src/db";

type Perfil = "professor" | "aluno";

type DadosLogin = {
  perfil: Perfil;
  email: string;
  senha: string;
};

type ResultadoLogin = {
  ok?: boolean;
  erro?: string;
  usuario?: { id: string; nome: string; email: string; perfil: Perfil };
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const HASH_FALSO =
  "$2a$10$CwTycUXWue0Thq9StjUM0uJ8.9Q8e3Q0xZ0m7vQv8Zk5eQ1Q1Q1Qy";

const MSG_CREDENCIAIS = "E-mail ou senha incorretos.";

export async function loginUsuario(d: DadosLogin): Promise<ResultadoLogin> {
  try {
    if (!d || typeof d !== "object") return { erro: "Dados inválidos." };

    if (d.perfil !== "professor" && d.perfil !== "aluno") {
      return { erro: "Perfil inválido." };
    }

    if (typeof d.email !== "string" || typeof d.senha !== "string") {
      return { erro: "Preencha todos os campos." };
    }

    const email = d.email.trim().toLowerCase();
    const senha = d.senha;

    if (!email || !senha) return { erro: "Preencha todos os campos." };
    if (!EMAIL_REGEX.test(email) || email.length > 254) {
      return { erro: MSG_CREDENCIAIS };
    }
    if (Buffer.byteLength(senha, "utf8") > 72) {
      return { erro: MSG_CREDENCIAIS };
    }

    // Tabela vem de uma whitelist, nunca do input do usuário
    const tabela = d.perfil === "professor" ? "professores" : "alunos";

    const res = await pool.query<{
      id: string;
      nome: string;
      email: string;
      senha_hash: string;
    }>(
      `SELECT id, nome, email, senha_hash
         FROM ${tabela}
        WHERE email = $1
        LIMIT 1`,
      [email]
    );

    const row = res.rows[0];
    const senhaConfere = await bcrypt.compare(senha, row?.senha_hash ?? HASH_FALSO);

    if (!row || !senhaConfere) return { erro: MSG_CREDENCIAIS };

    return {
      ok: true,
      usuario: { id: row.id, nome: row.nome, email: row.email, perfil: d.perfil },
    };
  } catch (e) {
    console.error("Erro no login:", e);
    return { erro: "Não foi possível entrar. Tente novamente." };
  }
}