#  Testes Automatizados da API — `backend/tests/`

Este diretório contém a suíte de testes de integração e ponta a ponta (E2E) do backend do **labMU**, executada com o test runner nativo do Node.js (`node:test`) em conjunto com `tsx`.

---

##  Arquivos de Teste

- **`api.test.ts`:** Bateria abrangente de testes validando os seguintes cenários:
  1. **Health Check:** Garante resposta `200 OK` em `/api/health`.
  2. **Autenticação:** Validação do login com o Administrador padrão (`admin.musarq@unicap.br`), emissão do token JWT e bloqueio de senhas inválidas com status `401`.
  3. **Cadastro Público de Técnicos:** Criação de nova conta de Técnico com e-mail `@unicap.br`, Pergunta Secreta de Segurança e login imediato com as credenciais criadas.
  4. **Fluxo de Recuperação de Senha:**
     - Bloqueio de recuperação automática para Administradores (`403 ADMIN_RECOVERY_RESTRICTED`).
     - Sucesso na recuperação para Técnicos em 3 etapas (identificação do e-mail -> resposta correta da pergunta de segurança -> definição da nova senha).
     - Rejeição de respostas incorretas da pergunta secreta (`400 INCORRECT_ANSWER`).
  5. **Regras de Empréstimo:** Validação do fluxo de retirada e devolução de portáteis, incluindo a rejeição com código `409` para tentativas de empréstimo duplo do mesmo item.
  6. **Operações de Estoque & Dashboard:** Registro de entradas de lote e consulta do resumo consolidado.

---

##  Como Executar os Testes

A partir da pasta `Implementacao/backend`:

```bash
npm test
```

O comando executará:
```bash
tsx --test tests/**/*.test.ts
```

Os testes utilizam o banco de dados de desenvolvimento/teste, inicializam o *seed* automaticamente e validam o comportamento com asserções estritas do módulo `node:assert`.

