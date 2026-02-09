import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { useTheme } from "@/hooks/use-theme";

export default function SettingsPage() {
  const { theme, toggle } = useTheme();

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Configurações</h1>
        <p className="text-muted-foreground mt-1">Preferências do VTEX CLI Manager</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Aparência</CardTitle>
          <CardDescription>Escolha entre modo escuro e claro</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <span className="text-sm">Modo Escuro</span>
            <Switch checked={theme === "dark"} onCheckedChange={toggle} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">CLI</CardTitle>
          <CardDescription>Configurações futuras do VTEX CLI (Electron)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Path do VTEX CLI</label>
            <Input placeholder="/usr/local/bin/vtex" disabled />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Timeout (segundos)</label>
            <Input type="number" placeholder="30" disabled />
          </div>
          <p className="text-xs text-muted-foreground">Essas opções estarão disponíveis na versão Electron.</p>
        </CardContent>
      </Card>
    </div>
  );
}
