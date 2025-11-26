import React from 'react';
import styles from './Results.module.css';

interface ResultsProps {
  results: Array<{
    file: string;
    destination?: string;
    success: boolean;
    error?: string;
  }>;
}

const Results: React.FC<ResultsProps> = ({ results }) => {
  if (results.length === 0) return null;

  const successCount = results.filter((r) => r.success).length;
  const errorCount = results.filter((r) => !r.success).length;

  return (
    <section className={styles.section}>
      <h2>Operation Results</h2>
      <div className={styles.resultsSummary}>
        Success: {successCount} | Failed: {errorCount}
      </div>
      <div className={styles.results}>
        {results.map((result, index) => (
          <div
            key={index}
            className={`${styles.resultItem} ${
              result.success ? styles.success : styles.error
            }`}
          >
            <div className={styles.fileName}>
              {window.electronAPI.path.basename(result.file)}
            </div>
            <div className={styles.resultStatus}>
              {result.success ? '✓ Success' : '✗ Failed'}
              {result.destination &&
                ` → ${window.electronAPI.path.basename(result.destination)}`}
              {result.error && ` - ${result.error}`}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Results;
