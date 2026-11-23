'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Users,
  PlusCircle,
  Copy,
  Check,
  GraduationCap,
  ClipboardCheck,
  LayoutDashboard,
  Library,
  LogOut,
  ShieldCheck,
  School,
  ArrowRight,
  Clock,
  Mail,
  Hash,
  Sparkles,
} from 'lucide-react';
import { UsuarioSessao } from '@/app/src/lib/session';
import { logoutUsuario } from '@/app/actions/login';
import {
  listarTurmasProfessor,
  criarTurma,
  obterAlunosDaTurma,
  obterTurmaDoAluno,
  TurmaItem,
  AlunoTurma,
} from '@/app/actions/turmas';

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

export default function DashboardView({ usuario }: { usuario: UsuarioSessao }) {
  const router = useRouter();
  const [turmas, setTurmas] = useState<TurmaItem[]>([]);
  const [turmaAluno, setTurmaAluno] = useState<{ id: string; nome: string } | null>(null);
  const [carregando, setCarregando] = useState(true);

  // Formulário de criação
  const [nomeTurma, setNomeTurma] = useState('');
  const [criandoTurma, setCriandoTurma] = useState(false);
  const [mensagemSucesso, setMensagemSucesso] = useState('');
  const [erro, setErro] = useState('');

  // Cópia de código
  const [copiadoId, setCopiadoId] = useState<string | null>(null);

  // Alunos da turma selecionada
  const [turmaExpandida, setTurmaExpandida] = useState<string | null>(null);
  const [alunosTurma, setAlunosTurma] = useState<Record<string, AlunoTurma[]>>({});
  const [carregandoAlunos, setCarregandoAlunos] = useState(false);

  const isProfessor = usuario.perfil === 'professor';

  async function carregarDados() {
    setCarregando(true);
    try {
      if (isProfessor) {
        const res = await listarTurmasProfessor();
        if (res.turmas) {
          setTurmas(res.turmas);
        }
      } else {
        const res = await obterTurmaDoAluno();
        if (res.turma) {
          setTurmaAluno(res.turma);
        }
      }
    } catch (e) {
      console.error('Erro ao carregar dashboard:', e);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarDados();
  }, []);

  async function handleCriarTurma(e: React.FormEvent) {
    e.preventDefault();
    setErro('');
    setMensagemSucesso('');
    setCriandoTurma(true);

    try {
      const res = await criarTurma(nomeTurma);
      if (res.erro) {
        setErro(res.erro);
      } else if (res.turma) {
        setTurmas((prev) => [res.turma!, ...prev]);
        setMensagemSucesso(`Turma "${res.turma.nome}" criada com o código ${res.turma.id}!`);
        setNomeTurma('');
      }
    } catch {
      setErro('Erro ao criar turma. Tente novamente.');
    } finally {
      setCriandoTurma(false);
    }
  }

  function handleCopiarCodigo(codigo: string) {
    navigator.clipboard.writeText(codigo);
    setCopiadoId(codigo);
    setTimeout(() => setCopiadoId(null), 2500);
  }

  async function toggleVerAlunos(turmaId: string) {
    if (turmaExpandida === turmaId) {
      setTurmaExpandida(null);
      return;
    }

    setTurmaExpandida(turmaId);
    if (!alunosTurma[turmaId]) {
      setCarregandoAlunos(true);
      try {
        const res = await obterAlunosDaTurma(turmaId);
        if (res.alunos) {
          setAlunosTurma((prev) => ({ ...prev, [turmaId]: res.alunos! }));
        }
      } catch (err) {
        console.error('Erro ao carregar alunos:', err);
      } finally {
        setCarregandoAlunos(false);
      }
    }
  }

  async function handleLogout() {
    await logoutUsuario();
    router.refresh();
    window.location.href = '/login';
  }

  const totalAlunosGeral = turmas.reduce((acc, t) => acc + t.totalAlunos, 0);
  const totalAvaliacoesGeral = turmas.reduce((acc, t) => acc + t.totalAvaliacoes, 0);

  return (
    <div
      className={[
        'relative min-h-screen overflow-x-hidden bg-[#F6FBFF]',
        "font-['Nunito'] text-[#0A2E4A]",
        'px-5 pb-32 pt-6 md:pl-32 md:pr-10 md:pb-16',
      ].join(' ')}
    >
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,800&family=Nunito:wght@600;700;800&display=swap');`}</style>

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
            <span
              className={`flex h-10 w-10 items-center justify-center rounded-full border-2 border-[#0A2E4A] ${
                isProfessor ? 'bg-[#FFC53D]' : 'bg-[#4ECDC4]'
              }`}
            >
              {isProfessor ? (
                <ShieldCheck className="h-5 w-5 text-[#0A2E4A]" />
              ) : (
                <GraduationCap className="h-5 w-5 text-[#0A2E4A]" />
              )}
            </span>

            <div>
              <div className="flex items-center gap-2">
                <span className="font-['Baloo_2'] text-base font-extrabold leading-none text-[#0A2E4A]">
                  {usuario.nome}
                </span>
                <span
                  className={`rounded-full border border-[#0A2E4A] px-2.5 py-0.5 font-['Baloo_2'] text-[11px] font-extrabold ${
                    isProfessor ? 'bg-[#FFEFC2] text-[#0A2E4A]' : 'bg-[#D1F2D9] text-[#0F5132]'
                  }`}
                >
                  {isProfessor ? 'Professor' : 'Aluno'}
                </span>
              </div>
              <p className="text-xs font-bold text-[#4A6B85]">
                {isProfessor
                  ? usuario.email
                  : `Turma: ${usuario.turmaId || 'Geral'} • Matrícula: ${usuario.matricula || '-'}`}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            title="Encerrar sessão"
            className="flex cursor-pointer items-center gap-1 rounded-full border-2 border-[#0A2E4A] bg-[#FFE3E3] px-3.5 py-1.5 font-['Baloo_2'] text-xs font-extrabold text-[#8A1F1F] shadow-[0_2px_0_0_#0A2E4A] transition hover:brightness-105 active:translate-y-0.5"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Sair da conta</span>
          </button>
        </div>
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
        <Link href="/dashboard" aria-label="Dashboard" className={FOCO}>
          <span className={`${BOLINHA} -translate-y-0.5 bg-[#FFC53D] shadow-[0_4px_0_0_#0A2E4A]`}>
            <LayoutDashboard className="h-6 w-6" strokeWidth={2.4} />
          </span>
          <span className={ROTULO}>Dashboard</span>
        </Link>

        <Link href="/" aria-label="Avaliações" className={FOCO}>
          <span className={`${BOLINHA} bg-white group-hover:bg-[#C6EFE9]`}>
            <ClipboardCheck className="h-6 w-6" strokeWidth={2.4} />
          </span>
          <span className={ROTULO}>Avaliações</span>
        </Link>

        <Link href="/banco-de-questoes" aria-label="Banco de Questões" className={FOCO}>
          <span className={`${BOLINHA} bg-white group-hover:bg-[#FFD3DB]`}>
            <Library className="h-6 w-6" strokeWidth={2.4} />
          </span>
          <span className={ROTULO}>Banco de Questões</span>
        </Link>
      </nav>

      <div className="relative z-10 mx-auto max-w-5xl">
        {/* Cabeçalho */}
        <header className="mb-8">
          <h1 className="font-['Bricolage_Grotesque'] text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
            {isProfessor ? 'Dashboard: Gestão de Turmas' : 'Meu Painel do Aluno'}
          </h1>
          <svg aria-hidden viewBox="0 0 220 14" className="mt-1 h-3 w-44 text-[#FFC53D]" fill="none">
            <path
              d="M3 9 C 40 2, 70 13, 110 7 S 180 3, 217 8"
              stroke="currentColor"
              strokeWidth="5"
              strokeLinecap="round"
            />
          </svg>
          <p className="mt-3 max-w-xl text-base font-semibold text-[#4A6B85]">
            {isProfessor
              ? 'Crie novas turmas para sua escola, obtenha os códigos de acesso para cadastro dos alunos e acompanhe os matriculados.'
              : 'Consulte os dados da sua turma atual e acerte suas pendências avaliativas.'}
          </p>
        </header>

        {isProfessor ? (
          <div className="space-y-8">
            {/* Métricas rápidas */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-[28px] border-[3px] border-[#0A2E4A] bg-white p-5 shadow-[0_5px_0_0_#0A2E4A]">
                <div className="flex items-center justify-between">
                  <span className="font-['Baloo_2'] text-sm font-bold text-[#4A6B85]">Turmas Ativas</span>
                  <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#0A2E4A] bg-[#FFC53D]">
                    <School className="h-4 w-4" />
                  </span>
                </div>
                <p className="mt-2 font-['Bricolage_Grotesque'] text-3xl font-extrabold">
                  {turmas.length}
                </p>
              </div>

              <div className="rounded-[28px] border-[3px] border-[#0A2E4A] bg-white p-5 shadow-[0_5px_0_0_#0A2E4A]">
                <div className="flex items-center justify-between">
                  <span className="font-['Baloo_2'] text-sm font-bold text-[#4A6B85]">Alunos Vinculados</span>
                  <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#0A2E4A] bg-[#4ECDC4]">
                    <Users className="h-4 w-4" />
                  </span>
                </div>
                <p className="mt-2 font-['Bricolage_Grotesque'] text-3xl font-extrabold">
                  {totalAlunosGeral}
                </p>
              </div>

              <div className="rounded-[28px] border-[3px] border-[#0A2E4A] bg-white p-5 shadow-[0_5px_0_0_#0A2E4A]">
                <div className="flex items-center justify-between">
                  <span className="font-['Baloo_2'] text-sm font-bold text-[#4A6B85]">Avaliações nas Turmas</span>
                  <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#0A2E4A] bg-[#BFE3F7]">
                    <ClipboardCheck className="h-4 w-4" />
                  </span>
                </div>
                <p className="mt-2 font-['Bricolage_Grotesque'] text-3xl font-extrabold">
                  {totalAvaliacoesGeral}
                </p>
              </div>
            </div>

            {/* Formulário de criação de turma */}
            <div className="rounded-[36px] border-[3px] border-[#0A2E4A] bg-white p-6 shadow-[0_8px_0_0_#0A2E4A] sm:p-7">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-[#0A2E4A] bg-[#FFC53D]">
                  <PlusCircle className="h-5 w-5 text-[#0A2E4A]" />
                </span>
                <div>
                  <h2 className="font-['Baloo_2'] text-2xl font-extrabold">Criar Nova Turma</h2>
                  <p className="text-xs font-bold text-[#4A6B85]">
                    O sistema irá gerar automaticamente um código exclusivo de 8 dígitos para os alunos entrarem.
                  </p>
                </div>
              </div>

              {mensagemSucesso && (
                <div className="mt-4 flex items-center gap-2 rounded-2xl border-2 border-[#0A2E4A] bg-[#D1F2D9] px-4 py-2.5 text-xs font-extrabold text-[#0F5132] shadow-[0_2px_0_0_#0A2E4A]">
                  <Check className="h-4 w-4 shrink-0" />
                  <span>{mensagemSucesso}</span>
                </div>
              )}

              {erro && (
                <div className="mt-4 rounded-2xl border-2 border-[#0A2E4A] bg-[#FFE3E3] px-4 py-2.5 text-xs font-extrabold text-[#8A1F1F] shadow-[0_2px_0_0_#0A2E4A]">
                  {erro}
                </div>
              )}

              <form onSubmit={handleCriarTurma} className="mt-4 flex flex-col gap-3 sm:flex-row">
                <input
                  type="text"
                  value={nomeTurma}
                  onChange={(e) => setNomeTurma(e.target.value)}
                  placeholder="Nome da turma (Ex: 7º ano B, 8º ano A...)"
                  className="flex-1 rounded-[18px] border-[3px] border-[#0A2E4A] bg-[#EBF5FF] px-4 py-3 text-xs font-semibold text-[#0A2E4A] shadow-[0_3px_0_0_#0A2E4A] placeholder:font-normal placeholder:text-[#5A7C99] focus:outline-none focus:ring-4 focus:ring-[#2496ED]/30"
                  required
                />

                <button
                  type="submit"
                  disabled={criandoTurma}
                  className="flex cursor-pointer items-center justify-center gap-2 rounded-[18px] border-[3px] border-[#0A2E4A]
                    bg-[linear-gradient(160deg,#5AA9E6_0%,#2496ED_45%,#1D63ED_100%)] px-6 py-3
                    font-['Baloo_2'] text-base font-extrabold text-white
                    shadow-[0_5px_0_0_#16457E] transition hover:brightness-105 active:translate-y-1 active:shadow-[0_1px_0_0_#16457E]
                    disabled:opacity-60 sm:w-auto"
                >
                  <PlusCircle className="h-4 w-4" />
                  {criandoTurma ? 'Criando...' : 'Criar Turma'}
                </button>
              </form>
            </div>

            {/* Listagem de turmas */}
            <div>
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-['Baloo_2'] text-2xl font-extrabold">Minhas Turmas Cadastradas</h3>
                <span className="rounded-full border-2 border-[#0A2E4A] bg-[#FFEFC2] px-3 py-1 font-['Baloo_2'] text-xs font-extrabold">
                  {turmas.length} turmas
                </span>
              </div>

              {carregando ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#0A2E4A] border-t-[#2496ED]" />
                  <p className="mt-3 font-['Baloo_2'] text-base font-bold text-[#4A6B85]">
                    Carregando turmas...
                  </p>
                </div>
              ) : turmas.length === 0 ? (
                <div className="rounded-[36px] border-[3px] border-dashed border-[#0A2E4A]/30 bg-white/70 p-12 text-center">
                  <School className="mx-auto mb-3 h-12 w-12 text-[#4A6B85]" />
                  <h4 className="font-['Baloo_2'] text-xl font-extrabold">Nenhuma turma cadastrada</h4>
                  <p className="mt-1 text-sm font-semibold text-[#4A6B85]">
                    Crie sua primeira turma no formulário acima para receber alunos e aplicar provas.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  {turmas.map((t) => {
                    const expandido = turmaExpandida === t.id;
                    const alunos = alunosTurma[t.id] ?? [];

                    return (
                      <div
                        key={t.id}
                        className="flex flex-col justify-between rounded-[32px] border-[3px] border-[#0A2E4A] bg-white p-6 shadow-[0_6px_0_0_#0A2E4A]"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <h4 className="font-['Baloo_2'] text-2xl font-extrabold text-[#0A2E4A]">
                                {t.nome}
                              </h4>
                              <p className="flex items-center gap-1 text-xs font-semibold text-[#4A6B85]">
                                <Clock className="h-3.5 w-3.5" />
                                Criada em {new Date(t.criadoEm).toLocaleDateString('pt-BR')}
                              </p>
                            </div>

                            <span className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-[#0A2E4A] bg-[#4ECDC4]">
                              <School className="h-5 w-5 text-[#0A2E4A]" />
                            </span>
                          </div>

                          {/* Bloco de Código de Acesso */}
                          <div className="mt-4 rounded-2xl border-2 border-[#0A2E4A] bg-[#F4FAFF] p-3.5">
                            <span className="block text-[11px] font-extrabold uppercase tracking-wider text-[#14507F]">
                              Código de Acesso dos Alunos:
                            </span>

                            <div className="mt-1.5 flex items-center justify-between gap-2">
                              <span className="rounded-xl border-2 border-[#0A2E4A] bg-[#FFC53D] px-3.5 py-1 font-mono text-base font-extrabold tracking-widest text-[#0A2E4A] shadow-[0_2px_0_0_#0A2E4A]">
                                {t.id}
                              </span>

                              <button
                                type="button"
                                onClick={() => handleCopiarCodigo(t.id)}
                                className="flex cursor-pointer items-center gap-1.5 rounded-xl border-2 border-[#0A2E4A] bg-white px-3 py-1.5 font-['Baloo_2'] text-xs font-extrabold text-[#0A2E4A] shadow-[0_2px_0_0_#0A2E4A] transition hover:bg-[#FFEFC2] active:translate-y-0.5"
                              >
                                {copiadoId === t.id ? (
                                  <>
                                    <Check className="h-3.5 w-3.5 text-[#27AE60]" />
                                    <span>Copiado!</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="h-3.5 w-3.5" />
                                    <span>Copiar código</span>
                                  </>
                                )}
                              </button>
                            </div>

                            <p className="mt-2 text-[11px] font-bold text-[#4A6B85]">
                              Envie este código aos alunos para vinculá-los a esta turma na tela de cadastro.
                            </p>
                          </div>

                          {/* Métricas da turma */}
                          <div className="mt-4 flex items-center gap-2">
                            <span className="rounded-xl border border-[#0A2E4A]/30 bg-[#E8F5E9] px-3 py-1 text-xs font-extrabold text-[#1B5E20]">
                              {t.totalAlunos} aluno(s) matriculado(s)
                            </span>
                            <span className="rounded-xl border border-[#0A2E4A]/30 bg-[#EBF5FF] px-3 py-1 text-xs font-extrabold text-[#14507F]">
                              {t.totalAvaliacoes} avaliação(ões)
                            </span>
                          </div>
                        </div>

                        {/* Botão de ver alunos vinculados */}
                        <div className="mt-5 border-t border-[#0A2E4A]/10 pt-4">
                          <button
                            type="button"
                            onClick={() => toggleVerAlunos(t.id)}
                            className="flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl border-2 border-[#0A2E4A] bg-[#EBF5FF] py-2 font-['Baloo_2'] text-xs font-extrabold text-[#14507F] shadow-[0_2px_0_0_#0A2E4A] transition hover:bg-[#BFE3F7] active:translate-y-0.5"
                          >
                            <Users className="h-4 w-4" />
                            <span>
                              {expandido ? 'Ocultar alunos vinculados' : `Ver alunos (${t.totalAlunos})`}
                            </span>
                          </button>

                          {/* Lista de alunos expandida */}
                          {expandido && (
                            <div className="mt-3 max-h-56 overflow-y-auto rounded-2xl border-2 border-[#0A2E4A]/20 bg-[#F9FBFC] p-3">
                              {carregandoAlunos && !alunosTurma[t.id] ? (
                                <p className="text-center text-xs font-bold text-[#4A6B85]">
                                  Carregando alunos...
                                </p>
                              ) : alunos.length === 0 ? (
                                <p className="text-center text-xs font-bold text-[#4A6B85]">
                                  Nenhum aluno cadastrado nesta turma ainda.
                                </p>
                              ) : (
                                <div className="space-y-2">
                                  {alunos.map((al) => (
                                    <div
                                      key={al.id}
                                      className="flex items-center justify-between rounded-xl border border-[#0A2E4A]/15 bg-white p-2.5 text-xs"
                                    >
                                      <div>
                                        <p className="font-extrabold text-[#0A2E4A]">{al.nome}</p>
                                        <p className="text-[11px] text-[#4A6B85]">{al.email}</p>
                                      </div>
                                      <span className="rounded-md border border-[#0A2E4A]/20 bg-[#EBF5FF] px-2 py-0.5 font-mono text-[11px] font-bold text-[#14507F]">
                                        RA: {al.matricula}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Painel do Aluno */
          <div className="rounded-[36px] border-[3px] border-[#0A2E4A] bg-white p-7 shadow-[0_8px_0_0_#0A2E4A]">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-[#0A2E4A] bg-[#4ECDC4]">
                <GraduationCap className="h-6 w-6 text-[#0A2E4A]" />
              </span>
              <div>
                <h2 className="font-['Baloo_2'] text-2xl font-extrabold">Minha Turma Atual</h2>
                <p className="text-xs font-bold text-[#4A6B85]">
                  Você está matriculado e vinculado a esta turma.
                </p>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border-2 border-[#0A2E4A] bg-[#F4FAFF] p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-extrabold uppercase text-[#14507F]">Nome da Turma</span>
                  <h3 className="font-['Baloo_2'] text-2xl font-extrabold text-[#0A2E4A]">
                    {turmaAluno?.nome ?? 'Turma ' + (usuario.turmaId || '-')}
                  </h3>
                </div>

                <div>
                  <span className="text-xs font-extrabold uppercase text-[#14507F]">Código da Turma</span>
                  <div className="mt-1">
                    <span className="rounded-xl border-2 border-[#0A2E4A] bg-[#FFC53D] px-3.5 py-1.5 font-mono text-base font-extrabold text-[#0A2E4A] shadow-[0_2px_0_0_#0A2E4A]">
                      {usuario.turmaId}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <Link
                href="/"
                className="flex cursor-pointer items-center gap-2 rounded-2xl border-[3px] border-[#0A2E4A]
                  bg-[linear-gradient(160deg,#5AA9E6_0%,#2496ED_45%,#1D63ED_100%)] px-6 py-3
                  font-['Baloo_2'] text-base font-extrabold text-white
                  shadow-[0_5px_0_0_#16457E] transition hover:brightness-105 active:translate-y-1 active:shadow-[0_1px_0_0_#16457E]"
              >
                <span>Ir para Minhas Avaliações</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
