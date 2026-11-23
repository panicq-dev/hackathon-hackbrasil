// Perfil
export type Perfil = 'professor' | 'aluno';

 // Questão
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

export interface Avaliacoes{
    id: string;
    questoes: EstruturaQuestao[];
}

export interface EstruturaQuestao {
  enunciado: string;
  camposValidacao: CampoValidacao[];
  mapeamentoDeErros: MapeamentoErro[];
}
// Avaliação
export interface AvaliacaoProps {
  avaliacao?: Avaliacoes | null;
}