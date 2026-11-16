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

Copie a URI do Supabase em **Connect → Transaction pooler**. Não use a senha literal do exemplo, não use a URI de conexão direta para as Functions e nunca exponha `DATABASE_URL`, senha do banco ou credenciais administrativas no frontend, em variáveis `VITE_*` ou no Git.

O backend usa JWT próprio e conecta ao PostgreSQL diretamente pelo driver `pg`. Não é necessário configurar `SUPABASE_URL`, `anon key` ou `service_role key` para esse fluxo. As variáveis `INITIAL_ADMIN_EMAIL` e `INITIAL_ADMIN_PASSWORD` são usadas somente no comando administrativo local descrito abaixo; não as mantenha na Vercel.

## Primeiro acesso

O entrypoint serverless **não executa bootstrap nem cria contas durante as requisições**. Para criar o primeiro administrador, execute o comando administrativo uma única vez a partir de um ambiente local confiável com acesso ao Supabase:

```powershell
$env:NODE_ENV = "production"
$env:DATABASE_URL = "postgresql://..."
$env:INITIAL_ADMIN_EMAIL = "admin@unicap.br"
$env:INITIAL_ADMIN_PASSWORD = "uma-senha-forte-e-temporaria"
npm run bootstrap:admin
Remove-Item Env:INITIAL_ADMIN_PASSWORD
```

O comando cria a conta somente se ainda não existir nenhum administrador. Depois:

1. Faça o deploy do backend e confirme o login.
2. Remova `INITIAL_ADMIN_PASSWORD` de qualquer ambiente Vercel em que tenha sido cadastrada.
3. Não habilite seed de demonstração em produção.


## Antes de promover para produção

- Regenerar e commitar `package-lock.json` com `npm install` dentro desta pasta.
- Executar `npm test` usando um PostgreSQL de teste isolado, nunca o banco de produção.
- Confirmar build TypeScript e testar login, recuperação de senha, permissões, estoque, produção, empréstimos, manutenção e relatórios.
- Configurar o domínio do frontend em `CORS_ORIGINS`.
- Confirmar limites e termos do plano Vercel aplicável ao uso institucional do laboratório.

## Importar os dados antigos do SQLite

O schema Supabase está criado, mas a importação de registros é uma etapa separada. O script `src/database/migrateSqliteToPostgres.ts`:

- lê o arquivo SQLite sem modificá-lo;
- importa as 9 tabelas na ordem das chaves estrangeiras;
- exige que todas as tabelas de destino estejam vazias;
- executa a importação em uma única transação e confere as contagens;
- cancela tudo se encontrar conflito de estrutura, chave estrangeira ou erro de inserção.

Antes de executar, obtenha uma cópia consistente do arquivo SQLite legado (por exemplo, exportando/baixando o arquivo de dados do serviço antigo). Não presuma que o arquivo existe no GitHub ou que o disco do serviço antigo é persistente.

No PowerShell, a partir desta pasta:

```powershell
$env:SQLITE_SOURCE_FILE = "D:\caminho\para\labmu.sqlite"
npm run migrate:sqlite
```

A variável `DATABASE_URL` precisa apontar para o PostgreSQL do Supabase. Como a importação é transacional e exige tabelas vazias, execute-a uma única vez e confira o resumo de contagens antes de liberar o sistema.
