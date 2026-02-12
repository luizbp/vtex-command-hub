import { useCallback } from "react";
import { CONFIG_APP_KEY } from "../lib/constants";

export type Settings = {
  theme: "light" | "dark";
  accounts: string[];
  apps: string[];
};

export function useSettings() {
  // Busca as configurações
  const getSettings = useCallback((): Settings => {
    const settings = localStorage.getItem(CONFIG_APP_KEY);
    const parsedSettings = settings ? JSON.parse(settings) : null;
    return {
      theme: parsedSettings ? parsedSettings.theme : "dark",
      accounts: parsedSettings ? parsedSettings.accounts : [],
      apps: parsedSettings ? parsedSettings.apps : [],
    };
  }, []);

  // Salva as configurações
  const saveSettings = useCallback((settings: Settings) => {
    localStorage.setItem(CONFIG_APP_KEY, JSON.stringify(settings));
  }, []);

  return {
    getSettings,
    saveSettings,
  };
}
