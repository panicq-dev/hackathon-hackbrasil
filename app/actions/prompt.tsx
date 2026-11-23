'use server';

import { GoogleGenAI, Type, Schema } from '@google/genai';
import { Avaliacoes, EstruturaQuestao } from '../src/types/index';
import { pool } from '../src/db';
import { obterSessao } from '../src/lib/session';
import { buscarQuestoesParaReaproveitar, publicarQuestaoComunidade } from './questoes';

const ia = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const avaliacaoSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    questoes: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          enunciado: { type: Type.STRING },
          camposValidacao: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                label: { type: Type.STRING },
                tipo: { type: Type.STRING, enum: ['texto', 'numero', 'alternativa'] },
                respostaCorreta: { type: Type.STRING }
              },
              required: ['id', 'label', 'tipo', 'respostaCorreta']
            }
          },
          mapeamentoDeErros: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                erroProvavel: { type: Type.STRING }
              },
              required: ['id', 'erroProvavel']
            }
          }
        },
        required: ['id', 'enunciado', 'camposValidacao', 'mapeamentoDeErros']
      }
    }
  },
  required: ['questoes']
};

export interface GerarAvaliacaoResultado extends Avaliacoes {
  reaproveitadasDoBanco?: number;
  geradasPorIa?: number;
  tokensEconomizadosPercentual?: number;
}

export async function gerarAvaliacao(
  conteudos_principais: string,
  conteudos_detalhados: string,
  quantidadeQuestoes: number,
  turmaId?: string,
  opcoes?: {
    usarBancoComunidade?: boolean;
    publicarNovasQuestoes?: boolean;
    materiaTag?: string;
  }
): Promise<GerarAvaliacaoResultado | null> {
  try {
    const sessao = await obterSessao();
    if (sessao && sessao.perfil !== 'professor') {
      throw new Error("Apenas professores podem gerar avaliações.");
    }

    const usarBanco = opcoes?.usarBancoComunidade ?? true;
    let questoesDoBanco: EstruturaQuestao[] = [];

    // 1. Tenta reaproveitar questões da comunidade se solicitado
    if (usarBanco) {
      questoesDoBanco = await buscarQuestoesParaReaproveitar(
        conteudos_principais,
        quantidadeQuestoes
      );
    }

    const qtdReaproveitada = questoesDoBanco.length;
    const qtdParaGerar = Math.max(0, quantidadeQuestoes - qtdReaproveitada);
    let novasQuestoes: EstruturaQuestao[] = [];

    // 2. Se ainda faltam questões, chama o modelo Gemini IA para gerar o restante
    if (qtdParaGerar > 0) {
      const prompt = `Procure a fundo questões de vestibulinhos para jovens do Ensino Fundamental II, como Etec e afins para elaborar questões dos seguintes conteúdos: ${conteudos_principais}, no qual deve se atentar a: 
      ${conteudos_detalhados}. Forneça um enunciado bem elaborado e contextualizado, sempre tendo como base os vestibulinhos e vestibulares. 
      Um total de ${qtdParaGerar} questões.

Regras importantes: 
- Deve gerar exatamente ${qtdParaGerar} questões dentro do array "questoes".
- Os campos de validação devem ser claros e objetivos, permitindo que o usuário compreenda facilmente o que é esperado como resposta.
- O mapeamento de erros deve ser útil para identificar possíveis lacunas de aprendizagem do estudante, fornecendo informações relevantes para o professor de forma simples e direta, sem entrar em detalhes complexos. Exemplo de "erroProvavel": "Raiz Quadrada", "Potenciação" ou "Sinais Matemáticos".
- Seja certeiro nos ids dos campos de validação, garantindo que cada um seja único e facilmente identificável.
- Seja certeiro nos ids de mapeamento de erros, garantindo que cada um referencie um id de campo de validação existente.
- Deve-se ter no mínimo 2 campos de validação por questão, mas podem ser mais.
`;

      const MODELOS_FALLBACK = ['gemini-3.8-flash', 'gemini-3.7-flash', 'gemini-3.5-flash'];
      let interacao = null;
      for (const modelo of MODELOS_FALLBACK) {
        try {
          interacao = await ia.models.generateContent({
            model: modelo,
            contents: prompt,
            config: {
              responseMimeType: 'application/json',
              responseSchema: avaliacaoSchema,
              temperature: 0.7
            }
          });
          break;
        } catch (erroModelo: any) {
          const status = erroModelo?.status ?? erroModelo?.httpStatus ?? erroModelo?.code;
          const ehUltimoModelo = modelo === MODELOS_FALLBACK[MODELOS_FALLBACK.length - 1];
          if ((status === 503 || status === 429) && !ehUltimoModelo) {
            console.warn(`Modelo ${modelo} indisponivel (${status}), tentando proximo...`);
            continue;
          }
          throw erroModelo;
        }
      }

      if (interacao?.text) {
        const conteudo = JSON.parse(interacao.text);
        novasQuestoes = conteudo.questoes || [];

        // 3. Se optou por publicar novas na comunidade, persiste cada uma no database
        if (opcoes?.publicarNovasQuestoes && novasQuestoes.length > 0) {
          const tag = opcoes.materiaTag || conteudos_principais.split(/[,;]/)[0]?.trim() || 'Geral';
          for (const q of novasQuestoes) {
            const pub = await publicarQuestaoComunidade(q, tag);
            if (pub.sucesso && pub.questaoId) {
              q.bancoId = pub.questaoId;
              q.publicadaNaComunidade = true;
            }
          }
        }
      }
    }

    // Combina questões do banco com as geradas
    const questoesFinais: EstruturaQuestao[] = [...questoesDoBanco, ...novasQuestoes].slice(0, quantidadeQuestoes);

    if (questoesFinais.length === 0) {
      return null;
    }

    const professorId = sessao?.perfil === 'professor' ? Number(sessao.id) : null;
    const turmaIdFinal = turmaId && turmaId.trim() ? turmaId.trim() : null;

    const conteudoCompleto = { questoes: questoesFinais };

    // Serializa o JSON explicitamente para evitar erro de sintaxe no pg
    const { rows } = await pool.query(
      `INSERT INTO avaliacoes (conteudo, professor_id, turma_id) 
       VALUES ($1::jsonb, $2, $3) 
       RETURNING id`,
      [JSON.stringify(conteudoCompleto), professorId, turmaIdFinal]
    );

    const dbAvaliacaoId = rows[0].id;
    const tokensEconomizados = Math.round((qtdReaproveitada / quantidadeQuestoes) * 100);

    return {
      id: String(dbAvaliacaoId),
      questoes: questoesFinais,
      reaproveitadasDoBanco: qtdReaproveitada,
      geradasPorIa: novasQuestoes.length,
      tokensEconomizadosPercentual: tokensEconomizados,
    };

  } catch (error) {
    console.error("Erro ao gerar avaliação:", error);
    return null;
  }
}
