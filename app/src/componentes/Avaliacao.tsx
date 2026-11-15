'use client';

import { AvaliacaoProps } from '@/app/src/types/index';



export default function Avaliacao({ questao = null }: AvaliacaoProps) {

    // Validando: existe mesmo alguma questão...?
  if (!questao) {
    return <div>Nenhuma questão encontrada...</div>;
  }

  // Mapeando quantidade de questões.
  const quantidadeQuestoes = questao.length;


  // Mapeando quantidade de campos de validação
    const quantidadeCampos = questao.camposValidacao.length;

  return (

  );
}