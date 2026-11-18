# Relatório de trabalho — Issue #118 (Migração do backend para Vercel + Supabase PostgreSQL)

**Data:** 18/11/2026
**Escopo:** tudo o que foi possível fazer localmente na issue #118, sem acesso ao Supabase de produção, à Vercel e sem push para a branch compartilhada.
**Público:** Lucas (revisão) e a equipe, para retomar a migração.

---

## 1. Resumo executivo

- **Bloqueio de CI resolvido:** o `package-lock.json` agora contém `pg` e `@types/pg`. Antes, `npm ci` falharia.
- **Código que não compilava foi corrigido:** `tsc` tinha 12 erros, todos de migração SQLite → PostgreSQL. Agora passa sem erros.
- **Três bugs silenciosos de PostgreSQL foram corrigidos.** Eles não quebravam compilação, mas davam resposta errada: relatórios zerados, status de empréstimo errado e tokens de revogação com chamada inexistente.
- **Testes: 46/46 passando** contra PostgreSQL 17, em três fusos horários diferentes.
- **Fluxo de produção validado de ponta a ponta:** bootstrap do administrador, entrypoint serverless, health check e login por HTTP.
- **Importação SQLite validada** com um banco legado gerado pelo próprio código da `main` (não há o arquivo real). Contagens, integridade e login com senha antiga conferidos.
- **Atualização (segunda rodada):** commits enviados para `migration/supabase-postgres` e **PR #120 aberto como rascunho** (https://github.com/KailaneLisley/labMU/pull/120). A CI do GitHub rodou:
  - **Backend: passou** (40s), o que confirma lockfile e `PGSSL=disable` no ambiente real do GitHub.
  - **E2E: falhou na primeira execução** porque o config ainda subia o backend com SQLite e `src/server.ts` (que não abre porta). Corrigido no commit `bc99b44`. A suíte completa do e2e passa localmente: **29/29**.
  - **Frontend: passou.**
- **Commits:** `9d466f0` (backend) e `bc99b44` (e2e/CI), ambos já no remoto.

**Não foi possível validar:** conexão com o Supabase real, deploy de produção na Vercel e importação do SQLite real da produção antiga. Detalhes na seção 6.

---

## 2. Estado de partida

A própria issue #118 dizia que build, testes e CI não estavam validados, e que o `package-lock.json` estava sem `pg`. Confirmei isso no remoto antes de começar (`git show origin/migration/supabase-postgres:...package-lock.json` não tinha `node_modules/pg`).

Ambiente usado:

| Item | Valor |
|---|---|
| Node local | v24.13.0 (a CI usa 22; `engines` pede >= 22.13) |
| npm | 11.6.2 |
| Docker | disponível; usado para PostgreSQL 17 descartável (`postgres:17`, mesma versão da issue e da CI) |
| Branch | `migration/supabase-postgres` (remoto), trabalhada em uma worktree separada |

---

## 3. Onde o trabalho foi feito

- **Worktree isolada:** `/tmp/claude-1001/-home-lucas-Projetos-Integrador-labMU/b2dd8b19-6abe-49ef-b1f5-328f66b7c5b8/scratchpad/wt118`
- **Branch local:** `migration-118-work`, rastreando `origin/migration/supabase-postgres`
- **Commits:** `9d466f0 fix(backend): corrige migração PostgreSQL (#118)` e `bc99b44 fix(e2e): sobe o backend com PostgreSQL e localServer (#118)`, em cima de `130e29c`. Ambos enviados para `origin/migration/supabase-postgres`.
- **PR:** #120, rascunho, base `main`.
- **Seu checkout (`labMU/`, branch `fix/tsconfig-editor`)** não foi tocado.

**Erro meu no processo:** no primeiro comando de criação da worktree, criei sem querer uma worktree em `/tmp/x` com uma branch `migration/supabase-postgres-work` baseada na `main`. Ela foi removida logo em seguida, junto com a branch, e confirmei com `git worktree list` e `git branch --list 'migration*'`.

---

## 4. O que foi feito, passo a passo

### 4.1 Dependências e lockfile

