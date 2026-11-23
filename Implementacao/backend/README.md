# labMU — Backend (API REST)

API REST para a gestão operacional do Laboratório de Prototipagem do MUSARQ/UNICAP. Construída em **Node.js 22.13+** com **TypeScript**, **Express 5**, banco **SQLite** (`node:sqlite`), autenticação **JWT** e senhas com **scrypt nativo**.

> **Migração em revisão:** o PR #120 troca o SQLite por PostgreSQL (Supabase). Esta documentação descreve o código da branch `main`, que ainda usa SQLite.

---

## 1. Como executar

```bash
cd Implementacao/backend
npm install
npm run dev        # desenvolvimento, porta 3001
```

- Health check: `http://localhost:3001/api/health`.
- Em desenvolvimento, o banco `data/labmu.sqlite` é criado e recebe o seed com as contas de teste.
- Em produção (`NODE_ENV=production`) não há seed. Veja a seção 2.

```bash
npm test           # 47 testes (ver seção 5)
npx tsc --noEmit   # verificação de tipos
npm run build      # gera dist/
npm start          # roda dist/server.js
```

---

## 2. Variáveis de ambiente

| Variável | Padrão | Uso |
| :--- | :--- | :--- |
| `PORT` | `3001` | Porta HTTP |
| `NODE_ENV` | `development` | Em `production`: exige `JWT_SECRET` e não cria contas padrão |
| `JWT_SECRET` | segredo de desenvolvimento | Obrigatório em produção |
| `JWT_EXPIRES_IN` | `7d` | Validade do token |
| `DATABASE_FILE` | `./data/labmu.sqlite` | Arquivo SQLite |
| `CORS_ORIGINS` | `http://localhost:3000,http://127.0.0.1:3000` | Origens permitidas, separadas por vírgula |
| `TRUST_PROXY` | `1` em produção, `0` fora | Número de proxies à frente (necessário no Render) |
| `INITIAL_ADMIN_EMAIL` / `INITIAL_ADMIN_PASSWORD` | — | Primeiro administrador em produção. Só é criado se não houver nenhum administrador. A senha precisa ter 8 ou mais caracteres, com letras e números |
| `DEFAULT_ADMIN_EMAIL` / `DEFAULT_ADMIN_PASSWORD` (e `DEFAULT_TECH_*`) | contas padrão | Usadas só no seed de desenvolvimento |

---

## 3. Contas de desenvolvimento

Criadas pelo seed quando o servidor sobe em modo de desenvolvimento:

| Perfil | E-mail | Senha | Pergunta secreta | Resposta |
| :--- | :--- | :--- | :--- | :--- |
| Administrador | `admin.musarq@unicap.br` | `Admin@123` | Restrita | Restrita |
| Técnico | `tecnico.musarq@unicap.br` | `Tecnico@123` | Qual o nome do seu primeiro animal de estimação? | `Rex` |

Essas contas não existem em produção.

---

## 4. Regras de negócio e segurança

1. **Administrador não se cadastra:** não há rota pública para criar administradores. O primeiro é criado pelo seed (desenvolvimento) ou por `INITIAL_ADMIN_*` (produção).
2. **Recuperação de senha:**
   - Técnicos informam o e-mail, respondem à pergunta secreta e definem nova senha. O token de redefinição é de uso único.
   - Administradores recebem `403 ADMIN_RECOVERY_RESTRICTED` na rota automática e precisam pedir a redefinição ao suporte (`POST /api/auth/forgot-password/admin/request`).
   - E-mails sem técnico recebem a mesma pergunta-isca e a mesma resposta de erro, para não revelar quais contas existem.
