# labMU — Relatório de testes: requisitos x implementação

**Data do teste:** 19/10/2026
**Escopo:** backend (`Implementacao/backend`) e SPA React (`Implementacao/frontend/perfil_adm`), comparados com os requisitos da pasta `Documentacao/` (principalmente `Projetos/Sprints/2`, `3`, `11`, `12`, `16`, `17`, `18` e `Backend_Requisitos_e_Integracao.md`).

Este documento segue o formato **"Era para ser" x "Está sendo feito"**. Para cada problema há um comando que você pode executar para ver o comportamento na prática.

---

## 1. Resumo

| Verificação | Resultado |
|---|---|
| `npm test` no backend | **9/9 passam** (arquivo `tests/api.test.ts`) |
| `npx tsc --noEmit` no backend | Sem erros |
| `npm run build` na SPA | **Passa** (tsc + vite) |
| Testes automatizados (`tests/api.test.ts`) | **40/40 passam**: autenticação, recuperação, estoque, empréstimo, produção, relatórios, dashboard, permissões por perfil, máquinas, manutenção e segurança |
| Verificações manuais de API (script próprio, 39 checagens) | **13 passam, 26 falham** na medição original; não foram rodadas de novo após as correções |
| Telas da SPA conectadas à API | **Apenas login, cadastro e recuperação de senha** |

**Leitura geral:**

- O backend existe e está bem organizado por módulos. As regras mais importantes de empréstimo (máquina fixa não sai, um empréstimo ativo por equipamento), de estoque (débito atômico, saldo insuficiente bloqueado, ajuste só para administrador) e de recuperação de senha funcionam.
- A segurança ainda está incompleta: conta sem perfil de Administrador/Técnico consegue entrar, o CORS aceita qualquer origem, o logout não invalida nada, não há limite de tentativas e o token de recuperação pode ser reutilizado.
- Atualização: as regras de dados incoerentes (R1 a R5) e as validações (V1 e V2) foram corrigidas. Produção em máquina inativa ou incompatível, produção em nome de outro técnico, data de empréstimo inválida, saldo e custo negativos e relatórios com "até" são recusados ou calculados corretamente, e entradas inválidas devolvem 400.
- Pendente: a passada manual de 39 checagens de API ainda não foi refeita, e as pendências de segurança (S1 a S8) continuam abertas.
- O frontend ainda funciona majoritariamente com `localStorage`. Só a autenticação fala com a API.
- O arquivo `Backend_Requisitos_e_Integracao.md` está **desatualizado**: afirma que não existe backend. Ele deve ser revisado.

---

## 2. Como reproduzir os testes

### 2.1 Testes automatizados e build

```bash
cd Implementacao/backend
npm install
npm test            # 9 testes, todos devem passar
npx tsc --noEmit    # sem saída = sem erros de tipo

cd ../frontend/perfil_adm
npm run build       # deve terminar com "built in ..."
```

### 2.2 Subir um backend de teste (sem mexer no banco do repositório)

```bash
cd Implementacao/backend
PORT=3055 DATABASE_FILE=./data/teste.sqlite npm run dev
```

Em outro terminal, guarde os tokens:

```bash
API=http://localhost:3055/api
ADM=$(curl -s -X POST $API/auth/login -H 'Content-Type: application/json' \
  -d '{"email":"admin.musarq@unicap.br","password":"Admin@123"}' | node -pe 'JSON.parse(require("fs").readFileSync(0)).token')
TEC=$(curl -s -X POST $API/auth/login -H 'Content-Type: application/json' \
  -d '{"email":"tecnico.musarq@unicap.br","password":"Tecnico@123"}' | node -pe 'JSON.parse(require("fs").readFileSync(0)).token')
echo "ADM=${ADM:0:20}... TEC=${TEC:0:20}..."
```

Os comandos abaixo supõem essas duas variáveis. Quando um comando pedir a data de hoje, use a data do seu dia (ex.: `2026-10-19`).

---

## 3. O que está correto

