import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { updateAccounts, type UpdateLog } from "@/utils/cliService";
import { cn } from "@/lib/utils";

function parseList(text: string): string[] {
  return text
    .split(/[,\n]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export default function AccountUpdater() {
  const [accountsText, setAccountsText] = useState("");
  const [logs, setLogs] = useState<UpdateLog[]>([]);
  const [loading, setLoading] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);

  const accounts = parseList(accountsText);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [logs]);

  const doneCount = logs.filter((l) => l.status !== "info").length;
  const progress = accounts.length > 0 ? Math.round((doneCount / accounts.length) * 100) : 0;

  const handleUpdate = async () => {
    if (!accounts.length) return;
    setLogs([]);
    setLoading(true);

    await updateAccounts(accounts, (log) => {
      setLogs((prev) => [...prev, log]);
    });

    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Atualizador de Contas</h1>
        <p className="text-muted-foreground mt-1">Execute <code className="text-xs bg-muted px-1 py-0.5 rounded">yes | vtex update</code> em massa</p>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Accounts</label>
        <Textarea
          placeholder={"account1\naccount2\naccount3"}
          rows={5}
          value={accountsText}
          onChange={(e) => setAccountsText(e.target.value)}
        />
      </div>

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
                    log.status === "info" && "text-muted-foreground"
                  )}
                >
                  {log.message}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
