#  labMU — Sistema de Gestão de Equipamentos
> **Laboratório de Prototipagem do MUSARQ — Universidade Católica de Pernambuco (UNICAP)**  
> **Equipe 07** | **Metodologia:** Scrum | **Tecnologias:** React + Vite + Node.js + SQLite

---

## 1. Sobre o Projeto

O **labMU** é uma plataforma integrada de gestão desenvolvida para o Laboratório de Prototipagem do **MUSARQ (Museu de Arqueologia e Ciências Naturais da UNICAP)**. O sistema centraliza, automatiza e audita as operações diárias do laboratório, abrangendo:

- **Controle de Acessos & Usuários:** Gestão de Administradores, Técnicos e Clientes.
- **Inventário de Máquinas Fixas:** Acompanhamento de impressoras 3D e scanners fixos com rotinas preventivas e corretivas.
- **Controle de Suprimentos & Estoque:** Entrada de matéria-prima (filamentos e resinas) em kg e baixa automática e fracionada em gramas/unidades por ordem de produção.
- **Fluxo de Empréstimos de Equipamentos Portáteis:** Controle rigoroso de retirada e devolução de portáteis (tablets, celulares, mesas digitalizadoras), com bloqueio estrito para impedir empréstimo de máquinas fixas.
- **Registro de Produções:** Histórico auditável de peças impressas e escaneamentos realizados.
- **Relatórios Gerenciais & Dashboard:** Indicadores em tempo real, filtros dinâmicos e exportação de dados para relatórios operacionais.

---

## 🏛️ 2. Arquitetura da Solução

O sistema foi arquitetado em duas camadas independentes e integradas via API REST:

```
┌─────────────────────────────────────────────────────────────┐
│                       CLIENTE (FRONTEND)                    │
│                                                             │
│   React 18 + Vite + TypeScript + Tailwind CSS + Lucide UI   │
│   ├── SPA Modular com React Router                          │
│   ├── Modo Híbrido: Conexão API REST + Fallback Offline     │
│   └── Localização: Implementacao/frontend/perfil_adm        │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               │ Requisições HTTP / JSON
                               │ Header: Authorization: Bearer <JWT>
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                       SERVIDOR (BACKEND)                    │
│                                                             │
│   Node.js 22 + Express 5 + TypeScript + node:sqlite         │
│   ├── Arquitetura em Camadas: Routes -> Controllers -> Services
│   ├── Criptografia com bcryptjs + Sessões Stateless com JWT │
│   ├── Banco de Dados Relacional SQLite com Transações ACID  │
│   └── Localização: Implementacao/backend                    │
└─────────────────────────────────────────────────────────────┘
```

---

##  3. Perfis de Usuário & Políticas de Segurança

| Perfil | Acesso ao Sistema | Cadastro / Criação | Política de Recuperação de Senha |
| :--- | :---: | :--- | :--- |
| **Administrador** |  Sim (Login/Senha) | **Exclusivo via Banco de Dados** (cadastrado previamente pela coordenação/desenvolvedores). | **Restrita:** Por segurança institucional, administradores não utilizam recuperação automática. Devem contatar o suporte técnico (`musarq@unicap.br`). |
| **Técnico** |  Sim (Login/Senha) | **Público Institucional** (`/cadastro`), exigindo e-mail `@unicap.br`, matrícula e definição de **Pergunta Secreta de Segurança**. | **Autônoma:** Validação em 3 etapas com verificação do e-mail institucional, resposta da pergunta secreta e definição de nova senha segura. |
| **Cliente** |  Não possui login | Cadastrado por técnicos/administradores para fins de vínculo a ordens de produção e empréstimos. | Não aplicável. |

---

##  4. Módulos e Funcionalidades Principais

1. **Autenticação & Sessões:** Login com geração de JWT, rotas protegidas e validação de cargos (`role`).
2. **Recuperação de Senha por Pergunta Secreta:** Fluxo em 3 passos para técnicos, com perguntas personalizadas ou pré-definidas e validação *case-insensitive*.
3. **Gestão de Usuários:** Listagem paginada, filtros por perfil/status, ativação/inativação e auditoria.
4. **Parque de Máquinas (Fixas):** Controle de impressoras 3D (FDM, Resina) e scanners. Cada equipamento possui TAG patrimonial e agenda de manutenção preventiva (30 dias).
5. **Gestão de Manutenções:** Abertura de chamados preventivos e corretivos com registro de custos, técnico responsável e peças trocadas.
6. **Controle de Estoque Fracionado:** Entrada de bobinas/resinas em quilogramas (kg) com abatimento automático e preciso em gramas (g) durante a produção.
7. **Empréstimos de Equipamentos Portáteis:** Sistema de retirada e devolução com cálculo de status (em andamento, atrasado, devolvido).  
   > ** Regra de Negócio Crucial:** Máquinas fixas de laboratório são **estritamente proibidas** de serem emprestadas. Apenas itens portáteis cadastrados no inventário de empréstimos podem ser retirados.
8. **Relatórios Gerenciais:**
   - Produção mensal consolidada por técnico.
   - Consumo periódico de insumos do estoque.
   - Estatísticas e movimentações de empréstimos.
   - Indicadores de manutenção preventiva e corretiva.
   - Exportação de dados operacionais em formato CSV.
9. **Dashboard em Tempo Real:** Cards dinâmicos com contadores de máquinas ativas, alertas de suprimentos em nível crítico e devoluções pendentes.

