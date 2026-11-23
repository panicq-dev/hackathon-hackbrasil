'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Library,
  LayoutDashboard,
  ClipboardCheck,
  LogOut,
  ShieldCheck,
  GraduationCap,
  ThumbsUp,
  ThumbsDown,
  Search,
  Filter,
  Sparkles,
  Check,
  CheckCircle2,
  AlertCircle,
  Coins,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Calendar,
  User,
  PlusCircle,
} from 'lucide-react';
import { UsuarioSessao } from '@/app/src/lib/session';
import { logoutUsuario } from '@/app/actions/login';
import { QuestaoComunidade } from '@/app/src/types';
import {
  listarQuestoesComunidade,
  votarQuestao,
  despublicarQuestaoComunidade,
  listarTagsMaterias,
  criarAvaliacaoComQuestoesBanco,
} from '@/app/actions/questoes';
import { listarTurmasProfessor, TurmaItem } from '@/app/actions/turmas';

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

export default function BancoQuestoesView({ usuario }: { usuario: UsuarioSessao }) {
  const router = useRouter();
  const [questoes, setQuestoes] = useState<QuestaoComunidade[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [tagSelecionada, setTagSelecionada] = useState<string>('todas');
  const [termoBusca, setTermoBusca] = useState<string>('');
  const [ordenacao, setOrdenacao] = useState<'populares' | 'recentes'>('populares');
  const [carregando, setCarregando] = useState<boolean>(true);

  // Seleção de questões para gerar nova avaliação
  const [questoesSelecionadas, setQuestoesSelecionadas] = useState<number[]>([]);
  const [turmas, setTurmas] = useState<TurmaItem[]>([]);
  const [turmaDestino, setTurmaDestino] = useState<string>('');
  const [criandoAvaliacao, setCriandoAvaliacao] = useState<boolean>(false);
  const [modalCriacaoAberto, setModalCriacaoAberto] = useState<boolean>(false);

  // Expansão de detalhes das questões
  const [expandidas, setExpandidas] = useState<Record<number, boolean>>({});

  // Mensagens
  const [mensagemSucesso, setMensagemSucesso] = useState<string>('');
  const [erro, setErro] = useState<string>('');

  const isProfessor = usuario.perfil === 'professor';

  async function carregarDados() {
    setCarregando(true);
    setErro('');
    try {
      const [resQuestoes, resTags, resTurmas] = await Promise.all([
        listarQuestoesComunidade({
          busca: termoBusca,
          tag: tagSelecionada,
          ordenarPor: ordenacao,
        }),
        listarTagsMaterias(),
        isProfessor ? listarTurmasProfessor() : Promise.resolve({ turmas: [] }),
      ]);

      if (resQuestoes.questoes) {
        setQuestoes(resQuestoes.questoes);
      }
      if (resTags) {
        setTags(resTags);
      }
      if (resTurmas.turmas && resTurmas.turmas.length > 0) {
        setTurmas(resTurmas.turmas);
        setTurmaDestino(resTurmas.turmas[0].id);
      }
    } catch {
      setErro('Erro ao carregar o banco de questões.');
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarDados();
  }, [tagSelecionada, ordenacao]);

  async function handleBuscar(e: React.FormEvent) {
    e.preventDefault();
    await carregarDados();
  }

  async function handleVoto(questaoId: number, tipo: 'like' | 'dislike') {
    if (!isProfessor) {
      setErro('Apenas professores podem avaliar questões da comunidade.');
      return;
    }

    // Atualização otimista
    setQuestoes((prev) =>
      prev.map((q) => {
        if (q.id !== questaoId) return q;

        let novosLikes = q.likesCount;
        let novosDislikes = q.dislikesCount;
        let novoVoto: 'like' | 'dislike' | null = tipo;

        if (q.meuVoto === tipo) {
          // Removeu o voto
          novoVoto = null;
          if (tipo === 'like') novosLikes = Math.max(0, novosLikes - 1);
          if (tipo === 'dislike') novosDislikes = Math.max(0, novosDislikes - 1);
        } else {
          // Inseriu ou trocou
          if (tipo === 'like') {
            novosLikes += 1;
            if (q.meuVoto === 'dislike') novosDislikes = Math.max(0, novosDislikes - 1);
          } else {
            novosDislikes += 1;
            if (q.meuVoto === 'like') novosLikes = Math.max(0, novosLikes - 1);
          }
        }

        return {
          ...q,
          likesCount: novosLikes,
          dislikesCount: novosDislikes,
          meuVoto: novoVoto,
        };
      })
    );

    try {
      const res = await votarQuestao(questaoId, tipo);
      if (res.sucesso && res.likesCount !== undefined && res.dislikesCount !== undefined) {
        setQuestoes((prev) =>
          prev.map((q) =>
            q.id === questaoId
              ? {
                  ...q,
                  likesCount: res.likesCount!,
                  dislikesCount: res.dislikesCount!,
                  meuVoto: res.meuVoto ?? null,
                }
              : q
          )
        );
      } else if (res.erro) {
        setErro(res.erro);
      }
    } catch {
      setErro('Falha ao registrar voto.');
    }
  }

  async function handleDespublicar(questaoId: number) {
    if (!confirm('Deseja realmente remover esta questão da comunidade pública?')) return;
    try {
      const res = await despublicarQuestaoComunidade(questaoId);
      if (res.sucesso) {
        setQuestoes((prev) => prev.filter((q) => q.id !== questaoId));
        setMensagemSucesso('Questão removida da comunidade com sucesso.');
      } else {
        setErro(res.erro || 'Falha ao despublicar questão.');
      }
    } catch {
      setErro('Erro ao despublicar questão.');
    }
  }

  function toggleSelecionada(questaoId: number) {
    setQuestoesSelecionadas((prev) =>
      prev.includes(questaoId) ? prev.filter((id) => id !== questaoId) : [...prev, questaoId]
    );
  }

  function toggleDetalhes(questaoId: number) {
    setExpandidas((prev) => ({
      ...prev,
      [questaoId]: !prev[questaoId],
    }));
  }

  async function handleCriarAvaliacao() {
    if (questoesSelecionadas.length === 0) return;
    setCriandoAvaliacao(true);
    setErro('');
    setMensagemSucesso('');

    try {
      const res = await criarAvaliacaoComQuestoesBanco(
        questoesSelecionadas,
        turmaDestino || undefined
      );

      if (res.sucesso && res.avaliacaoId) {
        setMensagemSucesso(
          `🎉 Avaliação criada com sucesso com ${questoesSelecionadas.length} questão(ões) da comunidade! Zero tokens de IA consumidos!`
        );
        setQuestoesSelecionadas([]);
        setModalCriacaoAberto(false);
        setTimeout(() => {
          router.push('/');
        }, 1500);
      } else {
        setErro(res.erro || 'Erro ao criar avaliação.');
      }
    } catch {
      setErro('Falha ao processar avaliação com questões do banco.');
    } finally {
      setCriandoAvaliacao(false);
    }
  }

  async function handleLogout() {
    await logoutUsuario();
    router.refresh();
    window.location.href = '/';
  }

  return (
    <div
      className={[
        'relative min-h-screen overflow-x-hidden bg-[#F6FBFF]',
        "font-['Nunito'] text-[#0A2E4A]",
        'px-5 pb-32 pt-6 md:pl-32 md:pr-10 md:pb-16',
      ].join(' ')}
    >
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,800&family=Baloo+2:wght@600;700;800&family=Nunito:wght@600;700;800&display=swap');`}</style>

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

          <div className="flex items-center gap-2">
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
      </div>

      {/* DOCK DE BOLINHAS FLUTUANTE */}
      <nav
        aria-label="Navegação principal"
        className={[
          'fixed z-40 flex gap-4',
          'bottom-5 left-1/2 -translate-x-1/2 flex-row rounded-full border-[3px] border-[#0A2E4A] bg-white/90 px-4 py-3 shadow-[0_5px_0_0_#0A2E4A] backdrop-blur',
          'md:bottom-auto md:left-6 md:top-1/2 md:-translate-y-1/2 md:translate-x-0 md:flex-col md:px-3 md:py-4',
        ].join(' ')}
      >
        <Link href="/dashboard" aria-label="Dashboard" className={FOCO}>
          <span className={`${BOLINHA} bg-white group-hover:bg-[#C6EFE9]`}>
            <LayoutDashboard className="h-6 w-6 text-[#0A2E4A]" strokeWidth={2.4} />
          </span>
          <span className={ROTULO}>Dashboard</span>
        </Link>

        <Link href="/" aria-label="Avaliações" className={FOCO}>
          <span className={`${BOLINHA} bg-white group-hover:bg-[#C6EFE9]`}>
            <ClipboardCheck className="h-6 w-6 text-[#0A2E4A]" strokeWidth={2.4} />
          </span>
          <span className={ROTULO}>Avaliações</span>
        </Link>

        <button
          type="button"
          aria-label="Banco de Questões"
          aria-current="page"
          className={FOCO}
        >
          <span className={`${BOLINHA} -translate-y-0.5 bg-[#FFC53D] shadow-[0_4px_0_0_#0A2E4A]`}>
            <Library className="h-6 w-6 text-[#0A2E4A]" strokeWidth={2.4} />
          </span>
          <span className={ROTULO}>Banco de Questões</span>
        </button>
      </nav>

      {/* CONTEÚDO PRINCIPAL */}
      <main className="relative z-10 mx-auto max-w-5xl space-y-6">
        {/* HERO / CABEÇALHO DA COMUNIDADE */}
        <section className="relative rounded-[32px] border-[3px] border-[#0A2E4A] bg-white p-6 shadow-[0_8px_0_0_#0A2E4A] md:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-[#0A2E4A] bg-[#FFC53D]">
                  <Library className="h-5 w-5 text-[#0A2E4A]" />
                </span>
                <span className="rounded-full border-2 border-[#0A2E4A] bg-[#FFEFC2] px-3 py-0.5 font-['Baloo_2'] text-xs font-extrabold text-[#0A2E4A]">
                  Comunidade Colaborativa
                </span>
                <span className="rounded-full border-2 border-[#0A2E4A] bg-[#D1F2D9] px-3 py-0.5 font-['Baloo_2'] text-xs font-extrabold text-[#0F5132]">
                  Economia de Tokens IA
                </span>
              </div>

              <h1 className="font-['Bricolage_Grotesque'] text-2xl font-extrabold text-[#0A2E4A] md:text-3xl">
                Banco de Questões da Comunidade
              </h1>

              <p className="max-w-2xl font-['Nunito'] text-sm font-semibold text-[#4A6B85]">
                Conglomerado público de questões pedagógicas compartilhadas por professores. Vote nas questões que achar melhores e selecione-as para montar avaliações instantâneas sem gastar tokens!
              </p>
            </div>

            {isProfessor && (
              <div className="rounded-[22px] border-2 border-[#0A2E4A] bg-[#EBF5FF] p-4 text-center shadow-[0_3px_0_0_#0A2E4A]">
                <span className="block font-['Bricolage_Grotesque'] text-2xl font-extrabold text-[#0A2E4A]">
                  {questoes.length}
                </span>
                <span className="font-['Baloo_2'] text-xs font-bold text-[#14507F]">
                  Questões Disponíveis
                </span>
              </div>
            )}
          </div>
        </section>

        {/* FEEDBACKS */}
        {mensagemSucesso && (
          <div className="flex items-center gap-2.5 rounded-[20px] border-2 border-[#0A2E4A] bg-[#D1F2D9] px-4 py-3 text-sm font-extrabold text-[#0F5132] shadow-[0_3px_0_0_#0A2E4A]">
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            <span>{mensagemSucesso}</span>
          </div>
        )}

        {erro && (
          <div className="flex items-center gap-2.5 rounded-[20px] border-2 border-[#0A2E4A] bg-[#FFE3E3] px-4 py-3 text-sm font-extrabold text-[#8A1F1F] shadow-[0_3px_0_0_#0A2E4A]">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{erro}</span>
          </div>
        )}

        {/* BARRA DE BUSCA E FILTROS */}
        <section className="space-y-4 rounded-[26px] border-[3px] border-[#0A2E4A] bg-white p-5 shadow-[0_5px_0_0_#0A2E4A]">
          <form onSubmit={handleBuscar} className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <span className="pointer-events-none absolute left-[0.7rem] top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full border-2 border-[#0A2E4A] bg-[#4ECDC4]">
                <Search className="h-3.5 w-3.5 text-[#0A2E4A]" />
              </span>
              <input
                type="text"
                value={termoBusca}
                onChange={(e) => setTermoBusca(e.target.value)}
                placeholder="Buscar por palavras-chave, tema ou professor..."
                className="w-full rounded-[18px] border-[3px] border-[#0A2E4A] bg-[#EBF5FF] py-3 pl-[3.1rem] pr-4 text-xs font-semibold text-[#0A2E4A] shadow-[0_3px_0_0_#0A2E4A] placeholder:font-normal placeholder:text-[#5A7C99] focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="flex cursor-pointer items-center justify-center gap-1.5 rounded-[18px] border-[3px] border-[#0A2E4A] bg-[#2496ED] px-5 py-3 font-['Baloo_2'] text-sm font-extrabold text-white shadow-[0_3px_0_0_#0A2E4A] transition hover:brightness-105 active:translate-y-0.5"
            >
              <Search className="h-4 w-4" />
              <span>Filtrar</span>
            </button>
          </form>

          {/* TAGS E ORDENAÇÃO */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#0A2E4A]/10 pt-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex items-center gap-1 font-['Baloo_2'] text-xs font-bold text-[#4A6B85]">
                <Filter className="h-3.5 w-3.5" />
                Matérias:
              </span>

              <button
                type="button"
                onClick={() => setTagSelecionada('todas')}
                className={`cursor-pointer rounded-full border-2 border-[#0A2E4A] px-3 py-1 font-['Baloo_2'] text-xs font-extrabold transition ${
                  tagSelecionada === 'todas'
                    ? 'bg-[#FFC53D] text-[#0A2E4A] shadow-[0_2px_0_0_#0A2E4A]'
                    : 'bg-white text-[#4A6B85] hover:bg-[#FFEFC2]'
                }`}
              >
                Todas
              </button>

              {tags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setTagSelecionada(tag)}
                  className={`cursor-pointer rounded-full border-2 border-[#0A2E4A] px-3 py-1 font-['Baloo_2'] text-xs font-extrabold capitalize transition ${
                    tagSelecionada === tag
                      ? 'bg-[#FFC53D] text-[#0A2E4A] shadow-[0_2px_0_0_#0A2E4A]'
                      : 'bg-white text-[#4A6B85] hover:bg-[#FFEFC2]'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <span className="font-['Baloo_2'] text-xs font-bold text-[#4A6B85]">Ordenar:</span>
              <button
                type="button"
                onClick={() => setOrdenacao('populares')}
                className={`cursor-pointer rounded-full border-2 border-[#0A2E4A] px-3 py-1 font-['Baloo_2'] text-xs font-extrabold transition ${
                  ordenacao === 'populares'
                    ? 'bg-[#4ECDC4] text-[#0A2E4A] shadow-[0_2px_0_0_#0A2E4A]'
                    : 'bg-white text-[#4A6B85]'
                }`}
              >
                🔥 Mais Votadas
              </button>
              <button
                type="button"
                onClick={() => setOrdenacao('recentes')}
                className={`cursor-pointer rounded-full border-2 border-[#0A2E4A] px-3 py-1 font-['Baloo_2'] text-xs font-extrabold transition ${
                  ordenacao === 'recentes'
                    ? 'bg-[#4ECDC4] text-[#0A2E4A] shadow-[0_2px_0_0_#0A2E4A]'
                    : 'bg-white text-[#4A6B85]'
                }`}
              >
                ⏱️ Recentes
              </button>
            </div>
          </div>
        </section>

        {/* BARRA FIXA DE AÇÃO COM QUESTÕES SELECIONADAS */}
        {isProfessor && questoesSelecionadas.length > 0 && (
          <div className="sticky top-4 z-30 flex flex-wrap items-center justify-between gap-3 rounded-[24px] border-[3px] border-[#0A2E4A] bg-[#FFC53D] p-4 shadow-[0_6px_0_0_#0A2E4A]">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#0A2E4A] bg-white font-['Bricolage_Grotesque'] text-sm font-extrabold text-[#0A2E4A]">
                {questoesSelecionadas.length}
              </span>
              <div>
                <p className="font-['Baloo_2'] text-sm font-extrabold text-[#0A2E4A]">
                  {questoesSelecionadas.length} questão(ões) selecionada(s)
                </p>
                <p className="text-xs font-semibold text-[#0A2E4A]/80">
                  Prontas para compor uma nova avaliação sem custos de tokens
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setQuestoesSelecionadas([])}
                className="cursor-pointer rounded-full border-2 border-[#0A2E4A] bg-white px-3 py-1.5 font-['Baloo_2'] text-xs font-bold text-[#0A2E4A] hover:bg-gray-100"
              >
                Limpar
              </button>
              <button
                type="button"
                onClick={() => setModalCriacaoAberto(true)}
                className="flex cursor-pointer items-center gap-1.5 rounded-full border-2 border-[#0A2E4A] bg-[#0A2E4A] px-4 py-2 font-['Baloo_2'] text-xs font-extrabold text-white shadow-[0_2px_0_0_#0A2E4A] hover:brightness-125 active:translate-y-0.5"
              >
                <Sparkles className="h-4 w-4 text-[#FFC53D]" />
                <span>Criar Avaliação com Selecionadas</span>
              </button>
            </div>
          </div>
        )}

        {/* LISTAGEM DE QUESTÕES */}
        {carregando ? (
          <div className="flex flex-col items-center justify-center rounded-[32px] border-[3px] border-[#0A2E4A] bg-white p-12 shadow-[0_6px_0_0_#0A2E4A]">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#0A2E4A] border-t-[#FFC53D]" />
            <p className="mt-4 font-['Baloo_2'] text-sm font-extrabold text-[#4A6B85]">
              Carregando questões da comunidade...
            </p>
          </div>
        ) : questoes.length === 0 ? (
          <div className="rounded-[32px] border-[3px] border-[#0A2E4A] bg-white p-12 text-center shadow-[0_6px_0_0_#0A2E4A]">
            <BookOpen className="mx-auto h-12 w-12 text-[#4A6B85]" />
            <h3 className="mt-3 font-['Bricolage_Grotesque'] text-xl font-extrabold text-[#0A2E4A]">
              Nenhuma questão encontrada
            </h3>
            <p className="mt-1 font-['Nunito'] text-sm font-semibold text-[#4A6B85]">
              Tente alterar os termos da busca ou filtre por outra matéria.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5">
            {questoes.map((q, idx) => {
              const estaSelecionada = questoesSelecionadas.includes(q.id);
              const estaExpandida = expandidas[q.id];

              return (
                <article
                  key={q.id}
                  className={`group relative rounded-[28px] border-[3px] border-[#0A2E4A] bg-white p-6 shadow-[0_5px_0_0_#0A2E4A] transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_0_0_#0A2E4A] ${
                    estaSelecionada ? 'ring-4 ring-[#2496ED]/40 bg-[#F4FAFF]' : ''
                  }`}
                >
                  {/* CABEÇALHO DO CARD */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#0A2E4A]/10 pb-3">
                    <div className="flex flex-wrap items-center gap-2">
                      {isProfessor && (
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={estaSelecionada}
                            onChange={() => toggleSelecionada(q.id)}
                            className="h-4 w-4 rounded border-2 border-[#0A2E4A] text-[#2496ED] accent-[#2496ED]"
                          />
                          <span className="font-['Baloo_2'] text-xs font-bold text-[#0A2E4A]">
                            {estaSelecionada ? 'Selecionada' : 'Selecionar'}
                          </span>
                        </label>
                      )}

                      <span className="rounded-full border-2 border-[#0A2E4A] bg-[#FFEFC2] px-3 py-0.5 font-['Baloo_2'] text-xs font-extrabold capitalize text-[#0A2E4A]">
                        {q.materiaTag}
                      </span>

                      <span className="flex items-center gap-1 text-xs font-bold text-[#4A6B85]">
                        <User className="h-3 w-3" />
                        {q.professorNome}
                      </span>

                      {q.ehMinha && (
                        <span className="rounded-full border border-[#0A2E4A] bg-[#D1F2D9] px-2 py-0.5 text-[10px] font-extrabold text-[#0F5132]">
                          Sua Questão
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-xs font-semibold text-[#5A7C99]">
                      <Calendar className="h-3 w-3" />
                      <span>{new Date(q.criadoEm).toLocaleDateString('pt-BR')}</span>
                    </div>
                  </div>

                  {/* ENUNCIADO */}
                  <div className="py-4">
                    <p className="font-['Nunito'] text-sm font-bold leading-relaxed text-[#0A2E4A]">
                      {q.questao.enunciado}
                    </p>
                  </div>

                  {/* CAMPOS DE RESPOSTA EXPANDÍVEIS */}
                  {estaExpandida && (
                    <div className="mb-4 space-y-3 rounded-[20px] border-2 border-[#0A2E4A]/20 bg-[#F6FBFF] p-4 text-xs">
                      <p className="font-['Baloo_2'] font-bold text-[#14507F]">
                        Estrutura Pedagógica & Validação:
                      </p>

                      <div className="space-y-2">
                        {q.questao.camposValidacao.map((c) => (
                          <div
                            key={c.id}
                            className="rounded-xl border border-[#0A2E4A]/10 bg-white p-2.5"
                          >
                            <span className="font-bold text-[#0A2E4A]">{c.label}:</span>{' '}
                            <span className="rounded bg-[#E8F5E9] px-2 py-0.5 font-bold text-[#1B5E20]">
                              {String(c.respostaCorreta)}
                            </span>
                          </div>
                        ))}
                      </div>

                      {q.questao.mapeamentoDeErros && q.questao.mapeamentoDeErros.length > 0 && (
                        <div className="pt-1">
                          <p className="font-['Baloo_2'] font-bold text-[#E65100]">
                            Gaps de aprendizagem mapeados:
                          </p>
                          <div className="mt-1 flex flex-wrap gap-1.5">
                            {q.questao.mapeamentoDeErros.map((m) => (
                              <span
                                key={m.id}
                                className="rounded-md border border-[#E65100]/30 bg-[#FFF3E0] px-2 py-0.5 font-semibold text-[#E65100]"
                              >
                                {m.erroProvavel}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* RODAPÉ: REAÇÕES (LIKES / DESLIKES) E AÇÕES */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#0A2E4A]/10 pt-3">
                    {/* Botões de Likes e Deslikes */}
                    <div className="flex items-center gap-2">
                      {/* LIKE */}
                      <button
                        type="button"
                        onClick={() => handleVoto(q.id, 'like')}
                        title="Votar positivamente nesta questão"
                        className={`flex cursor-pointer items-center gap-1.5 rounded-full border-2 border-[#0A2E4A] px-3.5 py-1.5 font-['Baloo_2'] text-xs font-extrabold transition active:translate-y-0.5 ${
                          q.meuVoto === 'like'
                            ? 'bg-[#4ECDC4] text-[#0A2E4A] shadow-[0_2px_0_0_#0A2E4A]'
                            : 'bg-white text-[#4A6B85] hover:bg-[#C6EFE9]'
                        }`}
                      >
                        <ThumbsUp
                          className={`h-4 w-4 ${q.meuVoto === 'like' ? 'fill-[#0A2E4A]' : ''}`}
                        />
                        <span>{q.likesCount}</span>
                      </button>

                      {/* DISLIKE */}
                      <button
                        type="button"
                        onClick={() => handleVoto(q.id, 'dislike')}
                        title="Votar negativamente nesta questão"
                        className={`flex cursor-pointer items-center gap-1.5 rounded-full border-2 border-[#0A2E4A] px-3.5 py-1.5 font-['Baloo_2'] text-xs font-extrabold transition active:translate-y-0.5 ${
                          q.meuVoto === 'dislike'
                            ? 'bg-[#FF6B6B] text-white shadow-[0_2px_0_0_#0A2E4A]'
                            : 'bg-white text-[#4A6B85] hover:bg-[#FFE3E3]'
                        }`}
                      >
                        <ThumbsDown
                          className={`h-4 w-4 ${q.meuVoto === 'dislike' ? 'fill-white' : ''}`}
                        />
                        <span>{q.dislikesCount}</span>
                      </button>

                      <span className="text-[11px] font-bold text-[#5A7C99]">
                        {q.likesCount - q.dislikesCount > 0 ? `+${q.likesCount - q.dislikesCount}` : q.likesCount - q.dislikesCount} saldo
                      </span>
                    </div>

                    {/* Botões da Direita */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => toggleDetalhes(q.id)}
                        className="flex cursor-pointer items-center gap-1 rounded-full border border-[#0A2E4A] bg-white px-3 py-1 font-['Baloo_2'] text-xs font-bold text-[#0A2E4A] hover:bg-gray-100"
                      >
                        {estaExpandida ? (
                          <>
                            <span>Ocultar detalhes</span>
                            <ChevronUp className="h-3.5 w-3.5" />
                          </>
                        ) : (
                          <>
                            <span>Ver respostas e gaps</span>
                            <ChevronDown className="h-3.5 w-3.5" />
                          </>
                        )}
                      </button>

                      {q.ehMinha && (
                        <button
                          type="button"
                          onClick={() => handleDespublicar(q.id)}
                          className="cursor-pointer rounded-full border border-[#8A1F1F] bg-[#FFE3E3] px-3 py-1 font-['Baloo_2'] text-xs font-bold text-[#8A1F1F] hover:brightness-95"
                        >
                          Despublicar
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>

      {/* MODAL PARA CRIAR AVALIAÇÃO COM SELECIONADAS */}
      {modalCriacaoAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0A2E4A]/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[32px] border-[3px] border-[#0A2E4A] bg-white p-6 shadow-[0_12px_0_0_#0A2E4A]">
            <div className="flex items-center justify-between pb-3">
              <h3 className="font-['Bricolage_Grotesque'] text-xl font-extrabold text-[#0A2E4A]">
                Criar Avaliação da Comunidade
              </h3>
              <button
                type="button"
                onClick={() => setModalCriacaoAberto(false)}
                className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border-2 border-[#0A2E4A] bg-white text-xs font-bold hover:bg-gray-100"
              >
                ✕
              </button>
            </div>

            <p className="font-['Nunito'] text-xs font-semibold text-[#4A6B85]">
              Você selecionou <strong>{questoesSelecionadas.length}</strong> questão(ões) do banco. Esta avaliação será criada instantaneamente e persistida no banco, sem consumir tokens de IA.
            </p>

            <div className="mt-4 space-y-3">
              <label className="block font-['Baloo_2'] text-xs font-bold text-[#14507F]">
                Vincular a qual turma?
              </label>
              <div className="relative">
                <select
                  value={turmaDestino}
                  onChange={(e) => setTurmaDestino(e.target.value)}
                  className="w-full appearance-none rounded-[18px] border-[3px] border-[#0A2E4A] bg-[#EBF5FF] px-3.5 py-2.5 pr-10 text-xs font-semibold text-[#0A2E4A] shadow-[0_3px_0_0_#0A2E4A] focus:outline-none"
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
                <span className="pointer-events-none absolute right-2.5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full border-2 border-[#0A2E4A] bg-[#FFC53D]">
                  <ChevronDown className="h-3.5 w-3.5 text-[#0A2E4A]" />
                </span>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setModalCriacaoAberto(false)}
                className="cursor-pointer rounded-full border-2 border-[#0A2E4A] bg-white px-4 py-2 font-['Baloo_2'] text-xs font-bold text-[#0A2E4A] hover:bg-gray-100"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={criandoAvaliacao}
                onClick={handleCriarAvaliacao}
                className="flex cursor-pointer items-center gap-1.5 rounded-full border-[3px] border-[#0A2E4A] bg-[#FFC53D] px-5 py-2.5 font-['Baloo_2'] text-xs font-extrabold text-[#0A2E4A] shadow-[0_3px_0_0_#0A2E4A] transition hover:brightness-105 active:translate-y-0.5 disabled:opacity-60"
              >
                <Sparkles className="h-4 w-4" />
                <span>{criandoAvaliacao ? 'Gerando...' : 'Confirmar e Criar Avaliação'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
