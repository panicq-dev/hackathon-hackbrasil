"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, Pencil, Settings } from "lucide-react";
import { obterConfiguracaoAvatar, salvarAvatarPerfil } from "@/app/actions/perfil";
import AvatarPerfil from "@/app/src/componentes/AvatarPerfil";
import { AVATARES_PERFIL } from "@/app/src/lib/avataresPerfil";
import type { UsuarioSessao } from "@/app/src/lib/session";
import { DashboardChrome } from "@/app/dashboard/DashboardView";

export default function ConfiguracoesView({ usuario }: { usuario: UsuarioSessao }) {
  const router = useRouter();
  const [avatarId, setAvatarId] = useState<string>(usuario.avatarId ?? AVATARES_PERFIL[0].id);
  const [avatarSalvo, setAvatarSalvo] = useState<string>(usuario.avatarId ?? AVATARES_PERFIL[0].id);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [idsDisponiveis, setIdsDisponiveis] = useState<string[]>([]);
  const [tentativaCarregamento, setTentativaCarregamento] = useState(0);
  const [seletorAberto, setSeletorAberto] = useState(false);
  
  useEffect(() => {
    let ativo = true;

    void (async () => {
      try {
        const resultado = await obterConfiguracaoAvatar();
        if (!ativo) return;
        if (resultado.erro || !resultado.avatarId || !resultado.avatares) {
          setIdsDisponiveis([]);
          setErro(resultado.erro ?? "Não foi possível carregar as opções de avatar.");
          return;
        }

        setIdsDisponiveis(resultado.avatares.map((avatar) => avatar.id));
        setAvatarId(resultado.avatarId);
        setAvatarSalvo(resultado.avatarId);
      } catch (falha: unknown) {
        console.error("Erro inesperado ao carregar a configuração de avatar:", falha);
        if (ativo) {
          setIdsDisponiveis([]);
          setErro("Não foi possível carregar as opções de avatar. Tente novamente.");
        }
      } finally {
        if (ativo) setCarregando(false);
      }
    })();

    return () => {
      ativo = false;
    };
  }, [tentativaCarregamento]);

  async function salvarAlteracao() {
    setSalvando(true);
    setErro("");
    setMensagem("");
    try {
      const resultado = await salvarAvatarPerfil(avatarId);
      if (resultado.erro || !resultado.avatarId) {
        setErro(resultado.erro ?? "Não foi possível salvar o avatar.");
        return;
      }

      setAvatarId(resultado.avatarId);
      setAvatarSalvo(resultado.avatarId);
      setMensagem("Avatar atualizado com sucesso.");
      setSeletorAberto(false);
      router.refresh();
    } catch (falha) {
      console.error("Erro inesperado ao salvar o avatar:", falha);
      setErro("Não foi possível salvar o avatar. Tente novamente.");
    } finally {
      setSalvando(false);
    }
  }

  const usuarioComAvatar = { ...usuario, avatarId: avatarSalvo };

  return (
    <DashboardChrome usuario={usuarioComAvatar}>
      <main className="relative z-10 mx-auto max-w-5xl space-y-6">
        <header className="flex items-start gap-4">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-[16px] border-2 border-[#0A2E4A] bg-[#FFC53D]">
            <Settings className="h-6 w-6" />
          </span>
          <div>
            <p className="text-sm font-extrabold text-[#4A6B85]">PREFERÊNCIAS DA CONTA</p>
            <h1 className="font-sans text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
              Configurações
            </h1>
            <p className="mt-2 max-w-xl text-sm font-semibold text-[#4A6B85]">
              Gerencie a imagem que identifica seu perfil.
            </p>
          </div>
        </header>

        <section className="rounded-[28px] border-[3px] border-[#0A2E4A] bg-white p-5 shadow-[0_6px_0_0_#0A2E4A] sm:p-7">
          {!seletorAberto ? (
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="font-sans text-xl font-extrabold">Avatar do perfil</h2>
                <p className="mt-1 text-sm font-semibold text-[#4A6B85]">
                  {carregando ? "Carregando seu avatar..." : "Seu avatar atual está salvo na conta."}
                </p>
              </div>
              <div className="flex items-center gap-3 rounded-2xl bg-[#F6FBFF] p-2 pr-4">
                <AvatarPerfil avatarId={avatarSalvo} className="h-14 w-14 rounded-full border-2 border-[#0A2E4A]" decorativo />
                <span className="text-sm font-extrabold">Avatar atual</span>
              </div>
              <button
                type="button"
                disabled={carregando || idsDisponiveis.length === 0}
                onClick={() => setSeletorAberto(true)}
                className="inline-flex items-center gap-2 rounded-full border-2 border-[#0A2E4A] bg-[#FFC53D] px-5 py-2.5 text-sm font-extrabold shadow-[0_3px_0_0_#0A2E4A] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Pencil className="h-4 w-4" />
                Alterar avatar
              </button>
            </div>
          ) : (
            <>
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="font-sans text-xl font-extrabold">Escolha seu avatar</h2>
                  <p className="mt-1 text-sm font-semibold text-[#4A6B85]">
                    Selecione uma das 25 opções ilustradas.
                  </p>
                </div>
                <div className="flex items-center gap-3 rounded-2xl bg-[#F6FBFF] p-2 pr-4">
                  <AvatarPerfil avatarId={avatarId} className="h-12 w-12 rounded-full border-2 border-[#0A2E4A]" decorativo />
                  <span className="text-sm font-extrabold">Selecionado</span>
                </div>
              </div>
            </>
          )}

          {erro && (
            <p role="alert" className="mt-4 rounded-xl border-2 border-red-700 bg-red-50 px-3 py-2 text-sm font-bold text-red-800">
              {erro}
            </p>
          )}
          {mensagem && (
            <p role="status" className="mt-4 rounded-xl border-2 border-green-700 bg-green-50 px-3 py-2 text-sm font-bold text-green-800">
              {mensagem}
            </p>
          )}

          {seletorAberto && (carregando ? (
            <div role="status" className="mt-5 grid grid-cols-3 gap-2 sm:grid-cols-5">
              {AVATARES_PERFIL.map((avatar) => (
                <div key={avatar.id} className="h-20 animate-pulse rounded-xl bg-[#EBF5FF]" />
              ))}
            </div>
          ) : (
            <div className="mt-5 grid grid-cols-3 gap-2 sm:grid-cols-5">
              {AVATARES_PERFIL.filter((avatar) => idsDisponiveis.includes(avatar.id)).map((avatar, index) => {
                const selecionado = avatar.id === avatarId;
                return (
                  <button
                    key={avatar.id}
                    type="button"
                    disabled={salvando}
                    aria-label={`Selecionar avatar ${index + 1}`}
                    aria-pressed={selecionado}
                    onClick={() => {
                      setAvatarId(avatar.id);
                      setErro("");
                      setMensagem("");
                    }}
                    className={`group flex min-h-20 items-center justify-center rounded-xl border-2 p-2 transition hover:-translate-y-0.5 hover:shadow-[0_3px_0_0_#0A2E4A] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#1D63ED]/40 ${
                      selecionado
                        ? "border-[#0A2E4A] bg-[#FFF4D6] shadow-[0_3px_0_0_#0A2E4A]"
                        : "border-[#0A2E4A]/20 bg-white hover:border-[#0A2E4A]"
                    }`}
                  >
                    <span className="relative">
                      <AvatarPerfil avatarId={avatar.id} className="h-12 w-12 rounded-full border-2 border-[#0A2E4A] transition group-hover:scale-105" decorativo />
                      {selecionado && (
                        <span className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full border-2 border-white bg-[#0A2E4A] text-white">
                          <Check className="h-3 w-3" />
                        </span>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          ))}

          {!carregando && erro && idsDisponiveis.length === 0 && (
            <button
              type="button"
              onClick={() => {
                setCarregando(true);
                setErro("");
                setTentativaCarregamento((tentativa) => tentativa + 1);
              }}
              className="mt-4 rounded-full border-2 border-[#0A2E4A] bg-white px-4 py-2 text-xs font-extrabold shadow-[0_2px_0_0_#0A2E4A]"
            >
              Tentar carregar novamente
            </button>
          )}

          {seletorAberto && (
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[#0A2E4A]/10 pt-4">
              <button
                type="button"
                disabled={salvando}
                onClick={() => {
                  setAvatarId(avatarSalvo);
                  setSeletorAberto(false);
                  setErro("");
                  setMensagem("");
                }}
                className="inline-flex items-center gap-2 rounded-full border-2 border-[#0A2E4A] bg-white px-4 py-2.5 text-sm font-extrabold shadow-[0_3px_0_0_#0A2E4A]"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </button>
              <button
                type="button"
                disabled={salvando || carregando || idsDisponiveis.length === 0 || avatarId === avatarSalvo}
                onClick={() => void salvarAlteracao()}
                className="inline-flex items-center gap-2 rounded-full border-2 border-[#0A2E4A] bg-[#FFC53D] px-5 py-2.5 text-sm font-extrabold shadow-[0_3px_0_0_#0A2E4A] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Check className="h-4 w-4" />
                {salvando ? "Salvando..." : "Salvar avatar"}
              </button>
            </div>
          )}
        </section>
      </main>
    </DashboardChrome>
  );
}
