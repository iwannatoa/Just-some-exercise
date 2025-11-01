import React from 'react';
import styles from './ActionSection.module.css';

interface ActionSectionProps {
  onMoveFiles: () => void;
  isProcessing: boolean;
  canMove: boolean;
}

const ActionSection: React.FC<ActionSectionProps> = ({
  onMoveFiles,
  isProcessing,
  canMove,
}) => {
  return (
    <section className={styles.section}>
      <button
        className={styles.moveBtn}
        onClick={onMoveFiles}
        disabled={isProcessing || !canMove}
      >
        {isProcessing ? (
          <>
            <span className={styles.processingSpinner}></span>
            Moving Files...
          </>
        ) : (
          'Start File Move'
        )}
      </button>
      {!canMove && (
        <div className={styles.helpText}>
          Please select files and a target folder to enable file moving.
        </div>
      )}
    </section>
  );
};

export default ActionSection;
