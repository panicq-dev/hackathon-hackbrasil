import type { EstatisticasAluno } from "./estatisticasAluno";

export type InsightsAluno = {
  resumo: string;
  conteudosParaRetomar: string[];
  recomendacoesDeEstudo: string[];
  proximaPratica: string;
};

export function criarPromptInsightsAluno(estatisticas: EstatisticasAluno): string {
  const dados = {
    conteudosComErros: estatisticas.causasRaiz.slice(0, 3).map((item) => ({
      conteudo: item.causaRaiz,
      ocorrencias: item.totalErros,
    })),
    questoesComErro: estatisticas.questoesCriticas.slice(0, 3).map((questao) => ({
      conteudo: questao.causaRaiz,
      enunciado: questao.enunciado.slice(0, 300),
      etapa: questao.campoLabel,
      respostaRegistrada: questao.respostaDada ?? "Em branco",
      respostaEsperada: questao.respostaEsperada,
    })),
    camposEmBranco: estatisticas.camposEmBranco,
    resultadosPorFormato: estatisticas.porTipoCampo.map((item) => ({
      formato: item.tipo,
      acertos: item.totalAcertos,
      campos: item.totalCampos,
    })),
  };

  return `Você é um orientador de aprendizagem. Use apenas as evidências individuais abaixo e priorize os conteúdos associados aos erros e às respostas em branco. Não compare o estudante com colegas, turma, médias ou rankings; não use rótulos de desempenho nem faça diagnósticos.

Baseie as recomendações, quando pertinentes aos dados, em práticas pedagógicas como recuperação ativa (tentar lembrar ou resolver sem consultar a resposta), prática espaçada, autoexplicação das etapas, exemplos resolvidos com retirada gradual de apoio e feedback focado no primeiro passo incorreto. Escolha somente as estratégias relacionadas às dificuldades observadas; não liste métodos genéricos.

Fale diretamente com o estudante em português brasileiro, com linguagem acolhedora e simples. Dê ações concretas de estudo para ele, nunca instruções ao professor, família ou escola. Não invente dificuldades ou conteúdos. Seja conciso: resumo em até 25 palavras, até 3 conteúdos, até 2 recomendações de uma frase e uma próxima prática de até 30 palavras. Se os dados não sustentarem um conteúdo específico, diga isso no resumo e retorne a lista de conteúdos vazia.

Responda somente com JSON válido neste formato: {"resumo":"...","conteudosParaRetomar":["..."],"recomendacoesDeEstudo":["..."],"proximaPratica":"..."}.

Evidências individuais (JSON):
${JSON.stringify(dados)}`;
}
