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
        account: string;
        workspace: string;
      }) => Promise<{ success: boolean; log: string }>;
      uninstallApps: (props: {
        account: string;
        workspace: string;
        appsToUninstall: string[];
        forceInstallation?: boolean;
        forceMaster?: boolean;
      }) => Promise<{ success: boolean; logs: string[] }>;
      installApps: (props: {
        account: string;
        workspace: string;
        appsToInstall: string[];
        forceInstallation?: boolean;
        forceMaster?: boolean;
      }) => Promise<{ success: boolean; logs: string[] }>;
    };
  }
}
