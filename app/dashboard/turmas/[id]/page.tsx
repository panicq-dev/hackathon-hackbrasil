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
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#F6FBFF]">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#0A2E4A] border-t-[#2496ED]" />
        </div>
      }
    >
      <ConteudoAlunosTurma params={params} />
    </Suspense>
  );
}
