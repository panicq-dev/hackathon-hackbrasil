'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  FileText,
  Sparkles,
  X,
  ArrowLeft,
  LayoutDashboard,
  ClipboardCheck,
  Library,
  LogOut,
  Users,
  Trash2,
  Settings,
} from 'lucide-react';
import { Avaliacoes } from '@/app/src/types/index';
import GeradorAvaliativo from '@/app/src/componentes/GeradorAvaliativo';
import Avaliacao, { AvaliacaoCompleta } from '@/app/src/componentes/Avaliacao';
import ModalRespostasProfessor from '@/app/src/componentes/ModalRespostasProfessor';
import {
  listarAvaliacoes,
  AvaliacaoResumida,
} from '@/app/actions/avaliacoes';
import {
  logoutUsuario,
  obterUsuarioAtual,
} from '@/app/actions/login';
import { UsuarioSessao } from '@/app/src/lib/session';
import { enviarParaLixeira } from '@/app/actions/lixeira';
import AvatarPerfil from '@/app/src/componentes/AvatarPerfil';

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
  "font-sans text-xs font-extrabold text-white",
  'opacity-0 transition motion-safe:duration-150 group-hover:opacity-100 group-focus-visible:opacity-100',
  'bottom-[calc(100%+12px)] left-1/2 -translate-x-1/2 group-hover:-translate-y-1',
  'md:bottom-auto md:left-[calc(100%+14px)] md:top-1/2 md:-translate-y-1/2 md:translate-x-0 md:group-hover:translate-x-1 md:group-hover:-translate-y-1/2',
].join(' ');

const FOCO =
  'group relative cursor-pointer rounded-full outline-none focus-visible:ring-4 focus-visible:ring-[#1D63ED]/40';

type AbaAvaliacaoProps = {
  usuarioInicial?: UsuarioSessao | null;
  onLogout?: () => void;
};

