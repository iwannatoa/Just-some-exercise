import React from 'react';
import styles from './MoveConfiguration.module.css';
import { MoveConfig } from '../../types/file.type';

interface MoveConfigurationProps {
  moveConfig: {
    organizeBy: 'none' | 'date' | 'type';
    conflictResolution: 'rename' | 'overwrite' | 'skip';
    deleteOriginal: boolean;
    preserveStructure: boolean;
  };
  onConfigChange: (key: keyof MoveConfig, value: string | boolean) => void;
  isDisabled: boolean;
}

const MoveConfiguration: React.FC<MoveConfigurationProps> = ({
  moveConfig,
  onConfigChange,
  isDisabled,
}) => {
  return (
    <section className={styles.section}>
      <h2>Move Configuration</h2>
      <div className={styles.configGrid}>
        <div className={styles.configItem}>
          <label>Organization:</label>
          <select
            value={moveConfig.organizeBy}
            onChange={(e) => onConfigChange('organizeBy', e.target.value)}
            disabled={isDisabled}
            className={styles.configSelect}
          >
            <option value='none'>No Organization</option>
            <option value='date'>By Date</option>
            <option value='type'>By File Type</option>
          </select>
        </div>

        <div className={styles.configItem}>
          <label>Conflict Resolution:</label>
          <select
            value={moveConfig.conflictResolution}
            onChange={(e) =>
              onConfigChange('conflictResolution', e.target.value)
            }
            disabled={isDisabled}
            className={styles.configSelect}
          >
            <option value='rename'>Rename</option>
            <option value='overwrite'>Overwrite</option>
            <option value='skip'>Skip</option>
          </select>
        </div>

        <div className={styles.configItem}>
          <label className={styles.checkboxLabel}>
            <input
              type='checkbox'
              checked={moveConfig.deleteOriginal}
              onChange={(e) =>
                onConfigChange('deleteOriginal', e.target.checked)
              }
              disabled={isDisabled}
            />
            Delete Original Files After Move
          </label>
        </div>
      </div>
    </section>
  );
};

export default MoveConfiguration;
