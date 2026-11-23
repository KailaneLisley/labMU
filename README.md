# labMU — Sistema de Gestão de Equipamentos

> **Laboratório de Prototipagem do MUSARQ — Universidade Católica de Pernambuco (UNICAP)**  
> **Equipe 07** | **Metodologia:** Scrum | **Tecnologias:** React + Vite + Node.js + Express + TypeScript + PostgreSQL (Supabase)

---

## 1. Sobre o Projeto

O **labMU** é uma plataforma integrada de gestão desenvolvida para o Laboratório de Prototipagem do **MUSARQ (Museu de Arqueologia e Ciências Naturais da UNICAP)**. O sistema centraliza, automatiza e audita as operações diárias do laboratório, abrangendo:

- **Controle de Acessos & Usuários:** Gestão de Administradores, Técnicos e Clientes.
- **Inventário de Máquinas Fixas:** Acompanhamento de impressoras 3D e scanners fixos com rotinas preventivas e corretivas.
- **Controle de Suprimentos & Estoque:** Entrada de matéria-prima (filamentos e resinas) em kg e baixa automática e fracionada em gramas/unidades por ordem de produção.
- **Fluxo de Empréstimos de Equipamentos Portáteis:** Controle de retirada e devolução de portáteis, com bloqueio para impedir empréstimo de máquinas fixas.
- **Registro de Produções:** Histórico de peças impressas e escaneamentos realizados.
- **Relatórios Gerenciais & Dashboard:** Indicadores, filtros e exportação de dados para relatórios operacionais.

---

## 2. Acesso à versão de demonstração

A versão publicada do labMU pode ser acessada pelo link:

<https://lab-mu-gamma.vercel.app>

**Backend / API:** <https://labmu-api.vercel.app>  
**Verificação de disponibilidade:** <https://labmu-api.vercel.app/api/health>

O endpoint de saúde deve retornar um JSON com `"status": "ok"` quando a API estiver disponível.

### Como testar

