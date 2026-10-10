import type { ReactElement } from 'react';
import type { PullView } from '../../../par-api/src/types';
import styles from './EvidencePanel.module.css';

export function EvidencePanel({ pullRequest: pr }: { readonly pullRequest: PullView }): ReactElement {
  const { result, status, commentUrl, reason } = pr.classification;
  const analysis = result?.analysis;
  return <aside className={styles.panel} aria-labelledby="evidence-heading">
    <p className={styles.eyebrow}>Why this tier?</p><h2 id="evidence-heading">Evidence for {pr.title}</h2>
    <p><a href={pr.url} target="_blank" rel="noreferrer">Open PR on GitHub</a>{commentUrl && <> · <a href={commentUrl} target="_blank" rel="noreferrer">
      {status === 'unavailable' ? 'Unverified comment' : 'Published comment'}</a></>}</p>
    {status === 'unavailable' && <p>{reason ?? 'No verified classification is available.'}</p>}
    {status === 'stale' && <p role="status">This evidence describes an older commit. Awaiting classification of the current commit.</p>}
    {result && <>
      <p className={styles.summary}>{analysis?.summary ?? (result.aiTextWithheld ? 'AI text withheld because it used authority language.' : 'AI unavailable; using the deterministic floor.')}</p>
      <p>Final tier: <strong>{result.finalTier}</strong> · Floor: <strong>{result.deterministicFloor}</strong></p>
      <p>Classified commit {result.headSha.slice(0, 7)} · {new Date(result.createdAt).toLocaleString()}</p>
      <ul>{result.floorReasons.map((text, index) => <li key={index}>{text}</li>)}</ul>
      {analysis && <ul>{analysis.reasons.map((text, index) => <li key={index}>{text}</li>)}</ul>}
      <dl className={styles.dimensions}>{(['probability', 'impact', 'detectability', 'blastRadius'] as const).map((name) => {
        const dimension = analysis?.dimensions?.[name];
        return <div className={styles.dimension} key={name}><dt>{name === 'blastRadius' ? 'Blast radius' : name[0].toUpperCase() + name.slice(1)}</dt>
          <dd><strong>{dimension?.level ?? 'Not recorded'}</strong>{dimension && <span>{dimension.detail}</span>}</dd></div>;
      })}</dl>
      <section className={styles.reviewFocus}><h3>Review focus</h3>{analysis ? <ul>{analysis.reviewFocus.map((text, index) => <li key={index}>{text}</li>)}</ul> : <p>Review the changed code and deterministic floor reasons.</p>}</section>
      <section className={styles.missingEvidence}><h3>Missing evidence</h3>{analysis?.missingEvidence ?
        (analysis.missingEvidence.length ? <ul>{analysis.missingEvidence.map((text, index) => <li key={index}>{text}</li>)}</ul> : <p>No gaps reported by the classifier.</p>) : <p>Not recorded</p>}</section>
      <p><a href={`https://github.com/${pr.repository}/actions/runs/${result.runId}/attempts/${result.runAttempt}`} target="_blank" rel="noreferrer">Verified publication workflow</a></p>
      <details className={styles.commentPreview}><summary>Published classification record</summary><pre>{JSON.stringify(result, null, 2)}</pre></details>
    </>}
  </aside>;
}
