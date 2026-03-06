import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TagInput } from "@/components/TagInput";
import { updateAccounts, type UpdateLog } from "@/utils/cliService";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useSettings } from "@/hooks/use-settings";

export default function AccountUpdater() {
    const { toast } = useToast();
  const [accounts, setAccounts] = useState<string[]>([]);
  const [logs, setLogs] = useState<UpdateLog[]>([]);
  const [loading, setLoading] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);
  const { getSettings } = useSettings();
  const { accounts: savedAccounts } = getSettings();

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [logs]);

  const doneCount = logs.filter((l) => l.status !== "info").length;
  const progress =
    accounts.length > 0 ? Math.round((doneCount / accounts.length) * 100) : 0;

  const handleUpdate = async () => {
    if (!accounts.length) return;
    setLogs([]);
    setLoading(true);

    for (const account of accounts) {
      const response = await window.electronAPI?.updateAccount(account);
      setLogs((prev) => [...prev, response]);
      if (response && response.status === "error") {
        toast({
          title: `Erro ao atualizar conta ${account}`,
          description: response.message || "Erro desconhecido",
          variant: "destructive",
        });
      }
    }

    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Atualizador de Contas
        </h1>
        <p className="text-muted-foreground mt-1">
          Execute{" "}
          <code className="text-xs bg-muted px-1 py-0.5 rounded">
            vtex switch {"{account}"} && yes | vtex update
          </code>{" "}
          em massa
        </p>
      </div>

      <TagInput
        label="Accounts"
        values={accounts}
        onChange={setAccounts}
        placeholder={`Digite ${savedAccounts.length ? "ou selecione " : ""}uma account e pressione Enter`}
        suggestions={savedAccounts}
      />

      <div className="flex items-center gap-4">
        <Button onClick={handleUpdate} disabled={loading || !accounts.length}>
          {loading ? "Atualizando..." : "Rodar Atualização Massiva"}
        </Button>
        {loading && <Progress value={progress} className="w-48" />}
      </div>

      {logs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Console</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              ref={logRef}
              className="h-72 overflow-auto rounded-md bg-secondary/50 p-4 font-mono text-xs space-y-1"
            >
              {logs.map((log, i) => (
                <div
                  key={i}
                  className={cn(
                    log.status === "success" && "text-green-500",
                    log.status === "error" && "text-destructive",
                    log.status === "info" && "text-muted-foreground",
                  )}
                >
                  <b>{log.account}</b>: {log.message}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
