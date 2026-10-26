#  labMU — Backend API RESTful

API RESTful completa desenvolvida para a gestão operacional do Laboratório de Prototipagem do MUSARQ/UNICAP. Construída em **Node.js (v22+)** com **TypeScript**, **Express 5**, banco de dados relacional **SQLite nativo** (`node:sqlite`), autenticação **JWT** e criptografia de senhas com **bcryptjs**.

---

##  Credenciais Padrão Pré-carregadas

Ao inicializar pela primeira vez, o sistema executa o *seed* automático do banco de dados criando as seguintes contas para testes e operação:

| Perfil | E-mail Institucional | Senha Padrão | Pergunta de Segurança | Resposta | Responsabilidade |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Administrador** | `admin.musarq@unicap.br` | `Admin@123` | *Restrita* | *Restrita* | Gestão completa de usuários, máquinas, estoque, relatórios e auditorias |
| **Técnico** | `tecnico.musarq@unicap.br` | `Tecnico@123` | *Qual o nome do seu primeiro animal de estimação?* | `Rex` | Registro de manutenções, produções, controle de insumos e empréstimos |

---

## Como Executar

### 1. Pré-requisitos
- **Node.js v22.5.0 ou superior** *(necessário para o módulo experimental nativo `node:sqlite`)*.
- **npm v10+**.

### 2. Instalação de dependências
```bash
cd Implementacao/backend
npm install
```

### 3. Modo de Desenvolvimento
```bash
npm run dev
```
O servidor inicializa por padrão na porta **3001** (`http://localhost:3001`). O banco SQLite é criado automaticamente em `data/labmu.sqlite`.

### 4. Executando os Testes Automatizados
```bash
npm test
```
A suite de testes executa testes de integração de ponta a ponta:
- Health check
- Login válido e rejeição de credenciais incorretas
- Cadastro público de técnicos
- Fluxo de recuperação de senha (bloqueio de admin e sucesso do técnico por pergunta secreta)
- Empréstimo com bloqueio transacional de duplicidade
- Operações de estoque e dashboard

### 5. Compilação e Produção
```bash
npm run build
npm start
```

---

##  Regras de Negócio e Segurança

1. **Restrição de Cadastro de Administrador:** Não existe rota pública para criar administradores. Contas gestoras devem ser inseridas previamente no banco de dados.
2. **Recuperação de Senha Segura:**
   - Técnicos recuperam senha informando o e-mail cadastrado e respondendo à pergunta secreta definida no cadastro.
   - Administradores são bloqueados na rota automática com código `403 ADMIN_RECOVERY_RESTRICTED` e orientados a entrar em contato com os desenvolvedores/administração (`musarq@unicap.br`).
3. **Impossibilidade de Empréstimo de Máquinas Fixas:** As impressoras 3D e scanners são máquinas patrimoniais de bancada. Apenas itens registrados na tabela `portable_equipment` podem participar de empréstimos. Tentativas de emprestar máquinas fixas são bloqueadas no banco e na camada de serviço.
4. **Consumo Fracionado de Suprimentos:** Suprimentos são comprados e estocados em quilogramas (kg), mas debitados em frações (gramas/unidades) em cada ordem de produção via transação ACID imediata.

---

##  Catálogo Completo de Endpoints

### 1. Autenticação & Recuperação de Senha
| Método | Endpoint | Descrição | Acesso |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Autentica usuário com e-mail e senha. Retorna token JWT. | Público |
| `POST` | `/api/auth/register` | Cadastra novo Técnico institucional (`@unicap.br`) com pergunta secreta. | Público |
| `GET` | `/api/auth/me` | Retorna os dados do usuário autenticado. | Autenticado |
| `POST` | `/api/auth/logout` | Invalida a sessão atual. | Autenticado |
| `POST` | `/api/auth/forgot-password/verify-email` | Verifica e-mail, bloqueia admin e retorna a pergunta secreta do técnico. | Público |
| `POST` | `/api/auth/forgot-password/verify-answer` | Valida resposta secreta e emite token temporário de redefinição. | Público |
| `POST` | `/api/auth/forgot-password/reset` | Redefine a senha utilizando o token de recuperação. | Público |

