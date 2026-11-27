"use server";

import { GoogleGenAI, Schema, Type } from "@google/genai";
import Groq from "groq-sdk";
import { carregarDadosTurma } from "@/app/src/lib/dadosTurma";
import {
  calcularDificuldadesTurma,
  calcularEstatisticasAluno,
  DificuldadesTurma,
  EstatisticasAluno,
} from "@/app/src/lib/estatisticasAluno";
import { criarPromptInsightsAluno } from "@/app/src/lib/insightsPedagogicos";
import type { InsightsAluno } from "@/app/src/lib/insightsPedagogicos";
import { exigirSessao } from "@/app/src/lib/session";

export type ResultadoEstatisticasAluno = {
  ok?: boolean;
  erro?: string;
  turma?: { id: string; nome: string };
  aluno?: { id: number; nome: string; matricula: string };
  anosDisponiveis?: number[];
  estatisticas?: EstatisticasAluno;
};

export type ResultadoDificuldadesTurma = {
  ok?: boolean;
  erro?: string;
  dificuldades?: DificuldadesTurma;
};

const insightsSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    resumo: { type: Type.STRING },
    conteudosParaRetomar: { type: Type.ARRAY, items: { type: Type.STRING } },
    recomendacoesDeEstudo: { type: Type.ARRAY, items: { type: Type.STRING } },
    proximaPratica: { type: Type.STRING },
  },
  required: ["resumo", "conteudosParaRetomar", "recomendacoesDeEstudo", "proximaPratica"],
};

function validarPeriodo(ano: number, bimestre: number | null): boolean {
  return Number.isInteger(ano) && ano >= 2000 && ano <= 9999 &&
    (bimestre === null || [1, 2, 3, 4].includes(bimestre));
}

function validarInsights(dados: unknown): InsightsAluno | null {
  if (!dados || typeof dados !== "object") return null;
  const insights = dados as Partial<InsightsAluno>;
  if (
    typeof insights.resumo !== "string" ||
    !Array.isArray(insights.conteudosParaRetomar) ||
    !insights.conteudosParaRetomar.every((item) => typeof item === "string") ||
    !Array.isArray(insights.recomendacoesDeEstudo) ||
    !insights.recomendacoesDeEstudo.every((item) => typeof item === "string") ||
    typeof insights.proximaPratica !== "string"
  ) return null;
  return insights as InsightsAluno;
}

function interpretarInsights(texto: string): InsightsAluno | null {
  try {
    return validarInsights(JSON.parse(texto));
  } catch {
    return null;
  }
}

export async function obterEstatisticasDoAluno(
  turmaId: string,
  alunoId: number,
  ano: number,
  bimestre: number | null
): Promise<ResultadoEstatisticasAluno> {
  try {
    const sessao = await exigirSessao("professor");
    if (!turmaId.trim() || !Number.isInteger(alunoId) || alunoId < 1) {
      return { erro: "Aluno ou turma inválidos." };
    }
    if (!validarPeriodo(ano, bimestre)) return { erro: "Período letivo inválido." };

    const dados = await carregarDadosTurma(Number(sessao.id), turmaId, ano, bimestre);
    if (!dados) return { erro: "Turma não encontrada ou acesso não autorizado." };
    const aluno = dados.alunos.find((item) => item.id === alunoId);
    if (!aluno) return { erro: "Aluno não encontrado nesta turma." };

    const estatisticas = calcularEstatisticasAluno(alunoId, dados.alunos, dados.avaliacoes, dados.respostas);
    if (!estatisticas) return { erro: "Não foi possível calcular as estatísticas do aluno." };

    return {
      ok: true,
      turma: dados.turma,
      aluno: { id: aluno.id, nome: aluno.nome, matricula: aluno.matricula },
      anosDisponiveis: dados.anosDisponiveis,
      estatisticas,
    };
  } catch (erro) {
    console.error("Erro ao obter estatísticas do aluno:", erro);
    return { erro: "Não foi possível carregar as estatísticas do aluno." };
  }
}

