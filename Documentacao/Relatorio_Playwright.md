# labMU — Relatório de testes end-to-end com Playwright

> **Escrito para:** equipe de desenvolvimento e revisores do PR #106.
> **Data:** 2026-11-05.
> **Código:** `Implementacao/e2e` (branch `feature/e2e-playwright`).

## 1. Resumo

| Item | Resultado |
|---|---|
| Ferramenta | Playwright `@playwright/test` 1.47.2, navegador Chromium |
| Testes | 27: 14 de UI e 13 de API |
| Última execução | 27 passam (1,3 min). Um deles é falha esperada (bug I) |
| Bugs encontrados por estes testes | 1 novo (I: logout não revoga o token) |
| Mudança colateral | `npm test` do backend passou a usar um banco de teste separado |

Os testes sobem sozinhos o backend e a SPA, e rodam contra eles, sem mock. Eles não substituem os testes unitários de backend (40) e de frontend (35), que continuam existindo. Eles cobrem o que os testes unitários não cobrem: o caminho completo entre tela, API e banco.

## 2. Como funciona

O Playwright abre um Chromium, navega pela SPA e chama a API diretamente. Antes de cada execução, ele faz o seguinte:

1. Cria um banco SQLite novo em `Implementacao/e2e/.tmp/`, separado do banco de desenvolvimento.
2. Sobe o backend na porta **3001**, com esse banco.
3. Sobe a SPA na porta **3100**. O proxy do Vite encaminha `/api` para a porta 3001, sem mudança no `vite.config.ts`.
4. Roda os testes em sequência (`workers: 1`), porque todos compartilham o mesmo banco.

A porta 3100 foi escolhida porque a 3000 pode estar ocupada por outro processo. Se uma das portas 3001 ou 3100 já estiver em uso, a execução para com erro, sem reaproveitar um servidor desconhecido (`reuseExistingServer: false`).

### 2.1 Estrutura

```
Implementacao/e2e/
├── playwright.config.ts     # servidores, porta, reporter, navegador
├── package.json             # @playwright/test
├── support/
│   ├── api.ts               # ApiClient, contas padrão, criação de técnico
│   └── ui.ts                # login pela tela, recuperação pela tela, coleta de erros
└── tests/
    ├── ui/
    │   ├── auth.spec.ts         # 11 testes
    │   └── navigation.spec.ts   # 3 testes
    └── api/
        ├── permissions.spec.ts  # 7 testes
        └── flows.spec.ts        # 6 testes
```

### 2.2 Como rodar

```bash
cd Implementacao/e2e
npm install
npx playwright install chromium   # só na primeira vez
npm test                           # tudo
npm run test:report                # relatório HTML
```

## 3. O que é testado

### 3.1 Testes de UI (14)

Estes testes usam a tela e o backend reais.

| Arquivo | Teste | O que confirma |
|---|---|---|
| `auth.spec.ts` | Técnico com credenciais válidas | Chega ao painel e a sessão tem o perfil correto |
| | Administrador | Entra pelo perfil de administrador e vê o título do painel |
| | Senha errada | Mostra erro e fica na tela de login |
| | Perfil diferente do cadastrado | Recebe "Este usuário não possui o perfil de Técnico." |
| | Rota protegida sem sessão | Volta para `/login` |
| | Aluno criado pelo administrador | Não entra; recebe "Este perfil não possui acesso ao sistema." |
| | Cadastro de técnico | A conta criada entra no sistema |
| | Recuperação de senha | Responde a pergunta, troca a senha e entra com a nova |
| | Administrador na recuperação | Recebe o fluxo comum, sem aviso de restrição (S6) |
| | Encerrar sessão | Volta ao login e o painel fica bloqueado |
| | Encerrar sessão revoga o token | **Falha esperada** (bug I) |
| `navigation.spec.ts` | Todas as telas protegidas | Onze telas abrem sem redirecionar e sem erro não tratado na página |
| | Menu lateral | Cada item leva à tela correspondente |
| | Rota inexistente | Redireciona para o painel |

### 3.2 Testes de API (13)

Estes testes chamam o backend diretamente, com o cliente `ApiClient`.