| Requisito (fonte) | Como foi verificado | Resultado |
|---|---|---|
| Backend existe, separado por domínio (Sprints/4 e 5) | Estrutura `src/modules/{auth,users,machines,maintenance,supplies,equipment,loans,production,reports,dashboard}` | ✅ |
| Build e tipagem do backend | `tsc --noEmit` sem erros; 9 testes passam | ✅ |
| Senhas com hash, nunca em texto puro (Backend_Requisitos §7) | `bcryptjs` no login e cadastro; resposta de login não traz `password_hash` | ✅ |
| Formato de erro `{ error: { code, message } }` e sem stack trace (Backend_Requisitos §6) | `errorHandler.ts` | ✅ |
| Técnico não cria usuário, não remove máquina, não ajusta estoque (Sprints/2) | `POST /users` → 403; `DELETE /machines` → 403; `POST /supplies/adjustments` → 403 | ✅ |
| Permissão lida do banco, não do token/corpo (Backend_Requisitos §4) | `authenticateToken` consulta `users` a cada requisição; `PATCH /users/me` não aceita `role` | ✅ |
| Cadastro público nunca cria Administrador (Backend_Requisitos §4) | `auth.service.ts` grava sempre `role = 'tecnico'` | ✅ |
| Máquina fixa não entra em empréstimo (Sprints/3, 17) | `POST /loans` com ID de máquina → 404 `EQUIPMENT_NOT_FOUND` (chave estrangeira aponta para `portable_equipment`) | ✅ |
| Código de portátil igual a TAG de máquina fixa é bloqueado | `POST /equipment` com TAG `#N01` → 400 `FIXED_MACHINE_RESTRICTION` | ✅ |
| Um empréstimo ativo por equipamento (Backend_Requisitos §5 e §10) | Segundo `POST /loans` do mesmo item → 409 `EQUIPMENT_ALREADY_LOANED`. Transação com `BEGIN IMMEDIATE` | ✅ |
| Status de empréstimo calculado pelo prazo, fuso de Recife (decisão da equipe) | Teste "fuso de Recife" passa | ✅ |
| Débito de estoque na mesma transação da produção (Backend_Requisitos §4 e §5) | Consumo de 0,5 kg reduz o saldo de 5,1 para 4,6; `INSUFFICIENT_STOCK` ao pedir 99999 kg | ✅ |
| Estoque com movimento rastreável (Backend_Requisitos §4) | Entradas, saídas e ajustes gravam linha em `stock_movements` | ✅ |
| Ajuste de estoque exige motivo e só administrador | Teste "Ajuste manual de estoque" passa | ✅ |
| Decimal de kg sem erro de ponto flutuante visível (Backend_Requisitos §5) | `0,1 + 0,2` kg entra como saldo `4.9` (arredondado em 3 casas) | ✅ |
| Escaneamento com consumo zero (Sprints/18) | `POST /productions` de escaneamento sem insumo → 201 | ✅ |
| TAG de máquina única, sem diferenciar maiúsculas (Backend_Requisitos §4) | Segunda TAG em minúsculas → 409 | ✅ |
| Remoção de máquina com histórico vira inativação (Backend_Requisitos §5) | `DELETE /machines/:id` com histórico marca `inativa` | ✅ |
| Manutenção preventiva recalcula próximo vencimento em 30 dias (Sprints/3, mensal) | Manutenção em 2026-10-19 → próxima em 2026-11-18 | ✅ |
| Equipamento portátil guarda todos os campos do formulário (Backend_Requisitos §3 e §11) | `category`, `serialNumber`, `location`, `condition`, `accessories` são gravados no backend | ✅ (no API; a tela ainda não usa) |
| Recuperação de senha restrita a Técnico por pergunta de segurança (decisão da equipe) | Administrador → 403; Técnico → recebe pergunta e redefine a senha | ✅ (com as falhas de segurança da seção 4) |
| Política de senha (mínimo 8, letra e número) | Validada no cadastro e na redefinição | ✅ |
| Paginação em `GET /users` no formato `{ data, page, limit, total }` (Backend_Requisitos §6) | Resposta tem esses campos | ✅ (só nesta rota) |
| `.env` e banco SQLite fora do git | `.gitignore` cobre `.env` e `data/*.sqlite`; ambos não estão versionados | ✅ |
| Frontend chama a API com base em `VITE_API_URL` (Backend_Requisitos §8.1) | `services/api.ts` lê `VITE_API_URL`; Vite tem proxy `/api` → `:3001` | ✅ (parcial) |

---

## 4. O que está errado ou faltando

Classificação: **Alta** = viola requisito de segurança ou gera dado/relatório errado; **Média** = regra ou validação faltando; **Baixa** = contrato ou melhoria; **Decisão** = depende de regra que o laboratório ainda não fechou.

### 4.1 Resumo das pendências

| ID | Tipo | Prioridade | Descrição curta |
|---|---|---|---|
| S1 ✅ | Segurança | Alta | Conta de aluno/professor com senha consegue logar |
| S2 ✅ | Segurança | Alta | CORS aceita qualquer origem com credenciais |
| S3 ✅ | Segurança | Alta | Logout não invalida o token |
| S4 ✅ | Segurança | Alta | Sem limite de tentativas de login |
| S5 ✅ | Segurança | Alta | Token de recuperação pode ser usado várias vezes |
| S6 ✅ | Segurança | Média | Recuperação de senha revela se a conta existe (e se é admin) |
| S7 ✅ | Segurança | Alta | Senhas padrão são criadas em qualquer ambiente; segredo JWT fixo no código |
| S8 ✅ | Segurança | Média | Resposta de segurança gravada em texto puro |
| R1 ✅ | Regra | Alta | Técnico registra produção em nome de outro usuário |
| R2 ✅ | Regra | Alta | Produção aceita máquina inativa, tipo incoerente e consumo em escaneamento |
| R3 ✅ | Regra | Alta | Empréstimo aceita data prevista inválida ou no passado |
| R4 ✅ | Regra | Alta | Relatórios com "até" excluem o último dia |
| R5 ✅ | Regra | Média | `reference_id` do movimento de estoque guarda o ID da máquina |
| R6 ✅ | Faltando | Média | Não existe estorno/cancelamento de produção |
| R7 ✅ | Faltando | Média | Equipamentos e insumos não podem ser editados nem inativados |
| R8 ✅ | Faltando | Média | Não há como colocar equipamento "em manutenção" |
| R9 | Regra | Baixa | Relatórios "mensais" não agrupam por mês; dashboard sem período |
| V1 ✅ | Validação | Média | Entrada inválida devolve HTTP 500 |
| V2 ✅ | Validação | Média | Valores negativos aceitos (saldo inicial, custo de manutenção) |
| C1 | Contrato | Baixa | Datas sem ISO 8601 com fuso |
| C2 | Contrato | Baixa | Listagens sem paginação (só `/users` pagina) |
| D1 | Decisão | Decisão | Técnico vê e-mail, matrícula e telefone de todos |
| D2 | Decisão | Decisão | Cadastro público ativa Técnico sem verificar o e-mail |

### 4.2 Segurança

#### S1 — Conta de aluno/professor consegue entrar no sistema (Alta)

- **Status:** corrigido. Conta de aluno/professor recusada no login (403 `ROLE_NOT_ALLOWED`) e no middleware. Também recusada em tokens já emitidos. Coberto por teste em `Implementacao/backend/tests/api.test.ts`.

- **Era para ser:** só Administrador e Técnico autenticam; Cliente não tem login (Sprints/2; README).
- **Está sendo feito:** `auth.service.ts:35` compara o perfil só quando o cliente envia `role` no corpo. Qualquer conta com senha entra e recebe token. O middleware (`auth.ts`) também aceita qualquer perfil.
- **Como ver:**

