import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { connection } from 'next/server';
import { obterUsuarioAtual } from '@/app/actions/login';
import { listarQuestoesComunidade, listarTagsMaterias } from '@/app/actions/questoes';
import { listarTurmasProfessor } from '@/app/actions/turmas';
import BancoQuestoesView from './BancoQuestoesView';

type ParametrosBusca = Promise<Record<string, string | string[] | undefined>>;

function obterParametro(valor: string | string[] | undefined): string | undefined {
  return Array.isArray(valor) ? valor[0] : valor;
}

async function ConteudoBancoQuestoes({ searchParams }: { searchParams: ParametrosBusca }) {
  await connection();
  const usuario = await obterUsuarioAtual();
  const parametros = await searchParams;

  if (!usuario) {
    redirect('/login');
  }

  if (usuario.perfil === 'aluno') {
    redirect('/');
  }

  const busca = obterParametro(parametros.busca) ?? '';
  const tag = obterParametro(parametros.tag) || 'todas';
  const apenasMinhas = obterParametro(parametros.minhas) === 'true';
  const ordenacao =
    obterParametro(parametros.ordenacao) === 'recentes' ? 'recentes' : 'populares';

  const [resQuestoes, tags, resTurmas] = await Promise.all([
    listarQuestoesComunidade({ busca, tag, apenasMinhas, ordenarPor: ordenacao }),
    listarTagsMaterias(),
    listarTurmasProfessor(),
  ]);

  return (
    <BancoQuestoesView
      usuario={usuario}
      questoesIniciais={resQuestoes.questoes ?? []}
      tagsIniciais={tags}
      turmasIniciais={resTurmas.turmas ?? []}
      erroInicial={resQuestoes.sucesso ? '' : resQuestoes.erro}
      filtrosIniciais={{ busca, tag, apenasMinhas, ordenacao }}
    />
  );
}

export default function BancoQuestoesPage({ searchParams }: { searchParams: ParametrosBusca }) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#F6FBFF]">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#0A2E4A] border-t-[#2496ED]" />
        </div>
      }
    >
      <ConteudoBancoQuestoes searchParams={searchParams} />
    </Suspense>
  );
}