---

## 5. Credenciais Padrão para Início Rápido

O banco de dados SQLite inicializa com dados pré-carregados (*seed*):

| Perfil | E-mail Institucional | Senha Padrão | Pergunta Secreta | Resposta Secreta |
| :--- | :--- | :--- | :--- | :--- |
| **Administrador** | `admin.musarq@unicap.br` | `Admin@123` | *Restrita* | *Restrita* |
| **Técnico** | `tecnico.musarq@unicap.br` | `Tecnico@123` | *Qual o nome do seu primeiro animal de estimação?* | `Rex` |

---

##  6. Como Executar o Projeto Localmente

### Pré-requisitos
- **Node.js:** Versão 22 ou superior *(obrigatório para suporte nativo ao módulo `node:sqlite`)*.
- **npm:** Versão 10 ou superior.
- **Git** instalado.

---

### Passo 1: Executar o Backend

```bash
# Acessar a pasta do backend
cd labMU/Implementacao/backend

# Instalar dependências
npm install

# Iniciar em modo de desenvolvimento (porta 3001)
npm run dev
```

> O backend criará automaticamente o banco de dados `data/labmu.sqlite` e aplicará as migrações e o seed de dados iniciais.
> O endpoint de verificação estará disponível em: `http://localhost:3001/api/health`.

Para rodar a suite de testes automatizados:
```bash
npm test
```

---

### Passo 2: Executar o Frontend

Em um novo terminal:

```bash
# Acessar a pasta da SPA React
cd labMU/Implementacao/frontend/perfil_adm

# Instalar dependências
npm install

# Iniciar o servidor Vite (porta 5173 por padrão)
npm run dev
```

Abra seu navegador em: `http://localhost:5173`.

> **Modo Híbrido:** A SPA se comunica diretamente com a API REST em `http://localhost:3001/api`. Caso o backend esteja indisponível, a aplicação possui um modo *fallback* que armazena os dados em `localStorage` para demonstração.

---

##  7. Estrutura do Repositório

O repositório é organizado de forma modular. Cada pasta possui sua documentação técnica específica:

```
labMU/
├── README.md                                  # Este documento (Visão Geral e Guia Principal)
│
├── Implementacao/                             # Código-fonte da aplicação
│   ├── README.md                              # Guia da Camada de Implementação
│   │
│   ├── backend/                               # Servidor REST Node.js 22 + TypeScript + SQLite
│   │   ├── README.md                          # Documentação completa da API e Endpoints
│   │   ├── src/                               # Código-fonte do backend
│   │   │   ├── README.md                      # Arquitetura interna e padrões do backend
│   │   │   ├── config/                        # Variáveis de ambiente e configurações
│   │   │   ├── database/                      # Schema SQL, migrações e seed
│   │   │   ├── middlewares/                   # Autenticação JWT e tratamento centralizado de erros
│   │   │   └── modules/                       # Módulos de domínio (auth, users, machines, etc.)
│   │   └── tests/                             # Testes automatizados da API
│   │
│   └── frontend/                              # Aplicações e protótipos de interface
│       ├── README.md                          # Visão geral do frontend e design system
│       │
│       ├── perfil_adm/                        # Aplicação SPA Oficial (React 18 + Vite + Tailwind)
│       │   ├── README.md                      # Documentação completa da SPA
│       │   └── src/                           # Código-fonte da SPA
│       │       ├── README.md                  # Estrutura de páginas, componentes e serviços
│       │       ├── components/                # Componentes compartilhados e Layout
│       │       ├── pages/                     # Telas organizadas por módulo de negócio
│       │       ├── services/                  # Cliente HTTP integrado à API
│       │       └── lib/                       # Helpers, persistência e exportação CSV
│       │
│       ├── login_adm/                         # Protótipo estático original (HTML/CSS)
│       │   └── README.md                      # Documentação e histórico do protótipo
│       │
│       └── cadastro_adm/                      # Protótipo de componente de cadastro
│           └── README.md                      # Documentação do componente isolado
│
└── Documentacao/                              # Documentos de especificação, Sprints e Testes
    ├── README.md                              # Guia de documentações acadêmicas e Scrum
    ├── Backend_Requisitos_e_Integracao.md      # Especificação formal dos requisitos e fluxos
    ├── Relatorio_de_Testes_labMU.md           # Relatório detalhado dos testes de qualidade
    └── Projetos/Sprints/                      # Documentação iterativa das Sprints da Equipe 07
```

---

##  8. Opções de Deploy Gratuito

O projeto foi preparado para deploy simplificado e gratuito:

- **Frontend na [Vercel](https://vercel.com/):** Deploy contínuo da pasta `Implementacao/frontend/perfil_adm` com a variável `VITE_API_URL` apontando para o backend.
- **Backend no [Render](https://render.com/):** Deploy como Web Service da pasta `Implementacao/backend` com `NODE_VERSION=22.12.0`.
- **Alternativa Unificada:** Configuração do Express para servir a pasta `dist` gerada pelo Vite em um único serviço gratuito no Render.

---

## 9. Equipe de Desenvolvimento (Equipe 07)

Projeto desenvolvido no âmbito das disciplinas de Engenharia de Software da Universidade Católica de Pernambuco:

- **Arthur Amaral**
- **Christian Lucas**
- **Lucas Mendes**
- **Quezia Costa**
- **Kailane Lisley**

