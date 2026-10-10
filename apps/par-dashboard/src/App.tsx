import { useEffect, useState, type ReactElement } from 'react';
import styles from './App.module.css';
import { EvidencePanel } from './components/EvidencePanel';
import { ReviewQueue } from './components/ReviewQueue';
import { TierCard } from './components/TierCard';
import { tierDefinitions, type RiskTier } from './domain/attention';
import type { Queue } from '../../par-api/src/types';
import { ApiError, getJson } from './api';

export function App(): ReactElement {
  const [session, setSession] = useState<'loading' | 'in' | 'out' | 'error'>('loading');
  const [repositories, setRepositories] = useState<string[]>([]);
  const [repository, setRepository] = useState('');
  const [queue, setQueue] = useState<Queue | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const [filter, setFilter] = useState<'ALL' | 'NEEDS_CLASSIFICATION' | RiskTier>('ALL');
  const [selected, setSelected] = useState<number | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    void (async () => {
      try {
        await getJson('/api/session', controller.signal);
        const result = await getJson<{ repositories: string[] }>('/api/repositories', controller.signal);
        if (controller.signal.aborted) return;
        setRepositories(result.repositories); setBusy(true); setRepository(result.repositories[0] ?? ''); setSession('in');
      } catch (cause) {
        if (controller.signal.aborted) return;
        if (cause instanceof ApiError && cause.status === 401) setSession('out');
        else { setError(cause instanceof Error ? cause.message : 'Dashboard unavailable.'); setSession('error'); }
      }
    })();
    return () => controller.abort();
  }, []);
  useEffect(() => {
    if (session !== 'in' || !repository) return;
    const controller = new AbortController();
    void getJson<Queue>(`/api/pulls?repository=${encodeURIComponent(repository)}`, controller.signal)
      .then((result) => {
        if (controller.signal.aborted) return;
        setQueue(result);
        setFilter((current) => {
          if (current === 'ALL') return current;
          const stillAvailable = current === 'NEEDS_CLASSIFICATION' ?
            result.pulls.some((pr) => pr.classification.status !== 'current') :
            result.pulls.some((pr) => pr.classification.status === 'current' && pr.classification.result?.finalTier === current);
          return stillAvailable ? current : 'ALL';
        });
      })
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return;
        if (cause instanceof ApiError && cause.status === 401) { setSession('out'); setQueue(null); }
        else setError(cause instanceof Error ? cause.message : 'Dashboard unavailable.');
      }).finally(() => { if (!controller.signal.aborted) setBusy(false); });
    return () => controller.abort();
  }, [session, repository, refresh]);

  const pulls = queue?.pulls ?? [];
  const needsClassification = pulls.filter((pr) => pr.classification.status !== 'current');
  const filtered = filter === 'ALL' ? pulls : filter === 'NEEDS_CLASSIFICATION' ? needsClassification :
    pulls.filter((pr) => pr.classification.status === 'current' && pr.classification.result?.finalTier === filter);
  const chosen = filtered.find((pr) => pr.number === selected) ?? filtered[0];
  async function logout() {
    try {
      const response = await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' });
      if (!response.ok && response.status !== 401) throw new Error('Sign out failed. Please retry.');
      setSession('out'); setQueue(null); setRepositories([]); setError('');
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Sign out failed.'); }
  }
  return (
    <div className={styles.appShell}>
      <a className={styles.skipLink} href="#main">Skip to main content</a>
      <header className={styles.hero}>
        <div className={styles.heroContent}>
          <p className={styles.productLabel}>P3 demonstration</p>
          <h1>PR Attention Router</h1>
          <p className={styles.tagline}>Route by risk. Act with confidence.</p>
          <p className={styles.intro}>Direct review attention toward the changes with the greatest probability,
            impact, difficulty of detection, and blast radius.</p>
        </div>
        <div className={styles.boundary}><span aria-hidden="true">●</span><div>
          <strong>Human authority. Risk-informed decisions.</strong>
          <p>Eligible LOW-risk changes may be merged by any authorized team member without separate review when policy authorizes and required protections pass. MEDIUM changes receive standard developer review. HIGH changes require Tech Lead or relevant SME review.</p>
          <p>Classification is evidence. Merge authorization is a separate human policy decision.</p>
          <p>LOW removes dedicated review attention; it does not perform the merge.</p>
        </div></div>
      </header>
      <main id="main">
        {session === 'loading' && <p role="status">Checking session…</p>}
        {session === 'out' && <section className={styles.tierSection}><h2>Private P3 dashboard</h2>
          <p>Sign in to view the configured repositories and their review queues.</p><a className={styles.showAllButton} href="/api/auth/login">Sign in</a></section>}
        {error && <p role="alert">{error}</p>}
        {session === 'in' && <>
          <div className={styles.controls}>
            <label htmlFor="repository">Repository</label>
            <select id="repository" value={repository} onChange={(event) => {
              setQueue(null); setError(''); setBusy(true); setRepository(event.target.value); setSelected(null); setFilter('ALL');
            }}>{repositories.map((repo) => <option key={repo}>{repo}</option>)}</select>
            <button className={styles.showAllButton} type="button" disabled={busy || !repository} onClick={() => { setBusy(true); setQueue(null); setError(''); setRefresh((n) => n + 1); }}>Refresh</button>
            <button className={styles.showAllButton} type="button" onClick={() => void logout()}>Sign out</button>
          </div>
          {busy && <p role="status">Loading GitHub pull requests…</p>}
          {queue && <>
            <p className={styles.freshness}>Read from GitHub at {new Date(queue.fetchedAt).toLocaleTimeString()}. Tier counts cover verified classifications for current commits in this view.</p>
            {queue.truncated && <p role="status">Showing the 20 most recently updated open PRs. <a href={`https://github.com/${repository}/pulls`}>View all on GitHub</a>.</p>}
            <section className={styles.tierSection} aria-labelledby="tiers-heading">
              <div className={styles.sectionHeading}><div><p>Intelligent review routing</p><h2 id="tiers-heading">Route by evidence, not instinct</h2></div>
                <div className={styles.filterActions}>
                  {needsClassification.length > 0 && <button aria-label="Show pull requests needing classification" aria-pressed={filter === 'NEEDS_CLASSIFICATION'}
                    className={styles.showAllButton} type="button" onClick={() => { setFilter('NEEDS_CLASSIFICATION'); setSelected(null); }}>
                    Needs classification <span>{needsClassification.length}</span></button>}
                  <button aria-label="Show all pull requests" aria-pressed={filter === 'ALL'} className={styles.showAllButton} type="button"
                    onClick={() => { setFilter('ALL'); setSelected(null); }}>All pull requests <span>{pulls.length}</span></button>
                </div></div>
              <div className={styles.tierGrid}>{tierDefinitions.map((definition) => {
                const count = pulls.filter((pr) => pr.classification.status === 'current' && pr.classification.result?.finalTier === definition.tier).length;
                return <TierCard key={definition.tier} definition={definition} count={count} disabled={count === 0}
                  selected={filter === definition.tier} onSelect={(tier) => { setFilter(tier); setSelected(null); }} />;
              })}</div>
            </section>
            <div className={styles.workspace} aria-live="polite">
              <ReviewQueue pullRequests={filtered} selectedPullRequestId={chosen?.number ?? null} onSelect={setSelected} />
              {chosen && <EvidencePanel pullRequest={chosen} />}
            </div>
          </>}
        </>}
        <section className={styles.policy} aria-labelledby="policy-heading"><div><p className={styles.policyLabel}>Routing policy</p><h2 id="policy-heading">A floor, never a shortcut</h2></div>
          <div className={styles.policyRule}><span>01</span><p>Deterministic repository signals establish the minimum attention tier.</p></div>
          <div className={styles.policyRule}><span>02</span><p>AI judgment may raise the tier when context warrants it.</p></div>
          <div className={styles.policyRule}><span>03</span><p>AI can never lower the deterministic minimum.</p></div>
        </section>
      </main>
    </div>
  );
}
