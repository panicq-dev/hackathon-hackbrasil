import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { connection } from 'next/server';
import { obterUsuarioAtual } from '@/app/actions/login';
import LixeiraView from './LixeiraView';

async function ConteudoLixeira() {
  await connection();
  const usuario = await obterUsuarioAtual();

  if (!usuario) redirect('/login');
  if (usuario.perfil !== 'professor') redirect('/dashboard');

  return <LixeiraView usuario={usuario} />;
}

export default function LixeiraPage() {
  return (
    <Suspense fallback={null}>
      <ConteudoLixeira />
    </Suspense>
  );
}
