'use client';

import {
  ChevronDown,
  Link as LinkIcon,
  Upload,
  Sparkles,
  Star,
  Users,
  Share2,
  CheckCircle2,
  Coins
} from "lucide-react";

import { useState, useEffect } from "react";
import { gerarAvaliacao, GerarAvaliacaoResultado } from "@/app/actions/prompt";
import { listarTurmasProfessor, TurmaItem } from "@/app/actions/turmas";
import { Avaliacoes } from "@/app/src/types/index";

type GeradorAvaliativoProps = {
  onAvaliacaoGerada: (novaAvaliacao: Avaliacoes) => void;
};

export default function GeradorAvaliativo({ onAvaliacaoGerada }: GeradorAvaliativoProps) {
  const [conteudoPrincipal, setConteudoPrincipal] = useState('');
  const [conteudoDetalhado, setConteudoDetalhado] = useState('');
  const [quantidadeQuestoes, setQuantidadeQuestoes] = useState(10);
  const [turmas, setTurmas] = useState<TurmaItem[]>([]);
  const [turmaSelecionada, setTurmaSelecionada] = useState<string>('');
  const [usarBancoComunidade, setUsarBancoComunidade] = useState(true);
  const [publicarNovasNaComunidade, setPublicarNovasNaComunidade] = useState(false);
  const [materiaTag, setMateriaTag] = useState('Matemática');
  const [carregando, setCarregando] = useState(false);
  const [feedbackEconomia, setFeedbackEconomia] = useState<string | null>(null);

  useEffect(() => {
    async function carregarTurmas() {
      try {
        const res = await listarTurmasProfessor();
        if (res.turmas && res.turmas.length > 0) {
          setTurmas(res.turmas);
          setTurmaSelecionada(res.turmas[0].id);
        }
      } catch (err) {
        console.error("Erro ao carregar turmas:", err);
      }
    }
    carregarTurmas();
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setCarregando(true);
    setFeedbackEconomia(null);

    try {
      const resposta = await gerarAvaliacao(
        conteudoPrincipal,
        conteudoDetalhado,
        quantidadeQuestoes,
        turmaSelecionada || undefined,
        {
          usarBancoComunidade,
          publicarNovasQuestoes: publicarNovasNaComunidade,
          materiaTag,
        }
      );

      if (resposta) {
        if (resposta.reaproveitadasDoBanco && resposta.reaproveitadasDoBanco > 0) {
          setFeedbackEconomia(
            `${resposta.reaproveitadasDoBanco} questão(ões) reaproveitadas diretamente do banco de questões.`
          );
        }
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

      {feedbackEconomia && (
        <div className="mb-4 flex items-center gap-2 rounded-[20px] border-2 border-[#0A2E4A] bg-[#D1F2D9] p-3 text-xs font-extrabold text-[#0F5132] shadow-[0_3px_0_0_#0A2E4A]">
          <Coins className="h-4 w-4 shrink-0 text-[#0F5132]" />
          <span>{feedbackEconomia}</span>
        </div>
      )}

      <div className="mt-4 space-y-4 text-sm">
        {/* Turma e questões */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <label className="font-['Baloo_2'] text-sm font-bold text-[#14507F]">
              Para qual turma?
            </label>
            <div className="relative">
              <select
                value={turmaSelecionada}
                onChange={(e) => setTurmaSelecionada(e.target.value)}
                className="w-full appearance-none rounded-[18px] border-[3px] border-[#0A2E4A] bg-[#EBF5FF] px-3 py-2.5 pr-10 text-xs font-semibold text-[#0A2E4A] shadow-[0_3px_0_0_#0A2E4A] focus:outline-none"
              >
                {turmas.length > 0 ? (
                  turmas.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.nome} ({t.id})
                    </option>
                  ))
                ) : (
                  <option value="">Geral / Sem turma específica</option>
                )}
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

        {/* Conteúdos e Matéria */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="space-y-1 sm:col-span-2">
            <label className="font-['Baloo_2'] text-sm font-bold text-[#14507F]">
              Quais conteúdos?
            </label>
            <input
              type="text"
              value={conteudoPrincipal}
              onChange={(e) => setConteudoPrincipal(e.target.value)}
              placeholder="Ex: Equação do Segundo Grau, Bhaskara..."
              className="w-full rounded-[18px] border-[3px] border-[#0A2E4A] bg-[#EBF5FF] px-3.5 py-2.5 text-xs font-semibold text-[#0A2E4A] shadow-[0_3px_0_0_#0A2E4A] placeholder:font-normal placeholder:text-[#5A7C99] focus:outline-none"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="font-['Baloo_2'] text-sm font-bold text-[#14507F]">
              Matéria / Tag
            </label>
            <div className="relative">
              <select
                value={materiaTag}
                onChange={(e) => setMateriaTag(e.target.value)}
                className="w-full appearance-none rounded-[18px] border-[3px] border-[#0A2E4A] bg-[#EBF5FF] px-3 py-2.5 pr-10 text-xs font-semibold text-[#0A2E4A] shadow-[0_3px_0_0_#0A2E4A] focus:outline-none"
              >
                <option value="Matemática">Matemática</option>
                <option value="Português">Português</option>
                <option value="Ciências">Ciências</option>
                <option value="História">História</option>
                <option value="Física">Física</option>
                <option value="Geral">Geral</option>
              </select>
              <span className="pointer-events-none absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full border-2 border-[#0A2E4A] bg-[#FFC53D]">
                <ChevronDown className="h-3.5 w-3.5 text-[#0A2E4A]" />
              </span>
            </div>
          </div>
        </div>

        {/* Integração com o Banco de Questões */}
        <div className="rounded-[22px] border-2 border-[#0A2E4A] bg-[#F6FBFF] p-3.5 shadow-[0_3px_0_0_#0A2E4A] space-y-2.5">
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={usarBancoComunidade}
              onChange={(e) => setUsarBancoComunidade(e.target.checked)}
              className="h-4 w-4 rounded border-2 border-[#0A2E4A] text-[#2496ED] focus:ring-0 accent-[#2496ED]"
            />
            <div className="text-xs">
              <span className="font-['Baloo_2'] font-extrabold text-[#0A2E4A] flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-[#2496ED]" />
                Reaproveitar questões do Banco
              </span>
              <p className="text-[11px] text-[#4A6B85] font-semibold mt-0.5">
                Busca questões já cadastradas com boa avaliação sobre o tema para compor a avaliação.
              </p>
            </div>
          </label>

          <label className="flex items-center gap-2.5 cursor-pointer pt-1 border-t border-[#0A2E4A]/10">
            <input
              type="checkbox"
              checked={publicarNovasNaComunidade}
              onChange={(e) => setPublicarNovasNaComunidade(e.target.checked)}
              className="h-4 w-4 rounded border-2 border-[#0A2E4A] text-[#2496ED] focus:ring-0 accent-[#2496ED]"
            />
            <div className="text-xs">
              <span className="font-['Baloo_2'] font-bold text-[#0A2E4A] flex items-center gap-1.5">
                <Share2 className="h-3.5 w-3.5 text-[#FFC53D]" />
                Disponibilizar novas questões no Banco Público
              </span>
              <p className="text-[11px] text-[#4A6B85] font-semibold mt-0.5">
                Permite que outros professores visualizem, avaliem e utilizem as questões.
              </p>
            </div>
          </label>
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
            placeholder="Digite detalhes adicionais, estilo de questão, contexto..."
            className="w-full resize-none rounded-[18px] border-[3px] border-[#0A2E4A] bg-[#EBF5FF] px-3.5 py-2.5 text-xs font-semibold text-[#0A2E4A] shadow-[0_3px_0_0_#0A2E4A] placeholder:font-normal placeholder:text-[#5A7C99] focus:outline-none"
          />
        </div>

        {/* Botão */}
        <button
          type="submit"
          disabled={carregando}
          className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-[18px] border-[3px] border-[#0A2E4A] bg-gradient-to-br from-[#5AA9E6] via-[#2496ED] to-[#1D63ED] px-4 py-3 font-['Baloo_2'] text-base font-extrabold text-white shadow-[0_5px_0_0_#16457E] transition hover:brightness-105 active:translate-y-1 active:shadow-[0_1px_0_0_#16457E] disabled:opacity-60"
        >
          <Sparkles className="h-4 w-4" />
          {carregando ? 'Processando e gerando...' : 'Gerar avaliação'}
        </button>

        <p className="flex items-center justify-center gap-1 text-center text-[11px] font-extrabold text-[#4A6B85]">
          <Star className="h-3 w-3 fill-[#FFC53D] text-[#FFC53D]" />
          você pode publicar ou ajustar tudo depois!
        </p>
      </div>
    </form>
  );
}
