'use client';
import { Eye, EyeOff, Mail, Lock, User, IdCard, UserCheck, UserPlus, Star } from "lucide-react";
import { useState } from "react";
import { Perfil } from "@/app/src/types/Perfil";

const INK = "#0A2E4A";

const label = "font-['Baloo_2'] text-base font-bold text-[#14507F]";
const hint = "text-xs font-bold text-[#4A6B85]";

const fieldBase =
  "w-full rounded-[18px] border-[3px] border-[#0A2E4A] bg-[#EBF5FF] py-3 text-xs font-semibold text-[#0A2E4A] " +
  "shadow-[0_3px_0_0_#0A2E4A] transition-shadow placeholder:font-normal placeholder:text-[#5A7C99] " +
  "focus:outline-none focus:shadow-[0_3px_0_0_#0A2E4A,0_0_0_4px_rgba(36,150,237,0.3)]";
const fieldIcon = `${fieldBase} pl-[3.1rem] pr-4`;
const fieldIconAction = `${fieldBase} pl-[3.1rem] pr-[3.2rem]`;

const iconBubble =
  "pointer-events-none absolute left-[0.7rem] top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center " +
  "rounded-full border-2 border-[#0A2E4A] bg-[#4ECDC4]";
const eyeBtn =
  "absolute right-[0.6rem] top-1/2 flex h-7 w-7 -translate-y-1/2 cursor-pointer items-center justify-center " +
  "rounded-full border-2 border-[#0A2E4A] bg-[#FFC53D] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#2496ED]/30";

const tabBase =
  "rounded-2xl border-2 p-2 font-['Baloo_2'] text-base font-extrabold transition-colors " +
  "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#2496ED]/30";
const tabClass = (ativa: boolean) =>
  `${tabBase} ${
    ativa
      ? "border-[#0A2E4A] bg-[#FFC53D] text-[#0A2E4A] shadow-[0_3px_0_0_#0A2E4A]"
      : "border-transparent bg-transparent text-[#4A6B85] hover:bg-[#FFC53D]/35"
  }`;

