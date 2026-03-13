import { VersionResult } from "@/utils/cliService";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface AppVersions {
  app: string;
  accountVersions: Record<string, string>;
}

export function transformVersions(data: VersionResult[]): AppVersions[] {
  // 1. Criamos um mapa para agrupar as versões por app
  const appMap: Record<string, Record<string, string>> = {};

  // 2. Populamos o mapa iterando sobre cada conta
  data.forEach(({ account, versions, error }) => {
    if (error) return;

    Object.entries(versions).forEach(([appName, version]) => {
      if (!appMap[appName]) {
        appMap[appName] = {};
      }
      appMap[appName][account] = version;
    });
  });

  // 3. (Opcional) Garantir que contas que não possuem o app recebam "Não instalado"
  const allAccounts = data.map((d) => d.account);

  return Object.entries(appMap).map(([appName, accountVersions]) => {
    const completeAccountVersions: Record<string, string> = {};

    allAccounts.forEach((acc) => {
      completeAccountVersions[acc] = accountVersions[acc] || "Não instalado";
    });

    return {
      app: appName,
      accountVersions: completeAccountVersions,
    };
  });
}

export const checkFormatAppName = (appName: string[], checkVersion = false) => {
  const versionPattern = /^[a-z0-9]+\.[a-z0-9-_]+@[0-9]+\.[0-9]+\.[0-9]+$/;
  const vendorAppPattern = /^[a-z0-9]+(\.[a-z0-9-_]+)+$/;

  const isValid = appName.every((v) =>
    checkVersion ? versionPattern.test(v) : vendorAppPattern.test(v),
  );
  return isValid;
};
