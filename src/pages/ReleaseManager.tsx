import { useRef, useState, useCallback } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

function getCurrentHour() {
  const d = new Date();
  return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}:${d.getSeconds().toString().padStart(2, "0")}`;
}

function appendLog(logs: string[], log: string | string[], addHour = false) {
  const hour = getCurrentHour();
  if (!log) return;
  if (Array.isArray(log)) {
    logs.push(...log.map((l) => `${addHour ? `[${hour}] ` : ""}${l}`));
  } else {
    logs.push(`${addHour ? `[${hour}] ` : ""}${log}`);
  }
}

export default function ReleaseManager() {
  const { toast } = useToast();
  const [accounts, setAccounts] = useState<string[]>([]);
  const [workspace, setWorkspace] = useState("");
  const [appsToInstall, setAppsToInstall] = useState<string[]>([]);
  const [appsToUninstall, setAppsToUninstall] = useState<string[]>([]);
  const [forceMaster, setForceMaster] = useState(false);
  const [forceInstallation, setForceInstallation] = useState(false);
  const [typeWorkspace, setTypeWorkspace] = useState<
    "development" | "production"
  >("development");
  const [loading, setLoading] = useState(false);
  const [statuses, setStatuses] = useState<
    Record<string, ReleaseAccountStatus>
  >({});
  const stopped = useRef(false);
  const { getSettings } = useSettings();
  const { accounts: savedAccounts, apps: savedApps } = getSettings();

  const handleStop = useCallback(
    ({ logs, account }: { logs: string[]; account: string }) => {
      handleLogs({
        logs,
        log: "Processo interrompido pelo usuário.",
        status: "stopped",
        account,
        addHour: true,
      });
    },
    [],
  );

  const handleLogs = useCallback(
    ({
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
      appendLog(logs, log, addHour);
      setStatuses((prev) => ({
        ...prev,
        [account]: { account, status, logs: [...logs] },
      }));
    },
    [],
  );

  // Função genérica para executar o fluxo de uma account

  const execAccount = useCallback(
    async (account: string) => {
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

      if (stopped.current) return handleStop({ account, logs });

      // 1. Switch para a conta
      handleLogs({
        logs,
        log: "Iniciado switch de conta",
        status,
        account,
        addHour: true,
      });
      const switchRes = await window.electronAPI?.switchAccount({ account });
      handleLogs({ logs, log: switchRes?.log || "", status, account });
      if (!switchRes?.success) {
        status = "error";
        handleLogs({ logs, status, account });
        toast({
          title: `Erro ao trocar para a conta ${account}`,
          description: switchRes?.log,
          variant: "destructive",
        });
        return false;
      }
      if (stopped.current) return handleStop({ account, logs });

      // 2. Cria workspace
      handleLogs({
        logs,
        log: "Iniciado criação de workspace",
        status,
        account,
        addHour: true,
      });
      const wsRes = await window.electronAPI?.createWorkspace({
        workspace: workspace.trim(),
        typeWorkspace,
        forceMaster,
      });
      handleLogs({ logs, log: wsRes?.log || "", status, account });
      if (!wsRes?.success) {
        status = "error";
        handleLogs({ logs, status, account });
        toast({
          title: `Erro ao criar workspace na conta ${account}`,
          description: wsRes?.log,
          variant: "destructive",
        });
        return false;
      }
      if (stopped.current) return handleStop({ account, logs });

      // 3. Desinstala apps
      if (appsToUninstall.length > 0) {
        handleLogs({
          logs,
          log: "Iniciado processo de desinstalação de apps",
          status,
          account,
          addHour: true,
        });
        const uninstallRes = await window.electronAPI?.uninstallApps({
          workspace: workspace.trim(),
          appsToUninstall,
          forceInstallation,
          forceMaster,
        });
        handleLogs({ logs, log: uninstallRes?.logs || "", status, account });
        if (!uninstallRes?.success) {
          status = "error";
          handleLogs({ logs, status, account });
          toast({
            title: `Erro ao desinstalar apps na conta ${account}`,
            description:
              uninstallRes?.logs?.find((l: string) => l.includes("FALHOU")) ||
              "Erro desconhecido",
            variant: "destructive",
          });
          return false;
        }
      }
      if (stopped.current) return handleStop({ account, logs });

      // 4. Instala apps
      if (appsToInstall.length > 0) {
        handleLogs({
          logs,
          log: "Iniciado processo de instalação de apps",
          status,
          account,
          addHour: true,
        });
        const installRes = await window.electronAPI?.installApps({
          workspace: workspace.trim(),
          appsToInstall,
          forceInstallation,
          forceMaster,
        });
        handleLogs({ logs, log: installRes?.logs || "", status, account });
        if (!installRes?.success) {
          status = "error";
          handleLogs({ logs, status, account });
          toast({
            title: `Erro ao instalar apps na conta ${account}`,
            description:
              installRes?.logs?.find((l: string) => l.includes("FALHOU")) ||
              "Erro desconhecido",
            variant: "destructive",
          });
          return false;
        }
      }

      handleLogs({
        logs,
        log: "Processo concluído.",
        status: "done",
        account,
        addHour: true,
      });
      return true;
    },
    [
      handleLogs,
      handleStop,
      workspace,
      typeWorkspace,
      appsToUninstall,
      appsToInstall,
      forceInstallation,
      forceMaster,
      toast,
    ],
  );

  // Executa todas as accounts

  const handleRun = useCallback(async () => {
    if (!accounts.length || !workspace.trim()) return;
    setLoading(true);
    stopped.current = false;
    setStatuses(
      Object.fromEntries(
        accounts.map((a) => [a, { account: a, status: "pending", logs: [] }]),
      ),
    );
    for (const account of accounts) {
      if (stopped.current) break;
      await execAccount(account);
    }
    setLoading(false);
  }, [accounts, workspace, execAccount]);

  // Retry para uma account específica

  const handleRetryAccount = useCallback(
    async (account: string) => {
      setLoading(true);
      stopped.current = false;
      await execAccount(account);
      setLoading(false);
    },
    [execAccount],
  );

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
        <div className=" grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">Nome da Workspace</label>
            <Input
              className="h-11"
              placeholder="release-v2.0"
              value={forceMaster ? "master" : workspace}
              onChange={(e) => setWorkspace(e.target.value)}
              disabled={loading || forceMaster}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium mb-2">
              Tipo de workspace
            </label>
            <Select
              disabled={loading || forceMaster}
              value={typeWorkspace}
              onValueChange={(e: "development" | "production") =>
                setTypeWorkspace(e)
              }
            >
              <SelectTrigger className="w-full h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="development">Desenvolvimento</SelectItem>
                <SelectItem value="production">Produção</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={forceMaster}
              onCheckedChange={(v) => {
                setForceMaster(!!v);
                if (v) {
                  setWorkspace("master");
                  setTypeWorkspace("production");
                  return;
                }

                setWorkspace("");
                setTypeWorkspace("development");
              }}
              disabled={loading}
            />
            Rodar em produção (workspace "master")
          </label>
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

      <div className="flex  flex-col gap-4">
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
