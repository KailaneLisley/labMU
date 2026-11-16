# Testes Automatizados da API — `backend/tests/`

A suíte usa o test runner nativo do Node.js (`node:test`) com `tsx`. Após a migração, os testes de integração usam PostgreSQL; não utilizam mais o arquivo SQLite.

## Pré-requisitos

1. Configure `DATABASE_URL` apontando para um **banco de teste descartável**, nunca para produção.
2. Aplique nesse banco o schema de `supabase/migrations/202611160001_initial_schema.sql`.
3. Garanta que o usuário da conexão possa criar, ler e alterar os registros das tabelas de teste.

O hook de preparação executa o seed de desenvolvimento e os testes criam registros adicionais. Portanto, os dados desse banco podem ser alterados durante a execução.

### PowerShell

```powershell
$env:DATABASE_URL = "postgresql://..."
$env:NODE_ENV = "test"
npm test
```

### Bash

```bash
DATABASE_URL="postgresql://..." NODE_ENV=test npm test
```

## Execução

A partir de `Implementacao/backend`:

```bash
npm test
```

Os testes cobrem health check, autenticação, cadastro, recuperação de senha, autorização por perfil, máquinas, equipamentos portáteis, empréstimos, estoque, produção, relatórios e regras de negócio.

**Importante:** não execute a suíte apontando para o banco de produção. O seed e os cenários automatizados inserem e atualizam registros.
