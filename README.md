# VTEX Command Hub 🚀

![Electron](https://img.shields.io/badge/Electron-23.1.4-blue?logo=electron)
![React](https://img.shields.io/badge/React-18.3.1-61dafb?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-3178c6?logo=typescript)
![VTEX CLI](https://img.shields.io/badge/VTEX%20CLI-integrado-red?logo=vtex)

---

## Sobre o Projeto

O **VTEX Command Hub** é uma interface gráfica (GUI) moderna construída com Electron e ReactJS, projetada para abstrair e potencializar o uso da VTEX CLI e outras ferramentas de linha de comando. Seu objetivo é proporcionar controle total sobre operações comuns do ecossistema VTEX via frontend, além de oferecer automações que agilizam o workflow de desenvolvimento e gestão de múltiplas contas.

> **Por que usar?**
>
> - Centraliza tarefas repetitivas e complexas da VTEX CLI em uma interface amigável.
> - Reduz erros operacionais e acelera processos de deploy, atualização e monitoramento.
> - Ideal para squads, agências e desenvolvedores que gerenciam múltiplas lojas VTEX.

---

## ✨ Funcionalidades

| Funcionalidade                | Descrição                                                                                  |
| ----------------------------- | ------------------------------------------------------------------------------------------ |
| **Gestão de Workspaces**      | Crie, resete e gerencie workspaces em múltiplas contas de forma automatizada.              |
| **Automação de Login/Update** | Execute `vtex switch` e `vtex update` em massa, atualizando várias contas simultaneamente. |
| **Verificação de Versões**    | Consulte rapidamente as versões de apps instalados em diferentes contas.                   |
| **Gerenciamento de Releases** | Instale/desinstale apps em lote, com controle de erros e logs detalhados.                  |
| **Monitoramento de Logs**     | Histórico de execuções, com filtros por data, conta e app, e visualização detalhada.       |
| **Sugestões Inteligentes**    | Inputs com autocomplete para contas e apps, baseados em configurações salvas.              |
| **Configurações Exportáveis** | Importe/exporte presets de contas e apps para facilitar o setup em novos ambientes.        |
| **Interface Responsiva**      | UI moderna, responsiva e com dark mode.                                                    |

---

## 🛠️ Stack Tecnológica

- **Electron**: Proporciona integração nativa com o sistema operacional e acesso à VTEX CLI.
- **ReactJS + TypeScript**: Interface reativa, tipada e de alta performance.
- **TailwindCSS**: Estilização moderna e responsiva.
- **VTEX CLI**: Toda automação é feita via comandos reais da VTEX CLI, garantindo compatibilidade total.
- **Supabase**: (Opcional) Integração pronta para autenticação e armazenamento remoto, se desejado.

---

## ⚡ Pré-requisitos

- [Node.js](https://nodejs.org/) (v18+ recomendado)
- [Yarn](https://classic.yarnpkg.com/) ou [npm](https://www.npmjs.com/)
- [VTEX CLI](https://developers.vtex.com/docs/vtex-io-documentation-vtex-io-cli-installation)
- [Git](https://git-scm.com/)

> **Dica:** Certifique-se de que a VTEX CLI está autenticada e funcional no terminal antes de usar o app.

---

## 🚀 Instalação e Setup

```bash
# 1. Clone o repositório
$ git clone https://github.com/seu-usuario/vtex-command-hub.git
$ cd vtex-command-hub

# 2. Instale as dependências
$ yarn install
# ou
$ npm install

# 3. Rode em modo desenvolvimento
$ yarn dev
# ou
$ npm run dev

# 4. Inicie o Electron
$ yarn electron
# ou
$ npm run electron
```

> **Sugestão:** Use o [VS Code](https://code.visualstudio.com/) para melhor experiência de desenvolvimento.

---

## 💻 Como Usar

1. **Abra o app** e navegue pelo menu lateral para acessar as principais funções:
   - **Dashboard:** Visão geral, atalhos rápidos e últimas execuções.
   - **Verificador de Versões:** Informe contas e apps para checar versões instaladas.
   - **Atualizador de Contas:** Selecione múltiplas contas para rodar update em massa.
   - **Gerenciador de Release:** Monte workspaces, instale/desinstale apps e acompanhe logs em tempo real.
   - **Configurações:** Salve presets de contas/apps e exporte/import settings.

2. **Preencha os campos** com as contas e apps desejados (autocomplete disponível).
3. **Execute as ações** e acompanhe o progresso e logs diretamente na interface.
4. **Consulte o histórico** de execuções para auditoria e repetição de processos.

---

## 🤝 Contribuição

Contribuições são muito bem-vindas! Siga o fluxo abaixo para colaborar:

- [ ] Faça um **fork** deste repositório
- [ ] Crie uma **branch** para sua feature ou correção (`git checkout -b minha-feature`)
- [ ] Commit suas alterações (`git commit -m 'feat: minha nova feature'`)
- [ ] Faça o **push** para seu fork (`git push origin minha-feature`)
- [ ] Abra um **Pull Request** detalhando sua contribuição

> **Dica:** Sempre mantenha sua branch atualizada com a `main` antes de abrir o PR.

---

## ⬇️ Download

Você pode baixar a versão mais recente do VTEX Command Hub diretamente pelo link abaixo:

- [Baixe a última versão (latest)](https://github.com/luizbp/vtex-command-hub/releases)
  > O instalador para Windows é o arquivo `Vtex.Command.Hub.Setup.x.x.x.exe`. Basta baixar e executar para instalar o aplicativo.

---

## 📄 Licença

Este projeto está licenciado sob a licença MIT. Veja o arquivo [LICENSE](./LICENSE) para mais detalhes.

---

> Feito com ❤️ para o P1.
