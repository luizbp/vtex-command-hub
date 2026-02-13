export {};

declare global {
  interface Window {
    electronAPI?: {
      versionChecker: ({
        account,
        apps,
      }: {
        account: string;
        apps: string[];
      }) => Promise<string>;
      updateAccount: (account: string) => Promise<UpdateLog>;
      manageRelease: (options: {
        account: string;
        workspace: string;
        appsToInstall: string[];
        appsToUninstall: string[];
        forceMaster: boolean;
        stopOnError: boolean;
        resetWorkspace: boolean;
      }) => Promise<ReleaseAccountStatus>;
    };
  }
}
