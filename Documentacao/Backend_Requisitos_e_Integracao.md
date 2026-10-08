# labMU — Requisitos do backend e integração com o frontend

Este documento explica a estrutura existente, separa requisitos documentados de funcionalidades que já existem no protótipo e propõe uma base para iniciar o backend sem tratar os dados demonstrativos como dados reais.

## 1. Resumo executivo

- O repositório contém documentação de produto e protótipos de frontend, mas **não contém um backend implementado nem uma base de dados**.
- A aplicação principal mais completa está em `Implementacao/frontend/perfil_adm`: React 18, TypeScript, Vite, React Router e Tailwind.
- `login_adm` e `cadastro_adm` são protótipos separados; não fazem parte do build da aplicação React e não estão integrados entre si.
- A aplicação React hoje simula autenticação e persiste cadastros no `localStorage`. A proteção de rotas acontece apenas no navegador e não é controle de segurança.
- Os requisitos de negócio incluem produção e relatórios operacionais mais completos do que as telas atuais entregam. A tela de manutenção e alguns indicadores ainda são dados fixos.
- Para produção, a fonte de verdade deve ser uma API autenticada com regras no servidor e uma base relacional. Estoque, empréstimos e produção precisam de transações para evitar saldos ou estados inconsistentes.

## 2. Mapa do repositório

### Documentação

- [`README.md`](../README.md): objetivo do labMU, perfis e lista resumida de funcionalidades.
- [`Documentacao/Projetos/Sprints/`](./Projetos/Sprints/README_Sprints_e_Cérebro_Projeto.md): visão de produto, perfis, requisitos, arquitetura, organização, backlog, testes e fluxos.
- [`Documentacao/Projetos/Sprints/1._Visão_Geral_do_Projeto.md`](./Projetos/Sprints/1._Visão_Geral_do_Projeto.md): escopo funcional.
- [`Documentacao/Projetos/Sprints/2._Perfis_de_Usuário_e_Autenticação.md`](./Projetos/Sprints/2._Perfis_de_Usuário_e_Autenticação.md): responsabilidades e política geral de acesso.
- [`Documentacao/Projetos/Sprints/3._Funcionalidades_e_Requisitos_do_Sistema.md`](./Projetos/Sprints/3._Funcionalidades_e_Requisitos_do_Sistema.md): requisitos funcionais.
- [`Documentacao/Projetos/Sprints/4._Arquitetura_e_Decisões_de_Projeto.md`](./Projetos/Sprints/4._Arquitetura_e_Decisões_de_Projeto.md) e [`5._Organização_de_Código_por_Módulos.md`](./Projetos/Sprints/5._Organização_de_Código_por_Módulos.md): separação recomendada por domínio.
- [`Documentacao/Projetos/Sprints/16._Fluxo_de_Manutenção_de_Máquina.md`](./Projetos/Sprints/16._Fluxo_de_Manutenção_de_Máquina.md), [`17._Fluxo_de_Empréstimo_de_Equipamento.md`](./Projetos/Sprints/17._Fluxo_de_Empréstimo_de_Equipamento.md) e [`18._Fluxo_de_Produção_e_Relatório.md`](./Projetos/Sprints/18._Fluxo_de_Produção_e_Relatório.md): fluxos operacionais.
- `EQUIPE-07-Documentação.pdf`: material adicional do projeto; confirmar com a equipe se contém requisitos aprovados mais recentes antes de usá-lo como especificação normativa.

### Frontends e protótipos

| Local | Tecnologia/estado | Observação para o backend |
|---|---|---|
| `Implementacao/frontend/perfil_adm/` | SPA React/TypeScript/Vite; é a aplicação funcional mais completa | É o ponto recomendado para integrar a API. Tem `package.json`, build e rotas. |
| `Implementacao/frontend/login_adm/` | HTML + CSS + JavaScript sem build de aplicação | Protótipo independente. O JS possui um caminho de `fetch` para `/api/auth/login`, mas `USE_MOCK` está ligado e a tela não está integrada à SPA. |
| `Implementacao/frontend/cadastro_adm/` | Componente TSX exportado, Tailwind e arquivos de ícones | O submit só altera estado visual; não cria conta nem chama serviço. Não é rota da SPA. |
| `Implementacao/frontend/` | Contém um `package-lock.json`, mas não tem `package.json` próprio | Instalação/build da SPA devem ser feitos em `Implementacao/frontend/perfil_adm/`. |
| `Implementacao/backend/` | Não existe atualmente | A criação do serviço, configuração, migrações e testes é trabalho novo. |