```bash
curl -s -X POST $API/users -H "Authorization: Bearer $ADM" -H 'Content-Type: application/json' \
  -d '{"name":"Aluno Teste","email":"aluno1@unicap.br","role":"aluno","registration":"R001","password":"Senha1234"}'
curl -s -o /dev/null -w '%{http_code}\n' -X POST $API/auth/login -H 'Content-Type: application/json' \
  -d '{"email":"aluno1@unicap.br","password":"Senha1234"}'
```

- **Resultado atual:** `200` (com token). **Esperado:** `403`.
- **Correção:** recusar login quando `role` não for `administrador` ou `tecnico`, e validar o mesmo no `authenticateToken`.

#### S2 — CORS aceita qualquer origem com credenciais (Alta)

- **Status:** corrigido. CORS restrito à lista `CORS_ORIGINS` (padrão: `localhost:3000`). Coberto por teste em `Implementacao/backend/tests/api.test.ts`.

- **Era para ser:** "CORS restrito ao domínio do frontend" (Backend_Requisitos §7).
- **Está sendo feito:** `app.ts:18` usa `cors({ origin: true, credentials: true })`, que reflete a origem de quem pede.
- **Como ver:**

```bash
curl -si $API/health -H 'Origin: https://site-malicioso.exemplo' | grep -i access-control-allow-origin
```

- **Resultado atual:** `Access-Control-Allow-Origin: https://site-malicioso.exemplo`. **Esperado:** nada, ou apenas a origem do frontend (ex.: `http://localhost:3000`).

#### S3 — Logout não invalida o token (Alta)

- **Status:** corrigido. Logout revoga o token (`revoked_tokens`); tokens revogados devolvem 401 `TOKEN_REVOKED`. Tokens emitidos antes desta correção não têm identificador de sessão e precisam de novo login. Coberto por teste em `Implementacao/backend/tests/api.test.ts`.

- **Era para ser:** "logout real", com "expiração/revogação de sessão" (Backend_Requisitos §7).
- **Está sendo feito:** `auth.controller.ts:68-70` só responde `200`. O token JWT (validade de 7 dias, `.env.example`) continua valendo.
- **Como ver:**

```bash
curl -s -X POST $API/auth/logout -H "Authorization: Bearer $TEC"
curl -s -o /dev/null -w '%{http_code}\n' $API/auth/me -H "Authorization: Bearer $TEC"
```

- **Resultado atual:** `200`. **Esperado:** `401`.
- **Correção:** lista de revogação (ou versão de sessão no usuário) e checagem no middleware; ou reduzir a validade e usar cookie `HttpOnly`.

#### S4 — Sem limite de tentativas de login (Alta)

- **Status:** corrigido. Após 5 falhas por conta ou 20 por IP em 15 minutos, login devolve 429 `TOO_MANY_ATTEMPTS`. Contadores ficam em memória e zeram ao reiniciar o servidor. Coberto por teste em `Implementacao/backend/tests/api.test.ts`.

- **Era para ser:** "limitação de tentativas de login" (Backend_Requisitos §7).
- **Está sendo feito:** nada no código de login; nenhum middleware de limite.
- **Como ver:**

```bash
for i in $(seq 15); do curl -s -o /dev/null -w '%{http_code} ' -X POST $API/auth/login \
  -H 'Content-Type: application/json' -d '{"email":"tecnico.musarq@unicap.br","password":"x"}'; done; echo
```

- **Resultado atual:** `401 401 401 ...` (sempre). **Esperado:** após algumas tentativas, `429`.
- **Correção:** `express-rate-limit` ou contador de falhas por conta e por IP.

#### S5 — Token de recuperação pode ser usado mais de uma vez (Alta)

- **Status:** corrigido. Token de recuperação é de uso único: após a redefinição, é revogado. Coberto por teste em `Implementacao/backend/tests/api.test.ts`.

- **Era para ser:** "token aleatório, curto prazo de validade, **uso único**" (Backend_Requisitos §7).
- **Está sendo feito:** o token é um JWT de 15 minutos (`auth.service.ts:244-248`). A redefinição não o marca como usado (`auth.service.ts:256-299`).
- **Como ver:**

```bash
RT=$(curl -s -X POST $API/auth/forgot-password/verify-answer -H 'Content-Type: application/json' \
  -d '{"email":"tecnico.musarq@unicap.br","answer":"Rex"}' | node -pe 'JSON.parse(require("fs").readFileSync(0)).resetToken')
for i in 1 2; do curl -s -o /dev/null -w '%{http_code} ' -X POST $API/auth/forgot-password/reset \
  -H 'Content-Type: application/json' -d "{\"email\":\"tecnico.musarq@unicap.br\",\"resetToken\":\"$RT\",\"newPassword\":\"Tecnico@123\"}"; done; echo
```

- **Resultado atual:** `200 200`. **Esperado:** `200 401`.
- **Correção:** guardar o `jti` do token usado (ou um hash do token) em tabela e recusar reuso.

#### S6 — Recuperação de senha revela se a conta existe (Média)

- **Status:** corrigido. E-mail inexistente, de administrador e de aluno recebem a mesma resposta (pergunta-isca para contas que não são técnicos). Administrador deixa de receber a mensagem específica de recuperação restrita. A conta inativa também só é revelada após a senha. Coberto por teste em `Implementacao/backend/tests/api.test.ts`.


- **Era para ser:** "resposta que não enumere contas" e "mensagens que não revelem se um e-mail existe" (Backend_Requisitos §7).
- **Está sendo feito:** `auth.service.ts:183-185` responde `404` com "E-mail não encontrado" para e-mail inexistente, e `200` com a pergunta para e-mail existente. Além disso, `auth.service.ts:187-194` revela que a conta é de administrador.
- **Como ver:**

