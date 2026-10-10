# labMU — Gestão do Laboratório

## 📋 Descrição

Aplicação administrativa do laboratório labMU, com dashboard, usuários, máquinas, manutenção, estoque, empréstimos, relatórios e perfil.

> **Modo de demonstração:** a autenticação e os dados são simulados no navegador. As alterações ficam no `localStorage` do dispositivo e não são sincronizadas entre usuários ou navegadores. Não use este modo para proteger ou armazenar dados reais.

Credenciais para entrar:

| Perfil | E-mail | Senha |
|---|---|---|
| Administrador | `admin.musarq@unicap.br` | `Admin@123` |
| Técnico | `tecnico.musarq@unicap.br` | `Tecnico@123` |

## 🎯 Funcionalidades

- Exibir informações do usuário logado (nome, email, cargo, localização)
- Prover acesso rápido a edição de perfil
- Facilitar logout do sistema
- Cadastrar e administrar usuários e máquinas
- Criar uma conta demonstrativa de Técnico pela tela pública de cadastro
- Atualizar estoque, registrar entradas e exportar relatórios CSV
- Cadastrar equipamentos portáteis, acompanhar empréstimos e registrar devoluções

## 🏗️ Estrutura

```
perfil_adm/
├── index.html
├── src/
│   ├── App.tsx
│   ├── components/
│   ├── data/
│   ├── hooks/
│   ├── lib/
│   └── pages/
├── package.json
└── README.md
```

## 🚀 Como Usar

### Instalação

```bash
npm install
# ou
yarn install
```

### Desenvolvimento

```bash
npm run dev
# ou
yarn dev
```

### Build

```bash
npm run build
# ou
yarn build
```

## 🎨 Paleta de Cores

A paleta segue o design system labMU:

| Variável | Cor | Uso |
|----------|-----|-----|
| `--brand` | #8B1329 | Cor primária (vermelha) |
| `--brand-dark` | #6b0f1f | Hover e variações |
| `--brand-soft` | #fdeaea | Fundos suaves |
| `--bg` | #fff9f6 | Fundo de página |
| `--surface` | #ffffff | Branco para cards |
| `--input-bg` | #f7f0f0 | Fundo de inputs/campos |
| `--text` | #1f1a1b | Texto principal |
| `--muted` | #7a6e70 | Texto secundário |
| `--error` | #c0182f | Erros e alertas |
| `--success` | #1b7a43 | Sucessos |

## 📱 Responsividade

A tela é responsiva e funciona bem em:
- ✅ Desktop (1200px+)
- ✅ Tablet (768px - 1199px)
- ✅ Mobile (320px - 767px)

Grid de dados usa `md:grid-cols-2` que se adapta automaticamente.

## 🔄 Fluxos Integrados

### Login → Perfil
- Após login bem-sucedido, usuário pode acessar seu perfil

### Cadastro → Login
- A tela `/cadastro` cria uma conta local de Técnico com e-mail institucional, matrícula e senha.
- O novo usuário também aparece no módulo de usuários; o cadastro preenche o e-mail na tela de login.
- Contas administrativas continuam sendo solicitadas à coordenação e não podem ser criadas pelo cadastro público.

### Perfil → Editar Perfil
- Botão "Editar Perfil" navega para `/editar-perfil`
- Dados editáveis são salvos no navegador.

### Perfil → Logout
- Botão "Encerrar Sessão" executa logout
- Redireciona para `/login`

### Dashboard → Perfil
- Ícone de usuário/perfil na navegação leva para `/perfil`

### Estoque e empréstimos
- Cadastros e movimentações atualizam as listas e indicadores depois de salvar.
- Os dados continuam disponíveis no mesmo navegador após recarregar a página.
- O botão de exportação baixa CSV compatível com planilhas.

## 🔌 Integração

### Autenticação e persistência

O login aceita as credenciais de demonstração acima e contas de Técnico criadas pela tela `/cadastro`. Contas e senhas cadastradas, sessão e dados administrativos ficam no armazenamento local do navegador. Essa implementação é apenas demonstrativa: não protege senhas nem verifica a identidade institucional. Para produção, conecte uma API com autenticação real, autorização no servidor e armazenamento centralizado.

## 📦 Dependências

- **react**: ^18.2.0
- **react-dom**: ^18.2.0
- **lucide-react**: ^0.263.0 (Ícones)
- **tailwindcss**: ^3.3.0
- **typescript**: ^5.0.0

## 🧪 Testes Recomendados

- [ ] Exibição correta de dados do usuário
- [ ] Responsividade em diferentes tamanhos de tela
- [ ] Navegação para Dashboard (voltar)
- [ ] Navegação para Editar Perfil
- [ ] Logout funcional
- [ ] Acessibilidade (ARIA labels, contrast)
- [ ] Performance (load time, rendering)

## 🔐 Segurança

- Rotas da interface exigem uma sessão local válida.
- O login mockado e a proteção no cliente **não** substituem autenticação/autorização no servidor.
- Não armazene dados pessoais reais neste protótipo.

## 🎨 Customização

### Adicionar novo campo de perfil

1. Adicione o campo ao tipo `UserProfile` em `src/pages/ProfilePage.tsx` e ao formulário, caso seja editável, em `src/pages/EditProfilePage.tsx`:
   ```typescript
   interface UserProfile {
     // ... campos existentes
     newField: string;
   }
   ```

2. Adicione o campo correspondente na seção "Dados Básicos" de `src/pages/ProfilePage.tsx`.
   ```tsx
   <div className="data-field">
     <p className="data-field-label">NOVO CAMPO</p>
     <div className="data-field-value">
       <svg className="data-field-icon">...</svg>
       <p className="font-semibold text-[#1f1a1b]">{profile.newField}</p>
     </div>
   </div>
   ```

### Alterar cores

Edite as variáveis de cor em `src/index.css`:

```css
:root {
  --brand: #8b1329;
}
```

## 🤝 Contribuições

- Siga o padrão de código usado em `cadastro_adm/`
- Use TypeScript para type safety
- Mantenha componentes simples e reutilizáveis
- Documente mudanças significativas

## 📝 Changelog

### v1.0.0 (2026-10-05)
- ✅ Componente inicial de perfil
- ✅ Grid de dados básicos
- ✅ Integração com design labMU
- ✅ Tailwind CSS configurado
- ✅ Sessão demonstrativa, edição de perfil e fluxos administrativos com persistência local

## 🔗 Referências

- [Documentação do Projeto](../../Documentacao/Projetos/Sprints/FrontEnd_Prototipo_Figma.md)
- [Design System labMU](../../Documentacao/Projetos/Sprints/00._Cérebro_do_Projeto.md)
- [Issue #59 - Revisão de Telas](https://github.com/seu-repo/issues/59)

## 📧 Contato

Para dúvidas sobre esta tela, entre em contato com a equipe de front-end ou abra uma issue no repositório.
