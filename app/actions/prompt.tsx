'use server'
import { GoogleGenAI, Type, Schema } from '@google/genai';
import { Avaliacoes } from '../src/types/index';
import { pool } from '../src/db';

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

export async function gerarAvaliacao(
  conteudos_principais: string,
  conteudos_detalhados: string,
  quantidadeQuestoes: number
): Promise<Avaliacoes | null> {
  try {
    const prompt = `Procure a fundo questões de vestibulinhos para jovens do Ensino Fundamental II, como Etec e afins para elaborar questões dos seguintes conteúdos: ${conteudos_principais}, no qual deve se atentar a: 
    ${conteudos_detalhados}. Forneça um enunciado bem elaborado e contextualizado, sempre tendo como base os vestibulinhos e vestibulares. 
    Um total de ${quantidadeQuestoes} questões.

Regras importantes: 
- Deve gerar exatamente ${quantidadeQuestoes} questões dentro do array "questoes".
- Os campos de validação devem ser claros e objetivos, permitindo que o usuário compreenda facilmente o que é esperado como resposta.
- O mapeamento de erros deve ser útil para identificar possíveis lacunas de aprendizagem do estudante, fornecendo informações relevantes para o professor de forma simples e direta, sem entrar em detalhes complexos. Exemplo de "erroProvavel": "Raiz Quadrada", "Potenciação" ou "Sinais Matemáticos".
- Seja certeiro nos ids dos campos de validação, garantindo que cada um seja único e facilmente identificável.
- Seja certeiro nos ids de mapeamento de erros, garantindo que cada um referencie um id de campo de validação existente.
- Deve-se ter no mínimo 2 campos de validação por questão, mas podem ser mais.
`;

    const interacao = await ia.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: avaliacaoSchema,
        temperature: 0.7
      }
    });

    if (!interacao.text) return null;

    const conteudo = JSON.parse(interacao.text);

    // Serializa o JSON explicitamente para evitar erro de sintaxe no pg
    const { rows } = await pool.query(
      `INSERT INTO avaliacoes (conteudo) 
       VALUES ($1::jsonb) 
       RETURNING id`,
      [JSON.stringify(conteudo)]
    );

    const dbAvaliacaoId = rows[0].id;

    const dadosAvaliacao: Avaliacoes = {
      id: String(dbAvaliacaoId),
      questoes: conteudo.questoes
    };

    return dadosAvaliacao;

  } catch (error) {
    console.error("Erro ao gerar avaliação:", error);
    return null;
  }
}