```bash
curl -s -X POST $API/auth/forgot-password/verify-email -H 'Content-Type: application/json' -d '{"email":"tecnico.musarq@unicap.br"}'
curl -s -X POST $API/auth/forgot-password/verify-email -H 'Content-Type: application/json' -d '{"email":"nao.existe@unicap.br"}'
```

- **Resultado atual:** primeira `200` com pergunta; segunda `404 USER_NOT_FOUND`.
- **Correção:** mesma resposta para qualquer e-mail (ex.: "se a conta existir, enviaremos as instruções").

Também em `auth.service.ts:26-28`, a conta inativa é recusada **antes** de comparar a senha. Quem não tem a senha descobre o status da conta:

```bash
curl -s -X POST $API/auth/login -H 'Content-Type: application/json' -d '{"email":"<conta-inativa>","password":"qualquer"}'
```

- **Resultado atual:** `403 ACCOUNT_INACTIVE` mesmo com senha errada. **Esperado:** `401` genérico.

#### S7 — Senhas padrão em qualquer ambiente e segredo JWT fixo no código (Alta)

- **Status:** corrigido. Em `NODE_ENV=production`, o servidor não inicia sem `JWT_SECRET` e não cria contas padrão. Fora de produção, o segredo de desenvolvimento só é usado com aviso no console. Coberto por teste em `Implementacao/backend/tests/api.test.ts`.

- **Era para ser:** "Remover credenciais mockadas antes de disponibilizar em produção"; "seed de desenvolvimento isolado"; "Dados seed ... nunca carregados em produção" (Backend_Requisitos §7 e §10).
- **Está sendo feito:**
  - `server.ts:6` chama `seedDatabase()` sempre, sem checar `NODE_ENV`. Em produção seria criado `admin.musarq@unicap.br` com senha `Admin@123`, que aparece no README e no `.env.example`.
  - `config/env.ts:14` usa como padrão um segredo fixo do código (`labmu_super_secret_jwt_key_2026_musarq`). Se `JWT_SECRET` não for definido, quem lê o repositório consegue forjar tokens válidos.
- **Como ver:** leitura de `server.ts`, `seed.ts` e `config/env.ts`. Para confirmar o seed, rode com `NODE_ENV=production PORT=3056 DATABASE_FILE=./data/prod-teste.sqlite npm run dev` e faça login com `Admin@123`.
- **Correção:** só semear se `NODE_ENV !== 'production'`; exigir `JWT_SECRET` no boot e falhar se não existir.

#### S8 — Resposta de segurança em texto puro (Média)

- **Status:** corrigido. Resposta de segurança normalizada e guardada com bcrypt. Contas antigas com texto puro são aceitas e migradas no primeiro uso. Coberto por teste em `Implementacao/backend/tests/api.test.ts`.

- **Era para ser:** o mesmo cuidado de hash usado para senha. Backend_Requisitos §11 pede que segredos não sejam expostos.
- **Está sendo feito:** a coluna `users.security_answer` guarda a resposta em texto (`schema.sql:13`). A comparação é feita em minúsculas (`auth.service.ts:239-240`).
- **Como ver:** `sqlite3 Implementacao/backend/data/teste.sqlite "select email, security_answer from users"` (requer o CLI do sqlite3).
- **Correção:** guardar com `bcrypt` como a senha.

### 4.3 Regras de negócio

#### R1 — Técnico registra produção em nome de outro usuário (Alta)

- **Status:** corrigido. Coberto por teste automatizado em `Implementacao/backend/tests/api.test.ts`.

- **Era para ser:** o técnico responsável é quem registra, e o relatório "Técnico responsável correto" deve bater com quem operou (Sprints/18).
- **Está sendo feito:** `production.controller.ts:34-35` usa `req.body.technicianId` antes do usuário logado. E `production.service.ts:103-106` só confere se o ID existe, sem checar perfil.
- **Como ver:**

```bash
curl -s -X POST $API/productions -H "Authorization: Bearer $TEC" -H 'Content-Type: application/json' \
  -d '{"type":"impressao_3d","description":"Teste","machineId":"mach-1","technicianId":"usr-admin-musarq","supplyConsumed":0}'
```

- **Resultado atual:** `201`, com `technician_name: "Administrador MUSARQ"`. **Esperado:** `403`, ou o técnico logado como responsável.
- **Correção:** usar sempre `req.user.id` no técnico, ou aceitar `technicianId` só para administrador.

#### R2 — Produção aceita máquina inativa, tipo incoerente e consumo em escaneamento (Alta)

- **Status:** corrigido. Coberto por teste automatizado em `Implementacao/backend/tests/api.test.ts`.

- **Era para ser:** "Máquina correta" (Sprints/18); "Quando houver uso de scanner, o insumo consumido pode ser zero" (regra de scanner com consumo zero); máquina inativa não deveria produzir.
- **Está sendo feito:** `production.service.ts:98-101` só confere se a máquina existe. Não olha `status` nem `type`.
- **Como ver:**

```bash
# máquina inativa
curl -s -X PATCH $API/machines/mach-1 -H "Authorization: Bearer $ADM" -H 'Content-Type: application/json' -d '{"status":"inativa"}' >/dev/null
curl -s -o /dev/null -w '%{http_code}\n' -X POST $API/productions -H "Authorization: Bearer $TEC" -H 'Content-Type: application/json' \
  -d '{"type":"impressao_3d","description":"Em máquina inativa","machineId":"mach-1","supplyConsumed":0}'
curl -s -X PATCH $API/machines/mach-1 -H "Authorization: Bearer $ADM" -H 'Content-Type: application/json' -d '{"status":"ativa"}' >/dev/null

# impressão 3D numa máquina do tipo scanner
curl -s -o /dev/null -w '%{http_code}\n' -X POST $API/productions -H "Authorization: Bearer $TEC" -H 'Content-Type: application/json' \
  -d '{"type":"impressao_3d","description":"Impressão no scanner","machineId":"mach-5","supplyConsumed":0}'

# escaneamento com consumo de insumo
curl -s -o /dev/null -w '%{http_code}\n' -X POST $API/productions -H "Authorization: Bearer $TEC" -H 'Content-Type: application/json' \
  -d '{"type":"escaneamento","description":"Scan","machineId":"mach-5","supplyId":"sup-1","supplyConsumed":1}'
```

