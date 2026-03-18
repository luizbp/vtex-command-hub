const path = require("path");
const fs = require("fs");

function logToFile(app, ...args) {
  const logPath = path.join(app.getPath("userData"), "main.log");
  const msg =
    `[${new Date().toISOString()}] ` +
    args.map((a) => (typeof a === "string" ? a : JSON.stringify(a))).join(" ") +
    "\n";
  fs.appendFileSync(logPath, msg);
}

function getMessage(message) {
  return (
    `[${new Date().toISOString()}] ` +
    (typeof message === "string" ? message : JSON.stringify(message)) +
    "\n"
  );
}

/**
 * Tenta executar uma função várias vezes em caso de erro.
 * @param {Function} fn - Função a ser executada (pode retornar Promise ou valor).
 * @param {number} retries - Número de tentativas.
 * @param {number} delayMs - Tempo em ms entre tentativas (opcional).
 * @returns {Promise<*>} Resultado da função, se bem-sucedida.
 */
async function retryFunction(fn, retries = 3, delayMs = 0) {
  let lastError;
  let isNotFoundError = false;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const msg = getMessage(err)?.toLowerCase() || "";
      isNotFoundError =
        !msg.includes("404: not found") && !msg.includes("404: não encontrado");

      if (isNotFoundError) break;

      lastError = err;
      if (attempt < retries && delayMs > 0) {
        await new Promise((res) => setTimeout(res, delayMs));
      }
    }
  }

  if (isNotFoundError) return;

  throw lastError;
}

module.exports = {
  logToFile,
  getMessage,
  retryFunction,
};
