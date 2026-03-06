import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, RefreshCw, Rocket, Activity } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSettings } from "@/hooks/use-settings";
import { PastExecutionViewer } from "@/components/PastExecutionViewer";

const shortcuts = [
  {
    title: "Verificador de Versões",
    icon: Search,
    url: "/version-checker",
    desc: "Checar versões de apps em múltiplas contas",
  },
  {
    title: "Atualizador de Contas",
    icon: RefreshCw,
    url: "/account-updater",
    desc: "Rodar vtex update em massa",
  },
  {
    title: "Gerenciador de Release/TM",
    icon: Rocket,
    url: "/release-manager",
    desc: "Montar workspaces com apps",
  },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const { getSettings } = useSettings();
  const { logs = [] } = getSettings();
  const lastLog = logs.length > 0 ? logs[logs.length - 1] : null;

  // Saudação baseada no horário
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Bom dia";
    if (hour < 18) return "Boa tarde";
    return "Boa noite";
  };

  const motivationalQuotes = [
    "A cada novo dia, uma nova chance de recomeçar e confiar no propósito.",
    "A esperança ilumina o caminho mesmo nos momentos de dúvida.",
    "A força para superar vem de acreditar que há sempre um sentido maior.",
    "A gratidão transforma pequenos passos em grandes conquistas.",
    "A perseverança é guiada pela confiança de que tudo tem seu tempo.",
    "A paz interior nasce quando entregamos nossos esforços a Deus.",
    "A humildade abre portas para aprendizados e bênçãos inesperadas.",
    "A alegria está em amar e servir ao próximo.",
    "A serenidade nos ajuda a enfrentar desafios com coragem e esperança.",
    "A luz da esperança nunca se apaga para quem segue com fé e amor.",
  ];
  const randomQuote =
    motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Visão geral do VTEX CLI Manager Teste de versão 0.1.0
        </p>
      </div>

      {/* Saudação e frase motivacional */}
      <div className=" p-6 flex flex-col items-left gap-2">
        <span className="text-xl font-semibold">{getGreeting()}!</span>
        <span className="italic text-muted-foreground">{randomQuote}</span>
      </div>

      {/* Última verificação de versões registrada (se houver) */}
      {lastLog && (
        <div>
          <h2 className="text-lg font-semibold mb-4">
            Última verificação de versões registrada
          </h2>
          <PastExecutionViewer log={lastLog} />
        </div>
      )}

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
