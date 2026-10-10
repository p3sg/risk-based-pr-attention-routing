import type { ReactElement } from 'react';
import type { PullView } from '../../../par-api/src/types';
import styles from './ReviewQueue.module.css';

export function ReviewQueue({ pullRequests, selectedPullRequestId, onSelect }: {
  readonly pullRequests: readonly PullView[]; readonly selectedPullRequestId: number | null; readonly onSelect: (id: number) => void;
}): ReactElement {
  return <section className={styles.panel} aria-labelledby="review-queue-heading">
    <div className={styles.panelHeading}><div><p className={styles.eyebrow}>GitHub pull requests</p><h2 id="review-queue-heading">Review queue</h2></div><span>{pullRequests.length} shown</span></div>
    {pullRequests.length === 0 && <p>No pull requests match this view.</p>}
    <ul className={styles.list}>{pullRequests.map((pr) => {
      const { status, result } = pr.classification;
      const label = status === 'current' ? result!.finalTier : status === 'stale' ? `Stale · ${result!.finalTier}` : 'Unclassified';
      const routing = status === 'current' && result?.finalTier === 'LOW' ?
        'Merge: Authorized team member' :
        `Reviewer: ${result?.reviewer ?? 'Human review required'}`;
      return <li key={pr.number}><button aria-pressed={selectedPullRequestId === pr.number} className={styles.queueItem} type="button" onClick={() => onSelect(pr.number)}>
        <span className={styles.itemTopLine}><span className={`${styles.tier} ${status === 'current' ? styles[result!.finalTier.toLowerCase()] : ''}`}>{label}</span><span>#{pr.number}{pr.draft ? ' · Draft' : ''}</span></span>
        <strong>{pr.title}</strong><span className={styles.repository}>{pr.repository}</span>
        <span className={styles.chips}><span>{pr.checks}</span><span>{pr.headSha.slice(0, 7)}</span></span>
        <span className={styles.reviewer}>{routing}</span>
      </button></li>;
    })}</ul>
  </section>;
}