| Arquivo | Teste | O que confirma |
|---|---|---|
| `permissions.spec.ts` | Sem token | Nove rotas protegidas respondem 401 |
| | Token inválido | 401 |
| | Técnico tentando operações de administrador | 403 em criar usuário, ajustar estoque e remover máquina |
| | Administrador | Acessa usuários, máquinas e relatórios |
| | Logout pela API | Revoga o token: `/auth/me` passa de 200 para 401 |
| | Aluno pela API de login | 403 `ROLE_NOT_ALLOWED` |
| | Senha errada repetida | 401 cinco vezes e 429 na sexta |
| `flows.spec.ts` | Estoque | Entrada, produção com consumo, relatório de consumo e cancelamento que devolve o saldo |
| | Empréstimo | Retirada, segunda retirada recusada (409), devolução libera o equipamento |
| | Manutenção | Máquina em manutenção recusa produção (`MACHINE_INACTIVE`) até a conclusão |
| | Insumo inativo | Não recebe consumo (409) e volta a receber após reativação |
| | Relatório por técnico | Conta a produção e agrupa por mês |
| | Recuperação de senha | Token de uso único: a segunda redefinição com o mesmo token falha |

## 4. Resultado

Última execução, em 2026-11-05:

```
27 passed (1.3m)
```

Os testes são estáveis entre execuções: a suíte foi rodada duas vezes seguidas, com banco novo, e passou nas duas. Os dados de cada teste usam sufixos únicos (`unique()`), para que um teste não dependa do que outro criou.

O símbolo ✘ no reporter `list` aparece para a falha esperada. Ela conta como sucesso no resumo. Verifiquei que, sem o `test.fail`, o teste falha pelo motivo certo: `/auth/me` responde **200** com o token depois do logout, quando deveria responder 401.

## 5. Bugs encontrados

| # | Gravidade | Descrição | Situação |
|---|---|---|---|
| I | Alta | O botão "Encerrar Sessão" limpa só o armazenamento do navegador e não chama `POST /auth/logout`. O token continua válido no servidor. A revogação implementada no backend (S3) não tem efeito pela interface. | Aberto. Documentado com `test.fail` |

Os outros bugs do projeto estão em `Relatorio_Testes_Automatizados.md` (seção 4). Os testes E2E não os alteram.

## 6. Decisões e limites

- **Mesmo banco, execução em sequência.** Paralelizar exigiria um banco por worker. Isso não foi feito porque a suíte já roda em poucos minutos.
- **Telas com dados locais.** Estoque, máquinas, usuários, empréstimos e relatórios leem dados do `localStorage` (F1). O E2E verifica que essas telas abrem, mas não que os dados vêm do servidor. Quando essas telas forem conectadas à API, os testes devem passar a checar os dados também.
- **Só Chromium.** O projeto está configurado apenas para Chromium (`Desktop Chrome`). Firefox e WebKit não foram incluídos.
- **Sem captura de tela em execução normal.** Capturas e traces são gravados apenas quando um teste falha (`only-on-failure`, `retain-on-failure`).
- **Porta da SPA diferente.** O e2e usa 3100 para não depender de outro processo na 3000.
- **Dependência de tempo.** Os testes de relatório usam a data do dia em UTC. Se a execução atravessar a meia-noite UTC, a verificação do dia pode falhar. O risco é pequeno, mas existe.

## 7. Próximos passos

1. **Corrigir o logout (bug I).** Quando o botão "Encerrar Sessão" chamar `POST /auth/logout` antes de limpar a sessão, trocar o `test.fail` por `test` no `auth.spec.ts`.
2. **Conectar as telas à API.** A cada tela conectada, substituir o teste de "abre e navega" por um que confira os dados vindos do servidor.
3. **Incluir Firefox.** Adicionar um projeto `firefox` no `playwright.config.ts` e rodar a suíte nele.
4. **Rodar no CI.** Configurar a execução em cada PR, com o `npx playwright install --with-deps chromium`.
5. **Rodar contra um banco por worker**, se a suíte crescer e precisar de paralelismo.

## 8. Como este relatório foi produzido

Os números deste relatório vêm de uma execução real da suíte, feita na data indicada. Os nomes dos testes e as asserções foram conferidos nos arquivos do PR #106. O bug I foi confirmado rodando uma cópia do teste sem `test.fail`, que falhou com `Expected: 401, Received: 200`.