`login_adm/index.html` contém links para `recuperar-senha.html` e `cadastro-admin.html`, que não aparecem entre os arquivos atuais de `login_adm`. Na SPA, o link de recuperação abre e-mail e o acesso administrativo é encaminhado à coordenação. Portanto, esses documentos HTML não devem ser confundidos com as rotas React `/login` e `/cadastro`.

### Estrutura da SPA `perfil_adm`

```text
src/
├── main.tsx                 # monta React e carrega CSS
├── App.tsx                  # BrowserRouter e rotas
├── components/
│   ├── Layout.tsx           # proteção visual de rotas e layout principal
│   └── Sidebar.tsx          # navegação e perfil da sessão
├── data/                    # tipos e registros iniciais demonstrativos
├── hooks/
│   └── usePersistentState.ts # estado React persistido no localStorage
├── lib/
│   ├── accounts.ts          # chave/contrato demonstrativo de conta
│   ├── exportCsv.ts         # exportação CSV no navegador
│   ├── session.ts           # sessão local demonstrativa
│   └── storage.ts           # leitura de JSON local
└── pages/                   # telas e formulários
```

O frontend usa React Router 6, TypeScript em modo estrito, Vite, Tailwind e `lucide-react`. O build configurado é `npm run build` (`tsc && vite build`). Não há biblioteca de testes automatizados configurada no `package.json`.

## 3. Rotas e telas existentes

| Rota | Tela | Estado funcional atual e dependência de backend |
|---|---|---|
| `/login` | `LoginPage` | Login de demonstração. Aceita dois usuários fixos e contas do cadastro local; deve autenticar na API. |
| `/cadastro` | `RegisterPage` | Cria um Técnico demonstrativo, guarda conta e senha em `localStorage` e o inclui no cadastro local. Deve ser substituído por cadastro controlado pelo servidor. |
| `/dashboard` | `DashboardPage` | Atalhos e indicadores/listas predominantemente fixos. Os indicadores devem vir de um resumo agregado pela API. |
| `/usuarios` | `UserManagementPage` | Busca, filtros, paginação, detalhe, criação/edição e ativação/desativação somente no navegador. |
| `/maquinas` | `MachinesPage` | Cadastro/edição, TAG única no estado local, status, busca e remoção local. |
| `/manutencao` | `MaintenanceManagementPage` | Busca, filtros, detalhe e CSV, mas registros, KPIs e período são demonstrativos; não há formulário de manutenção. |
| `/estoque` | `StockSupplyPage` | Consulta suprimentos, histórico local de entradas, filtros e CSV. Saldos/entradas não são compartilhados entre navegadores. |
| `/estoque/registrar-entrada` | `RegisterSupplyEntryPage` | Cadastra insumo e entrada em kg localmente; atualiza saldo no navegador. |
| `/emprestimo` | `LoanEquipmentPage` | Lista equipamento, empresta e registra devolução em estado local. O responsável é texto livre e o histórico não é modelado como entidade própria. |
| `/emprestimo/registrar` | `RegisterEquipmentPage` | Formulário coleta categoria, TAG, número de série, local, conservação e acessórios, mas o objeto persistido atualmente guarda apenas nome, TAG/código e estado inicial. A integração deve preservar todos os campos necessários. |
| `/perfil` | `ProfilePage` | Exibe sessão/perfil, mas usa dados de demonstração como fallback. Logout local. |
| `/editar-perfil` | `EditProfilePage` | Edita nome, e-mail, telefone e foto localmente; a matrícula/lotação exibidas são demonstrativas/não editáveis. |

`Layout.tsx` redireciona para `/login` quando não encontra uma sessão local. Isso melhora a navegação, mas uma chamada direta à API deve continuar bloqueada sem autenticação válida, mesmo que o usuário altere o JavaScript ou o estado do navegador.

