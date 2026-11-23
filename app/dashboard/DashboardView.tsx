'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Users,
  PlusCircle,
  Copy,
  Check,
  ClipboardCheck,
  LayoutDashboard,
  Library,
  LogOut,
  ShieldCheck,
  GraduationCap,
  School,
  ArrowRight,
  Clock,
} from 'lucide-react';
import { UsuarioSessao } from '@/app/src/lib/session';
import { logoutUsuario } from '@/app/actions/login';
import {
  listarTurmasProfessor,
  criarTurma,
  obterTurmaDoAluno,
  TurmaItem,
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
        setMensagemSucesso(`Turma "${res.turma.nome}" criada com sucesso.`);
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
    setTimeout(() => setCopiadoId(null), 2000);
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
            <span>Sair</span>
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
            {isProfessor ? 'Minhas Turmas' : 'Minha Turma'}
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
              ? 'Gerencie as turmas e passe o código de acesso para os alunos se cadastrarem.'
              : 'Informações da sua turma.'}
          </p>
        </header>

        {isProfessor ? (
          <div className="space-y-8">
            {/* Métricas simples */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-[24px] border-[3px] border-[#0A2E4A] bg-white p-5 shadow-[0_4px_0_0_#0A2E4A]">
                <span className="text-xs font-bold text-[#4A6B85]">Total de turmas</span>
                <p className="mt-1 font-['Bricolage_Grotesque'] text-3xl font-extrabold">{turmas.length}</p>
              </div>

              <div className="rounded-[24px] border-[3px] border-[#0A2E4A] bg-white p-5 shadow-[0_4px_0_0_#0A2E4A]">
                <span className="text-xs font-bold text-[#4A6B85]">Alunos matriculados</span>
                <p className="mt-1 font-['Bricolage_Grotesque'] text-3xl font-extrabold">{totalAlunosGeral}</p>
              </div>

              <div className="rounded-[24px] border-[3px] border-[#0A2E4A] bg-white p-5 shadow-[0_4px_0_0_#0A2E4A]">
                <span className="text-xs font-bold text-[#4A6B85]">Avaliações criadas</span>
                <p className="mt-1 font-['Bricolage_Grotesque'] text-3xl font-extrabold">{totalAvaliacoesGeral}</p>
              </div>
            </div>

            {/* Formulário de criação de turma */}
            <div className="rounded-[32px] border-[3px] border-[#0A2E4A] bg-white p-6 shadow-[0_6px_0_0_#0A2E4A]">
              <div className="flex items-center gap-2">
                <PlusCircle className="h-5 w-5 text-[#0A2E4A]" />
                <h2 className="font-['Baloo_2'] text-xl font-extrabold">Criar nova turma</h2>
              </div>

              {mensagemSucesso && (
                <div className="mt-3 flex items-center gap-2 rounded-xl border-2 border-[#0A2E4A] bg-[#D1F2D9] px-4 py-2 text-xs font-bold text-[#0F5132]">
                  <Check className="h-4 w-4 shrink-0" />
                  <span>{mensagemSucesso}</span>
                </div>
              )}

              {erro && (
                <div className="mt-3 rounded-xl border-2 border-[#0A2E4A] bg-[#FFE3E3] px-4 py-2 text-xs font-bold text-[#8A1F1F]">
                  {erro}
                </div>
              )}

              <form onSubmit={handleCriarTurma} className="mt-4 flex flex-col gap-3 sm:flex-row">
                <input
                  type="text"
                  value={nomeTurma}
                  onChange={(e) => setNomeTurma(e.target.value)}
                  placeholder="Nome da turma (ex: 7 ano B)"
                  className="flex-1 rounded-[16px] border-2 border-[#0A2E4A] bg-[#EBF5FF] px-4 py-2.5 text-xs font-semibold text-[#0A2E4A] placeholder:text-[#5A7C99] focus:outline-none"
                  required
                />

                <button
                  type="submit"
                  disabled={criandoTurma}
                  className="flex cursor-pointer items-center justify-center gap-1.5 rounded-[16px] border-2 border-[#0A2E4A] bg-[#2496ED] px-5 py-2.5 font-['Baloo_2'] text-sm font-extrabold text-white shadow-[0_3px_0_0_#16457E] hover:brightness-105 active:translate-y-0.5 disabled:opacity-60"
                >
                  <PlusCircle className="h-4 w-4" />
                  {criandoTurma ? 'Criando...' : 'Criar turma'}
                </button>
              </form>
            </div>

            {/* Listagem de turmas */}
            <div>
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-['Baloo_2'] text-xl font-extrabold">Turmas</h3>
                <span className="text-xs font-bold text-[#4A6B85]">{turmas.length} registradas</span>
              </div>

              {carregando ? (
                <div className="flex justify-center py-12">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#0A2E4A] border-t-[#2496ED]" />
                </div>
              ) : turmas.length === 0 ? (
                <div className="rounded-[28px] border-2 border-dashed border-[#0A2E4A]/30 bg-white/60 p-8 text-center text-sm font-bold text-[#4A6B85]">
                  Nenhuma turma criada ainda.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  {turmas.map((t) => (
                    <div
                      key={t.id}
                      className="flex flex-col justify-between rounded-[28px] border-[3px] border-[#0A2E4A] bg-white p-5 shadow-[0_5px_0_0_#0A2E4A]"
                    >
                      <div>
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-['Baloo_2'] text-xl font-extrabold text-[#0A2E4A]">
                              {t.nome}
                            </h4>
                            <p className="text-xs text-[#4A6B85]">
                              Criada em {new Date(t.criadoEm).toLocaleDateString('pt-BR')}
                            </p>
                          </div>

                          <span className="rounded-full border border-[#0A2E4A]/30 bg-[#EBF5FF] px-2.5 py-0.5 text-xs font-bold text-[#14507F]">
                            {t.totalAlunos} aluno(s)
                          </span>
                        </div>

                        {/* Código de Acesso */}
                        <div className="mt-4 rounded-xl border border-[#0A2E4A]/20 bg-[#F4FAFF] p-3">
                          <span className="text-[11px] font-bold text-[#4A6B85]">Código da turma:</span>
                          <div className="mt-1 flex items-center justify-between">
                            <span className="font-mono text-base font-extrabold tracking-wider text-[#0A2E4A]">
                              {t.id}
                            </span>

                            <button
                              type="button"
                              onClick={() => handleCopiarCodigo(t.id)}
                              className="flex cursor-pointer items-center gap-1 rounded-lg border border-[#0A2E4A] bg-white px-2.5 py-1 text-xs font-bold text-[#0A2E4A] shadow-[0_1px_0_0_#0A2E4A] hover:bg-gray-50 active:translate-y-0.5"
                            >
                              {copiadoId === t.id ? (
                                <>
                                  <Check className="h-3 w-3 text-green-600" />
                                  <span>Copiado</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="h-3 w-3" />
                                  <span>Copiar</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Link para a tela de alunos */}
                      <div className="mt-4 border-t border-gray-100 pt-3">
                        <Link
                          href={`/dashboard/turmas/${t.id}`}
                          className="flex w-full items-center justify-center gap-1.5 rounded-xl border-2 border-[#0A2E4A] bg-[#FFC53D] py-2 text-center font-['Baloo_2'] text-xs font-extrabold text-[#0A2E4A] shadow-[0_2px_0_0_#0A2E4A] hover:brightness-105 active:translate-y-0.5"
                        >
                          <Users className="h-4 w-4" />
                          <span>Ver alunos da turma ({t.totalAlunos})</span>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Aluno */
          <div className="rounded-[32px] border-[3px] border-[#0A2E4A] bg-white p-6 shadow-[0_6px_0_0_#0A2E4A]">
            <h2 className="font-['Baloo_2'] text-xl font-extrabold">Minha Turma</h2>
            <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
              <p className="text-sm">
                <strong>Turma:</strong> {turmaAluno?.nome ?? usuario.turmaId}
              </p>
              <p className="text-sm mt-1">
                <strong>Código:</strong> {usuario.turmaId}
              </p>
            </div>
            <div className="mt-5">
              <Link
                href="/"
                className="inline-flex items-center gap-1 rounded-xl border-2 border-[#0A2E4A] bg-[#2496ED] px-4 py-2 font-['Baloo_2'] text-xs font-extrabold text-white shadow-[0_2px_0_0_#16457E]"
              >
                <span>Ver avaliações</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