- **Resultado atual:** `201`, `201`, `201`. **Esperado:** `400` nos três casos.
- **Correção:** validar `machine.status === 'ativa'`; validar compatibilidade `impressao_3d` ↔ `printer_3d_*` e `escaneamento` ↔ `scanner`; para escaneamento, exigir consumo zero (ou aceitar só se for uma decisão do laboratório).

#### R3 — Empréstimo aceita data prevista inválida ou no passado (Alta)

- **Status:** corrigido. Coberto por teste automatizado em `Implementacao/backend/tests/api.test.ts`.

- **Era para ser:** "Um empréstimo ativo deve ter responsável e data prevista" (Backend_Requisitos §5).
- **Está sendo feito:** `loans.service.ts:74-76` só confere se o campo foi enviado. Não valida formato nem se a data é futura. A data `abc` é gravada como está.
- **Como ver:**

```bash
EQ=$(curl -s -X POST $API/equipment -H "Authorization: Bearer $TEC" -H 'Content-Type: application/json' \
  -d '{"name":"Tablet Teste","code":"TB-01"}' | node -pe 'JSON.parse(require("fs").readFileSync(0)).item.id')
curl -s -X POST $API/loans -H "Authorization: Bearer $TEC" -H 'Content-Type: application/json' \
  -d "{\"equipmentId\":\"$EQ\",\"responsibleName\":\"Teste\",\"dueDate\":\"abc\"}"
```

- **Resultado atual:** `201`, `due_date: "abc"`. **Esperado:** `400 VALIDATION_ERROR`.
- **Também:** `dueDate: "2020-01-01"` retorna `201` com status `atrasado` logo na criação. Aceitar prazo no passado pode ser intencional (regularizar empréstimo antigo), mas precisa de decisão e de validação de formato.
- **Correção:** validar formato ISO (`AAAA-MM-DD` ou com hora e fuso) e, se a regra for essa, data não anterior a hoje.

#### R4 — Relatórios com "até" excluem o último dia (Alta)

- **Status:** corrigido. Coberto por teste automatizado em `Implementacao/backend/tests/api.test.ts`.

- **Era para ser:** "Relatório reflete o período e filtro escolhido" (Testes_de_Qualidade).
- **Está sendo feito:** `created_at` é gravado como `2026-10-19 12:22:37`. Quando o filtro é só a data (`to=2026-10-19`), a comparação `created_at <= '2026-10-19'` deixa de fora tudo o que aconteceu no dia. Acontece em `reports.service.ts:24-27` (produção), `106-109` (estoque), `139-141` (empréstimos) e `180-182` (manutenções).
- **Como ver** (substitua pela data de hoje):

```bash
HOJE=$(date +%F)
curl -s "$API/reports/production?from=$HOJE" -H "Authorization: Bearer $TEC" | node -pe 'JSON.parse(require("fs").readFileSync(0)).metrics.totalJobs'
curl -s "$API/reports/production?from=$HOJE&to=$HOJE" -H "Authorization: Bearer $TEC" | node -pe 'JSON.parse(require("fs").readFileSync(0)).metrics.totalJobs'
```

- **Resultado atual (com 17 produções de hoje):** `17` e depois `0`. **Esperado:** `17` nos dois casos.
- **Correção:** para `to` de data pura, comparar com `< date(to, '+1 day')`, ou usar `date(created_at) <= ?`.

#### R5 — `reference_id` do movimento de estoque guarda o ID da máquina (Média)

- **Status:** corrigido. Coberto por teste automatizado em `Implementacao/backend/tests/api.test.ts`.

- **Era para ser:** "gravar o movimento com referência ao registro de produção" (Backend_Requisitos §5, `production_records`).
- **Está sendo feito:** `production.service.ts:159` grava `data.machineId` na coluna `reference_id`.
- **Como ver:** após uma produção com consumo, `curl -s "$API/supplies/movements?supplyId=sup-1" -H "Authorization: Bearer $TEC"` mostra `reference_id: "mach-1"` no movimento `saida_producao`.
- **Correção:** gravar o ID da produção (já gerado em `production.service.ts:164`, mas usado só depois da inserção do movimento).

#### R6 — Não existe estorno nem cancelamento de produção (Média)

- **Status:** corrigido. `POST /productions/:id/cancel` (técnico responsável ou administrador) grava movimento `estorno`, devolve o insumo e tira a produção dos relatórios. Relatórios de consumo descontam os estornos. Coberto por teste em `Implementacao/backend/tests/api.test.ts`.

- **Era para ser:** "Definir política para produção cancelada, quantidade corrigida e estorno" (Backend_Requisitos §5 e §11, pergunta 5). O schema já prevê `status = 'cancelada'` (`schema.sql:116`) e o tipo `movement 'estorno'`.
- **Está sendo feito:** `production.routes.ts` só tem `GET` e `POST`. Não há rota para cancelar nem para estornar; o consumo, uma vez debitado, não volta.
- **Como ver:** `curl -s -o /dev/null -w '%{http_code}\n' -X PATCH $API/productions/<id> -H "Authorization: Bearer $TEC"` → `404 ROUTE_NOT_FOUND`.
- **Correção:** ação explícita `POST /productions/:id/cancel`, que grava movimento `estorno` na mesma transação.

#### R7 — Equipamentos e insumos não podem ser editados nem inativados (Média)

