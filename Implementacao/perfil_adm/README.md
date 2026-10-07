# Tela de Perfil do Usuário (Meu Perfil)

## 📋 Descrição

Tela de visualização e gerenciamento do perfil do usuário logado no sistema labMU. Permite que o usuário visualize suas informações cadastrais básicas e acesse funcionalidades de edição de perfil e logout.

## 🎯 Objetivo

- Exibir informações do usuário logado (nome, email, cargo, localização)
- Prover acesso rápido a edição de perfil
- Facilitar logout do sistema
- Manter consistência visual com o design labMU

## 🏗️ Estrutura

```
perfil_adm/
├── index.tsx              ← Componente principal (React + TypeScript)
├── tailwind.config.js     ← Configuração Tailwind CSS
├── tailwind.css           ← Styles globais e layer utilities
├── README.md              ← Este arquivo
└── types.ts               ← (Opcional) Tipos compartilhados
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

### Perfil → Editar Perfil
- Botão "Editar Perfil" navega para `/editar-perfil`
- (Tela a ser implementada)

### Perfil → Logout
- Botão "Encerrar Sessão" executa logout
- Redireciona para `/login`

### Dashboard → Perfil
- Ícone de usuário/perfil na navegação leva para `/perfil`

## 🔌 Integração

### Dados do Usuário (Context/Session)

Atualmente usa dados mock. Para integração real:

```typescript
// Substituir mockUserProfile com dados reais
const [profile, setProfile] = useState<UserProfile>(mockUserProfile);

// Com React Context:
const user = useContext(AuthContext); // Obter dados do usuário logado
const [profile] = useState<UserProfile>(user.profile);
```

### Autenticação

```typescript
const handleLogout = async () => {
  setIsLoading(true);
  // TODO: Chamar API de logout
  // await api.logout();
  // Limpar sessão/context
  window.location.href = "/login";
};
```

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

- ✅ Dados sensíveis do usuário validados antes de exibição
- ⚠️ TODO: Implementar validação de autenticação
- ⚠️ TODO: Proteger rotas com autenticação

## 🎨 Customização

### Adicionar novo campo de dados

1. Adicionar ao tipo `UserProfile` em `index.tsx`:
   ```typescript
   interface UserProfile {
     // ... campos existentes
     newField: string;
   }
   ```

2. Adicionar grid item na seção "Dados Básicos":
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

Edite as cores no `:root` em `tailwind.css` ou customize em `tailwind.config.js`:

```js
colors: {
  brand: {
    500: "#YourColor", // Substitua com sua cor
  },
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
- ⏳ Autenticação integrada (TODO)
- ⏳ Edição de perfil (TODO)

## 🔗 Referências

- [Documentação do Projeto](../../Documentacao/Projetos/Sprints/FrontEnd_Prototipo_Figma.md)
- [Design System labMU](../../Documentacao/Projetos/Sprints/00._Cérebro_do_Projeto.md)
- [Issue #59 - Revisão de Telas](https://github.com/seu-repo/issues/59)

## 📧 Contato

Para dúvidas sobre esta tela, entre em contato com a equipe de front-end ou abra uma issue no repositório.
