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

module.exports = {
  logToFile,
};
