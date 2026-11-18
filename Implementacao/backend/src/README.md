# 🏗️ Arquitetura Interna — Backend `src/`

Este diretório contém o código-fonte TypeScript da API RESTful do **labMU**, organizado de acordo com o padrão **Controller-Service-Route** orientado a domínios de negócio.

---

## 📂 Visão Geral dos Diretórios

```
src/
├── app.ts                         # Configuração da aplicação Express, middlewares globais e rotas
├── server.ts                      # Entrypoint serverless (Vercel): exporta o app Express, sem listen nem seed
├── localServer.ts                 # Execução local: inicializa dados (seed em dev) e abre a porta
│
├── config/                        # Configurações e variáveis de ambiente
│   └── env.ts                     # Parser centralizado de variáveis (.env) com fallbacks seguros
│
├── database/                      # Camada de persistência relacional
│   ├── postgres.ts                # Pool PostgreSQL (pg), placeholders ? → $n e transações com savepoints
│   ├── schema.sql                 # DDL do SQLite legado (somente referência; o schema ativo está em supabase/migrations/)
│   ├── seed.ts                    # Carga inicial com Administrador e Técnico padrão (desenvolvimento)
│   ├── bootstrapAdmin.ts          # Cria o primeiro administrador em produção (npm run bootstrap:admin)
│   └── migrateSqliteToPostgres.ts # Importa o SQLite legado para o PostgreSQL (npm run migrate:sqlite)
│
├── middlewares/                   # Interceptadores HTTP
│   ├── auth.ts                    # Autenticação JWT e autorização por papéis (requireRole)
│   └── errorHandler.ts            # Tratamento centralizado de erros e classe AppError
│
└── modules/                       # Módulos de domínio de negócio
    ├── auth/                      # Login, registro público, recuperação de senha e JWT
    ├── users/                     # CRUD de usuários e atualização de perfil
    ├── machines/                  # Inventário de impressoras 3D e scanners fixos
    ├── maintenance/               # Agendamento e registro de manutenções preventivas/corretivas
    ├── supplies/                  # Gestão de matéria-prima e entradas de lote em kg
    ├── equipment/                 # Inventário de equipamentos portáteis
    ├── loans/                     # Fluxo de retirada e devolução de portáteis
    ├── production/                # Ordens de produção e baixa fracionada de estoque
    ├── reports/                   # Consultas analíticas e relatórios gerenciais
    └── dashboard/                 # Agregador de métricas e indicadores operacionais
```

---

## 🏛️ Padrão Arquitetural por Módulo

Cada domínio dentro de `src/modules/<nome>/` segue uma estrutura consistente de 3 camadas:

```
Requisição HTTP
     │
     ▼
┌──────────────┐
│  *.routes.ts │ ➔ Define caminhos HTTP, métodos (GET/POST/PATCH/DELETE) e middlewares
└──────┬───────┘
       │
       ▼
┌──────────────────┐
│ *.controller.ts  │ ➔ Extrai parâmetros (params, query, body), valida entradas e formata resposta
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│  *.service.ts    │ ➔ Regras de negócio puras, cálculos, validações lógicas e queries SQL
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│  database/       │ ➔ Execução no PostgreSQL (assíncrono) com suporte a transações atômicas
└──────────────────┘
```

---

## 💾 Camada de Banco de Dados (`database/`)

O acesso ao banco usa **PostgreSQL** via `pg` (driver puro JavaScript), com um pool em `postgres.ts`. Todas as consultas são assíncronas (`await postgres.get/all/run`). As consultas são escritas com placeholders `?`, que `postgres.ts` converte para `$1, $2...` antes de enviar ao servidor.

### Transações ACID
O utilitário `postgres.transaction(async () => ...)` em `postgres.ts` implementa transações completas com suporte a *Savepoints* aninhados (`SAVEPOINT` / `RELEASE` / `ROLLBACK`), usando `AsyncLocalStorage` para que as consultas dentro do callback usem o mesmo cliente. Isso é fundamental para garantir a integridade em operações críticas:
- No registro de produção, o cadastro da ordem e o débito fracionado do estoque ocorrem na mesma transação atômica.
- No empréstimo de portáteis, a verificação de disponibilidade e a criação da retirada ocorrem sob bloqueio transacional imediato (`BEGIN IMMEDIATE;`).

---

## 🛡️ Tratamento de Erros e Exceções (`middlewares/errorHandler.ts`)

A API adota a classe padronizada `AppError`:
```typescript
throw new AppError("Mensagem explicativa para o usuário.", 400, "CODIGO_DE_ERRO");
```
O middleware intercepta erros de forma centralizada e retorna respostas JSON homogêneas:
```json
{
  "error": {
    "code": "CODIGO_DE_ERRO",
    "message": "Mensagem explicativa para o usuário."
  }
}
```
Isso garante que erros operacionais nunca derrubem o processo Node.js e forneçam diagnósticos precisos ao frontend.

