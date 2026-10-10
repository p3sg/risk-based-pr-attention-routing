# P3 reference dashboard architecture

This describes the implemented P3 application, not an adopter prerequisite.

`pr-attention-router` is the distributed classification-only npm product. It has
no React, OIDC, GitHub credential or Netlify dependency. The workflow is a separate
reference integration. `par-api` and `par-dashboard` are private npm workspaces.
The repository uses npm workspaces without a task-orchestration framework.

## Two independent paths

1. A PR verification workflow completes. The trusted default-branch workflow
   reads the PR diff, rules, rubric and explicit engineering documents. Code sets
   the floor, AI may raise it, and code finalizes the tier. A trusted job uploads
   `classification.json` and updates the PR comment. Only first classification
   and changed tiers notify. All tiers require human review.
2. An authenticated browser requests the private API. The API performs GETs to
   allowlisted GitHub repositories and returns PRs and validated publications.
   There is no model client, AI key, workflow dispatch or classification route.

The interface retains tier cards, a review queue and a selected PR's evidence.
Only current verified results contribute to tier counts. Stale, legacy, missing,
expired and unverified results are explicitly identified. Absent AI dimensions
are **Not recorded**, not reconstructed. GitHub check summaries describe reported
checks, not satisfaction of every branch-protection requirement.

## State and portability

GitHub owns PR state and published results. There is no database or fake backend.
The API uses Web Request/Response; Node HTTP and Netlify Functions are thin
adapters. OIDC discovery and standard validation isolate hosting and identity
providers from the application. One-hour encrypted session cookies are validated
on the server on every API request; Google tokens are discarded after login.

Reads are bounded: ten configured repositories, twenty recent open PRs per
request, three hundred comments per PR, two MB JSON responses, 128 KB artifact
archives, 48 KB publication records and a 22-second GitHub request budget.
Pagination beyond these bounds is displayed as partial/unavailable. Artifact
retention is ninety days; expiry removes verifiability, not human authority.

Advanced same-SHA AI reuse and durable delivery retries are separate follow-up
work. Refreshing this dashboard never invokes AI, including when evidence is
missing. Automatic reclassification is not a recovery mechanism for the reader.
