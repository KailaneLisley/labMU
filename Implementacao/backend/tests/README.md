# Testes automatizados do backend

Suíte de integração da API, escrita com o test runner nativo do Node (`node:test`) e executada com `tsx`. As asserções usam `node:assert/strict`.

---

## Arquivos

| Arquivo | Testes | Conteúdo |
| :--- | :---: | :--- |
| `api.test.ts` | 45 | Chamadas HTTP ao app Express, cobrindo autenticação, segurança, regras de negócio, permissões, relatórios e validação |
| `errorHandler.test.ts` | 2 | Tratamento centralizado de erros |

Os grupos de `api.test.ts` seguem o nome das regras:

- **Autenticação e recuperação:** login, senha errada, cadastro de técnico, recuperação por pergunta secreta, token de uso único, administrador com recuperação restrita.
- **Segurança (S1 a S9):** conta de aluno sem acesso, CORS restrito, logout revogando o token, limite de tentativas, conta inativa sem revelar o status, `JWT_SECRET` obrigatório em produção, nenhuma conta padrão em produção, resposta uniforme para contas inexistentes, hash da resposta de segurança, migração bcrypt para scrypt.
- **Estoque e produção (R1 a R9):** entrada, ajuste manual só para administrador, consumo, estorno, insumo inativo, técnico não registra produção em nome de outro, máquina inativa ou incompatível recusada, referência do movimento, relatório mensal por técnico.
- **Empréstimos:** data inválida, status pelo fuso de Recife, devolução, equipamento em manutenção ou inativo.
- **Manutenção e máquinas:** registro, conclusão que recalcula a preventiva, filtros, remoção com ou sem histórico.
- **Permissões:** matriz de perfis por rota e 401 sem token.
- **Validação (V1 a V3):** enums, valores negativos, JSON malformado, mensagens de violação de `CHECK`.

---

## Como executar

Na pasta `Implementacao/backend`:

```bash
npm test
```

O script `test` faz o seguinte:

1. Remove `data/test-labmu.sqlite` e os arquivos `-wal` e `-shm` de execuções anteriores.
2. Define `DATABASE_FILE=./data/test-labmu.sqlite`.
3. Roda `tsx --test tests/**/*.test.ts`.

O banco de desenvolvimento (`data/labmu.sqlite`) não é usado nem alterado pelos testes.

---

## Observações

- Os testes compartilham um único banco e rodam em sequência. Como os registros persistem entre testes, cada teste deve criar os próprios dados em vez de depender do estado deixado por outro.
- Um teste de produção (`S7`) inicia um processo filho com `NODE_ENV=production` e um banco temporário, para verificar que nenhuma conta padrão é criada.
