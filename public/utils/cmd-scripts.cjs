const { exec } = require("child_process");
const util = require("util");
const { getMessage, retryFunction } = require("./utils.cjs");

const execPromise = util.promisify(exec);

/**
 * Utilitário para executar comandos VTEX e tratar erros.
 * @param {string} command - Comando a ser executado.
 * @returns {Promise<string>} - Saída do comando.
 */
async function runVtexCommand(command) {
  try {
    const { stdout } = await execPromise(command);
    return stdout;
  } catch (error) {
    throw new Error(getMessage(error));
  }
}

/**
 * Busca versões de apps instalados em uma conta VTEX.
 * @param {Object} params
 * @param {string} params.account - Nome da conta VTEX.
 * @param {string[]} params.apps - Lista de apps a verificar.
 * @returns {Promise<Object[]>}
 */
async function versionChecker({ account, apps }) {
  const results = [];
  try {
    const stdout = await runVtexCommand(`vtex switch ${account} && vtex ls`);
    const versionsFound = Object.fromEntries(
      apps.map((app) => {
        const regex = new RegExp(`^.*${app}\s+([\d.]+)`, "m");
        const match = stdout.match(regex);
        return [app, match ? match[1] : "Não instalado"];
      }),
    );
    results.push({ account, versions: versionsFound });
  } catch (error) {
    results.push({ account, error: error.message });
  }
  return results;
}

/**
 * Atualiza uma conta VTEX.
 * @param {Object} params
 * @param {string} params.account
 * @returns {Promise<Object>}
 */
async function updateAccount({ account }) {
  try {
    await runVtexCommand(`vtex switch ${account} && yes | vtex update`);
    return {
      account,
      message: "Conta atualizada com sucesso",
      status: "success",
    };
  } catch (error) {
    return { account, message: error.message, status: "error" };
  }
}

/**
 * Checa se operação pode ser realizada na master.
 * @param {boolean} forceMaster
 * @param {string} workspace
 * @returns {Promise<boolean>}
 */
async function checkMasterRule(forceMaster, workspace) {
  if (forceMaster) return false;
  if (workspace.toLowerCase() === "master") return true;
  try {
    const whoamiOut = await runVtexCommand("vtex whoami");
    const workspaceStatusOut = await runVtexCommand("vtex workspace status");
    return (
      workspaceStatusOut.toLowerCase().includes("master") ||
      whoamiOut.toLowerCase().includes("master")
    );
  } catch {
    return true;
  }
}

/**
 * Adiciona timestamp ao log.
 * @param {string} log
 * @returns {string}
 */
function addTimeToLogs(log) {
  const now = new Date();
  const time = now.toLocaleTimeString("pt-BR", { hour12: false });
  return `[${time}] ${log}`;
}

/**
 * Troca de conta VTEX.
 * @param {Object} params
 * @param {string} params.account
 * @returns {Promise<Object>}
 */
async function switchAccount({ account }) {
  try {
    await runVtexCommand(`vtex switch ${account}`);
    return {
      success: true,
      log: `Trocado para a conta ${account} com sucesso ✓`,
    };
  } catch (error) {
    return {
      success: false,
      log: `ERRO ao trocar para a conta ${account}: ${error.message}`,
    };
  }
}

/**
 * Cria workspace VTEX.
 * @param {Object} params
 * @param {string} params.workspace
 * @param {string} params.typeWorkspace
 * @param {boolean} params.forceMaster
 * @returns {Promise<Object>}
 */
async function createWorkspace({ workspace, typeWorkspace, forceMaster }) {
  if (!forceMaster && workspace.toLowerCase() === "master") {
    return {
      success: false,
      log: addTimeToLogs(
        'ERRO: Proibido rodar na master. Ative "Rodar em produção".',
      ),
    };
  }
  const isProduction =
    typeWorkspace === "production" && workspace.toLowerCase() !== "master";
  const command = `echo yes | vtex use ${workspace}${isProduction ? " --production" : ""}`;
  try {
    await runVtexCommand(command);
    return {
      success: true,
      log: addTimeToLogs(
        `Workspace "${workspace}" (${typeWorkspace}) selecionada com sucesso.`,
      ),
    };
  } catch (error) {
    return {
      success: false,
      log: addTimeToLogs(
        `ERRO ao criar workspace "${workspace}": ${error.message}`,
      ),
    };
  }
}

/**
 * Desinstala apps VTEX.
 * @param {Object} params
 * @param {string} params.workspace
 * @param {string[]} params.appsToUninstall
 * @param {boolean} params.forceInstallation
 * @param {boolean} params.forceMaster
 * @returns {Promise<Object>}
 */
async function uninstallApps({
  workspace,
  appsToUninstall = [],
  forceInstallation = true,
  forceMaster = false,
}) {
  const logs = [];
  if (await checkMasterRule(forceMaster, workspace)) {
    logs.push(
      addTimeToLogs(
        'ERRO: Proibido rodar na master. Ative "Rodar em produção".',
      ),
    );
    return { success: false, logs };
  }
  let success = true;
  for (const app of appsToUninstall) {
    try {
      await retryFunction(() =>
        runVtexCommand(
          `echo yes | vtex uninstall ${app} ${forceInstallation ? "--force" : ""}`,
        ),
      );
      logs.push(addTimeToLogs(`  ↳ ${app} desinstalado com sucesso ✓`));
    } catch (err) {
      const msg = err.message.toLowerCase();
      if (
        !msg.includes("404: not found") &&
        !msg.includes("404: não encontrado")
      ) {
        logs.push(
          addTimeToLogs(
            `  ↳ ${app} FALHOU na desinstalação - ${err.message} ✗`,
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

/**
 * Instala apps VTEX.
 * @param {Object} params
 * @param {string} params.workspace
 * @param {string[]} params.appsToInstall
 * @param {boolean} params.forceInstallation
 * @param {boolean} params.forceMaster
 * @returns {Promise<Object>}
 */
async function installApps({
  workspace,
  appsToInstall = [],
  forceInstallation = true,
  forceMaster = false,
}) {
  const logs = [];
  if (await checkMasterRule(forceMaster, workspace)) {
    logs.push('ERRO: Proibido rodar na master. Ative "Rodar em produção".');
    return { success: false, logs };
  }
  let success = true;
  for (const app of appsToInstall) {
    try {
      await retryFunction(() =>
        runVtexCommand(
          `echo yes | vtex install ${app} ${forceInstallation ? "--force" : ""}`,
        ),
      );
      logs.push(addTimeToLogs(`  ↳ ${app} instalado com sucesso ✓`));
    } catch (err) {
      logs.push(
        addTimeToLogs(`  ↳ ${app} FALHOU na instalação - ${err.message} ✗`),
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
