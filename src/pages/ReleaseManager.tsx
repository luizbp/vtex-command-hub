import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { manageRelease, type ReleaseAccountStatus } from "@/utils/cliService";
import { cn } from "@/lib/utils";

function parseList(text: string): string[] {
  return text
    .split(/[,\n]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

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
  const [accountsText, setAccountsText] = useState("");
  const [workspace, setWorkspace] = useState("");
  const [installText, setInstallText] = useState("");
  const [uninstallText, setUninstallText] = useState("");
  const [forceMaster, setForceMaster] = useState(false);
  const [stopOnError, setStopOnError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [statuses, setStatuses] = useState<Record<string, ReleaseAccountStatus>>({});

  const accounts = parseList(accountsText);

  const handleRun = async () => {
    if (!accounts.length || !workspace.trim()) return;
    setLoading(true);

    // init all as pending
    const initial: Record<string, ReleaseAccountStatus> = {};
    accounts.forEach((a) => (initial[a] = { account: a, status: "pending", logs: [] }));
    setStatuses(initial);

    await manageRelease(
      {
        accounts,
        workspace: workspace.trim(),
        appsToInstall: parseList(installText),
        appsToUninstall: parseList(uninstallText),
        forceMaster,
        stopOnError,
      },
      (account, status) => {
        setStatuses((prev) => ({ ...prev, [account]: status }));
      }
    );

    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Gerenciador de Release/TM</h1>
        <p className="text-muted-foreground mt-1">Monte workspaces e gerencie apps em múltiplas contas</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium">Accounts</label>
          <Textarea
            placeholder={"account1\naccount2"}
            rows={4}
            value={accountsText}
            onChange={(e) => setAccountsText(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Nome da Workspace</label>
          <Input
            placeholder="release-v2.0"
            value={workspace}
            onChange={(e) => setWorkspace(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Apps para Instalar (opcional)</label>
          <Textarea
            placeholder={"vtex.app-one\nvtex.app-two"}
            rows={3}
            value={installText}
            onChange={(e) => setInstallText(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Apps para Desinstalar (opcional)</label>
          <Textarea
            placeholder={"vtex.old-app"}
            rows={3}
            value={uninstallText}
            onChange={(e) => setUninstallText(e.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-6">
        <label className="flex items-center gap-2 text-sm">
          <Checkbox checked={forceMaster} onCheckedChange={(v) => setForceMaster(!!v)} />
          Forçar uso na Master
        </label>
        <label className="flex items-center gap-2 text-sm">
          <Checkbox checked={stopOnError} onCheckedChange={(v) => setStopOnError(!!v)} />
          Parar em caso de erro
        </label>
      </div>

      <Button onClick={handleRun} disabled={loading || !accounts.length || !workspace.trim()}>
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
                  <CardTitle className="text-sm font-medium">{account}</CardTitle>
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
                          log.includes("ERRO") || log.includes("FALHOU") ? "text-destructive" : "text-muted-foreground",
                          log.includes("sucesso") && "text-green-500"
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
