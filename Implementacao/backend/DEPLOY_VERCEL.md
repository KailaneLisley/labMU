# Deploy do backend labMU na Vercel

## Configuração do projeto

Ao importar o repositório na Vercel:

- **Root Directory:** `Implementacao/backend`
- **Framework:** Express (detecção automática)
- **Node.js:** versão 22 ou superior, conforme `package.json`
- Não configure um comando `app.listen()` para produção. A Vercel usa `src/server.ts`, que exporta o Express app como default.
- Para desenvolvimento local, use `npm run dev`; ele inicia `src/localServer.ts` e executa o bootstrap uma única vez na inicialização.

## Variáveis de ambiente

Configure em **Project Settings → Environment Variables** (Production, Preview e Development conforme necessário):

| Variável | Valor |
| --- | --- |
| `NODE_ENV` | `production` |
| `DATABASE_URL` | URI privada do **Transaction pooler** do Supabase (porta 6543) |
| `PG_POOL_MAX` | `1` |
| `JWT_SECRET` | segredo aleatório forte, exclusivo do ambiente |
| `JWT_EXPIRES_IN` | `7d` (ou política aprovada pelo projeto) |
| `CORS_ORIGINS` | domínio(s) HTTPS exatos do frontend, separados por vírgula |
| `TRUST_PROXY` | `1` |
| `INITIAL_ADMIN_EMAIL` | e-mail institucional do primeiro administrador |
| `INITIAL_ADMIN_PASSWORD` | senha forte temporária para o primeiro administrador |

Copie a URI do Supabase em **Connect → Transaction pooler**. Não use a senha literal do exemplo, não use a URI de conexão direta para as Functions e nunca exponha `DATABASE_URL`, senha do banco ou credenciais administrativas no frontend, em variáveis `VITE_*` ou no Git.

O backend usa JWT próprio e conecta ao PostgreSQL diretamente pelo driver `pg`. Não é necessário configurar `SUPABASE_URL`, `anon key` ou `service_role key` para esse fluxo.

## Primeiro acesso

1. Faça o deploy com `INITIAL_ADMIN_EMAIL` e `INITIAL_ADMIN_PASSWORD` configurados.
2. Execute o primeiro acesso e confirme que o administrador consegue entrar.
3. Remova `INITIAL_ADMIN_PASSWORD` das variáveis de ambiente após a criação da conta.
4. Não habilite seed de demonstração em produção.

O entrypoint serverless não executa seed nem cria contas por requisição. O bootstrap local/administrativo fica separado.

## Antes de promover para produção

- Regenerar e commitar `package-lock.json` com `npm install` dentro desta pasta.
- Executar `npm test` usando um PostgreSQL de teste isolado, nunca o banco de produção.
- Confirmar build TypeScript e testar login, recuperação de senha, permissões, estoque, produção, empréstimos, manutenção e relatórios.
- Configurar o domínio do frontend em `CORS_ORIGINS`.
- Confirmar limites e termos do plano Vercel aplicável ao uso institucional do laboratório.
