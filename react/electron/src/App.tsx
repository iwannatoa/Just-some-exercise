import { useCallback, useState } from 'react';
import styles from './App.module.css';
import './App.css';
import ActionSection from './component/ActionSection/ActionSection';
import DestinationSelection from './component/DestinationSelection/DestinationSelection';
import MatchedFolders from './component/MatchedFolders/MatchedFolders';
import Results from './component/Results/Results';
import FileSelection from './component/FileSelection/FileSelection';
import SearchConfiguration from './component/SearchConfiguration/SearchConfiguration';
import MoveConfiguration from './component/MoveConfiguration/MoveConfiguration';
import { MatchedFolder, FileMoveResult, MoveConfig } from './types/file.type';

// Main App Component
const App: React.FC = () => {
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [destination, setDestination] = useState<string>('');
  const [searchPaths, setSearchPaths] = useState<string[]>([]);
  const [matchThreshold, setMatchThreshold] = useState<number>(0.3);
  const [matchedFolders, setMatchedFolders] = useState<MatchedFolder[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [selectedTargetFolder, setSelectedTargetFolder] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [results, setResults] = useState<FileMoveResult[]>([]);

  const [moveConfig, setMoveConfig] = useState<MoveConfig>({
    organizeBy: 'none',
    conflictResolution: 'rename',
    deleteOriginal: false,
    preserveStructure: false,
  });

  // File selection handler
  const handleSelectFiles = useCallback(async () => {
    try {
      const files = await window.electronAPI.selectFiles();
      setSelectedFiles(files);
    } catch (error) {
      console.error('Error selecting files:', error);
    }
  }, []);

  const handleSelectFolders = useCallback(async () => {
    try {
      const files = await window.electronAPI.selectFolders();
      setSelectedFiles(files);
    } catch (error) {
      console.error('Error selecting folders:', error);
    }
  }, []);

  // Manual destination selection
  const handleSelectDestination = useCallback(async () => {
    try {
      const folder = await window.electronAPI.selectFolder();
      if (folder) {
        setDestination(folder);
        setSelectedTargetFolder('');
      }
    } catch (error) {
      console.error('Error selecting destination:', error);
    }
  }, []);

  // Search path management
  const handleAddSearchPath = useCallback(async () => {
    try {
      const folder = await window.electronAPI.selectFolder();
      if (folder && !searchPaths.includes(folder)) {
        setSearchPaths((prev) => [...prev, folder]);
      }
    } catch (error) {
      console.error('Error adding search path:', error);
    }
  }, [searchPaths]);

  const handleRemoveSearchPath = useCallback((pathToRemove: string) => {
    setSearchPaths((prev) => prev.filter((path) => path !== pathToRemove));
  }, []);

  // Folder search
  const handleSearchFolders = useCallback(async () => {
    if (selectedFiles.length === 0 || searchPaths.length === 0) {
      alert('Please select files and search paths first');
      return;
    }

    setIsSearching(true);
    setMatchedFolders([]);
    setSelectedTargetFolder('');

    try {
      console.log(selectedFiles);
      const searchResults = await window.electronAPI.searchTargetFolders({
        sourceFiles: selectedFiles,
        searchPaths: searchPaths,
        matchThreshold: matchThreshold,
      });

      const allFolders = searchResults.flatMap((result) =>
        result.folders.map((folder) => ({
          ...folder,
          searchPath: result.path,
        }))
      );

      setMatchedFolders(allFolders);

      if (allFolders.length === 0) {
        alert(
          'No matching folders found. Please adjust search paths or match threshold.'
        );
      }
    } catch (error: any) {
      console.error('Error searching folders:', error);
      alert('Search failed: ' + error.message);
    } finally {
      setIsSearching(false);
    }
  }, [selectedFiles, searchPaths, matchThreshold]);

  // Folder selection
  const handleSelectFolder = useCallback((folderPath: string) => {
    setSelectedTargetFolder(folderPath);
  }, []);

  const handleUseMatchedFolder = useCallback((folderPath: string) => {
    setSelectedTargetFolder(folderPath);
    setDestination(folderPath);
  }, []);

  // Network share connection
  const handleNetworkShareConnect = useCallback(async () => {
    const sharePath = prompt(
      'Enter network share path (e.g., \\\\server\\share):'
    );
    if (sharePath) {
      try {
        const result = await window.electronAPI.connectNetworkShare({
          path: sharePath,
        });
        alert(result.message);
      } catch (error: any) {
        alert('Connection failed: ' + error.message);
      }
    }
  }, []);

  // Move configuration
  const handleConfigChange = useCallback(
    (key: keyof MoveConfig, value: string | boolean) => {
      setMoveConfig((prev) => ({
        ...prev,
        [key]: value,
      }));
    },
    []
  );

  // File movement
  const handleMoveFiles = useCallback(async () => {
    if (selectedFiles.length === 0 || !destination) {
      alert('Please select files and target folder');
      return;
    }

    setIsProcessing(true);
    setResults([]);

    try {
      const moveResults = await window.electronAPI.moveFiles({
        files: selectedFiles,
        destination,
        moveConfig,
      });

      setResults(moveResults);

      const successCount = moveResults.filter((r) => r.success).length;
      const errorCount = moveResults.filter((r) => !r.success).length;

      alert(
        `Operation completed! Success: ${successCount}, Failed: ${errorCount}`
      );
    } catch (error: any) {
      console.error('Error moving files:', error);
      alert('Operation failed: ' + error.message);
    } finally {
      setIsProcessing(false);
    }
  }, [selectedFiles, destination, moveConfig]);

  const canMove = selectedFiles.length > 0 && destination.length > 0;
  const isDisabled = isProcessing || isSearching;

  return (
    <div className={styles.app}>
      <div className={styles.appContent}>
        <FileSelection
          selectedFiles={selectedFiles}
          onSelectFiles={handleSelectFiles}
          onSelectFolders={handleSelectFolders}
          isDisabled={isDisabled}
        />

        <SearchConfiguration
          searchPaths={searchPaths}
          matchThreshold={matchThreshold}
          onAddSearchPath={handleAddSearchPath}
          onRemoveSearchPath={handleRemoveSearchPath}
          onSearchFolders={handleSearchFolders}
          onThresholdChange={setMatchThreshold}
          isSearching={isSearching}
          isDisabled={isDisabled}
        />

        <MatchedFolders
          matchedFolders={matchedFolders}
          selectedTargetFolder={selectedTargetFolder}
          onSelectFolder={handleSelectFolder}
        />

        <DestinationSelection
          destination={destination}
          selectedTargetFolder={selectedTargetFolder}
          onSelectDestination={handleSelectDestination}
          onConnectNetworkShare={handleNetworkShareConnect}
          onUseMatchedFolder={handleUseMatchedFolder}
          isDisabled={isDisabled}
        />

        <MoveConfiguration
          moveConfig={moveConfig}
          onConfigChange={handleConfigChange}
          isDisabled={isDisabled}
        />

        <ActionSection
          onMoveFiles={handleMoveFiles}
          isProcessing={isProcessing}
          canMove={canMove}
        />

        <Results results={results} />
      </div>
    </div>
  );
};

export default App;