export default function Register() {
  const [perfil, setPerfil] = useState<Perfil>('professor');
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [matricula, setMatricula] = useState('');
  const [emailProfessor, setEmailProfessor] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro('');

    if (senha.length < 8) {
      setErro('A senha precisa ter pelo menos 8 caracteres.');
      return;
    }
    if (senha !== confirmar) {
      setErro('As senhas não coincidem.');
      return;
    }

    setCarregando(true);
    try {
      const dados = perfil === 'professor'
        ? { perfil, nome, email, senha }
        : { perfil, nome, matricula, email, emailProfessor, senha };
      // TODO: chamar sua server action / API de registro
      // await registrarUsuario(dados);
      console.log(dados);
    } catch {
      setErro('Não foi possível criar a conta. Tente novamente.');
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div
      className="relative flex min-h-screen flex-1 flex-col items-center justify-center overflow-hidden bg-[#F4FAFF]
        bg-[image:radial-gradient(circle_at_12%_8%,#BFE3F7_0%,transparent_42%),radial-gradient(circle_at_88%_92%,#C6EFE9_0%,transparent_40%),radial-gradient(circle_at_78%_12%,#FFEFC2_0%,transparent_30%)]
        px-4 py-12 font-['Nunito'] text-[#0A2E4A]"
    >
      <form
        onSubmit={handleSubmit}
        className="relative w-full max-w-xl rounded-[44px] border-[3px] border-[#0A2E4A] bg-white p-7
          shadow-[0_8px_0_0_#0A2E4A,0_24px_45px_-18px_rgba(20,80,140,0.45)] sm:p-9"
      >
        <div className="absolute -right-3 -top-4 -rotate-6 rounded-2xl border-2 border-[#0A2E4A] bg-[#FF6B6B] px-3 py-1.5 font-['Baloo_2'] text-xs font-extrabold text-white shadow-[0_3px_0_0_#0A2E4A]">
          bem-vindo!
        </div>

        <h1 className="text-center font-['Baloo_2'] text-3xl font-extrabold">Criar conta</h1>
        <svg viewBox="0 0 220 14" className="mx-auto mb-2 mt-1 w-48" aria-hidden>
          <path d="M4 9c18-8 34 6 52-1s34 6 52-1 34 6 52-1 34 6 52-1" fill="none" stroke="#2496ED" strokeWidth="5" strokeLinecap="round" />
        </svg>
        <p className="mb-6 text-center text-sm font-bold text-[#4A6B85]">
          {perfil === 'professor'
            ? 'Cadastre-se e comece a montar suas avaliações.'
            : 'Cadastre-se e entre na turma do seu professor.'}
        </p>

        <div className="space-y-5 text-sm">
          {/* Perfil */}
          <div
            role="tablist"
            aria-label="Tipo de conta"
            className="grid grid-cols-2 gap-2 rounded-[22px] border-[3px] border-[#0A2E4A] bg-[#EBF5FF] p-[0.35rem] shadow-[0_3px_0_0_#0A2E4A]"
          >
            <button
              type="button"
              role="tab"
              aria-selected={perfil === 'professor'}
              onClick={() => { setPerfil('professor'); setErro(''); }}
              className={tabClass(perfil === 'professor')}
            >
              Professor
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={perfil === 'aluno'}
              onClick={() => { setPerfil('aluno'); setErro(''); }}
              className={tabClass(perfil === 'aluno')}
            >
              Aluno
            </button>
          </div>

          {/* Nome */}
          <div className="space-y-2">
            <label htmlFor="nome" className={label}>Nome completo</label>
            <div className="relative">
              <span className={iconBubble}><User className="h-4 w-4" color={INK} /></span>
              <input
                id="nome"
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Maria Souza"
                autoComplete="name"
                className={fieldIcon}
                required
              />
            </div>
          </div>

          {/* Matrícula (aluno) */}
          {perfil === 'aluno' && (
            <div className="space-y-2">
              <label htmlFor="matricula" className={label}>Matrícula</label>
              <div className="relative">
                <span className={iconBubble}><IdCard className="h-4 w-4" color={INK} /></span>
                <input
                  id="matricula"
                  type="text"
                  value={matricula}
                  onChange={(e) => setMatricula(e.target.value)}
                  placeholder="Ex: 2026012345"
                  inputMode="numeric"
                  className={fieldIcon}
                  required
                />
              </div>
            </div>
          )}

          {/* E-mail */}
          <div className="space-y-2">
            <label htmlFor="email" className={label}>
              {perfil === 'professor' ? 'E-mail' : 'E-mail particular'}
            </label>
            <div className="relative">
              <span className={iconBubble}><Mail className="h-4 w-4" color={INK} /></span>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={perfil === 'professor' ? 'voce@escola.com.br' : 'voce@email.com'}
                autoComplete="email"
                className={fieldIcon}
                required
              />
            </div>
          </div>

          {/* E-mail do professor (aluno) */}
          {perfil === 'aluno' && (
            <div className="space-y-2">
              <label htmlFor="emailProfessor" className={label}>E-mail do professor</label>
              <p className={hint}>Usado para você entrar na turma.</p>
              <div className="relative">
                <span className={iconBubble}><UserCheck className="h-4 w-4" color={INK} /></span>
                <input
                  id="emailProfessor"
                  type="email"
                  value={emailProfessor}
                  onChange={(e) => setEmailProfessor(e.target.value)}
                  placeholder="professor@escola.com.br"
                  className={fieldIcon}
                  required
                />
              </div>
            </div>
          )}

          {/* Senhas */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="senha" className={label}>Senha</label>
              <div className="relative">
                <span className={iconBubble}><Lock className="h-4 w-4" color={INK} /></span>
                <input
                  id="senha"
                  type={mostrarSenha ? 'text' : 'password'}
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  autoComplete="new-password"
                  className={fieldIconAction}
                  required
                />
                <button
                  type="button"
                  onClick={() => setMostrarSenha((v) => !v)}
                  className={eyeBtn}
                  aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {mostrarSenha
                    ? <EyeOff className="h-4 w-4" color={INK} />
                    : <Eye className="h-4 w-4" color={INK} />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="confirmar" className={label}>Confirmar senha</label>
              <div className="relative">
                <span className={iconBubble}><Lock className="h-4 w-4" color={INK} /></span>
                <input
                  id="confirmar"
                  type={mostrarSenha ? 'text' : 'password'}
                  value={confirmar}
                  onChange={(e) => setConfirmar(e.target.value)}
                  placeholder="Repita a senha"
                  autoComplete="new-password"
                  className={fieldIcon}
                  required
                />
              </div>
            </div>
          </div>

          {erro && (
            <p
              role="alert"
              className="rounded-[18px] border-[3px] border-[#0A2E4A] bg-[#FFE3E3] px-4 py-2.5 text-xs font-extrabold text-[#8A1F1F] shadow-[0_3px_0_0_#0A2E4A]"
            >
              {erro}
            </p>
          )}

          {/* Submit */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={carregando}
              className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-[18px] border-[3px] border-[#0A2E4A]
                bg-[linear-gradient(160deg,#5AA9E6_0%,#2496ED_45%,#1D63ED_100%)] px-4 py-[0.9rem]
                font-['Baloo_2'] text-[1.15rem] font-extrabold text-white
                shadow-[0_7px_0_0_#16457E,0_18px_30px_-14px_rgba(29,99,237,0.65)]
                transition hover:brightness-105 active:translate-y-1.5 active:shadow-[0_1px_0_0_#16457E]
                disabled:cursor-not-allowed disabled:opacity-70"
            >
              <UserPlus className="h-5 w-5" />
              {carregando ? 'Criando conta...' : 'Criar conta'}
            </button>
          </div>

          <p className="flex items-center justify-center gap-1.5 pt-1 text-center text-xs font-extrabold text-[#4A6B85]">
            <Star className="h-3.5 w-3.5 fill-[#FFC53D] text-[#FFC53D]" />
            Já tem conta?{' '}
            <a href="/login" className="font-black text-[#1D63ED] underline underline-offset-[3px] hover:text-[#0A2E4A]">
              Entrar
            </a>
          </p>
        </div>
      </form>
    </div>
  );
}