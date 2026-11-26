'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArchiveX, ArrowLeft, RotateCcw, Trash2 } from 'lucide-react';
import {
  excluirPermanentementeDaLixeira,
  listarLixeiraProfessor,
  restaurarDaLixeira,
} from '@/app/actions/lixeira';
import type { ItemLixeiraProfessor, TipoItemLixeira } from '@/app/actions/lixeira';
import type { UsuarioSessao } from '@/app/src/lib/session';
import { DashboardChrome } from '../dashboard/DashboardView';

type FiltroLixeira = 'todos' | TipoItemLixeira;

export default function LixeiraView({ usuario }: { usuario: UsuarioSessao }) {
  const router = useRouter();
  const [itens, setItens] = useState<ItemLixeiraProfessor[]>([]);
  const [filtro, setFiltro] = useState<FiltroLixeira>('todos');
  const [carregando, setCarregando] = useState(true);
  const [operacaoId, setOperacaoId] = useState<string | null>(null);
  const [erro, setErro] = useState('');
  const [mensagemSucesso, setMensagemSucesso] = useState('');

  async function carregarItens() {
    const resultado = await listarLixeiraProfessor();
    if (resultado.erro) throw new Error(resultado.erro);
    setItens(resultado.itens ?? []);
  }

  useEffect(() => {
    let ativo = true;
    Promise.resolve().then(async () => {
      try {
        const resultado = await listarLixeiraProfessor();
        if (!ativo) return;
        if (resultado.erro) {
          setErro(resultado.erro);
        } else {
          setItens(resultado.itens ?? []);
        }
      } catch (falha) {
        if (ativo) {
          setErro(falha instanceof Error ? falha.message : 'Não foi possível carregar a lixeira.');
        }
      } finally {
        if (ativo) setCarregando(false);
      }
    });
    return () => {
      ativo = false;
    };
  }, []);

  useEffect(() => {
    if (!mensagemSucesso) return;
    const timeout = window.setTimeout(() => setMensagemSucesso(''), 4000);
    return () => window.clearTimeout(timeout);
  }, [mensagemSucesso]);

  async function agir(
    item: ItemLixeiraProfessor,
    acao: 'restaurar' | 'excluir'
  ) {
    const confirmacao = acao === 'restaurar'
      ? item.tipo === 'turma'
        ? `Restaurar "${item.nome}" e os alunos e avaliações arquivados junto com ela?`
        : `Restaurar "${item.nome}"?`
      : `Excluir "${item.nome}" permanentemente?${item.tipo === 'turma' ? ' Os alunos e avaliações vinculados também serão apagados.' : ' As respostas associadas também serão apagadas.'}`;
    if (!window.confirm(confirmacao)) return;

    const chave = `${item.tipo}:${item.id}`;
    setOperacaoId(chave);
    setErro('');
    setMensagemSucesso('');
    try {
      const resultado = acao === 'restaurar'
        ? await restaurarDaLixeira(item.tipo, item.id)
        : await excluirPermanentementeDaLixeira(item.tipo, item.id);
      if (resultado.erro) {
        setErro(resultado.erro);
        return;
      }
      await carregarItens();
      setMensagemSucesso(
        acao === 'restaurar'
          ? `"${item.nome}" foi restaurado.`
          : `"${item.nome}" foi excluído permanentemente.`
      );
      router.refresh();
    } catch (falha) {
      setErro(falha instanceof Error ? falha.message : 'Não foi possível concluir a operação.');
    } finally {
      setOperacaoId(null);
    }
  }

  const totais = {
    turma: itens.filter((item) => item.tipo === 'turma').length,
    aluno: itens.filter((item) => item.tipo === 'aluno').length,
    avaliacao: itens.filter((item) => item.tipo === 'avaliacao').length,
  };
  const filtros: { tipo: FiltroLixeira; rotulo: string; quantidade: number }[] = [
    { tipo: 'todos', rotulo: 'Todos', quantidade: itens.length },
    { tipo: 'aluno', rotulo: 'Alunos', quantidade: totais.aluno },
    { tipo: 'turma', rotulo: 'Turmas', quantidade: totais.turma },
    { tipo: 'avaliacao', rotulo: 'Avaliações', quantidade: totais.avaliacao },
  ];
  const itensVisiveis = filtro === 'todos'
    ? itens
    : itens.filter((item) => item.tipo === filtro);

  return (
    <DashboardChrome usuario={usuario}>
      <main className="relative z-10 mx-auto max-w-5xl space-y-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 rounded-full border-2 border-[#0A2E4A] bg-[#FFC53D] px-4 py-2 text-sm font-extrabold text-[#0A2E4A] shadow-[0_3px_0_0_#0A2E4A]"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar ao dashboard
        </Link>

        <header className="rounded-[30px] border-[3px] border-[#0A2E4A] bg-white p-6 shadow-[0_6px_0_0_#0A2E4A]">
          <div className="flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-full border-2 border-red-700 bg-red-100 text-red-700">
              <Trash2 className="h-6 w-6" />
            </span>
            <div>
              <h1 className="font-sans text-3xl font-extrabold text-[#0A2E4A]">Lixeira</h1>
              <p className="text-sm font-semibold text-[#4A6B85]">
                Restaure itens ou exclua-os permanentemente.
              </p>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-2 text-xs font-extrabold" aria-label="Filtrar itens da lixeira">
            {filtros.map((opcao) => (
              <button
                key={opcao.tipo}
                type="button"
                aria-pressed={filtro === opcao.tipo}
                onClick={() => setFiltro(opcao.tipo)}
                className={`rounded-full border-2 border-[#0A2E4A] px-3 py-1.5 transition ${
                  filtro === opcao.tipo
                    ? 'bg-[#0A2E4A] text-white'
                    : 'bg-[#EBF5FF] text-[#0A2E4A] hover:bg-[#D9ECFA]'
                }`}
              >
                {opcao.rotulo}: {opcao.quantidade}
              </button>
            ))}
          </div>
        </header>

        {erro && (
          <p role="alert" className="rounded-xl border-2 border-red-700 bg-red-50 px-4 py-3 text-sm font-bold text-red-800">
            {erro}
          </p>
        )}
        {mensagemSucesso && (
          <p role="status" className="rounded-xl border-2 border-green-700 bg-green-50 px-4 py-3 text-sm font-bold text-green-800">
            {mensagemSucesso}
          </p>
        )}

        {carregando ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#0A2E4A] border-t-[#2496ED]" />
          </div>
        ) : itensVisiveis.length === 0 ? (
          <section className="rounded-[28px] border-2 border-dashed border-[#0A2E4A]/30 bg-white/70 p-10 text-center">
            <Trash2 className="mx-auto h-8 w-8 text-red-500" />
            <h2 className="mt-3 font-sans text-xl font-extrabold text-[#0A2E4A]">
              {filtro === 'todos' ? 'A lixeira está vazia' : `Nenhum item em ${filtros.find((opcao) => opcao.tipo === filtro)?.rotulo?.toLowerCase()}`}
            </h2>
            <p className="mt-1 text-sm font-semibold text-[#4A6B85]">
              {filtro === 'todos'
                ? 'Itens que você arquivar aparecerão aqui.'
                : 'Escolha outra categoria para ver os itens arquivados.'}
            </p>
          </section>
        ) : (
          <section className="space-y-3">
            {itensVisiveis.map((item) => {
              const chave = `${item.tipo}:${item.id}`;
              const restauracaoBloqueada =
                item.tipo !== 'turma' && item.turmaArquivada === true;
              return (
                <article
                  key={chave}
                  className="flex flex-wrap items-center justify-between gap-4 rounded-[22px] border-2 border-[#0A2E4A] bg-white p-4 shadow-[0_3px_0_0_#0A2E4A]"
                >
                  <div className="min-w-0">
                    <h2 className="break-words font-sans text-lg font-extrabold text-[#0A2E4A]">{item.nome}</h2>
                    <p className="mt-1 text-sm font-semibold text-[#4A6B85]">
                      {item.tipo}{item.turmaNome ? ` • ${item.turmaNome}` : ''} • arquivado em {new Date(item.arquivadaEm).toLocaleDateString('pt-BR')}
                    </p>
                    {item.tipo === 'turma' && (
                      <p className="mt-1 text-xs font-bold text-[#4A6B85]">
                        {item.alunosInativados === 1
                          ? '1 aluno foi inativado'
                          : `${item.alunosInativados ?? 0} alunos foram inativados`}{' '}
                        junto com a turma. Restaurar ou excluir a turma também{' '}
                        {item.alunosInativados === 1
                          ? 'restaurará ou excluirá esse aluno.'
                          : 'restaurará ou excluirá esses alunos.'}
                      </p>
                    )}
                    {restauracaoBloqueada && (
                      <p className="mt-1 text-xs font-bold text-[#8A1F1F]">
                        Restaure a turma para reativar este item.
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      disabled={operacaoId === chave || restauracaoBloqueada}
                      title={restauracaoBloqueada ? 'Restaure a turma antes deste item.' : undefined}
                      onClick={() => void agir(item, 'restaurar')}
                      className="inline-flex items-center gap-1.5 rounded-xl border-2 border-[#0A2E4A] bg-[#D1F2D9] px-3 py-2 text-sm font-extrabold text-[#0F5132] disabled:opacity-50"
                    >
                      <RotateCcw className="h-4 w-4" />
                      Restaurar
                    </button>
                    <button
                      type="button"
                      disabled={operacaoId === chave}
                      aria-label={`Excluir ${item.nome} permanentemente`}
                      onClick={() => void agir(item, 'excluir')}
                      className="inline-flex items-center gap-1.5 rounded-xl border-2 border-red-700 bg-red-100 px-3 py-2 text-sm font-extrabold text-red-800 disabled:opacity-50"
                    >
                      <ArchiveX className="h-4 w-4" />
                      Excluir
                    </button>
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </main>
    </DashboardChrome>
  );
}
