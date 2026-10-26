# 📄 Protótipo Estático de Login — `login_adm`

Este diretório contém o protótipo estático original da tela de login do **labMU**, desenvolvido em **HTML5**, **CSS3** e **JavaScript Vanilla**.

---

## 📂 Estrutura de Arquivos

```
login_adm/
├── index.html           # Marcação semântica da tela de login
├── css/
│   └── styles.css       # Folha de estilos com a paleta institucional (vermelho #8B1329)
└── js/
    └── scripts.js       # Scripts para validação visual e alternância de visibilidade de senha
```

---

## 🎯 Finalidade e Integração com a SPA

Este protótipo foi criado nas etapas iniciais do projeto para validação de layout, responsividade e aprovação da identidade visual junto aos stakeholders.

Posteriormente, os componentes e estilos desta tela foram totalmente incorporados à aplicação oficial React em [`perfil_adm/src/pages/auth/LoginPage.tsx`](../perfil_adm/src/pages/auth/LoginPage.tsx).

### Links e Redirecionamentos Atuais:
O arquivo `index.html` foi atualizado para manter a coerência com as regras de negócio do sistema:
- O link **"Esqueceu a senha?"** direciona para a rota `/recuperar-senha` da SPA.
- O link **"Ainda não tem cadastro? Criar conta de Técnico"** direciona para a rota `/cadastro` da SPA (reforçando que apenas técnicos realizam cadastro público).

---

## 🚀 Como Visualizar
Basta abrir o arquivo `index.html` diretamente em qualquer navegador web, ou utilizar a extensão *Live Server* do VS Code.
