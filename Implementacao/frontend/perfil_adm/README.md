# 💻 labMU — SPA Oficial de Gestão (`perfil_adm`)

Aplicação web **Single Page Application (SPA)** oficial para operação e gestão do Laboratório de Prototipagem do MUSARQ. Desenvolvida em **React 18**, **TypeScript**, **Vite** e **Tailwind CSS**.

---

## 🎯 Visão Geral e Características

- **Roteamento Dinâmico:** Organizado com **React Router v6** com layout compartilhado (sidebar de navegação, cabeçalho e perfil de usuário).
- **Modo Híbrido Resiliente:**
  - **Online:** Comunica-se com a API REST (`http://localhost:3001/api`) enviando tokens JWT no cabeçalho `Authorization`.
  - **Offline/Demonstração:** Caso a API backend esteja inacessível, a aplicação opera automaticamente com `localStorage`, permitindo testes visuais sem quebras.
- **Segurança de Acesso:**
  - Login integrado para Administradores e Técnicos.
  - Cadastro público restrito a Técnicos institucionais (`@unicap.br`) com definição de **Pergunta Secreta de Segurança**.
  - Recuperação de senha autônoma para Técnicos em 3 etapas com bloqueio de administradores.

---

## 🗺️ Mapa de Rotas do Sistema

| Rota | Componente | Layout | Descrição |
| :--- | :--- | :---: | :--- |
| `/login` | `LoginPage` | Não | Autenticação com e-mail institucional e senha |
| `/cadastro` | `RegisterPage` | Não | Cadastro público de Técnicos com Pergunta Secreta |
| `/recuperar-senha` | `ForgotPasswordPage` | Não | Fluxo em 3 etapas de recuperação de senha |
| `/dashboard` | `DashboardPage` | Sim | Visão geral em tempo real com métricas e contadores |
| `/usuarios` | `UserManagementPage` | Sim | Gestão e filtros de Administradores, Técnicos e Clientes |
| `/maquinas` | `MachinesPage` | Sim | Parque de impressoras 3D e scanners fixos |
| `/manutencao` | `MaintenanceManagementPage` | Sim | Controle de manutenções preventivas e corretivas |
| `/estoque` | `StockSupplyPage` | Sim | Consulta de matéria-prima (filamentos e resinas) em kg |
| `/estoque/registrar-entrada` | `RegisterSupplyEntryPage` | Sim | Formulário de entrada de lote de suprimentos em kg |
| `/emprestimo` | `LoanEquipmentPage` | Sim | Controle de retiradas e devoluções de equipamentos portáteis |
| `/emprestimo/registrar` | `RegisterEquipmentPage` | Sim | Cadastro de novos itens no inventário de portáteis |
| `/relatorios` | `ReportsPage` | Sim | Relatórios analíticos, gráficos e exportação de CSVs |
| `/perfil` | `ProfilePage` | Sim | Visualização de dados do usuário autenticado |
| `/editar-perfil` | `EditProfilePage` | Sim | Edição de nome, telefone e preferências do usuário |

---

## 🔐 Fluxos de Autenticação e Segurança

### 1. Cadastro de Técnico (`/cadastro`)
- Campos: Nome completo, E-mail institucional (`@unicap.br`), Matrícula, Telefone (opcional) e Senha forte (mínimo 8 caracteres com letras e números).
- **Seção Obrigatória:** Pergunta Secreta de Segurança (opções pré-definidas ou personalizada) + Resposta Secreta.
- Cria conta diretamente na API do backend e adiciona à sessão.

### 2. Recuperação de Senha (`/recuperar-senha`)
- **Etapa 1:** O usuário digita o e-mail institucional.
  - Se for **Administrador**: O sistema bloqueia a recuperação automática e instrui o contato direto com a administração (`musarq@unicap.br`).
  - Se for **Técnico**: O sistema busca e exibe a pergunta secreta cadastrada pelo usuário.
- **Etapa 2:** O usuário informa a resposta secreta (*case-insensitive* e com espaços aparados). Se correta, o backend emite um token de redefinição.
- **Etapa 3:** O usuário cadastra e confirma a nova senha.

---

## 🚀 Como Executar

### 1. Instalação
```bash
cd Implementacao/frontend/perfil_adm
npm install
```

### 2. Execução em Modo de Desenvolvimento
```bash
npm run dev
```
Acesse no navegador: `http://localhost:5173`.

### 3. Verificação de Tipos TypeScript
```bash
npm run type-check
```

### 4. Build de Produção
```bash
npm run build
npm run preview # Visualizar build de produção localmente
```

---

## 📂 Estrutura de Código

Para entender a organização dos componentes React, páginas, hooks e serviços de API, consulte:  
👉 **[`src/README.md`](src/README.md)**
