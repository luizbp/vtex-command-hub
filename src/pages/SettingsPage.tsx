/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useTheme } from "@/hooks/use-theme";
import { TagInput } from "@/components/TagInput";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { FileDown, FileUp, LoaderCircle, Search } from "lucide-react";
import { useSettings } from "@/hooks/use-settings";
import { useToast } from "@/components/ui/use-toast";

export default function SettingsPage() {
  const { theme, toggle } = useTheme();
  const { toast } = useToast();
  const { getSettings, saveSettings } = useSettings();
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState<string[]>([]);
  const [apps, setApps] = useState<string[]>([]);

  const getSettingsLocalStorage = useCallback(() => {
    const settings = getSettings();
    setAccounts(settings.accounts);
    setApps(settings.apps);
    setLoading(false);
  }, [getSettings]);

  const saveSettingsLocalStorage = () => {
    saveSettings({ theme, accounts, apps });
    toast({
      title: "Configurações salvas!",
      description: "Suas configurações foram salvas com sucesso.",
    });
  };

  const importSettings = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json,application/json";
    input.onchange = (event: any) => {
      const file = event.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const json = JSON.parse(e.target?.result as string);
          if (
            typeof json === "object" &&
            ["theme", "accounts", "apps"].every((k) => k in json)
          ) {
            setAccounts(json.accounts);
            setApps(json.apps);
            saveSettings(json);
            toast({
              title: "Configurações importadas!",
              description: "Suas configurações foram importadas com sucesso.",
            });
          } else {
            toast({
              title: "Arquivo inválido",
              description: "O arquivo não possui o formato esperado.",
              variant: "destructive",
            });
          }
        } catch (err) {
          toast({
            title: "Erro ao importar",
            description: "Não foi possível ler o arquivo de configurações.",
            variant: "destructive",
          });
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const exportSettings = () => {
    const settings = getSettings();
    const dataStr = JSON.stringify(settings, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "vtex-cli-settings.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({
      title: "Configurações exportadas!",
      description: "Arquivo JSON gerado com sucesso.",
    });
  };

  useEffect(() => {
    getSettingsLocalStorage();
  }, [getSettingsLocalStorage]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4">
        <LoaderCircle className="animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Configurações</h1>
        <p className="text-muted-foreground mt-1">
          Preferências do VTEX CLI Manager
        </p>
      </div>
      <div className="flex w-100 align-end justify-end gap-2">
        <Button variant="outline" onClick={importSettings}>
          <FileDown />
          Importar Configurações
        </Button>
        <Button variant="secondary" onClick={exportSettings}>
          <FileUp />
          Exportar Configurações
        </Button>
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
          <CardTitle className="text-base">Pré definições</CardTitle>
          <CardDescription>
            Configurações de pré definições de campos para facilitar o
            preenchimento de formulários
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <TagInput
              label="Accounts"
              values={accounts}
              onChange={setAccounts}
              placeholder="Digite uma account e pressione Enter"
            />
          </div>
          <div className="space-y-2">
            <TagInput
              label="Apps"
              values={apps}
              onChange={setApps}
              placeholder="Digite um app e pressione Enter. ex: vtex.app-custom"
            />
          </div>
        </CardContent>
      </Card>
      <div className="flex w-100 align-end justify-end gap-2">
        <Button variant="outline" onClick={saveSettingsLocalStorage}>
          Salvar Configurações
        </Button>
      </div>
    </div>
  );
}
