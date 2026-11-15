'use client';

import {
  ChevronDown,
  Link as LinkIcon,
  Upload,
  Sparkles,
  Star
} from "lucide-react";

import { useState } from "react";
import { gerarAvaliacao } from "@/app/actions/prompt";
import { Avaliacoes } from "@/app/src/types/index";

type GeradorAvaliativoProps = {
  onAvaliacaoGerada: (novaAvaliacao: Avaliacoes) => void;
};

export default function GeradorAvaliativo({ onAvaliacaoGerada }: GeradorAvaliativoProps) {
  const [conteudoPrincipal, setConteudoPrincipal] = useState('');
  const [conteudoDetalhado, setConteudoDetalhado] = useState('');
  const [quantidadeQuestoes, setQuantidadeQuestoes] = useState(10);
  const [carregando, setCarregando] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setCarregando(true);

    try {
      const resposta = await gerarAvaliacao(
        conteudoPrincipal,
        conteudoDetalhado,
        quantidadeQuestoes
      );

      if (resposta) {
        onAvaliacaoGerada(resposta);
        setConteudoPrincipal('');
        setConteudoDetalhado('');
      }
    } finally {
      setCarregando(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="relative w-full rounded-[32px] border-[3px] border-[#0A2E4A] bg-white p-6 shadow-[0_8px_0_0_#0A2E4A]"
    >
      {/* Selo */}
      <div className="absolute -right-2 -top-3 -rotate-6 rounded-2xl border-2 border-[#0A2E4A] bg-[#FF6B6B] px-3 py-1 font-['Baloo_2'] text-xs font-extrabold text-white shadow-[0_3px_0_0_#0A2E4A]">
        o prof que aprova!
      </div>

      {/* Título */}
      <h2 className="text-center font-['Baloo_2'] text-2xl font-extrabold text-[#0A2E4A]">
        Gerar avaliação
      </h2>

      <svg viewBox="0 0 220 14" className="mx-auto mb-2 mt-1 w-40" aria-hidden="true">
        <path
          d="M4 9c18-8 34 6 52-1s34 6 52-1 34 6 52-1 34 6 52-1"
          fill="none"
          stroke="#2496ED"
          strokeWidth="5"
          strokeLinecap="round"
        />
      </svg>

      <div className="mt-4 space-y-4 text-sm">
        {/* Turma e questões */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <label className="font-['Baloo_2'] text-sm font-bold text-[#14507F]">
              Para qual turma?
            </label>
            <div className="relative">
              <select className="w-full appearance-none rounded-[18px] border-[3px] border-[#0A2E4A] bg-[#EBF5FF] px-3 py-2.5 pr-10 text-xs font-semibold text-[#0A2E4A] shadow-[0_3px_0_0_#0A2E4A] focus:outline-none">
                <option>7º ano A</option>
                <option>7º ano B</option>
                <option>8º ano A</option>
              </select>
              <span className="pointer-events-none absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full border-2 border-[#0A2E4A] bg-[#FFC53D]">
                <ChevronDown className="h-3.5 w-3.5 text-[#0A2E4A]" />
              </span>
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-['Baloo_2'] text-sm font-bold text-[#14507F]">
              Questões
            </label>
            <div className="relative">
              <select
                value={quantidadeQuestoes}
                onChange={(e) => setQuantidadeQuestoes(Number(e.target.value))}
                className="w-full appearance-none rounded-[18px] border-[3px] border-[#0A2E4A] bg-[#EBF5FF] px-3 py-2.5 pr-10 text-xs font-semibold text-[#0A2E4A] shadow-[0_3px_0_0_#0A2E4A] focus:outline-none"
              >
                <option value={5}>5 questões</option>
                <option value={10}>10 questões</option>
                <option value={15}>15 questões</option>
                <option value={20}>20 questões</option>
              </select>
              <span className="pointer-events-none absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full border-2 border-[#0A2E4A] bg-[#FFC53D]">
                <ChevronDown className="h-3.5 w-3.5 text-[#0A2E4A]" />
              </span>
            </div>
          </div>
        </div>

        {/* Conteúdos */}
        <div className="space-y-1">
          <label className="font-['Baloo_2'] text-sm font-bold text-[#14507F]">
            Quais conteúdos?
          </label>
          <input
            type="text"
            value={conteudoPrincipal}
            onChange={(e) => setConteudoPrincipal(e.target.value)}
            placeholder="Ex: Equação do Segundo Grau..."
            className="w-full rounded-[18px] border-[3px] border-[#0A2E4A] bg-[#EBF5FF] px-3.5 py-2.5 text-xs font-semibold text-[#0A2E4A] shadow-[0_3px_0_0_#0A2E4A] placeholder:font-normal placeholder:text-[#5A7C99] focus:outline-none"
            required
          />
        </div>

        {/* Descrição detalhada */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="font-['Baloo_2'] text-sm font-bold text-[#14507F]">
              Descrição detalhada
            </label>
            <span className="text-xs font-extrabold text-[#4A6B85]">(opcional)</span>
          </div>
          <textarea
            rows={2}
            value={conteudoDetalhado}
            onChange={(e) => setConteudoDetalhado(e.target.value)}
            placeholder="Digite detalhes adicionais..."
            className="w-full resize-none rounded-[18px] border-[3px] border-[#0A2E4A] bg-[#EBF5FF] px-3.5 py-2.5 text-xs font-semibold text-[#0A2E4A] shadow-[0_3px_0_0_#0A2E4A] placeholder:font-normal placeholder:text-[#5A7C99] focus:outline-none"
          />
        </div>

        {/* Anexos */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-[#0A2E4A] bg-[#2496ED]">
              <LinkIcon className="h-3 w-3 text-white" />
            </span>
            <span className="font-['Baloo_2'] text-sm font-bold text-[#14507F]">
              Referências
            </span>
          </div>

          <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-[14px] border-2 border-dashed border-[#0A2E4A] bg-[#FFC53D]/70 px-3 py-1.5 text-xs font-extrabold text-[#0A2E4A] shadow-[0_2px_0_0_#0A2E4A] hover:bg-[#FFC53D]">
            <Upload className="h-3.5 w-3.5" />
            <span>Anexar</span>
            <input type="file" className="hidden" multiple />
          </label>
        </div>

        {/* Botão */}
        <button
          type="submit"
          disabled={carregando}
          className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-[18px] border-[3px] border-[#0A2E4A] bg-gradient-to-br from-[#5AA9E6] via-[#2496ED] to-[#1D63ED] px-4 py-3 font-['Baloo_2'] text-base font-extrabold text-white shadow-[0_5px_0_0_#16457E] transition hover:brightness-105 active:translate-y-1 active:shadow-[0_1px_0_0_#16457E] disabled:opacity-60"
        >
          <Sparkles className="h-4 w-4" />
          {carregando ? 'Gerando...' : 'Gerar avaliação'}
        </button>

        <p className="flex items-center justify-center gap-1 text-center text-[11px] font-extrabold text-[#4A6B85]">
          <Star className="h-3 w-3 fill-[#FFC53D] text-[#FFC53D]" />
          você pode ajustar tudo depois!
        </p>
      </div>
    </form>
  );
}