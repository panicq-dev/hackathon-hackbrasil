'use server'
import { GoogleGenAI } from '@google/genai';

const ia = new GoogleGenAI({
  apiKey: process.env.GOOGLE_API_KEY,
});


export async function gerarAvaliacao(conteudos_principais: string, conteudos_detalhados: string) {
    let prompt = 
    `Procure a fundo questões de vestibulinhos para jovens do Ensino Fundamental II, como Etec e afins para elaborar questões dos 
    seguintes conteúdos: ${conteudos_principais}, no qual deve se atentar a: ${conteudos_detalhados}.Forneça um enunciado bem elaborado e
    contextualizado, sempre tendo como base os vestibulinhos e vestibulares.
    
    Além do enunciado da questão, retorne estritamente em formato JSON válido (sem bolocos de código em markdown em volta, apenas o JSON puro)
    com a seguinte estrutura:
    {
    "enunciado": "Aqui vai o enunciado da questão, completo e contextualizado",
    "camposValidacao": 
    [
        {
            "id": "identificador único do campo de validação",
            "label": "rótulo do campo de validação, como por exemplo 'Insira o valor de Delta' ou 'Qual a resposta final da equação?'",
            "tipo": "tipo do campo de validação (ex: 'texto', 'numero', 'alternativa')",
            "respostaCorreta": "resposta correta para validação do campo, que pode ser um valor numérico, uma string ou uma alternativa (ex: 'A', 'B', 'C', 'D')",
  
        }
    ],
    "mapeamentoDeErros": [
        {
            "id": "identificador (ID) de um campo de valiação já gerado em 'camposValidacao'",
            "erroProvavel": "possível erro associado ao campo de validação informado no 'id'. Então, se o ID está relacionado a um
            campo de validação que espera um valor delta de "6", e o usuário insere "5", então provavelmente o erro está associado a uma 
            dificuldade em potênciação ou sinais matemáticos nas equações. Então, esse "erroProvavel" deve ser apenas uma descrição básica
            e padrão do possível gap de aprendizagem do estudante, como por exemplo: "Raiz Quadrada" ou "Potenciação" ou "Sinais Matemáticos".
        }
    ],
    }
    
    Regras importantes: 
    - O JSON deve ser válido e não pode conter erros de sintaxe.
    - Os campos de validação devem ser claros e objetivos, permitindo que o usuário compreenda facilmente o que é esperado como resposta.
    - O mapeamento de erros deve ser útil para identificar possíveis lacunas de aprendizagem do estudante,
     fornecendo informações relevantes para o professor, porém de forma simples e direta, sem entrar em detalhes complexos. Um exemplo de "erroProvavel" seria "Raiz Quadrada" e apenas isso.
      Ou "Potenciação" e apenas isso. Ou "Sinais Matemáticos" e apenas isso.
    - Seja certeiro nos ids dos campos de validação, garantindo que cada um seja único e facilmente identificável.
    - Seja certeiro nos ids de mapeamento de erros, garantindo que cada um referencie um id de campo de validação existente.
    - Deve-se ter no mínimo 2 campos de validação, mas podem ser mais.`;

    const interacao = await ia.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            temperature: 0.7
        }
    });
    console.log(interacao.text);
}