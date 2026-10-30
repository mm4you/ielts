# Production rollout — 30 October 2026

The owner explicitly authorized applying the migrations and adding starter content after the code reached main. No schema reset, user deletion, password/authentication change, existing vocabulary overwrite or SRS recalculation was performed.

## Applied and verified

- A full PostgreSQL custom-format backup was created in ignored `.drafts/production-rollout-2026-10-30T15-01-45-526Z/before.dump`. Its restore catalog was checked. It contains private production data and must remain local/ignored.
- `study-upgrade.sql` and `exercises-upgrade.sql` were applied together in one transaction with an advisory lock and bounded lock/statement timeouts. All 13 new tables have forced RLS. Explicit privileges were granted to the existing `ielts_app` role.
- All 6,153 existing word records were retained. 989 historical interaction counts were archived in `legacyInteractionCount` and retained in `practiceCount`; the new distinct-word counter starts at zero. The SQL does not alter `UserProgress` or user accounts.
- Added 21 separate reviewed word records, bringing the total to 6,174, plus 61 original exercise questions: 20 collocations, 20 contextual completions, 21 spelling hunts. Versioned question IDs begin with `starter-20261030-`. No local fixture word ID was assumed to be a production ID.
- Added five short starter decks: Education 5 words, Environment 3, Technology 4, Health 4, Work 5. Each has an immutable first/final stage. These are starter sets, not full courses. Narrow topic/level filters may have fewer than ten questions and correctly report insufficient content.

The starter plan has SHA-256 `30c791604ea7d5f9ac5f4508cab56d5f19a3b105bbaf8351755cd5467b092637`. Its original bilingual material was checked separately for publication, with working CEFR labels, corrected general meaning for emissions, preserved British/American spellings, and expanded promise collocations. The reviewer is explicitly recorded as Codex; this is not a claim of independent human editorial certification. Dictionary references remain references, not copied definitions/examples. Human editorial refinement can be shipped as a new version.

## Verification

`verify-study-rollout.ts` uses the actual application role in READ ONLY transactions. It confirmed the role is neither superuser nor an RLS bypass role, private sessions/checkpoints are hidden without an identity, all three exercise modes supply 20 questions, model answers grade correctly, all three word practice modes supply 20 words, and every starter stage is playable in typing, spelling bee and word rain. An administrative read verified the archived count of 989. The verification did not create practice sessions, answers or user progress.

The production read exposed a sampling issue in word rain: reviewed rows were filtered after selecting a random subset of the legacy vocabulary. The selector now applies the reviewed-content predicate before counting/sampling, so the small approved bank is reliably available.

TypeScript/build, focused ESLint and study/exercise regression checks passed for the rollout changes. Logged-in production browser checks are recorded separately when a session is available; database verification does not itself prove browser behavior.

## Operational scripts

These are explicit operational commands, never build hooks. They use environment variables without printing their values and check the known production target before writing. Use the Vercel project's production environment or the already configured local connection variables. Do not put credentials on the command line or commit `.env`, backups or `.drafts`.

- `rollout-study.ts`: read-only preflight by default; `--apply` backs up first, then applies missing tables atomically. Partial schema presence aborts. The backup uses Neon's direct endpoint because the pooler does not accept custom startup settings.
- `prepare-production-starter.ts`: creates the bounded, separate publication manifest as a local file; no database connection.
- `publish-study-starter.ts`: validates and prints the manifest hash by default; `--apply` adds the immutable bank in one transaction. Existing versions are checked, never overwritten. Partial or conflicting versions abort.
- `verify-study-rollout.ts`: read-only application-role and archive checks.

The older documents describe the code-delivery boundary before this separately authorized rollout; this document records the subsequent production changes.
