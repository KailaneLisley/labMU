# labMU — Sistema de Gestão de Equipamentos

> **Laboratório de Prototipagem do MUSARQ — Universidade Católica de Pernambuco (UNICAP)**
> **Equipe 07** | **Metodologia:** Scrum | **Tecnologias:** React + Vite + Node.js + SQLite (migração para PostgreSQL em revisão, ver seção 8)

---

## 1. Sobre o Projeto

O **labMU** é uma plataforma de gestão desenvolvida para o Laboratório de Prototipagem do **MUSARQ (Museu de Arqueologia e Ciências Naturais da UNICAP)**. O sistema centraliza as operações diárias do laboratório:

- **Controle de acessos e usuários:** administradores, técnicos e clientes.
- **Inventário de máquinas fixas:** impressoras 3D e scanners, com manutenções preventivas e corretivas.
- **Estoque de insumos:** entrada de matéria-prima (filamentos e resinas) em kg e baixa fracionada em gramas ou unidades por ordem de produção.
- **Empréstimos de equipamentos portáteis:** retirada e devolução de tablets, celulares e mesas digitalizadoras. Máquinas fixas não podem ser emprestadas.
- **Registro de produções:** histórico de peças impressas e escaneamentos, com cancelamento que devolve o insumo ao estoque.
- **Relatórios e dashboard:** indicadores operacionais e relatórios por período.

---

## 2. Arquitetura da Solução

O sistema tem duas camadas, integradas por uma API REST com autenticação JWT:

```
┌─────────────────────────────────────────────────────────────┐
│                       CLIENTE (FRONTEND)                    │
│                                                             │
│   React 18 + Vite + TypeScript + Tailwind CSS               │
│   ├── SPA com React Router v6                               │
│   ├── Comunicação somente com a API (sem modo offline)      │
│   └── Localização: Implementacao/frontend/perfil_adm        │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               │ HTTP / JSON
                               │ Header: Authorization: Bearer <JWT>
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                       SERVIDOR (BACKEND)                    │
│                                                             │
│   Node.js 22.13+ + Express 5 + TypeScript                   │
│   ├── Camadas: Routes -> Controllers -> Services            │
│   ├── Senhas com scrypt nativo; JWT com revogação no logout │
│   ├── Banco relacional SQLite (node:sqlite), com transações │
│   └── Localização: Implementacao/backend                    │
└─────────────────────────────────────────────────────────────┘
```

Em desenvolvimento, o Vite encaminha `/api` para o backend na porta 3001, então o navegador não precisa de CORS. Em produção, o backend aceita apenas as origens listadas em `CORS_ORIGINS`.

---

## 3. Perfis de Usuário e Políticas de Segurança

| Perfil | Acesso ao sistema | Criação | Recuperação de senha |
| :--- | :---: | :--- | :--- |
| **Administrador** | Sim (login e senha) | Em desenvolvimento, pelo seed. Em produção, o primeiro administrador vem de `INITIAL_ADMIN_EMAIL` e `INITIAL_ADMIN_PASSWORD`. Depois, novos administradores são criados por outro administrador. | **Restrita:** administradores não usam recuperação automática. Devem contatar o suporte (`musarq@unicap.br`). |
| **Técnico** | Sim (login e senha) | Cadastro público em `/cadastro`, com e-mail `@unicap.br`, matrícula e pergunta secreta. | **Autônoma:** 3 etapas (e-mail, resposta da pergunta secreta e nova senha). |
| **Cliente** | Não possui login | Cadastrado por técnicos ou administradores, para vincular produções e empréstimos. | Não se aplica. |

---

## 4. Módulos e Funcionalidades

1. **Autenticação e sessões:** login com JWT, rotas protegidas por perfil e logout que revoga o token no servidor.
2. **Recuperação de senha por pergunta secreta:** fluxo de 3 etapas para técnicos. A resposta é guardada com hash e tem limite de tentativas.
3. **Gestão de usuários:** listagem paginada, filtros por perfil e status, ativação e inativação.
4. **Parque de máquinas fixas:** impressoras 3D (FDM e resina) e scanners, cada um com TAG patrimonial única.
5. **Manutenções:** registro de manutenções preventivas e corretivas, com custo e técnico responsável. A conclusão devolve a máquina à operação.
6. **Estoque fracionado:** entradas em kg, com baixa automática em gramas ou unidades a cada produção. Ajustes manuais são restritos a administradores.
7. **Empréstimos de portáteis:** retirada e devolução com status calculado pelo prazo (em campo, devolução hoje, atrasado, devolvido). Equipamento em manutenção ou inativo não é emprestado.
   > **Regra de negócio:** máquinas fixas são **proibidas** de empréstimo. Só itens portáteis cadastrados podem ser retirados.
8. **Relatórios:** produção por período e por técnico (com agrupamento mensal), consumo de insumos, empréstimos e manutenções. Os relatórios exibem no máximo 500 registros detalhados, com métricas calculadas sobre todos.
9. **Dashboard:** contadores de máquinas, usuários e empréstimos, e alertas de suprimentos em nível crítico.

---

## 5. Credenciais de Desenvolvimento

Somente em **desenvolvimento**, o seed cria as contas abaixo. Em produção essas contas não existem.

| Perfil | E-mail | Senha | Pergunta secreta | Resposta |
| :--- | :--- | :--- | :--- | :--- |
| **Administrador** | `admin.musarq@unicap.br` | `Admin@123` | *Restrita* | *Restrita* |
| **Técnico** | `tecnico.musarq@unicap.br` | `Tecnico@123` | *Qual o nome do seu primeiro animal de estimação?* | `Rex` |

