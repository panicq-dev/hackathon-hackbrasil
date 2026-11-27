"use server";

import { pool } from "@/app/src/db";
import { AVATARES_PERFIL } from "@/app/src/lib/avataresPerfil";
import type { AvatarPerfilId } from "@/app/src/lib/avataresPerfil";
import { criarSessao, obterSessao } from "@/app/src/lib/session";

export type AvatarDisponivel = {
  id: AvatarPerfilId;
  nome: string;
};

function obterTabelaPerfil(perfil: "professor" | "aluno") {
  return perfil === "professor" ? "professores" : "alunos";
}

export async function obterConfiguracaoAvatar(): Promise<{
  avatarId?: string;
  avatares?: AvatarDisponivel[];
  erro?: string;
}> {
  try {
    const sessao = await obterSessao();
    if (!sessao) return { erro: "Faça login para acessar as configurações." };

    const idUsuario = Number(sessao.id);
    if (!Number.isSafeInteger(idUsuario) || idUsuario <= 0) {
      return { erro: "Não foi possível identificar a conta." };
    }

    const tabela = obterTabelaPerfil(sessao.perfil);
    const [usuario, avatares] = await Promise.all([
      pool.query<{ avatar_id: string }>(
        `SELECT avatar_id FROM ${tabela} WHERE id = $1 LIMIT 1`,
        [idUsuario]
      ),
      pool.query<AvatarDisponivel>(
        "SELECT id, nome FROM avatares_perfil ORDER BY ordem"
      ),
    ]);

    if (!usuario.rows[0]) return { erro: "A conta não foi encontrada." };
    const avataresPorId = new Map(avatares.rows.map((avatar) => [avatar.id, avatar]));
    const opcoesDisponiveis = AVATARES_PERFIL.flatMap((avatar) => {
      const cadastrado = avataresPorId.get(avatar.id);
      return cadastrado ? [cadastrado] : [];
    });

    if (opcoesDisponiveis.length < 15) {
      console.error("O catálogo de avatares está incompleto:", opcoesDisponiveis.length);
      return { erro: "O catálogo de avatares ainda não está disponível. Tente novamente mais tarde." };
    }

    return {
      avatarId: usuario.rows[0].avatar_id,
      avatares: opcoesDisponiveis,
    };
  } catch (erro) {
    console.error("Erro ao carregar as configurações de avatar:", erro);
    return { erro: "Não foi possível carregar as configurações. Tente novamente." };
  }
}

export async function salvarAvatarPerfil(avatarId: string): Promise<{
  avatarId?: string;
  erro?: string;
}> {
  try {
    if (
      typeof avatarId !== "string" ||
      !AVATARES_PERFIL.some((avatar) => avatar.id === avatarId)
    ) {
      return { erro: "Selecione um avatar disponível." };
    }

    const sessao = await obterSessao();
    if (!sessao) return { erro: "Sua sessão expirou. Entre novamente." };

    const idUsuario = Number(sessao.id);
    if (!Number.isSafeInteger(idUsuario) || idUsuario <= 0) {
      return { erro: "Não foi possível identificar a conta." };
    }

    const tabela = obterTabelaPerfil(sessao.perfil);
    const resultado = await pool.query<{ avatar_id: string }>(
      `UPDATE ${tabela}
          SET avatar_id = $1
        WHERE id = $2
        RETURNING avatar_id`,
      [avatarId, idUsuario]
    );

    if (!resultado.rows[0]) return { erro: "A conta não foi encontrada." };

    await criarSessao({ ...sessao, avatarId: resultado.rows[0].avatar_id });

    return { avatarId: resultado.rows[0].avatar_id };
  } catch (erro) {
    console.error("Erro ao salvar avatar do perfil:", erro);
    return { erro: "Não foi possível salvar o avatar. Tente novamente." };
  }
}
