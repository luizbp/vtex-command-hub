// Componente para exibir contas com erro
function ErrorAccountsList({
  errorAccounts,
}: {
  errorAccounts: { account: string; error: string }[];
}) {
  if (!errorAccounts?.length) return <></>;
  return (
    <>
      <Card className="border-destructive border-2">
        <CardHeader>
          <CardTitle className="text-base text-destructive">
            Contas com erro
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc pl-4 space-y-1">
            {errorAccounts.map((item, idx) => (
              <li key={item.account + idx}>
                <span className="font-semibold">{item.account}:</span>{" "}
                {item.error}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </>
  );
}
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useMemo, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PastExecutionViewer } from "@/components/PastExecutionViewer";
import { TagInput } from "@/components/TagInput";
import { AppVersions, transformVersions } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useSettings } from "@/hooks/use-settings";
import { Input } from "@/components/ui/input";

export default function VersionChecker() {
  const { toast } = useToast();
  const execCardRef = useRef<HTMLDivElement | null>(null);
  const [accounts, setAccounts] = useState<string[]>([]);
  const [apps, setApps] = useState<string[]>([]);
  const [results, setResults] = useState<AppVersions[]>([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const { getSettings, addLog, deleteLog } = useSettings();
  const [settings, setSettings] = useState(getSettings());
  const { accounts: savedAccounts, apps: savedApps, logs = [] } = settings;
  const [selectedLog, setSelectedLog] = useState<null | {
    date: string;
    data: any;
  }>(null);

  // Filtros e paginação para logs
  const [logPage, setLogPage] = useState(1);
  const LOGS_PER_PAGE = 5;
  const [filterDate, setFilterDate] = useState("");
  const [filterApp, setFilterApp] = useState("");
  const [filterAccount, setFilterAccount] = useState("");
  const [errorAccounts, setErrorAccounts] = useState<
    { account: string; error: string }[]
  >([]);
  console.log("TCL: VersionChecker -> errorAccounts", errorAccounts);

  // Filtra logs conforme filtros
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      let match = true;
      if (filterDate) {
        match = match && log.date.startsWith(filterDate);
      }
      if (filterApp) {
        match =
          match &&
          log.data.apps?.some((a: string) =>
            a.toLowerCase().includes(filterApp.toLowerCase()),
          );
      }
      if (filterAccount) {
        match =
          match &&
          log.data.accounts?.some((a: string) =>
            a.toLowerCase().includes(filterAccount.toLowerCase()),
          );
      }
      return match;
    });
  }, [logs, filterDate, filterApp, filterAccount]);

  const totalPages = Math.ceil(filteredLogs.length / LOGS_PER_PAGE) || 1;
  const paginatedLogs = useMemo(() => {
    const start = (logPage - 1) * LOGS_PER_PAGE;
    return filteredLogs
      .slice()
      .reverse()
      .slice(start, start + LOGS_PER_PAGE);
  }, [filteredLogs, logPage]);

  const handleCheck = async () => {
    if (!accounts.length || !apps.length) return;
    setLoading(true);
    setResults([]);
    setProgress(0);
    setErrorAccounts([]);

    const data = [];
    const errors: { account: string; error: string }[] = [];

    for (let done = 0; done < accounts.length; done++) {
      const account = accounts[done];
      const result = await window.electronAPI.versionChecker({ account, apps });
      for (const r of result) {
        if (r.error) {
          errors.push({ account, error: r.error });
          toast({
            title: `Erro ao verificar versões na conta ${account}`,
            description: r.error,
            variant: "destructive",
          });
        }
      }
      data.push(...result);
      setProgress(Math.round(((done + 1) / accounts.length) * 100));
    }

    setErrorAccounts(errors);

    if (errors.length) {
      toast({
        title: "Verificação concluída com erros",
        description: "Algumas contas apresentaram erros durante a verificação.",
        variant: "destructive",
      });
      setLoading(false);

      if (data.length === errors.length) return;
    } else {
      toast({
        title: "Verificação concluída",
        description: "Todas as contas foram verificadas com sucesso.",
      });
    }

    const transformedData = transformVersions(data);
    setResults(transformedData);
    setLoading(false);

    addLog({
      date: new Date().toISOString(),
      data: {
        accounts: [...accounts],
        apps: [...apps],
        results: transformedData,
      },
    });
    setSettings(getSettings());
  };

  // Deleta um log pelo date
  const handleDeleteLog = (date: string) => {
    deleteLog(date);
    setSettings(getSettings());
  };

  useEffect(() => {
    if (selectedLog && execCardRef.current) {
      execCardRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [selectedLog]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Verificador de Versões
        </h1>
        <p className="text-muted-foreground mt-1">
          Confira as versões dos apps instalados em cada conta
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <TagInput
          label="Accounts"
          values={accounts}
          onChange={setAccounts}
          placeholder={`Digite ${savedAccounts.length ? "ou selecione " : ""}uma account e pressione Enter`}
          suggestions={savedAccounts}
        />
        <TagInput
          label="Apps"
          values={apps}
          onChange={setApps}
          placeholder={`Digite ${savedApps.length ? "ou selecione " : ""}um app e pressione Enter. Ex: vtex.app-example`}
          suggestions={savedApps}
        />
      </div>

      <div className="flex items-center gap-4">
        <Button
          onClick={handleCheck}
          disabled={loading || !accounts.length || !apps.length}
        >
          {loading ? "Verificando..." : "Verificar Versões"}
        </Button>
        {loading && <Progress value={progress} className="w-48" />}
      </div>

      {/* Contas com erro */}
      <ErrorAccountsList errorAccounts={errorAccounts} />

      {/* Resultado da execução atual */}
      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Resultado</CardTitle>
          </CardHeader>
          <CardContent className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="sticky left-0 bg-card z-10">
                    Apps
                  </TableHead>
                  {accounts.map((account) => (
                    <TableHead key={account} className="whitespace-nowrap">
                      {account}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.map((r) => (
                  <TableRow key={r.app}>
                    <TableCell className="sticky left-0 bg-card z-10 font-medium">
                      {r.app}
                    </TableCell>
                    {accounts.map((account) => (
                      <TableCell key={account} className="whitespace-nowrap">
                        {r.accountVersions[account] ? (
                          <span className="font-mono text-sm">
                            {r.accountVersions[account]}
                          </span>
                        ) : (
                          <Badge variant="secondary">Não instalado</Badge>
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Histórico de execuções com filtros e paginação */}
      {logs.length > 0 && (
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="text-base">Execuções passadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2 mb-2">
              <Input
                type="date"
                value={filterDate}
                onChange={(e) => {
                  setFilterDate(e.target.value);
                  setLogPage(1);
                }}
                title="Filtrar por data"
                className="max-w-[160px]"
              />
              <Input
                type="text"
                placeholder="Filtrar por app"
                value={filterApp}
                onChange={(e) => {
                  setFilterApp(e.target.value);
                  setLogPage(1);
                }}
                className="max-w-[180px]"
              />
              <Input
                type="text"
                placeholder="Filtrar por account"
                value={filterAccount}
                onChange={(e) => {
                  setFilterAccount(e.target.value);
                  setLogPage(1);
                }}
                className="max-w-[180px]"
              />
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Accounts</TableHead>
                  <TableHead>Apps</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center">
                      Nenhum log encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedLogs.map((log, idx) => (
                    <TableRow key={idx}>
                      <TableCell>
                        {new Date(log.date).toLocaleString()}
                      </TableCell>
                      <TableCell>{log.data.accounts?.join(", ")}</TableCell>
                      <TableCell>{log.data.apps?.join(", ")}</TableCell>
                      <TableCell className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedLog(log)}
                        >
                          Exibir
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteLog(log.date)}
                        >
                          Deletar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            {/* Paginação */}
            {totalPages > 1 && (
              <div className="flex gap-2 mt-2 justify-end items-center">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setLogPage((p) => Math.max(1, p - 1))}
                  disabled={logPage === 1}
                >
                  Anterior
                </Button>
                <span className="text-sm">
                  Página {logPage} de {totalPages}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setLogPage((p) => Math.min(totalPages, p + 1))}
                  disabled={logPage === totalPages}
                >
                  Próxima
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Modal ou Card para exibir execução passada */}
      {selectedLog && (
        <PastExecutionViewer
          log={selectedLog}
          ref={execCardRef}
          onClose={() => setSelectedLog(null)}
        />
      )}
    </div>
  );
}
