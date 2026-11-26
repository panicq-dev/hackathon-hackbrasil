'use server';

import { GoogleGenAI, Type, Schema } from '@google/genai';
import Groq from 'groq-sdk';
import { Avaliacoes, EstruturaQuestao } from '../src/types/index';
import { pool } from '../src/db';
import { obterSessao } from '../src/lib/session';
import { buscarQuestoesParaReaproveitar, publicarQuestaoComunidade } from './questoes';

const ia = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

// Inicialização sob demanda do Groq para evitar chamadas/instanciação desnecessárias na inicialização de módulos
let groqClient: Groq | null = null;
function obterClienteGroq(): Groq {
  if (!groqClient) {
    groqClient = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });
  }
  return groqClient;
}

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
    const turmaInformada = turmaId?.trim();
    if (turmaInformada) {
      const professorId = sessao?.perfil === 'professor' ? Number(sessao.id) : null;
      const turmaAtiva = professorId === null
        ? { rowCount: 0 }
        : await pool.query(
            `SELECT id
               FROM turmas
              WHERE id = $1 AND professor_id = $2 AND arquivada_em IS NULL
              LIMIT 1`,
            [turmaInformada, professorId]
          );
      if (turmaAtiva.rowCount === 0) {
        throw new Error("Turma não encontrada ou inativa.");
      }
    }

    // Guard: rejeita se conteúdo não for de Matemática
    const MATERIAS_PROIBIDAS = [
      'português', 'portugues', 'redação', 'redacao', 'história', 'historia',
      'geografia', 'biologia', 'química', 'quimica', 'física', 'fisica',
      'filosofia', 'sociologia', 'inglês', 'ingles', 'artes', 'literatura',
      'gramática', 'gramatica', 'sintaxe', 'morfologia', 'ciências', 'ciencias',
    ];
    const textoParaValidar = (conteudos_principais + ' ' + conteudos_detalhados).toLowerCase();
    const materiaProibida = MATERIAS_PROIBIDAS.find((m) => textoParaValidar.includes(m));
    if (materiaProibida) {
      console.warn(`[gerarAvaliacao] Conteúdo bloqueado: matéria proibida detectada (${materiaProibida})`);
      return null;
    }

    if (opcoes?.materiaTag) {
      const tagNorm = opcoes.materiaTag
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
      if (tagNorm !== 'matematica') {
        console.warn(`[gerarAvaliacao] Matéria bloqueada: ${opcoes.materiaTag}`);
        return null;
      }
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
      const prompt = `Você é um especialista em elaboração de questões de Matemática para vestibulares e concursos de ingresso ao Ensino Médio (ETEC, FUVEST, ENEM, VUNESP, FCC, Escola Técnica, entre outros).

Seu objetivo é criar EXCLUSIVAMENTE questões de MATEMÁTICA com alto nível de contextualização, raciocínio lógico e resolução por etapas, seguindo rigorosamente o estilo dos principais vestibulares brasileiros.

CONTEÚDOS A SEREM ABORDADOS: ${conteudos_principais}
DETALHAMENTO / FOCOS ESPECÍFICOS: ${conteudos_detalhados || 'Cobrir os conteúdos acima com profundidade e diversidade de abordagem.'}
QUANTIDADE DE QUESTÕES: ${qtdParaGerar}

REGRAS OBRIGATÓRIAS PARA CADA QUESTÃO:
1. O enunciado deve ser LONGO e bem contextualizado (mínimo 3 linhas), com situação-problema real (ex.: compra, construção, velocidade, economia, geometria aplicada, estatística do cotidiano).
2. Deve seguir o padrão de vestibulares como ETEC, FUVEST, ENEM: linguagem formal, dados numéricos precisos, figuras descritas por texto quando necessário.
3. Cada questão deve exigir MÚLTIPLAS ETAPAS de resolução (pelo menos 2 passos matemáticos distintos).
4. Os campos de validação devem representar CADA ETAPA intermediária e o resultado final. Exemplos de campos:
   - "Discriminante (Δ)", "Valor de x₁", "Valor de x₂", "Resultado final", "Equação montada", "Volume calculado (cm³)"
5. O mapeamentoDeErros deve indicar com precisão a lacuna de aprendizagem matemática associada a cada campo. Exemplos: "Cálculo de discriminante", "Regra de sinais na multiplicação", "Conversão de unidades de medida", "Interpretação de gráfico cartesiano".
6. JAMAIS gere questões de outras matérias (Português, História, Ciências, Física, etc.). Apenas Matemática pura.
7. Gere EXATAMENTE ${quantidadeQuestoes} questões no array "questoes".
8. Cada questão deve ter no MÍNIMO 3 campos de validação (etapas).
9. Os IDs dos campos de validação e mapeamento de erros devem ser únicos, sem espaços, em camelCase (ex.: "deltaBhaskara", "valorX1", "resultadoFinal").
10. O IDs do mapeamentoDeErros devem referenciar exatamente os IDs dos campos de validação correspondentes.

ESTILOS DE QUESTÃO PARA VARIAR (escolha diferentes para cada questão):
- Problema de aplicação com dados reais (porcentagem, juros simples/compostos, desconto)
- Geometria plana e espacial com medidas e cálculo de área/volume
- Álgebra com equação de 1º ou 2º grau em contexto
- Funções (afim, quadrática) com interpretação de gráfico descrito
- Probabilidade e estatística com dados de tabela descritos no enunciado
- Razão, proporção e regra de três em situação cotidiana

Lembre-se: questão estilo vestibular = enunciado rico + dados concretos + resolução em etapas + raciocínio aplicado.`;


      const MODELOS_GEMINI = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];
      let textoResposta: string | null = null;

      // Tenta cada modelo Gemini em cascata
      for (const modelo of MODELOS_GEMINI) {
        try {
          const interacao = await ia.models.generateContent({
            model: modelo,
            contents: prompt,
            config: {
              responseMimeType: 'application/json',
              responseSchema: avaliacaoSchema,
              temperature: 0.7
            }
          });
          if (interacao.text) {
            textoResposta = interacao.text;
          }
          break;
        } catch (erroGemini: unknown) {
          const detalheErro = erroGemini as {
            status?: number | string;
            httpStatus?: number | string;
            code?: number | string;
          };
          const status = detalheErro.status ?? detalheErro.httpStatus ?? detalheErro.code;
          const ehUltimoGemini = modelo === MODELOS_GEMINI[MODELOS_GEMINI.length - 1];
          if ((status === 503 || status === 429) && !ehUltimoGemini) {
            console.warn(`Gemini ${modelo} indisponivel (${status}), tentando proximo...`);
            continue;
          }
          // Todos os Gemini falharam — tenta Groq como fallback final
          console.warn(`Todos os modelos Gemini falharam, usando Groq como fallback...`);
          try {
            const clienteGroq = obterClienteGroq();
            const respostaGroq = await clienteGroq.chat.completions.create({
              model: 'llama-3.3-70b-versatile',
              messages: [
                {
                  role: 'system',
                  content: 'Você é um especialista em questões de Matemática para vestibulares brasileiros (ETEC, FUVEST, ENEM, VUNESP). Responda APENAS com JSON válido, sem markdown, sem blocos de código, sem explicações adicionais. Gere SOMENTE questões de Matemática com enunciados contextualizados no estilo vestibular.'
                },
                {
                  role: 'user',
                  content: `${prompt}\n\nResponda SOMENTE com um JSON no formato: {"questoes": [{"id": "string", "enunciado": "string", "camposValidacao": [{"id": "string", "label": "string", "tipo": "texto|numero|alternativa", "respostaCorreta": "string"}], "mapeamentoDeErros": [{"id": "string", "erroProvavel": "string"}]}]}`
                }
              ],
              temperature: 0.7,
              max_tokens: 4096,
            });
            const conteudoGroq = respostaGroq.choices[0]?.message?.content ?? null;
            if (conteudoGroq) {
              textoResposta = conteudoGroq;
            }
          } catch (erroGroq) {
            console.error('Groq tambem falhou:', erroGroq);
            throw erroGroq;
          }
        }
      }

      if (textoResposta) {
        const conteudo = JSON.parse(textoResposta);
        novasQuestoes = conteudo.questoes || [];

        // 3. Se optou por publicar novas na comunidade, persiste cada uma no database (sempre como Matemática)
        if (opcoes?.publicarNovasQuestoes && novasQuestoes.length > 0) {
          for (const q of novasQuestoes) {
            const pub = await publicarQuestaoComunidade(q, 'Matemática');
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
    const turmaIdFinal = turmaInformada || null;

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
