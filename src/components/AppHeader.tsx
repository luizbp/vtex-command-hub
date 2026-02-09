import { SidebarTrigger } from "@/components/ui/sidebar";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/use-theme";

export function AppHeader() {
  const { theme, toggle } = useTheme();

  return (
    <header className="flex h-12 items-center gap-2 border-b border-border px-4 shrink-0">
      <SidebarTrigger />
      <div className="flex-1" />
      <Button variant="ghost" size="icon" onClick={toggle} className="h-8 w-8">
        {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        <span className="sr-only">Toggle theme</span>
      </Button>
    </header>
  );
}