## 4. Requisitos de negócio

### Perfis

Os documentos de produto definem:

- **Administrador:** autentica-se; gere usuários, cadastros, relatórios e auditoria.
- **Técnico:** autentica-se; regista produção e manutenção, movimenta estoque e gere empréstimos.
- **Cliente:** não autentica; é um cadastro de referência para produção e empréstimos.

Na tela de gestão, a opção que se chama “Cliente” atualmente grava o perfil interno `aluno`. No frontend novo, o cadastro público cria diretamente um Técnico. Essa última regra é apenas demonstrativa e ainda precisa de uma política aprovada para produção. O cadastro público jamais deve poder solicitar/escolher `administrador` como forma de conceder privilégios.

### Módulos

1. **Autenticação e autorização:** login, sessão, logout, recuperação/alteração de senha e autorização por perfil.
2. **Cadastros:** técnicos, administradores, clientes, máquinas fixas, suprimentos e equipamentos portáteis.
3. **Máquinas:** impressoras FDM, impressoras de resina e scanners; localização, status e histórico.
4. **Manutenção:** manutenção preventiva/corretiva vinculada a uma máquina, técnico, datas, intervenção e estado; consulta por período.
5. **Produção:** registro do serviço de impressão ou escaneamento, descrição, máquina, técnico, cliente, duração e consumo.
6. **Estoque:** insumos com variações (por exemplo, material/tipo/cor), entradas em kg, saídas fracionadas e histórico.
7. **Empréstimo:** somente equipamento portátil pode ser emprestado; registar retirada, responsável, vencimento, devolução real e histórico.
8. **Relatórios:** produção, produção mensal por técnico, consumo mensal de estoque, manutenções e empréstimos mensais, filtrados por período.

### Regras que devem ser aplicadas no servidor

- Apenas Administrador e Técnico podem autenticar-se; Cliente é registro operacional sem login, salvo decisão de produto posterior.
- O papel/permissão deve vir da conta persistida no servidor, nunca de um `role` livre enviado pelo browser.
- Máquinas fixas não podem entrar no fluxo de empréstimos.
- Um equipamento portátil não pode ter mais de um empréstimo ativo ao mesmo tempo.
- Um empréstimo ativo deve ter responsável e data prevista; devolução deve registrar data efetiva e operador.
- Scanner pode ser registrado como produção com consumo de insumo igual a zero.
- Impressão com consumo deve validar disponibilidade e debitar estoque na mesma transação que confirma o registro.
- Alteração de estoque não deve ser um simples `PATCH balance`: cada entrada, consumo ou ajuste precisa gerar movimento rastreável.
- TAGs, e-mails e matrículas devem ser normalizados e sujeitos a restrições de unicidade conforme regras confirmadas pelo laboratório.
- Registros históricos usados em relatórios não devem ser apagados silenciosamente. Preferir cancelamento/arquivamento auditável quando um registro já tiver movimentos associados.

### Perguntas de negócio a resolver antes de fechar os contratos

1. Cadastro de Técnico: autoativação após e-mail institucional confirmado, convite, ou aprovação do Administrador? Apenas validar o sufixo `@unicap.br` **não** prova que o e-mail pertence ao utilizador.
2. Quem pode cadastrar Clientes e Técnicos? O cadastro público `/cadastro` deve continuar existindo? A documentação e as telas não estão totalmente alinhadas.
3. Cliente terá somente nome, e-mail, matrícula/RA e telefone, ou serão necessários curso/departamento e consentimento/termo?
4. A unidade de estoque é sempre kg? Há materiais controlados em unidades, litros ou ml?
5. Em que momento se debita o consumo: ao abrir produção, iniciá-la ou concluí-la? Como cancelar e estornar uma produção?
6. Quais campos tornam uma manutenção “completa” (descrição, diagnóstico, datas, peças, custo, duração, observações, próxima preventiva)?
7. Empréstimos exigem aprovação, assinatura, termo, limite de duração ou multa? Pode haver extensão?
8. Quais filtros, fórmulas e intervalos de datas definem cada KPI e relatório? Os valores atuais do dashboard/manutenção são ilustrativos.
9. Uma pessoa pode ter mais de um perfil? Um cadastro de Cliente pode também ser Técnico?
10. Quem vê telefone, matrícula, histórico operacional e relatórios? Definir política de retenção e privacidade.

