import React from 'react';
import styles from './MatchedFolders.module.css';

interface MatchedFoldersProps {
  matchedFolders: Array<{
    name: string;
    path: string;
    matchScore: number;
    fileCount: number;
    searchPath: string;
  }>;
  selectedTargetFolder: string;
  onSelectFolder: (folderPath: string) => void;
}

const MatchedFolders: React.FC<MatchedFoldersProps> = ({
  matchedFolders,
  selectedTargetFolder,
  onSelectFolder,
}) => {
  if (matchedFolders.length === 0) return null;

  return (
    <section className={styles.section}>
      <h2>Found Matching Folders</h2>
      <div className={styles.matchResultsHeader}>
        <span>Found {matchedFolders.length} matching folders</span>
        {selectedTargetFolder && (
          <span className={styles.selectedFolder}>
            Selected: {selectedTargetFolder}
          </span>
        )}
      </div>
      <div className={styles.matchedFolders}>
        {matchedFolders.map((folder, index) => (
          <div
            key={index}
            className={`${styles.folderItem} ${
              selectedTargetFolder === folder.path ? styles.selected : ''
            }`}
            onClick={() => onSelectFolder(folder.path)}
          >
            <div className={styles.folderHeader}>
              <h4 className={styles.folderName}>{folder.name}</h4>
              <span className={styles.matchScore}>
                Match: {(folder.matchScore * 100).toFixed(1)}%
              </span>
            </div>
            <div className={styles.folderDetails}>
              <span className={styles.folderPath}>Path: {folder.path}</span>
              <span className={styles.fileCount}>
                Files: {folder.fileCount}
              </span>
              <span className={styles.searchSource}>
                From: {folder.searchPath}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default MatchedFolders;