1. Acesse o [labMU — versão de demonstração](https://lab-mu-gamma.vercel.app).
2. Entre com as credenciais de demonstração fornecidas pela equipe responsável. Por segurança, usuários e senhas de produção não são publicados neste repositório.
3. Após o login, confira o Dashboard e navegue pelos módulos liberados para o perfil utilizado.
4. Verifique, preferencialmente, as telas de consulta: Usuários, Máquinas, Manutenção, Estoque, Empréstimos, Produções e Relatórios. A disponibilidade de cada módulo depende das permissões do perfil.
5. Para validar uma funcionalidade de escrita, combine previamente com a equipe responsável e utilize apenas registros de teste autorizados.
6. Ao terminar, encerre a sessão pelo sistema.

### Cuidados durante a demonstração

- Utilize somente a conta de demonstração disponibilizada pela equipe. Não compartilhe credenciais em issues, commits ou mensagens públicas.
- Prefira consultas e navegação. Não exclua, inative ou edite registros reais.
- Não registre empréstimos, devoluções, manutenções, produções ou movimentações de estoque sem autorização: essas operações alteram os dados compartilhados da demonstração.
- Não insira dados pessoais, informações institucionais sigilosas ou senhas reais.
- Se encontrar um problema, registre a tela/módulo, o passo realizado e a mensagem de erro, sem incluir senhas, tokens ou outros dados sensíveis.

### Perfis de acesso

| Perfil | Acesso |
| :--- | :--- |
| **Administrador** | Acesso às funcionalidades administrativas, incluindo Dashboard, usuários, equipamentos, empréstimos e relatórios. |
| **Técnico** | Acesso às funcionalidades operacionais permitidas, como máquinas, manutenção, estoque e perfil. |
| **Cliente** | Não possui acesso direto ao sistema; é cadastrado para vínculo a produções e empréstimos. |

O cadastro público disponível na aplicação é destinado a Técnicos e exige e-mail institucional `@unicap.br`. A criação de Administradores é restrita à equipe responsável.

---

## 3. Arquitetura da Solução

O sistema foi arquitetado em duas camadas independentes e integradas via API REST:

```
┌─────────────────────────────────────────────────────────────┐
│                       CLIENTE (FRONTEND)                    │
│                                                             │
│   React 18 + Vite + TypeScript + Tailwind CSS + Lucide UI   │
│   ├── SPA modular com React Router                          │
│   ├── Consumo da API REST com autenticação JWT              │
│   └── Diretório: Implementacao/frontend/perfil_adm          │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               │ Requisições HTTP / JSON
                               │ Authorization: Bearer <JWT>
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                       SERVIDOR (BACKEND)                    │
│                                                             │
│   Node.js 22 + Express 5 + TypeScript                       │
│   ├── Arquitetura em camadas: Routes → Controllers → Services
│   ├── Autenticação JWT e senhas protegidas com bcryptjs     │
│   ├── PostgreSQL hospedado no Supabase                      │
│   └── API publicada como Vercel Functions                   │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. Perfis de Usuário & Políticas de Segurança

| Perfil | Acesso ao Sistema | Cadastro / Criação | Recuperação de Senha |
| :--- | :---: | :--- | :--- |
| **Administrador** | Sim (Login/Senha) | Restrito à equipe responsável; não há cadastro público. | Não utiliza recuperação automática. Deve contatar a administração/suporte. |
| **Técnico** | Sim (Login/Senha) | Cadastro público institucional (`@unicap.br`), com matrícula e pergunta secreta. | Fluxo de recuperação em etapas com validação da pergunta secreta. |
| **Cliente** | Não possui login | Cadastrado por técnicos/administradores para vínculo a produções e empréstimos. | Não aplicável. |

---

## 5. Módulos e Funcionalidades Principais

1. **Autenticação & Sessões:** Login com geração de JWT, rotas protegidas e validação de cargos (`role`).
2. **Recuperação de Senha por Pergunta Secreta:** Fluxo em etapas para técnicos; recuperação automática de administradores bloqueada.
3. **Gestão de Usuários:** Listagem, filtros por perfil/status, ativação/inativação e auditoria.
4. **Parque de Máquinas (Fixas):** Controle de impressoras 3D (FDM, Resina) e scanners, com TAG patrimonial e agenda de manutenção preventiva.
5. **Gestão de Manutenções:** Abertura de chamados preventivos e corretivos com registro de custos, técnico responsável e peças trocadas.
6. **Controle de Estoque Fracionado:** Entrada de bobinas/resinas em quilogramas (kg) com abatimento automático em gramas (g) durante a produção.
7. **Empréstimos de Equipamentos Portáteis:** Retirada e devolução com cálculo de status. Máquinas fixas não podem ser emprestadas.
8. **Relatórios Gerenciais:** Produção por técnico, consumo de insumos, movimentações de empréstimos e indicadores de manutenção, com exportação CSV.
9. **Dashboard:** Indicadores e alertas operacionais consolidados.

---

## 6. Como Executar o Projeto Localmente

### Pré-requisitos

- **Node.js:** versão 22.13.0 ou superior.
- **npm:** versão 10 ou superior.
- **Git** instalado.
- Uma instância PostgreSQL acessível para desenvolvimento.

### Passo 1: Configurar e executar o Backend

```bash
cd Implementacao/backend
npm ci
```

Crie um arquivo `.env` com base no `.env.example` e configure as variáveis necessárias para o ambiente local, incluindo `DATABASE_URL`, `JWT_SECRET` e as configurações de conexão SSL quando aplicáveis. Nunca compartilhe ou versione o arquivo `.env`.

O schema do PostgreSQL deve estar aplicado ao banco antes de iniciar a API. Consulte as instruções e migrações em [Implementacao/backend/README.md](Implementacao/backend/README.md) e no diretório de migrações do projeto.

Inicie o servidor:

```bash
npm run dev
```

Por padrão, a API fica disponível em `http://localhost:3001`. O health check é `http://localhost:3001/api/health`.

### Passo 2: Configurar e executar o Frontend

Em outro terminal:

```bash
cd Implementacao/frontend/perfil_adm
npm ci
```

Configure `VITE_API_URL` no ambiente local apontando para a API, por exemplo:

```env
VITE_API_URL=http://localhost:3001/api
```

Inicie o Vite:

```bash
npm run dev
```

Acesse <http://localhost:5173>.

Para detalhes adicionais, consulte os READMEs específicos do [backend](Implementacao/backend/README.md) e do [frontend](Implementacao/frontend/perfil_adm/README.md).

---

## 7. Estrutura do Repositório

```
labMU/
├── README.md                                  # Visão geral e guia principal
├── Implementacao/
│   ├── README.md                              # Guia da camada de implementação
│   ├── backend/                               # API Node.js + TypeScript + PostgreSQL
│   │   ├── README.md                          # Documentação da API e endpoints
│   │   ├── src/                               # Código-fonte do backend
│   │   │   ├── config/                        # Variáveis de ambiente e configurações
│   │   │   ├── database/                      # Acesso ao banco e schema
│   │   │   ├── middlewares/                   # Autenticação JWT e tratamento de erros
│   │   │   └── modules/                       # Módulos de domínio
│   │   └── tests/                             # Testes automatizados da API
│   └── frontend/
│       ├── README.md                          # Visão geral do frontend
│       └── perfil_adm/                        # SPA oficial React + Vite
│           ├── README.md                      # Documentação da SPA
│           └── src/                           # Páginas, componentes e serviços
└── Documentacao/                              # Requisitos, testes e documentação Scrum
```

---

## 8. Deploy e Infraestrutura

A versão de demonstração está publicada com a seguinte arquitetura:

- **Frontend:** [Vercel](https://vercel.com/) — aplicação React/Vite.
- **Backend:** [Vercel Functions](https://vercel.com/docs/functions) — API Node.js/Express.
- **Banco de dados:** [Supabase](https://supabase.com/) — PostgreSQL.

URLs de produção:

- Frontend: <https://lab-mu-gamma.vercel.app>
- Backend: <https://labmu-api.vercel.app>
- Health check: <https://labmu-api.vercel.app/api/health>

As configurações e credenciais de produção são gerenciadas nas plataformas de hospedagem e não devem ser incluídas no repositório. Para orientações técnicas de implantação, consulte a documentação específica do backend.

---

## 9. Equipe de Desenvolvimento (Equipe 07)

Projeto desenvolvido no âmbito das disciplinas de Engenharia de Software da Universidade Católica de Pernambuco:

- **Arthur Amaral**
- **Christian Araújo**
- **Lucas Mendes**
- **Quezia Costa**
- **Kailane Lisley**
