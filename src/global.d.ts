export {};

declare global {
  interface Window {
    electronAPI?: {
      versionChecker: (props: { account: string; apps: string[] }) => Promise<
        [
          {
            account: string;
            versions?: string;
            error?: string;
          },
        ]
      >;
      updateAccount: (props: { account: string }) => Promise<UpdateLog>;
      switchAccount: (props: {
        account: string;
      }) => Promise<{ success: boolean; log: string }>;
      createWorkspace: (props: {
        workspace: string;
        typeWorkspace: "development" | "production";
        forceMaster?: boolean;
      }) => Promise<{ success: boolean; log: string }>;
      uninstallApps: (props: {
        workspace: string;
        appsToUninstall: string[];
        forceInstallation?: boolean;
        forceMaster?: boolean;
      }) => Promise<{ success: boolean; logs: string[] }>;
      installApps: (props: {
        workspace: string;
        appsToInstall: string[];
        forceInstallation?: boolean;
        forceMaster?: boolean;
      }) => Promise<{ success: boolean; logs: string[] }>;
      checkForUpdates: () => void;
    };
  }
}
