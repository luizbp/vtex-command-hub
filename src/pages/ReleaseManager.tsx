import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TagInput } from "@/components/TagInput";
import type { ReleaseAccountStatus } from "@/utils/cliService";
import { checkFormatAppName, cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useSettings } from "@/hooks/use-settings";

const statusColors: Record<ReleaseAccountStatus["status"], string> = {
  pending: "bg-muted text-muted-foreground",
  in_progress: "bg-primary/20 text-primary",
  done: "bg-green-500/20 text-green-500",
  error: "bg-destructive/20 text-destructive",
  stopped: "bg-yellow-500/20 text-yellow-500",
};

const statusLabels: Record<ReleaseAccountStatus["status"], string> = {
  pending: "Pendente",
  in_progress: "Em Progresso",
  done: "Concluído",
  error: "Erro",
  stopped: "Interrompido",
};

export default function ReleaseManager() {
  const { toast } = useToast();
  const [accounts, setAccounts] = useState<string[]>([]);
  const [workspace, setWorkspace] = useState("");
  const [appsToInstall, setAppsToInstall] = useState<string[]>([]);
  const [appsToUninstall, setAppsToUninstall] = useState<string[]>([]);
  const [forceMaster, setForceMaster] = useState(false);
  const [forceInstallation, setForceInstallation] = useState(false);
  const [loading, setLoading] = useState(false);
  const [statuses, setStatuses] = useState<
    Record<string, ReleaseAccountStatus>
  >({});
  const stopped = useRef(false);
  const { getSettings } = useSettings();
  const { accounts: savedAccounts, apps: savedApps } = getSettings();

  const handleStop = ({
    logs,
    account,
  }: {
    logs: string[];
    account: string;
  }) => {
    handleLogs({
      logs,
      log: "Processo interrompido pelo usuário.",
      status: "stopped",
      account,
      addHour: true,
    });
  };

  const handleLogs = ({
    logs,
    log,
    status,
    account,
    addHour = false,
  }: {
    logs: string[];
    log?: string | string[];
    status: ReleaseAccountStatus["status"];
    account: string;
    addHour?: boolean;
  }) => {
    const currentDate = new Date();
    const currentHour = `${currentDate.getHours().toString().padStart(2, "0")}:${currentDate.getMinutes().toString().padStart(2, "0")}:${currentDate.getSeconds().toString().padStart(2, "0")}`;
    if (log) {
      if (Array.isArray(log)) {
        logs.push(
          ...log.map((l) => `${addHour ? `[${currentHour}] ` : ""}${l}`),
        );
      } else if (log) {
        logs.push(`${addHour ? `[${currentHour}] ` : ""}${log}`);
      }
    }

    setStatuses((prev) => ({
      ...prev,
      [account]: { account, status, logs: [...logs] },
    }));
  };

  // Função genérica para executar o fluxo de uma account
  const execAccount = async (account: string) => {
    setStatuses((prev) => ({
      ...prev,
      [account]: { account, status: "pending", logs: [] },
    }));
    const logs: string[] = ["Iniciando..."];
    let status: ReleaseAccountStatus["status"] = "in_progress";
    setStatuses((prev) => ({
      ...prev,
      [account]: { account, status, logs },
    }));

    if (stopped.current) {
      handleStop({
        account,
        logs,
      });

      return;
    }

    // 1. Switch para a conta
    handleLogs({
      logs: logs,
      log: "Iniciado switch de conta",
      status,
      account,
      addHour: true,
    });
    const switchRes = await window.electronAPI?.switchAccount({ account });
    handleLogs({
      logs: logs,
      log: switchRes?.log || "",
      status,
      account,
    });
    if (!switchRes?.success) {
      status = "error";
      handleLogs({
        logs: logs,
        status,
        account,
      });
      toast({
        title: `Erro ao trocar para a conta ${account}`,
        description: switchRes?.log,
        variant: "destructive",
      });
      return false;
    }

    if (stopped.current) {
      handleStop({
        account,
        logs,
      });

      return;
    }

    // 2. Cria workspace
    handleLogs({
      logs: logs,
      log: "Iniciado criação de workspace",
      status,
      account,
      addHour: true,
    });
    const wsRes = await window.electronAPI?.createWorkspace({
      account,
      workspace: workspace.trim(),
    });
    handleLogs({
      logs: logs,
      log: wsRes?.log || "",
      status,
      account,
    });
    if (!wsRes?.success) {
      status = "error";
      handleLogs({
        logs: logs,
        status,
        account,
      });
      toast({
        title: `Erro ao criar workspace na conta ${account}`,
        description: wsRes?.log,
        variant: "destructive",
      });
      return false;
    }

    if (stopped.current) {
      handleStop({
        account,
        logs,
      });

      return;
    }

    // 3. Desinstala apps
    if (appsToUninstall.length > 0) {
      handleLogs({
        logs: logs,
        log: "Iniciado processo de desinstalação de apps",
        status,
        account,
        addHour: true,
      });
      const uninstallRes = await window.electronAPI?.uninstallApps({
        account,
        workspace: workspace.trim(),
        appsToUninstall,
        forceInstallation,
        forceMaster,
      });
      handleLogs({
        logs: logs,
        log: uninstallRes?.logs || "",
        status,
        account,
      });
      if (!uninstallRes?.success) {
        status = "error";
        handleLogs({
          logs: logs,
          status,
          account,
        });
        toast({
          title: `Erro ao desinstalar apps na conta ${account}`,
          description:
            uninstallRes?.logs?.find((l) => l.includes("FALHOU")) ||
            "Erro desconhecido",
          variant: "destructive",
        });
        return false;
      }
    }

    if (stopped.current) {
      handleStop({
        account,
        logs,
      });

      return;
    }

    // 4. Instala apps
    if (appsToInstall.length > 0) {
      handleLogs({
        logs: logs,
        log: "Iniciado processo de instalação de apps",
        status,
        account,
        addHour: true,
      });

      const installRes = await window.electronAPI?.installApps({
        account,
        workspace: workspace.trim(),
        appsToInstall,
        forceInstallation,
        forceMaster,
      });
      handleLogs({
        logs: logs,
        log: installRes?.logs || "",
        status,
        account,
      });
      if (!installRes?.success) {
        status = "error";
        handleLogs({
          logs: logs,
          status,
          account,
        });
        toast({
          title: `Erro ao instalar apps na conta ${account}`,
          description:
            installRes?.logs?.find((l) => l.includes("FALHOU")) ||
            "Erro desconhecido",
          variant: "destructive",
        });
        return false;
      }
    }

    handleLogs({
      logs: logs,
      log: "Processo concluído.",
      status: "done",
      account,
      addHour: true,
    });
    return true;
  };

  // Executa todas as accounts
  const handleRun = async () => {
    if (!accounts.length || !workspace.trim()) return;
    setLoading(true);
    stopped.current = false;

    const initial: Record<string, ReleaseAccountStatus> = {};
    accounts.forEach(
      (a) => (initial[a] = { account: a, status: "pending", logs: [] }),
    );
    setStatuses(initial);

    for (const account of accounts) {
      if (stopped.current) break;
      await execAccount(account);
    }

    setLoading(false);
  };

  // Retry para uma account específica
  const handleRetryAccount = async (account: string) => {
    setLoading(true);
    stopped.current = false;
    await execAccount(account);
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Gerenciador de Release/TM
        </h1>
        <p className="text-muted-foreground mt-1">
          Monte workspaces e gerencie apps em múltiplas contas
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <TagInput
          label="Accounts"
          values={accounts}
          onChange={setAccounts}
          placeholder={`Digite ${savedAccounts.length ? "ou selecione " : ""}uma account e pressione Enter`}
          suggestions={savedAccounts}
          disabled={loading}
        />
        <div className="space-y-2">
          <label className="text-sm font-medium">Nome da Workspace</label>
          <Input
            placeholder="release-v2.0"
            value={workspace}
            onChange={(e) => setWorkspace(e.target.value)}
            disabled={loading}
          />
        </div>
        <TagInput
          label="Apps para Instalar (opcional)"
          values={appsToInstall}
          onChange={(value) => {
            const isValid = checkFormatAppName(value, true);
            if (!isValid) {
              toast({
                title: "Formato de app inválido",
                description:
                  "O formato deve ser vendor.app@major.minor.patch, ex: vtex.app-custom@1.0.0",
                variant: "destructive",
              });
              return;
            }

            setAppsToInstall(value);
          }}
          suggestions={savedApps}
          fillOnSelect
          suffixWhenFilling="@"
          placeholder={`Digite ${savedApps.length ? "ou selecione " : ""}um app e pressione Enter. Ex: vtex.new-app@1.0.0`}
          disabled={loading}
        />
        <TagInput
          label="Apps para Desinstalar (opcional)"
          values={appsToUninstall}
          onChange={(value) => {
            const isValid = checkFormatAppName(value, true);
            if (!isValid) {
              toast({
                title: "Formato de app inválido",
                description:
                  "O formato deve ser vendor.app@major.minor.patch, ex: vtex.app-custom@1.0.0",
                variant: "destructive",
              });
              return;
            }

            setAppsToUninstall(value);
          }}
          suggestions={savedApps}
          fillOnSelect
          suffixWhenFilling="@"
          placeholder={`Digite ${savedApps.length ? "ou selecione " : ""}um app e pressione Enter. Ex: vtex.old-app@1.0.0`}
          disabled={loading}
        />
      </div>

      <div className="flex flex-wrap items-center gap-6">
        <label className="flex items-center gap-2 text-sm">
          <Checkbox
            checked={forceMaster}
            onCheckedChange={(v) => setForceMaster(!!v)}
            disabled={loading}
          />
          Forçar uso na Master
        </label>
        <label className="flex items-center gap-2 text-sm">
          <Checkbox
            checked={forceInstallation}
            onCheckedChange={(v) => setForceInstallation(!!v)}
            disabled={loading}
          />
          Forçar instalação/desinstalação dos apps
        </label>
      </div>

      <div className="flex gap-4">
        <Button
          onClick={handleRun}
          disabled={loading || !accounts.length || !workspace.trim()}
        >
          {loading ? "Executando..." : "Iniciar Processo"}
        </Button>
        {loading && (
          <Button
            variant="destructive"
            onClick={() => (stopped.current = true)}
            type="button"
          >
            Parar execução
          </Button>
        )}
      </div>

      {Object.keys(statuses).length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
          {accounts.map((account) => {
            const s = statuses[account];
            if (!s) return null;
            return (
              <Card key={account}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">
                    {account}
                  </CardTitle>
                  <Badge className={cn("text-xs", statusColors[s.status])}>
                    {statusLabels[s.status]}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <div className="h-32 overflow-auto rounded bg-secondary/50 p-2 font-mono text-xs space-y-0.5">
                    {s.logs.map((log, i) => (
                      <div
                        key={i}
                        className={cn(
                          log.includes("ERRO") || log.includes("FALHOU")
                            ? "text-destructive"
                            : "text-muted-foreground",
                          log.includes("sucesso") && "text-green-500",
                          log.includes("interrompido") && "text-yellow-500",
                        )}
                      >
                        {log}
                      </div>
                    ))}
                  </div>
                  {s.status === "error" && !loading && (
                    <div className="mt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRetryAccount(account)}
                      >
                        Tentar novamente
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
