# 🚀 README — labMU
> **Sistema de Gestão de Equipamentos — Laboratório de Prototipagem (MUSARQ)**  
> **Equipe:** 07 | **Metodologia:** Scrum 

---

## 📋 1. Sobre o Projeto
O **labMU** é o sistema de gestão do Laboratório de Prototipagem do MUSARQ, desenvolvido pela Equipe 07. A plataforma centraliza o controle operacional de usuários, a manutenção de máquinas (impressoras 3D e scanners), o controle de estoque fracionado de suprimentos, o fluxo de empréstimos de equipamentos portáteis e a emissão de relatórios gerenciais e operacionais.

---

## 👥 2. Perfis de Usuário & Autenticação
| Perfil | Autenticação | Descrição das Responsabilidades |
| :--- | :---: | :--- |
| **Administrador** | 🔐 Sim (Login/Senha) | Gestão completa de usuários, cadastros gerais, relatórios e auditorias. |
| **Técnico** | 🔐 Sim (Login/Senha) | Registro de manutenções, produções, controle de insumos e gestão de empréstimos. |
| **Cliente** | ❌ Sem acesso | Cadastrado estritamente para vinculação em ordens de produção e empréstimos[cite: 1]. |

---

## ⚙️ 3. Funcionalidades e Requisitos do Sistema
1. **Login de Usuário:** Autenticação restrita para perfis administrador e técnico[cite: 1].
2. **Cadastro de Usuário:** Gestão de cadastros para os perfis administrador, técnico e cliente[cite: 1].
3. **Cadastro de Máquinas:** Gerenciamento de impressoras 3D e scanners, atrelados a rotinas de manutenção preventiva mensal e corretiva[cite: 1].
4. **Cadastro de Suprimentos (Impressão 3D):** Aquisição registrada em quilogramas (kg) com controle de saída automatizado em unidades fracionadas durante a produção[cite: 1].
5. **Gestão de Manutenções:** Registro completo de manutenções com suporte à geração de gráficos e relatórios filtráveis por período[cite: 1].
6. **Cadastro de Equipamentos de Empréstimo:** Inventário de itens portáteis disponíveis para empréstimo (celulares, tablets, mesas digitalizadoras, etc.)[cite: 1].
7. **Gestão de Empréstimos:** Controle operacional de retirada e devolução de equipamentos portáteis[cite: 1].
8. **Relatório de Produção:** Listagem detalhada contendo descrição do que foi impresso ou escaneado, técnico responsável, cliente atendido, máquina utilizada, quantidade de insumo fracionado consumido (podendo ser zero no caso de uso de scanners) e tempo médio de produção[cite: 1].
9. **Relatório de Produção Mensal por Técnico:** Consolidado da produção do laboratório agrupado por técnico responsável[cite: 1].
10. **Relatório de Consumo Mensal de Estoque:** Acompanhamento periódico do gasto de suprimentos[cite: 1].
11. **Relatório Mensal de Empréstimos:** Estatísticas e histórico de movimentações de empréstimos de equipamentos por mês[cite: 1].

> **⚠️ Observação importante:** As máquinas fixas do laboratório (impressoras 3D e scanners) **não são passíveis de empréstimo**; apenas os itens devidamente cadastrados na categoria de empréstimo portáteis podem ser retirados[cite: 1].
