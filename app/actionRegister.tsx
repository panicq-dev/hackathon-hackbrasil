"use server";
import bcrypt from "bcryptjs";
import { pool } from "@/app/src/db";

type Dados = {
  perfil: "professor" | "aluno";
  nome: string;
  email: string;
  senha: string;
  idTurma?: string;
  matricula?: string;
};

type Resultado = { ok?: boolean; erro?: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function registrarUsuario(d: Dados): Promise<Resultado> {
  if (!d.nome?.trim() || !d.email?.trim()) {
    return { erro: "Preencha todos os campos." };
  }
  if (d.senha.length < 8) {
    return { erro: "A senha precisa ter pelo menos 8 caracteres." };
  }

  const nome = d.nome.trim();
  const email = d.email.trim().toLowerCase();
  const senhaHash = await bcrypt.hash(d.senha, 10);

  try {
    if (d.perfil === "professor") {
      await pool.query(
        "INSERT INTO professores (nome, email, senha_hash) VALUES ($1, $2, $3)",
        [nome, email, senhaHash]
      );
    } else { 
    // Aluno
      const matricula = d.matricula?.trim() ?? ""; // Puxando matrícula do aluno
      const dbMatricula = await pool.query("SELECT matricula FROM alunos WHERE matricula = $1", [matricula]); // Verificando se matrícula existe
      if (!dbMatricula.rows[0]) {
        return { erro: "Matrícula inválida." };
      }
      const turmaId = d.idTurma?.trim() ?? ""; // Puxando ID da turma
      const dbTurmaId = await pool.query("SELECT id FROM turmas WHERE id = $1", [turmaId]); // Verificando se ID turma existe
      if (!dbTurmaId.rows[0]) {
        return { erro: "ID da turma inválido." };
      }
      await pool.query(
        "INSERT INTO alunos (nome, email, senha_hash, turma_id, matricula) VALUES ($1, $2, $3, $4, $5)",
        [nome, email, senhaHash, turmaId, matricula]
      );
    }
    return { ok: true };
  } catch (e: any) {
    console.error("Erro ao registrar:", e);
    if (e.code === "23505") return { erro: "Este e-mail já está cadastrado." };
    if (e.code === "23503") return { erro: "Turma não encontrada." };
    return { erro: "Não foi possível criar a conta." };
  }
}