- **Status:** corrigido. `PATCH /equipment/:id` e `PATCH /supplies/:id` editam; equipamento e insumo podem ser inativados (`active: false` em insumos). Insumo inativo não recebe consumo (`SUPPLY_INACTIVE`). Coberto por teste em `Implementacao/backend/tests/api.test.ts`.

- **Era para ser:** "CRUD de ... máquinas, equipamentos portáteis e suprimentos" (Backend_Requisitos §11, Etapa 2); "Cadastro e listagem funcionais dos principais domínios" (Sprints/8, Sprint 3).
- **Está sendo feito:** `equipment.routes.ts` tem `GET` e `POST`. `supplies.routes.ts` tem `GET` e `POST`. Não existe `PATCH` nem inativação.
- **Como ver:** `curl -s -o /dev/null -w '%{http_code}\n' -X PATCH $API/equipment/<id> -H "Authorization: Bearer $ADM"` → `404`.
- **Correção:** `PATCH` e campo `status` (ativo/inativo) para ambos, com inativação no lugar de exclusão quando houver histórico.

#### R8 — Não há como colocar equipamento "em manutenção" (Média)

- **Status:** corrigido. `PATCH /equipment/:id/status` define `disponivel`, `manutencao` ou `inativo`. Empréstimo recusa equipamento indisponível (`EQUIPMENT_UNAVAILABLE`), e a mudança é recusada com empréstimo ativo (`EQUIPMENT_IN_USE`). Coberto por teste em `Implementacao/backend/tests/api.test.ts`.

- **Era para ser:** o schema prevê `portable_equipment.status` com `manutencao` e `inativo` (`schema.sql:85`), e o empréstimo não deveria sair de item indisponível.
- **Está sendo feito:** nenhuma rota altera esse status. `loans.service.ts:80-83` não olha o status do equipamento, então quando houver como definir, a checagem já precisa existir.
- **Correção:** ligada a R7; checar `status` em `checkoutLoan`.

#### R9 — Relatórios "mensais" sem agrupamento mensal; dashboard sem período (Baixa)

- **Status:** parcial. `GET /reports/production-by-technician?groupBy=month` agrupa por mês. O dashboard ainda não aceita período. Coberto por teste em `Implementacao/backend/tests/api.test.ts`.

- **Era para ser:** "Relatório de Produção Mensal por Técnico", "Relatório de Consumo Mensal de Estoque", "Relatório Mensal de Empréstimos" (Funcionalidades 9, 10, 11); `GET /dashboard/summary?from=&to=` (Backend_Requisitos §6).
- **Está sendo feito:** os relatórios aceitam período e devolvem um total único (`reports.service.ts`). Não agrupam por mês. O dashboard não aceita período.
- **Como ver:** `curl -s "$API/reports/production-by-technician?from=2026-01-01&to=2026-12-31" -H "Authorization: Bearer $TEC"` devolve uma linha por técnico, sem coluna de mês.

### 4.4 Validação de entrada

#### V1 — Entrada inválida devolve HTTP 500 (Média)

- **Status:** corrigido também para enums explícitos: perfil, situação, tipo e status de máquina, usuário e manutenção são validados nos serviços, com código específico (`INVALID_ROLE`, `INVALID_MAINTENANCE_TYPE`, etc.). Coberto por teste em `Implementacao/backend/tests/api.test.ts`.


- **Era para ser:** `400` ou `422` para validação, `500` só para erro inesperado (Backend_Requisitos §6).
- **Está sendo feito:** `errorHandler.ts:33` converte só erros de `UNIQUE`. Violação de `CHECK` (ex.: tipo fora da lista) e `SyntaxError` do JSON caem em `500`. Também `req.body` ausente gera `TypeError` → `500`. Datas inválidas quebram em `maintenance.service.ts:119-121` (`RangeError` no `toISOString`).
- **Como ver:**

```bash
curl -s -X POST $API/users -H "Authorization: Bearer $ADM" -H 'Content-Type: application/json' \
  -d '{"name":"Fulano X","email":"x@unicap.br","role":"hacker","registration":"H1"}'          # 500 (esperado 400)
curl -s -X POST $API/productions -H "Authorization: Bearer $TEC" -H 'Content-Type: application/json' \
  -d '{ isto nao e json'                                                                        # 500 (esperado 400)
curl -s -X POST $API/machines -H "Authorization: Bearer $ADM"                                   # sem corpo: 500 (esperado 400)
curl -s -X POST $API/maintenances -H "Authorization: Bearer $TEC" -H 'Content-Type: application/json' \
  -d '{"machineId":"mach-1","type":"preventiva","date":"abc","description":"x"}'                  # 500 (esperado 400)
```

- **Correção:** validar enums nos serviços (`role`, `type`, `status`), tratar `SyntaxError` do JSON como `400`, e mapear `CHECK constraint failed` para `400 VALIDATION_ERROR`.

#### V2 — Valores negativos aceitos (Média)

- **Status:** corrigido. Coberto por teste automatizado em `Implementacao/backend/tests/api.test.ts`.

- **Era para ser:** "Validar no servidor limites, formatos, estados permitidos" (Backend_Requisitos §6).
- **Está sendo feito:** `supplies.service.ts:58` usa `Number(data.balance) || 0` sem checar sinal. `maintenance.service.ts:110` aceita `cost` negativo.
- **Como ver:**

```bash
curl -s -X POST $API/supplies -H "Authorization: Bearer $TEC" -H 'Content-Type: application/json' \
  -d '{"name":"Teste","type":"PLA","color":"Azul","balance":-5}'           # 201, saldo -5
curl -s -X POST $API/maintenances -H "Authorization: Bearer $TEC" -H 'Content-Type: application/json' \
  -d '{"machineId":"mach-1","type":"corretiva","date":"2026-10-19","description":"x","cost":-100}'   # 201
```

- **Correção:** `balance >= 0` e `cost >= 0`.

### 4.5 Contrato da API

#### C1 — Datas fora do ISO 8601 com fuso (Baixa)

