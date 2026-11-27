'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  ArrowLeft,
  Users,
  LogOut,
  LayoutDashboard,
  ClipboardCheck,
  Library,
  Trash2,
  Settings,
} from 'lucide-react';
import { UsuarioSessao } from '@/app/src/lib/session';
import { logoutUsuario } from '@/app/actions/login';
import { AlunoTurma } from '@/app/actions/turmas';
import { enviarParaLixeira } from '@/app/actions/lixeira';
import AvatarPerfil from '@/app/src/componentes/AvatarPerfil';

const BOLINHA =
  'flex h-14 w-14 items-center justify-center rounded-full border-[3px] border-[#0A2E4A] transition motion-safe:duration-200 group-hover:scale-110 group-active:scale-95';

const ROTULO = [
  'pointer-events-none absolute whitespace-nowrap rounded-full border-2 border-[#0A2E4A] bg-[#0A2E4A] px-3 py-1',
  "font-sans text-xs font-extrabold text-white",
  'opacity-0 transition motion-safe:duration-150 group-hover:opacity-100 group-focus-visible:opacity-100',
  'bottom-[calc(100%+12px)] left-1/2 -translate-x-1/2 group-hover:-translate-y-1',
  'md:bottom-auto md:left-[calc(100%+14px)] md:top-1/2 md:-translate-y-1/2 md:translate-x-0 md:group-hover:translate-x-1 md:group-hover:-translate-y-1/2',
].join(' ');

const FOCO =
  'group relative cursor-pointer rounded-full outline-none focus-visible:ring-4 focus-visible:ring-[#1D63ED]/40';

type Props = {
  usuario: UsuarioSessao;
  turmaId: string;
  turmaNome: string;
  alunos: AlunoTurma[];
};