## 5. Modelo de dados recomendado

É uma proposta inicial de domínio relacional, não um esquema já implementado. PostgreSQL é uma opção adequada para relações, histórico e transações; a tecnologia final deve ser decidida pela equipe.

### `users` e credenciais

- `users`: `id` UUID, `name`, `email_normalized`, `registration`, `phone`, `role`, `status`, `created_at`, `updated_at`, `created_by`.
- `user_credentials` (ou tabela equivalente): `user_id`, `password_hash`, `password_changed_at`, `failed_login_count`/bloqueio se adotado.
- `role`: valor controlado `administrator`, `technician` ou `client` (definir nomenclatura pública consistente).
- `status`: ao menos ativo/inativo; acrescentar pendente apenas se houver aprovação/verificação.
- Cliente não precisa de credencial enquanto a política for “sem login”.
- E-mail normalizado único para credenciais; considerar unicidade de matrícula depois de validar a regra institucional.
- Senhas nunca são armazenadas em texto puro.

### `machines`

- `id`, `name`, `tag` única, `type` (`printer_3d_fdm`, `printer_3d_resin`, `scanner`), `dimensions/details`, `bench`, `room`, `status` (`active`, `maintenance`, `inactive`), timestamps e autor de criação.
- Manutenções e produções referenciam a máquina por ID, não por nome/TAG copiados.
- A remoção de máquina referenciada deve ser bloqueada ou virar arquivamento.

### `portable_equipment`, `loans`

- `portable_equipment`: `id`, `name`, `category`, `asset_tag` única, `serial_number`, `location`, `condition`, `accessories`, `status`, timestamps.
- `loans`: `id`, `equipment_id`, `borrower_user_id` ou dados de responsável conforme regra, `checked_out_at`, `due_at`, `returned_at`, `recorded_by`, observações e estado.
- A disponibilidade deve ser calculada/garantida no servidor com transação e restrição para apenas um empréstimo ativo por equipamento. Não aceitar ID de máquina fixa como `equipment_id`.
- A devolução atualiza o empréstimo e libera o item sem apagar a movimentação anterior.

### `supplies`, `stock_movements`

- `supplies`: `id`, código/identificador, `name`, `type/material`, `color`, `unit`, `minimum_balance`, estado ativo e timestamps.
- `stock_movements`: `id`, `supply_id`, tipo (entrada, consumo de produção, ajuste/estorno), quantidade decimal e unidade, referência de lote/NF/origem, observações, autor e data.
- Para kg, usar decimal de precisão fixa (por exemplo `NUMERIC`, nunca ponto flutuante de JavaScript como fonte de verdade).
- Saldo atual deve ser derivado dos movimentos ou atualizado junto deles por transação; a regra precisa escolher uma das estratégias e mantê-las sincronizadas.
- `supply_entries` pode ser uma tabela específica ou uma especialização de movimento se for necessário guardar dados próprios de recebimento.
- A tela atual permite múltiplos itens com mesmo nome, mas cores diferentes; identificar cada variante separadamente.

### `production_records`

- `id`, tipo (impressão/escaneamento), `description`, `machine_id`, `technician_id`, `client_id` opcional conforme regra, `supply_id` opcional, quantidade consumida (zero permitido para scanner), início/fim ou duração, estado, observações e timestamps.
- Ao concluir produção que consome material, validar e debitar o estoque na mesma transação; gravar o movimento com referência ao registro de produção.
- Definir política para produção cancelada, quantidade corrigida e estorno.
- Este domínio está descrito nos requisitos, mas **a SPA atual não tem tela de cadastro de produção**.

### `maintenance_records`