- **Era para ser:** "Usar datas ISO 8601 com timezone (`2026-10-08T12:00:00Z`)" (Backend_Requisitos §6).
- **Está sendo feito:** `created_at` e `updated_at` saem como `2026-10-19 12:22:37` (horário UTC, sem `T` nem `Z`). Veja `production.created_at` em qualquer `GET /productions`.
- **Correção:** converter na camada de resposta para `2026-10-19T12:22:37Z`, ou gravar em ISO.

#### C2 — Listagens sem paginação (Baixa)

- **Era para ser:** "Listagens devem informar paginação: `{ data, page, limit, total }`" (Backend_Requisitos §6).
- **Está sendo feito:** só `GET /users` pagina. `GET /machines`, `/supplies`, `/equipment`, `/loans`, `/productions` e `/maintenances` devolvem tudo, com chaves diferentes (`machines`, `supplies`, `loans`...).
- **Correção:** padronizar com `page`/`limit` e formato único. Dá para deixar para depois, mas é melhor decidir antes de a SPA migrar.

### 4.6 Decisões pendentes (dependem do laboratório)

Estes dois itens não são bugs de código, mas o comportamento atual tem risco e precisa de decisão.

#### D1 — Técnico vê dados pessoais de todos os usuários

- **Está sendo feito:** `GET /users` exige só login. Um técnico recebe e-mail, matrícula e telefone de todos (`curl -s $API/users -H "Authorization: Bearer $TEC"` → `200`).
- **Pergunta de negócio (Backend_Requisitos §4, pergunta 10):** quem vê telefone, matrícula e histórico?

#### D2 — Cadastro público ativa Técnico sem verificar o e-mail

- **Está sendo feito:** `auth.service.ts:137` grava `status = 'ativo'`. Qualquer pessoa com um e-mail `@unicap.br` ganha acesso como Técnico (`POST /auth/register` → `201` e `user.status = "ativo"`).
- **Pergunta de negócio (Backend_Requisitos §4, pergunta 1):** autoativação, convite ou aprovação do Administrador? O próprio documento diz que validar o sufixo `@unicap.br` não prova a identidade.

---

## 5. Frontend (SPA `perfil_adm`)

### 5.1 Telas conectadas à API

| Tela | Situação |
|---|---|
| Login (`/login`) | ✅ Usa `api.login`. Mas tem fallback offline (F3) |
| Cadastro (`/cadastro`) | ✅ Usa `api.register`. Mas tem fallback offline com senha em texto puro (F2) |
| Recuperação de senha | ✅ Usa os três endpoints de recuperação |
| Usuários (`/usuarios`) | ❌ Usa `localStorage` (`usePersistentState` + `data/users.ts`) |
| Máquinas (`/maquinas`) | ❌ Usa `localStorage` |
| Manutenção (`/manutencao`) | ❌ Dados fixos. Não há formulário para registrar manutenção |
| Estoque (`/estoque`) e entrada (`/estoque/registrar-entrada`) | ❌ Usa `localStorage` |
| Empréstimo (`/emprestimo`) e registrar equipamento | ❌ Usa `localStorage` |
| Dashboard (`/dashboard`) | ❌ Dados fixos. `api.getDashboardSummary` existe mas não é chamado |
| Relatórios | ❌ Dados fixos. `api.getReports` existe mas não é chamado |
| Produção | ❌ Não existe tela para registrar produção |

### 5.2 Problemas

#### F1 — Apenas a autenticação usa a API (Alta)

- **Era para ser:** "Substituir `usePersistentState` por consultas/mutações à API" e "Trocar as telas de cadastro/usuários/máquinas/portáteis/estoque para os endpoints reais" (Backend_Requisitos §8.3 e §9, Etapa 2); Sprints/3 a 6.
- **Está sendo feito:** `usePersistentState` ainda é usado em 6 telas (`StockSupplyPage`, `RegisterSupplyEntryPage`, `UserManagementPage`, `MachinesPage`, `LoanEquipmentPage`, `RegisterEquipmentPage`). Os dados ficam no navegador de cada pessoa.
- **Como ver:** cadastre uma máquina na tela, abra o sistema em outro navegador (ou aba anônima): ela não aparece. Depois confira `localStorage` com a chave `labmu:users` ou `labmu:supplies`.

#### F2 — Cadastro offline grava a senha em texto puro (Alta)

- **Teste:** Teste de falha esperada (`it.fails`) em `RegisterPage.test.tsx` documenta o problema. Quando o fallback for removido, o teste passa a falhar e deve virar teste normal.

- **Era para ser:** "Remover MOCK_USERS, labmu:accounts e a senha em texto puro de RegisterPage" (Backend_Requisitos §8.4).
- **Está sendo feito:** `RegisterPage.tsx:165` guarda `password: form.password` e, em `RegisterPage.tsx:176`, grava o array inteiro em `localStorage["labmu:accounts"]`. Esse caminho roda quando o backend está fora do ar.
- **Como ver:** com o backend parado, faça um cadastro na tela e depois, no console do navegador: `localStorage.getItem("labmu:accounts")`. A senha aparece em texto puro.

#### F3 — Login offline aceita credenciais fixas do código (Alta)

- **Teste:** Teste de falha esperada (`it.fails`) em `LoginPage.test.tsx` documenta o problema. Quando o fallback for removido, o teste passa a falhar e deve virar teste normal.

- **Era para ser:** "Remover MOCK_USERS" e "O token atual `mock-token` não autentica ninguém" (Backend_Requisitos §8.4 e §11).
- **Está sendo feito:** `LoginPage.tsx:16-18` tem `MOCK_USERS` com as mesmas senhas do backend. `LoginPage.tsx:22` tem `USE_MOCK: true`. Quando o servidor não responde, o login aceita esses dados e cria sessão local.
- **Como ver:** pare o backend, abra `/login`, use `admin.musarq@unicap.br` / `Admin@123`. O acesso é concedido.

