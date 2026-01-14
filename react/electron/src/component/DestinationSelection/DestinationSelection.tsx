import React from 'react';
import styles from './DestinationSelection.module.css';

interface DestinationSelectionProps {
  destination: string;
  selectedTargetFolder: string;
  onSelectDestination: () => void;
  onConnectNetworkShare: () => void;
  onUseMatchedFolder: (folderPath: string) => void;
  isDisabled: boolean;
}

const DestinationSelection: React.FC<DestinationSelectionProps> = ({
  destination,
  selectedTargetFolder,
  onSelectDestination,
  onConnectNetworkShare,
  onUseMatchedFolder,
  isDisabled,
}) => {
  return (
    <section className={styles.section}>
      <h2>Target Folder</h2>
      <div className={styles.destinationSection}>
        <div className={styles.destinationSelection}>
          <button
            className={styles.manualSelectButton}
            onClick={onSelectDestination}
            disabled={isDisabled}
          >
            Manual Target Selection
          </button>
          <button
            className={styles.networkBtn}
            onClick={onConnectNetworkShare}
            disabled={isDisabled}
          >
            Connect Network Share
          </button>
        </div>

        {destination && (
          <div className={styles.currentDestination}>
            <strong>Current Target:</strong> {destination}
          </div>
        )}

        {!destination && selectedTargetFolder && (
          <div className={styles.currentDestination}>
            <strong>Recommended Target:</strong> {selectedTargetFolder}
            <button
              className={styles.confirmBtn}
              onClick={() => onUseMatchedFolder(selectedTargetFolder)}
            >
              Use This Folder
            </button>
          </div>
        )}

        {!destination && !selectedTargetFolder && (
          <div className={styles.noSelection}>
            No target folder selected. Choose manually or search for matching
            folders.
          </div>
        )}
      </div>
    </section>
  );
};

export default DestinationSelection;