- `id`, `machine_id`, `technician_id`, tipo preventiva/corretiva, estado, data planeada/início/conclusão, descrição/diagnóstico, ação realizada, peças utilizadas, custo/duração se exigidos, observações e timestamps.
- A periodicidade preventiva mensal está nos requisitos. Definir se o backend gera agendamentos automaticamente ou apenas calcula próximos vencimentos.
- O histórico deve ser consultável por máquina, técnico, tipo, estado e intervalo.

### Auditoria

Adicionar `audit_events` para operações críticas: ator, ação, tipo/ID do recurso, horário UTC, resultado e metadados não sensíveis.

Nunca gravar senha, token, cookies, segredo ou payload pessoal desnecessário na auditoria/log.

## 6. API HTTP sugerida

Usar uma versão (`/api/v1`) e contratos JSON estáveis. Os caminhos abaixo são uma proposta para alinhar o front e o back; não existem hoje.

| Área | Rotas sugeridas |
|---|---|
| Auth | `POST /auth/login`, `POST /auth/logout`, `GET /auth/me`, `POST /auth/register` (se aprovado), `POST /auth/forgot-password`, `POST /auth/reset-password` |
| Usuários | `GET /users?q=&role=&status=&page=&limit=`, `POST /users`, `GET /users/{id}`, `PATCH /users/{id}`, `PATCH /users/{id}/status` |
| Máquinas | `GET /machines`, `POST /machines`, `GET /machines/{id}`, `PATCH /machines/{id}`, `DELETE /machines/{id}` ou arquivamento |
| Manutenção | `GET /maintenances?machineId=&type=&status=&from=&to=`, `POST /maintenances`, `GET /maintenances/{id}`, `PATCH /maintenances/{id}` |
| Portáteis/empréstimos | `GET /equipment`, `POST /equipment`, `PATCH /equipment/{id}`, `GET /loans`, `POST /loans`, `POST /loans/{id}/return` |
| Estoque | `GET /supplies`, `POST /supplies`, `GET /stock/movements?supplyId=&from=&to=`, `POST /stock/entries`, `POST /stock/adjustments` (restrito) |
| Produção | `GET /productions`, `POST /productions`, `GET /productions/{id}`, `PATCH /productions/{id}`/ação de conclusão/cancelamento explícita |
| Dashboard/relatórios | `GET /dashboard/summary?from=&to=`, `GET /reports/production`, `/reports/production-by-technician`, `/reports/stock-consumption`, `/reports/maintenances`, `/reports/loans` |
| Perfil | `GET /users/me`, `PATCH /users/me`, alteração de senha e upload de foto se aprovado |

### Formato de resposta e validação

- Listagens devem informar paginação: `{ data: [...], page, limit, total }`.
- Usar datas ISO 8601 com timezone (`2026-10-08T12:00:00Z`) e valores de domínio explícitos, não datas formatadas para exibição como `"Ontem, 18:00"`.
- Formato de erro consistente, por exemplo `{ "error": { "code": "VALIDATION_ERROR", "message": "...", "fields": { "email": "..." } } }`.
- Usar status HTTP coerentes: 201 criação, 200 consulta/alteração, 204 exclusão sem corpo, 400/422 validação, 401 não autenticado, 403 sem permissão, 404 inexistente, 409 conflito/duplicidade e 500 erro inesperado.
- Nunca devolver stack trace, hash de senha, token de reset ou dados sensíveis.
- Validar no servidor limites, formatos, estados permitidos, unicidade, relacionamentos, autorização e transições de estado.

## 7. Autenticação e segurança necessárias

O contrato atual da SPA espera algo parecido com `{ token, user: { name, email, role } }`, mas o backend pode melhorar o contrato desde que o cliente seja atualizado.