#### F4 — Token guardado em `localStorage` quando "lembrar de mim" (Média)

- **Era para ser:** "evitar `localStorage` para tokens de produção" (Backend_Requisitos §7).
- **Está sendo feito:** `session.ts:42` grava a sessão, com o token, em `localStorage` se o usuário marcar "lembrar".
- **Como ver:** marque "lembrar" no login e confira `localStorage.getItem("labmu:session")` no console. O token JWT aparece.

#### F5 — A SPA nunca valida a sessão com o servidor (Média)

- **Era para ser:** "Fazer a SPA consultar `GET /auth/me` na inicialização e tratar 401/403 centralmente" (Backend_Requisitos §8.5).
- **Está sendo feito:** `api.getMe` existe em `services/api.ts:86`, mas ninguém o chama. `Layout.tsx:13` só verifica se existe sessão no navegador. Um token revogado ou expirado continua abrindo a área interna até o usuário fazer uma requisição que falhe.

#### F6 — `VITE_API_TIMEOUT` não é usado (Baixa)

- **Era para ser:** "base `VITE_API_URL`, timeout, JSON, credenciais de sessão e tratamento de erro tipado" (Backend_Requisitos §8.1).
- **Está sendo feito:** `services/api.ts` usa `VITE_API_URL` (com fallback `/api`), mas não há `AbortController` nem timeout. `VITE_API_TIMEOUT` não é lido em lugar nenhum.

#### F7 — Sem testes automatizados no frontend (Baixa)

- **Status:** corrigido. A SPA tem 33 testes automatizados (Vitest + Testing Library) para cliente de API, sessão, login, cadastro e recuperação de senha. Rodar com `npm test` em `Implementacao/frontend/perfil_adm`.

- **Status:** corrigido. A SPA tem 33 testes automatizados (Vitest + Testing Library): cliente de API, sessão, login, cadastro e recuperação de senha. Rodar com `npm test` em `Implementacao/frontend/perfil_adm`.

- **Era para ser:** "Testes de regressão UI para login, criação de usuário, edição, registro de máquina, entrada/saída e devolução" (Backend_Requisitos §10).
- **Está sendo feito:** `package.json` da SPA não tem script `test` nem biblioteca de testes. Só há `build` e `type-check`.

#### F8 — A SPA não mostra erros de conflito nem estados de carregamento nas telas já conectadas (Baixa)

- **Era para ser:** "estados visíveis de carregamento, lista vazia, erro, retry e conflito" (Backend_Requisitos §8.6).
- **Está sendo feito:** o login e o cadastro mostram mensagem de erro vinda da API. As telas de dados não consultam a API, então não há estado de erro para elas.

---

## 6. Documentação

- **`Documentacao/Backend_Requisitos_e_Integracao.md` está desatualizado.** Afirma que "não contém um backend implementado" (§1 e §2), que `VITE_API_URL` "não é consumido" (§8), que o login "aponta para `/api/auth/login` apenas se `USE_MOCK` for desligado" e que o backend "Não existe atualmente" (§2). Hoje o backend existe e a SPA consome `VITE_API_URL`.
- **`Implementacao/backend/README.md` e a raiz `README.md`** trazem as credenciais padrão e dizem que o backend "possui transações ACID". Isso é verdade para as transações de estoque/empréstimo, mas o README não avisa que essas senhas não devem ir para produção (S7).
- **Pendências de negócio** (`Backend_Requisitos` §4, perguntas 1 a 10) continuam em aberto. Pelo código, as respostas atuais são: autoativação de Técnico (D2), Cliente sem login (não cumprido, S1), débito de estoque na criação (decisão aceita pela implementação, mas sem estorno, R6), KPIs sem fórmula documentada (R9).

---

## 7. O que não foi testado

- **Interface no navegador:** só compilei a SPA e li o código das telas. Não abri as páginas nem executei os fluxos de clique.
- **Concorrência real:** a garantia de "um empréstimo ativo" e de "saldo não negativo" vem da transação `BEGIN IMMEDIATE` do SQLite e de a API ser síncrona. Não disparei requisições paralelas para medir.
- **Carga e desempenho:** não testado.
- **Permissões de relatórios:** qualquer usuário autenticado acessa `/reports/*` e `/dashboard/summary`. Não há decisão documentada sobre isso.
- **Cobertura dos testes automatizados:** 40 testes cobrem autenticação e segurança (S1 a S7), recuperação, estoque, empréstimo (inclusive devolução), produção, cancelamento, relatórios, dashboard, matriz de permissões por perfil, cadastro e remoção de máquinas, manutenção e as regras R1 a R9 e V1 e V2. Não cobrem a interface da SPA, concorrência real, carga, nem o conteúdo numérico completo de cada relatório.

---

## 8. Ordem sugerida de correção

1. ~~**Segurança mínima (S1, S2, S3, S4, S5, S7)**~~ — corrigido. Faltam S6 (enumeração de contas em `verify-email`) e S8 (resposta de segurança em texto puro). **Próximo passo.**
2. ~~**Dados errados (R1, R2, R3, R4, R5)**~~ — corrigido.
3. ~~**Validação (V1, V2)**~~ — corrigido com tratamento central no `errorHandler` e validações nos serviços. Ainda falta validar enums de forma explícita nos serviços (`role`, `type`, `status`); hoje a violação de `CHECK` do banco devolve `400 VALIDATION_ERROR`, sem dizer qual campo.
4. **Frontend:** remover o fallback offline com senha (F2, F3), depois conectar as telas de usuários, máquinas, estoque e empréstimo à API (F1), e só então dashboard e relatórios (que dependem das regras acima).
5. **Decidir** D1 e D2 com o laboratório antes de fechar o contrato de cadastro.
6. **Atualizar** `Backend_Requisitos_e_Integracao.md` com o estado real.
