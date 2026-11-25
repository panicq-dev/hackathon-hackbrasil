import { Suspense } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { obterSessao } from "@/app/src/lib/session";
import AlunoDetalheView from "./AlunoDetalheView";

type Props = {
  params: Promise<{ id: string; alunoId: string }>;
  searchParams: Promise<{ ano?: string | string[]; bimestre?: string | string[] }>;
};

function primeiroValor(valor: string | string[] | undefined): string | undefined {
  return Array.isArray(valor) ? valor[0] : valor;
}

function lerAno(valor: string | string[] | undefined): number {
  const ano = Number(primeiroValor(valor));
  return Number.isInteger(ano) && ano >= 2000 && ano <= 9999 ? ano : new Date().getFullYear();
}

function lerBimestre(valor: string | string[] | undefined): number | null {
  const bimestre = Number(primeiroValor(valor));
  return [1, 2, 3, 4].includes(bimestre) ? bimestre : null;
}

async function ConteudoDetalheAluno({ params, searchParams }: Props) {
  await connection();
  const [rota, filtros, sessao] = await Promise.all([
    params,
    searchParams,
    obterSessao(),
  ]);

  if (!sessao || sessao.perfil !== "professor") redirect("/login");

  return (
    <AlunoDetalheView
      turmaId={rota.id}
      alunoId={rota.alunoId}
      usuario={sessao}
      anoInicial={lerAno(filtros.ano)}
      bimestreInicial={lerBimestre(filtros.bimestre)}
    />
  );
}

export default function PaginaDetalheAluno({ params, searchParams }: Props) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#F6FBFF]">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#0A2E4A] border-t-[#2496ED]" />
        </div>
      }
    >
      <ConteudoDetalheAluno params={params} searchParams={searchParams} />
    </Suspense>
  );
}