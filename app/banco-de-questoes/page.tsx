import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { obterUsuarioAtual } from '@/app/actions/login';
import BancoQuestoesView from './BancoQuestoesView';

async function ConteudoBancoQuestoes() {
  const usuario = await obterUsuarioAtual();

  if (!usuario) {
    redirect('/login');
  }

  return <BancoQuestoesView usuario={usuario} />;
}

export default function BancoQuestoesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#F6FBFF]">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#0A2E4A] border-t-[#2496ED]" />
        </div>
      }
    >
      <ConteudoBancoQuestoes />
    </Suspense>
  );
}