- Rodei `npm install` em `Implementacao/backend`, e não editei o lockfile à mão.
- **Diff do lockfile:** só foram adicionados `pg`, `@types/pg` e suas dependências transitivas (`pg-pool`, `pg-protocol`, `pg-types`, `pgpass` etc.). Não houve mudança de versão em nada que já existia. A única linha "removida" é a vírgula do `jsonwebtoken`, que ganhou vírgula porque agora vem antes de `pg`.
- **Por que:** a CI usa `npm ci`, que falha se o lockfile não bate com o `package.json`. Usar `npm install` (e não editar o JSON) garante que o lockfile é o que o npm gera.
- **Verificação:** rodei `npm ci` do zero (com `node_modules` apagado) e a instalação passou com "found 0 vulnerabilities".

### 4.2 Erros de compilação (12 erros no `tsc`)

| Arquivo | Problema | Correção | Motivo |
|---|---|---|---|
| `modules/auth/tokenRevocation.ts` | `async function ... : void` e `: boolean` (retorno não é `Promise`) | Trocado para `Promise<void>` e `Promise<boolean>` | Em função `async`, o TypeScript exige `Promise<T>` |
| `modules/auth/tokenRevocation.ts` | `query.run(...)` (objeto do SQLite, inexistente) sem `await` | Trocado por `await postgres.run(...)` | Restinho da API SQLite. Sem isso, `revokeToken` (logout) quebrava em runtime |
| `modules/users/users.service.ts` (9 erros) | `this.getUserById(id)` sem `await` em `updateUser` e `updateStatus` | Adicionado `await` | `getUserById` é async agora. Sem o `await`, a variável recebia uma `Promise` e os campos eram lidos como `undefined` |

Depois disso, `npx tsc --noEmit` passou com exit 0.

### 4.3 Bugs que o compilador não pegava (achados nos testes)

Esses três eram os de maior risco, porque **não davam erro**, só resposta errada.

**(a) Relatórios zerados: aliases camelCase sem aspas** (`reports.service.ts`)
- **Sintoma:** os testes de relatório de produção, manutenção e relatório de empréstimos mostravam totais 0, mesmo após criar registros.
- **Causa:** `SELECT COUNT(*) AS totalJobs`. No PostgreSQL, identificadores sem aspas viram minúsculas, então a coluna chega como `totaljobs`. O código lia `agg.totalJobs`, que vira `undefined`, e caía no `?? 0`.
- **Por que passava no SQLite:** o SQLite preserva a capitalização dos aliases.
- **Correção:** aliases camelCase entre aspas duplas (`AS "totalJobs"`) nos 3 blocos. Escolhi aspas e não renomear para snake_case porque o contrato JSON da API (`totalJobs`, `preventiveCount` etc.) não muda e o frontend continua funcionando sem alteração.

**(b) Status de empréstimo com vencimento só com data estava um dia adiantado** (`modules/loans/loanStatus.ts`)
- **Sintoma:** empréstimo com `dueDate` = hoje aparecia como `em_campo`, e não como `devolucao_hoje`.
- **Causa:** para `AAAA-MM-DD`, o `dueAt` já é o fim do dia (meia-noite de Recife do dia seguinte, em UTC). Depois, o `dueDayLocal` convertia esse instante de volta para a data local, o que dava o dia seguinte.
- **Correção:** para vencimento só com data, o dia de vencimento é a própria data. Para os demais formatos (ISO com hora, com ou sem fuso), a regra continua convertendo o instante para o dia de Recife.
- **Por que é importante:** o status "devolucao_hoje" é exibido na tela de empréstimos. Errado, o técnico não veria o aviso no dia certo.

**(c) Código morto de SQLite que criava arquivo ao ser importado** (`database/connection.ts`)
- **Problema:** o módulo não era importado por ninguém, mas, se fosse, abria um arquivo SQLite e criava diretórios no disco ao ser carregado.
- **Por que removi:** em Vercel o sistema de arquivos é somente leitura (fora `/tmp`), então qualquer import desse módulo quebraria o boot. Além disso, é código morto que confunde quem for dar manutenção.
- **Confirmação:** `grep` nas importações não achou nenhum `import` para ele. O script de migração do SQLite usa o `node:sqlite` diretamente, então a remoção não afeta a importação.
- **Mantive** `database/schema.sql`, porque o build ainda o copia para `dist/` e ele serve de referência do schema legado. Ele não é mais usado pelo código.

