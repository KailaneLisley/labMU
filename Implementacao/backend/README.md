# ⚙️ labMU — Backend API

Backend RESTful desenvolvido em **Node.js + TypeScript** com banco de dados **SQLite** (via `node:sqlite`), autenticação segura com **JWT** e criptografia de senhas com **bcryptjs**.

---

## 👤 Credenciais Padrão Iniciais

Ao inicializar o sistema pela primeira vez, o seed automático do banco de dados cria os seguintes usuários para gerenciamento e operação:

| Perfil | E-mail Institucional | Senha Padrão | Responsabilidade |
| :--- | :--- | :--- | :--- |
| **Administrador** | `admin.musarq@unicap.br` | `Admin@123` | Gestão completa de usuários, máquinas, estoque, relatórios e auditorias |
| **Técnico** | `tecnico.musarq@unicap.br` | `Tecnico@123` | Registro de manutenções, produções, controle de insumos e empréstimos |

---

## 🚀 Como Executar

### 1. Pré-requisitos
- Node.js v22+
- npm

### 2. Instalação de dependências
```bash
cd labMU/Implementacao/backend
npm install
```

### 3. Executando em desenvolvimento
```bash
npm run dev
```
O servidor inicializa por padrão na porta **3001** (`http://localhost:3001`).

### 4. Executando os testes automatizados
```bash
npm test
```

### 5. Build para produção
```bash
npm run build
npm start
```

---

## 📡 Principais Endpoints da API

### Autenticação & Conta
- `POST /api/auth/login`: Autenticação com e-mail, senha e verificação de perfil.
- `POST /api/auth/register`: Cadastro institucional público de novos Técnicos (`@unicap.br`).
- `GET /api/auth/me`: Retorna os dados do usuário logado (requer Bearer token).
- `POST /api/auth/logout`: Encerra a sessão.

### Gestão de Usuários
- `GET /api/users`: Listagem de usuários com filtros por `role`, `status` e busca textual.
- `POST /api/users`: Cadastro de usuários (Administrador).
- `PATCH /api/users/:id`: Edição de usuário.
- `PATCH /api/users/:id/status`: Ativação/Inativação de usuário.
- `PATCH /api/users/me`: Atualização do próprio perfil.

### Máquinas (Fixas)
- `GET /api/machines`: Lista impressoras 3D e scanners fixos com status e localização.
- `POST /api/machines`: Cadastro de novas máquinas com TAG única.
- `PATCH /api/machines/:id`: Atualização de máquina.
- `DELETE /api/machines/:id`: Inativação auditável de máquina.

### Manutenções
- `GET /api/maintenances`: Histórico filtrável por máquina, tipo (preventiva/corretiva) e período.
- `POST /api/maintenances`: Registro de manutenção (atualiza automaticamente o agendamento preventivo).

### Estoque & Suprimentos
- `GET /api/supplies`: Consulta de filamentos e resinas com saldo em kg e indicador de nível.
- `POST /api/supplies`: Cadastro de novos suprimentos.
- `POST /api/supplies/entries`: Registro transacional de entradas em kg (com lote e operador).
- `GET /api/supplies/movements`: Histórico completo de movimentações de estoque.

### Equipamentos Portáteis & Empréstimos
- `GET /api/equipment`: Inventário de portáteis disponíveis para retirada.
- `POST /api/equipment`: Cadastro de item portátil (*máquinas fixas são estritamente proibidas no fluxo de empréstimo*).
- `GET /api/loans`: Histórico e lista de empréstimos em campo e atrasados.
- `POST /api/loans`: Retirada de equipamento portátil (com bloqueio transacional contra empréstimo duplicado).
- `POST /api/loans/:id/return`: Devolução com liberação do item e registro de operador.

### Produção & Consumo Fracionado
- `GET /api/productions`: Listagem dos trabalhos de impressão 3D e escaneamento.
- `POST /api/productions`: Registro de produção, com débito atômico do saldo do insumo selecionado.

### Relatórios & Dashboard
- `GET /api/dashboard/summary`: Resumo em tempo real de máquinas, manutenções, estoque e empréstimos.
- `GET /api/reports/production`: Relatório de produção com tempo médio e insumo consumido.
- `GET /api/reports/production-by-technician`: Produção consolidada mensal por técnico.
- `GET /api/reports/stock-consumption`: Consumo periódico de insumos.
- `GET /api/reports/loans`: Estatísticas mensais de empréstimos.
- `GET /api/reports/maintenances`: Estatísticas de manutenções preventivas e corretivas.

