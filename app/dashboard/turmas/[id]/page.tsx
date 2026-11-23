import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { obterSessao } from "@/app/src/lib/session";
import { obterAlunosDaTurma } from "@/app/actions/turmas";
import TurmaAlunosView from "./TurmaAlunosView";

type Props = {
  params: Promise<{ id: string }>;
};

async function ConteudoAlunosTurma({ params }: Props) {
  const { id } = await params;
  const sessao = await obterSessao();

  if (!sessao || sessao.perfil !== "professor") {
    redirect("/login");
  }

  const res = await obterAlunosDaTurma(id);

  if (res.erro) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F6FBFF] p-6 font-['Nunito']">
        <div className="max-w-md rounded-[32px] border-[3px] border-[#0A2E4A] bg-white p-6 text-center shadow-[0_6px_0_0_#0A2E4A]">
          <p className="font-['Baloo_2'] text-base font-extrabold text-[#8A1F1F]">
            {res.erro}
          </p>
          <div className="mt-4">
            <Link
              href="/dashboard"
              className="inline-flex cursor-pointer items-center rounded-full border-2 border-[#0A2E4A] bg-[#FFC53D] px-4 py-2 font-['Baloo_2'] text-xs font-extrabold text-[#0A2E4A] shadow-[0_2px_0_0_#0A2E4A]"
            >
              Voltar ao Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const alunos = res.alunos ?? [];

  return (
    <TurmaAlunosView
      usuario={sessao}
      turmaId={id}
      turmaNome={res.turmaNome ?? `Turma ${id}`}
      alunos={alunos}
    />
  );
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
