# 📄 Protótipo de Cadastro — `cadastro_adm`

Este diretório contém o fatiamento inicial do componente de cadastro do **labMU**, gerado a partir do protótipo do Figma/Stitch e estilizado com **Tailwind CSS**.

---

## 📂 Estrutura de Arquivos

```
cadastro_adm/
├── index.tsx            # Componente React com os campos do formulário de cadastro
├── tailwind.config.js   # Configuração de temas e cores do Tailwind
└── tailwind.css         # Importações do Tailwind (@tailwind base, components, utilities)
```

---

## 🎯 Finalidade e Migração para a SPA

Este componente foi construído como prova de conceito para estruturar o layout e as posições dos ícones no formulário de cadastro.

O fluxo definitivo de cadastro foi transferido e expandido na SPA oficial em:  
👉 [`perfil_adm/src/pages/auth/RegisterPage.tsx`](../perfil_adm/src/pages/auth/RegisterPage.tsx)

Na versão final em `RegisterPage.tsx`:
- Foram adicionadas as validações de e-mail institucional (`@unicap.br`).
- Foi implementada a política de segurança que restringe o autocadastro a **Técnicos**.
- Foi introduzida a seção obrigatória de **Pergunta Secreta de Segurança** e **Resposta Secreta** para a recuperação autônoma de senha.
- Foi feita a integração direta com o endpoint `POST /api/auth/register` do backend.
