# Camada de Implementação — labMU

Este diretório reúne o código-fonte executável do sistema **labMU**, separado em servidor (API REST) e cliente (aplicação web), além dos testes.

---

## Estrutura

```
Implementacao/
├── backend/                  # API REST em Node.js 22.13+, Express 5 e SQLite
├── frontend/
│   ├── perfil_adm/           # SPA oficial (React 18 + Vite + Tailwind CSS)
│   ├── login_adm/            # Protótipo estático da tela de login (histórico)
│   ├── cadastro_adm/         # Protótipo do componente de cadastro (histórico)
│   └── public/               # Ativos gráficos compartilhados
├── e2e/                      # Testes ponta a ponta (Playwright)
└── testes-nao-funcionais/    # Scripts de carga, stress, segurança e smoke
```

---

## Comunicação entre frontend e backend

- **Protocolo:** HTTP com corpo em `application/json`.
- **Autenticação:** JWT enviado no cabeçalho `Authorization: Bearer <token>`. O logout revoga o token no servidor.
- **Desenvolvimento:** o Vite (porta `3000`) encaminha `/api` para o backend (porta `3001`). Como o navegador fala com a mesma origem, não há requisição cruzada.
- **Produção:** o frontend e o backend ficam em origens diferentes. O backend aceita apenas as origens listadas em `CORS_ORIGINS`, com `credentials: true`.
- **Sem modo offline:** a SPA não usa dados locais como substituto da API. Se o backend estiver fora do ar, a tela mostra a mensagem de erro.

---

## Como executar o sistema completo

Em terminais separados:

**Terminal 1 — backend**

```bash
cd Implementacao/backend
npm install
npm run dev
```

A API sobe em `http://localhost:3001`. Em desenvolvimento, o banco `data/labmu.sqlite` recebe o seed com as contas de teste.

**Terminal 2 — frontend**

```bash
cd Implementacao/frontend/perfil_adm
npm install
npm run dev
```

A SPA sobe em `http://localhost:3000`.

---

## Testes

| Local | Comando | Quantidade |
| :--- | :--- | :---: |
| `backend/` | `npm test` | 47 |
| `frontend/perfil_adm/` | `npm test` | 41 |
| `e2e/` | `npm test` | 32 |
| `testes-nao-funcionais/` | scripts manuais (ver README da pasta) | — |

---

## Documentação específica

- [Backend](backend/README.md): endpoints, permissões e regras de negócio.
- [Frontend](frontend/README.md): visão geral da interface e do design system.
- [Testes ponta a ponta](e2e/README.md).
- [Testes não funcionais](testes-nao-funcionais/README.md).
- [Relatório consolidado de testes](../Documentacao/Relatorio_Consolidado_de_Testes.md).
