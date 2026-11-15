'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  FileText,
  Sparkles,
  X,
  ArrowLeft,
  LayoutDashboard,
  ClipboardCheck,
  Library,
} from 'lucide-react';
import { Avaliacoes } from '@/app/src/types/index';
import GeradorAvaliativo from '@/app/src/componentes/GeradorAvaliativo';
import Avaliacao from '@/app/src/componentes/Avaliacao';

// ajuste as rotas conforme as pastas do seu app/
const ROTA_DASHBOARD = '/dashboard';
const ROTA_BANCO = '/banco-de-questoes';

const FORMAS = [
  'rounded-[30px_38px_28px_40px]',
  'rounded-[38px_28px_40px_30px]',
  'rounded-[34px_42px_30px_36px]',
];

const BOLINHA =
  'flex h-14 w-14 items-center justify-center rounded-full border-[3px] border-[#0A2E4A] transition motion-safe:duration-200 group-hover:scale-110 group-active:scale-95';

const ROTULO = [
  'pointer-events-none absolute whitespace-nowrap rounded-full border-2 border-[#0A2E4A] bg-[#0A2E4A] px-3 py-1',
  "font-['Bricolage_Grotesque'] text-xs font-extrabold text-white",
  'opacity-0 transition motion-safe:duration-150 group-hover:opacity-100 group-focus-visible:opacity-100',
  'bottom-[calc(100%+12px)] left-1/2 -translate-x-1/2 group-hover:-translate-y-1',
  'md:bottom-auto md:left-[calc(100%+14px)] md:top-1/2 md:-translate-y-1/2 md:translate-x-0 md:group-hover:translate-x-1 md:group-hover:-translate-y-1/2',
].join(' ');

const FOCO =
  'group relative cursor-pointer rounded-full outline-none focus-visible:ring-4 focus-visible:ring-[#1D63ED]/40';

