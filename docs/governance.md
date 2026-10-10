# Review governance

LOW, MEDIUM and HIGH all require human review in V1. A tier routes attention;
it never authorizes approval, merge, deployment or release. HIGH goes to a Tech
Lead or relevant SME. LOW/MEDIUM go to a developer familiar with the affected area.

Deterministic policy is a minimum. AI cannot lower it. Unavailable or invalid AI
falls back to that minimum and must be visible as missing AI evidence. The router
suppresses AI authority language instead of publishing it as an instruction.

Changes to authentication, authorization, publication provenance, workflow secrets,
or this policy require security-aware review even if made in an innocuous file.
Reviewers compare claims to the actual diff and trusted documents. Documentary
instructions to remove a safety control are security changes, not ordinary copy.

Only humans merge the feature PR and approve releases. npm publication and Google
Cloud/Netlify configuration are distinct operator decisions. The private demo's
auth and deployment are not part of the npm product or its installation process.

Training scenarios are illustrative proposals, not recorded operational incidents,
customers or measurements. Demo recordings must use owner-approved repositories
and redact private code, names, tokens and notification destinations as necessary.