3. **Limite de tentativas:** 5 falhas de login por conta ou 20 por IP em 15 minutos (`429 TOO_MANY_ATTEMPTS`). A resposta de segurança também tem limite próprio. Os contadores ficam em memória.
4. **Sessão:** logout revoga o token no banco (`revoked_tokens`). Token revogado devolve `401 TOKEN_REVOKED`.
5. **Perfis que autenticam:** só `administrador` e `tecnico`. Conta de aluno ou cliente devolve `403 ROLE_NOT_ALLOWED`.
6. **Máquinas fixas não são emprestadas:** só itens de `portable_equipment` entram em empréstimos.
7. **Consumo fracionado:** insumos são comprados em kg e debitados em gramas ou unidades por produção, em transação. Produção cancelada devolve o consumo com movimento `estorno`.
8. **Senhas e respostas de segurança:** guardadas com scrypt. Hashes bcrypt antigos continuam válidos e são regravados em scrypt no primeiro login bem-sucedido.

---

## 5. Testes

Arquivos em `tests/`:

- **`api.test.ts` (45 testes):** sobe o app Express e chama as rotas por HTTP. Cobre:
  - autenticação, cadastro, recuperação de senha e bloqueio por tentativas;
  - segurança (S1 a S9): CORS, logout, conta inativa, `JWT_SECRET` obrigatório em produção, seed desligado em produção, migração de hash;
  - estoque, produção e cancelamento, com validações de consumo, duração e máquina;
  - empréstimos: data inválida, status pelo fuso de Recife, devolução, equipamento em manutenção;
  - manutenção, máquinas, equipamentos e insumos (edição e inativação);
  - permissões por perfil em cada rota e 401 sem token;
  - relatórios e dashboard, incluindo filtro "até" inclusivo e agrupamento mensal;
  - validação: enums, JSON malformado, valores negativos, mensagens de violação de `CHECK`.
- **`errorHandler.test.ts` (2 testes):** tratamento de erros centralizado.

`npm test` recria `data/test-labmu.sqlite` antes de cada execução. O banco de desenvolvimento não é usado.

---

## 6. Catálogo de endpoints

Os acessos abaixo seguem o código das rotas. Quando um router tem `use(requireRole(...))`, a restrição vale para todas as suas rotas.

### 6.1 Autenticação

| Método | Endpoint | Descrição | Acesso |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Login com e-mail e senha; devolve JWT | Público |
| `POST` | `/api/auth/register` | Cadastro público de técnico (`@unicap.br`, com pergunta secreta) | Público |
| `GET` | `/api/auth/me` | Dados do usuário autenticado | Autenticado |
| `POST` | `/api/auth/logout` | Revoga o token atual | Autenticado |
| `POST` | `/api/auth/forgot-password/verify-email` | Identifica o técnico e devolve a pergunta secreta | Público |
| `POST` | `/api/auth/forgot-password/verify-answer` | Valida a resposta e emite o token de redefinição | Público |
| `POST` | `/api/auth/forgot-password/reset` | Redefine a senha com o token de uso único | Público |
| `POST` | `/api/auth/forgot-password/admin/request` | Pedido de redefinição para administrador | Público |

### 6.2 Usuários

| Método | Endpoint | Descrição | Acesso |
| :--- | :--- | :--- | :--- |
| `PATCH` | `/api/users/me` | Atualiza o próprio perfil | Autenticado |
| `GET` | `/api/users` | Lista com paginação e filtros (`q`, `role`, `status`) | Administrador |
| `GET` | `/api/users/:id` | Detalhe de um usuário | Administrador |
| `POST` | `/api/users` | Cria usuário (administrador, técnico ou cliente) | Administrador |
| `PATCH` | `/api/users/:id` | Atualiza dados cadastrais | Administrador |
| `PATCH` | `/api/users/:id/status` | Ativa ou inativa | Administrador |

### 6.3 Máquinas fixas

| Método | Endpoint | Descrição | Acesso |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/machines` | Lista máquinas, com filtros | Autenticado |
| `GET` | `/api/machines/:id` | Detalhe de uma máquina | Autenticado |
| `POST` | `/api/machines` | Cadastra máquina (TAG única) | Administrador ou técnico |
| `PATCH` | `/api/machines/:id` | Atualiza status, local e observações | Administrador ou técnico |
| `DELETE` | `/api/machines/:id` | Remove sem histórico; com histórico, só inativa | Administrador |

### 6.4 Manutenções

| Método | Endpoint | Descrição | Acesso |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/maintenance` | Histórico com filtros | Autenticado |
| `GET` | `/api/maintenance/:id` | Detalhe de uma manutenção | Autenticado |
| `POST` | `/api/maintenance` | Registra manutenção preventiva ou corretiva | Administrador ou técnico |
| `PATCH` | `/api/maintenance/:id` | Atualiza; a conclusão devolve a máquina à operação | Administrador ou técnico |

