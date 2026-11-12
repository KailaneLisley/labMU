# Testes não funcionais do labMU

Scripts usados para carga, stress, segurança e smoke. Não dependem de nenhuma biblioteca externa (Node 22.13+).

## Preparação (local)

```bash
cd Implementacao/backend
npm run build
NODE_ENV=production TRUST_PROXY=1 PORT=3055 JWT_SECRET=troque-por-um-segredo-longo \
  INITIAL_ADMIN_EMAIL=admin@labmu.test INITIAL_ADMIN_PASSWORD=Inicial123 \
  DATABASE_FILE=/tmp/labmu-carga.sqlite node dist/server.js
```

Em outro terminal, dentro de `Implementacao/testes-nao-funcionais`:

```bash
node setup.mjs > setup.json        # cria máquinas, insumos e equipamentos de base
node load.mjs 50 30                # carga: 50 usuários simultâneos por 30 s
node stress.mjs                    # stress em degraus até o ponto de quebra + recuperação
```

Variáveis: `BASE` (padrão `http://localhost:3055`), `LOGIN_W` (peso do login no mix, padrão 5).

## Segurança

```bash
BASE=http://localhost:3055 ADMIN_EMAIL=admin@labmu.test ADMIN_PASSWORD=Inicial123 node security.mjs
BASE=http://localhost:3055 ADMIN_EMAIL=admin@labmu.test ADMIN_PASSWORD=Inicial123 node security2.mjs
```

`security.mjs` faz verificações não destrutivas (cabeçalhos, CORS, tokens forjados, limite de login, injeção, payload grande).
`security2.mjs` cria um técnico de teste e verifica a matriz de autorização, a revogação de sessão e erros sem detalhe interno.

Para o ambiente online, use a URL do Render no `BASE` e **só** `security.mjs` e `security2.mjs` (sem `stress.mjs`, que é só para local). Contas de teste não devem ser criadas no ambiente de produção sem combinar antes.

## Smoke

```bash
BASE=http://localhost:3055 ADMIN_EMAIL=admin@labmu.test ADMIN_PASSWORD=Inicial123 node smoke.mjs
```

Percorre o caminho crítico (login, cadastros, estoque com cancelamento, produção, manutenção, empréstimo, relatórios, dashboard, permissões e logout). Sai com código 1 se algo falhar.

A suíte Playwright (`Implementacao/e2e`, `npx playwright test`) complementa o smoke na interface.
