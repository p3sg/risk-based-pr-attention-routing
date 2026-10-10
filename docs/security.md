# Security invariants

## Authentication and secrets

- Authorize exactly one configured, cryptographically validated OIDC issuer and
  subject pair. Email and Workspace domain are not authorization identifiers.
- Use authorization code flow with S256 PKCE, state and nonce; verify ID-token
  signature, issuer, audience and expiry. Credentials and token exchange stay
  server-side. Google Workspace is the initial provider, not a hard-coded policy.
- Production cookies are Secure, HttpOnly, SameSite=Lax, host-only, path `/`.
  Local loopback HTTP is the only Secure-cookie exception. Sessions expire after
  one hour; login transactions after ten minutes. Logout requires same origin.
- Reject absent, duplicated, expired or tampered session cookies before GitHub
  access. Responses containing data are private/no-store. Do not enable CORS.
- Never put a PAT, client secret, session key or model key in `VITE_*`, public
  files, screenshots, logs, PR evidence or source control.
- A fine-grained PAT has read-only access to explicitly selected repositories;
  server configuration further restricts the allowlist. Never accept arbitrary
  GitHub URLs from the browser. Signed artifact downloads never receive the PAT.

## Publication trust

Bot identity alone is insufficient. Match a bounded versioned record to its
repository and PR, then verify the trusted workflow ID/path, workflow_run event,
default branch, policy SHA, run attempt, repository identity and successful
publication job. Verify GitHub's artifact SHA-256 digest and exact record equality.
The classified head SHA must match the PR to be current. No evidence is safer
than accepting an unverifiable tier. A default-branch administrator is a trust
root and can change policy; this mechanism does not protect against that owner.

## Workflow and authority

Only trusted default-branch code handles credentials and publication. PR source
is inspected, never executed by classification jobs. Policy documents are loaded
from the trusted checkout, not from the PR. Proposed document edits are evidence.
Preserve existing author, repository and validated-head checks and isolated
notification secrets. Never grant approve, merge, deploy or release permissions.

## Residual risks

Stateless encrypted cookies can be replayed if stolen until expiry. Logout clears
the local cookie, not copies stolen elsewhere; rotating the session key invalidates
all sessions. There is no per-session revocation database. A compromised owner
browser can read authorized data. OAuth consent is not permission to view the app.
Netlify serves the generic public UI shell; every private datum requires the API
session. Protect deployment previews separately by withholding production secrets.
