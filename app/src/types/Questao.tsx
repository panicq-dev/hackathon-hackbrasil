// src/types/questao.ts

export interface CampoValidacao {
  id: string;               
  label: string;            
  tipo: 'texto' | 'numero' | 'alternativa';
  respostaCorreta: string | number; 
}

export interface MapeamentoErro {
  id: string;               
  erroProvavel: string;     
}

export interface EstruturaQuestao {
  enunciado: string;
  camposValidacao: CampoValidacao[];
  mapeamentoDeErros: MapeamentoErro[];
}