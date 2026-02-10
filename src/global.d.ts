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
    };
  }
}
