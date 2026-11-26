'use client';

import { useState, useEffect, useLayoutEffect, useRef } from 'react';
import {
  X,
  Users,
  FileCode2,
  Copy,
  Check,
  Download,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
} from 'lucide-react';
import {
  obterDadosConsolidadosParaAnalise,
  RelatorioConsolidado,
  AnaliseAluno,
} from '@/app/actions/avaliacoes';

type ModalProps = {
  avaliacaoId: string;
  onFechar: () => void;
};

export default function ModalRespostasProfessor({ avaliacaoId, onFechar }: ModalProps) {
  const [abaAtiva, setAbaAtiva] = useState<'respondentes' | 'analise'>('respondentes');
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [relatorio, setRelatorio] = useState<RelatorioConsolidado | null>(null);
  const [copiado, setCopiado] = useState(false);
  const [alunoExpandido, setAlunoExpandido] = useState<number | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const modal = modalRef.current;
    if (modal) {
      modal.style.marginTop = `${window.scrollY - modal.offsetTop}px`;
    }
  }, []);

  useEffect(() => {
    async function carregar() {
      setCarregando(true);
      setErro('');
      try {
        const res = await obterDadosConsolidadosParaAnalise(avaliacaoId);
        if (res.erro) {
          setErro(res.erro);
        } else if (res.relatorio) {
          setRelatorio(res.relatorio);
        }
      } catch {
        setErro('Erro ao carregar respostas e dados de análise.');
      } finally {
        setCarregando(false);
      }
    }

    carregar();
  }, [avaliacaoId]);

  function copiarJson() {
    if (!relatorio) return;
    const jsonStr = JSON.stringify(relatorio, null, 2);
    navigator.clipboard.writeText(jsonStr);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  function baixarJson() {
    if (!relatorio) return;
    const blob = new Blob([JSON.stringify(relatorio, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analise-avaliacao-${avaliacaoId.slice(0, 8)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div
      ref={modalRef}
      className="relative z-50 min-h-screen bg-[#0A2E4A]/60 p-4 backdrop-blur-sm"
    >
      <div className="relative mx-auto my-4 flex w-full max-w-4xl flex-col rounded-[36px] border-[3px] border-[#0A2E4A] bg-white shadow-[0_12px_0_0_#0A2E4A]">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between border-b-2 border-[#0A2E4A]/15 px-6 py-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#0A2E4A] bg-[#FFC53D]">
                <Users className="h-4 w-4 text-[#0A2E4A]" />
              </span>
              <h2 className="font-sans text-2xl font-extrabold text-[#0A2E4A]">
                Respostas da Avaliação #{avaliacaoId.slice(0, 8)}
              </h2>
            </div>
            <p className="text-xs font-semibold text-[#4A6B85]">
              Visualize os alunos que responderam e os dados consolidados para análise de gaps.
            </p>
          </div>

          <button
            type="button"
            onClick={onFechar}
            className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border-2 border-[#0A2E4A] bg-[#FFE3E3] text-[#0A2E4A] transition hover:bg-[#FFC53D]"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Abas */}
        <div className="flex border-b-2 border-[#0A2E4A]/10 bg-[#F4FAFF] px-6 pt-3">
          <button
            type="button"
            onClick={() => setAbaAtiva('respondentes')}
            className={`flex cursor-pointer items-center gap-2 border-b-4 px-4 py-2 font-sans text-sm font-extrabold transition ${
              abaAtiva === 'respondentes'
                ? 'border-[#1D63ED] text-[#1D63ED]'
                : 'border-transparent text-[#4A6B85] hover:text-[#0A2E4A]'
            }`}
          >
            <Users className="h-4 w-4" />
            Alunos que Responderam ({relatorio?.totalRespondentes ?? 0})
          </button>

          <button
            type="button"
            onClick={() => setAbaAtiva('analise')}
            className={`flex cursor-pointer items-center gap-2 border-b-4 px-4 py-2 font-sans text-sm font-extrabold transition ${
              abaAtiva === 'analise'
                ? 'border-[#1D63ED] text-[#1D63ED]'
                : 'border-transparent text-[#4A6B85] hover:text-[#0A2E4A]'
            }`}
          >
            <FileCode2 className="h-4 w-4" />
            Dados para Análise Manual (JSON)
          </button>
        </div>

        {/* Conteúdo */}
        <div className="p-6 font-sans text-[#0A2E4A]">
          {carregando ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#0A2E4A] border-t-[#2496ED]" />
              <p className="mt-3 font-sans text-base font-bold text-[#4A6B85]">
                Carregando dados consolidados...
              </p>
            </div>
          ) : erro ? (
            <div className="rounded-2xl border-2 border-[#0A2E4A] bg-[#FFE3E3] p-6 text-center text-sm font-bold text-[#8A1F1F]">
              {erro}
            </div>
          ) : !relatorio || relatorio.totalRespondentes === 0 ? (
            <div className="rounded-[28px] border-2 border-dashed border-[#0A2E4A]/40 bg-[#F4FAFF] p-12 text-center">
              <Users className="mx-auto mb-3 h-12 w-12 text-[#4A6B85]" />
              <h3 className="font-sans text-xl font-extrabold">Nenhuma resposta registrada ainda</h3>
              <p className="mt-1 text-sm font-semibold text-[#4A6B85]">
                Assim que os alunos enviarem suas resoluções, o diagnóstico e respostas aparecerão aqui.
              </p>
            </div>
          ) : abaAtiva === 'respondentes' ? (
            <div className="space-y-4">
              {/* Resumo de lacunas */}
              {Object.keys(relatorio.lacunasGeraisTurma).length > 0 && (
                <div className="rounded-[22px] border-2 border-[#0A2E4A] bg-[#FFF8E7] p-4 shadow-[0_4px_0_0_#0A2E4A]">
                  <h4 className="flex items-center gap-1.5 font-sans text-sm font-extrabold text-[#9A6200]">
                    <Sparkles className="h-4 w-4" />
                    Lacunas de Aprendizagem Mapeadas na Turma
                  </h4>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {Object.entries(relatorio.lacunasGeraisTurma).map(([lacuna, total]) => (
                      <span
                        key={lacuna}
                        className="inline-flex items-center gap-1 rounded-full border border-[#0A2E4A]/30 bg-white px-3 py-1 text-xs font-extrabold text-[#0A2E4A]"
                      >
                        {lacuna}: <strong className="text-[#C0392B]">{total} ocorrência(s)</strong>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Lista de alunos */}
              <div className="space-y-3">
                {relatorio.alunos.map((item: AnaliseAluno) => {
                  const expandido = alunoExpandido === item.aluno.id;

                  return (
                    <div
                      key={item.aluno.id}
                      className="rounded-[22px] border-2 border-[#0A2E4A] bg-white p-4 shadow-[0_4px_0_0_#0A2E4A]"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-sans text-lg font-extrabold">
                              {item.aluno.nome}
                            </h4>
                            <span className="rounded-full border border-[#0A2E4A]/30 bg-[#EBF5FF] px-2.5 py-0.5 text-xs font-bold text-[#14507F]">
                              Matrícula: {item.aluno.matricula}
                            </span>
                            <span className="rounded-full border border-[#0A2E4A]/30 bg-[#FFEFC2] px-2.5 py-0.5 text-xs font-bold text-[#0A2E4A]">
                              Turma: {item.aluno.turmaId || 'Geral'}
                            </span>
                          </div>
                          <p className="flex items-center gap-1 text-xs font-semibold text-[#4A6B85]">
                            <Clock className="h-3 w-3" />
                            Enviado em {new Date(item.enviadoEm).toLocaleString('pt-BR')}
                          </p>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="rounded-xl border border-[#0A2E4A] bg-[#4ECDC4]/30 px-3 py-1 text-xs font-extrabold text-[#0A2E4A]">
                            Acertos: {item.totalAcertos}/{item.totalCampos} ({item.porcentagemAcerto}%)
                          </span>

                          <button
                            type="button"
                            onClick={() =>
                              setAlunoExpandido(expandido ? null : item.aluno.id)
                            }
                            className="cursor-pointer rounded-xl border-2 border-[#0A2E4A] bg-[#FFC53D] px-3 py-1.5 font-sans text-xs font-extrabold text-[#0A2E4A] shadow-[0_2px_0_0_#0A2E4A] hover:brightness-105 active:translate-y-0.5"
                          >
                            {expandido ? 'Ocultar detalhes' : 'Ver respostas'}
                          </button>
                        </div>
                      </div>

                      {/* Detalhes do aluno */}
                      {expandido && (
                        <div className="mt-4 space-y-3 border-t-2 border-[#0A2E4A]/10 pt-4">
                          {item.diagnostico.map((q) => (
                            <div
                              key={q.questaoIndex}
                              className="rounded-xl border border-[#0A2E4A]/15 bg-[#F9FBFC] p-3 text-xs"
                            >
                              <p className="font-extrabold text-[#14507F]">
                                Questão {q.questaoIndex}: {q.enunciado}
                              </p>

                              <div className="mt-2 space-y-2">
                                {q.campos.map((campo) => (
                                  <div
                                    key={campo.campoId}
                                    className={`flex flex-wrap items-center justify-between gap-2 rounded-lg border p-2.5 ${
                                      campo.correto
                                        ? 'border-[#27AE60]/40 bg-[#E8F8F5]'
                                        : 'border-[#E74C3C]/40 bg-[#FDEDEC]'
                                    }`}
                                  >
                                    <div>
                                      <span className="font-bold">{campo.label}</span>
                                      <div className="flex items-center gap-2 text-xs text-[#4A6B85]">
                                        <span>
                                          Resposta do aluno:{' '}
                                          <strong className="text-[#0A2E4A]">
                                            {campo.respostaAluno !== null
                                              ? String(campo.respostaAluno)
                                              : '(Não respondeu)'}
                                          </strong>
                                        </span>
                                        <span>•</span>
                                        <span>
                                          Esperado:{' '}
                                          <strong className="text-[#0A2E4A]">
                                            {String(campo.respostaEsperada)}
                                          </strong>
                                        </span>
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-1.5">
                                      {campo.correto ? (
                                        <span className="inline-flex items-center gap-1 font-extrabold text-[#27AE60]">
                                          <CheckCircle2 className="h-4 w-4" /> Correto
                                        </span>
                                      ) : (
                                        <div className="text-right">
                                          <span className="inline-flex items-center gap-1 font-extrabold text-[#E74C3C]">
                                            <XCircle className="h-4 w-4" /> Incorreto
                                          </span>
                                          {campo.erroProvavelSeIncorreto && (
                                            <p className="text-xs font-bold text-[#C0392B]">
                                              Gap: {campo.erroProvavelSeIncorreto}
                                            </p>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Aba de Análise Manual JSON */
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border-2 border-[#0A2E4A] bg-[#EBF5FF] p-4 shadow-[0_3px_0_0_#0A2E4A]">
                <div>
                  <h4 className="font-sans text-base font-extrabold text-[#14507F]">
                    Dados estruturados para análise manual
                  </h4>
                  <p className="text-xs font-semibold text-[#4A6B85]">
                    O JSON inclui os enunciados, campos de validação, mapeamento de erros da IA, dados de cada aluno e diagnóstico individual.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={copiarJson}
                    className="flex cursor-pointer items-center gap-1.5 rounded-xl border-2 border-[#0A2E4A] bg-white px-3 py-2 font-sans text-xs font-extrabold text-[#0A2E4A] shadow-[0_2px_0_0_#0A2E4A] hover:bg-[#FFEFC2]"
                  >
                    {copiado ? <Check className="h-4 w-4 text-[#27AE60]" /> : <Copy className="h-4 w-4" />}
                    {copiado ? 'Copiado!' : 'Copiar JSON'}
                  </button>

                  <button
                    type="button"
                    onClick={baixarJson}
                    className="flex cursor-pointer items-center gap-1.5 rounded-xl border-2 border-[#0A2E4A] bg-[#2496ED] px-3 py-2 font-sans text-xs font-extrabold text-white shadow-[0_2px_0_0_#16457E] hover:brightness-105"
                  >
                    <Download className="h-4 w-4" />
                    Baixar arquivo (.json)
                  </button>
                </div>
              </div>

              <pre className="whitespace-pre-wrap break-all rounded-2xl border-2 border-[#0A2E4A] bg-[#0A2E4A] p-4 text-xs font-mono text-[#EBF5FF] shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)]">
                {JSON.stringify(relatorio, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