- HTTPS obrigatório fora do desenvolvimento.
- Hash de senha com algoritmo apropriado para senha (Argon2id ou bcrypt com custo atual adequado); nunca criptografia reversível nem texto puro.
- Credencial e papel sempre validados no servidor. Remover credenciais mockadas antes de disponibilizar em produção.
- Recomenda-se sessão em cookie `HttpOnly`, `Secure`, `SameSite` com expiração e proteção CSRF apropriada. Se escolher bearer token, definir expiração, rotação e armazenamento no cliente; evitar `localStorage` para tokens de produção.
- Implementar limitação de tentativas de login, mensagens que não revelem se um e-mail existe, expiração/revogação de sessão e logout real.
- Recuperação de senha com token aleatório, curto prazo de validade, uso único e resposta que não enumere contas.
- Definir verificação de e-mail/convite/aprovação para conta institucional. O sufixo `@unicap.br` no formulário é só validação de formato, não verificação da identidade.
- Aplicar autorização por ação/entidade em cada endpoint. A proteção React em `Layout.tsx` é somente UX.
- CORS restrito ao domínio do frontend; validar origem e cookies conforme estratégia escolhida.
- Validar uploads (tipo, tamanho, conteúdo), limitar payload, não armazenar arquivos arbitrários com acesso público.
- Usar variáveis de ambiente/secret manager para credenciais; `.env` nunca versionado. O `.env.example` atual é configuração do Vite e não configura um backend.
- Não usar dados demonstrativos nem informações pessoais reais em logs, screenshots ou seeds de produção.

## 8. Integração necessária no frontend

1. Criar um módulo `src/services/apiClient.ts` que use a base `VITE_API_URL`, timeout, JSON, credenciais de sessão e tratamento de erro tipado.
2. Criar serviços por domínio (`authService`, `usersService`, `machinesService`, `loansService`, etc.), mantendo componentes responsáveis por interface e estado de carregamento.
3. Substituir `usePersistentState` por consultas/mutações à API. Não migrar os arrays `initial*` para o servidor como se fossem cadastros reais; separar seeds de demonstração dos dados operacionais.
4. Remover `MOCK_USERS`, `labmu:accounts` e a senha em texto puro de `RegisterPage`. As senhas só podem transitar por HTTPS para o servidor e nunca voltar na resposta.
5. Fazer a SPA consultar `GET /auth/me` na inicialização e tratar 401/403 centralmente. O servidor deve ser a autoridade final.
6. Incluir estados visíveis de carregamento, lista vazia, erro, retry e conflito nos formulários.
7. Usar dados de perfil de `/auth/me`/`/users/me` em Sidebar, Profile e EditProfile. Fazer a alteração de e-mail como fluxo verificado se o e-mail for identidade de login.
8. Substituir os dados e KPIs fixos de Dashboard, Manutenção e Relatórios por consultas da API; tornar explícitos período, timezone, unidades e fórmulas.
9. Implementar a tela de registro de produção ou ajustar os requisitos antes de afirmar que o ciclo produtivo está funcional.
10. Atualizar os tipos TypeScript a partir de contratos compartilhados/OpenAPI e testar o comportamento contra uma API de desenvolvimento.

Os campos `VITE_API_URL` e `VITE_API_TIMEOUT` aparecem em `.env.example`, mas a configuração atual da SPA não os consome ainda. O login HTML separado aponta para `/api/auth/login` apenas se `USE_MOCK` for desligado; isso não liga automaticamente o React a esse endpoint.

## 9. Sequência de implementação recomendada

### Etapa 0 — decisões e preparação

- Confirmar as perguntas de negócio da seção 4.
- Definir perfis, política de auto-cadastro/convite, campos obrigatórios e regras de relatórios.
- Escolher runtime/framework, PostgreSQL ou outra base, migrações, autenticação e ambiente de deploy.
- Criar repositório/pasta backend e documentar como iniciar localmente; não pôr servidor e banco dentro do bundle do frontend.

### Etapa 1 — base e autenticação

- Estrutura modular por domínio, configuração de ambiente, health check, migrations e logging sem segredos.
- Modelo de usuário/credencial, login, sessão, logout, autorização admin/técnico, seed de desenvolvimento isolado e testes.
- Atualizar login/cadastro React para a API; remover armazenamento de senha local.

### Etapa 2 — cadastros de referência

- CRUD de usuário/cliente, máquinas, equipamentos portáteis e suprimentos.
- Unicidade, filtros, paginação, estados ativos/inativos e controle de acesso.
- Trocar as telas de cadastro/usuários/máquinas/portáteis/estoque para os endpoints reais.

### Etapa 3 — operações transacionais

