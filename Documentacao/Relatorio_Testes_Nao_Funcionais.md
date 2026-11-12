# labMU — Testes não funcionais: carga, stress, segurança e smoke

**Data:** 12/11/2026
**Ordem executada:** Loading → Stress → Security → correções → Smoke.
**Onde:** carga e stress **localmente** (build de produção do backend, `NODE_ENV=production`, em uma máquina de 12 núcleos). Segurança **local** nesta rodada, porque as URLs online não responderam (ver seção 5).

Scripts usados estão em `Implementacao/testes-nao-funcionais/` (com README de execução).

---

## 1. Resumo

| Área | Antes | Depois |
|---|---|---|
| Carga (50 usuários simultâneos, mix de endpoints) | 133 req/s, p95 747 ms, p99 1,06 s | **506 req/s, p95 219 ms, p99 339 ms** |
| Carga (100 usuários simultâneos) | 119 req/s, p95 1,06 s, **p99 15 s** | **479 req/s, p95 431 ms, p99 867 ms** |
| Stress: ponto de quebra (p95 > 3 s ou erro > 5%) | **400 usuários** (p95 5,2 s) | **não atingido até 800** (p95 2,7 s, 0% erro) |
| Segurança local (23 checagens técnicas) | 20 OK / 4 falhas | **23 OK** |
| Segurança local (autorização e sessão) | — | **10 OK** + 1 informativa |
| Dependências do backend (`npm audit`) | 1 alta + 1 moderada | **0** |
| Testes automatizados do backend | — | **46** (inclui 1 novo teste de migração de senha) |
| Testes automatizados do frontend | 35 | 36 |
| Playwright (interface + API) | 27 (1 teste marcado como "falha esperada") | **27 passam, sem falha esperada** |
| Smoke do build de produção | — | **23/23 checagens** |

**Problemas encontrados e corrigidos:** o bcrypt síncrono travava o servidor; cada escrita fazia fsync bloqueante; dashboard e relatórios faziam varredura completa sem índice; relatórios e listas devolviam o banco inteiro (7 MB em um único relatório); a lista de usuários carregava todos os registros; o botão "Encerrar Sessão" não revogava o token no servidor; atrás do proxy do Render, todos os clientes compartilhavam o mesmo limite de tentativas de login (o administrador podia ficar bloqueado); cabeçalhos de segurança ausentes; payload grande virava 500; dependências com vulnerabilidades.

**Pendências:** os deploys online estavam fora do ar, então a segurança online não foi executada; a atualização do `react-router-dom` para a versão 7 é uma mudança de API e não foi feita; decisões de produto (técnico ver a lista de usuários) continuam em aberto.

---

## 2. Ambiente e metodologia

- Backend em `dist/` (build de produção), SQLite em modo WAL, banco de teste com dados de base (6 máquinas, 4 insumos, 20 equipamentos).
- **Carga:** cada usuário virtual executa, em loop, um mix de requisições: `GET /machines` (25%), `/supplies` (20%), `/equipment` (15%), `/dashboard/summary` (10%), `/reports/production` (5%), `/users` (5%), `POST /productions` (10%) e `POST /auth/login` (5%). Duração de 30 s por estágio.
- **Stress:** degraus de 10, 25, 50, 100, 200, 400 e 800 usuários, 15 s cada; para ao passar de 5% de erro ou p95 de 3 s. Depois, mede `/api/health` a cada segundo para ver a recuperação.
- **Limites do método:** o gerador de carga roda na mesma máquina e em um único processo Node; com 800 usuários ele também consome CPU. Os números são comparativos entre antes e depois, não uma medição de capacidade de produção.
- **Volume de dados:** a medição inicial foi feita com poucas centenas de produções; a final, com **22.667 produções**. A comparação é, portanto, desfavorável ao resultado final, que foi medido com mais dados.

---

## 3. Loading test

### 3.1 Resultados

