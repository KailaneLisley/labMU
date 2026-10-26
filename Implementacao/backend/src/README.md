# 🏗️ Arquitetura Interna — Backend `src/`

Este diretório contém o código-fonte TypeScript da API RESTful do **labMU**, organizado de acordo com o padrão **Controller-Service-Route** orientado a domínios de negócio.

---

## 📂 Visão Geral dos Diretórios

```
src/
├── app.ts                         # Configuração da aplicação Express, middlewares globais e rotas
├── server.ts                      # Bootstrap do servidor HTTP e execução automática do seed
│
├── config/                        # Configurações e variáveis de ambiente
│   └── env.ts                     # Parser centralizado de variáveis (.env) com fallbacks seguros
│
├── database/                      # Camada de persistência relacional
│   ├── connection.ts              # Conexão nativa SQLite (node:sqlite) e helper de transações ACID
│   ├── schema.sql                 # DDL de criação das tabelas e índices relacionais
│   └── seed.ts                    # Carga inicial com Administrador e Técnico padrão
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
│  database/       │ ➔ Execução no banco SQLite com suporte a transações atômicas
└──────────────────┘
```

---

## 💾 Camada de Banco de Dados (`database/`)

O projeto utiliza o suporte experimental nativo do Node.js 22: **`node:sqlite` (`DatabaseSync`)**, dispensando dependências de compilação nativa C++ (como node-gyp).

### Transações ACID
O utilitário `query.transaction(fn)` em `connection.ts` implementa transações completas com suporte a *Savepoints* aninhados (`SAVEPOINT` / `RELEASE` / `ROLLBACK`). Isso é fundamental para garantir a integridade em operações críticas:
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

