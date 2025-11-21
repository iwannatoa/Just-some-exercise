declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
interface ElectronAPI {
  selectFiles: () => Promise<string[]>;
  selectFolders: () => Promise<string[]>;
  selectFolder: () => Promise<string | null>;
  moveFiles: (config: {
    files: string[];
    destination: string;
    moveConfig: MoveConfig;
  }) => Promise<FileMoveResult[]>;
  searchTargetFolders: (config: {
    sourceFiles: string[];
    searchPaths: string[];
    matchThreshold: number;
  }) => Promise<
    Array<{ path: string; folders: MatchedFolder[]; error?: string }>
  >;
  connectNetworkShare: (config: {
    path: string;
    username?: string;
    password?: string;
  }) => Promise<{ success: boolean; message: string }>;
  path: {
    basename: (path: string) => string;
    join: (...paths: string[]) => string;
  };
}

export {};
