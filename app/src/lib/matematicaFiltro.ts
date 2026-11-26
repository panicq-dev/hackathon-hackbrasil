import { EstruturaQuestao } from "@/app/src/types";
import { canonicalizarCausaRaiz, normalizarChaveCausaRaiz } from "./causasRaiz";

export const MATERIAS_PROIBIDAS = [
  "português",
  "portugues",
  "redação",
  "redacao",
  "história",
  "historia",
  "geografia",
  "biologia",
  "química",
  "quimica",
  "física",
  "fisica",
  "filosofia",
  "sociologia",
  "inglês",
  "ingles",
  "artes",
  "educação física",
  "literatura",
  "gramática",
  "gramatica",
  "sintaxe",
  "morfologia",
  "ciências",
  "ciencias",
  "humanas",
  "linguagens",
  "natureza",
] as const;

export function detectarMateriaProibida(texto: string): string | null {
  const lower = texto.toLowerCase();
  return MATERIAS_PROIBIDAS.find((palavra) => lower.includes(palavra)) ?? null;
}

export function ehConteudoMatematica(texto: string): boolean {
  return detectarMateriaProibida(texto) === null;
}

export function ehTagMatematica(tag?: string): boolean {
  if (!tag) return true;
  const normalizada = tag
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  return normalizada === "matematica";
}

export function normalizarQuestoesGeradas(questoes: EstruturaQuestao[]): EstruturaQuestao[] {
  const rotulosUnificados = new Map<string, string>();

  return questoes.map((questao, qIdx) => {
    const campos = (Array.isArray(questao.camposValidacao) ? questao.camposValidacao : []).map(
      (campo, cIdx) => ({
        ...campo,
        id: campo.id?.trim() || `q${qIdx + 1}Campo${cIdx + 1}`,
      })
    );

    const idsCampos = new Set(campos.map((c) => c.id));
    const mapaPorCampo = new Map<string, string>();

    for (const item of questao.mapeamentoDeErros ?? []) {
      const id = item.id?.trim();
      if (!id || !idsCampos.has(id)) continue;

      const canonica = canonicalizarCausaRaiz(item.erroProvavel ?? "");
      const chave = normalizarChaveCausaRaiz(canonica) || canonica.toLowerCase();
      if (!rotulosUnificados.has(chave)) {
        rotulosUnificados.set(chave, canonica);
      }
      mapaPorCampo.set(id, rotulosUnificados.get(chave) ?? canonica);
    }

    const mapeamentoValidado = campos.map((campo) => ({
      id: campo.id,
      erroProvavel: mapaPorCampo.get(campo.id) ?? "Interpretação de Enunciado",
    }));

    return {
      ...questao,
      camposValidacao: campos,
      mapeamentoDeErros: mapeamentoValidado,
    };
  });
}