export default function AbaAvaliacao({ usuarioInicial = null, onLogout }: AbaAvaliacaoProps) {
  const router = useRouter();
  const [usuario, setUsuario] = useState<UsuarioSessao | null>(usuarioInicial);
  const [avaliacoes, setAvaliacoes] = useState<AvaliacaoResumida[]>([]);
  const [avaliacaoSelecionada, setAvaliacaoSelecionada] = useState<AvaliacaoCompleta | null>(null);
  const [avaliacaoRespostasAberta, setAvaliacaoRespostasAberta] = useState<string | null>(null);
  const [geradorAberto, setGeradorAberto] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [erroCarregamento, setErroCarregamento] = useState('');
  const [avaliacaoEmOperacao, setAvaliacaoEmOperacao] = useState<string | null>(null);

  const carregarDados = useCallback(async (mostrarCarregamento = true) => {
    if (mostrarCarregamento) setCarregando(true);
    setErroCarregamento('');
    try {
      let userAtual = usuarioInicial;
      if (!userAtual) {
        userAtual = await obterUsuarioAtual();
        setUsuario(userAtual);
      }

      const res = await listarAvaliacoes();
      if (res.erro) {
        if (mostrarCarregamento) setAvaliacoes([]);
        setErroCarregamento(res.erro);
      } else {
        setAvaliacoes(res.avaliacoes ?? []);
      }
    } catch (e) {
      console.error('Erro ao buscar dados:', e);
      setErroCarregamento('Não foi possível carregar as avaliações.');
    } finally {
      if (mostrarCarregamento) setCarregando(false);
    }
  }, [usuarioInicial]);

  function handleRespostasEnviadas(avaliacaoId: string) {
    setAvaliacoes((atuais) =>
      atuais.map((item) =>
        item.id === avaliacaoId ? { ...item, respondidaPorMim: true } : item
      )
    );
    setAvaliacaoSelecionada(null);
    void carregarDados(false);
  }

  useEffect(() => {
    let cancelado = false;
    Promise.resolve().then(() => {
      if (!cancelado) void carregarDados();
    });

    return () => {
      cancelado = true;
    };
  }, [carregarDados]);

  async function handleLogout() {
    await logoutUsuario();
    if (onLogout) {
      onLogout();
    } else {
      router.refresh();
      router.push('/login');
    }
  }

  function handleAvaliacaoGerada(novaAvaliacao: Avaliacoes) {
    const itemFormatado: AvaliacaoResumida = {
      id: novaAvaliacao.id,
      criadoEm: new Date().toISOString(),
      ativo: true,
      questoes: novaAvaliacao.questoes,
      totalRespostas: 0,
    };
    setAvaliacoes((prev) => [itemFormatado, ...prev]);
    setGeradorAberto(false);
  }

  async function arquivarAvaliacao(item: AvaliacaoResumida) {
    if (!isProfessor) return;
    if (!window.confirm(`Mover a avaliação #${item.id.slice(0, 8)} para a lixeira? As respostas serão mantidas até a exclusão permanente.`)) return;
    setAvaliacaoEmOperacao(item.id);
    setErroCarregamento('');
    try {
      const resultado = await enviarParaLixeira('avaliacao', item.id);
      if (resultado.erro) {
        setErroCarregamento(resultado.erro);
      } else {
        setAvaliacoes((atuais) => atuais.filter((avaliacao) => avaliacao.id !== item.id));
        setAvaliacaoSelecionada((atual) => atual?.id === item.id ? null : atual);
        setAvaliacaoRespostasAberta((atual) => atual === item.id ? null : atual);
      }
    } catch (erro) {
      setErroCarregamento(erro instanceof Error ? erro.message : 'Não foi possível mover a avaliação para a lixeira.');
    } finally {
      setAvaliacaoEmOperacao(null);
    }
  }

  const isProfessor = usuario?.perfil === 'professor';

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
              <AvatarPerfil avatarId={usuario?.avatarId} className="h-full w-full" />
            </span>

            <div>
              <div className="flex items-center gap-2">
                <span className="font-sans text-base font-extrabold leading-none text-[#0A2E4A]">
                  {usuario?.nome ?? 'Usuário'}
                </span>
                <span
                  className={`rounded-full border border-[#0A2E4A] px-2.5 py-0.5 font-sans text-xs font-extrabold ${
                    isProfessor ? 'bg-[#FFEFC2] text-[#0A2E4A]' : 'bg-[#D1F2D9] text-[#0F5132]'
                  }`}
                >
                  {isProfessor ? 'Professor' : 'Aluno'}
                </span>
              </div>
              <p className="text-xs font-bold text-[#4A6B85]">
                {isProfessor
                  ? usuario?.email
                  : `Turma: ${usuario?.turmaId || 'Geral'} • Matrícula: ${usuario?.matricula || '-'}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Logout */}
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
      </div>

      {/* DOCK DE BOLINHAS */}
      <nav
        aria-label="Navegação principal"
        className={[
          'fixed z-40 flex gap-2 md:gap-4',
          'bottom-5 left-1/2 -translate-x-1/2 flex-row rounded-full border-[3px] border-[#0A2E4A] bg-white/90 px-4 py-3 shadow-[0_5px_0_0_#0A2E4A] backdrop-blur',
          'md:bottom-auto md:left-6 md:top-1/2 md:-translate-y-1/2 md:translate-x-0 md:flex-col md:px-3 md:py-4',
        ].join(' ')}
      >
        <Link href={ROTA_DASHBOARD} aria-label="Dashboard" className={FOCO}>
          <span className={`${BOLINHA} bg-white group-hover:bg-[#C6EFE9]`}>
            <LayoutDashboard className="h-6 w-6" strokeWidth={2.4} />
          </span>
          <span className={ROTULO}>Dashboard</span>
        </Link>

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

        {isProfessor && (
          <Link href={ROTA_BANCO} aria-label="Banco de Questões" className={FOCO}>
            <span className={`${BOLINHA} bg-white group-hover:bg-[#FFD3DB]`}>
              <Library className="h-6 w-6" strokeWidth={2.4} />
            </span>
            <span className={ROTULO}>Banco de Questões</span>
          </Link>
        )}

        <Link href="/configuracoes" aria-label="Configurações" className={FOCO}>
          <span className={`${BOLINHA} bg-white group-hover:bg-[#C6EFE9]`}>
            <Settings className="h-6 w-6" strokeWidth={2.4} />
          </span>
          <span className={ROTULO}>Configurações</span>
        </Link>

        {isProfessor && (
          <Link href="/lixeira" aria-label="Lixeira" className={FOCO}>
            <span className={`${BOLINHA} bg-[#FFE3E3] text-red-700 group-hover:bg-[#FFD3DB]`}>
              <Trash2 className="h-6 w-6" strokeWidth={2.4} />
            </span>
            <span className={ROTULO}>Lixeira</span>
          </Link>
        )}
      </nav>

      <div className="relative z-10 mx-auto max-w-5xl">
        {/* Cabeçalho */}
        <header className="mb-8">
          <h1 className="font-sans text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
            {isProfessor ? 'Painel de Avaliações' : 'Minhas Avaliações'}
          </h1>
          <svg aria-hidden viewBox="0 0 220 14" className="mt-1 h-3 w-44 text-[#FFC53D]" fill="none">
            <path
              d="M3 9 C 40 2, 70 13, 110 7 S 180 3, 217 8"
              stroke="currentColor"
              strokeWidth="5"
              strokeLinecap="round"
            />
          </svg>
          <p className="mt-3 max-w-lg text-base font-semibold text-[#4A6B85]">
            {isProfessor
              ? 'Crie avaliações com IA e acompanhe os alunos que responderam cada questão.'
              : 'Selecione uma avaliação para visualizar os enunciados e enviar suas respostas.'}
          </p>
        </header>

        {erroCarregamento && avaliacoes.length > 0 && (
          <p role="alert" className="mb-4 rounded-[20px] border-2 border-[#0A2E4A] bg-[#FFE3E3] px-4 py-3 text-sm font-bold text-[#8A1F1F]">
            {erroCarregamento}
          </p>
        )}

        {carregando ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#0A2E4A] border-t-[#FFC53D]" />
            <p className="mt-3 font-sans text-base font-bold text-[#4A6B85]">
              Carregando avaliações...
            </p>
          </div>
        ) : avaliacaoSelecionada ? (
          <div className="rounded-[40px_34px_42px_36px] border-[3px] border-[#0A2E4A] bg-white p-6 shadow-[0_8px_0_0_#0A2E4A] sm:p-8">
            <button
              type="button"
              onClick={() => setAvaliacaoSelecionada(null)}
              className="mb-5 inline-flex cursor-pointer items-center gap-2 rounded-full border-2 border-[#0A2E4A] bg-[#FFC53D] px-4 py-2 font-sans text-xs font-extrabold shadow-[0_3px_0_0_#0A2E4A] transition hover:brightness-105 active:translate-y-0.5"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar para avaliações
            </button>

            <Avaliacao
              avaliacao={avaliacaoSelecionada}
              perfilUsuario={usuario?.perfil}
              onRespostasEnviadas={handleRespostasEnviadas}
            />
          </div>
        ) : erroCarregamento && avaliacoes.length === 0 ? (
          <div
            role="alert"
            className="rounded-[24px] border-[3px] border-[#0A2E4A] bg-[#FFE3E3] p-5 text-sm font-bold text-[#8A1F1F] shadow-[0_4px_0_0_#0A2E4A]"
          >
            {erroCarregamento}
          </div>
        ) : avaliacoes.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-[44px_36px_48px_38px] border-[3px] border-dashed border-[#0A2E4A] bg-white/80 p-12 text-center">
            <div className="mb-4 flex h-14 w-14 -rotate-6 items-center justify-center rounded-full border-[3px] border-[#0A2E4A] bg-[#4ECDC4]">
              <FileText className="h-6 w-6" />
            </div>
            <h2 className="font-sans text-xl font-extrabold">Nada por aqui ainda</h2>
            <p className="mt-1 max-w-xs text-sm font-bold text-[#4A6B85]">
              {isProfessor
                ? 'Toque em “Gerar avaliação” para criar uma avaliação com IA.'
                : 'Seu professor ainda não publicou nenhuma avaliação para a sua turma.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-7 sm:grid-cols-2 lg:grid-cols-3">
            {avaliacoes.map((item, idx) => (
              <div
                key={item.id ?? idx}
                className={[
                  'group relative flex flex-col justify-between border-[3px] border-[#0A2E4A] bg-white p-5 pt-7 text-left',
                  'shadow-[0_6px_0_0_#0A2E4A] transition motion-safe:duration-200',
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

                    <div className="flex items-center gap-1.5">
                      {isProfessor ? (
                        <span className="rounded-full border-2 border-[#0A2E4A] bg-[#EBF5FF] px-2.5 py-0.5 text-xs font-extrabold text-[#14507F]">
                          {item.totalRespostas ?? 0} respondente(s)
                        </span>
                      ) : (
                        <span
                          className={`rounded-full border-2 border-[#0A2E4A] px-2.5 py-0.5 text-xs font-extrabold ${
                            item.respondidaPorMim
                              ? 'bg-[#D1F2D9] text-[#0F5132]'
                              : 'bg-[#FFEFC2] text-[#0A2E4A]'
                          }`}
                        >
                          {item.respondidaPorMim ? 'Respondida' : 'Pendente'}
                        </span>
                      )}

                      <span className="rounded-full border-2 border-[#0A2E4A] bg-[#FFEFC2] px-2 py-0.5 text-xs font-extrabold">
                        {item.questoes?.length ?? 0} Q
                      </span>
                      {isProfessor && (item.professorId === Number(usuario?.id) || Boolean(item.turmaId)) && (
                        <button
                          type="button"
                          aria-label={`Mover avaliação ${item.id.slice(0, 8)} para a lixeira`}
                          title="Mover avaliação para a lixeira"
                          disabled={avaliacaoEmOperacao === item.id}
                          onClick={() => void arquivarAvaliacao(item)}
                          className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full border-2 border-red-700 bg-red-100 text-red-700 shadow-[0_2px_0_0_#991B1B] transition hover:bg-red-200 disabled:opacity-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  <h3 className="font-sans text-xl font-extrabold">
                    Avaliação #{item.id ? item.id.slice(0, 8) : idx + 1}
                  </h3>

                  <p className="mt-1 line-clamp-2 text-sm font-semibold text-[#4A6B85]">
                    {item.questoes?.[0]?.enunciado ?? 'Abra para visualizar as questões.'}
                  </p>
                </div>

                <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-[#0A2E4A]/10 pt-3">
                  {/* Aluno: Abrir para responder */}
                  <button
                    type="button"
                    onClick={() => setAvaliacaoSelecionada(item)}
                    className="flex-1 cursor-pointer rounded-xl border-2 border-[#0A2E4A] bg-[#EBF5FF] py-2 text-center font-sans text-xs font-extrabold text-[#1D63ED] shadow-[0_2px_0_0_#0A2E4A] transition hover:bg-[#BFE3F7] active:translate-y-0.5"
                  >
                    {isProfessor ? 'Ver Questões' : item.respondidaPorMim ? 'Ver Respostas' : 'Responder Questão'}
                  </button>

                  {/* Professor: Visualizar quem respondeu e dados de análise */}
                  {isProfessor && (
                    <>
                      <button
                        type="button"
                        onClick={() => setAvaliacaoRespostasAberta(item.id)}
                        className="flex cursor-pointer items-center justify-center gap-1 rounded-xl border-2 border-[#0A2E4A] bg-[#FFC53D] px-3 py-2 font-sans text-xs font-extrabold text-[#0A2E4A] shadow-[0_2px_0_0_#0A2E4A] transition hover:brightness-105 active:translate-y-0.5"
                      >
                        <Users className="h-3.5 w-3.5" />
                        <span>Quem respondeu ({item.totalRespostas ?? 0})</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal do Professor para ver respondentes e consolidado de análise */}
      {avaliacaoRespostasAberta && (
        <ModalRespostasProfessor
          avaliacaoId={avaliacaoRespostasAberta}
          onFechar={() => setAvaliacaoRespostasAberta(null)}
        />
      )}

      {/* Gerar avaliação: SOMENTE VISÍVEL NA TELA DE PROFESSOR */}
      {isProfessor && (
        <div className="fixed bottom-28 right-5 z-40 flex flex-col items-end md:bottom-6 md:right-6">
          {geradorAberto && (
            <div className="mb-3 w-[92vw] max-w-md">
              <GeradorAvaliativo onAvaliacaoGerada={handleAvaliacaoGerada} />
            </div>
          )}

          <button
            type="button"
            onClick={() => setGeradorAberto((prev) => !prev)}
            className="flex cursor-pointer items-center gap-2 rounded-full border-[3px] border-[#0A2E4A] bg-[linear-gradient(160deg,#5AA9E6_0%,#2496ED_45%,#1D63ED_100%)] px-6 py-3.5 font-sans text-base font-extrabold text-white shadow-[0_6px_0_0_#16457E] transition hover:brightness-105 active:translate-y-1 active:shadow-[0_2px_0_0_#16457E]"
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
      )}
    </div>
  );
}