| Usuários | Antes: req/s | Antes: p50 / p95 / p99 | Depois: req/s | Depois: p50 / p95 / p99 |
|---|---|---|---|---|
| 10 | 126 | 33 / 249 / 356 ms | 465 | 8 / 82 / 132 ms |
| 50 | 133 | 336 / 747 / 1058 ms | 506 | 85 / 219 / 339 ms |
| 100 | 119 | 523 / 1058 / **15010 ms** | 479 | 174 / 431 / 867 ms |

Erros 5xx e de rede: 0 em todos os estágios, antes e depois.

### 3.2 Diagnóstico

Medições isoladas mostraram o que limitava o sistema:

| Medição | Resultado | Conclusão |
|---|---|---|
| Login, 1 cliente | p50 113 ms | o bcrypt (`bcryptjs`, JavaScript puro) **bloqueava o event loop** |
| Sem login, mix de 50 usuários | 392 req/s | o login sozinho derrubava o throughput em ~3× |
| Escrita, 1 cliente | 105 req/s (8 ms por escrita) | cada commit do SQLite fazia **fsync síncrono** |
| Escrita, 50 clientes | 152 req/s | as escritas ficavam em fila atrás do fsync |
| `/api/health` (sem banco), 50 clientes | 8.465 req/s | a pilha HTTP não era o gargalo |
| `/dashboard/summary`, 50 clientes | 96 req/s | `ORDER BY created_at` sem índice: varredura completa e sort |
| `/reports/production` (sem filtro) | 7,2 MB em 120 ms | relatório devolvia **todas** as linhas e bloqueava o servidor |

---

## 4. Stress test

### 4.1 Resultados

| Usuários | Antes: req/s | Antes: p95 | Depois: req/s | Depois: p95 | Depois: p99 |
|---|---|---|---|---|---|
| 10 | 126 | 250 ms | 513 | 75 ms | 125 ms |
| 25 | 104 | 515 ms | 515 | 128 ms | 198 ms |
| 50 | 117 | 765 ms | 500 | 212 ms | 331 ms |
| 100 | 107 | 1506 ms | 468 | 395 ms | 634 ms |
| 200 | 111 | 2927 ms | 427 | 805 ms | 1161 ms |
| 400 | 114 | **5166 ms** (ponto de quebra) | 478 | 1237 ms | 1683 ms |
| 800 | — | — | 451 | 2736 ms | 4503 ms |

- **Antes:** o ponto de quebra foi atingido em 400 usuários (p95 acima de 3 s, com 0,09% de erro). O throughput ficou preso em ~110 req/s a partir de 10 usuários.
- **Depois:** o throughput se manteve entre 430 e 515 req/s do início ao fim da rampa, com 0% de erro até 800 usuários. O ponto de quebra por latência não foi atingido. A latência cresce de forma previsível, sem colapso.

### 4.2 Recuperação

Após a carga, `/api/health` respondeu com HTTP 200. Na rodada final, a primeira medição (1 s após a carga) levou 65 ms e as seguintes ficaram entre 3 e 6 ms. Não houve falha de processo nem erro HTTP. Não foi feita verificação de integridade completa dos dados sob carga; o saldo de estoque foi conferido apenas no smoke.

### 4.3 Memória

O processo terminou os testes com ~111 MB de RSS.

---

## 5. Security testing

### 5.1 Tentativa online (bloqueada)

- `https://labmu-api.onrender.com/api/health`: **sem resposta** após 120 s (duas tentativas, com intervalo).
- `https://labmu.vercel.app/`: **HTTP 404** com `DEPLOYMENT_NOT_FOUND`. O projeto da Vercel não tem deploy publicado; `/dashboard` também devolve 404.

Ou seja, não há versão do sistema online para testar neste momento. Os scripts estão prontos para rodar contra as URLs assim que os serviços voltarem (`BASE=https://labmu-api.onrender.com`, apenas `security-surface.mjs` e `security-rbac.mjs`). Vale verificar no painel do Render se o serviço está suspenso ou falhando no build, e na Vercel se o projeto aponta para a pasta `Implementacao/frontend/perfil_adm` e se tem deploy de produção.

### 5.2 Resultados locais

**`security-surface.mjs` (23 checagens técnicas):**

