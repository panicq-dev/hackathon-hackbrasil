"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  BrainCircuit,
  CheckCircle2,
  ClipboardList,
  Lightbulb,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import {
  gerarInsightsAluno,
  obterEstatisticasDoAluno,
} from "@/app/actions/alunos";
import type { InsightsAluno } from "@/app/actions/alunos";
import { DashboardChrome } from "../../../../DashboardView";
import type { UsuarioSessao } from "@/app/src/lib/session";
import type { EstatisticasAluno } from "@/app/src/lib/estatisticasAluno";

type Props = {
  turmaId: string;
  alunoId: string;
  usuario: UsuarioSessao;
  anoInicial: number;
  bimestreInicial: number | null;
};

const BIMESTRES = [
  { valor: 1, nome: "1º bimestre (jan–mar)" },
  { valor: 2, nome: "2º bimestre (abr–jun)" },
  { valor: 3, nome: "3º bimestre (jul–set)" },
  { valor: 4, nome: "4º bimestre (out–dez)" },
];

function formatarPercentual(valor: number | null): string {
  return valor === null ? "—" : `${valor}%`;
}

function formatarData(valor: string): string {
  return new Date(valor).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
}

function CartaoIndicador({
  rotulo,
  valor,
  detalhe,
  cor = "bg-[#EBF5FF]",
}: {
  rotulo: string;
  valor: string;
  detalhe: string;
  cor?: string;
}) {
  return (
    <article className="rounded-[22px] border-[3px] border-[#0A2E4A] bg-white p-4 shadow-[0_4px_0_0_#0A2E4A]">
      <span className={`mb-3 grid h-10 w-10 place-items-center rounded-[14px] border-2 border-[#0A2E4A] ${cor}`}>
        <CheckCircle2 className="h-5 w-5" />
      </span>
      <p className="text-[11px] font-extrabold tracking-wide text-[#4A6B85]">{rotulo}</p>
      <p className="mt-1 font-sans text-3xl font-extrabold">{valor}</p>
      <p className="mt-1 text-xs font-semibold text-[#4A6B85]">{detalhe}</p>
    </article>
  );
}

function TituloSecao({ titulo, descricao }: { titulo: string; descricao: string }) {
  return (
    <div className="mb-4">
      <h2 className="font-sans text-xl font-extrabold">{titulo}</h2>
      <p className="mt-1 text-xs font-semibold text-[#4A6B85]">{descricao}</p>
    </div>
  );
}