---

## 6. Como Executar Localmente

### Pré-requisitos
- **Node.js** 22.13 ou superior.
- **npm** 10 ou superior.
- **Git**.

### Passo 1: Backend

```bash
cd Implementacao/backend
npm install
npm run dev
```

- A API sobe em `http://localhost:3001`. Verificação: `http://localhost:3001/api/health`.
- O banco SQLite é criado em `data/labmu.sqlite` e recebe o seed de desenvolvimento na primeira execução.

### Passo 2: Frontend

Em outro terminal:

```bash
cd Implementacao/frontend/perfil_adm
npm install
npm run dev
```

- A SPA abre em `http://localhost:3000` (configurado em `vite.config.ts`).
- Para usar outra URL de API, defina `VITE_API_URL`. Sem essa variável, a SPA usa `/api`, que é encaminhado para a porta 3001.

> **Sem modo offline:** se a API estiver fora do ar, a SPA mostra a mensagem de erro. Ela não cria sessão nem grava dados localmente para contornar isso.

### Testes

| Camada | Comando | Testes |
| :--- | :--- | :---: |
| Backend (API) | `cd Implementacao/backend && npm test` | 47 |
| Frontend (componentes e serviços) | `cd Implementacao/frontend/perfil_adm && npm test` | 41 |
| Ponta a ponta (Playwright) | `cd Implementacao/e2e && npm test` | 32 |

O e2e sobe seu próprio backend e frontend, com banco novo a cada execução. Os demais testes não estão ligados ao banco de desenvolvimento. Para o relatório completo, ver `Documentacao/Relatorio_Consolidado_de_Testes.md`.

---

## 7. Estrutura do Repositório

```
labMU/
├── README.md                                  # Este documento
│
├── Implementacao/                             # Código-fonte
│   ├── README.md                              # Visão da camada de implementação
│   ├── backend/                               # API REST (Express 5 + SQLite)
│   │   ├── README.md                          # Endpoints e regras de negócio
│   │   ├── src/README.md                      # Arquitetura interna
│   │   └── tests/                             # Testes automatizados da API
│   ├── frontend/
│   │   ├── README.md                          # Visão geral do frontend
│   │   ├── perfil_adm/                        # SPA oficial (React 18 + Vite + Tailwind)
│   │   ├── login_adm/                         # Protótipo estático de login (histórico)
│   │   └── cadastro_adm/                      # Protótipo do componente de cadastro (histórico)
│   ├── e2e/                                   # Testes ponta a ponta (Playwright)
│   └── testes-nao-funcionais/                 # Carga, stress, segurança e smoke
│
└── Documentacao/                              # Especificação, planejamento e relatórios
    ├── README.md                              # Índice da documentação
    ├── Backend_Requisitos_e_Integracao.md     # Requisitos, contratos e estado atual do backend
    ├── Relatorio_Consolidado_de_Testes.md     # Visão atual dos testes (23/11/2026)
    └── Projetos/Sprints/                      # Documentação das sprints da Equipe 07
```

---

## 8. Situação de Deploy e Migração

**Migração do banco (PR #120, em revisão):** o backend está sendo migrado de SQLite para PostgreSQL (Supabase). A migração já passa na CI (backend, frontend e e2e), mas ainda não foi mesclada na `main`. Até lá, esta documentação descreve o código da `main`, que usa SQLite.

**Situação observada em 23/11/2026:**
- Backend no Render (`labmu-api.onrender.com`): sem resposta.
- Frontend de produção na Vercel (`labmu.vercel.app`): deployment não encontrado.
- Preview da branch da migração: backend respondendo em `/api/health`.

**Como publicar (quando o serviço estiver disponível):**

- **Backend no Render:** o `render.yaml` na raiz descreve o Web Service (build `npm install && npm run build`, start `npm start`, Node 22.13 ou superior e health check em `/api/health`). Configure no painel:
  - `CORS_ORIGINS`: URL exata do frontend, sem barra final (ex.: `https://labmu.vercel.app`).
  - `INITIAL_ADMIN_EMAIL` e `INITIAL_ADMIN_PASSWORD`: primeiro administrador. A senha precisa ter ao menos 8 caracteres, com letras e números. O administrador é criado só se ainda não existir nenhum.
  - `JWT_SECRET` é gerado pelo blueprint. Em produção o servidor não sobe sem ele.
  - Atenção: o SQLite fica no disco do serviço. No plano gratuito o disco é efêmero, e os dados se perdem a cada deploy ou reinício.
- **Frontend na Vercel:** *Root Directory* `Implementacao/frontend/perfil_adm`, framework Vite, build `npm run build`, saída `dist`. Defina `VITE_API_URL` com a URL do backend (sem barra final). A variável é embutida no build, então é preciso fazer um novo deploy ao alterá-la. O `vercel.json` redireciona as rotas para `index.html`.
- **Ordem:** suba o backend, copie a URL dele para `VITE_API_URL` na Vercel e, depois, copie a URL da Vercel para `CORS_ORIGINS` no Render.

---

## 9. Equipe de Desenvolvimento (Equipe 07)

Projeto desenvolvido na disciplina de Engenharia de Software da Universidade Católica de Pernambuco:

- Arthur Amaral
- Christian Araújo
- Lucas Mendes
- Quezia Costa
- Kailane Lisley