| Verificação | Antes | Depois |
|---|---|---|
| Cabeçalho `X-Powered-By` ausente | ❌ `Express` exposto | ✅ |
| `X-Content-Type-Options: nosniff` | ❌ ausente | ✅ |
| Payload de 2 MB recusado | ❌ 500 | ✅ 413 |
| Sem token em 5 rotas protegidas → 401 | ✅ | ✅ |
| Token forjado (alg=none, segredo de desenvolvimento, assinatura errada) → 401 | ✅ | ✅ |
| Limite de tentativas de login (429) | ✅ | ✅ |
| Recuperação não enumera contas | ✅ | ✅ |
| CORS não reflete origem estranha; preflight recusado | ✅ | ✅ |
| SQL injection em filtro, path traversal, JSON malformado, 404 sem detalhe | ✅ | ✅ |

**`security-rbac.mjs` (autorização e sessão, com técnico de teste):**

| Verificação | Resultado |
|---|---|
| Técnico não cria usuário, não altera perfil, não remove máquina, não ajusta estoque | ✅ 403 em todos |
| `PATCH /users/me` com `role: administrador` não escala privilégio | ✅ |
| Técnico não cancela produção de outro técnico | ✅ 403 |
| Logout revoga o token (`/auth/me` → 401 depois) | ✅ |
| Papel inválido → 400, sem detalhe interno | ✅ |
| Técnico lista todos os usuários (e-mail, matrícula, telefone) | ⚠️ permitido: **decisão de produto pendente** (seção 8) |

### 5.3 Dependências

| Pacote | Severidade | Situação |
|---|---|---|
| `body-parser` (backend) | alta | **corrigido** (`npm audit fix`, sem quebra de versão) |
| `qs` (backend) | moderada | **corrigido** (mesmo comando) |
| `react-router-dom` (frontend) | moderada | **pendente**: a correção exige a versão 7, que muda a API de roteamento |

---

## 6. Correções realizadas

| # | Problema | Causa | Correção | Evidência |
|---|---|---|---|---|
| 1 | Servidor travava sob logins concorrentes | `bcryptjs` síncrono e em JavaScript puro bloqueava o event loop (~113 ms por login) | Hash com **scrypt nativo** (roda em threads do libuv). Hashes bcrypt antigos continuam válidos e são regravados em scrypt no primeiro login bem-sucedido | Login 1 cliente: p50 68 ms; teste `S9` de migração |
| 2 | Escritas lentas e bloqueantes | Cada commit do SQLite fazia fsync síncrono | `journal_mode=WAL`, `synchronous=NORMAL`, `busy_timeout=5000` | Escrita 50 clientes: 152 → 1005 req/s |
| 3 | Dashboard e relatórios lentos | `ORDER BY created_at` sem índice (varredura completa e sort) | Índices em `productions(created_at)`, `maintenances(date)`, `loans(checkout_date)`, `stock_movements(created_at)` | Dashboard: 96 → 1100 req/s |
| 4 | Relatório devolvia o banco inteiro | `/reports/production` sem limite; métricas calculadas em JavaScript sobre todas as linhas | Métricas por agregação SQL; lista limitada a 500 registros (campos `truncated` e `recordsLimit`). Mesmo tratamento para empréstimos e manutenções | Relatório: 7,2 MB → ~500 registros; 21 → 55 req/s |
| 5 | Listas de produções e movimentos sem limite | `SELECT` sem `LIMIT` | Teto de 500 registros mais recentes | — |
| 6 | Lista de usuários carregava tudo na memória | Paginação feita em JavaScript | `COUNT(*)` e `LIMIT/OFFSET` no SQL; `limit` com teto de 200 | — |
| 7 | "Encerrar Sessão" não revogava o token | O front só limpava o `localStorage` (o próprio teste Playwright registrava como falha esperada) | `api.logout()` antes de `clearSession()`. Teste passou a ser normal | Playwright: 27/27 sem falha esperada |
| 8 | Admin bloqueado por tentativas de outros clientes | Sem `trust proxy`, todos os clientes aparecem com o IP do proxy do Render e compartilham o limite de 20 falhas/15 min | `TRUST_PROXY` (padrão **1 em produção**). Verificado com 25 falhas de contas diferentes: com `TRUST_PROXY=0` o admin recebe 429; com o padrão de produção, 200 | Comparação feita por script em duas execuções do servidor |
| 9 | Cabeçalhos ausentes e versão exposta | Não havia configuração | `X-Powered-By` desativado; `nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy`; HSTS em produção | `security-surface.mjs` 23/23 |
| 10 | Payload grande virava 500 | `errorHandler` não respeitava o status de erros do Express | Erros 4xx do Express preservam o status (413 com código `PAYLOAD_TOO_LARGE`) | `security-surface.mjs` I2 |
| 11 | Vulnerabilidades no backend | `body-parser` (alta) e `qs` (moderada) | `npm audit fix` | `npm audit`: 0 vulnerabilidades |

