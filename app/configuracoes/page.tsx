import { Suspense } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { obterUsuarioAtual } from "@/app/actions/login";
import ConfiguracoesView from "./ConfiguracoesView";

async function ConteudoConfiguracoes() {
  await connection();
  const usuario = await obterUsuarioAtual();

  if (!usuario) redirect("/login");

  return <ConfiguracoesView usuario={usuario} />;
}

export default function ConfiguracoesPage() {
  return (
    <Suspense fallback={null}>
      <ConteudoConfiguracoes />
    </Suspense>
  );
}
