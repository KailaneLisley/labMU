# 🎨 Camada de Frontend — labMU

Este diretório reúne as aplicações visuais e protótipos de interface do sistema **labMU**, desenvolvidos para proporcionar uma experiência fluida, responsiva e alinhada à identidade visual institucional da UNICAP e do laboratório de prototipagem MUSARQ.

---

## 📂 Estrutura do Diretório

```
frontend/
├── perfil_adm/              # ⭐ Aplicação SPA Oficial em React 18 + Vite + Tailwind CSS
├── login_adm/               # 📄 Protótipo estático independente da tela de login (HTML5/CSS3)
├── cadastro_adm/            # 📄 Protótipo inicial do componente de cadastro (React/Tailwind)
└── public/                  # 🖼️ Ativos gráficos compartilhados (logotipo UNICAP, favicons)
```

---

## 🌟 Aplicação Oficial: `perfil_adm`

A pasta [`perfil_adm/`](perfil_adm/) é a **Single Page Application (SPA)** oficial do projeto:
- Desenvolvida com **React 18**, **TypeScript**, **Vite** e **Tailwind CSS**.
- Biblioteca de ícones: **Lucide React**.
- Roteamento completo com **React Router v6**.
- **Modo Híbrido:** Conecta-se diretamente à API REST em `http://localhost:3001/api` e possui persistência de contingência em `localStorage` quando executada sem o backend.
- Módulos completos: Dashboard, Usuários, Máquinas, Manutenções, Estoque/Suprimentos, Empréstimos, Relatórios e Perfil.

Para executar a SPA:
```bash
cd perfil_adm
npm install
npm run dev
```

---

## 📄 Protótipos Históricos

1. **`login_adm/`:** Primeiro protótipo de login estático construído em HTML5 semântico e CSS3 puro. Serviu como validação visual da identidade e foi posteriormente integrado à SPA.
2. **`cadastro_adm/`:** Fatiamento inicial do componente de cadastro a partir do protótipo do Figma/Stitch.

---

## 🎨 Design System & Identidade Visual

O sistema utiliza a paleta oficial da identidade visual **labMU • MUSARQ • UNICAP**:

| Token Tailwind / CSS | Hex | Amostra | Aplicação |
| :--- | :---: | :---: | :--- |
| `bg-[#8B1329]` (Brand Primary) | `#8B1329` | 🟥 | Cor primária institucional, botões de ação principal, headers ativos |
| `bg-[#6b0f1f]` (Brand Dark) | `#6b0f1f` | 🍷 | Estados de hover, elementos de ênfase |
| `bg-[#fdeaea]` (Brand Soft) | `#fdeaea` | 🌸 | Fundos de cards em destaque, avatares suaves, tags |
| `bg-[#fff9f6]` (Background) | `#fff9f6` | ⚪ | Cor de fundo geral das telas |
| `bg-white` (Surface) | `#ffffff` | ⬜ | Fundo de cartões, modais e formulários |
| `bg-[#f7f0f0]` (Input Surface) | `#f7f0f0` | 🌫️ | Fundo dos campos de formulário |
| `text-[#1f1a1b]` (Text Primary) | `#1f1a1b` | ⚫ | Títulos e texto principal de alta legibilidade |
| `text-[#7a6e70]` (Text Muted) | `#7a6e70` | 🔘 | Legendas, rótulos e textos secundários |
| `text-[#c0182f]` (Danger) | `#c0182f` | 🚨 | Mensagens de erro e ações destrutivas |
| `text-[#1b7a43]` (Success) | `#1b7a43` | 🟢 | Confirmações e badges de sucesso |

### Tipografia e Ícones
- **Tipografia:** Famílias sans-serif modernas (*Inter*, *Segoe UI*, *system-ui*).
- **Ícones:** Linha moderna e consistente fornecida pela biblioteca `lucide-react`.

---

## 📱 Responsividade
Todas as interfaces foram projetadas com foco em design responsivo através dos utilitários do Tailwind CSS:
- **Mobile** (`320px` - `767px`): Menus recolhíveis, grids em coluna única e toques confortáveis.
- **Tablet** (`768px` - `1023px`): Grids de 2 colunas e tabelas com rolagem horizontal controlada.
- **Desktop** (`1024px+`): Sidebar fixa expandida, dashboard multi-colunas e modais confortáveis.
