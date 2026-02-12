import { useState } from "react";
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
import { TagInput } from "@/components/TagInput";
import { AppVersions, transformVersions } from "@/lib/utils";
import { useSettings } from "@/hooks/use-settings";

// Add a declaration for the electronAPI property on window

export default function VersionChecker() {
  const [accounts, setAccounts] = useState<string[]>([]);
  const [apps, setApps] = useState<string[]>([]);
  const [results, setResults] = useState<AppVersions[]>([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const { getSettings } = useSettings();

  const handleCheck = async () => {
    if (!accounts.length || !apps.length) return;
    setLoading(true);
    setResults([]);
    setProgress(0);

    const data = [];

    for (let done = 0; done < accounts.length; done++) {
      const account = accounts[done];
      data.push(
        ...(await window.electronAPI.versionChecker({ account, apps })),
      );
      setProgress(Math.round(((done + 1) / accounts.length) * 100));
    }

    const transformedData = transformVersions(data);

    setResults(transformedData);
    setLoading(false);
  };

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
          placeholder="Digite uma account e pressione Enter"
          suggestions={getSettings().accounts}
        />
        <TagInput
          label="Apps"
          values={apps}
          onChange={setApps}
          placeholder="Ex: vtex.store-graphql"
          suggestions={getSettings().apps}
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
    </div>
  );
}
