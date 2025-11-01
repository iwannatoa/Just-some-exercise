import React from 'react';
import styles from './SearchConfiguration.module.css';

interface SearchConfigurationProps {
  searchPaths: string[];
  matchThreshold: number;
  onAddSearchPath: () => void;
  onRemoveSearchPath: (path: string) => void;
  onSearchFolders: () => void;
  onThresholdChange: (threshold: number) => void;
  isSearching: boolean;
  isDisabled: boolean;
}

const SearchConfiguration: React.FC<SearchConfigurationProps> = ({
  searchPaths,
  matchThreshold,
  onAddSearchPath,
  onRemoveSearchPath,
  onSearchFolders,
  onThresholdChange,
  isSearching,
  isDisabled,
}) => {
  return (
    <section className={styles.section}>
      <h2>Auto Search Target Folders</h2>
      <div className={styles.searchConfig}>
        <div className={styles.searchPaths}>
          <h4>Search Paths:</h4>
          <button
            className={styles.addPathButton}
            onClick={onAddSearchPath}
            disabled={isSearching || isDisabled}
          >
            Add Search Path
          </button>
          <div className={styles.pathList}>
            {searchPaths.map((path, index) => (
              <div
                key={index}
                className={styles.pathItem}
              >
                <span className={styles.pathText}>{path}</span>
                <button
                  className={styles.removeBtn}
                  onClick={() => onRemoveSearchPath(path)}
                  disabled={isSearching}
                >
                  Remove
                </button>
              </div>
            ))}
            {searchPaths.length === 0 && (
              <div className={styles.emptyState}>
                No search paths added. Click "Add Search Path" to add folders to
                search.
              </div>
            )}
          </div>
        </div>

        <div className={styles.matchConfig}>
          <label>
            Match Threshold:
            <input
              type='range'
              min='0'
              max='1'
              step='0.1'
              value={matchThreshold}
              onChange={(e) => onThresholdChange(parseFloat(e.target.value))}
              disabled={isSearching}
              className={styles.thresholdSlider}
            />
            <span className={styles.thresholdValue}>
              {(matchThreshold * 100).toFixed(0)}%
            </span>
          </label>
          <small>Higher threshold means stricter matching requirements</small>
        </div>

        <button
          className={styles.searchBtn}
          onClick={onSearchFolders}
          disabled={isSearching || isDisabled || searchPaths.length === 0}
        >
          {isSearching ? (
            <>
              <span className={styles.spinner}></span>
              Searching...
            </>
          ) : (
            'Search Matching Folders'
          )}
        </button>
      </div>
    </section>
  );
};

export default SearchConfiguration;
