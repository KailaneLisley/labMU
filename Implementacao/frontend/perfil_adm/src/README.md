#  Arquitetura do Código Frontend — `src/`

Este diretório contém todo o código-fonte da aplicação React do **labMU**, organizado de forma modular por domínios de negócio, componentes visuais e serviços de integração.

---

##  Organização dos Diretórios

```
src/
├── App.tsx                        # Roteamento central com React Router e aplicação do Layout
├── main.tsx                       # Ponto de entrada que inicializa a aplicação no DOM
├── index.css                      # Diretivas Tailwind (@tailwind base, components, utilities)
├── vite-env.d.ts                  # Declarações de tipos do Vite e variáveis de ambiente
│
├── components/                    # Componentes visuais compartilhados
│   ├── layout/                    # Componentes estruturais da interface
│   │   ├── Layout.tsx             # Casca principal com Sidebar e container de conteúdo
│   │   ├── Sidebar.tsx            # Menu de navegação lateral com links de rotas e badge do usuário
│   │   └── index.ts               # Barrel de exportação do layout
│   └── index.ts                   # Exportador geral de componentes
│
├── pages/                         # Telas da aplicação organizadas por domínio
│   ├── auth/                      # Telas de Autenticação
│   │   ├── LoginPage.tsx          # Tela de login com e-mail institucional e senha
│   │   ├── RegisterPage.tsx       # Cadastro de Técnicos com Pergunta Secreta de Segurança
│   │   └── ForgotPasswordPage.tsx # Fluxo em 3 etapas para recuperação de senha
│   ├── dashboard/                 # Dashboard principal
│   │   └── DashboardPage.tsx      # Resumo com indicadores de máquinas, estoque e empréstimos
│   ├── users/                     # Módulo de Usuários
│   │   └── UserManagementPage.tsx # Listagem, filtros e administração de usuários
│   ├── machines/                  # Módulo de Máquinas
│   │   └── MachinesPage.tsx       # Inventário de impressoras 3D e scanners fixos
│   ├── maintenance/               # Módulo de Manutenções
│   │   └── MaintenanceManagementPage.tsx # Agendamento e histórico de manutenções
│   ├── stock/                     # Módulo de Estoque
│   │   ├── StockSupplyPage.tsx    # Listagem de filamentos/resinas com saldo em kg
│   │   └── RegisterSupplyEntryPage.tsx # Formulário de entrada de novos lotes de insumos
│   ├── loans/                     # Módulo de Empréstimos
│   │   ├── LoanEquipmentPage.tsx  # Controle de retiradas, devoluções e prazos de portáteis
│   │   └── RegisterEquipmentPage.tsx # Cadastro de novos equipamentos portáteis
│   ├── reports/                   # Módulo de Relatórios
│   │   └── ReportsPage.tsx        # Relatórios analíticos e exportação para planilhas CSV
│   └── profile/                   # Módulo de Perfil
│       ├── ProfilePage.tsx        # Visualização de dados do usuário logado
│       └── EditProfilePage.tsx    # Edição de dados pessoais e de contato
│
├── services/                      # Integração com o Backend
│   └── api.ts                     # Cliente HTTP centralizado com fetch, Bearer JWT e tipagem
│
├── lib/                           # Utilitários e Helpers
│   ├── session.ts                 # Gerenciamento de sessão e token de autenticação
│   ├── storage.ts                 # Leitura e escrita segura em localStorage com tratamento de JSON
│   ├── accounts.ts                # Interfaces e tipagem das contas registradas
│   └── exportCsv.ts               # Função utilitária para converter arrays em download de CSV
│
├── hooks/                         # React Custom Hooks
│   └── usePersistentState.ts      # Hook que sincroniza estado React com localStorage
│
└── data/                          # Dados estáticos para demonstração offline
    ├── users.ts                   # Lista inicial de usuários padrão e seed
    ├── supplies.ts                # Insumos iniciais (PLA, ABS, PETG, Resinas)
    └── loans.ts                   # Portáteis e empréstimos simulados
```

---

## Cliente de API (`src/services/api.ts`)

O arquivo `api.ts` implementa uma camada centralizada para todas as chamadas à API REST:
- **Base URL:** Lê a variável `VITE_API_URL` (se definida) ou utiliza o padrão relativo `/api`.
- **Injeção Automática de Token:** Resgata o JWT de `lib/session.ts` e anexa o cabeçalho `Authorization: Bearer <token>`.
- **Tratamento de Erros:** Captura respostas que não sejam 2xx, extrai a mensagem enviada pelo backend e lança erros legíveis para o usuário.

---

##  Exportação de Relatórios (`src/lib/exportCsv.ts`)

A função `exportToCsv(filename, rows, headers)` permite que qualquer tabela ou relatório da aplicação seja baixado imediatamente pelo operador em formato `.csv` compatível com Excel e Google Sheets, incluindo codificação UTF-8 com BOM (`\uFEFF`) para preservar acentuação em português.

