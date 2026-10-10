import { cleanup, render, screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { App } from '../App';
import type { PullView } from '../../../par-api/src/types';

function pull(number: number, tier: 'LOW' | 'MEDIUM' | 'HIGH', status: 'current' | 'stale' | 'unavailable' = 'current'): PullView {
  return { number, title: `GitHub change ${number}`, repository: 'p3/reference', url: `https://github.com/p3/reference/pull/${number}`,
    headSha: 'a'.repeat(40), draft: false, checks: 'Reported checks complete', classification: { status, commentUrl: null, reason: null,
      result: status === 'unavailable' ? null : { version: 1, repository: 'p3/reference', pullRequest: number, headSha: 'a'.repeat(40),
        baseSha: 'b'.repeat(40), policySha: 'c'.repeat(40), runId: 42, runAttempt: 1, createdAt: '2026-10-10T12:00:00.000Z',
        changedLines: 10, validationPassed: true, deterministicFloor: tier, floorReasons: ['Sensitive shared contract.'],
        finalTier: tier, reviewer: tier === 'HIGH' ? 'Tech Lead or relevant SME' : 'Developer familiar with the affected area',
        aiUsed: true, aiTextWithheld: false, analysis: { summary: `Actual evidence ${number}`, reasons: ['Two callers.'],
          reviewFocus: ['Inspect callers.'], dimensions: null, missingEvidence: null } } } };
}
function network(pulls = [pull(1, 'LOW'), pull(2, 'MEDIUM'), pull(3, 'HIGH')]) {
  const requests: string[] = [];
  vi.stubGlobal('fetch', vi.fn((input: string) => {
    requests.push(input);
    if (input === '/api/session') return Promise.resolve(Response.json({ authenticated: true }));
    if (input === '/api/repositories') return Promise.resolve(Response.json({ repositories: ['p3/reference'] }));
    if (input.startsWith('/api/pulls?')) return Promise.resolve(Response.json({ pulls, truncated: false, fetchedAt: '2026-10-10T12:00:00Z' }));
    throw new Error(`Unexpected request ${input}`);
  }));
  return requests;
}
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
describe('live dashboard', () => {
  it('requires sign-in before retrieving private repositories', async () => {
    const requests: string[] = [];
    vi.stubGlobal('fetch', (input: string) => { requests.push(input); return Promise.resolve(Response.json({}, { status: 401 })); });
    render(<App />);
    expect(await screen.findByRole('link', { name: 'Sign in' })).toHaveAttribute('href', '/api/auth/login');
    expect(requests).toEqual(['/api/session']);
    expect(screen.queryByRole('region', { name: 'Review queue' })).not.toBeInTheDocument();
  });
  it('preserves tier filtering and selected evidence using returned GitHub records', async () => {
    network(); const user = userEvent.setup(); render(<App />);
    const queue = await screen.findByRole('region', { name: 'Review queue' });
    expect(within(queue).getByText('3 shown')).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Show MEDIUM attention pull requests' }));
    expect(within(queue).getByText('1 shown')).toBeVisible();
    expect(screen.getByRole('heading', { name: 'Evidence for GitHub change 2' })).toBeVisible();
    expect(screen.getByText('Actual evidence 2')).toBeVisible();
    expect(screen.getAllByText('Not recorded').length).toBeGreaterThan(0);
    expect(screen.queryByText(/candidate for future agent-only/u)).not.toBeInTheDocument();
  });
  it('keeps stale and unverified PRs visible but excludes them from current tier filtering', async () => {
    network([pull(1, 'HIGH', 'stale'), pull(2, 'LOW', 'unavailable')]); const user = userEvent.setup(); render(<App />);
    await screen.findByRole('region', { name: 'Review queue' });
    expect(screen.getByText('Stale · HIGH')).toBeVisible();
    expect(screen.getByText('Unclassified')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Show HIGH attention pull requests' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Show pull requests needing classification' }));
    expect(screen.getByText('2 shown')).toBeVisible();
    expect(screen.getByText('Stale · HIGH')).toBeVisible();
    expect(screen.getByText('Unclassified')).toBeVisible();
  });
  it('labels a legacy or unverifiable comment without presenting it as published evidence', async () => {
    const unavailable = pull(2, 'LOW', 'unavailable');
    network([{ ...unavailable, classification: { ...unavailable.classification,
      commentUrl: 'https://github.com/p3/reference/pull/2#issuecomment-42' } }]);
    render(<App />);
    expect(await screen.findByRole('link', { name: 'Unverified comment' })).toHaveAttribute(
      'href', 'https://github.com/p3/reference/pull/2#issuecomment-42');
    expect(screen.queryByRole('link', { name: 'Published comment' })).not.toBeInTheDocument();
  });
  it('refreshes through read endpoints only and handles an empty queue', async () => {
    const requests = network([]); const user = userEvent.setup(); render(<App />);
    await screen.findByText('No pull requests match this view.');
    await user.click(screen.getByRole('button', { name: 'Refresh' }));
    await waitFor(() => expect(requests.filter((p) => p.startsWith('/api/pulls?'))).toHaveLength(2));
    expect(requests.every((p) => /^\/api\/(session|repositories|pulls\?)/u.test(p))).toBe(true);
  });
  it('returns to all pull requests when refreshed data invalidates the active filter', async () => {
    let pullRequestCount = 0;
    vi.stubGlobal('fetch', (input: string) => {
      if (input === '/api/session') return Promise.resolve(Response.json({ authenticated: true }));
      if (input === '/api/repositories') return Promise.resolve(Response.json({ repositories: ['p3/reference'] }));
      if (input.startsWith('/api/pulls?')) {
        pullRequestCount += 1;
        const pulls = pullRequestCount === 1 ? [pull(1, 'HIGH')] : [pull(2, 'LOW', 'unavailable')];
        return Promise.resolve(Response.json({ pulls, truncated: false, fetchedAt: '2026-10-10T12:00:00Z' }));
      }
      throw new Error(`Unexpected request ${input}`);
    });
    const user = userEvent.setup(); render(<App />);
    await user.click(await screen.findByRole('button', { name: 'Show HIGH attention pull requests' }));
    await user.click(screen.getByRole('button', { name: 'Refresh' }));
    await screen.findByText('GitHub change 2');
    expect(screen.getByRole('button', { name: 'Show all pull requests' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('1 shown')).toBeVisible();
  });
  it('reports API failures without falling back to synthetic records', async () => {
    vi.stubGlobal('fetch', () => Promise.resolve(Response.json({}, { status: 503 }))); render(<App />);
    expect(await screen.findByRole('alert')).toHaveTextContent('unavailable');
    expect(screen.queryByText('Refine tier card guidance')).not.toBeInTheDocument();
  });
  it('ignores a late response from the previous repository', async () => {
    let resolveOld: ((response: Response) => void) | undefined;
    vi.stubGlobal('fetch', (input: string) => {
      if (input === '/api/session') return Promise.resolve(Response.json({ authenticated: true }));
      if (input === '/api/repositories') return Promise.resolve(Response.json({ repositories: ['p3/reference', 'p3/second'] }));
      if (input.includes('reference')) return new Promise<Response>((resolve) => { resolveOld = resolve; });
      return Promise.resolve(Response.json({ pulls: [{ ...pull(8, 'LOW'), repository: 'p3/second' }], truncated: false, fetchedAt: '2026-10-10T12:00:00Z' }));
    });
    const user = userEvent.setup(); render(<App />);
    await user.selectOptions(await screen.findByLabelText('Repository'), 'p3/second');
    await screen.findByText('GitHub change 8');
    resolveOld?.(Response.json({ pulls: [pull(1, 'HIGH')], truncated: false, fetchedAt: '2026-10-10T12:00:00Z' }));
    await waitFor(() => expect(screen.queryByText('GitHub change 1')).not.toBeInTheDocument());
    expect(screen.getByRole('heading', { name: 'Evidence for GitHub change 8' })).toBeVisible();
  });
  it('clears private data after logout', async () => {
    const requests = network(); const original = globalThis.fetch;
    vi.stubGlobal('fetch', (input: string, options?: RequestInit) => {
      if (input === '/api/auth/logout') { expect(options?.method).toBe('POST'); return Promise.resolve(new Response(null, { status: 204 })); }
      return original(input, options);
    });
    const user = userEvent.setup(); render(<App />);
    await screen.findByText('GitHub change 1');
    await user.click(screen.getByRole('button', { name: 'Sign out' }));
    expect(await screen.findByRole('link', { name: 'Sign in' })).toBeVisible();
    expect(screen.queryByText('GitHub change 1')).not.toBeInTheDocument();
    expect(requests.some((p) => p.startsWith('/api/pulls'))).toBe(true);
  });
});
