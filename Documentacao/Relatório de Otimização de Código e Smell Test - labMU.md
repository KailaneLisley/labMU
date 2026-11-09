# Relatório de Otimização de Código e Smell Test - labMU

Nov 9, 2026 · @Lucas

## Resumo executivo

A análise encontrou problemas de código morto, segurança e validação no backend e no frontend do labMU. Todos os itens de segurança e de código morto já têm correção em um dos três PRs abertos. Nenhum dos PRs foi mergeado ainda.

- **Código morto:** 17 módulos inalcançáveis no frontend, cópias antigas de páginas e componentes, removidos (PR #109).
- **Segurança:** login com senhas fixas no cliente, cadastro com senha em texto puro sem servidor e logout que não revogava o token (PR #111 e PR #109).
- **Validação:** resposta de segurança sem limite de tentativas e enums sem checagem explícita (PR #110).
- **Ainda aberto:** telas que usam dados locais em vez da API, uso de `any` e arquivos grandes.

## Escopo e método

A análise cobriu o backend (Express e SQLite, 43 módulos), o frontend (React e Vite, 54 arquivos) e a suíte e2e com Playwright.

- **Ferramentas:** `tsc` com `--noUnusedLocals` e `--noUnusedParameters`; grafo de imports a partir de `main.tsx` e `server.ts`, para achar módulos inalcançáveis; buscas por segredos, `any`, logs e exports.
- **Limitação:** o projeto não tem ESLint, então não houve medição de complexidade nem de duplicação.
- **Linha de base antes das correções:** backend 40/40, frontend 35/35 e e2e 27 passando, com 1 falha esperada (logout).
- **Depois das correções nos PRs:** backend 44/44 (PR #110), frontend 35/35 (PR #109 e #110) ou 36/36 (PR #111), e2e 27 passando nos três.

## Achados do smell test

São 13 achados: 10 já têm correção em PR, 2 estão abertos e 1 não precisa de ação.

| Categoria | Achado | Severidade | Situação |
| --- | --- | --- | --- |
| Código morto | 17 módulos inalcançáveis no frontend, cópias soltas em `pages/` e `components/` | Média | Removido (PR #109) |
| Código morto | 6 imports e 1 função não usados no `DashboardPage` | Baixa | Removido (PR #109) |
| Exports | `db`, `AuthenticatedUser` e `UserSession` exportados sem uso | Baixa | Removido (PR #109) |
| Dados | Mocks de `src/data/` são usados pelas telas | - | Sem ação: não são dados mortos |
| Segurança | Login aceita `Admin@123` e `Tecnico@123` quando o servidor está fora | Alta | Removido (PR #111) |
| Segurança | Cadastro offline grava a senha em texto puro no `localStorage` | Alta | Removido (PR #111) |
| Segurança | Recuperação offline revela se o e-mail existe e se é administrador | Média | Removido (PR #111) |
| Segurança | Seed imprime as senhas padrão no console | Média | Removido (PR #109) |
| Segurança | Botão Encerrar Sessão não revoga o token no servidor | Alta | Corrigido (PR #109) |
| Segurança | Resposta de segurança sem limite de tentativas | Média | Corrigido (PR #110) |
| Validação | Enums sem checagem explícita em 4 caminhos; erro de `CHECK` sem dizer o campo | Média | Corrigido (PR #110) |
| Qualidade | 43 usos de `any` no frontend e 19 no backend | Baixa | Aberto |
| Qualidade | `EditProfilePage.tsx` (598 linhas) e `MachinesPage.tsx` (572 linhas) | Baixa | Aberto |

## Correções nos PRs

Três PRs abertos contra a `main`, cada um em sua branch. Nenhum foi mergeado.

| PR | Branch | Conteúdo | Verificação | Estado |
| --- | --- | --- | --- | --- |
| #109 | `chore/limpeza-codigo` | Remoção de módulos mortos, logout que revoga o token, seed sem senhas e exports sem uso | Backend 40/40, frontend 35/35, e2e 27/27 | Aberto |
| #110 | `fix/seguranca-validacao` | Limite na resposta de segurança, validação de enums em 4 caminhos, campo no erro de `CHECK` | Backend 44/44, frontend 35/35, e2e 27 com 1 falha esperada | Aberto, com 1 achado da revisão |
| #111 | `fix/remover-fallback-offline` | Remoção do fallback offline de login, cadastro e recuperação | Frontend 36/36, e2e 27 com 1 falha esperada | Aberto |

O teste de logout só vira teste normal depois do merge do #109. Os PRs #110 e #111 não incluem essa correção. Conflitos entre os três não foram verificados.

## Pendências abertas

Em ordem de prioridade:

1. **Limite por IP atrás de proxy (PR #110).** O app não configura `trust proxy`, e no Render todos os clientes chegam com o IP do proxy. Vinte falhas de qualquer usuário em 15 minutos bloqueiam login e recuperação para todos. Precisa de ajuste em `app.ts` e de teste no ambiente de produção.
2. **Telas ainda sem API.** 11 das 14 telas usam dados locais (`data/` e `localStorage`). Cada tela conectada precisa de teste de dados vindos do servidor.
3. **Contrato entre frontend e backend.** As rotas e os parâmetros de `services/api.ts` não foram conferidos uma a uma. `getUsers` e `getMachines` enviam parâmetros que o backend pode ignorar.
4. **Timeout nas requisições.** `VITE_API_TIMEOUT` não é lido, então uma requisição pode ficar travada.
5. **Decisões do laboratório.** D1: técnico vê e-mail, matrícula e telefone de todos. D2: autoativação de técnico. Também falta definir quem acessa os relatórios.
6. **Regras de negócio.** R9: relatórios mensais não agrupam por mês, e o dashboard não tem período. C1: datas sem fuso. C2: listagens sem paginação, exceto `/users`.
7. **Qualidade.** 43 usos de `any` no frontend e 19 no backend. Arquivos grandes: `EditProfilePage.tsx` e `MachinesPage.tsx`.
8. **Testes.** Testes antigos dependem da ordem de execução (item F). A passada manual das 39 checagens de API não foi refeita. Falta incluir Firefox e rodar o e2e em CI.
9. **Documentação.** `Backend_Requisitos_e_Integracao.md` está desatualizado. Os READMEs citam as credenciais padrão sem avisar que não devem ir para produção.
10. **Inconsistências a conferir.** O relatório marca S6 e S8 como resolvidos, mas a ordem sugerida diz que S6 falta. O caminho de produção em `bootstrap.ts` (admin inicial) não foi verificado.

## Limitações e riscos

- **Sem ESLint.** A análise usou `tsc`, buscas com grep e um grafo de imports próprio. Complexidade e duplicação de código não foram medidas.
- **Testes de interface limitados.** Os testes de frontend rodam em jsdom. O e2e cobre 11 telas protegidas, mas não fluxos completos de cadastro de dados.
- **Carga e concorrência não testadas.** A garantia de saldo não negativo e de um empréstimo ativo não foi exercitada com requisições paralelas.
- **Limite de tentativas em memória.** Um reinício do servidor zera os contadores. Sem `trust proxy`, o limite por IP fica compartilhado (pendência 1).
- **Dados com data.** Contagens de `any` e tamanhos de arquivo foram tirados na branch `fix/deploy-render-vercel`, antes das correções. Podem ter mudado.
- **Severidades são avaliação da análise,** não saída de ferramenta. Podem ser reajustadas pela equipe.
- **Scripts de apoio** (grafo de imports e snapshots) ficaram fora do repositório, na pasta de trabalho da sessão.
