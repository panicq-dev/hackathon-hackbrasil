
'use client';

import {
  ChevronDown,
  Link as LinkIcon,
  Upload,
  Sparkles,
  Star
} from "lucide-react";

import { useState } from "react";
import { gerarAvaliacao } from "@/app/action";
import { EstruturaQuestao } from "@/app/src/types/index";
import Avaliacao from "@/app/src/componentes/Avaliacao";

export default function GeradorAvaliativo() {
  const [conteudoPrincipal, setConteudoPrincipal] = useState('');
  const [conteudoDetalhado, setConteudoDetalhado] = useState('');
  const [resultadoJson, setResultadoJson] = useState<EstruturaQuestao | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const resposta = await gerarAvaliacao(
      conteudoPrincipal,
      conteudoDetalhado
    );

    setResultadoJson(resposta);
    console.log("Resultado:", resultadoJson);
  }

  return (
    <div className="relative flex min-h-screen flex-1 flex-col items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_12%_8%,#BFE3F7_0%,transparent_42%),radial-gradient(circle_at_88%_92%,#C6EFE9_0%,transparent_40%),radial-gradient(circle_at_78%_12%,#FFEFC2_0%,transparent_30%),#F4FAFF] px-4 py-12 font-['Nunito',ui-rounded,sans-serif] text-[#0A2E4A]">

      {/* FORMULÁRIO */}
      <form
        onSubmit={handleSubmit}
        className="relative w-full max-w-xl animate-gv-pop rounded-[44px] border-[3px] border-[#0A2E4A] bg-white p-7 shadow-[0_8px_0_0_#0A2E4A,0_24px_45px_-18px_rgba(20,80,140,.45)] sm:p-9"
      >

        {/* Selo */}
        <div className="absolute -right-3 -top-4 -rotate-6 rounded-2xl border-2 border-[#0A2E4A] bg-[#FF6B6B] px-3 py-1.5 font-['Baloo_2'] text-xs font-extrabold text-white shadow-[0_3px_0_0_#0A2E4A]">
          o prof que aprova!
        </div>

        {/* Avatar */}
        <div className="mb-5 flex justify-center">
          <div className="relative">

            <span
              aria-hidden="true"
              className="absolute -inset-2 rounded-full border-2 border-[#0A2E4A] bg-[#FFC53D]/70"
            />

            <div className="relative h-28 w-28 overflow-hidden rounded-full border-[3px] border-[#0A2E4A] bg-[#FFE9D6]">
              <div className="relative h-full w-full">
                {/* Imagem do avatar futuramente */}
              </div>
            </div>

            <span className="absolute -bottom-2 -right-6 rotate-6 rounded-2xl border-2 border-[#0A2E4A] bg-[#4ECDC4] px-2.5 py-1 font-['Baloo_2'] text-xs font-extrabold text-[#0A2E4A] shadow-[0_3px_0_0_#0A2E4A]">
              oi!
            </span>

          </div>
        </div>

        {/* Título */}
        <h1 className="text-center font-['Baloo_2'] text-3xl font-extrabold">
          Gerar avaliações
        </h1>

        <svg
          viewBox="0 0 220 14"
          className="mx-auto mb-2 mt-1 w-48"
          aria-hidden="true"
        >
          <path
            d="M4 9c18-8 34 6 52-1s34 6 52-1 34 6 52-1 34 6 52-1"
            fill="none"
            stroke="#2496ED"
            strokeWidth="5"
            strokeLinecap="round"
          />
        </svg>

        <p className="mb-7 text-center text-sm font-bold text-[#4A6B85]">
          Monte uma avaliação sob medida para sua turma.
        </p>

        <div className="space-y-5 text-sm">

          {/* Turma e questões */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

            <div className="space-y-2">
              <label className="font-['Baloo_2'] text-base font-bold text-[#14507F]">
                Para qual turma?
              </label>

              <div className="relative">
                <select className="w-full appearance-none rounded-[18px] border-[3px] border-[#0A2E4A] bg-[#EBF5FF] px-4 py-3 pr-11 font-semibold text-[#0A2E4A] shadow-[0_3px_0_0_#0A2E4A] transition focus:outline-none focus:ring-4 focus:ring-[#2496ED]/30">
                  <option>7º ano A</option>
                  <option>7º ano B</option>
                  <option>8º ano A</option>
                </select>

                <span className="pointer-events-none absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full border-2 border-[#0A2E4A] bg-[#FFC53D]">
                  <ChevronDown className="h-4 w-4 text-[#0A2E4A]" />
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="font-['Baloo_2'] text-base font-bold text-[#14507F]">
                Questões
              </label>

              <div className="relative">
                <select className="w-full appearance-none rounded-[18px] border-[3px] border-[#0A2E4A] bg-[#EBF5FF] px-4 py-3 pr-11 font-semibold text-[#0A2E4A] shadow-[0_3px_0_0_#0A2E4A] transition focus:outline-none focus:ring-4 focus:ring-[#2496ED]/30">
                  <option>10 questões</option>
                  <option>15 questões</option>
                  <option>20 questões</option>
                </select>

                <span className="pointer-events-none absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full border-2 border-[#0A2E4A] bg-[#FFC53D]">
                  <ChevronDown className="h-4 w-4 text-[#0A2E4A]" />
                </span>
              </div>
            </div>

          </div>

          {/* Banco de questões */}
          <div className="space-y-2">
            <label className="font-['Baloo_2'] text-base font-bold text-[#14507F]">
              Mesclar com Banco de questões?
            </label>

            <div className="relative">
              <select className="w-full appearance-none rounded-[18px] border-[3px] border-[#0A2E4A] bg-[#EBF5FF] px-4 py-3 pr-11 font-semibold text-[#0A2E4A] shadow-[0_3px_0_0_#0A2E4A] transition focus:outline-none focus:ring-4 focus:ring-[#2496ED]/30">
                <option>Sim</option>
                <option>Não</option>
              </select>

              <span className="pointer-events-none absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full border-2 border-[#0A2E4A] bg-[#FFC53D]">
                <ChevronDown className="h-4 w-4 text-[#0A2E4A]" />
              </span>
            </div>
          </div>

          {/* Conteúdos */}
          <div className="space-y-2 pt-1">
            <label className="font-['Baloo_2'] text-base font-bold text-[#14507F]">
              Quais conteúdos?
            </label>

            <p className="text-xs font-bold text-[#4A6B85]">
              Selecione ou relate os conteúdos trabalhados.
            </p>

            <input
              type="text"
              value={conteudoPrincipal}
              onChange={(e) => setConteudoPrincipal(e.target.value)}
              placeholder="Ex: Equação do Segundo Grau..."
              className="w-full rounded-[18px] border-[3px] border-[#0A2E4A] bg-[#EBF5FF] px-4 py-3 text-xs font-semibold text-[#0A2E4A] shadow-[0_3px_0_0_#0A2E4A] transition placeholder:font-normal placeholder:text-[#5A7C99] focus:outline-none focus:ring-4 focus:ring-[#2496ED]/30"
              required
            />
          </div>

          {/* Descrição detalhada */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <label className="font-['Baloo_2'] text-base font-bold text-[#14507F]">
                Descrição mais detalhada
              </label>

              <span className="text-xs font-extrabold text-[#4A6B85]">
                (opcional)
              </span>
            </div>

            <textarea
              rows={3}
              value={conteudoDetalhado}
              onChange={(e) => setConteudoDetalhado(e.target.value)}
              placeholder="Digite detalhes adicionais..."
              className="w-full resize-none rounded-[18px] border-[3px] border-[#0A2E4A] bg-[#EBF5FF] px-4 py-3 text-xs font-semibold text-[#0A2E4A] shadow-[0_3px_0_0_#0A2E4A] transition placeholder:font-normal placeholder:text-[#5A7C99] focus:outline-none focus:ring-4 focus:ring-[#2496ED]/30"
            />
          </div>

          {/* Anexos */}
          <div className="space-y-2 pt-1">

            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-[#0A2E4A] bg-[#2496ED]">
                <LinkIcon className="h-3.5 w-3.5 text-white" />
              </span>

              <label className="font-['Baloo_2'] text-base font-bold text-[#14507F]">
                Conteúdos relacionados
              </label>

              <span className="text-xs font-extrabold text-[#4A6B85]">
                (opcional)
              </span>
            </div>

            <p className="text-xs font-bold text-[#4A6B85]">
              Amplie as conexões com o que a turma já sabe ou envie arquivos de referência.
            </p>

            <label className="inline-flex cursor-pointer items-center gap-2 rounded-[18px] border-[3px] border-dashed border-[#0A2E4A] bg-[#FFC53D]/70 px-4 py-2.5 text-xs font-extrabold text-[#0A2E4A] shadow-[0_3px_0_0_#0A2E4A] transition hover:bg-[#FFC53D] active:translate-y-[5px] active:shadow-[0_1px_0_0_#0A2E4A]">
              <Upload className="h-3.5 w-3.5" />

              <span>Enviar arquivos</span>

              <input
                type="file"
                className="hidden"
                multiple
              />
            </label>

          </div>

          {/* Botão */}
          <div className="pt-4">
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-[18px] border-[3px] border-[#0A2E4A] bg-gradient-to-br from-[#5AA9E6] via-[#2496ED] to-[#1D63ED] px-4 py-4 font-['Baloo_2'] text-lg font-extrabold text-white shadow-[0_7px_0_0_#16457E,0_18px_30px_-14px_rgba(29,99,237,.65)] transition hover:brightness-105 active:translate-y-[6px] active:shadow-[0_1px_0_0_#16457E]"
            >
              <Sparkles className="h-5 w-5" />
              Gerar avaliação
            </button>
          </div>

          {/* Rodapé */}
          <p className="flex items-center justify-center gap-1.5 pt-1 text-center text-xs font-extrabold text-[#4A6B85]">
            <Star className="h-3.5 w-3.5 fill-[#FFC53D] text-[#FFC53D]" />
            você pode ajustar tudo depois!
          </p>

        </div>
      </form>
      
          <Avaliacao questao={resultadoJson} />
    </div>


  );
}
