# Review governance

The V1+ policy routes human attention by tier. An eligible LOW change needs no
separate reviewer and may be merged by any authorized team member after required
checks, repository protections and policy authorization pass. MEDIUM receives
standard developer review. HIGH goes to a Tech Lead or relevant SME.

Classification is evidence, not merge execution. Repository policy determines
whether a LOW result is eligible, and an authorized human performs the merge. The
router never approves, merges, deploys or releases code.

Deterministic policy is a minimum. AI cannot lower it. Unavailable or invalid AI
falls back to that minimum and must be visible as missing AI evidence. The router
suppresses AI authority language instead of publishing it as an instruction.

Changes to authentication, authorization, publication provenance, workflow secrets,
or this policy require security-aware review even if made in an innocuous file.
Reviewers compare claims to the actual diff and trusted documents. Documentary
instructions to remove a safety control are security changes, not ordinary copy.

Only humans merge pull requests and approve releases. npm publication and Google
Cloud/Netlify configuration are distinct operator decisions. The private demo's
auth and deployment are not part of the npm product or its installation process.

Training scenarios are illustrative proposals, not recorded operational incidents,
customers or measurements. Demo recordings must use owner-approved repositories
and redact private code, names, tokens and notification destinations as necessary.
