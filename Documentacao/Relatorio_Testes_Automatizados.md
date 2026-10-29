# labMU — Relatório de testes automatizados

> **Escrito para:** equipe de desenvolvimento e revisores do PR.
> **Data:** 2026-10-29. **Branches:** `feature/backend-proximos-passos` (backend) e `feature/front-testes` (SPA).

## 1. Resumo

| Área | Testes | Resultado | Como rodar |
|---|---|---|---|
| Backend (API) | 40 | 40 passam | `npm test` em `Implementacao/backend` |
| Frontend (SPA `perfil_adm`) | 35 | 35 passam, sendo 2 de falha esperada | `npm test` em `Implementacao/frontend/perfil_adm` |
| Build da SPA | — | passa (`tsc` + Vite) | `npm run build` |
| Type-check do backend | — | sem erros | `npx tsc --noEmit` |

Os testes de falha esperada (`it.fails`) passam enquanto o bug existe. Quando o bug for corrigido, o teste falha de propósito e deve virar um teste normal.

Dos bugs encontrados, **5 foram corrigidos** durante este trabalho e **8 continuam abertos** (seção 4).

## 2. O que foi testado

### 2.1 Backend — `Implementacao/backend/tests/api.test.ts`

Cada teste sobe a API em memória e chama as rotas por HTTP.

- **Autenticação e recuperação de senha:** login, senha errada, cadastro de técnico, recuperação por pergunta de segurança, uso único do token de recuperação.
- **Segurança (S1 a S7):** contas de aluno sem acesso, CORS restrito, logout com revogação de token, limite de tentativas de login, conta inativa, `JWT_SECRET` obrigatório em produção, seed desligado em produção.
- **Estoque:** entrada, ajuste manual (só administrador), consumo, estorno de produção, insumo inativo.
- **Produção:** consumo negativo, duração negativa, insumo obrigatório com consumo, técnico em nome próprio, máquina inativa, tipo incompatível, escaneamento sem consumo, referência do movimento.
- **Empréstimo:** data inválida, status pelo fuso de Recife, devolução, equipamento em manutenção ou inativo.
- **Manutenção:** registro, atualização que recalcula a preventiva, filtros, 404.
- **Máquinas:** cadastro, filtros, atualização, remoção ou inativação conforme o histórico.
- **Permissões:** matriz de perfil por rota (técnico recusado em rotas de administrador) e 401 sem token.
- **Relatórios e dashboard:** formato, métricas, filtro "até" inclusivo, agrupamento mensal.
- **Validação:** enums de perfil, situação, tipo e status; JSON malformado; corpo ausente; valores negativos.

### 2.2 Frontend — `Implementacao/frontend/perfil_adm/src`

Ferramentas: Vitest 0.34, Testing Library (React 14) e jsdom. Os testes chamam a API por um espião (`vi.spyOn(api, ...)`), então não dependem do backend rodando.

- **Cliente de API (`services/api.test.ts`, 8):** URL, token no cabeçalho, query string, mensagens de erro, 401 e 403, falha de conexão, logout tolerante a erro.
- **Sessão (`lib/session.test.ts`, 5):** armazenamento conforme "lembrar de mim", perfis inválidos, sessão corrompida, limpeza.
- **Login (`pages/auth/LoginPage.test.tsx`, 8):** validação de e-mail e senha, login aceito com gravação de sessão, perfil enviado, erro da API, senha limpa após erro, bloqueio por tentativas. Inclui o teste de falha esperada F3.
- **Recuperação de senha (`pages/auth/ForgotPasswordPage.test.tsx`, 8):** e-mail fora do domínio, pergunta mostrada, erros da API em cada etapa, senhas que não conferem, fluxo completo, administrador segue o fluxo normal.
- **Cadastro (`pages/auth/RegisterPage.test.tsx`, 6):** validação de e-mail, senha e confirmação, envio com redirecionamento, erro da API, falha esperada F2.

**Não coberto no frontend:** telas autenticadas (dashboard, usuários, máquinas, estoque, empréstimos, relatórios, perfil). Elas ainda usam dados locais em boa parte dos casos e não têm testes.

## 3. Bugs corrigidos

