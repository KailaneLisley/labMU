# labMU — Relatório consolidado de testes

**Data de referência:** 23/11/2026
**Código medido:** branch `main`, commit `cf59b3b`, exceto onde está indicado.
**Relatórios de origem:** `Relatorio_Testes_Automatizados.md`, `Relatorio_Playwright.md`, `Relatorio_Testes_Nao_Funcionais.md`, `Relatorio_de_Testes_labMU.md` e o relatório de migração (issue #118, PR #120).

---

## 1. Visão geral

O projeto tem quatro camadas de teste. Os números abaixo foram medidos nesta data, rodando cada suíte na `main` atual.

| Camada | Ferramenta | O que cobre | Testes | Resultado (23/11/2026) |
|---|---|---|---|---|
| Backend: unidade e integração | `node:test` + `tsx`, chamadas HTTP ao app | Regras de negócio, permissões, segurança, validação, relatórios | **47** (45 em `api.test.ts` + 2 em `errorHandler.test.ts`) | **47/47 passam** |
| Frontend: componentes e serviços | Vitest + Testing Library + jsdom | Cliente de API, sessão, login, cadastro, recuperação de senha, permissões | **41** em 6 arquivos | **41/41 passam** |
| Ponta a ponta | Playwright 1.47.2 + Chromium | Fluxos completos entre tela, API e banco real | **32** em 5 arquivos | **32/32 passam** |
| Não funcionais | Scripts Node (`Implementacao/testes-nao-funcionais/`) | Carga, stress, smoke de produção e segurança | 3 de execução (carga, stress, smoke) + 2 de segurança | **Medido em 12/11/2026**, não reexecutado na `main` atual (ver seção 4) |

Verificações de tipo e build que foram rodadas nesta data:

- Backend: `tsc --noEmit` sem erros.
- Frontend: `tsc --noEmit` sem erros.

**Leitura geral:** as regras de negócio do backend e os fluxos entre telas estão cobertos por testes que passam. Os principais riscos que apareceram durante o trabalho (segurança de login, logout, recuperação de senha, limite de tentativas, desempenho) foram corrigidos e cobertos por testes de regressão. As pendências estão nas seções 6 e 7.

---

## 2. O que cada camada testa

### 2.1 Backend (`Implementacao/backend/tests/`)

Os testes sobem o app Express em memória e chamam as rotas por HTTP. Cada grupo corresponde a uma regra do sistema:

- **Autenticação e recuperação de senha:** login, senha errada, cadastro público de técnico, recuperação por pergunta de segurança, token de recuperação de uso único.
- **Segurança (S1 a S9):** conta de aluno sem acesso, CORS restrito à origem do frontend, logout que revoga o token, limite de tentativas de login, conta inativa sem revelar o status, `JWT_SECRET` obrigatório em produção, resposta uniforme para e-mail inexistente, resposta de segurança guardada com hash, migração de senha bcrypt para scrypt.
- **Estoque e produção:** entrada, ajuste manual (só administrador), consumo, estorno ao cancelar produção, insumo inativo, consumo e duração negativos recusados, técnico não registra produção em nome de outro, máquina inativa ou incompatível recusada.
- **Empréstimos:** data inválida recusada, status calculado pelo prazo com fuso de Recife, devolução libera o equipamento, equipamento em manutenção ou inativo não é emprestado.
- **Manutenção e máquinas:** registro, conclusão recalcula a próxima preventiva, filtros, remoção só sem histórico (senão apenas inativa).
- **Permissões:** matriz de perfil por rota (técnico recusado em rotas de administrador) e 401 sem token.
- **Relatórios e dashboard:** métricas corretas, filtro "até" inclusivo, agrupamento mensal por técnico.
- **Validação:** enums de perfil, situação, tipo e status; JSON malformado; valores negativos; violação de regra do banco com mensagem clara.

### 2.2 Frontend (`Implementacao/frontend/perfil_adm/src/`)

Os testes espionam o cliente de API (`vi.spyOn`), então não dependem do backend estar no ar.

- **Cliente de API (`services/api.test.ts`):** URL, token no cabeçalho, mensagens de erro, 401 e 403, falha de conexão, logout tolerante a erro.
- **Sessão e permissões (`lib/session.test.ts`, `lib/permissions.test.ts`):** armazenamento conforme "lembrar de mim", sessão corrompida, perfis.
- **Telas de autenticação (`pages/auth/*.test.tsx`):** validação de e-mail e senha, login com gravação de sessão, cadastro com redirecionamento, fluxo completo de recuperação, administrador seguindo o fluxo comum.

**Limite:** as telas autenticadas (dashboard, usuários, máquinas, estoque, empréstimos, relatórios) não têm testes de componente. Elas são cobertas pelo e2e (seção 2.3).

### 2.3 Ponta a ponta (`Implementacao/e2e/tests/`)

O Playwright sobe o backend (porta 3001, banco novo a cada execução) e a SPA (porta 3100), e roda os testes contra eles, sem mock.

- **Autenticação pela tela (`ui/auth.spec.ts`, 11 testes):** login de técnico e de administrador, senha errada, perfil diferente do cadastrado, rota protegida sem sessão, aluno sem acesso, cadastro de técnico, recuperação de senha, encerrar sessão revogando o token.
- **Telas ligadas à API (`ui/ligacao-api.spec.ts`, 2 testes):** máquina cadastrada pela API aparece na tela; formulário não cria técnico sem senha inicial.
- **Navegação (`ui/navigation.spec.ts`, 6 testes):** todas as telas abrem sem erro de aplicação para o administrador; técnico vê só as telas permitidas; menu lateral; rota inexistente.
- **API e permissões (`api/permissions.spec.ts`, 7 testes):** sem token e token inválido recusados; técnico recusado em operações de administrador; logout revoga o token; aluno não obtém token; senha errada repetida devolve 429.
- **Fluxos entre módulos (`api/flows.spec.ts`, 6 testes):** estoque com produção e cancelamento; empréstimo com devolução; manutenção bloqueando produção; insumo inativo; relatório por técnico; token de recuperação de uso único.

---

## 3. Bugs encontrados e corrigidos

Os bugs abaixo foram encontrados pelos próprios testes ou por medição, e corrigidos com teste de regressão.

| # | Área | Problema | Correção |
|---|---|---|---|
| 1 | Backend, manutenção | Concluir manutenção por `PATCH` não atualizava a última manutenção nem a próxima preventiva | Cálculo compartilhado entre as duas rotas |
| 2 | Frontend, recuperação | Ramo para administrador ficou como código morto após a correção de segurança | Ramo removido; teste confirma o fluxo comum |
| 3 | Backend, segurança | Resposta diferente para administrador revelava a existência da conta | Resposta uniforme |
| 4 | Backend, segurança | Resposta de segurança guardada em texto puro | Hash bcrypt, com migração no primeiro uso |
| 5 | Backend, validação | Valores fora do domínio aceitos ou com erro genérico | Validação explícita com código específico |
| 6 | Testes | Suíte gravava no banco de desenvolvimento | Banco de teste separado, recriado a cada execução |
| 7 | Backend, desempenho | `bcryptjs` síncrono travava o servidor sob logins concorrentes (~113 ms por login) | Hash com scrypt nativo, com migração de hashes antigos |
| 8 | Backend, desempenho | Cada escrita fazia fsync síncrono no SQLite | WAL com `synchronous=NORMAL` |
| 9 | Backend, desempenho | Dashboard e relatórios com varredura completa sem índice | Índices nas colunas de data |
| 10 | Backend, desempenho | Relatório devolvia o banco inteiro (7,2 MB) | Métricas em SQL; lista limitada a 500 registros |
| 11 | Frontend, logout | "Encerrar Sessão" não revogava o token no servidor | Chama `api.logout()` antes de limpar a sessão |
| 12 | Backend, limite de login | Atrás do proxy, todos os clientes compartilhavam o mesmo IP e o mesmo limite | `TRUST_PROXY` padrão 1 em produção |
| 13 | Backend, segurança | Cabeçalhos ausentes e versão do Express exposta | `X-Powered-By` removido; `nosniff`, `X-Frame-Options`, `Referrer-Policy`, HSTS em produção |
| 14 | Backend, erros | Payload grande virava 500 | Erros 4xx do Express preservam o status (413) |
| 15 | Dependências | `body-parser` (alta) e `qs` (moderada) | `npm audit fix`; backend com 0 vulnerabilidades |

---

## 4. Resultados dos testes não funcionais

**Medidos em 12/11/2026**, com o backend em build de produção, numa máquina local de 12 núcleos. Os números comparam o estado antes e depois das correções da seção 3.

### 4.1 Carga (mix de endpoints, 30 s por estágio)

| Usuários simultâneos | Antes | Depois |
|---|---|---|
| 50 | 133 req/s, p95 747 ms, p99 1,06 s | **506 req/s, p95 219 ms, p99 339 ms** |
| 100 | 119 req/s, p95 1,06 s, p99 **15 s** | **479 req/s, p95 431 ms, p99 867 ms** |

Erros 5xx e de rede: zero em todos os estágios, antes e depois.

### 4.2 Stress (rampa até 800 usuários)

- **Antes:** ponto de quebra em **400 usuários** (p95 5,2 s). Throughput preso em ~110 req/s a partir de 10 usuários.
- **Depois:** nenhum ponto de quebra até **800 usuários** (p95 2,7 s, 0% de erro). Throughput entre 430 e 515 req/s do início ao fim da rampa.
- Após a carga, `/api/health` voltou a responder em milissegundos, sem falha de processo.

### 4.3 Segurança

| Conjunto | Resultado |
|---|---|
| `security-surface.mjs` (superfície e erros) | **23/23 OK** (antes: 20 OK e 4 falhas) |
| `security-rbac.mjs` (autorização e sessão) | **10 OK** e 1 informativo |
| `npm audit` do backend | **0 vulnerabilidades** (antes: 1 alta e 1 moderada) |
| `npm audit` do frontend | 1 moderada pendente (`react-router-dom`, ver seção 6) |

O item informativo: um técnico consegue listar todos os usuários (e-mail, matrícula e telefone). Esse comportamento depende de uma decisão de produto ainda em aberto.

### 4.4 Smoke de produção

**23/23 checagens** no build de produção: login do administrador, criação de técnico, cadastro de máquina, entrada de estoque, produção com consumo, cancelamento devolvendo saldo, manutenção, empréstimo e devolução, cinco relatórios, dashboard, lista paginada, permissão negada (403) e logout com revogação.

### 4.5 Limites desta medição

- Foi feita **localmente**. Os deploys online (Render e Vercel) estavam fora do ar nesta data, então nenhum teste de carga ou segurança foi rodado contra o ambiente online.
- O volume de dados da medição final foi de **22.667 produções**. A medição inicial usou poucas centenas. A comparação é favorável ao resultado final, que tem mais dados.
- O gerador de carga roda na mesma máquina do servidor. Os números servem para comparar antes e depois, não como medida de capacidade de produção.
- Esses scripts gravam dados e não têm rota de exclusão. Só devem rodar em ambiente de teste.

---

## 5. Status dos bugs que estavam abertos

Verificado no código da `main` (`cf59b3b`) em 23/11/2026. Os IDs são os usados nos relatórios anteriores.

| ID | Gravidade original | Descrição | Status atual |
|---|---|---|---|
| A | Alta | Login offline aceitava credenciais padrão do código | **Resolvido**: não há mais contas locais no código de produção |
| B | Alta | Cadastro offline gravava senha em texto puro no `localStorage` | **Resolvido**: o caminho offline não existe mais |
| C | Média | Fallback offline revelava a existência de contas | **Resolvido** no código atual (não reauditado linha a linha) |
| D | Média | Resposta de segurança sem limite de tentativas | **Resolvido**: `answerAttempts.ts` aplica o limite |
| F | Média | Testes antigos dependiam da ordem de execução | **Não reverificado** nesta data; a suíte atual passa, mas não foi analisada teste a teste |
| F1 | Média | Telas lendo dados do `localStorage` | **Parcial**: ainda há 4 arquivos de produção com `localStorage` (`lib/storage.ts`, `lib/session.ts`, `EditProfilePage.tsx`, `LoginPage.tsx`). Não auditei se todos são necessários |
| G | Baixa | Sem timeout nas requisições do frontend | **Aberto**: não há `AbortController` nem `VITE_API_TIMEOUT` |
| H | Baixa | Produção sem administrador inicial | **Resolvido**: bootstrap com `INITIAL_ADMIN_EMAIL` e `INITIAL_ADMIN_PASSWORD` (commit `2dbe79e`) |
| I | Alta | "Encerrar Sessão" não revogava o token | **Resolvido**: o teste que era marcado como falha esperada agora passa como teste normal |

---

## 6. Migração para PostgreSQL (PR #120, em revisão)

A migração do backend de SQLite para PostgreSQL/Supabase ainda não está na `main`. Está no PR #120 (rascunho), branch `migration/supabase-postgres`.

| Verificação | Resultado |
|---|---|
| CI do GitHub, commit `bc99b44` | Backend ✅ (44 s), Frontend ✅ (23 s), Ponta a ponta ✅ (7 min 47 s) |
| Backend local contra PostgreSQL 17 | 46/46 (a `main` tem 47; um teste de produção não foi portado) |
| Backend local em fusos extremos (UTC+14 e UTC-8) | 46/46 em ambos |
| E2E local contra PostgreSQL 17 | 29/29 |
| Importação SQLite → PostgreSQL | Validada com banco legado sintético (contagens iguais; login com senha original funciona) |

**Testes não portados:** "em produção, nenhuma conta padrão é criada". Um teste correto precisa de um banco vazio separado; a suíte atual roda sobre banco já semeado.

---

## 7. O que não foi testado

- **Ambiente online:** nenhum teste contra Render ou Vercel nesta data. Os deploys estavam fora do ar nas medições de 12/11.
- **Conexão real com Supabase** (PR #120): ainda não testada. Há um ponto a verificar: se a URL tiver `?sslmode=require`, o `pg` ignora a opção `PGSSL_REJECT_UNAUTHORIZED=false` documentada.
- **Telas autenticadas do frontend com dados do servidor:** só o e2e verifica que abrem. Os dados ainda vêm do navegador em parte das telas (F1).
- **Navegadores além do Chromium:** Firefox e WebKit não estão configurados.
- **Acessibilidade:** não há checagem automatizada (ex.: axe).
- **Usabilidade:** não testada com usuários. O `Relatorio_Testes_Automatizados.md` também lista isso como não coberto.
- **Carga e stress acima de 800 usuários:** não testados; o gerador de carga é limitado à máquina de teste.
- **Concorrência de estoque e empréstimo sob carga:** registrada como verificada na issue #115 (16/11/2026), mas não há teste automatizado correspondente na suíte.
- **Cobertura de código:** não medida (não há ativação no CI).

---

## 8. Pendências recomendadas

1. **Revisar o PR #120** e decidir o merge da migração para PostgreSQL.
2. **Testar a conexão com o Supabase** e corrigir a configuração de SSL (seção 7).
3. **Atualizar `react-router-dom` para a versão 7** (vulnerabilidade moderada do frontend; exige mudança de API).
4. **Corrigir o timeout das requisições do frontend** (bug G).
5. **Decidir se técnicos podem ver e-mail, matrícula e telefone de todos os usuários** (decisão de produto).
6. **Portar o teste de "nenhuma conta padrão em produção"** com banco vazio.
7. **Rodar os testes não funcionais contra o ambiente online** quando os deploys voltarem, e reexecutar carga e segurança na `main` atual.
8. **Ativar cobertura de código no CI.**

---

## 9. Como rodar

Backend (na `main`, SQLite):

```bash
cd Implementacao/backend
npm install
npm test            # 47 testes
npx tsc --noEmit
```

Frontend:

```bash
cd Implementacao/frontend/perfil_adm
npm install
npm test            # 41 testes
npx tsc --noEmit
npm run build
```

Ponta a ponta (instalar o Chromium na primeira vez):

```bash
cd Implementacao/e2e
npm install
npx playwright install chromium
npm test            # 32 testes
```

Não funcionais (com o backend rodando em modo produção; ver `Implementacao/testes-nao-funcionais/README.md`):

```bash
cd Implementacao/testes-nao-funcionais
node load.mjs 50 30
node stress.mjs
node security-surface.mjs
node security-rbac.mjs
node smoke.mjs
```

---

## 10. Observações sobre os relatórios anteriores

Alguns relatórios da pasta `Documentacao/` estão desatualizados e se contradizem. Este relatório substitui os números deles pelos medidos em 23/11/2026:

- `Relatorio_de_Testes_labMU.md` menciona 9 testes de backend no resumo e 40 no restante do texto. A contagem atual é 47.
- `Relatorio_Testes_Automatizados.md` menciona 40 testes de backend e 35 de frontend. A contagem atual é 47 e 41.
- `Relatorio_Playwright.md` menciona 27 testes de ponta a ponta. A contagem atual é 32.
- `Backend_Requisitos_e_Integracao.md` afirma que o backend não existe. Esse trecho precisa ser revisado.
