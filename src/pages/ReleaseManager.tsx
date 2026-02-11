import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TagInput } from "@/components/TagInput";
import type { ReleaseAccountStatus } from "@/utils/cliService";
import { cn } from "@/lib/utils";

const statusColors: Record<ReleaseAccountStatus["status"], string> = {
  pending: "bg-muted text-muted-foreground",
  in_progress: "bg-primary/20 text-primary",
  done: "bg-green-500/20 text-green-500",
  error: "bg-destructive/20 text-destructive",
};

const statusLabels: Record<ReleaseAccountStatus["status"], string> = {
  pending: "Pendente",
  in_progress: "Em Progresso",
  done: "Concluído",
  error: "Erro",
};

export default function ReleaseManager() {
  const [accounts, setAccounts] = useState<string[]>([]);
  const [workspace, setWorkspace] = useState("");
  const [installApps, setInstallApps] = useState<string[]>([]);
  const [uninstallApps, setUninstallApps] = useState<string[]>([]);
  const [forceMaster, setForceMaster] = useState(false);
  const [stopOnError, setStopOnError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [statuses, setStatuses] = useState<
    Record<string, ReleaseAccountStatus>
  >({});

  const handleRun = async () => {
    if (!accounts.length || !workspace.trim()) return;
    setLoading(true);

    const initial: Record<string, ReleaseAccountStatus> = {};
    accounts.forEach(
      (a) => (initial[a] = { account: a, status: "pending", logs: [] }),
    );
    setStatuses(initial);

    // Executa manageRelease para cada account, atualizando status gradualmente
    for (const account of accounts) {
      setStatuses((prev) => ({
        ...prev,
        [account]: { account, status: "in_progress", logs: ["Iniciando..."] },
      }));
      const result = await window.electronAPI?.manageRelease({
        account,
        workspace: workspace.trim(),
        appsToInstall: installApps,
        appsToUninstall: uninstallApps,
        forceMaster,
        stopOnError,
      });
      setStatuses((prev) => ({ ...prev, [account]: result }));
    }

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
          placeholder="Digite uma account e pressione Enter"
        />
        <div className="space-y-2">
          <label className="text-sm font-medium">Nome da Workspace</label>
          <Input
            placeholder="release-v2.0"
            value={workspace}
            onChange={(e) => setWorkspace(e.target.value)}
          />
        </div>
        <TagInput
          label="Apps para Instalar (opcional)"
          values={installApps}
          onChange={setInstallApps}
          placeholder="Ex: vtex.app-one"
        />
        <TagInput
          label="Apps para Desinstalar (opcional)"
          values={uninstallApps}
          onChange={setUninstallApps}
          placeholder="Ex: vtex.old-app"
        />
      </div>

      <div className="flex flex-wrap items-center gap-6">
        <label className="flex items-center gap-2 text-sm">
          <Checkbox
            checked={forceMaster}
            onCheckedChange={(v) => setForceMaster(!!v)}
          />
          Forçar uso na Master
        </label>
        <label className="flex items-center gap-2 text-sm">
          <Checkbox
            checked={stopOnError}
            onCheckedChange={(v) => setStopOnError(!!v)}
          />
          Parar em caso de erro
        </label>
      </div>

      <Button
        onClick={handleRun}
        disabled={loading || !accounts.length || !workspace.trim()}
      >
        {loading ? "Executando..." : "Iniciar Processo"}
      </Button>

      {Object.keys(statuses).length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
                        )}
                      >
                        {log}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