- Entradas e movimentos de estoque.
- Empréstimo/devolução com concorrência e histórico.
- Manutenção com vínculo e histórico.
- Produção com consumo de estoque atômico e estorno auditável.

### Etapa 4 — consultas e relatórios

- Dashboard e relatórios derivados dos registros operacionais, por intervalos de data definidos.
- Testar totais contra dados conhecidos; só então remover os KPIs demonstrativos.
- Exportação CSV/PDF deve vir de dados autorizados e filtrados; o botão atual chamado “PDF / CSV” só exporta CSV no frontend.

### Etapa 5 — endurecimento e operação

- Testes de integração, segurança, migração e cópia/restauração de backup.
- Configuração de CORS, HTTPS, secrets, monitoramento, alertas, retenção e plano de recuperação.
- Revisão de autorização por rota, trilha de auditoria e acessibilidade dos erros do frontend.

## 10. Requisitos mínimos de qualidade/testes

- Testes unitários das regras de estoque, empréstimo, autorização e cálculo de relatórios.
- Testes de integração com banco real descartável para constraints e transações.
- Testes API de acesso anônimo, cada perfil, ID inexistente, duplicidades, datas inválidas e estados impossíveis.
- Teste concorrente: duas retiradas simultâneas do mesmo equipamento resultam em apenas um empréstimo ativo.
- Teste de concorrência/rollback de estoque: duas produções não podem consumir mais que o saldo e falha parcial não pode deixar movimento órfão.
- Testes de regressão UI para login, criação de usuário, edição, registro de máquina, entrada/saída e devolução.
- Dados seed marcados como desenvolvimento, repetíveis e nunca carregados em produção.
- Verificar build da SPA com `npm run build` dentro de `Implementacao/frontend/perfil_adm`.

## 11. O que não assumir ao começar

- Os usuários, máquinas, empréstimos, saldos, históricos, indicadores e relatórios presentes no navegador são demonstrações, não registros canônicos.
- `sessionStorage`/`localStorage` não sincronizam dispositivos, não aplicam concorrência e podem ser editados pelo utilizador.
- O token atual `mock-token` não autentica ninguém.
- `role`, status e dados do formulário enviados pelo navegador não são confiáveis.
- Os dados iniciais contêm datas/estados ilustrativos e nomes de variantes repetidos; não devem ser importados automaticamente.
- O formulário portátil coleta mais campos do que salva no modelo atual; preservar essa informação ao criar o contrato da API.
- Datas `Date` serializadas pelo `localStorage` voltam como strings. O contrato remoto deve definir datas ISO 8601 e o frontend deve convertê-las para exibição, em vez de depender de objetos `Date` implícitos.
- Não existe fluxo frontend para criar produção nem para registrar manutenção, apesar de ambos serem requisitos do produto.
- Não existe uma decisão completa de permissões, retenção, aprovação de cadastro, políticas de empréstimo ou fórmulas dos relatórios. Fechar essas regras com o laboratório é parte do início do backend.

## 12. Referências no código

- Aplicação React: `Implementacao/frontend/perfil_adm/src/App.tsx`, `src/main.tsx`.
- Sessão local: `src/lib/session.ts`; estado local: `src/hooks/usePersistentState.ts`; contas demonstrativas: `src/lib/accounts.ts`.
- Login/cadastro: `src/pages/LoginPage.tsx`, `src/pages/RegisterPage.tsx`.
- Cadastros: `src/pages/UserManagementPage.tsx`, `src/pages/MachinesPage.tsx`, `src/pages/RegisterEquipmentPage.tsx`.
- Estoque e empréstimo: `src/data/supplies.ts`, `src/data/loans.ts`, `src/pages/RegisterSupplyEntryPage.tsx`, `src/pages/LoanEquipmentPage.tsx`.
- Módulos ainda demonstrativos: `src/pages/DashboardPage.tsx`, `src/pages/MaintenanceManagementPage.tsx`, `src/pages/ReportsPage.tsx`.
- Login HTML independente: `Implementacao/frontend/login_adm/index.html` e `js/login.js`.
- Cadastro TSX independente: `Implementacao/frontend/cadastro_adm/index.tsx`.
