/* eslint-disable @typescript-eslint/no-explicit-any */
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { forwardRef } from "react";

interface LogData {
  date: string;
  data: {
    accounts: string[];
    apps: string[];
    results: any[];
  };
}

interface PastExecutionViewerProps {
  log: LogData;
  onClose?: () => void;
}

// Componente reutilizável para exibir execução passada
export const PastExecutionViewer = forwardRef<
  HTMLDivElement,
  PastExecutionViewerProps
>(({ log, onClose }, ref) => (
  <Card className="mt-4" ref={ref}>
    <CardHeader>
      <div className="flex gap-3 items-center justify-between w-full">
        <CardTitle className="text-base">
          Execução de {new Date(log.date).toLocaleString()}
        </CardTitle>
        {onClose && (
          <Button size="sm" variant="destructive" onClick={onClose}>
            Fechar
          </Button>
        )}
      </div>
    </CardHeader>
    <CardContent className="overflow-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="sticky left-0 bg-card z-10">Apps</TableHead>
            {log.data.accounts.map((account: string) => (
              <TableHead key={account} className="whitespace-nowrap">
                {account}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {log.data.results.map((r: any) => (
            <TableRow key={r.app}>
              <TableCell className="sticky left-0 bg-card z-10 font-medium">
                {r.app}
              </TableCell>
              {log.data.accounts.map((account: string) => (
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
));
PastExecutionViewer.displayName = "PastExecutionViewer";