### 4.4 CI (`.github/workflows/ci.yml`)

- **Problema encontrado:** o `.env.test` do workflow não tinha `PGSSL=disable`. O pool de conexão sempre tenta SSL, e o serviço `postgres:17` do GitHub Actions não tem SSL. A conexão falharia.
- **Correção:** adicionei `PGSSL=disable` no `.env.test` gerado pelo workflow.
- **Por que só nesse ponto:** `PGSSL=disable` só deve valer para banco local ou de CI. Em Supabase, o SSL precisa estar ligado (ver seção 6.3).
- **Não consegui rodar o workflow de verdade** (não tenho como executar GitHub Actions aqui). Em vez disso, reproduzi os passos do job `backend` localmente, na mesma ordem (ver seção 5.2).

### 4.5 Documentação

Atualizei apenas os arquivos que descrevem o backend diretamente:

- `Implementacao/backend/README.md`: descrição (SQLite → PostgreSQL), pré-requisitos (Node 22.13+, PostgreSQL 17, como subir um banco local com Docker), comportamento do modo dev.
- `Implementacao/backend/src/README.md`: árvore de arquivos (`postgres.ts`, `bootstrapAdmin.ts`, `migrateSqliteToPostgres.ts`; `connection.ts` removido), explicação das transações (savepoints e `AsyncLocalStorage`), descrição do `server.ts` (entrypoint serverless) e do `localServer.ts`.

**Não atualizei** o `README.md` da raiz do repositório (ainda diz "SQLite" e fala do Render). Ele descreve o produto inteiro, e a decisão de como apresentar a nova arquitetura é da equipe. Ver seção 9.

---

## 5. Validação

### 5.1 Resultados

| Verificação | Resultado | Como |
|---|---|---|
| `npm ci` a partir do lockfile | OK, 0 vulnerabilidades | `node_modules` apagado antes |
| `npx tsc --noEmit` | OK (exit 0) | Antes: 12 erros |
| `npm run build` | OK | `dist/` gerado, `schema.sql` copiado |
| `npm test` | **46/46** | PostgreSQL 17 descartável (Docker) |
| `npm test` com `TZ=Pacific/Kiritimati` (UTC+14) | 46/46 | Sensibilidade a data/fuso |
| `npm test` com `TZ=America/Los_Angeles` (UTC-8) | 46/46 | Idem |
| Sequência completa do job `backend` da CI, do zero | OK | `npm ci` → schema → `tsc` → `npm test` → `build` |
| Servidor serverless (`dist/server.js`) | OK | `import` não abre porta nem roda seed; `/api/health` responde; login devolve JWT |
| `npm run bootstrap:admin` (produção) | OK | Criou só o admin informado em `INITIAL_ADMIN_*` |
| Importação SQLite → PostgreSQL | OK | Ver 5.3 |
| Segunda importação no mesmo destino | Recusada, sem alterar nada | Mensagem: "A tabela public.users já contém 5 registro(s)" |
| Login com conta migrada e senha original | HTTP 200 | Prova que os hashes sobrevivem à migração |

**Observação sobre o número de testes:** a `main` declara 47 testes (45 em `api.test.ts` + 2 em `errorHandler.test.ts`); a branch tem 46. A diferença é o teste `S7: em produção, nenhuma conta padrão é criada`, que não foi portado (ver 5.4).

### 5.2 Como reproduzir

Container de teste (mesmo nome e versão usados aqui):

```bash
docker run -d --name labmu-test-pg-118 -e POSTGRES_PASSWORD=testpass -p 55432:5432 postgres:17
docker exec labmu-test-pg-118 psql -U postgres -c "CREATE DATABASE labmu_test;"
```

Na pasta `Implementacao/backend`:

