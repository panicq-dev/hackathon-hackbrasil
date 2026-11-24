"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowUpDown,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  GraduationCap,
  Search,
  UserRound,
  Users,
} from "lucide-react";
import { obterDesempenhoDaTurma, DesempenhoTurma } from "@/app/actions/turmas";
import { DashboardChrome } from "../../DashboardView";
import { UsuarioSessao } from "@/app/src/lib/session";

type Props = {
  turmaId: string;
  usuario: UsuarioSessao;
};

type FiltroNivel = "todos" | "consolidado" | "desenvolvimento" | "apoio" | "sem-avaliacao";
type FiltroEntrega = "todas" | "entregues" | "pendentes";
type Ordenacao = "nome" | "desempenho";

const ROTULOS_FAIXA: Record<DesempenhoTurma["alunos"][number]["faixa"], string> = {
  consolidado: "Consolidado",
  desenvolvimento: "Em desenvolvimento",
  apoio: "Precisa de apoio",
  "sem-avaliacao": "Sem avaliação",
};

const CORES_FAIXA: Record<DesempenhoTurma["alunos"][number]["faixa"], string> = {
  consolidado: "bg-[#D1F2D9] text-[#0F5132]",
  desenvolvimento: "bg-[#FFEFC2] text-[#0A2E4A]",
  apoio: "bg-[#FFE3E3] text-[#8A1F1F]",
  "sem-avaliacao": "bg-[#BFE3F7] text-[#0A2E4A]",
};

const BIMESTRES = [
  { valor: 1, nome: "1º bimestre (jan–mar)" },
  { valor: 2, nome: "2º bimestre (abr–jun)" },
  { valor: 3, nome: "3º bimestre (jul–set)" },
  { valor: 4, nome: "4º bimestre (out–dez)" },
];

