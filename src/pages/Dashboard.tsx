import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, RefreshCw, Rocket, Activity } from "lucide-react";
import { useNavigate } from "react-router-dom";

const shortcuts = [
  { title: "Verificador de Versões", icon: Search, url: "/version-checker", desc: "Checar versões de apps em múltiplas contas" },
  { title: "Atualizador de Contas", icon: RefreshCw, url: "/account-updater", desc: "Rodar vtex update em massa" },
  { title: "Gerenciador de Release/TM", icon: Rocket, url: "/release-manager", desc: "Montar workspaces com apps" },
];

export default function Dashboard() {
  const navigate = useNavigate();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Visão geral do VTEX CLI Manager</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Contas Processadas", value: "—", icon: Activity },
          { label: "Última Verificação", value: "Nenhuma", icon: Search },
          { label: "Atualizações Hoje", value: "0", icon: RefreshCw },
          { label: "Releases Criados", value: "0", icon: Rocket },
        ].map((s) => (
          <Card key={s.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{s.label}</CardTitle>
              <s.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{s.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Shortcuts */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Acesso Rápido</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {shortcuts.map((s) => (
            <Card
              key={s.title}
              className="cursor-pointer transition-colors hover:bg-accent/50"
              onClick={() => navigate(s.url)}
            >
              <CardHeader className="flex flex-row items-center gap-3 pb-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <s.icon className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-base">{s.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{s.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