```bash
cat > .env.test <<'EOF'
NODE_ENV=test
CONFIRM_TEST_DATABASE_RESET=true
PGSSL=disable
TEST_DATABASE_URL=postgresql://postgres:testpass@127.0.0.1:55432/labmu_test
EOF
docker exec -i labmu-test-pg-118 psql -U postgres -d labmu_test -v ON_ERROR_STOP=1 < supabase/migrations/202611160001_initial_schema.sql
npm ci && npx tsc --noEmit && npm test && npm run build
```

O `.env.test` está no `.gitignore` e não foi commitado.

**Limitação:** rodei com Node 24; a CI usa Node 22. O `engines` pede 22.13+, e o código não usa nada exclusivo da 24, mas não testei em 22.

### 5.3 Importação SQLite (validada com dados sintéticos)

Não há o arquivo SQLite real da produção antiga. Para testar o caminho completo, fiz o seguinte:

1. Criei uma worktree da `main` (que ainda usa SQLite) e rodei o seed dela, gerando `legacy-labmu.sqlite`.
2. Contagens do arquivo legado: users 5, machines 5, maintenances 2, supplies 5, stock_movements 5, portable_equipment 5, loans 3, productions 2, revoked_tokens 0.
3. Criei um PostgreSQL vazio (`labmu_migr`), apliquei o schema e rodei `npm run migrate:sqlite` com `SQLITE_SOURCE_FILE` apontando para o legado.
4. Resultado: as 9 tabelas importadas com as mesmas contagens. Exit 0.
5. Rodei a importação de novo: **recusada** com a mensagem de destino não vazio, sem alterar nada.
6. Login com `admin.musarq@unicap.br` e `Admin@123` (senhas originais do seed legado) no servidor apontado para o banco migrado: **HTTP 200**.
7. Amostras de linhas (`users`, `loans`) conferidas lado a lado: ids, e-mails, status, datas idênticos.
8. Hash SHA-256 do arquivo legado antes e depois: o arquivo não foi alterado.

**Importante:** isso prova que o script funciona para dados com a forma do seed. Não prova que o banco de produção antigo, com dados reais, importa sem problemas. Ver 6.4.

### 5.4 Teste não portado: "S7: em produção, nenhuma conta padrão é criada"

- **O que o teste original fazia:** rodava `initializeData()` em modo produção e conferia que nenhuma conta era criada (o SQLite estava vazio).
- **Por que não portei:** a suíte inteira roda contra um banco que já foi semeado no `before()`. Qualquer versão desse teste contra o banco de testes passaria mesmo com a regra quebrada, então seria um teste falso. Um teste válido precisa de um banco vazio separado, e isso exige criar um banco por teste (`CREATE DATABASE`), o que depende de permissão que o Supabase pode não dar.
- **Cobertura atual:** verifiquei manualmente o bootstrap de produção (cria só o admin de `INITIAL_ADMIN_*`, não cria as contas padrão) e a leitura do código (`bootstrap.ts` só chama `seedDatabase` fora de produção). Não há teste automatizado para isso.
- **Recomendação:** criar um teste em um job separado da CI, com banco vazio.

---

## 6. O que NÃO foi validado

### 6.1 Conexão real com o Supabase
Não tenho a `DATABASE_URL` de produção (e não deveria ter). Só testei com PostgreSQL local, sem SSL.

### 6.2 Deploy na Vercel
A conta/equipe Vercel não está autorizada nesta conexão (`teams: []` em rodada anterior). Não consegui inspecionar projeto, variáveis ou plano. A validação do entrypoint foi local (`dist/server.js` importado e servindo HTTP), que é o mesmo código que a Vercel vai executar, mas o empacotamento da Vercel não foi testado.

### 6.3 SSL com `sslmode` na URL (achado importante)
Verifiquei no código do `pg` (instalado no projeto):
- `postgres.ts` passa `ssl: { rejectUnauthorized: ... }` ao pool.
- Mas o `pg` faz `Object.assign` com o que vem de `parse(connectionString)`. Se a URL tiver `?sslmode=require` (como nos `.env.example` e `.env.test.example`), o `ssl` da URL **substitui** o do pool por `{}`.
- Consequência: a opção `PGSSL_REJECT_UNAUTHORIZED=false` documentada **é ignorada silenciosamente** quando a URL tem `sslmode`. A verificação de certificado continua ligada (default do Node), então não é uma brecha. Mas a documentação promete um controle que não funciona.
- Além disso, o `pg-connection-string` avisa que `require`/`verify-ca` são alias de `verify-full`, com aviso no console a cada start.
- **Não mudei a lógica de SSL** porque não consigo testar contra o Supabase real. Recomendação: testar a conexão real e, se for preciso o modo "no-verify", configurar o `ssl` sem `sslmode` na URL (ou ajustar a documentação).