export default function AbaAvaliacao() {
  const [avaliacoes, setAvaliacoes] = useState<Avaliacoes[]>([]);
  const [avaliacaoSelecionada, setAvaliacaoSelecionada] = useState<Avaliacoes | null>(null);
  const [geradorAberto, setGeradorAberto] = useState(false);

  function handleAvaliacaoGerada(novaAvaliacao: Avaliacoes) {
    setAvaliacoes((prev) => [novaAvaliacao, ...prev]);
    setGeradorAberto(false);
  }

  return (
    <div
      className={[
        'relative min-h-screen overflow-x-hidden bg-[#F6FBFF]',
        "font-['Nunito'] text-[#0A2E4A]",
        'px-5 pb-32 pt-10 md:pl-32 md:pr-10 md:pb-16',
      ].join(' ')}
    >
      {/* fontes (se já carregar via next/font, pode remover) */}
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,800&family=Nunito:wght@600;700;800&display=swap');`}</style>

      {/* manchas de cor */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-10 h-72 w-72 rounded-[60%_40%_55%_45%] bg-[#BFE3F7]/70 blur-2xl" />
        <div className="absolute right-[-60px] top-1/3 h-80 w-80 rounded-[45%_55%_40%_60%] bg-[#C6EFE9]/70 blur-2xl" />
        <div className="absolute bottom-[-40px] left-1/3 h-64 w-64 rounded-[55%_45%_60%_40%] bg-[#FFEFC2]/80 blur-2xl" />
      </div>

      {/* DOCK DE BOLINHAS */}
      <nav
        aria-label="Navegação principal"
        className={[
          'fixed z-40 flex gap-4',
          'bottom-5 left-1/2 -translate-x-1/2 flex-row rounded-full border-[3px] border-[#0A2E4A] bg-white/90 px-4 py-3 shadow-[0_5px_0_0_#0A2E4A] backdrop-blur',
          'md:bottom-auto md:left-6 md:top-1/2 md:-translate-y-1/2 md:translate-x-0 md:flex-col md:px-3 md:py-4',
        ].join(' ')}
      >
        {/* Dashboard → página própria */}
        <Link href={ROTA_DASHBOARD} aria-label="Dashboard" className={FOCO}>
          <span className={`${BOLINHA} bg-white group-hover:bg-[#C6EFE9]`}>
            <LayoutDashboard className="h-6 w-6" strokeWidth={2.4} />
          </span>
          <span className={ROTULO}>Dashboard</span>
        </Link>

        {/* Avaliação → página atual (ativa) */}
        <button
          type="button"
          aria-label="Avaliação"
          aria-current="page"
          onClick={() => setAvaliacaoSelecionada(null)}
          className={FOCO}
        >
          <span className={`${BOLINHA} -translate-y-0.5 bg-[#FFC53D] shadow-[0_4px_0_0_#0A2E4A]`}>
            <ClipboardCheck className="h-6 w-6" strokeWidth={2.4} />
          </span>
          <span className={ROTULO}>Avaliação</span>
        </button>

        {/* Banco de Questões → página própria */}
        <Link href={ROTA_BANCO} aria-label="Banco de Questões" className={FOCO}>
          <span className={`${BOLINHA} bg-white group-hover:bg-[#FFD3DB]`}>
            <Library className="h-6 w-6" strokeWidth={2.4} />
          </span>
          <span className={ROTULO}>Banco de Questões</span>
        </Link>
      </nav>

      <div className="relative z-10 mx-auto max-w-5xl">
        {/* Cabeçalho */}
        <header className="mb-10">
          <h1 className="font-['Bricolage_Grotesque'] text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
            Minhas avaliações
          </h1>
          <svg aria-hidden viewBox="0 0 220 14" className="mt-1 h-3 w-44 text-[#FFC53D]" fill="none">
            <path
              d="M3 9 C 40 2, 70 13, 110 7 S 180 3, 217 8"
              stroke="currentColor"
              strokeWidth="5"
              strokeLinecap="round"
            />
          </svg>
          <p className="mt-3 max-w-md text-base font-semibold text-[#4A6B85]">
            Abra uma para revisar ou gere uma nova no botão lá embaixo.
          </p>
        </header>

        {avaliacaoSelecionada ? (
          <div className="rounded-[40px_34px_42px_36px] border-[3px] border-[#0A2E4A] bg-white p-6 shadow-[0_8px_0_0_#0A2E4A] sm:p-8">
            <button
              type="button"
              onClick={() => setAvaliacaoSelecionada(null)}
              className="mb-5 inline-flex cursor-pointer items-center gap-2 rounded-full border-2 border-[#0A2E4A] bg-[#FFC53D] px-4 py-2 font-['Bricolage_Grotesque'] text-xs font-extrabold shadow-[0_3px_0_0_#0A2E4A] transition hover:brightness-105 active:translate-y-0.5"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar para avaliações
            </button>

            <Avaliacao avaliacao={avaliacaoSelecionada} />
          </div>
        ) : avaliacoes.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-[44px_36px_48px_38px] border-[3px] border-dashed border-[#0A2E4A] bg-white/80 p-12 text-center">
            <div className="mb-4 flex h-14 w-14 -rotate-6 items-center justify-center rounded-full border-[3px] border-[#0A2E4A] bg-[#4ECDC4]">
              <FileText className="h-6 w-6" />
            </div>
            <h2 className="font-['Bricolage_Grotesque'] text-xl font-extrabold">Nada por aqui ainda</h2>
            <p className="mt-1 max-w-xs text-sm font-bold text-[#4A6B85]">
              Toque em “Gerar avaliação” e a sua primeira prova aparece nesta página.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-7 sm:grid-cols-2 lg:grid-cols-3">
            {avaliacoes.map((item, idx) => (
              <button
                key={item.id ?? idx}
                type="button"
                onClick={() => setAvaliacaoSelecionada(item)}
                className={[
                  'group relative flex cursor-pointer flex-col justify-between border-[3px] border-[#0A2E4A] bg-white p-5 pt-7 text-left',
                  'shadow-[0_6px_0_0_#0A2E4A] transition motion-safe:duration-200',
                  'hover:-translate-y-1 hover:rotate-0 hover:bg-[#EBF5FF] active:translate-y-1 active:shadow-[0_2px_0_0_#0A2E4A]',
                  FORMAS[idx % FORMAS.length],
                  idx % 2 ? 'rotate-[0.8deg]' : '-rotate-[0.8deg]',
                ].join(' ')}
              >
                <span
                  aria-hidden
                  className="absolute -top-3 left-1/2 h-6 w-20 -translate-x-1/2 -rotate-3 rounded-sm bg-[#FFC53D]/80"
                />
                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-[#0A2E4A] bg-[#4ECDC4]">
                      <FileText className="h-4 w-4" />
                    </span>
                    <span className="rounded-full border-2 border-[#0A2E4A] bg-[#FFEFC2] px-3 py-0.5 text-xs font-extrabold">
                      {item.questoes?.length ?? 0} questões
                    </span>
                  </div>

                  <h3 className="font-['Bricolage_Grotesque'] text-xl font-extrabold">
                    Avaliação #{item.id ?? idx + 1}
                  </h3>

                  <p className="mt-1 line-clamp-2 text-sm font-semibold text-[#4A6B85]">
                    {item.questoes?.[0]?.enunciado ?? 'Abra para ver as questões.'}
                  </p>
                </div>

                <span className="mt-4 inline-block text-sm font-extrabold text-[#1D63ED] group-hover:underline">
                  Abrir avaliação
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* gerar avaliação */}
      <div className="fixed bottom-28 right-5 z-50 flex flex-col items-end md:bottom-6 md:right-6">
        {geradorAberto && (
          <div className="mb-3 w-[92vw] max-w-md">
            <GeradorAvaliativo onAvaliacaoGerada={handleAvaliacaoGerada} />
          </div>
        )}

        <button
          type="button"
          onClick={() => setGeradorAberto((prev) => !prev)}
          className="flex cursor-pointer items-center gap-2 rounded-full border-[3px] border-[#0A2E4A] bg-[linear-gradient(160deg,#5AA9E6_0%,#2496ED_45%,#1D63ED_100%)] px-6 py-3.5 font-['Bricolage_Grotesque'] text-base font-extrabold text-white shadow-[0_6px_0_0_#16457E] transition hover:brightness-105 active:translate-y-1 active:shadow-[0_2px_0_0_#16457E]"
        >
          {geradorAberto ? (
            <>
              <X className="h-5 w-5" />
              Fechar gerador
            </>
          ) : (
            <>
              <Sparkles className="h-5 w-5" />
              Gerar avaliação
            </>
          )}
        </button>
      </div>
    </div>
  );
}