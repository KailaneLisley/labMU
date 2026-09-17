# Front-End — Protótipo Funcional no Figma

> **Projeto:** labMU  
> **Sprint 1:** Estruturação e Prototipagem  
> **Público:** Equipe de Front-end  
> **Objetivo:** definir, desenhar e prototipar a interface do sistema antes da implementação.

---

## 🧭 Visão geral

O **labMU** é o sistema de gestão do **Laboratório de Prototipagem do MUSARQ**, usado pela Equipe 07.

O sistema deve permitir:

- login de administrador e técnico
- cadastro e gestão de usuários
- cadastro de máquinas (impressoras 3D e scanners)
- cadastro de suprimentos com controle em quilogramas
- registro de manutenções preventivas e corretivas
- cadastro de equipamentos portáteis para empréstimo
- controle de retirada e devolução de empréstimos
- registro de produção (impressão e escaneamento)
- controle de consumo fracionado de estoque
- relatórios operacionais e gerenciais

A interface deve ser **limpa, funcional e focada no uso repetitivo pelo laboratório**.

> **Regra visual:** não priorize enfeite sobre legibilidade. O laboratório vai operar com isso.

---

## 👥 Quem vai usar

| Perfil | Login | O que vê/usa |
| :--- | :---: | :--- |
| **Administrador** | Sim | Gestão de usuários, relatórios, auditoria, dashboards gerais |
| **Técnico** | Sim | Manutenção, produção, empréstimo, estoque, relatórios operacionais |
| **Cliente** | Não | Só existe para vinculação em produção e empréstimo |

O front-end deve tratar **dois níveis de acesso** desde o início, porque a experiência muda muito por perfil.

---

## 📱 Telas principais necessárias

### 1. Login

- Tela de login com email/senha
- Botão Entrar
- Mensagem de erro clara em caso de falha
- Acesso negado para cliente
- Fluxo de recuperação de senha (básico, se houver tempo na sprint)

#### Onde fica e por que
- Casa do acesso
- Precisa ser claro, curto e proteger a entrada

---

### 2. Dashboard inicial (visão geral)

#### Administrador
- Indicadores gerais do laboratório
- Acesso rápido a cadastros, relatórios e gestão de usuários
- Resumo de equipamentos, máquinas, empréstimos, estoque

#### Técnico
- Acesso a: manutenção, produção, empréstimo, estoque, relatórios operacionais
- Indicadores de atenção imediata (ex.: máquina fora do ar, estoque baixo, empréstimo pendente)

#### Elementos esperados
- Navegação clara
- Atalhos para ações frequentes
- Sem excesso de informações ao mesmo tempo

#### Onde fica e por que
- É o painel principal
- Define o ritmo visual do sistema

---

### 3. Gestão de usuários

- Listagem de usuários
- Busca por nome, email, perfil
- Filtros por perfil (admin/técnico/cliente)
- Criar/editar usuário
- Desativação de usuário
- Campos sugeridos:
  - nome
  - email
  - perfil
  - status

#### Onde fica e por que
- Responsabilidade do administrador
- Precisa ser legível e fácil de manter a lista

---

### 4. Cadastro de máquinas

- Listagem de máquinas
- Filtro por tipo (impressora 3D / scanner)
- Status: ativa, em manutenção, inativa
- Acrescentar/editar máquina
- Indicador visual de tipo e status

#### Onde fica e por que
- Base para manutenção, produção e alertas
- Tudo começa aqui

---

### 5. Cadastro de suprimentos

- Listagem de suprimentos
- Informações de:
  - nome
  - tipo/coloração
  - unidade de compra (kg)
  - saldo atual
- Entrada de estoque em kg
- Visual de saldo

#### Onde fica e por que
- Controle de insumo é crítico para produção com impressão 3D
- Saldo deve ficar visível

---

### 6. Cadastro de equipamentos portáteis

- Listagem de itens portáteis
- Campos sugeridos:
  - nome
  - categoria
  - número de série
  - status (disponível, emprestado, em manutenção)
- Somente portáteis devem aparecer aqui
- Máquinas fixas não devem ter acesso a empréstimo

#### Onde fica e por que
- Base para empréstimo
- Separation clara evita erro

---

### 7. Manutenção de máquinas

- Formulário de manutenção
- Campos sugeridos:
  - máquina
  - tipo (preventiva / corretiva)
  - data
  - responsável
  - descrição
- Histórico de manutenções por máquina

#### Onde fica e por que
- Registro de cuidado e sequência das máquinas
- Histórico vai alimentar relatórios e alertas

---

### 8. Alertas de manutenção preventiva

- Lista de máquinas próximas/fora do prazo de manutenção preventiva mensal
- Indicador visual claro: em dia / próxima / atrasada

#### Onde fica e por que
- Ação preventiva antecipada
- Deve chamar atenção sem gritar

---

### 9. Registro de produção

- Formulário de produção com:
  - máquina
  - técnico responsável
  - cliente atendido
  - tipo: impressão 3D ou escaneamento
  - descrição do que foi impresso/escaneado
  - data/hora
  - tempo de produção
  - consumo de insumo (pode ser zero em scanner)
- Listagem de produções com filtros básicos

#### Onde fica e por que
- Coração operacional do laboratório
- Deve ser objetivo, mas completo

---

### 10. Estoque / baixa automática de insumo

