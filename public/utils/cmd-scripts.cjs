const { exec } = require("child_process");
const util = require("util");

// Transforma o exec em uma versão que aceita async/await
const execPromise = util.promisify(exec);

/**
 * Verifica as versões de apps instalados em múltiplas contas VTEX.
 * @param {Object} params
 * @param {string} params.accounts - Array de nomes das contas VTEX a serem verificadas.
 * @param {string[]} params.apps - Array de nomes dos apps cujas versões serão buscadas.
 */
async function versionChecker({ account, apps }) {
  const results = [];

  try {
    // 1. Executa o comando de switch (que geralmente lista os apps instalados)
    // Nota: Verifique se o comando 'vtex switch' realmente retorna a lista.
    // Caso não retorne, você pode precisar concatenar com 'vtex ls'.
    const command = `vtex switch ${account} && vtex ls`;
    const { stdout } = await execPromise(command);

    if (!stdout) {
      console.error(`Erro na conta ${account}: ${stderr}`);
      results.push({
        account: account,
        error: "Erro ao executar o comando",
      });
      return results;
    }

    const versionsFound = {};

    // 2. Itera sobre os apps que queremos buscar
    apps.forEach((app) => {
      // Regex dinâmica:
      // Procura pelo nome do app + espaços + captura a versão (dígitos.dígitos.dígitos)
      // O flag 'm' é para busca multi-line
      // const regex = new RegExp(`${app}\\s+([0-9]+\\.[0-9]+\\.[0-9]+)`, "m");
      const regex = new RegExp(`^.*${app}\\s+([\\d.]+)`, "m");
      const match = stdout.match(regex);

      if (match) {
        // match[1] contém o grupo de captura da versão
        versionsFound[app] = match[1];
      } else {
        versionsFound[app] = "Não instalado";
      }
    });

    results.push({
      account: account,
      versions: versionsFound,
    });
  } catch (error) {
    console.error(`Falha ao processar conta ${account}:`, error.message);
    results.push({
      account: account,
      error: "Falha na execução do comando",
    });
  }

  return results;
}
/**
 * @param {string} account - Nome da conta VTEX a ser atualizada.
 */
async function updateAccount(account) {
  try {
    // 1. Executa o comando de switch (que geralmente lista os apps instalados)
    // Nota: Verifique se o comando 'vtex switch' realmente retorna a lista.
    // Caso não retorne, você pode precisar concatenar com 'vtex ls'.
    const command = `vtex switch ${account} && yes | vtex update`;
    const { stdout } = await execPromise(command);

    if (!stdout) {
      console.error(`Erro na conta ${account}: ${stderr}`);
      return {
        account: account,
        message: `Erro ao executar o comando: ${stderr}`,
        status: "error",
      };
    }

    return {
      account: account,
      message: "Conta atualizada com sucesso",
      status: "success",
    };
  } catch (error) {
    console.error(`Falha ao processar conta ${account}:`, error.message);
    return {
      account: account,
      message: `Falha na execução do comando: ${error.message}`,
      status: "error",
    };
  }
}

/**
 * Gerencia o processo de release em uma conta VTEX: cria workspace, desinstala e instala apps.
 * Retorna o status gradualmente para cada account.
 * @param {Object} options - Opções para o processo de release.
 * @param {string} options.account - Conta VTEX alvo.
 * @param {string} options.workspace - Nome do workspace a ser criado.
 * @param {string[]} options.appsToInstall - Apps a instalar.
 * @param {string[]} options.appsToUninstall - Apps a desinstalar.
 * @param {boolean} options.forceMaster - Permite uso da master.
 * @param {boolean} options.stopOnError - Para execução ao encontrar erro.
 * @returns {Promise<{account: string, status: string, logs: string[]}>}
 */
async function manageRelease(options) {
  const {
    account,
    workspace,
    appsToInstall = [],
    appsToUninstall = [],
    forceMaster = false,
    stopOnError = false,
  } = options;
  const state = { account, status: "in_progress", logs: [] };

  // Proíbe rodar na master sem permissão
  if (workspace.toLowerCase() === "master" && !forceMaster) {
    state.status = "error";
    state.logs.push(
      "ERRO: Proibido rodar na master. Ative 'Forçar uso na Master'.",
    );
    return state;
  }

  try {
    // 1. Switch para a conta
    state.logs.push(`Trocando para a conta ${account}...`);
    await execPromise(`vtex switch ${account}`);

    // 2. Cria workspace
    state.logs.push(`Criando workspace \"${workspace}\"...`);
    await execPromise(`yes | vtex use ${workspace}`);
    state.logs.push(`Workspace \"${workspace}\" criado com sucesso.`);

    // Checa se está na workspace master antes de instalar/desinstalar apps
    if (!forceMaster) {
      try {
        const { stdout: whoamiOut } = await execPromise("vtex whoami");
        const { stdout: workspaceStatusOut } = await execPromise(
          "vtex workspace status",
        );
        if (
          (workspaceStatusOut &&
            workspaceStatusOut.toLowerCase().includes("master")) ||
          (whoamiOut && whoamiOut.toLowerCase().includes("master"))
        ) {
          state.status = "error";
          state.logs.push(
            "ERRO: Não é permitido instalar/desinstalar apps na workspace master.",
          );
          return state;
        }
      } catch (err) {
        state.status = "error";
        state.logs.push(`ERRO ao checar workspace atual: ${err.message}`);
        return state;
      }
    }

    // 3. Desinstala apps
    if (appsToUninstall.length > 0 && state.status !== "error") {
      state.logs.push("Desinstalando apps...");
      for (const app of appsToUninstall) {
        try {
          await execPromise(`yes | vtex uninstall ${app}`);
          state.logs.push(`  ↳ ${app} desinstalado`);
        } catch (err) {
          state.logs.push(`  ↳ ${app} FALHOU na desinstalação ✗`);
          if (stopOnError) {
            state.status = "error";
            return state;
          }
        }
      }
    }

    // 4. Instala apps
    if (appsToInstall.length > 0 && state.status !== "error") {
      state.logs.push("Instalando apps...");
      for (const app of appsToInstall) {
        try {
          await execPromise(`yes | vtex install ${app}`);
          state.logs.push(`  ↳ ${app} instalado com sucesso ✓`);
        } catch (err) {
          state.logs.push(`  ↳ ${app} FALHOU na instalação ✗`);
          if (stopOnError) {
            state.status = "error";
            return state;
          }
        }
      }
    }

    state.status = "done";
    state.logs.push("Processo concluído.");
    return state;
  } catch (error) {
    state.status = "error";
    state.logs.push(`ERRO: ${error.message}`);
    return state;
  }
}

module.exports = {
  versionChecker,
  updateAccount,
  manageRelease,
};
