/**
 * CLI Service — Mock layer
 *
 * Este arquivo centraliza todas as chamadas que, no futuro,
 * serão substituídas por chamadas reais ao Electron IPC (ipcRenderer.invoke).
 *
 * Por enquanto, cada função simula delays e retorna dados fictícios.
 */

// --- Helpers ---
const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

const randomVersion = () =>
  `${Math.floor(Math.random() * 5)}.${Math.floor(Math.random() * 20)}.${Math.floor(Math.random() * 30)}`;

const randomBool = (chance = 0.8) => Math.random() < chance;

// --- Types ---
export interface VersionResult {
  account: string;
  versions?: Record<string, string | null>; // appName → version or null
  error?: string;
}

export interface UpdateLog {
  account: string;
  message: string;
  status: "info" | "success" | "error";
}

export interface ReleaseAccountStatus {
  account: string;
  status: "pending" | "in_progress" | "done" | "error";
  logs: string[];
}

export interface ReleaseOptions {
  accounts: string[];
  workspace: string;
  appsToInstall: string[];
  appsToUninstall: string[];
  forceMaster: boolean;
  stopOnError: boolean;
}

// --- Check Versions ---
// Futuro: ipcRenderer.invoke('cli:checkVersions', accounts, apps)
export async function checkVersions(
  accounts: string[],
  apps: string[],
  onProgress?: (done: number, total: number) => void,
): Promise<VersionResult[]> {
  const results: VersionResult[] = [];
  const total = accounts.length;

  for (let i = 0; i < accounts.length; i++) {
    await delay(300 + Math.random() * 400);
    const versions: Record<string, string | null> = {};
    for (const app of apps) {
      versions[app] = randomBool(0.75) ? randomVersion() : null;
    }
    results.push({ account: accounts[i], versions });
    onProgress?.(i + 1, total);
  }

  return results;
}

// --- Update Accounts ---
// Futuro: ipcRenderer.invoke('cli:updateAccount', account)
export async function updateAccounts(
  accounts: string[],
  onLog: (log: UpdateLog) => void,
): Promise<void> {
  for (const account of accounts) {
    onLog({
      account,
      message: `[${account}] Iniciando atualização...`,
      status: "info",
    });
    await delay(500 + Math.random() * 1000);

    if (randomBool(0.9)) {
      onLog({
        account,
        message: `[${account}] yes | vtex update — Atualizado com sucesso ✓`,
        status: "success",
      });
    } else {
      onLog({
        account,
        message: `[${account}] Falha na atualização ✗`,
        status: "error",
      });
    }
  }
}

// --- Manage Release / Workspace ---
// Futuro: ipcRenderer.invoke('cli:manageRelease', options)
export async function manageRelease(
  options: ReleaseOptions,
  onStatusChange: (account: string, status: ReleaseAccountStatus) => void,
): Promise<void> {
  const {
    accounts,
    workspace,
    appsToInstall,
    appsToUninstall,
    forceMaster,
    stopOnError,
  } = options;

  for (const account of accounts) {
    const state: ReleaseAccountStatus = {
      account,
      status: "in_progress",
      logs: [],
    };

    // Validate master
    if (workspace.toLowerCase() === "master" && !forceMaster) {
      state.status = "error";
      state.logs.push(
        "ERRO: Proibido rodar na master. Ative 'Forçar uso na Master'.",
      );
      onStatusChange(account, { ...state });
      if (stopOnError) return;
      continue;
    }

    onStatusChange(account, { ...state });

    // Step 1: Create workspace
    state.logs.push(
      `Criando Workspace "${workspace}" na conta "${account}"...`,
    );
    onStatusChange(account, { ...state });
    await delay(600 + Math.random() * 500);
    state.logs.push(`Workspace "${workspace}" criado com sucesso.`);
    onStatusChange(account, { ...state });

    // Step 2: Uninstall apps
    if (appsToUninstall.length > 0) {
      state.logs.push("Desinstalando apps...");
      onStatusChange(account, { ...state });
      for (const app of appsToUninstall) {
        await delay(300 + Math.random() * 300);
        state.logs.push(`  ↳ ${app} desinstalado`);
        onStatusChange(account, { ...state });
      }
    }

    // Step 3: Install apps
    if (appsToInstall.length > 0) {
      state.logs.push("Instalando apps...");
      onStatusChange(account, { ...state });
      for (const app of appsToInstall) {
        await delay(400 + Math.random() * 400);
        const success = randomBool(0.85);
        if (success) {
          state.logs.push(`  ↳ ${app} instalado com sucesso ✓`);
        } else {
          state.logs.push(`  ↳ ${app} FALHOU na instalação ✗`);
          if (stopOnError) {
            state.status = "error";
            onStatusChange(account, { ...state });
            return;
          }
        }
        onStatusChange(account, { ...state });
      }
    }

    state.status = "done";
    state.logs.push("Processo concluído.");
    onStatusChange(account, { ...state });
  }
}