| # | Onde | Problema | Como foi encontrado | Correção |
|---|---|---|---|---|
| 1 | Backend, manutenção | Concluir uma manutenção por `PATCH` devolvia a máquina a `ativa`, mas não atualizava a última manutenção nem a próxima preventiva. Só a criação já concluída fazia isso. | Teste de manutenção | Cálculo extraído para `markMachineOperational`, usado pelas duas rotas |
| 2 | Frontend, recuperação de senha | Depois da correção S6 do backend, administradores recebem a pergunta-isca. A tela ainda procurava a palavra "Administrador" na resposta de erro, então o aviso de recuperação restrita nunca aparecia. O ramo virou código morto. | Leitura do código, depois teste do fluxo do administrador | Ramo, estado e aviso removidos da tela. Teste novo confirma o fluxo normal |
| 3 | Backend, S6 | O e-mail de administrador mostrava uma resposta diferente da de conta inexistente, o que revelava a existência da conta. | Teste de resposta uniforme | Pergunta-isca e resposta de erro iguais para quem não é técnico |
| 4 | Backend, S8 | Resposta de segurança guardada em texto puro. | Teste de hash | Hash bcrypt, com migração das contas antigas no primeiro uso |
| 5 | Backend, validação | Perfis, situações, tipos e status fora do domínio eram aceitos ou devolviam erro genérico. | Teste de enums | Validação explícita nos serviços, com código específico |

Os itens R6 a R9 e V1 a V2 foram corrigidos antes desta rodada, com testes de regressão. Estão documentados em `Relatorio_de_Testes_labMU.md`.

## 4. Bugs abertos encontrados

| # | Gravidade | Onde | Descrição | Evidência |
|---|---|---|---|---|
| A | Alta | Frontend, login (F3) | Com o servidor fora do ar, o login aceita `admin.musarq@unicap.br` / `Admin@123` e `tecnico.musarq@unicap.br` / `Tecnico@123`, que estão no código, e cria sessão com `mock-token`. | `LoginPage.test.tsx`, teste `it.fails` (F3) |
| B | Alta | Frontend, cadastro (F2) | Com o servidor fora do ar, o cadastro grava a senha em texto puro no `localStorage` (`labmu:accounts`). | `RegisterPage.test.tsx`, teste `it.fails` (F2) |
| C | Média | Frontend, recuperação de senha | O fallback offline revela, a partir das contas locais, se o e-mail existe e se é administrador. O teste não cobre esse caminho. | Leitura de `ForgotPasswordPage.tsx`, linhas do fallback |
| D | Média | Backend, recuperação de senha | A resposta de segurança não tem limite de tentativas. Só o login tem limite, então a resposta pode ser tentada à vontade. | Leitura de `verifyForgotAnswer` |
| E | Média | Infra de testes | A suíte do backend grava no banco de desenvolvimento `data/labmu.sqlite`, porque nenhum teste define `DATABASE_FILE`. Rodar `npm test` altera os dados locais. | Data de modificação do arquivo após `npm test` |
| F | Média | Infra de testes | Parte dos testes antigos depende da ordem de execução. O teste de recuperação troca a senha do técnico padrão, e o primeiro insumo fica com saldo zero depois dos ajustes. Os testes novos não dependem disso, mas os antigos ainda dependem. | Falhas reproduzidas durante o desenvolvimento |
| G | Baixa | Frontend, API (F6) | `VITE_API_TIMEOUT` não é lido e não há timeout nas requisições. Uma requisição pode ficar pendurada indefinidamente. | Leitura de `services/api.ts` |
| H | Baixa | Backend, produção | Com `NODE_ENV=production` não há administrador criado, e não existe procedimento para criar o primeiro. | Seed desligado, sem substituto |

## 5. Pontos não verificados

- **Contrato entre frontend e backend:** não conferi, rota por rota, se os caminhos e os parâmetros chamados pela SPA (`services/api.ts`) batem com as rotas do backend. Alguns métodos, como `getUsers` e `getMachines`, enviam parâmetros que o backend pode ignorar. Vale um teste de contrato.
- **Passada manual das 39 checagens de API** do relatório principal não foi refeita depois das correções.
- **Interface no navegador:** os testes de frontend usam jsdom. Não houve teste em navegador real.
- **Concorrência e carga:** não testadas.
- **Itens de regra abertos:** C1 (datas com fuso), C2 (paginação), dashboard com período, D1 e D2 (decisões do laboratório).

## 6. Como rodar

```bash
# Backend
cd Implementacao/backend
npm install
npm test          # 40 testes
npx tsc --noEmit

# Frontend
cd Implementacao/frontend/perfil_adm
npm install
npm test          # 35 testes (2 de falha esperada)
npm run build
```

Antes de rodar os testes do backend, faça uma cópia de `data/labmu.sqlite` se quiser preservar os dados locais (bug E).
