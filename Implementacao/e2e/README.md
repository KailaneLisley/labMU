# labMU — Testes end-to-end (Playwright)

Testa a plataforma inteira: backend real (Express + SQLite), SPA real (Vite) e navegador Chromium.

## Como rodar

```bash
cd Implementacao/e2e
npm install
npx playwright install chromium   # só na primeira vez
npm test                           # roda tudo
npm run test:report                # abre o relatório HTML
```

O Playwright sobe sozinho:
- o backend em `http://localhost:3001`, com um banco SQLite novo em `e2e/.tmp/` (o banco de desenvolvimento não é usado);
- a SPA em `http://localhost:3100` (o proxy do Vite encaminha `/api` para a porta 3001).

Se a porta 3001 ou 3100 já estiver em uso, a execução para com erro. Feche o processo que está usando a porta.

## Organização

| Pasta | O que cobre |
|---|---|
| `tests/ui/auth.spec.ts` | Login, cadastro, recuperação de senha, sessão e bloqueio de rotas, pela tela |
| `tests/ui/navigation.spec.ts` | Todas as telas protegidas abrem sem erro; menu lateral; rota inexistente |
| `tests/api/permissions.spec.ts` | Autenticação, perfis, token inválido, logout, bloqueio por tentativas |
| `tests/api/flows.spec.ts` | Fluxos entre módulos: estoque, produção, relatórios, empréstimo, manutenção, insumo inativo, recuperação |
| `support/` | Clientes de API e UI reutilizados pelos testes |

## Falhas esperadas

`test.fail` marca bugs conhecidos. O teste passa enquanto o bug existe e falha quando o bug for corrigido, para lembrar de trocar por `test`.

- Logout da tela não revoga o token no servidor (`tests/ui/auth.spec.ts`).

## Limites

- Os testes compartilham um banco e rodam em sequência (`workers: 1`).
- As telas de estoque, máquinas, usuários, empréstimos e relatórios leem dados locais do navegador (F1). Os testes dessas telas verificam que abrem e navegam, não que os dados vêm do servidor.
