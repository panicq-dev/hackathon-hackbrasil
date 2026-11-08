import Image from "next/image";
import { ChevronDown, Link as LinkIcon, Upload, Sparkles, Star } from "lucide-react";
import { gerarAvaliacao } from "@/app/action";
import { useState } from "react";
import { EstruturaQuestao } from "@/app/src/types/Questao";

export default function GeradorAvaliativo() {
  const [conteudoPrincipal, setConteudoPrincipal] = useState('');
  const [conteudoDetalhado, setConteudoDetalhado] = useState('');
  const [resultadoJson, setResultadoJson] = useState<EstruturaQuestao | null>(null);
  return (
    <div className="gv-page relative flex min-h-screen flex-1 flex-col items-center justify-center overflow-hidden px-4 py-12">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;700;800&family=Nunito:wght@400;600;700;800;900&display=swap');

        .gv-page {
          --ink: #0A2E4A;
          --blue: #2496ED;
          --deep: #1D63ED;
          --sky: #EBF5FF;
          --sunny: #FFC53D;
          --coral: #FF6B6B;
          --mint: #4ECDC4;
          font-family: 'Nunito', ui-rounded, sans-serif;
          color: var(--ink);
          background:
            radial-gradient(circle at 12% 8%, #BFE3F7 0%, transparent 42%),
            radial-gradient(circle at 88% 92%, #C6EFE9 0%, transparent 40%),
            radial-gradient(circle at 78% 12%, #FFEFC2 0%, transparent 30%),
            #F4FAFF;
        }
        .gv-page h1, .gv-title { font-family: 'Baloo 2', 'Nunito', sans-serif; }

        .gv-card {
          background: #fff;
          border: 3px solid var(--ink);
          border-radius: 44px;
          box-shadow: 0 8px 0 0 var(--ink), 0 24px 45px -18px rgba(20, 80, 140, .45);
          animation: gv-pop .5s cubic-bezier(.34,1.56,.64,1) both;
        }
        .gv-sticker {
          border: 2px solid var(--ink);
          border-radius: 16px;
          font-family: 'Baloo 2', sans-serif;
          font-weight: 800;
          box-shadow: 0 3px 0 0 var(--ink);
        }
        .gv-label {
          font-family: 'Baloo 2', sans-serif;
          font-weight: 700;
          font-size: 1rem;
          color: #14507F;
        }
        .gv-field {
          width: 100%;
          border: 3px solid var(--ink);
          border-radius: 18px;
          background: var(--sky);
          padding: .8rem 1rem;
          font-weight: 600;
          color: var(--ink);
          box-shadow: 0 3px 0 0 var(--ink);
          transition: box-shadow .12s ease, transform .12s ease;
        }
        .gv-field::placeholder { font-weight: 400; color: #5A7C99; }
        .gv-field:focus { outline: none; box-shadow: 0 3px 0 0 var(--ink), 0 0 0 4px rgba(36,150,237,.3); }
        select.gv-field { appearance: none; -webkit-appearance: none; padding-right: 2.8rem; }
        .gv-chev {
          position: absolute; right: .6rem; top: 50%; transform: translateY(-50%);
          width: 1.75rem; height: 1.75rem; display: flex; align-items: center; justify-content: center;
          border: 2px solid var(--ink); border-radius: 999px; background: var(--sunny);
          pointer-events: none;
        }
        .gv-press { transition: transform .12s ease, box-shadow .12s ease; }
        .gv-press:active { transform: translateY(5px); box-shadow: 0 1px 0 0 var(--ink); }
        .gv-upload {
          display: inline-flex; align-items: center; gap: .5rem; cursor: pointer;
          border: 3px dashed var(--ink); border-radius: 18px; background: rgba(255,197,61,.7);
          padding: .6rem 1rem; font-size: .75rem; font-weight: 800; color: var(--ink);
          box-shadow: 0 3px 0 0 var(--ink);
        }
        .gv-upload:hover { background: var(--sunny); }
        .gv-btn {
          display: flex; width: 100%; align-items: center; justify-content: center; gap: .5rem;
          border: 3px solid var(--ink); border-radius: 18px; color: #fff;
          font-family: 'Baloo 2', sans-serif; font-weight: 800; font-size: 1.15rem;
          padding: .9rem 1rem;
          background: linear-gradient(160deg, #5AA9E6 0%, var(--blue) 45%, var(--deep) 100%);
          box-shadow: 0 7px 0 0 #16457E, 0 18px 30px -14px rgba(29,99,237,.65);
        }
        .gv-btn:hover { filter: brightness(1.05); }
        .gv-btn:active { transform: translateY(6px); box-shadow: 0 1px 0 0 #16457E; }
        .gv-avatar {
          position: relative; width: 7rem; height: 7rem; border: 3px solid var(--ink);
          border-radius: 999px; overflow: hidden; background: #FFE9D6;
        }
        .gv-halo { position: absolute; inset: -.5rem; border: 2px solid var(--ink); border-radius: 999px; background: rgba(255,197,61,.7); }
        .gv-bubble { position: absolute; border: 2px solid var(--ink); border-radius: 999px; background: rgba(36,150,237,.25); }
        @keyframes gv-pop { 0% { transform: scale(.9) translateY(14px); opacity: 0 } 70% { transform: scale(1.02) translateY(-3px); opacity: 1 } 100% { transform: scale(1) translateY(0); opacity: 1 } }
        @keyframes gv-bob { 0%,100% { transform: translateY(0) rotate(-2deg) } 50% { transform: translateY(-10px) rotate(2deg) } }
        @keyframes gv-drift { 0%,100% { transform: translateY(0) translateX(0) } 50% { transform: translateY(-16px) translateX(8px) } }
        @keyframes gv-wiggle { 0%,100% { transform: rotate(-3deg) } 50% { transform: rotate(3deg) } }
        .gv-anim-bob { animation: gv-bob 4s ease-in-out infinite; }
        .gv-anim-drift { animation: gv-drift 7s ease-in-out infinite; }
        .gv-anim-wiggle { animation: gv-wiggle 2.4s ease-in-out infinite; }
      `}</style>

      {/* floating doodles */}
      <svg viewBox="0 0 120 70" className="gv-anim-drift absolute left-[6%] top-[12%] w-28" aria-hidden>
        <path d="M22 58c-11 0-19-8-19-17S12 25 22 25c2-11 12-19 24-19 13 0 24 9 26 21 3-3 8-5 13-5 11 0 19 8 19 18s-9 18-20 18H22z"
          fill="#fff" stroke="#0A2E4A" strokeWidth="3.5" strokeLinejoin="round" />
      </svg>
      <svg viewBox="0 0 120 70" className="gv-anim-drift absolute right-[8%] top-[26%] hidden w-24 md:block" aria-hidden>
        <path d="M22 58c-11 0-19-8-19-17S12 25 22 25c2-11 12-19 24-19 13 0 24 9 26 21 3-3 8-5 13-5 11 0 19 8 19 18s-9 18-20 18H22z"
          fill="#fff" stroke="#0A2E4A" strokeWidth="3.5" strokeLinejoin="round" />
      </svg>
      <svg viewBox="0 0 40 40" className="gv-anim-wiggle absolute left-[14%] top-[62%] w-8" aria-hidden>
        <path d="M20 2c2 8 4 12 12 18-8 6-10 10-12 18-2-8-4-12-12-18 8-6 10-10 12-18z" fill="#FFC53D" stroke="#0A2E4A" strokeWidth="2.5" strokeLinejoin="round" />
      </svg>
      <svg viewBox="0 0 40 40" className="gv-anim-wiggle absolute right-[16%] top-[14%] w-8" aria-hidden>
        <path d="M20 2c2 8 4 12 12 18-8 6-10 10-12 18-2-8-4-12-12-18 8-6 10-10 12-18z" fill="#4ECDC4" stroke="#0A2E4A" strokeWidth="2.5" strokeLinejoin="round" />
      </svg>
      <svg viewBox="0 0 40 40" className="gv-anim-wiggle absolute bottom-[10%] right-[24%] hidden w-8 md:block" aria-hidden>
        <path d="M20 2c2 8 4 12 12 18-8 6-10 10-12 18-2-8-4-12-12-18 8-6 10-10 12-18z" fill="#FF6B6B" stroke="#0A2E4A" strokeWidth="2.5" strokeLinejoin="round" />
      </svg>
      <span className="gv-bubble gv-anim-bob absolute left-[22%] top-[30%] h-6 w-6" aria-hidden />
      <span className="gv-bubble gv-anim-drift absolute bottom-[16%] left-[30%] h-11 w-11" aria-hidden />
      <span className="gv-bubble gv-anim-bob absolute bottom-[30%] right-[12%] h-8 w-8" aria-hidden />
      <span className="gv-bubble gv-anim-drift absolute right-[30%] top-[8%] h-4 w-4" aria-hidden />

      <div className="gv-card relative w-full max-w-xl p-7 sm:p-9">
        <div className="gv-sticker absolute -right-3 -top-4 -rotate-6 bg-[#FF6B6B] px-3 py-1.5 text-xs text-white">
          o prof que aprova!
        </div>

        {/* Avatar */}
        <div className="mb-5 flex justify-center">
          <div className="relative">
            <span className="gv-halo" aria-hidden />
            <div className="gv-avatar">
              <div className="relative h-full w-full">
               
              </div>
            </div>
            <span className="gv-sticker absolute -bottom-2 -right-6 rotate-6 bg-[#4ECDC4] px-2.5 py-1 text-xs text-[#0A2E4A]">
              oi!
            </span>
          </div>
        </div>

        <h1 className="gv-title text-center text-3xl font-extrabold">Gerar avaliações</h1>
        <svg viewBox="0 0 220 14" className="mx-auto mb-2 mt-1 w-48" aria-hidden>
          <path d="M4 9c18-8 34 6 52-1s34 6 52-1 34 6 52-1 34 6 52-1" fill="none" stroke="#2496ED" strokeWidth="5" strokeLinecap="round" />
        </svg>
        <p className="mb-7 text-center text-sm font-bold text-[#4A6B85]">
          Monte uma avaliação sob medida para sua turma.
        </p>

        <div className="space-y-5 text-sm">
          {/* Linha 1: Turma e Questões */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="gv-label">Para qual turma?</label>
              <div className="relative">
                <select className="gv-field">
                  <option>7º ano A</option>
                  <option>7º ano B</option>
                  <option>8º ano A</option>
                </select>
                <span className="gv-chev"><ChevronDown className="h-4 w-4 text-[#0A2E4A]" /></span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="gv-label">Questões</label>
              <div className="relative">
                <select className="gv-field">
                  <option>10 questões</option>
                  <option>15 questões</option>
                  <option>20 questões</option>
                </select>
                <span className="gv-chev"><ChevronDown className="h-4 w-4 text-[#0A2E4A]" /></span>
              </div>
            </div>
          </div>

          {/* Mesclar com Banco de questões */}
          <div className="space-y-2">
            <label className="gv-label">Mesclar com Banco de questões?</label>
            <div className="relative">
              <select className="gv-field">
                <option>Sim</option>
                <option>Não</option>
              </select>
              <span className="gv-chev"><ChevronDown className="h-4 w-4 text-[#0A2E4A]" /></span>
            </div>
          </div>

          {/* Quais conteúdos? */}
          <div className="space-y-2 pt-1">
            <label className="gv-label">Quais conteúdos?</label>
            <p className="text-xs font-bold text-[#4A6B85]">Selecione ou relate os conteúdos trabalhados.</p>
            <input
              type="text"
              placeholder="Adicionar ou descrever outro conteúdo..."
              className="gv-field text-xs"
            />
          </div>

          {/* Descrição mais detalhada */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <label className="gv-label">Descrição mais detalhada</label>
              <span className="text-xs font-extrabold text-[#4A6B85]">(opcional)</span>
            </div>
            <textarea rows={3} placeholder="Digite detalhes adicionais..." className="gv-field resize-none text-xs" />
          </div>

          {/* Conteúdos relacionados */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-[#0A2E4A] bg-[#2496ED]">
                <LinkIcon className="h-3.5 w-3.5 text-white" />
              </span>
              <label className="gv-label">Conteúdos relacionados</label>
              <span className="text-xs font-extrabold text-[#4A6B85]">(opcional)</span>
            </div>
            <p className="text-xs font-bold text-[#4A6B85]">
              Amplie as conexões com o que a turma já sabe ou envie arquivos de referência.
            </p>
            <label className="gv-upload gv-press">
              <Upload className="h-3.5 w-3.5" />
              <span>Enviar arquivos</span>
              <input type="file" className="hidden" multiple />
            </label>
          </div>

          {/* Botão */}
          <div className="pt-4">
            <button className="gv-btn gv-press">
              <Sparkles className="h-5 w-5" />
              Gerar avaliação
            </button>
          </div>

          <p className="flex items-center justify-center gap-1.5 pt-1 text-center text-xs font-extrabold text-[#4A6B85]">
            <Star className="h-3.5 w-3.5 fill-[#FFC53D] text-[#FFC53D]" />
            você pode ajustar tudo depois
          </p>
        </div>
      </div>
    </div>
  );
}