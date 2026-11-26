import { Suspense } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { obterUsuarioAtual } from "@/app/actions/login";
import AbaAvaliacao from "@/app/src/pages/AbaAvaliacao";

async function ConteudoAvaliacoes() {
  await connection();
  const usuario = await obterUsuarioAtual();

  if (!usuario) {
    redirect("/login");
  }

  return <AbaAvaliacao usuarioInicial={usuario} />;
}

export default function AvaliacoesPage() {
  return (
    <Suspense
      fallback={null}>
      <ConteudoAvaliacoes />
    </Suspense>
  );
}