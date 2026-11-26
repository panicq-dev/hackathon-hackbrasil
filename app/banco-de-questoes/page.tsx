import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { connection } from 'next/server';
import { obterUsuarioAtual } from '@/app/actions/login';
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

  return (
    <BancoQuestoesView
      usuario={usuario}
      questoesIniciais={[]}
      tagsIniciais={[]}
      turmasIniciais={[]}
      filtrosIniciais={{ busca, tag, apenasMinhas, ordenacao }}
    />
  );
}

export default function BancoQuestoesPage({ searchParams }: { searchParams: ParametrosBusca }) {
  return (
    <Suspense fallback={null}>
      <ConteudoBancoQuestoes searchParams={searchParams} />
    </Suspense>
  );
}
