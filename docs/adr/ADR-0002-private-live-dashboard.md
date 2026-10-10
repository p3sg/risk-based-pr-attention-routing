---
status: accepted
date: 2026-10-10
---

# ADR-0002: A private live reader, independent of classification

## Decision

Maintain the generic npm router, separate GitHub Actions reference integration,
and private P3 React/API workspaces. Use npm workspaces, no Turbo or database.
Connect the dashboard to real owner-allowlisted GitHub repositories using a
server-only read-only PAT. Preserve the queue/evidence UX.

Use portable OIDC code flow, PKCE/state/nonce and encrypted short-lived cookies.
Initially configure Google Workspace. Authorize one exact issuer+subject, never
email/domain. No multi-tenancy, identity database, GitHub App, or Netlify team auth.

The workflow publishes machine-readable evidence and a GitHub artifact. Validate
workflow/run/job/artifact provenance, not merely github-actions bot attribution.
Dashboard reads are independent of classification and never incur AI costs.

## Consequences and rejected alternatives

Artifact expiry means old results become unavailable; the UI states this honestly.
GitHub admins/default-branch maintainers remain trusted. No signing service or
extra signing secret is necessary. A database, fake JSON server and SaaS tenancy
add no value for this single-owner demonstration and are rejected. Hosting adapters
may vary without changing application authentication. Stateless sessions trade
individual revocation for no identity storage and one-hour expiry/key rotation.

## Relationship to ADR-0001

The owner approved read-only dashboard access to explicitly configured real
repositories. This expands **reading**, not installation of classifier workflows,
test PR creation or writes in new repositories. ADR-0001's isolation restrictions
for experiments/workflow installations still apply, particularly the real
one-seo/one-market repositories. Human review and classification-only authority
are unchanged. See [security](../security.md) and [architecture](../architecture.md).
