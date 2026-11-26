import { Suspense } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { obterSessao } from "@/app/src/lib/session";
import DashboardTurmaView from "./DashboardTurmaView";

type Props = {
  params: Promise<{ id: string }>;
};

async function ConteudoAlunosTurma({ params }: Props) {
  await connection();
  const { id } = await params;
  const sessao = await obterSessao();

  if (!sessao || sessao.perfil !== "professor") {
    redirect("/login");
  }

  return <DashboardTurmaView turmaId={id} usuario={sessao} />;
}

export default function PaginaAlunosTurma({ params }: Props) {
  return (
    <Suspense fallback={null}>
      <ConteudoAlunosTurma params={params} />
    </Suspense>
  );
}
