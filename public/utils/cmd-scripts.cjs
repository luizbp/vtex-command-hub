const { exec } = require("child_process");
const util = require("util");
const { getMessage, retryFunction } = require("./utils.cjs");

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
    console.error(`Falha ao processar conta ${account}:`, getMessage(error));
    results.push({
      account: account,
      error: "Falha na execução do comando: " + getMessage(error),
    });
  }

  return results;
}
/**
 * @param {string} account - Nome da conta VTEX a ser atualizada.
 */
async function updateAccount({ account }) {
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
    console.error(`Falha ao processar conta ${account}:`, getMessage(error));
    return {
      account: account,
      message: `Falha na execução do comando: ${getMessage(error)}`,
      status: "error",
    };
  }
}

/**
 * Checa se a operação pode ser realizada na master, considerando as opções de força.
 * @param {boolean} forceMaster - Permite uso da master mesmo que o workspace seja master.
 * @param {string} workspace - Nome do workspace atual.
 * @returns {Promise<boolean>} - Retorna true se a operação pode prosseguir, false se deve ser bloqueada.
 */
async function checkMasterRule(forceMaster, workspace) {
  if (forceMaster) return false;

  if (workspace.toLowerCase() === "master") {
    return true;
  }

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
      return true;
    }
  } catch (err) {
    return true;
  }

  return false;
}

function addTimeToLogs(log) {
  const currentDate = new Date();
  const currentHour = `${currentDate
    .getHours()
    .toString()
    .padStart(2, "0")}:${currentDate
    .getMinutes()
    .toString()
    .padStart(2, "0")}:${currentDate.getSeconds().toString().padStart(2, "0")}`;

  return `[${currentHour}] ${log}`;
}

// Etapa 1: Switch para a conta
async function switchAccount({ account }) {
  try {
    await execPromise(`vtex switch ${account}`);
    return { success: true, log: `Trocado para a conta ${account}` };
  } catch (error) {
    return {
      success: false,
      log: `ERRO ao trocar para a conta ${account}: ${getMessage(error)}`,
    };
  }
}

// Etapa 2: Cria workspace
async function createWorkspace({ workspace, typeWorkspace, forceMaster }) {
  try {
    const responseErrorMaster = {
      success: false,
      log: addTimeToLogs(
        'ERRO: Proibido rodar na master. Ative "Rodar em produção".',
      ),
    };
    if (!forceMaster && workspace.toLowerCase() === "master") {
      return responseErrorMaster;
    }

    const masterRule = await checkMasterRule(forceMaster, workspace);

    if (masterRule) {
      return responseErrorMaster;
    }

    const isWsProduction =
      typeWorkspace === "production" && workspace.toLowerCase() !== "master";
    const command = isWsProduction
      ? `echo yes | vtex use ${workspace} --production`
      : `echo yes | vtex use ${workspace}`;
    await execPromise(command);
    return {
      success: true,
      log: addTimeToLogs(
        `Workspace "${workspace}" (${typeWorkspace}) criado com sucesso.`,
      ),
    };
  } catch (error) {
    return {
      success: false,
      log: addTimeToLogs(
        `ERRO ao criar workspace "${workspace}": ${getMessage(error)}`,
      ),
    };
  }
}

// Etapa 3: Desinstala apps
async function uninstallApps({
  workspace,
  appsToUninstall = [],
  forceInstallation = true,
  forceMaster = false,
}) {
  const logs = [];
  let success = true;

  // Proíbe rodar na master sem permissão
  // Checa se está na workspace master antes de instalar/desinstalar apps
  const masterRule = await checkMasterRule(forceMaster, workspace);

  if (masterRule) {
    logs.push(
      addTimeToLogs(
        'ERRO: Proibido rodar na master. Ative "Rodar em produção".',
      ),
    );
    return { success: false, logs };
  }

  for (const app of appsToUninstall) {
    try {
      await retryFunction(() =>
        execPromise(
          `echo yes | vtex uninstall ${app} ${forceInstallation ? "--force" : ""}`,
        ),
      );
      logs.push(addTimeToLogs(`  ↳ ${app} desinstalado`));
    } catch (err) {
      const msg = getMessage(err);
      if (
        !msg.toLowerCase().includes("404: not found") &&
        !msg.toLowerCase().includes("404: não encontrado") &&
        stopOnError
      ) {
        logs.push(
          addTimeToLogs(
            `  ↳ ${app} FALHOU na desinstalação - ${getMessage(err)} ✗`,
          ),
        );
        success = false;
      }

      logs.push(
        addTimeToLogs(`  ↳ ${app} não encontrado para desinstalar, pulando...`),
      );
    }
  }
  return { success, logs };
}

// Etapa 4: Instala apps
async function installApps({
  workspace,
  appsToInstall = [],
  forceInstallation = true,
  forceMaster = false,
}) {
  const logs = [];
  let success = true;

  // Proíbe rodar na master sem permissão
  // Checa se está na workspace master antes de instalar/desinstalar apps
  const masterRule = await checkMasterRule(forceMaster, workspace);

  if (masterRule) {
    logs.push('ERRO: Proibido rodar na master. Ative "Rodar em produção".');
    return { success: false, logs };
  }

  for (const app of appsToInstall) {
    try {
      await retryFunction(() =>
        execPromise(
          `echo yes | vtex install ${app} ${forceInstallation ? "--force" : ""}`,
        ),
      );
      logs.push(addTimeToLogs(`  ↳ ${app} instalado com sucesso ✓`));
    } catch (err) {
      logs.push(
        addTimeToLogs(`  ↳ ${app} FALHOU na instalação - ${getMessage(err)} ✗`),
      );
      success = false;
    }
  }

  return { success, logs };
}

module.exports = {
  versionChecker,
  updateAccount,
  switchAccount,
  createWorkspace,
  uninstallApps,
  installApps,
};
