export const MINIMO_ERROS_CAUSA_RAIZ = 2;

export const CAUSAS_RAIZ_CANONICAS = [
  "Regra de Sinais",
  "Soma de Frações",
  "Multiplicação de Frações",
  "Divisão de Frações",
  "Operações com Decimais",
  "Razão e Proporção",
  "Regra de Três",
  "Porcentagem",
  "Juros Simples",
  "Juros Compostos",
  "Equação de 1º Grau",
  "Equação de 2º Grau",
  "Fórmula de Bhaskara",
  "Cálculo de Discriminante",
  "Sistema de Equações",
  "Função Afim",
  "Função Quadrática",
  "Interpretação de Gráfico",
  "Potenciação",
  "Radiciação",
  "Produtos Notáveis e Fatoração",
  "Teorema de Pitágoras",
  "Semelhança de Triângulos",
  "Área de Figuras Planas",
  "Perímetro",
  "Volume de Sólidos",
  "Conversão de Unidades",
  "Média e Estatística",
  "Probabilidade",
  "Análise Combinatória",
  "Interpretação de Enunciado",
] as const;

const PREPOSICOES_CONECTORES = new Set([
  "de",
  "da",
  "do",
  "das",
  "dos",
  "e",
  "em",
  "na",
  "no",
  "nas",
  "nos",
  "com",
  "para",
  "por",
]);

function singularizarToken(token: string): string {
  if (token.length <= 3) return token;
  if (token.endsWith("oes") || token.endsWith("aes")) {
    return `${token.slice(0, -3)}ao`;
  }
  if (token.endsWith("ais") && token.length > 4) {
    return `${token.slice(0, -3)}al`;
  }
  if (token.endsWith("eis") && token.length > 4) {
    return `${token.slice(0, -3)}el`;
  }
  if (token.endsWith("ois") && token.length > 4) {
    return `${token.slice(0, -3)}ol`;
  }
  if (token.endsWith("s") && !token.endsWith("ss") && !token.endsWith("us")) {
    return token.slice(0, -1);
  }
  return token;
}

export function normalizarChaveCausaRaiz(texto: string): string {
  const limpo = texto
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/(\d+)[º°o]\b/g, "$1")
    .replace(/[^a-z0-9\s]/g, " ");

  const tokens = limpo
    .split(/\s+/)
    .filter((token) => token.length > 0 && !PREPOSICOES_CONECTORES.has(token))
    .map(singularizarToken);

  return tokens.join(" ");
}

const MAPA_CANONICO = new Map<string, string>(
  CAUSAS_RAIZ_CANONICAS.map((causa) => [normalizarChaveCausaRaiz(causa), causa])
);

export function canonicalizarCausaRaiz(texto: string, fallback = "Conceito Geral"): string {
  const tratado = texto.trim();
  if (!tratado) return fallback;

  const chave = normalizarChaveCausaRaiz(tratado);
  if (!chave) return fallback;

  return MAPA_CANONICO.get(chave) ?? tratado;
}

export function agruparCausasRaiz(
  ocorrencias: Iterable<readonly [string, number]>,
  minimoErros: number = MINIMO_ERROS_CAUSA_RAIZ
): Array<{ causaRaiz: string; totalErros: number }> {
  const agrupado = new Map<string, { causaRaiz: string; totalErros: number; melhorContagem: number }>();

  for (const [bruto, quantidade] of ocorrencias) {
    if (quantidade <= 0) continue;
    const rotulo = canonicalizarCausaRaiz(bruto);
    const chave = normalizarChaveCausaRaiz(rotulo) || rotulo.toLowerCase();
    const existente = agrupado.get(chave);

    if (!existente) {
      agrupado.set(chave, {
        causaRaiz: rotulo,
        totalErros: quantidade,
        melhorContagem: quantidade,
      });
      continue;
    }

    existente.totalErros += quantidade;
    if (MAPA_CANONICO.has(chave) || quantidade > existente.melhorContagem) {
      existente.causaRaiz = MAPA_CANONICO.get(chave) ?? rotulo;
      existente.melhorContagem = quantidade;
    }
  }

  return Array.from(agrupado.values())
    .filter((item) => item.totalErros >= minimoErros)
    .map(({ causaRaiz, totalErros }) => ({ causaRaiz, totalErros }))
    .sort((a, b) => b.totalErros - a.totalErros || a.causaRaiz.localeCompare(b.causaRaiz, "pt-BR"));
}
