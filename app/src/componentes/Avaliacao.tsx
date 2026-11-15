'use client';

import { AvaliacaoProps } from '@/app/src/types/index';

export default function Avaliacao({ avaliacao = null }: AvaliacaoProps) {
  if (!avaliacao || !avaliacao.questoes?.length) {
    return (
      <div className="rounded-[24px] border-[3px] border-[#0A2E4A] bg-[#EBF5FF] p-6 text-center text-sm font-bold text-[#4A6B85]">
        Nenhuma questão encontrada...
      </div>
    );
  }

  return (
    <div className="space-y-4 font-['Nunito'] text-[#0A2E4A]">
      <div className="flex items-center justify-between border-b-2 border-[#0A2E4A]/15 pb-3">
        <h2 className="font-['Baloo_2'] text-2xl font-extrabold">
          Avaliação #{avaliacao.id}
        </h2>
        <span className="rounded-xl border-2 border-[#0A2E4A] bg-[#4ECDC4] px-3 py-1 font-['Baloo_2'] text-xs font-extrabold shadow-[0_2px_0_0_#0A2E4A]">
          {avaliacao.questoes.length} questões
        </span>
      </div>

      {avaliacao.questoes.map((questao, index) => (
        <div
          key={index}
          className="rounded-[22px] border-[3px] border-[#0A2E4A] bg-[#F4FAFF] p-5 shadow-[0_4px_0_0_#0A2E4A]"
        >
          <h3 className="mb-3 font-['Baloo_2'] text-base font-extrabold text-[#14507F]">
            {index + 1}. {questao.enunciado}
          </h3>

          <div className="space-y-2.5">
            {questao.camposValidacao.map((campo) => (
              <div key={campo.id} className="space-y-1">
                <label className="block text-xs font-extrabold text-[#0A2E4A]">
                  {campo.label}
                </label>
                <input
                  type="text"
                  placeholder="Insira o valor aqui."
                  className="w-full rounded-[14px] border-2 border-[#0A2E4A] bg-white px-3.5 py-2 text-xs font-semibold text-[#0A2E4A] shadow-[0_2px_0_0_#0A2E4A] placeholder:font-normal placeholder:text-[#5A7C99] focus:outline-none focus:ring-4 focus:ring-[#2496ED]/30"
                />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}