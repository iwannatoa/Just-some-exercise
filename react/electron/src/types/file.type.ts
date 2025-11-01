// Types
interface FileMoveResult {
  file: string;
  destination?: string;
  success: boolean;
  error?: string;
}

interface MoveConfig {
  organizeBy: 'none' | 'date' | 'type';
  conflictResolution: 'rename' | 'overwrite' | 'skip';
  deleteOriginal: boolean;
  preserveStructure: boolean;
}

interface MatchedFolder {
  name: string;
  path: string;
  matchScore: number;
  fileCount: number;
  searchPath: string;
}

interface ElectronAPI {
  selectFiles: () => Promise<string[]>;
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
