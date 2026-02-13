/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback } from "react";
import { CONFIG_APP_KEY } from "../lib/constants";

export type VersionCheckerLog = {
  date: string; // ISO string
  data: any; // Pode ser tipado melhor se necessário
};

export type Settings = {
  theme: "light" | "dark";
  accounts: string[];
  apps: string[];
  logs?: VersionCheckerLog[];
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
      logs: parsedSettings && parsedSettings.logs ? parsedSettings.logs : [],
    };
  }, []);

  // Salva as configurações
  const saveSettings = useCallback((settings: Settings) => {
    localStorage.setItem(CONFIG_APP_KEY, JSON.stringify(settings));
  }, []);

  // Adiciona um novo log
  const addLog = useCallback(
    (log: VersionCheckerLog) => {
      const settings = getSettings();
      const logs = settings.logs ? [...settings.logs, log] : [log];
      saveSettings({ ...settings, logs });
    },
    [getSettings, saveSettings],
  );

  // Remove um log pelo date
  const deleteLog = useCallback(
    (date: string) => {
      const settings = getSettings();
      const logs = settings.logs
        ? settings.logs.filter((log) => log.date !== date)
        : [];
      saveSettings({ ...settings, logs });
    },
    [getSettings, saveSettings],
  );

  return {
    getSettings,
    saveSettings,
    addLog,
    deleteLog,
  };
}
