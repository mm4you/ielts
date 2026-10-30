# Study data rollout

No migration, seed, AI call, or content overwrite is run automatically. The code requires new study tables before new practice features work. Registration and legacy pages do not require new User columns.

## Content workflow
Run `npx tsx scripts/audit-vocabulary.ts --out audit.json` for a read-only audit, or add `--input words.json` for an offline export. Candidate duplicates are never deleted; inspect part of speech and senses.

Use vocabulary-content-template.json. Authors supply separate senses, translations, IPA, collocations, families, common errors, permitted answer variants, source/usage rights and reviewer/date. Draft is the default. acceptedAnswers covers spelling variants for listening/typing; each sense can separately list approved recallAnswers for meaning recall. Word Rain uses reviewed content and a masked example, rather than treating every dictionary synonym as correct. AI improvements write before/after proposals to .drafts/vocabulary.jsonl. Admin proposals are returned for preview, never applied automatically.

Only content with explicit reviewer/date enters system decks. `npx tsx scripts/prepare-study-decks.ts reviewed-manifest.json plan.json` produces a file-only dry run. Manifest is an array of {topic, version, level, stageSize, contents}. Supported initial topics: Education, Environment, Technology, Health, Work. This does not assert that reviewed decks already exist in the database.

Use `npm run content:fixtures` to generate clearly marked synthetic local/test JSON for five topics and 10/10/1-word stages. It has no database writer and cannot publish synthetic decks. Do not use fixture counts as user statistics.

## Stable versions
Each approved deck version has a new ID and explicit wordIds and positions. Never reshuffle, modify or delete published stage membership. New content creates version N+1; old checkpoints/results remain linked to version N. Continue links use exact stage IDs, including older versions. Cross-version mastery is not inferred. A final short stage is allowed.

## Rollout
Review prisma/study-upgrade.sql against a database backup and existing RLS policies. Apply only after separate authorization and testing on a named test database. This project had no Prisma migration baseline; the SQL is an additive upgrade, not a fresh-database baseline. Generate Prisma Client after applying. Populate reviewed content and immutable deck records in a separately approved transaction based on the dry-run plan. Grant application role access to new tables according to deployment's role policy.

Existing DailyActivity.wordsLearned rows used interaction counts and are not trustworthy as historical distinct-word counts. The upgrade archives old counts separately and resets unique counts; new unique counts come from StudyWordDay. It does not fabricate a historical backfill. Each reviewed/practiced word counts once per selected study day; practiceCount records attempts separately. Mastery uses interval >=21 days, independent of game success. Default study zone is Vietnam; changes affect future day buckets only.

## Assessment context
IELTS evaluates vocabulary range, accuracy and appropriacy in context; CEFR word levels do not guarantee an IELTS band. Reference: https://ielts.org/take-a-test/preparation-resources/writing-test-resources
