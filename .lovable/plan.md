

# VTEX CLI Manager — Plano de Implementação

## Visão Geral
Painel multi-ferramentas para desenvolvedores VTEX, com visual estilo "Developer Console" (dark mode padrão), preparado para ser envelopado em Electron futuramente.

---

## 1. Layout & Navegação
- **Sidebar colapsável** com os itens: Dashboard, Verificador de Versões, Atualizador de Contas, Gerenciador de Release/TM, Configurações
- Ícones Lucide para cada item, highlight na rota ativa
- **Dark/Light mode** com toggle nas Configurações (e no header), dark como padrão
- Header com botão de colapsar sidebar e indicador da ferramenta atual

## 2. Dashboard
- Cards resumo: total de contas processadas, última verificação, status geral
- Atalhos rápidos para as ferramentas principais
- Visual limpo estilo painel de controle

## 3. Verificador de Versões
- Textarea para colar lista de Accounts (separadas por linha ou vírgula)
- Textarea para lista de Apps
- Botão "Verificar Versões" com loading state
- Tabela resultado: linhas = Accounts, colunas = Apps, células = versão ou badge "Não instalado"
- Dados simulados via mock com delay

## 4. Atualizador de Contas
- Textarea para lista de Accounts
- Botão "Rodar Atualização Massiva"
- Console/log visual que exibe progressivamente: "Account X: Atualizando... [OK]"
- Barra de progresso geral
- Simulação com delays progressivos

## 5. Gerenciador de Release/TM
- Inputs: lista de Accounts, nome do Workspace, apps para instalar, apps para desinstalar
- Checkboxes: "Forçar uso na Master", "Parar em caso de erro"
- Cards de status por conta: Pendente → Em Progresso → Concluído/Erro
- Lógica mock: criação de workspace → desinstalação → instalação, com validações (erro se master sem flag)

## 6. Configurações
- Toggle Dark/Light mode
- Placeholder para configurações futuras (path do VTEX CLI, timeout, etc.)

## 7. Camada de Serviço (`utils/cliService.ts`)
- Arquivo centralizado com todas as funções mock (checkVersions, updateAccounts, manageRelease, etc.)
- Cada função retorna Promise com delay simulado
- Comentários indicando onde substituir por chamadas reais ao Electron IPC no futuro

