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
  console.log("TCL: versionChecker -> apps", apps);
  console.log("TCL: versionChecker -> account", account);
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
  console.log("TCL: updateAccount -> account", account);
  const results = [];

  try {
    // 1. Executa o comando de switch (que geralmente lista os apps instalados)
    // Nota: Verifique se o comando 'vtex switch' realmente retorna a lista.
    // Caso não retorne, você pode precisar concatenar com 'vtex ls'.
    const command = `vtex switch ${account} && y | vtex update`;
    const { stdout } = await execPromise(command);

    if (!stdout) {
      console.error(`Erro na conta ${account}: ${stderr}`);
      results.push({
        account: account,
        error: "Erro ao executar o comando",
      });
      return results;
    }

    results.push(account);
  } catch (error) {
    console.error(`Falha ao processar conta ${account}:`, error.message);
    results.push({
      account: account,
      error: "Falha na execução do comando",
    });
  }

  return results;
}

module.exports = {
  versionChecker,
  updateAccount,
};