### 2. Gestão de Usuários
| Método | Endpoint | Descrição | Acesso |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/users` | Lista usuários com paginação e filtros (`q`, `role`, `status`). | Autenticado |
| `POST` | `/api/users` | Cadastra novo usuário (Administrador, Técnico ou Cliente). | Administrador |
| `GET` | `/api/users/:id` | Retorna detalhes de um usuário específico. | Autenticado |
| `PATCH` | `/api/users/:id` | Atualiza dados cadastrais de um usuário. | Administrador |
| `PATCH` | `/api/users/:id/status` | Altera status (`ativo`/`inativo`). | Administrador |
| `PATCH` | `/api/users/me` | Atualiza o próprio perfil do usuário logado. | Autenticado |

### 3. Parque de Máquinas (Fixas)
| Método | Endpoint | Descrição | Acesso |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/machines` | Lista impressoras 3D e scanners fixos com status e datas de manutenção. | Autenticado |
| `POST` | `/api/machines` | Cadastra nova máquina com TAG patrimonial única. | Autenticado |
| `GET` | `/api/machines/:id` | Retorna detalhes de uma máquina. | Autenticado |
| `PATCH` | `/api/machines/:id` | Atualiza status, localização e observações da máquina. | Autenticado |
| `DELETE` | `/api/machines/:id` | Desativa uma máquina de forma auditável. | Administrador |

### 4. Manutenções
| Método | Endpoint | Descrição | Acesso |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/maintenances` | Histórico de manutenções com filtros por máquina, tipo e data. | Autenticado |
| `POST` | `/api/maintenances` | Registra manutenção preventiva ou corretiva e recalcula agendamentos. | Autenticado |

### 5. Estoque & Suprimentos
| Método | Endpoint | Descrição | Acesso |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/supplies` | Consulta saldos de filamentos e resinas em kg com nível de alerta. | Autenticado |
| `POST` | `/api/supplies` | Cadastra novo insumo. | Autenticado |
| `POST` | `/api/supplies/entries` | Registra entrada de lote com quantidade em kg e operador. | Autenticado |
| `GET` | `/api/supplies/movements` | Extrato detalhado de movimentações (entradas e saídas por produção). | Autenticado |

### 6. Equipamentos Portáteis & Empréstimos
| Método | Endpoint | Descrição | Acesso |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/equipment` | Inventário de equipamentos portáteis disponíveis para retirada. | Autenticado |
| `POST` | `/api/equipment` | Cadastra novo item portátil (bloqueia registro de máquinas fixas). | Autenticado |
| `GET` | `/api/loans` | Lista empréstimos em andamento, atrasados e concluídos. | Autenticado |
| `POST` | `/api/loans` | Registra retirada de equipamento portátil com bloqueio de duplicidade. | Autenticado |
| `POST` | `/api/loans/:id/return` | Registra devolução e libera o equipamento. | Autenticado |

### 7. Produção & Consumo Fracionado
| Método | Endpoint | Descrição | Acesso |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/productions` | Histórico de ordens de produção (impressões 3D e escaneamentos). | Autenticado |
| `POST` | `/api/productions` | Registra produção com débito atômico e fracionado do estoque. | Autenticado |

### 8. Relatórios & Dashboard
| Método | Endpoint | Descrição | Acesso |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/dashboard/summary` | Contadores consolidados e alertas operacionais em tempo real. | Autenticado |
| `GET` | `/api/reports/production` | Relatório detalhado de produção com tempo médio e gasto de insumos. | Autenticado |
| `GET` | `/api/reports/production-by-technician` | Volume de produção consolidado por técnico. | Autenticado |
| `GET` | `/api/reports/stock-consumption` | Relatório periódico de consumo de insumos. | Autenticado |
| `GET` | `/api/reports/loans` | Estatísticas de empréstimos e devoluções. | Autenticado |
| `GET` | `/api/reports/maintenances` | Estatísticas de custos e manutenções preventivas/corretivas. | Autenticado |

---

##  Estrutura de Código

Para entender como o código-fonte está estruturado internamente (controladores, serviços, banco de dados e middlewares), consulte:  
 **[`src/README.md`](src/README.md)**