export default function AlunoDetalheView({
  turmaId,
  alunoId,
  usuario,
  anoInicial,
  bimestreInicial,
}: Props) {
  const [ano, setAno] = useState(anoInicial);
  const [bimestre, setBimestre] = useState<number | null>(bimestreInicial);
  const [alunoNome, setAlunoNome] = useState("");
  const [matricula, setMatricula] = useState("");
  const [turmaNome, setTurmaNome] = useState("");
  const [anosDisponiveis, setAnosDisponiveis] = useState<number[]>([anoInicial]);
  const [estatisticas, setEstatisticas] = useState<EstatisticasAluno | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [recarregar, setRecarregar] = useState(0);
  const [insights, setInsights] = useState<InsightsAluno | null>(null);
  const [carregandoInsights, setCarregandoInsights] = useState(false);
  const [erroInsights, setErroInsights] = useState("");

  useEffect(() => {
    let ativo = true;
    Promise.resolve().then(async () => {
      setCarregando(true);
      setErro("");
      setInsights(null);
      setErroInsights("");
      try {
        const resultado = await obterEstatisticasDoAluno(turmaId, Number(alunoId), ano, bimestre);
        if (!ativo) return;
        if (resultado.erro || !resultado.estatisticas || !resultado.aluno || !resultado.turma) {
          setErro(resultado.erro ?? "Não foi possível carregar as estatísticas do aluno.");
          setEstatisticas(null);
          return;
        }
        setAlunoNome(resultado.aluno.nome);
        setMatricula(resultado.aluno.matricula);
        setTurmaNome(resultado.turma.nome);
        setAnosDisponiveis(resultado.anosDisponiveis ?? [ano]);
        setEstatisticas(resultado.estatisticas);
      } catch {
        if (!ativo) return;
        setErro("Não foi possível carregar as estatísticas do aluno. Tente novamente.");
        setEstatisticas(null);
      } finally {
        if (ativo) setCarregando(false);
      }
    });

    return () => {
      ativo = false;
    };
  }, [turmaId, alunoId, ano, bimestre, recarregar]);

  async function solicitarInsights() {
    setCarregandoInsights(true);
    setErroInsights("");
    try {
      const resultado = await gerarInsightsAluno(turmaId, Number(alunoId), ano, bimestre);
      if (resultado.erro || !resultado.insights) {
        setErroInsights(resultado.erro ?? "Não foi possível gerar os insights.");
        setInsights(null);
        return;
      }
      setInsights(resultado.insights);
    } catch {
      setErroInsights("Não foi possível gerar os insights. Tente novamente.");
    } finally {
      setCarregandoInsights(false);
    }
  }

  const linkVoltar = `/dashboard/turmas/${encodeURIComponent(turmaId)}?ano=${ano}&bimestre=${bimestre ?? "ano"}`;
  const tendenciaLabel = estatisticas?.tendencia === "melhora"
    ? "Em melhora"
    : estatisticas?.tendencia === "queda"
      ? "Em atenção"
      : estatisticas?.tendencia === "estavel"
        ? "Estável"
        : "Sem histórico";

  return (
    <DashboardChrome usuario={usuario}>
      <main className="relative z-10 mx-auto max-w-5xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href={linkVoltar} className="inline-flex items-center gap-2 font-sans text-sm font-bold text-[#4A6B85] hover:text-[#0A2E4A]">
            <ArrowLeft className="h-4 w-4" /> Voltar para {turmaNome || "a turma"}
          </Link>
          <span className="rounded-full border-2 border-[#0A2E4A] bg-[#FFEFC2] px-3 py-1 text-xs font-extrabold">
            Matrícula {matricula || "—"}
          </span>
        </div>

        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mb-1 text-sm font-extrabold text-[#4A6B85]">VISÃO INDIVIDUAL · {turmaNome || "Turma"}</p>
            <h1 className="font-sans text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
              {carregando ? "Carregando aluno..." : alunoNome || "Estatísticas do aluno"}
            </h1>
            <svg aria-hidden viewBox="0 0 220 14" className="mt-1 h-3 w-44 text-[#FFC53D]" fill="none">
              <path d="M3 9 C 40 2, 70 13, 110 7 S 180 3, 217 8" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
            </svg>
            <p className="mt-3 max-w-xl text-sm font-semibold text-[#4A6B85]">
              Acompanhe conquistas, dificuldades e próximos passos para apoiar a aprendizagem.
            </p>
          </div>

          <div className="grid gap-2 sm:min-w-[280px] sm:grid-cols-2">
            <label className="rounded-[15px] border-2 border-[#0A2E4A] bg-[#EBF5FF] px-3 py-2 shadow-[0_2px_0_0_#0A2E4A]">
              <span className="sr-only">Ano letivo</span>
              <select aria-label="Ano letivo" value={ano} onChange={(event) => setAno(Number(event.target.value))} className="w-full cursor-pointer bg-transparent text-xs font-extrabold outline-none">
                {Array.from(new Set([ano, ...anosDisponiveis])).sort((a, b) => b - a).map((opcao) => (
                  <option key={opcao} value={opcao}>Ano letivo {opcao}</option>
                ))}
              </select>
            </label>
            <label className="rounded-[15px] border-2 border-[#0A2E4A] bg-[#EBF5FF] px-3 py-2 shadow-[0_2px_0_0_#0A2E4A]">
              <span className="sr-only">Bimestre</span>
              <select aria-label="Bimestre" value={bimestre ?? "ano"} onChange={(event) => setBimestre(event.target.value === "ano" ? null : Number(event.target.value))} className="w-full cursor-pointer bg-transparent text-xs font-extrabold outline-none">
                <option value="ano">Ano letivo (geral)</option>
                {BIMESTRES.map((opcao) => <option key={opcao.valor} value={opcao.valor}>{opcao.nome}</option>)}
              </select>
            </label>
          </div>
        </header>

        {erro && (
          <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-[20px] border-2 border-[#0A2E4A] bg-[#FFE3E3] px-4 py-3 text-sm font-bold text-[#8A1F1F] shadow-[0_3px_0_0_#0A2E4A]">
            <span>{erro}</span>
            <button type="button" onClick={() => setRecarregar((valor) => valor + 1)} className="rounded-full border-2 border-[#0A2E4A] bg-white px-3 py-1 text-xs font-extrabold">
              Tentar novamente
            </button>
          </div>
        )}

        <section>
          <TituloSecao titulo="Indicadores gerais" descricao="Taxa de acerto, ritmo de entrega e comparação com a média da turma." />
          {carregando ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {Array.from({ length: 4 }, (_, indice) => <div key={indice} className="h-36 animate-pulse rounded-[22px] bg-white" />)}
            </div>
          ) : estatisticas ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <CartaoIndicador rotulo="TAXA DE ACERTO" valor={formatarPercentual(estatisticas.percentual)} detalhe={`${estatisticas.totalAcertos} acertos em ${estatisticas.totalCampos} campos`} cor="bg-[#D1F2D9]" />
              <CartaoIndicador rotulo="MÉDIA DA TURMA" valor={formatarPercentual(estatisticas.mediaTurma)} detalhe={estatisticas.diferencaDaTurma === null ? "Sem comparação neste período" : `${estatisticas.diferencaDaTurma > 0 ? "+" : ""}${estatisticas.diferencaDaTurma} pontos em relação à turma`} cor="bg-[#BFE3F7]" />
              <CartaoIndicador rotulo="ENTREGAS" valor={`${estatisticas.totalRespondidas}/${estatisticas.totalAvaliacoes}`} detalhe={`${formatarPercentual(estatisticas.taxaEntrega)} de taxa de entrega · ${estatisticas.pendencias} pendentes`} cor="bg-[#FFEFC2]" />
              <CartaoIndicador rotulo="POSIÇÃO NA TURMA" valor={estatisticas.posicaoNaTurma === null ? "—" : `${estatisticas.posicaoNaTurma}º`} detalhe={estatisticas.totalAlunosComDesempenho ? `Entre ${estatisticas.totalAlunosComDesempenho} alunos com respostas` : "Ainda sem respostas avaliadas"} cor="bg-[#FFD3DB]" />
            </div>
          ) : (
            <div className="rounded-[24px] border-2 border-dashed border-[#0A2E4A]/40 bg-white p-8 text-center text-sm font-semibold text-[#4A6B85]">
              Não há estatísticas disponíveis para este período.
            </div>
          )}
        </section>

        {estatisticas && !carregando && (
          <>
            <section className="rounded-[28px] border-[3px] border-[#0A2E4A] bg-white p-5 shadow-[0_5px_0_0_#0A2E4A]">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <TituloSecao titulo="Evolução do desempenho" descricao="Compare a trajetória do aluno com a média da turma em cada avaliação respondida." />
                </div>
                <span className={`inline-flex items-center gap-2 rounded-full border-2 border-[#0A2E4A] px-3 py-1 text-xs font-extrabold ${estatisticas.tendencia === "melhora" ? "bg-[#D1F2D9]" : estatisticas.tendencia === "queda" ? "bg-[#FFE3E3]" : "bg-[#FFEFC2]"}`}>
                  {estatisticas.tendencia === "queda" ? <TrendingDown className="h-4 w-4" /> : <TrendingUp className="h-4 w-4" />}
                  {tendenciaLabel}{estatisticas.variacaoRecente === null ? "" : ` · ${estatisticas.variacaoRecente > 0 ? "+" : ""}${estatisticas.variacaoRecente} pts`}
                </span>
              </div>
              {!estatisticas.evolucao.length ? (
                <p className="rounded-2xl bg-[#F6FBFF] py-10 text-center text-sm font-semibold text-[#4A6B85]">
                  Ainda não há avaliações respondidas para visualizar a evolução.
                </p>
              ) : (
                <div className="grid grid-flow-col auto-cols-[minmax(90px,1fr)] items-end gap-3 overflow-x-auto pb-2">
                  {estatisticas.evolucao.map((ponto) => (
                    <div key={ponto.avaliacaoId} className="text-center">
                      <p className="mb-2 text-xs font-extrabold">{ponto.percentual}% <span className="font-bold text-[#4A6B85]">/ {formatarPercentual(ponto.mediaTurma)}</span></p>
                      <div className="flex h-36 items-end justify-center gap-2 rounded-t-xl bg-[#F6FBFF] px-2">
                        <div role="img" aria-label={`Aluno: ${ponto.percentual}%`} title={`Aluno: ${ponto.percentual}%`} className="w-7 rounded-t-lg border-2 border-b-0 border-[#0A2E4A] bg-[#FFC53D]" style={{ height: `${Math.max(ponto.percentual, 4)}%` }} />
                        {ponto.mediaTurma !== null && <div role="img" aria-label={`Média da turma: ${ponto.mediaTurma}%`} title={`Média da turma: ${ponto.mediaTurma}%`} className="w-7 rounded-t-lg border-2 border-b-0 border-[#0A2E4A] bg-[#4ECDC4]" style={{ height: `${Math.max(ponto.mediaTurma, 4)}%` }} />}
                      </div>
                      <p className="mt-2 text-[10px] font-bold text-[#4A6B85]">{formatarData(ponto.criadoEm)}</p>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-3 flex flex-wrap gap-4 text-xs font-bold text-[#4A6B85]">
                <span className="inline-flex items-center gap-2"><i className="h-3 w-3 rounded-sm border border-[#0A2E4A] bg-[#FFC53D]" /> Aluno</span>
                <span className="inline-flex items-center gap-2"><i className="h-3 w-3 rounded-sm border border-[#0A2E4A] bg-[#4ECDC4]" /> Média da turma</span>
              </div>
            </section>

            <div className="grid gap-5 lg:grid-cols-2">
              <section className="rounded-[28px] border-[3px] border-[#0A2E4A] bg-white p-5 shadow-[0_5px_0_0_#0A2E4A]">
                <TituloSecao titulo="Maiores dificuldades" descricao="Causas de erro recorrentes que podem orientar uma retomada direcionada." />
                {!estatisticas.causasRaiz.length ? (
                  <p className="rounded-2xl bg-[#F6FBFF] p-5 text-sm font-semibold text-[#4A6B85]">Nenhuma dificuldade foi identificada nas respostas deste período.</p>
                ) : (
                  <ul className="space-y-3">
                    {estatisticas.causasRaiz.slice(0, 6).map((causa) => {
                      const maximo = estatisticas.causasRaiz[0].totalErros;
                      return <li key={causa.causaRaiz}>
                        <div className="mb-1 flex justify-between gap-2 text-xs font-bold"><span>{causa.causaRaiz}</span><span>{causa.totalErros} erros</span></div>
                        <div className="h-2 overflow-hidden rounded-full bg-[#EBF5FF]"><div className="h-full rounded-full bg-[#FF8A65]" style={{ width: `${(causa.totalErros / maximo) * 100}%` }} /></div>
                      </li>;
                    })}
                  </ul>
                )}
                <div className="mt-5 border-t border-[#0A2E4A]/15 pt-4">
                  <h3 className="mb-2 inline-flex items-center gap-2 font-sans text-sm font-extrabold"><Target className="h-4 w-4" /> Pontos fortes observados</h3>
                  {!estatisticas.pontosFortes.length ? (
                    <p className="text-xs font-semibold text-[#4A6B85]">Mais respostas serão necessárias para identificar habilidades consolidadas.</p>
                  ) : <ul className="space-y-2">{estatisticas.pontosFortes.map((ponto) => <li key={ponto.campo} className="flex justify-between gap-2 rounded-xl bg-[#D1F2D9]/60 px-3 py-2 text-xs"><span className="font-bold">{ponto.campo}</span><span className="shrink-0 font-extrabold">{ponto.percentual}% ({ponto.totalAcertos}/{ponto.totalCampos})</span></li>)}</ul>}
                </div>
              </section>

              <section className="rounded-[28px] border-[3px] border-[#0A2E4A] bg-white p-5 shadow-[0_5px_0_0_#0A2E4A]">
                <TituloSecao titulo="Desempenho por formato" descricao="Acertos por tipo de campo e respostas deixadas em branco." />
                {!estatisticas.porTipoCampo.length ? (
                  <p className="rounded-2xl bg-[#F6FBFF] p-5 text-sm font-semibold text-[#4A6B85]">Sem respostas avaliadas neste período.</p>
                ) : <ul className="space-y-3">{estatisticas.porTipoCampo.map((item) => <li key={item.tipo}>
                  <div className="mb-1 flex justify-between text-xs font-bold"><span className="capitalize">{item.tipo}</span><span>{item.percentual}% · {item.totalAcertos}/{item.totalCampos}</span></div>
                  <div className="h-3 overflow-hidden rounded-full bg-[#EBF5FF]"><div className="h-full rounded-full bg-[#2496ED]" style={{ width: `${item.percentual}%` }} /></div>
                </li>)}</ul>}
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border-2 border-[#0A2E4A]/20 bg-[#FFEFC2] p-3"><p className="text-[10px] font-extrabold text-[#4A6B85]">CAMPOS EM BRANCO</p><p className="font-sans text-2xl font-extrabold">{estatisticas.camposEmBranco}</p></div>
                  <div className="rounded-2xl border-2 border-[#0A2E4A]/20 bg-[#BFE3F7] p-3"><p className="text-[10px] font-extrabold text-[#4A6B85]">AVALIAÇÕES PENDENTES</p><p className="font-sans text-2xl font-extrabold">{estatisticas.pendencias}</p></div>
                </div>
              </section>
            </div>

            <section className="rounded-[28px] border-[3px] border-[#0A2E4A] bg-white p-5 shadow-[0_5px_0_0_#0A2E4A]">
              <div className="mb-4 flex items-start gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[14px] border-2 border-[#0A2E4A] bg-[#FFD3DB]"><ClipboardList className="h-5 w-5" /></span>
                <div><h2 className="font-sans text-xl font-extrabold">Questões para revisar</h2><p className="mt-1 text-xs font-semibold text-[#4A6B85]">Veja o esperado e a resposta registrada para planejar a devolutiva.</p></div>
              </div>
              {!estatisticas.questoesCriticas.length ? (
                <p className="rounded-2xl bg-[#D1F2D9]/60 p-5 text-sm font-semibold">Não há respostas incorretas nas avaliações respondidas deste período.</p>
              ) : (
                <ul className="grid gap-3 md:grid-cols-2">
                  {estatisticas.questoesCriticas.map((questao, indice) => (
                    <li key={`${questao.avaliacaoId}-${questao.campoId}-${indice}`} className="rounded-[20px] border-2 border-[#0A2E4A]/20 bg-[#FFF9ED] p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-extrabold"><span>Avaliação {formatarData(questao.criadoEm)} · Questão {questao.numeroQuestao}</span><span className="rounded-full bg-[#FFE3E3] px-2 py-1">{questao.causaRaiz}</span></div>
                      <p className="mt-2 text-sm font-bold">{questao.enunciado}</p>
                      <p className="mt-1 text-xs font-semibold text-[#4A6B85]">{questao.campoLabel}</p>
                      <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        <p className="rounded-xl bg-white p-2 text-xs"><span className="block font-extrabold text-[#4A6B85]">Resposta dada</span><span className="font-bold">{questao.respostaDada === null || String(questao.respostaDada).trim() === "" ? "Em branco" : String(questao.respostaDada)}</span></p>
                        <p className="rounded-xl bg-[#D1F2D9]/70 p-2 text-xs"><span className="block font-extrabold text-[#4A6B85]">Resposta esperada</span><span className="font-bold">{questao.respostaEsperada}</span></p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="rounded-[28px] border-[3px] border-[#0A2E4A] bg-[#EBF5FF] p-5 shadow-[0_5px_0_0_#0A2E4A]">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[15px] border-2 border-[#0A2E4A] bg-[#FFC53D]"><BrainCircuit className="h-6 w-6" /></span>
                  <div><h2 className="font-sans text-xl font-extrabold">Insights para apoiar o aluno</h2><p className="mt-1 max-w-xl text-xs font-semibold text-[#4A6B85]">Sugestões pedagógicas com base nos indicadores, geradas somente quando você solicitar.</p></div>
                </div>
                {!insights && (
                  <button type="button" disabled={carregandoInsights || estatisticas.totalRespondidas === 0} onClick={solicitarInsights} className="inline-flex items-center gap-2 rounded-full border-2 border-[#0A2E4A] bg-[#FFC53D] px-4 py-2.5 text-sm font-extrabold shadow-[0_3px_0_0_#0A2E4A] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60">
                    <Sparkles className="h-4 w-4" />{carregandoInsights ? "Analisando..." : "Gerar insights por IA"}
                  </button>
                )}
              </div>
              {estatisticas.totalRespondidas === 0 && <p className="mt-4 text-xs font-bold text-[#4A6B85]">A IA estará disponível após o aluno responder uma avaliação neste período.</p>}
              {erroInsights && <p role="alert" className="mt-4 rounded-xl border-2 border-[#0A2E4A] bg-[#FFE3E3] p-3 text-xs font-bold text-[#8A1F1F]">{erroInsights}</p>}
              {carregandoInsights && <div className="mt-4 flex items-center gap-2 rounded-xl bg-white/80 p-4 text-sm font-bold"><Sparkles className="h-4 w-4 animate-pulse" /> Preparando sugestões com os dados do período...</div>}
              {insights && (
                <div className="mt-5 space-y-4 rounded-[22px] border-2 border-[#0A2E4A] bg-white p-5">
                  <p className="text-sm font-bold">{insights.resumo}</p>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div><h3 className="mb-2 inline-flex items-center gap-2 text-sm font-extrabold"><Target className="h-4 w-4" /> Prioridades</h3><ul className="list-inside list-disc space-y-1 text-xs font-semibold">{insights.prioridades.map((item, index) => <li key={`${index}-${item}`}>{item}</li>)}</ul></div>
                    <div><h3 className="mb-2 inline-flex items-center gap-2 text-sm font-extrabold"><Lightbulb className="h-4 w-4" /> Estratégias para experimentar</h3><ul className="list-inside list-disc space-y-1 text-xs font-semibold">{insights.estrategias.map((item, index) => <li key={`${index}-${item}`}>{item}</li>)}</ul></div>
                  </div>
                  <p className="rounded-xl bg-[#D1F2D9]/60 p-3 text-xs font-semibold"><strong>Acompanhe assim:</strong> {insights.acompanhamento}</p>
                </div>
              )}
              {!insights && !carregandoInsights && erroInsights && estatisticas.totalRespondidas > 0 && (
                <button type="button" onClick={solicitarInsights} className="mt-3 inline-flex items-center gap-2 rounded-full border-2 border-[#0A2E4A] bg-white px-3 py-1.5 text-xs font-extrabold"><Sparkles className="h-3.5 w-3.5" /> Tentar novamente</button>
              )}
            </section>
          </>
        )}

        {estatisticas && !carregando && estatisticas.totalAvaliacoes === 0 && (
          <div className="rounded-[24px] border-2 border-dashed border-[#0A2E4A]/40 bg-white p-6 text-center text-sm font-semibold text-[#4A6B85]">
            <AlertTriangle className="mx-auto mb-2 h-6 w-6" />Não há avaliações no período selecionado.
          </div>
        )}
      </main>
    </DashboardChrome>
  );
}