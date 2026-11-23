import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { obterSessao } from "@/app/src/lib/session";
import { obterAlunosDaTurma } from "@/app/actions/turmas";

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
      <div className="mx-auto max-w-2xl p-8 font-sans">
        <Link href="/dashboard" className="text-blue-600 hover:underline text-sm">
          &larr; Voltar para o dashboard
        </Link>
        <p className="mt-4 text-red-600">{res.erro}</p>
      </div>
    );
  }

  const alunos = res.alunos ?? [];

  return (
    <div className="mx-auto max-w-2xl p-8 font-sans">
      <Link href="/dashboard" className="text-sm text-blue-600 hover:underline">
        &larr; Voltar
      </Link>

      <h1 className="mt-4 text-2xl font-bold text-gray-900">
        {res.turmaNome ?? `Turma ${id}`}
      </h1>
      <p className="text-sm text-gray-500 mb-6">Código: {id}</p>

      <h2 className="text-base font-semibold text-gray-800 mb-2">
        Alunos ({alunos.length})
      </h2>

      {alunos.length === 0 ? (
        <p className="text-gray-500 text-sm">Nenhum aluno cadastrado nesta turma.</p>
      ) : (
        <ul className="divide-y divide-gray-200 border-t border-b border-gray-200">
          {alunos.map((a) => (
            <li key={a.id} className="py-2.5 text-base text-gray-800">
              {a.nome}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function PaginaAlunosTurma({ params }: Props) {
  return (
    <Suspense
      fallback={
        <div className="p-8 font-sans text-gray-500">Carregando...</div>
      }
    >
      <ConteudoAlunosTurma params={params} />
    </Suspense>
  );
}