export default function TurmaAlunosView({ usuario, turmaId, turmaNome, alunos }: Props) {
  const router = useRouter();
  const [alunosVisiveis, setAlunosVisiveis] = useState(alunos);
  const [alunoEmOperacao, setAlunoEmOperacao] = useState<number | null>(null);
  const [erroLixeira, setErroLixeira] = useState('');

  async function handleLogout() {
    await logoutUsuario();
    router.replace('/login');
  }

  async function arquivarAluno(aluno: AlunoTurma) {
    if (!window.confirm(`Mover o aluno "${aluno.nome}" para a lixeira?`)) return;
    setAlunoEmOperacao(aluno.id);
    setErroLixeira('');
    try {
      const resultado = await enviarParaLixeira('aluno', String(aluno.id));
      if (resultado.erro) {
        setErroLixeira(resultado.erro);
      } else {
        setAlunosVisiveis((atuais) => atuais.filter((item) => item.id !== aluno.id));
        router.refresh();
      }
    } catch (erro) {
      setErroLixeira(erro instanceof Error ? erro.message : 'Não foi possível mover o aluno para a lixeira.');
    } finally {
      setAlunoEmOperacao(null);
    }
  }

  return (
    <div
      className={[
        'relative min-h-screen overflow-x-clip bg-[#F6FBFF]',
        "font-sans text-[#0A2E4A]",
        'px-5 pb-32 pt-6 md:pl-32 md:pr-10 md:pb-16',
      ].join(' ')}
    >
      {/* manchas de cor de fundo */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-10 h-72 w-72 rounded-[60%_40%_55%_45%] bg-[#BFE3F7]/70 blur-2xl" />
        <div className="absolute right-[-60px] top-1/3 h-80 w-80 rounded-[45%_55%_40%_60%] bg-[#C6EFE9]/70 blur-2xl" />
        <div className="absolute bottom-[-40px] left-1/3 h-64 w-64 rounded-[55%_45%_60%_40%] bg-[#FFEFC2]/80 blur-2xl" />
      </div>

      {/* BARRA SUPERIOR DE SESSÃO */}
      <div className="relative z-30 mx-auto mb-8 max-w-5xl">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-[26px] border-[3px] border-[#0A2E4A] bg-white px-5 py-3 shadow-[0_5px_0_0_#0A2E4A]">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-[#0A2E4A]">
              <AvatarPerfil avatarId={usuario.avatarId} className="h-full w-full" />
            </span>

            <div>
              <div className="flex items-center gap-2">
                <span className="font-sans text-base font-extrabold leading-none text-[#0A2E4A]">
                  {usuario.nome}
                </span>
                <span className="rounded-full border border-[#0A2E4A] bg-[#FFEFC2] px-2.5 py-0.5 font-sans text-xs font-extrabold text-[#0A2E4A]">
                  Professor
                </span>
              </div>
              <p className="text-xs font-bold text-[#4A6B85]">{usuario.email}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            title="Encerrar sessão"
            className="flex cursor-pointer items-center gap-1 rounded-full border-2 border-[#0A2E4A] bg-[#FFE3E3] px-3.5 py-1.5 font-sans text-xs font-extrabold text-[#8A1F1F] shadow-[0_2px_0_0_#0A2E4A] transition hover:brightness-105 active:translate-y-0.5"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Sair</span>
          </button>
        </div>
      </div>

      {/* DOCK DE NAVEGAÇÃO */}
      <nav
        aria-label="Navegação principal"
        className={[
          'fixed z-40 flex gap-2 md:gap-4',
          'bottom-5 left-1/2 -translate-x-1/2 flex-row rounded-full border-[3px] border-[#0A2E4A] bg-white/90 px-4 py-3 shadow-[0_5px_0_0_#0A2E4A] backdrop-blur',
          'md:bottom-auto md:left-6 md:top-1/2 md:-translate-y-1/2 md:translate-x-0 md:flex-col md:px-3 md:py-4',
        ].join(' ')}
      >
        <Link href="/dashboard" aria-label="Dashboard" className={FOCO}>
          <span className={`${BOLINHA} -translate-y-0.5 bg-[#FFC53D] shadow-[0_4px_0_0_#0A2E4A]`}>
            <LayoutDashboard className="h-6 w-6 strokeWidth={2.4}" />
          </span>
          <span className={ROTULO}>Dashboard</span>
        </Link>

        <Link href="/" aria-label="Avaliações" className={FOCO}>
          <span className={`${BOLINHA} bg-white group-hover:bg-[#C6EFE9]`}>
            <ClipboardCheck className="h-6 w-6 strokeWidth={2.4}" />
          </span>
          <span className={ROTULO}>Avaliações</span>
        </Link>

        <Link href="/banco-de-questoes" aria-label="Banco de Questões" className={FOCO}>
          <span className={`${BOLINHA} bg-white group-hover:bg-[#FFD3DB]`}>
            <Library className="h-6 w-6 strokeWidth={2.4}" />
          </span>
          <span className={ROTULO}>Banco de Questões</span>
        </Link>

        <Link href="/configuracoes" aria-label="Configurações" className={FOCO}>
          <span className={`${BOLINHA} bg-white group-hover:bg-[#C6EFE9]`}>
            <Settings className="h-6 w-6" strokeWidth={2.4} />
          </span>
          <span className={ROTULO}>Configurações</span>
        </Link>

        <Link href="/lixeira" aria-label="Lixeira" className={FOCO}>
          <span className={`${BOLINHA} bg-[#FFE3E3] text-red-700 group-hover:bg-[#FFD3DB]`}>
            <Trash2 className="h-6 w-6" />
          </span>
          <span className={ROTULO}>Lixeira</span>
        </Link>
      </nav>

      <main className="relative z-10 mx-auto max-w-5xl space-y-6">
        <div>
          <Link
            href="/dashboard"
            className="inline-flex cursor-pointer items-center gap-2 rounded-full border-2 border-[#0A2E4A] bg-[#FFC53D] px-4 py-2 font-sans text-xs font-extrabold text-[#0A2E4A] shadow-[0_3px_0_0_#0A2E4A] transition hover:brightness-105 active:translate-y-0.5"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Voltar ao Dashboard</span>
          </Link>
        </div>

        <section className="rounded-[32px] border-[3px] border-[#0A2E4A] bg-white p-6 shadow-[0_8px_0_0_#0A2E4A] md:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#0A2E4A]/10 pb-5">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-[#0A2E4A] bg-[#4ECDC4]">
                  <Users className="h-5 w-5 text-[#0A2E4A]" />
                </span>
                <span className="rounded-full border-2 border-[#0A2E4A] bg-[#FFEFC2] px-3 py-0.5 font-sans text-xs font-extrabold text-[#0A2E4A]">
                  Código: {turmaId}
                </span>
              </div>
              <h1 className="mt-2 font-sans text-3xl font-extrabold text-[#0A2E4A]">
                {turmaNome}
              </h1>
            </div>

            <div className="rounded-[20px] border-2 border-[#0A2E4A] bg-[#EBF5FF] px-4 py-2.5 text-center shadow-[0_3px_0_0_#0A2E4A]">
              <span className="block font-sans text-2xl font-extrabold text-[#0A2E4A]">
                {alunosVisiveis.length}
              </span>
              <span className="font-sans text-xs font-bold text-[#14507F]">
                Alunos Matriculados
              </span>
            </div>
          </div>

          <div className="mt-6">
            <h2 className="font-sans text-lg font-extrabold text-[#0A2E4A]">
              Lista de Alunos
            </h2>
            {erroLixeira && (
              <p role="alert" className="mt-3 rounded-xl border-2 border-red-700 bg-red-50 px-3 py-2 text-sm font-bold text-red-800">
                {erroLixeira}
              </p>
            )}

            {alunosVisiveis.length === 0 ? (
              <div className="mt-4 rounded-[24px] border-2 border-dashed border-[#0A2E4A]/30 bg-[#F4FAFF] p-8 text-center">
                <p className="font-sans text-sm font-bold text-[#4A6B85]">
                  Nenhum aluno cadastrado nesta turma ainda.
                </p>
                <p className="mt-1 font-sans text-xs text-[#5A7C99]">
                  Compartilhe o código <strong className="text-[#0A2E4A]">{turmaId}</strong> com os estudantes para que eles se cadastrem.
                </p>
              </div>
            ) : (
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {alunosVisiveis.map((a, idx) => (
                  <div
                    key={a.id}
                    className="flex items-center gap-3 rounded-[20px] border-2 border-[#0A2E4A] bg-[#F6FBFF] p-3.5 shadow-[0_3px_0_0_#0A2E4A]"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-[#0A2E4A] bg-[#FFC53D] font-sans text-xs font-extrabold text-[#0A2E4A]">
                      {idx + 1}
                    </span>
                    <span className="font-sans text-sm font-bold text-[#0A2E4A]">
                      {a.nome}
                    </span>
                    <button
                      type="button"
                      aria-label={`Mover ${a.nome} para a lixeira`}
                      title="Mover aluno para a lixeira"
                      disabled={alunoEmOperacao === a.id}
                      onClick={() => void arquivarAluno(a)}
                      className="ml-auto flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-red-700 bg-red-100 text-red-700 shadow-[0_2px_0_0_#991B1B] transition hover:bg-red-200 disabled:opacity-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
