# Vocabulary practice implementation — 30 October 2026

## Delivered

- Shared Fluent UI v9 controls/theme, functional SVG icons, subtle study motifs, friendly copy, keyboard answer controls and bounded custom dropdowns. Room capacity uses a number field, increment/decrement and presets rather than a 39-option native menu.
- Server-controlled, idempotent SRS reviews; forgotten cards remain eligible for later review; a single 21-day mastery rule; timezone-based unique daily words and separate practice attempts. Game answers do not advance SRS or mastery.
- Collection/topic/level/due/mistake sources for typing, spelling bee and word rain; server collection permissions, persistent results, exact failed-word replay, immutable deck stages/checkpoints and dashboard continuation.
- Collocations, contextual cloze (choice/typing), spelling hunt; reviewed answer variants, hidden server answer keys, incremental/idempotent saving, exact failed-question replay, saved explanations and resume URLs that survive reload. Unknown advanced completions are retained for review rather than automatically marked wrong.
- Rooms support 2–40 players (default 8), lock capacity changes and start with two ready players. Ordinary polling no longer locks the room row; state-changing expiry rechecks under a lock.
- Read-only content audit, structured review templates, file-only deck/question preparation and draft-only AI improvement proposals. Five topic deck definitions and 61 original exercise questions are available as local/test review fixtures, not published production content.

## Executed checks

| Check | Result |
|---|---|
| `npm run build` (Prisma generation, Next compilation, TypeScript) | Passed |
| `tsc --noEmit` | Passed |
| Study/source/SRS tests | Passed |
| Exercise grading/variants/US–UK/schema/permissions/replay/duplicate tests | Passed |
| Practice-content answer masking and mode-specific alternatives | Passed |
| Typing engine and audio lifecycle tests | Passed |
| Room engine/modes/poll tests | Passed |
| PostgreSQL upgrade from the repository's baseline schema | Passed in a newly created isolated cluster; legacy count 7 retained separately, unique count reset to 0 |
| Real database integration | Passed under a non-superuser, non-RLS-bypass application role: own/public/foreign-private collections, empty/scarce sources, concurrent duplicate answers, exact replay, unchanged SRS, stages of 10/10/1 and persistent checkpoints |
| Room database concurrency | Passed: two users competing for seat 40 admitted exactly one; 40 concurrent member polls; start with two players in a 40-capacity room |
| Authenticated HTTP | Passed using normal credentials login: 401, permissions, sparse source errors, all three 20-question modes, hidden keys, snapshots, duplicate SRS PATCH, validation, dashboard and saved practice history |
| External TTS | HTTP 200 after fixing the Windows temporary-directory path; browser retry no longer displayed the earlier playback error |
| Full-repository ESLint | Still fails: 131 errors / 73 warnings, compared with initial 149 / 75. File/rule comparison found no increasing error group in changed files; new files had no lint errors. Existing failures were not suppressed. |

Actual Chrome interaction covered login/dashboard, room capacity and dropdowns, a complete 10-question collocation round (3 correct, 7 wrong), exact seven-question retry, spelling-error selection/correction with a legitimate `theatre`, advanced `risk` accepted for the `threat` context, spelling-bee failure/results, word-rain masked context/pause/correct/results and exercise reload/resume. Enter/Space/Escape and answer/next focus were exercised. Desktop and a 390×844 viewport, light/dark themes were inspected. Screenshots remain local in ignored `.drafts/`.

## Limits and rollout

No migration/import/AI overwrite was applied to the existing database, and no deployment was performed. Apply `prisma/study-upgrade.sql`, then `prisma/exercises-upgrade.sql`, only as a separately authorized rollout. See `STUDY-DATA.md` and `EXERCISES.md` for review, role grants, stable versions and content publication. The existing database audit found 6,153 words without the new review metadata; reviewed-only modes/decks therefore need an approved content import before they contain production exercises. The UI reports missing/unavailable sources rather than inventing content.

The local review ledger is linguistic test review, not production editorial approval; topic/CEFR labels and usage rights must be confirmed for publication. The advanced cloze fallback does not automatically decide every semantically plausible English answer. Audio still depends on external providers/network/browser playback. The 40-user test is a local concurrency check, not a production capacity benchmark. A physical phone keyboard, real IME composition, reduced-motion browser setting, offline network recovery and every legacy/admin screen were not exhaustively exercised in a real browser; composition/save-failure guards and relevant state logic were checked in code/tests.

## Reproduce isolated QA

On Windows with PostgreSQL 18 binaries installed, `npm run qa:database` creates a **new** loopback-only cluster under ignored `.drafts/`; it does not target `DATABASE_URL` or an existing PostgreSQL service. The fixtures are original local/test content. Generated credentials remain in ignored local files and must not be published.

After `npm run build`, run `npm run qa:app` for the isolated app on `127.0.0.1:3002`, then `npm run test:local-integration` and `npm run test:local-http`. The harness checks its owned-cluster marker/path before using its generated URL. These test commands write only to that newly created QA database. Stop that app and its exact PostgreSQL data-directory process after testing; do not stop existing PostgreSQL services.