export async function obterDificuldadesDaTurma(
  turmaId: string,
  ano: number,
  bimestre: number | null
): Promise<ResultadoDificuldadesTurma> {
  try {
    const sessao = await exigirSessao("professor");
    if (!turmaId.trim()) return { erro: "Turma inválida." };
    if (!validarPeriodo(ano, bimestre)) return { erro: "Período letivo inválido." };

    const dados = await carregarDadosTurma(Number(sessao.id), turmaId, ano, bimestre);
    if (!dados) return { erro: "Turma não encontrada ou acesso não autorizado." };
    return {
      ok: true,
      dificuldades: calcularDificuldadesTurma(dados.alunos, dados.avaliacoes, dados.respostas),
    };
  } catch (erro) {
    console.error("Erro ao obter dificuldades da turma:", erro);
    return { erro: "Não foi possível carregar as dificuldades da turma." };
  }
}

export async function gerarInsightsAluno(
  turmaId: string,
  alunoId: number,
  ano: number,
  bimestre: number | null
): Promise<{ ok?: boolean; erro?: string; insights?: InsightsAluno }> {
  try {
    const sessao = await exigirSessao("professor");
    if (!turmaId.trim() || !Number.isInteger(alunoId) || alunoId < 1) {
      return { erro: "Aluno ou turma inválidos." };
    }
    if (!validarPeriodo(ano, bimestre)) return { erro: "Período letivo inválido." };

    const dados = await carregarDadosTurma(Number(sessao.id), turmaId, ano, bimestre);
    if (!dados) return { erro: "Turma não encontrada ou acesso não autorizado." };
    if (!dados.alunos.some((aluno) => aluno.id === alunoId)) {
      return { erro: "Aluno não encontrado nesta turma." };
    }

    const estatisticas = calcularEstatisticasAluno(alunoId, dados.alunos, dados.avaliacoes, dados.respostas);
    if (!estatisticas || estatisticas.totalCampos === 0 || estatisticas.totalRespondidas === 0) {
      return { erro: "Ainda não há respostas suficientes para gerar insights." };
    }

    const prompt = criarPromptInsightsAluno(estatisticas);
    let insights: InsightsAluno | null = null;
    let ultimoErro: unknown = null;
    const apiKeyGemini = process.env.GEMINI_API_KEY;

    if (apiKeyGemini) {
      const ia = new GoogleGenAI({ apiKey: apiKeyGemini });
      for (const modelo of ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"]) {
        try {
          const resposta = await ia.models.generateContent({
            model: modelo,
            contents: prompt,
            config: { responseMimeType: "application/json", responseSchema: insightsSchema, temperature: 0.4 },
          });
          if (resposta.text) insights = interpretarInsights(resposta.text);
          if (insights) break;
          ultimoErro = new Error("O Gemini retornou um formato de insight inválido.");
        } catch (erroGemini) {
          ultimoErro = erroGemini;
          console.warn(`Gemini ${modelo} indisponível para gerar insights; tentando o próximo modelo.`);
        }
      }
    }

    if (!insights && process.env.GROQ_API_KEY) {
      try {
        const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
        const resposta = await groq.chat.completions.create({
          model: "llama-3.3-70b-versatile",
          messages: [
            {
              role: "system",
              content: 'Responda apenas com JSON válido, sem markdown, no formato {"resumo":"...","conteudosParaRetomar":["..."],"recomendacoesDeEstudo":["..."],"proximaPratica":"..."}.',
            },
            { role: "user", content: prompt },
          ],
          temperature: 0.4,
          max_tokens: 700,
        });
        const texto = resposta.choices[0]?.message?.content;
        if (typeof texto === "string") insights = interpretarInsights(texto);
      } catch (erroGroq) {
        ultimoErro = erroGroq;
        console.error("Groq também falhou ao gerar insights:", erroGroq);
      }
    }

    if (!insights) {
      console.error("Nenhum provedor de IA conseguiu gerar insights:", ultimoErro);
      return {
        erro: process.env.GEMINI_API_KEY || process.env.GROQ_API_KEY
          ? "A IA está temporariamente indisponível. Tente novamente mais tarde."
          : "Configure GEMINI_API_KEY ou GROQ_API_KEY para habilitar os insights por IA.",
      };
    }
    return { ok: true, insights };
  } catch (erro) {
    console.error("Erro ao gerar insights do aluno:", erro);
    return { erro: "Não foi possível gerar os insights agora. Tente novamente." };
  }
}