# Security and performance review — 2026-10-28

This is an initial source review and targeted integration check, not a penetration-test certification. Squirrelscan and Semgrep executables were not available; no scanner score is claimed.

## Changes verified in this pass

- Admin page selects only the fields rendered by the user table. Password hashes and unrelated account fields are no longer serialized into the client component payload.
- Word memory cache has a 256-entry LRU limit and a one-minute TTL instead of retaining every requested word indefinitely.
- Process-local rate limiter has a 5,000-key ceiling. It rejects new keys at capacity rather than evicting active limits, clears expired entries and no longer logs every rejected request.
- Development Prisma base client is reused across module reloads instead of creating an extra client before checking the existing extended instance.
- Deployment builds no longer execute `db push --accept-data-loss`; schema changes must be applied separately through reviewed migrations.
- Dependency patches include Next.js 16.4.3, Auth.js 5.0.0-beta.32, Nodemailer 10.2.1 and updated compatible transitive packages. The production dependency audit initially reported 11 affected packages, including four critical; after updates the full npm audit reported zero known vulnerabilities. This count reflects the registry advisory database at audit time, not absence of application vulnerabilities.
- Room integration checks cover authentication, membership, host-only start, readiness, deadline enforcement, duplicate concurrent answers, hidden answers/scores and Origin rejection. Room state and mutation limits persist in PostgreSQL.

Relevant upstream advisories: [Next.js on Windows](https://github.com/advisories/GHSA-p293-qw3h-jr36), [Auth.js OAuth checks](https://github.com/advisories/GHSA-x445-f3h2-j279).

## Follow-up findings

1. Password recovery needs a dedicated RLS-aware implementation, cryptographically random hashed codes, atomic one-time consumption and a shared account/IP attempt limit. The existing flow uses the ordinary user-context Prisma client before authentication and stores a plaintext six-digit code. Production OTP response disclosure was already removed in the email milestone.
2. Admin role currently has an email override, and JWT role claims can remain stale after a role change. Move authorization to a database-backed server check with explicit bootstrap handling for the owner; test revocation before removing the existing path.
3. General API rate limiting remains process-local and does not provide a global limit across Vercel instances. Room mutation limits already use PostgreSQL. Login and password-reset throttling should use a shared store.
4. Save-to-collection status is fetched separately for each rendered word. Batch these reads and test ownership boundaries before replacing the endpoint.
5. Word-cache invalidation must be unified across all admin/script mutations; the new memory TTL limits retention but does not solve the existing persistent Next cache invalidation gaps.
6. Review transaction-local RLS context for interactive Prisma transactions and remove the shell-based IPv4 fallback in a separate tested change for the Linux environment.

No account credentials, private recipient lists, SMTP delivery logs or environment files are included in this report.