### 6.5 Estoque e insumos

| Método | Endpoint | Descrição | Acesso |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/supplies` | Saldos em kg, com nível de alerta | Autenticado |
| `GET` | `/api/supplies/movements` | Extrato de movimentações | Autenticado |
| `GET` | `/api/supplies/:id` | Detalhe de um insumo | Autenticado |
| `POST` | `/api/supplies` | Cadastra insumo | Administrador ou técnico |
| `POST` | `/api/supplies/entries` | Registra entrada de lote em kg | Administrador ou técnico |
| `PATCH` | `/api/supplies/:id` | Edita nome, tipo, cor, saldo mínimo; `active: false` inativa | Administrador |
| `POST` | `/api/supplies/adjustments` | Ajuste manual de saldo, com motivo | Administrador |

### 6.6 Equipamentos portáteis e empréstimos

Em ambos os routers, todas as rotas são restritas a administradores.

| Método | Endpoint | Descrição | Acesso |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/equipment` | Lista equipamentos portáteis | Administrador |
| `GET` | `/api/equipment/:id` | Detalhe de um equipamento | Administrador |
| `POST` | `/api/equipment` | Cadastra item portátil (recusa código de máquina fixa) | Administrador |
| `PATCH` | `/api/equipment/:id` | Edita dados | Administrador |
| `PATCH` | `/api/equipment/:id/status` | Define `disponivel`, `manutencao` ou `inativo` | Administrador |
| `GET` | `/api/loans` | Lista empréstimos (em campo, devolução hoje, atrasado, devolvido) | Administrador |
| `GET` | `/api/loans/:id` | Detalhe de um empréstimo | Administrador |
| `POST` | `/api/loans` | Retirada, com bloqueio de duplicidade | Administrador |
| `POST` | `/api/loans/:id/return` | Devolução; libera o equipamento | Administrador |

### 6.7 Produção

| Método | Endpoint | Descrição | Acesso |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/productions` | Lista ordens de produção | Autenticado |
| `GET` | `/api/productions/:id` | Detalhe de uma produção | Autenticado |
| `POST` | `/api/productions` | Registra produção com débito atômico no estoque. Técnico só registra em seu nome | Administrador ou técnico |
| `POST` | `/api/productions/:id/cancel` | Cancela e devolve o consumo. Técnico só cancela as próprias | Administrador ou técnico |

### 6.8 Relatórios e dashboard

| Método | Endpoint | Descrição | Acesso |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/dashboard/summary` | Contadores e alertas | Administrador |
| `GET` | `/api/reports/production` | Produção por período (métricas sobre todos; registros limitados a 500) | Administrador |
| `GET` | `/api/reports/production-by-technician` | Produção por técnico; `groupBy=month` agrupa por mês | Administrador |
| `GET` | `/api/reports/stock-consumption` | Consumo de insumos por período | Administrador |
| `GET` | `/api/reports/loans` | Estatísticas de empréstimos | Administrador |
| `GET` | `/api/reports/maintenances` | Custos e manutenções preventivas e corretivas | Autenticado |

---

## 7. Pendências conhecidas

- **Relatórios e dashboard:** o dashboard não aceita período. Os relatórios de produção por técnico aceitam `groupBy=month`.
- **Dados pessoais:** técnicos recebem e-mail, matrícula e telefone de todos os usuários em `GET /api/users`. A restrição depende de decisão do laboratório.
- **Estorno:** o cancelamento devolve o consumo ao estoque. Não há cancelamento de empréstimo.

---

## 8. Estrutura do código

Os detalhes de organização (controllers, services, banco e middlewares) estão em [`src/README.md`](src/README.md).
