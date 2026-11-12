# Testes não funcionais do labMU

Scripts de carga, stress, segurança e smoke. Sem dependências externas (Node 22.13+).

## Variáveis

| Variável | Obrigatória | Uso |
|---|---|---|
| `BASE` | não (padrão `http://localhost:3055`) | URL da API |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | sim | administrador usado nos testes |
| `WRITE=1` | só para scripts que criam dados | confirma que o banco é de teste |
| `LOGIN_W` | não (padrão 5) | peso do login no mix de carga |

Scripts sem os valores obrigatórios saem com código 2 e uma mensagem.

## Scripts

| Script | Cria dados? | Para que serve |
|---|---|---|
| `setup.mjs` | sim (`WRITE=1`) | cria máquinas, insumos e equipamentos de base. Gere com `node setup.mjs > setup.json` |
| `load.mjs` | sim (`WRITE=1`) | carga com mix de endpoints: `node load.mjs <usuários> <segundos>` |
| `stress.mjs` | sim (via `load.mjs`) | rampa até o ponto de quebra e mede a recuperação |
| `security-surface.mjs` | não | cabeçalhos, CORS, tokens forjados, limite de login, enumeração, injeção, erros |
| `security-rbac.mjs` | sim (`WRITE=1`) | autorização por perfil, logout, uso único do token de recuperação, cadastro público |
| `smoke.mjs` | sim (`WRITE=1`) | caminho crítico completo: cadastros, estoque, produção, empréstimo, relatórios, logout |

Os dados criados pelos scripts **não são removidos**: a API não tem rota de exclusão para usuários nem produções. Por isso os scripts que gravam só devem rodar em ambiente local ou de teste.

## Execução local

```bash
cd Implementacao/backend
npm run build
NODE_ENV=production TRUST_PROXY=1 PORT=3055 JWT_SECRET=troque-por-um-segredo-longo \
  INITIAL_ADMIN_EMAIL=admin@labmu.test INITIAL_ADMIN_PASSWORD=Inicial123 \
  DATABASE_FILE=/tmp/labmu-carga.sqlite node dist/server.js
```

Em outro terminal, dentro de `Implementacao/testes-nao-funcionais`:

```bash
export ADMIN_EMAIL=admin@labmu.test ADMIN_PASSWORD=Inicial123 WRITE=1
node setup.mjs > setup.json
node load.mjs 50 30
node stress.mjs
node security-surface.mjs
node security-rbac.mjs
node smoke.mjs
```

## Execução online

Use a URL do ambiente em `BASE`. Antes de rodar:

- Combine com o time: os scripts de escrita criam técnicos e registros reais.
- Rode `security-surface.mjs` **uma vez**. Ele faz 12 tentativas de login falhas no IP de origem, então o IP fica bloqueado por 15 minutos.
- Não rode `stress.mjs` nem `load.mjs` no ambiente online: são testes locais.

## Relação com a suíte Playwright

`Implementacao/e2e` (`npx playwright test`) cobre a interface e a API ponta a ponta, e complementa o `smoke.mjs`.
