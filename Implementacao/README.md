# Camada de Implementação — labMU

Este diretório reúne todo o código-fonte executável do sistema **labMU**, organizado de forma desacoplada entre servidor (API REST) e cliente (aplicação web).

---

##  Estrutura de Pastas

```
Implementacao/
├── backend/                  # Servidor RESTful em Node.js 22, Express e SQLite
└── frontend/                 # Aplicações e protótipos de interface com o usuário
    ├── perfil_adm/           # SPA oficial do sistema (React 18 + Vite + Tailwind CSS)
    ├── login_adm/            # Protótipo estático independente da tela de login (HTML5/CSS3)
    ├── cadastro_adm/         # Protótipo de componente de cadastro
    └── public/               # Ativos gráficos compartilhados (logotipos, ícones)
```

---

##  Comunicação Frontend ↔ Backend

- **Protocolo:** HTTP/1.1 RESTful com payloads formatados em `application/json`.
- **Autenticação:** Baseada em tokens stateless **JWT (JSON Web Token)** transmitidos pelo cabeçalho:
  ```http
  Authorization: Bearer <token_jwt>
  ```
- **CORS:** O servidor backend está configurado com permissão de origens cruzadas (`cors({ origin: true, credentials: true })`), permitindo que a SPA React (rodando na porta `5173`) se comunique perfeitamente com a API (rodando na porta `3001`).
- **Resiliência / Modo Híbrido:** A SPA oficial (`perfil_adm`) foi desenvolvida com tolerância a falhas: caso a API esteja temporariamente inacessível, a aplicação recorre ao armazenamento local (`localStorage`), permitindo demonstrações visuais e testes de interface sem interrupções.

---

## Como Executar o Sistema Completo

Para uma experiência integrada, execute o backend e o frontend em terminais separados:

### Terminal 1 — Backend:
```bash
cd Implementacao/backend
npm install
npm run dev
```
> O servidor iniciará em `http://localhost:3001` e realizará o *seed* automático do banco de dados SQLite.

### Terminal 2 — Frontend:
```bash
cd Implementacao/frontend/perfil_adm
npm install
npm run dev
```
> O frontend iniciará em `http://localhost:5173`.

---

##  Documentações Específicas

Para detalhes aprofundados sobre cada camada, consulte:

-  **[Documentação do Backend](backend/README.md)**: Endpoints, regras de negócio, banco de dados e testes.
-  **[Documentação do Frontend](frontend/README.md)**: Design system, fluxo de telas, rotas e componentes.
