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
      }) => Promise<
        [
          {
            account: string;
            versions?: string;
            error?: string;
          },
        ]
      >;
      updateAccount: (account: string) => Promise<UpdateLog>;
      manageRelease: (options: {
        account: string;
        workspace: string;
        appsToInstall: string[];
        appsToUninstall: string[];
        forceMaster: boolean;
        stopOnError: boolean;
      }) => Promise<ReleaseAccountStatus>;
    };
  }
}
