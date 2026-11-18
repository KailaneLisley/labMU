# Testes Automatizados da API — `backend/tests/`

A suíte usa o test runner nativo do Node.js (`node:test`) com `tsx`. Os testes de integração usam exclusivamente `TEST_DATABASE_URL`, nunca a conexão normal de desenvolvimento/produção.

## Preparação obrigatória

1. Crie um projeto Supabase separado para testes ou use um PostgreSQL descartável. **Não use o banco de produção.**
2. Aplique nesse banco o schema de `supabase/migrations/202611160001_initial_schema.sql`.
3. Copie `.env.test.example` para `.env.test` e configure `TEST_DATABASE_URL` com a conexão privada desse banco.
4. Mantenha `CONFIRM_TEST_DATABASE_RESET=true` em `.env.test`: o hook inicial limpa as nove tabelas antes de semear os dados. A conexão recusa executar testes sem `TEST_DATABASE_URL` quando `NODE_ENV=test`.

### PowerShell

```powershell
Copy-Item .env.test.example .env.test
# Edite .env.test e informe TEST_DATABASE_URL
npm test
```

### Bash

```bash
cp .env.test.example .env.test
# Edite .env.test e informe TEST_DATABASE_URL
npm test
```

## Execução

A partir de `Implementacao/backend`:

```bash
npm test
```

A suíte cobre health check, autenticação, cadastro, recuperação de senha, autorização por perfil, máquinas, equipamentos portáteis, empréstimos, estoque, produção e relatórios.

**Atenção:** o banco configurado em `.env.test` será apagado e repovoado a cada execução. Nunca aponte `TEST_DATABASE_URL` para um banco com dados que precisam ser preservados.