### 6.4 Banco SQLite real da produção antiga
Não tenho o arquivo. Riscos que a importação real pode ter e que o teste sintético não cobre: dados com formatos de data diferentes do seed (o `loanStatus` já trata 3 formatos), registros com referências órfãs (o PostgreSQL recusaria, o que é bom, mas a importação abortaria), e tamanho do arquivo. Antes de rodar, a issue pede backup e conferência de contagens, que continuam válidos.

### 6.5 GitHub Actions (atualizado)
- **Backend:** passou na CI real (PR #120), com Node 22 no runner.
- **E2E:** na primeira execução falhou (ver seção 11). Após a correção (`bc99b44`), a execução está sendo acompanhada no PR #120; o resultado final está na seção 11.
- **Frontend:** passou.

### 6.6 Frontend e E2E (atualizado)
Não alterei o frontend. O contrato JSON da API foi mantido (os aliases continuam em camelCase). O Playwright agora roda localmente: **29/29** (13 de API e 16 de navegador, Chromium), contra PostgreSQL 17 com banco novo.

Vercel: o PR #120 mostra um check da Vercel (projeto `lab-mu`) com deploy de preview concluído. Não sei ainda se ele é o frontend ou o backend, e não consegui inspecioná-lo pela conexão Vercel desta sessão.

---

## 7. Decisões tomadas e por quê

| Decisão | Alternativa considerada | Por que escolhi |
|---|---|---|
| Usar `npm install` para atualizar o lockfile | Editar o JSON à mão | Garante um lockfile gerado pelo npm; o diff mostrou só as adições esperadas |
| PostgreSQL 17 via Docker para testes | Supabase de teste | Local, descartável, sem risco de tocar dados reais; mesma versão da issue e da CI |
| Aspas duplas nos aliases SQL | Renomear para snake_case e mapear no JS | Mantém o contrato JSON da API; mudança menor e localizada |
| Dia de vencimento = data informada (para `AAAA-MM-DD`) | Manter a conversão para o dia de Recife | A conversão adiantava um dia; a regra antiga só fazia sentido para timestamps |
| Remover `connection.ts` | Deixar comentado | Era código morto e perigoso em serverless; confirmado por `grep` que não havia import |
| Manter `schema.sql` e a cópia no build | Remover também | Referência do schema legado; remoção pode ser feita depois, sem urgência |
| `PGSSL=disable` só no `.env.test` da CI | Mudar a lógica de SSL do código | Só o ambiente de teste local/CI precisa; a lógica de produção precisa ser testada contra o Supabase real |
| Não portar o teste S7 | Escrever um teste fraco | Um teste contra banco já semeado daria falso positivo (ver 5.4) |
| Commit local, sem push | Push para `migration/supabase-postgres` | A branch é compartilhada com a equipe e o push dispara CI; é uma ação que deve ser sua |
| Não editar a issue #118 | Marcar os itens do checklist | Edição visível para a equipe; sugestões na seção 9 |
| Não tocar no README da raiz | Atualizar tudo | Descreve o produto inteiro; a apresentação da nova arquitetura é decisão da equipe |

---

## 8. Estado do repositório e limpeza

- **Commits:** `9d466f0` e `bc99b44` em `migration-118-work` (worktree), já enviados para `origin/migration/supabase-postgres`.
- **Correção ao texto anterior:** o `ci.yml` roda só em `push` para `main` e em `pull_request`. Por isso o push para a branch **não** dispara a CI. Para isso abri o PR #120 (rascunho).
- **Worktrees criadas:**
  - `.../scratchpad/wt118` (migração, esta branch de trabalho)
  - `.../scratchpad/legacy` (cópia da `main` usada para gerar o SQLite de teste; mantenha se quiser repetir a importação)
- **Arquivo SQLite de teste:** `.../scratchpad/legacy-labmu.sqlite`
- **Container Docker ativo:** `labmu-test-pg-118` (porta 55432). Remova com `docker rm -f labmu-test-pg-118` quando não precisar mais.
- **Bancos criados no container:** `labmu_test`, `labmu_dev`, `labmu_migr`, `labmu_ci`.

---

## 9. Checklist da issue #118 — sugestão de atualização

Sugestão (**não apliquei** na issue):

- [x] Regenerar e commitar `package-lock.json` *(commit 9d466f0)*
- [x] Executar `npm run build` sem erros
- [x] Executar `npm test` com PostgreSQL de teste isolado *(46/46)*
- [ ] Obter CI verde na branch *(falta push; ver seção 8)*
- [ ] Validar conexão real com Supabase usando credencial privada e SSL *(ver 6.1 e 6.3)*
- [ ] Obter e validar cópia consistente do SQLite legado *(ver 6.4)*
- [x] Executar importação e conferir contagens/integridade *(validado com dados sintéticos; falta o dado real)*
- [ ] Autorizar acesso Vercel e inspecionar projeto/configuração *(ver 6.2)*
- [ ] Fazer deploy Preview
- [ ] Homologar os fluxos da API e frontend
- [ ] Confirmar elegibilidade do plano Vercel
- [ ] Aprovar e executar corte para produção com rollback planejado

**Itens novos sugeridos para a issue:**
- Corrigir a documentação de SSL (`sslmode` na URL sobrescreve `PGSSL_REJECT_UNAUTHORIZED`).
- Portar o teste "nenhuma conta padrão em produção" com banco vazio.
- Atualizar o README da raiz (ainda diz SQLite e Render).
- Revisar `DEPLOY_VERCEL.md` após validar o SSL no Supabase.

---

## 10. Decisões que dependem de você

1. **Publicar o commit?** Fazer push para a branch compartilhada dispara a CI e muda o que a equipe vê. Não fiz.
2. **Atualizar a issue #118?** Posso marcar os itens acima com um comentário de progresso, se você quiser.
3. **Porte do teste S7:** vale criar um job de CI separado com banco vazio?
4. **SSL:** quer que eu proponha a correção (ajustar a forma como o SSL é configurado) antes de testar no Supabase?
5. **Issue #115:** conforme pedido, não mexi nela.

---

## 11. Atualização final de CI (segunda rodada)

- **PR:** #120 (rascunho), https://github.com/KailaneLisley/labMU/pull/120
- **Commits na branch:** `9d466f0` (backend), `bc99b44` (e2e/CI)
- **Run do GitHub Actions (commit `bc99b44`):** https://github.com/KailaneLisley/labMU/actions/runs/44376576161

| Job | Resultado | Tempo |
|---|---|---|
| Backend (tipos, testes e build) | passou | 44s |
| Frontend (tipos, testes e build) | passou | 23s |
| Ponta a ponta (Playwright) | passou | 7m47s |
| Vercel (preview) | passou | — |

**Histórico do E2E:** a primeira execução (run `44375913508`, commit `9d466f0`) falhou. Causa: o `playwright.config.ts` ainda subia `src/server.ts` (que só exporta o app, sem abrir porta) com `DATABASE_FILE`, o caminho SQLite, e o job não tinha PostgreSQL. A correção (`bc99b44`) fez o config subir `src/localServer.ts` com `DATABASE_URL` vinda de `E2E_DATABASE_URL`, e o job `e2e` ganhou serviço `postgres:17` com o schema aplicado antes dos testes.

**Comentário de progresso publicado na issue #118:** https://github.com/KailaneLisley/labMU/issues/118#issuecomment-6988846570. Marquei os itens concluídos no checklist e registrei as pendências novas (SSL com `sslmode`, teste S7 não portado, README da raiz, check da Vercel).

**Ainda pendente** (não dá para fazer sem acesso externo ou decisão sua): validar conexão com o Supabase real, importar o SQLite de produção, inspecionar o projeto Vercel, deploy de preview do backend e corte para produção.
