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
  id?: string;
  bancoId?: number;
  enunciado: string;
  camposValidacao: CampoValidacao[];
  mapeamentoDeErros: MapeamentoErro[];
  publicadaNaComunidade?: boolean;
}

export interface QuestaoComunidade {
  id: number;
  questao: EstruturaQuestao;
  materiaTag: string;
  professorNome: string;
  professorId: number;
  criadoEm: string;
  likesCount: number;
  dislikesCount: number;
  meuVoto: 'like' | 'dislike' | null;
  ehMinha: boolean;
}

// Avaliação
export interface AvaliacaoProps {
  avaliacao?: Avaliacoes | null;
}