# Private dashboard operations

For initial identity/provider configuration, use [Google setup](../setup/p3-dashboard-google.md).

## Start and verify

Use Node 24; `npm ci --ignore-scripts`, `npm run build --workspace @p3sg/pr-attention-router`,
then `npm run dev`. API listens only on loopback port 3001; Vite port 5173 proxies
`/api`. Put local secrets in ignored `apps/par-api/.env`. No configured secrets
means a setup/unavailable response, never mock data or an authentication bypass.

Verify signed-out API calls return 401, correct-owner login succeeds, other
identities fail, and an unlisted repository returns 403. Check a real private PR,
compare its classified SHA and workflow artifact, refresh and confirm no new
classification workflow starts. Test narrow/mobile layout and keyboard selection.

## Triage

- 401: session expired/invalid; sign in again. Do not lengthen expiry to hide bugs.
- 403 on login: compare configured issuer/subject with a locally verified ID token.
  Do not fall back to email. 403 on a repo: check the application allowlist.
- 503: check server-only variables, provider availability, PAT expiry, selected
  repository permissions and GitHub rate limits. Do not log tokens or API bodies.
- Unverified publication: inspect workflow/run/attempt, publication job, current
  head and artifact retention. Legacy comments are intentionally not trusted.
- Stale: a new commit lacks a current published result. Wait for its normal
  verification/classification workflow; the dashboard cannot classify it.
- Empty: zero open PRs is valid. Truncated: the twenty newest are shown; use GitHub
  for the full queue. Missing dimensions mean the publisher did not record them.

## Incidents and rollback

On secret exposure revoke/rotate the PAT or OAuth secret at its issuer, rotate the
session key to invalidate cookies, and remove exposure from public evidence.
If identity/provenance validation is suspect, disable the API deployment first;
do not serve cached private results. Roll back to a known reviewed commit and
repeat auth/provenance tests. Disabling the reader does not change classifications.
Disabling classification notifications does not grant merge authority.

Netlify's deployment controls remain human-operated. No release, migration,
auto-approval or merge endpoint exists. Keep production credentials out of previews.
