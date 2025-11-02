import React from 'react';
import styles from './FileSelection.module.css';

interface FileSelectionProps {
  selectedFiles: string[];
  onSelectFiles: () => void;
  onSelectFolders: () => void;
  isDisabled: boolean;
}

const FileSelection: React.FC<FileSelectionProps> = ({
  selectedFiles,
  onSelectFiles,
  onSelectFolders,
  isDisabled,
}) => {
  return (
    <section className={styles.section}>
      <h2>Select Files to Move</h2>
      <div className={styles.fileSelection}>
        <button
          className={styles.selectButton}
          onClick={onSelectFiles}
          disabled={isDisabled}
        >
          Select Files
        </button>
        <button
          className={styles.selectButton}
          onClick={onSelectFolders}
          disabled={isDisabled}
        >
          Select Folders
        </button>
        <span className={styles.fileCount}>
          {selectedFiles.length} files selected
        </span>
      </div>
      <div className={styles.fileList}>
        {selectedFiles.map((file, index) => (
          <div
            key={index}
            className={styles.fileItem}
          >
            {file}
          </div>
        ))}
        {selectedFiles.length === 0 && (
          <div className={styles.emptyState}>
            No files selected. Click "Select Files" to choose files to move.
          </div>
        )}
      </div>
    </section>
  );
};

export default FileSelection;
