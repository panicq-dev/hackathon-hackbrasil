'use client';

import { useState } from 'react';
import { Send, CheckCircle2, AlertCircle, Info, Sparkles, Share2, Check, Globe } from 'lucide-react';
import { Avaliacoes, EstruturaQuestao } from '@/app/src/types/index';
import { salvarRespostaAluno } from '@/app/actions/avaliacoes';
import { publicarQuestaoComunidade } from '@/app/actions/questoes';

export type AvaliacaoCompleta = Avaliacoes & {
  respondidaPorMim?: boolean;
  minhasRespostas?: Record<string, string | number>;
};

export interface AvaliacaoProps {
  avaliacao?: AvaliacaoCompleta | null;
  perfilUsuario?: 'professor' | 'aluno';
  onRespostasEnviadas?: () => void;
}

export default function Avaliacao({
  avaliacao = null,
  perfilUsuario = 'aluno',
  onRespostasEnviadas,
}: AvaliacaoProps) {
  const [respostas, setRespostas] = useState<Record<string, string | number>>(
    avaliacao?.minhasRespostas ?? {}
  );
  const [salvando, setSalvando] = useState(false);
  const [mensagemSucesso, setMensagemSucesso] = useState(
    avaliacao?.respondidaPorMim ? 'Você já enviou suas respostas para esta avaliação.' : ''
  );
  const [erro, setErro] = useState('');
  
  // Rastreia questões publicadas na comunidade localmente
  const [publicadas, setPublicadas] = useState<Record<number, boolean>>({});
  const [publicandoIndice, setPublicandoIndice] = useState<number | null>(null);
  const [publicandoTodas, setPublicandoTodas] = useState(false);

  if (!avaliacao || !avaliacao.questoes?.length) {
    return (
      <div className="rounded-[24px] border-[3px] border-[#0A2E4A] bg-[#EBF5FF] p-6 text-center text-sm font-bold text-[#4A6B85]">
        Nenhuma questão encontrada...
      </div>
    );
  }

  function handleValorChange(campoId: string, valor: string) {
    setRespostas((prev) => ({
      ...prev,
      [campoId]: valor,
    }));
  }

  async function handlePublicarQuestao(index: number, questao: EstruturaQuestao) {
    setPublicandoIndice(index);
    setErro('');
    try {
      const res = await publicarQuestaoComunidade(questao, 'Geral');
      if (res.sucesso) {
        setPublicadas((prev) => ({ ...prev, [index]: true }));
        setMensagemSucesso(`Questão #${index + 1} publicada no banco de questões com sucesso!`);
      } else {
        setErro(res.erro || 'Falha ao publicar questão.');
      }
    } catch {
      setErro('Erro ao publicar questão.');
    } finally {
      setPublicandoIndice(null);
    }
  }

  async function handlePublicarTodas() {
    if (!avaliacao?.questoes) return;
    setPublicandoTodas(true);
    setErro('');
    try {
      let count = 0;
      for (let i = 0; i < avaliacao.questoes.length; i++) {
        if (!publicadas[i] && !avaliacao.questoes[i].publicadaNaComunidade) {
          const res = await publicarQuestaoComunidade(avaliacao.questoes[i], 'Geral');
          if (res.sucesso) {
            count++;
            setPublicadas((prev) => ({ ...prev, [i]: true }));
          }
        }
      }
      setMensagemSucesso(`${count} questão(ões) publicada(s) no banco de questões com sucesso!`);
    } catch {
      setErro('Erro ao publicar questões em lote.');
    } finally {
      setPublicandoTodas(false);
    }
  }

  async function handleEnviar(e: React.FormEvent) {
    e.preventDefault();
    if (!avaliacao?.id) return;

    setErro('');
    setMensagemSucesso('');
    setSalvando(true);

    try {
      const res = await salvarRespostaAluno(avaliacao.id, respostas);
      if (res.erro) {
        setErro(res.erro);
      } else {
        setMensagemSucesso('Respostas salvas e enviadas com sucesso!');
        if (onRespostasEnviadas) {
          onRespostasEnviadas();
        }
      }
    } catch {
      setErro('Erro ao registrar as respostas. Verifique sua conexão e tente novamente.');
    } finally {
      setSalvando(false);
    }
  }

  const isProfessor = perfilUsuario === 'professor';

  return (
    <form onSubmit={handleEnviar} className="space-y-5 font-['Nunito'] text-[#0A2E4A]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-[#0A2E4A]/15 pb-4">
        <div>
          <h2 className="font-['Baloo_2'] text-2xl font-extrabold text-[#0A2E4A]">
            Avaliação #{avaliacao.id.slice(0, 8)}
          </h2>
          <p className="text-xs font-bold text-[#4A6B85]">
            {isProfessor
              ? 'Gabarito e estrutura da avaliação gerada'
              : 'Responda aos campos de cada questão com atenção.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isProfessor ? (
            <>
              <button
                type="button"
                onClick={handlePublicarTodas}
                disabled={publicandoTodas}
                className="flex cursor-pointer items-center gap-1.5 rounded-full border-2 border-[#0A2E4A] bg-[#FFC53D] px-3.5 py-1.5 font-['Baloo_2'] text-xs font-extrabold text-[#0A2E4A] shadow-[0_2px_0_0_#0A2E4A] transition hover:brightness-105 active:translate-y-0.5 disabled:opacity-60"
              >
                <Globe className="h-3.5 w-3.5 text-[#0A2E4A]" />
                <span>{publicandoTodas ? 'Publicando todas...' : 'Publicar todas no Banco'}</span>
              </button>

              <span className="rounded-xl border-2 border-[#0A2E4A] bg-[#FFEFC2] px-3 py-1 font-['Baloo_2'] text-xs font-extrabold text-[#0A2E4A] shadow-[0_2px_0_0_#0A2E4A]">
                Modo Professor
              </span>
            </>
          ) : (
            <span className="rounded-xl border-2 border-[#0A2E4A] bg-[#4ECDC4] px-3 py-1 font-['Baloo_2'] text-xs font-extrabold text-[#0A2E4A] shadow-[0_2px_0_0_#0A2E4A]">
              Modo Aluno
            </span>
          )}

          <span className="rounded-xl border-2 border-[#0A2E4A] bg-[#BFE3F7] px-3 py-1 font-['Baloo_2'] text-xs font-extrabold shadow-[0_2px_0_0_#0A2E4A]">
            {avaliacao.questoes.length} questões
          </span>
        </div>
      </div>

      {mensagemSucesso && (
        <div className="flex items-center gap-2.5 rounded-[18px] border-2 border-[#0A2E4A] bg-[#D1F2D9] px-4 py-3 text-xs font-extrabold text-[#0F5132] shadow-[0_3px_0_0_#0A2E4A]">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <span>{mensagemSucesso}</span>
        </div>
      )}

      {erro && (
        <div className="flex items-center gap-2.5 rounded-[18px] border-2 border-[#0A2E4A] bg-[#FFE3E3] px-4 py-3 text-xs font-extrabold text-[#8A1F1F] shadow-[0_3px_0_0_#0A2E4A]">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{erro}</span>
        </div>
      )}

      {avaliacao.questoes.map((questao: EstruturaQuestao, index: number) => {
        const errosMap = new Map<string, string>();
        questao.mapeamentoDeErros?.forEach((m) => {
          errosMap.set(m.id, m.erroProvavel);
        });

        const jaPublicada = publicadas[index] || questao.publicadaNaComunidade || Boolean(questao.bancoId);

        return (
          <div
            key={index}
            className="rounded-[22px] border-[3px] border-[#0A2E4A] bg-[#F4FAFF] p-5 shadow-[0_4px_0_0_#0A2E4A]"
          >
            <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
              <h3 className="font-['Baloo_2'] text-base font-extrabold leading-snug text-[#14507F] flex-1">
                {index + 1}. {questao.enunciado}
              </h3>

              {isProfessor && (
                <div className="shrink-0">
                  {jaPublicada ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-[#0A2E4A] bg-[#D1F2D9] px-3 py-1 font-['Baloo_2'] text-xs font-extrabold text-[#0F5132] shadow-[0_2px_0_0_#0A2E4A]">
                      <Check className="h-3.5 w-3.5" />
                      Publicada no Banco
                    </span>
                  ) : (
                    <button
                      type="button"
                      disabled={publicandoIndice === index}
                      onClick={() => handlePublicarQuestao(index, questao)}
                      className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border-2 border-[#0A2E4A] bg-[#FFC53D] px-3 py-1 font-['Baloo_2'] text-xs font-extrabold text-[#0A2E4A] shadow-[0_2px_0_0_#0A2E4A] transition hover:brightness-105 active:translate-y-0.5 disabled:opacity-60"
                    >
                      <Share2 className="h-3.5 w-3.5" />
                      <span>{publicandoIndice === index ? 'Publicando...' : 'Publicar no Banco'}</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-3">
              {questao.camposValidacao.map((campo) => {
                const erroMapeado = errosMap.get(campo.id);

                return (
                  <div key={campo.id} className="space-y-1.5 rounded-xl bg-white/70 p-3 border border-[#0A2E4A]/10">
                    <label className="block text-xs font-extrabold text-[#0A2E4A]">
                      {campo.label}
                    </label>

                    {isProfessor ? (
                      <div className="flex flex-wrap items-center gap-2 pt-1 text-xs font-semibold">
                        <span className="rounded-md border border-[#0A2E4A]/30 bg-[#E8F5E9] px-2 py-1 text-[#1B5E20]">
                          <strong>Resposta Esperada:</strong> {String(campo.respostaCorreta)}
                        </span>

                        {erroMapeado && (
                          <span className="rounded-md border border-[#0A2E4A]/30 bg-[#FFF3E0] px-2 py-1 text-[#E65100]">
                            <strong>Gap de aprendizagem mapeado:</strong> {erroMapeado}
                          </span>
                        )}
                      </div>
                    ) : (
                      <input
                        type={campo.tipo === 'numero' ? 'text' : 'text'}
                        value={respostas[campo.id] ?? ''}
                        onChange={(e) => handleValorChange(campo.id, e.target.value)}
                        placeholder="Insira sua resposta aqui..."
                        className="w-full rounded-[14px] border-2 border-[#0A2E4A] bg-white px-3.5 py-2 text-xs font-semibold text-[#0A2E4A] shadow-[0_2px_0_0_#0A2E4A] placeholder:font-normal placeholder:text-[#5A7C99] focus:outline-none focus:ring-4 focus:ring-[#2496ED]/30"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Apenas aluno pode enviar respostas */}
      {!isProfessor && (
        <div className="pt-2">
          <button
            type="submit"
            disabled={salvando}
            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-[18px] border-[3px] border-[#0A2E4A]
              bg-[linear-gradient(160deg,#5AA9E6_0%,#2496ED_45%,#1D63ED_100%)] px-6 py-3.5
              font-['Baloo_2'] text-base font-extrabold text-white
              shadow-[0_6px_0_0_#16457E] transition hover:brightness-105 active:translate-y-1 active:shadow-[0_2px_0_0_#16457E]
              disabled:opacity-60"
          >
            <Send className="h-5 w-5" />
            {salvando ? 'Gravando respostas...' : 'Enviar respostas da avaliação'}
          </button>
        </div>
      )}
    </form>
  );
}
