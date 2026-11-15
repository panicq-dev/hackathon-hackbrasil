'use client';

import { AvaliacaoProps } from '@/app/src/types/index';



export default function Avaliacao({ questao = null }: AvaliacaoProps) {
  if (!questao) {
    return <div>Nenhuma questão encontrada...</div>;
  }

  return (

  );
}