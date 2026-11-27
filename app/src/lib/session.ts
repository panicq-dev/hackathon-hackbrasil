import { cookies } from "next/headers";
import crypto from "crypto";

export type Perfil = "professor" | "aluno";

export type UsuarioSessao = {
  id: number | string;
  nome: string;
  email: string;
  perfil: Perfil;
  turmaId?: string;
  matricula?: string;
  avatarId?: string;
  exp: number;
};

const NOME_COOKIE = "hackbrasil_session";
const SECRET = process.env.SESSION_SECRET || "hackbrasil-chave-secreta-sessao-2026";
const DURACAO_SEGUNDOS = 7 * 24 * 60 * 60; // 7 dias

function assinar(dado: string): string {
  return crypto.createHmac("sha256", SECRET).update(dado).digest("base64url");
}

function serializarToken(payload: Omit<UsuarioSessao, "exp">): string {
  const sessaoComExp: UsuarioSessao = {
    ...payload,
    exp: Date.now() + DURACAO_SEGUNDOS * 1000,
  };
  const jsonStr = JSON.stringify(sessaoComExp);
  const base64Payload = Buffer.from(jsonStr, "utf-8").toString("base64url");
  const assinatura = assinar(base64Payload);
  return `${base64Payload}.${assinatura}`;
}

function desserializarToken(token: string): UsuarioSessao | null {
  try {
    const partes = token.split(".");
    if (partes.length !== 2) return null;

    const [base64Payload, assinaturaRecebida] = partes;
    const assinaturaEsperada = assinar(base64Payload);

    const bufferEsperado = Buffer.from(assinaturaEsperada, "utf-8");
    const bufferRecebido = Buffer.from(assinaturaRecebida, "utf-8");

    if (
      bufferEsperado.length !== bufferRecebido.length ||
      !crypto.timingSafeEqual(bufferEsperado, bufferRecebido)
    ) {
      return null;
    }

    const jsonStr = Buffer.from(base64Payload, "base64url").toString("utf-8");
    const payload = JSON.parse(jsonStr) as UsuarioSessao;

    if (!payload.exp || Date.now() > payload.exp) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export async function criarSessao(dados: Omit<UsuarioSessao, "exp">): Promise<void> {
  const token = serializarToken(dados);
  const cookieStore = await cookies();

  cookieStore.set(NOME_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: DURACAO_SEGUNDOS,
  });
}

export async function obterSessao(): Promise<UsuarioSessao | null> {
  try {
    const cookieStore = await cookies();
    const tokenCookie = cookieStore.get(NOME_COOKIE);
    if (!tokenCookie || !tokenCookie.value) return null;

    return desserializarToken(tokenCookie.value);
  } catch {
    return null;
  }
}

export async function destruirSessao(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(NOME_COOKIE);
}

export async function exigirSessao(perfilPermitido?: Perfil): Promise<UsuarioSessao> {
  const sessao = await obterSessao();
  if (!sessao) {
    throw new Error("Não autorizado: sessão não encontrada.");
  }

  if (perfilPermitido && sessao.perfil !== perfilPermitido) {
    throw new Error(`Não autorizado: perfil '${sessao.perfil}' não tem acesso a este recurso.`);
  }

  return sessao;
}