Ao corrigir o item 1, um detalhe da migração de respostas de segurança (que também usam hash) fez dois testes falharem; foi corrigido na mesma rodada, sem enfraquecer a verificação.

---

## 7. Smoke test

- **Playwright (`Implementacao/e2e`):** 27/27 passam, incluindo interface, autorização, estoque (com cancelamento), empréstimo, manutenção, bloqueio por tentativas, recuperação de senha e logout.
- **Smoke da API no build de produção (`smoke.mjs`):** 23/23. Percorre login do administrador, `auth/me`, criação de técnico, login do técnico, cadastro de máquina, entrada de estoque, produção com consumo (saldo 5 → 3,5 kg), cancelamento devolvendo o saldo, manutenção, retirada e segunda retirada recusada (409), devolução, os cinco relatórios, dashboard, lista paginada, permissão negada (403) e logout com revogação.
- **Testes unitários e de integração:** backend 46/46, frontend 36/36; `tsc` e `npm run build` passam nos dois.

---

## 8. Pendências e limitações

1. **Deploy online fora do ar** (Render sem resposta, Vercel sem deploy). Segurança online e smoke online não foram executados. Ação necessária no painel dos dois serviços.
2. **`react-router-dom` 7** para corrigir a vulnerabilidade moderada do frontend: exige migração de API. Não foi feita sem sua aprovação.
3. **Decisão de produto:** técnico continua vendo e-mail, matrícula e telefone de todos os usuários (`GET /users`). O documento de requisitos deixa essa decisão em aberto (pergunta 10); a recomendação é restringir a listagem a administradores.
4. **Lock file:** o lock do `main` já estava inconsistente com o `package.json` (raiz do lock em `^7.0.2`, pacote em `^5.8.0`), e `npm ci` falhava. A regeneração deste PR alinhou os dois: `npm ci` passa com o lock do PR e falha com o do `main`. Os binários `@typescript/*` removidos pertenciam ao TypeScript 7, que o projeto não usa.
5. **Escala:** o gargalo restante é a thread única do Node com SQLite síncrono. Para mais de ~500 req/s ou mais usuários simultâneos, a saída é separar leitura e escrita ou trocar de banco.
6. **Persistência no Render:** o SQLite continua no disco efêmero do plano gratuito (ver relatório anterior).
7. **Stress além de 800 usuários** não foi testado; o gerador de carga é limitado à máquina de teste.
8. Os testes de carga e stress são **locais**, como solicitado; nenhum teste de carga foi feito contra o ambiente online.

---

## 9. Arquivos alterados nesta rodada

- Backend: `src/app.ts`, `src/config/env.ts`, `src/database/connection.ts` (WAL), `src/database/schema.sql` (índices), `src/middlewares/errorHandler.ts`, `src/modules/auth/auth.controller.ts`, `src/modules/auth/auth.service.ts`, `src/modules/auth/passwords.ts` (novo), `src/modules/production/production.service.ts`, `src/modules/reports/reports.service.ts`, `src/modules/supplies/supplies.service.ts`, `src/modules/users/users.controller.ts`, `src/modules/users/users.service.ts`, `tests/api.test.ts`, `package.json` e `package-lock.json` (audit), `.gitignore` (arquivos `-wal` e `-shm`).
- Novos: `Implementacao/testes-nao-funcionais/` (scripts e README), este relatório.