- Tela de estoque e saldos
- Histórico de movimentações
- Baixa automática ao registrar produção de impressão
- Conversão kg → g coerente
- Evitar saldo negativo

#### Onde fica e por que
- Controle de custo e reabastecimento
- Deve demonstrar o efeito da produção no estoque

---

### 11. Empréstimo

#### Retirada
- Escolher equipamento portátil
- Responsável
- Data de retirada
- Previsão de devolução
- Bloqueio de:
  - equipamento indisponível
  - máquina fixa (impressora/scanner)

#### Devolução
- Listagem de empréstimos ativos
- Data de devolução real
- Observações
- Indicação de atraso se passou da previsão

#### Histórico
- Listagem de todos os empréstimos
- Filtros por equipamento, responsável, status, período

#### Onde fica e por que
- Controle de coisas que saem do laboratório
- Regras claras evitam confusão

---

### 12. Relatórios

#### Relatório de produção
- Toda a produção com descrição, técnico, cliente, máquina, insumo consumido, tempo médio
- Filtro por período

#### Relatório de produção por técnico
- Consolidação por técnico responsável
- Filtro por mês/ano

#### Relatório de consumo de estoque
- Consumo por mês e por suprimento
- Comparativo sugerido com entradas

#### Relatório de empréstimos
- Histórico e estatísticas mensais
- Por equipamento/responsável

#### Exportação
- CSV nos relatórios principais
- PDF como melhoria se houver tempo

#### Onde fica e por que
- Esse é o produto que ajuda a decisão
- Dados devem ser legíveis, não apenas listados

---

## 🧱 Regras de UI/UX para a equipe de front-end

### Navegação
- Manter navegação consistente entre módulos
- Não mudar nome de coisas similares em telas diferentes
- Priorizar ações que o laboratório repete

### Listagens
- Colunas necessárias, sem excesso
- Busca e filtro onde faz sentido
- Estado vazio tratado (sem registros yet)

### Formulários
- Label claro
- Falha de validação explicativa
- Salvar só quando a ação estiver completa
- Mostrar efeito esperado depois do save

### Feedback
- Sucesso, erro e bloqueios visíveis
- Evitar “salvou e ninguém sabe”
- Indicadores visuais para status, alertas e pendências

### Perfil
- Admin e técnico devem ter experiências distintas quando a responsabilidade mudar
- Não exibir opções que aquele perfil não pode usar

### Responsividade
- Evitar depender só de desktop grande
- Testar telas médias e pequenas
- Priorizar legibilidade no mobile se o técnico usar dispositivo menor

---

## 🧠 Fluxos críticos a prototipar

1. **Login → Dashboard**
2. **Cadastro de máquina → registro de manutenção → histórico**
3. **Suprimento → entrada kg → consumo com produção**
4. **Portátil → empréstimo → devolução → histórico**
5. **Produção → relatório → exportação**

Esses fluxos devem ser cobertos pelo protótipo, porque eles ilustram o valor real do sistema.

---

## 🎨 Decisões de design sugeridas

- Paleta quente, mas profissional
- Tipografia legível
- Hierarquia visual por importância, não por decoration
- Ícones funcionais, não apenas decorativos
- Cores de status padronizadas:
  - disponível / em dia
  - pendente / atenção
  - indisponível / atrasado / erro

> Se precisarem de moodboard, precisam definir como mesclar impressão 3D com gestão operacional sem parecer um template genérico.

---

## 🗂️ Estrutura sugerida do protótipo no Figma

1. **Arquivo 01 — Design tokens**
   - cores
   - tipografia
   - espaçamento
   - estados

2. **Arquivo 02 — Componentes**
   - botões
   - formulários
   - tabelas e cards
   - estados de erro/loading/vazio
   - barra de navegação
   - ícones

3. **Arquivo 03 — Telas**
   - login
   - dashboard (admin e técnico)
   - gestão de usuários
   - máquinas
   - suprimentos
   - portáteis
   - manutenção
   - produção
   - estoque
   - empréstimo
   - relatórios

4. **Protótipo navegável**
   - fluxos principais clicáveis
   - transições visíveis
   - anotações para quem implementa

---

## 📝 Entregáveis do Figma esperados

- telas com layout e conteúdo real (não texto placeholder vazio)
- protótipo navegável com os fluxos listados
- design tokens e componentes reaproveitáveis
- comentários explicativos sobre comportamentos principais
- link compartilhado com a equipe e destacado no README da documentação

---

## ✅ Critérios de pronto do protótipo

- Login, dashboard, cadastros, manutenção, produção, estoque e empréstimos representados
- Fluxos navegáveis pelo menos nos principais caminhos
- Interface coerente entre módulos
- Equipe entende o que construir

---

## 🔗 Referência no repositório

- Documentação central: `Documentacao/Projetos/Sprints/00._Cérebro_do_Projeto.md`
- Roadmap: `Documentacao/Projetos/Sprints/8._Roadmap_de_Sprints.md`
- Backlog: `Documentacao/Projetos/Sprints/9._Backlog_do_Produto.md`
- Issues correspondentes no GitHub: `#1 a #37`
- Labels de sprint: `sprint-1`, `frontend`, `prototipagem`, `ux`

---

> Se o front-end precisar de algo mais concreto para começar, o próximo passo é fechar:
> - quais telas são obrigatórias para a sprint
> - quais são “bom ter”
> - se há tela com conteúdo pré-definido de exemplo para prototipar primeiro
