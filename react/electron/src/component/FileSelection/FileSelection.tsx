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
  // 修改后的组件部分
  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <h2>Select Files to Move</h2>
        <div className={styles.controls}>
          <button
            onClick={onSelectFiles}
            disabled={isDisabled}
          >
            Select Files
          </button>
          <button
            onClick={onSelectFolders}
            disabled={isDisabled}
          >
            Select Folders
          </button>
          <span className={styles.count}>{selectedFiles.length} files</span>
        </div>
      </div>
      <div className={styles.list}>
        {selectedFiles.map((file, index) => (
          <div
            key={index}
            className={styles.item}
          >
            {file}
          </div>
        ))}
        {selectedFiles.length === 0 && (
          <div className={styles.empty}>No files selected</div>
        )}
      </div>
    </section>
  );
};

export default FileSelection;
