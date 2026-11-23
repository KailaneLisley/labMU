# Testes ponta a ponta (Playwright)

Testa a plataforma inteira: backend real (Express + SQLite), SPA real (Vite) e navegador Chromium. Não há mock.

## Como executar

```bash
cd Implementacao/e2e
npm install
npx playwright install chromium   # só na primeira vez
npm test                          # executa tudo
npm run test:report               # abre o relatório HTML
```

O Playwright sobe os dois servidores sozinho:

- **Backend** em `http://localhost:3001`, com um banco SQLite novo em `e2e/.tmp/` a cada execução. O banco de desenvolvimento não é usado.
- **SPA** em `http://localhost:3100`. O proxy do Vite encaminha `/api` para a porta 3001.

Se a porta 3001 ou 3100 já estiver em uso, a execução para com erro (`reuseExistingServer: false`). Feche o processo que está usando a porta antes de rodar.

## Organização

| Arquivo | Testes | O que cobre |
| :--- | :---: | :--- |
| `tests/ui/auth.spec.ts` | 11 | Login de técnico e administrador, senha errada, perfil incorreto, rota protegida, aluno sem acesso, cadastro, recuperação de senha, encerrar sessão revogando o token |
| `tests/ui/ligacao-api.spec.ts` | 2 | Dados cadastrados pela API aparecem na tela; formulário de técnico exige senha inicial |
| `tests/ui/navigation.spec.ts` | 6 | Telas protegidas abrem sem erro para cada perfil; menu lateral; rota inexistente |
| `tests/api/permissions.spec.ts` | 7 | Chamadas sem token ou com token inválido; perfis; logout; senha errada repetida |
| `tests/api/flows.spec.ts` | 6 | Fluxos entre módulos: estoque com produção e cancelamento, empréstimo, manutenção bloqueando produção, insumo inativo, relatório por técnico, recuperação de uso único |
| `support/` | — | Clientes de API e de interface reutilizados pelos testes |

Total: **32 testes**, todos passando na branch `main`.

## Limites

- Os testes compartilham um banco e rodam em sequência (`workers: 1`).
- Algumas telas ainda leem dados locais do navegador. Os testes dessas telas verificam que elas abrem e navegam, mas não que os dados vêm do servidor.
- Só o Chromium está configurado. Firefox e WebKit não são executados.
