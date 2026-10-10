# P3 dashboard: Google Workspace and Netlify setup

This is private P3 infrastructure, not part of adopting `pr-attention-router`.
Administrator actions below are intentionally not automated. No production
credentials or live authentication have been assumed by the test suite.

## Google Cloud / Workspace administrator

1. Select a P3-owned Google Cloud project. Configure its Google Auth Platform
   branding/consent information and audience. Prefer **Internal** within the P3
   Workspace organization; if unavailable, restrict the testing audience and ask
   the Workspace administrator about app-access policy. Audience/domain settings
   are defense in depth, not the application's authorization decision.
2. Create an OAuth client of type **Web application**. Register exact authorized
   redirect URIs (scheme, host, port and path must match):
   - `http://localhost:5173/api/auth/callback` for local dashboard development;
   - `http://localhost:3002/callback` temporarily for local owner identification;
   - `https://YOUR-DASHBOARD-HOST/api/auth/callback` for the stable deployment.
   Do not add wildcard preview URLs. No browser JavaScript OAuth client is used.
3. Store client ID and secret in the server-only environment. Request only
   `openid`; the app needs neither Google APIs nor email/profile authorization.
4. Approve the client under Workspace app-access controls if organization policy
   requires administrator approval. Do not weaken organization-wide controls.

Google protocol details and registration guidance:
[Google OpenID Connect](https://developers.google.com/identity/openid-connect/openid-connect).

## Establish the exact owner identity

Create ignored `apps/par-api/.env` using `.env.example`. Initially set only the
Google issuer, client ID and client secret. With Node 24 and dependencies installed:

```sh
npm run identify-owner --workspace par-api
```

The local helper binds loopback port 3002 for five minutes. Open its URL in your
own browser and select the intended P3 Workspace owner. It uses code flow with
PKCE/state/nonce, validates the signed ID token, and prints only issuer and subject
to the local terminal. Confirm the selected account, then explicitly copy that
pair to `PAR_OIDC_ISSUER` and `PAR_OIDC_SUBJECT`. It creates no app cookie, does not
access GitHub, does not save tokens, and cannot enroll anybody in a deployed app.
Remove the temporary 3002 redirect after setup. Never use an online token decoder,
an email address, `hd` domain claim, or an unverified token as the allowlist.

## Server-only environment

| Variable | Value/purpose |
| --- | --- |
| `PAR_ORIGIN` | Exact stable HTTPS origin; local exception `http://localhost:5173` |
| `PAR_OIDC_ISSUER` | `https://accounts.google.com` |
| `PAR_OIDC_CLIENT_ID` | Registered web OAuth client ID |
| `PAR_OIDC_CLIENT_SECRET` | Registered web OAuth secret |
| `PAR_OIDC_SUBJECT` | Exact subject from validated owner identification |
| `PAR_SESSION_SECRET` | 32 random bytes, hex encoded (64 characters) |
| `PAR_REPOSITORIES` | Comma-separated exact `owner/repo` allowlist, maximum ten |
| `PAR_GITHUB_TOKEN` | Fine-grained, selected-repository, read-only PAT |

Generate a session key locally with `openssl rand -hex 32`; store it directly in
the secret manager/environment, not screenshots or chat. PAT repository permissions:
Metadata read, Pull requests read, Issues read (PR comments), Actions read (runs,
jobs/artifacts), Checks read and Commit statuses read. Select only approved repos;
obtain any required organization PAT approval. No write permission is necessary.
Do not supply `OPENAI_API_KEY` to this application or prefix secrets with `VITE_`.

## Local and initial Netlify deployment

Run `npm ci --ignore-scripts`, `npm run check`, then `npm run dev` at repository
root. Sign in at `http://localhost:5173`; do not mix localhost and 127.0.0.1 in
browser URLs. Use a separate OAuth client/secret for production if desired.

For the initial Netlify release, deploy reviewed source manually with the Netlify
CLI using the checked-in `netlify.toml`; do not connect repository CI/CD yet. The
build command is `npm run build`; publish directory is `apps/par-dashboard/dist`;
functions directory is `apps/par-api/adapters`.
Use Node 24. Set the variables above via Netlify's UI/API, **Functions runtime
scope**, production context only. Set the stable site's HTTPS origin and register
its exact callback. Environment values in netlify.toml are not function secrets;
see [Netlify function environment variables](https://docs.netlify.com/build/functions/environment-variables/).
The adapter uses standard Request/Response with a custom `/api/*` path, as in
[Netlify's Functions API](https://docs.netlify.com/build/functions/api/).

Do not expose production secrets to deploy previews or untrusted branches.
The generic static login shell is public; private GitHub data is never embedded
in the build and is session-protected server-side. There is no Netlify team-login
dependency. Do not deploy or merge automatically as part of classification.

## Live acceptance gate (operator must complete)

- Signed-out `/api/session` and `/api/pulls` return 401 with no private data.
- Correct owner signs in; another Google identity is denied even in the same domain.
- Cookies are Secure/HttpOnly/SameSite=Lax over HTTPS; credentials absent from bundles.
- Unlisted repo is denied; one approved private repo loads real PRs and checks.
- A current publication matches its trusted run/artifact; a forged or expired one
  is unavailable and a prior commit is stale. Legacy comments are not trusted.
- Refresh causes only GET reads, with no classification workflow/AI invocation.
- Logout and expired/tampered cookies block future reads; rotate the key if leaked.

New publication support must first be human-merged to the classifier's default
branch before genuine hosted results can pass the new provenance checks. No
retrospective trust is assigned to existing synthetic or legacy results.