export default function DashboardTurmaView({
  turmaId,
  usuario,
}: Props) {
  const [ano, setAno] = useState(() => new Date().getFullYear());
  const [bimestre, setBimestre] = useState<number | null>(null);
  const [desempenho, setDesempenho] = useState<DesempenhoTurma | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [recarga, setRecarga] = useState(0);
  const [busca, setBusca] = useState("");
  const [filtroNivel, setFiltroNivel] = useState<FiltroNivel>("todos");
  const [filtroEntrega, setFiltroEntrega] = useState<FiltroEntrega>("todas");
  const [ordenacao, setOrdenacao] = useState<Ordenacao>("nome");

  useEffect(() => {
    let ativo = true;

    Promise.resolve().then(async () => {
      if (!ativo) return;
      setCarregando(true);
      setErro("");

      try {
        const resultado = await obterDesempenhoDaTurma(turmaId, ano, bimestre);
        if (!ativo) return;
        if (resultado.erro || !resultado.desempenho) {
          setErro(resultado.erro ?? "Não foi possível carregar o desempenho da turma.");
          setDesempenho(null);
          return;
        }
        setDesempenho(resultado.desempenho);
      } catch (e: unknown) {
        if (!ativo) return;
        console.error("Erro ao carregar o desempenho da turma:", e);
        setErro("Não foi possível carregar o desempenho da turma. Tente novamente.");
        setDesempenho(null);
      } finally {
        if (ativo) setCarregando(false);
      }
    });

    return () => {
      ativo = false;
    };
  }, [turmaId, ano, bimestre, recarga]);

  const alunosVisiveis = useMemo(() => {
    if (!desempenho) return [];

    const termo = busca.trim().toLocaleLowerCase("pt-BR");
    return desempenho.alunos
      .filter((aluno) => aluno.nome.toLocaleLowerCase("pt-BR").includes(termo))
      .filter((aluno) => filtroNivel === "todos" || aluno.faixa === filtroNivel)
      .filter((aluno) => {
        if (filtroEntrega === "todas") return true;
        return filtroEntrega === "entregues"
          ? aluno.totalRespondidas > 0
          : aluno.totalRespondidas < aluno.totalAvaliacoes;
      })
      .sort((a, b) => {
        if (ordenacao === "desempenho") {
          const diferenca = (b.percentual ?? -1) - (a.percentual ?? -1);
          if (diferenca !== 0) return diferenca;
        }
        return a.nome.localeCompare(b.nome, "pt-BR");
      });
  }, [busca, desempenho, filtroEntrega, filtroNivel, ordenacao]);

  return (
    <DashboardChrome usuario={usuario}>
      <main className="relative z-10 mx-auto max-w-5xl">
        <Link
          href="/dashboard"
          className="mb-4 inline-flex items-center gap-2 font-sans text-sm font-bold text-[#4A6B85] hover:text-[#0A2E4A]"
        >
          <ArrowLeft className="h-4 w-4" />
          Minhas turmas
        </Link>

        <header className="mb-6">
          <h1 className="font-sans text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
            Desempenho da turma
          </h1>
          <svg aria-hidden viewBox="0 0 220 14" className="mt-1 h-3 w-44 text-[#FFC53D]" fill="none">
            <path
              d="M3 9 C 40 2, 70 13, 110 7 S 180 3, 217 8"
              stroke="currentColor"
              strokeWidth="5"
              strokeLinecap="round"
            />
          </svg>
          <p className="mt-3 max-w-xl text-sm font-semibold text-[#4A6B85] sm:text-base">
            Acompanhe o aproveitamento dos alunos com base nas questões respondidas nas avaliações desta turma.
          </p>
        </header>

        <section className="mb-6 flex flex-col justify-between gap-4 rounded-[28px] border-[3px] border-[#0A2E4A] bg-white p-5 shadow-[0_5px_0_0_#0A2E4A] sm:flex-row sm:items-center">
          <div className="flex min-w-0 items-center gap-4">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[20px_25px_18px_23px] border-[3px] border-[#0A2E4A] bg-[#FFC53D]">
              <GraduationCap className="h-7 w-7" />
            </span>
            <div className="min-w-0">
              <h2 className="truncate font-sans text-2xl font-extrabold">
                {desempenho?.nome ?? (carregando ? "Carregando turma..." : "Turma")}
              </h2>
              <p className="mt-1 text-xs font-bold text-[#4A6B85]">
                Código: {turmaId}　•　{desempenho?.alunos.length ?? "—"} alunos　•　
                {desempenho?.totalAvaliacoes ?? "—"} avaliações no período
              </p>
            </div>
          </div>

          <div className="grid gap-2 sm:min-w-[280px] sm:grid-cols-2">
            <label className="flex items-center gap-2 rounded-[15px] border-2 border-[#0A2E4A] bg-[#EBF5FF] px-3 py-2 shadow-[0_2px_0_0_#0A2E4A]">
              <CalendarDays className="h-4 w-4 shrink-0" />
              <span className="sr-only">Ano letivo</span>
              <select
                aria-label="Ano letivo"
                value={ano}
                onChange={(event) => setAno(Number(event.target.value))}
                className="w-full cursor-pointer bg-transparent text-xs font-extrabold outline-none"
              >
                {Array.from(
                  new Set([ano, ...(desempenho?.anosDisponiveis ?? [])])
                )
                  .sort((a, b) => b - a)
                  .map((opcaoAno) => (
                    <option key={opcaoAno} value={opcaoAno}>
                      Ano letivo {opcaoAno}
                    </option>
                  ))}
              </select>
            </label>
            <label className="flex items-center gap-2 rounded-[15px] border-2 border-[#0A2E4A] bg-[#EBF5FF] px-3 py-2 shadow-[0_2px_0_0_#0A2E4A]">
              <CalendarDays className="h-4 w-4 shrink-0" />
              <span className="sr-only">Bimestre</span>
              <select
                aria-label="Bimestre"
                value={bimestre ?? "ano"}
                onChange={(event) =>
                  setBimestre(event.target.value === "ano" ? null : Number(event.target.value))
                }
                className="w-full cursor-pointer bg-transparent text-xs font-extrabold outline-none"
              >
                <option value="ano">Ano letivo (geral)</option>
                {BIMESTRES.map((opcao) => (
                  <option key={opcao.valor} value={opcao.valor}>
                    {opcao.nome}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>

        <div className="mb-6 flex gap-6 border-b-2 border-[#0A2E4A]/15">
          <span className="border-b-[3px] border-[#FFC53D] pb-2 font-sans text-sm font-extrabold">
            Alunos <span className="ml-1 text-[#4A6B85]">{desempenho?.alunos.length ?? "—"}</span>
          </span>
          <span className="pb-2 font-sans text-sm font-bold text-[#4A6B85]">
            Desempenho
          </span>
        </div>

        {erro && (
          <div
            role="alert"
            className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-[20px] border-2 border-[#0A2E4A] bg-[#FFE3E3] px-4 py-3 text-sm font-bold text-[#8A1F1F] shadow-[0_3px_0_0_#0A2E4A]"
          >
            <span>{erro}</span>
            <button
              type="button"
              onClick={() => setRecarga((valor) => valor + 1)}
              className="rounded-full border-2 border-[#0A2E4A] bg-white px-3 py-1 font-sans text-xs font-extrabold"
            >
              Tente novamente
            </button>
          </div>
        )}

        <section className="mb-7">
          <h2 className="font-sans text-xl font-extrabold">
            Um olhar sobre a aprendizagem
          </h2>
          <p className="mb-4 mt-1 text-xs font-semibold text-[#4A6B85]">
            Questões com múltiplos campos recebem pontuação proporcional aos campos corretos.
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <article className="flex items-center gap-3 rounded-[22px] border-[3px] border-[#0A2E4A] bg-white p-4 shadow-[0_4px_0_0_#0A2E4A]">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[14px] border-2 border-[#0A2E4A] bg-[#FFE3E3]">
                <BarChart3 className="h-5 w-5" />
              </span>
              <div>
                <p className="text-xs font-extrabold text-[#4A6B85]">APROVEITAMENTO MÉDIO</p>
                <p className="font-sans text-2xl font-extrabold">
                  {carregando ? "—" : desempenho?.mediaTurma === null ? "—" : `${desempenho?.mediaTurma}%`}
                </p>
                <p className="text-xs font-semibold text-[#4A6B85]">Média dos alunos com respostas</p>
              </div>
            </article>
            <article className="flex items-center gap-3 rounded-[22px] border-[3px] border-[#0A2E4A] bg-white p-4 shadow-[0_4px_0_0_#0A2E4A]">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[14px] border-2 border-[#0A2E4A] bg-[#D1F2D9]">
                <CheckCircle2 className="h-5 w-5" />
              </span>
              <div>
                <p className="text-xs font-extrabold text-[#4A6B85]">CONSOLIDADOS</p>
                <p className="font-sans text-2xl font-extrabold">
                  {carregando ? "—" : desempenho?.consolidados ?? 0}
                </p>
                <p className="text-xs font-semibold text-[#4A6B85]">80% ou mais</p>
              </div>
            </article>
            <article className="flex items-center gap-3 rounded-[22px] border-[3px] border-[#0A2E4A] bg-white p-4 shadow-[0_4px_0_0_#0A2E4A]">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[14px] border-2 border-[#0A2E4A] bg-[#FFEFC2]">
                <Users className="h-5 w-5" />
              </span>
              <div>
                <p className="text-xs font-extrabold text-[#4A6B85]">EM DESENVOLVIMENTO</p>
                <p className="font-sans text-2xl font-extrabold">
                  {carregando ? "—" : desempenho?.emDesenvolvimento ?? 0}
                </p>
                <p className="text-xs font-semibold text-[#4A6B85]">50% a 79%</p>
              </div>
            </article>
            <article className="flex items-center gap-3 rounded-[22px] border-[3px] border-[#0A2E4A] bg-white p-4 shadow-[0_4px_0_0_#0A2E4A]">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[14px] border-2 border-[#0A2E4A] bg-[#FFE3E3]">
                <GraduationCap className="h-5 w-5" />
              </span>
              <div>
                <p className="text-xs font-extrabold text-[#4A6B85]">PRECISAM DE APOIO</p>
                <p className="font-sans text-2xl font-extrabold">
                  {carregando ? "—" : desempenho?.precisamDeApoio ?? 0}
                </p>
                <p className="text-xs font-semibold text-[#4A6B85]">Abaixo de 50%</p>
              </div>
            </article>
          </div>
        </section>

        <section>
          <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="font-sans text-xl font-extrabold">Alunos da turma</h2>
              <p className="mt-1 text-xs font-semibold text-[#4A6B85]">
                Cada aluno tem seu ritmo. Acompanhe a evolução nas avaliações do período.
              </p>
            </div>
            <span className="text-xs font-extrabold text-[#4A6B85]">
              {alunosVisiveis.length} de {desempenho?.alunos.length ?? "—"} alunos
            </span>
          </div>

          <div className="mb-2 flex flex-wrap gap-2">
            <label className="flex min-w-[220px] flex-1 items-center gap-2 rounded-[14px] border-2 border-[#0A2E4A] bg-white px-3 py-2.5 shadow-[0_2px_0_0_#0A2E4A]">
              <Search className="h-4 w-4 text-[#4A6B85]" />
              <span className="sr-only">Buscar aluno</span>
              <input
                value={busca}
                onChange={(event) => setBusca(event.target.value)}
                placeholder="Buscar pelo nome do aluno"
                className="w-full bg-transparent text-xs font-semibold outline-none placeholder:text-[#5A7C99]"
              />
            </label>
            <label className="rounded-[14px] border-2 border-[#0A2E4A] bg-[#EBF5FF] px-3 py-2.5 shadow-[0_2px_0_0_#0A2E4A]">
              <span className="sr-only">Filtrar por desempenho</span>
              <select
                aria-label="Filtrar por desempenho"
                value={filtroNivel}
                onChange={(event) => setFiltroNivel(event.target.value as FiltroNivel)}
                className="cursor-pointer bg-transparent text-xs font-extrabold outline-none"
              >
                <option value="todos">Todos os níveis</option>
                <option value="consolidado">Consolidados</option>
                <option value="desenvolvimento">Em desenvolvimento</option>
                <option value="apoio">Precisam de apoio</option>
                <option value="sem-avaliacao">Sem avaliação</option>
              </select>
            </label>
            <label className="rounded-[14px] border-2 border-[#0A2E4A] bg-[#EBF5FF] px-3 py-2.5 shadow-[0_2px_0_0_#0A2E4A]">
              <span className="sr-only">Filtrar entregas</span>
              <select
                aria-label="Filtrar entregas"
                value={filtroEntrega}
                onChange={(event) => setFiltroEntrega(event.target.value as FiltroEntrega)}
                className="cursor-pointer bg-transparent text-xs font-extrabold outline-none"
              >
                <option value="todas">Todas as entregas</option>
                <option value="entregues">Com avaliações entregues</option>
                <option value="pendentes">Com avaliações pendentes</option>
              </select>
            </label>
            <button
              type="button"
              onClick={() => setOrdenacao((valor) => valor === "nome" ? "desempenho" : "nome")}
              className="flex items-center gap-2 rounded-[14px] border-2 border-[#0A2E4A] bg-[#EBF5FF] px-3 py-2.5 text-xs font-extrabold shadow-[0_2px_0_0_#0A2E4A] transition hover:brightness-105 active:translate-y-0.5"
            >
              <ArrowUpDown className="h-3.5 w-3.5" />
              {ordenacao === "nome" ? "Nome do aluno" : "Maior aproveitamento"}
            </button>
          </div>


          {carregando ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {Array.from({ length: 4 }, (_, index) => (
                <div
                  key={index}
                  className="h-48 animate-pulse rounded-[24px] border-[3px] border-[#0A2E4A]/30 bg-white"
                />
              ))}
            </div>
          ) : !erro && alunosVisiveis.length === 0 ? (
            <div className="rounded-[28px] border-2 border-dashed border-[#0A2E4A]/50 bg-white/80 px-6 py-12 text-center">
              <span className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full border-2 border-[#0A2E4A] bg-[#4ECDC4]">
                <Users className="h-6 w-6" />
              </span>
              <h3 className="font-sans text-lg font-extrabold">
                {desempenho?.alunos.length === 0 ? "Nenhum aluno cadastrado nesta turma" : "Nenhum aluno encontrado"}
              </h3>
              <p className="mt-1 text-xs font-semibold text-[#4A6B85]">
                {desempenho?.alunos.length === 0
                  ? "Quando houver alunos vinculados a esta turma, eles aparecerão aqui."
                  : "Tente mudar os filtros ou a busca."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {alunosVisiveis.map((aluno) => (
                <article
                  key={aluno.id}
                  className="rounded-[24px] border-[3px] border-[#0A2E4A] bg-white p-4 text-center shadow-[0_5px_0_0_#0A2E4A]"
                >
                  <span className="mx-auto mb-2 grid h-[62px] w-[62px] place-items-center rounded-full border-[3px] border-[#0A2E4A] bg-[#EBF5FF]">
                    <UserRound className="h-8 w-8 text-[#4A6B85]" />
                  </span>
                  <h3 className="truncate font-sans text-base font-extrabold" title={aluno.nome}>
                    {aluno.nome}
                  </h3>
                  <p className="text-xs font-bold text-[#4A6B85]">
                    Matrícula {aluno.matricula}
                  </p>
                  <span
                    className={[
                      "mt-2 inline-flex rounded-full border border-[#0A2E4A] px-2.5 py-0.5 font-sans text-xs font-extrabold",
                      CORES_FAIXA[aluno.faixa],
                    ].join(" ")}
                  >
                    {ROTULOS_FAIXA[aluno.faixa]}
                  </span>
                  <p className="mt-2 font-sans text-2xl font-extrabold">
                    {aluno.percentual === null ? "—" : `${aluno.percentual}%`}
                  </p>
                  <p className="text-xs font-semibold text-[#4A6B85]">
                    {aluno.percentual === null
                      ? "Sem respostas no período"
                      : `${aluno.totalAcertos} acertos em ${aluno.totalCampos} campos`}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-[#4A6B85]">
                    {aluno.totalRespondidas} de {aluno.totalAvaliacoes} avaliações entregues
                  </p>
                  {aluno.avaliacoes.length > 0 && (
                    <details className="mt-3 border-t border-[#0A2E4A]/15 pt-2 text-left">
                      <summary className="cursor-pointer text-center font-sans text-xs font-extrabold text-[#14507F]">
                        Ver acompanhamento
                      </summary>
                      <ul className="mt-2 space-y-2">
                        {aluno.avaliacoes.map((avaliacao) => (
                          <li
                            key={avaliacao.id}
                            className="flex items-center justify-between gap-2 rounded-xl border border-[#0A2E4A]/20 bg-[#F6FBFF] px-2.5 py-2 text-xs"
                          >
                            <span className="font-bold">
                              Avaliação {new Date(avaliacao.criadoEm).toLocaleDateString("pt-BR", {
                                timeZone: "America/Sao_Paulo",
                              })}
                            </span>
                            <span className="shrink-0 font-extrabold">
                              {avaliacao.percentual === null
                                ? "—"
                                : `${avaliacao.percentual}% (${avaliacao.totalAcertos}/${avaliacao.totalCampos})`}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </details>
                  )}
                </article>
              ))}
            </div>
          )}

          <p className="mt-5 text-xs font-semibold text-[#4A6B85]">
            Os percentuais consideram respostas corretas sobre o total de campos de resposta; campos corretos contam proporcionalmente. Alunos sem avaliação respondida ficam sem classificação.
          </p>
        </section>
      </main>
    </DashboardChrome>
  );
}
