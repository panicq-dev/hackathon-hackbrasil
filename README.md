# HackBrasil 2026

Repositório oficial da solução desenvolvida para o **Hack Brasil 2026**.

## Status do Projeto

> Em desenvolvimento ativo. Detalhes completos sobre a arquitetura, stack tecnológica e instruções de uso serão divulgados em breve.

## Sobre a Solução

Esta iniciativa faz parte da competição do Hack Brasil 2026. A documentação técnica detalhada, fluxos de funcionamento e guias de configuração estarão disponíveis nesta página à medida que o desenvolvimento avançar.

---

Feito com foco em inovação e engenharia de software.

## Testes

- `npm test`: executa a suíte Vitest.
- `npm run test:coverage`: gera cobertura V8 em `coverage/`.
- `npm run test:mutation`: executa Stryker com o runner do Vitest e análise `perTest`; o relatório HTML fica em `reports/mutation/`.

O escopo de mutação é intencionalmente delimitado a `app/src/lib/**/*.ts` (excluindo os próprios testes). Essa camada concentra regras e serviços com testes unitários isolados; as actions e integrações externas são exercitadas pela suíte Vitest e podem entrar no escopo de mutação quando tiverem testes focados suficientes. Os limites atuais do Stryker são 85% (alto), 70% (baixo) e 60% (falha).