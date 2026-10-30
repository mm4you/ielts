# Three contextual exercise modes

Routes: /collocations, /context-practice, /spelling-hunt. These are solo practice modes. They do not alter SRS schedules or write competitive high scores.

## Question data and review
ExerciseQuestion stores an immutable question ID/version, target wordId, topic, level, content, source/usage rights, and explicit reviewer/date. The selector only serves reviewed, structurally valid questions with source metadata. The UI receives prompts and distractors; accepted answers, the identified spelling-error location and explanations stay on the server until that question has been answered.

AI-authored material starts as draft. fixtures/exercise-questions.ts contains 61 original draft questions. fixtures/local-exercise-review.ts records the separate local content review, including corrections made to distractors and approved alternatives. Its reviewed projection is restricted to local/test fixtures; it is not production editorial approval. CEFR labels in this test bank exercise the filters and require editorial confirmation before publication. Original sentences/translations are supplied; dictionary entries are not copied.

References checked for the relevant variant/collocation rules:
- https://dictionaryblog.cambridge.org/2018/10/17/making-an-effort-and-telling-a-joke-avoiding-common-errors-with-collocations/
- https://dictionary.cambridge.org/us/grammar/british-grammar/collocation-research
- https://dictionary.cambridge.org/dictionary/english/colour
Individual word-reference URLs are retained with each record.

## Grading
Collocations accept explicitly reviewed word/phrase variants, including make/take a decision and do/conduct/carry out research. Options are shuffled once when a session is created.

Context offers basic choice and advanced typing. Case, surrounding/repeated whitespace and curly apostrophes are normalized. Explicitly reviewed alternatives are accepted. An advanced answer outside both the approved and rejected sets is marked review, not wrong: no point or wrong count is added, and the answer is retained for later editorial review. This avoids pretending to decide every possible English completion with a finite answer key. It is not automatic semantic grading.

Spelling questions identify one whole misspelled word; the learner selects it and types the correction. The validator rejects legitimate regional-spelling pairs, known grammar/homophone substitutions, multiword corrections and repeated occurrences of the identified error. The original and corrected spellings are compared after submission. Other spelling/grammar quality is a content-review responsibility; the runtime does not randomly corrupt production sentences.

## Persistence and exact retry
ExerciseSession stores server-only question snapshots and incrementally saved answers. Per-user transactions serialize duplicate/retried submissions. A request ID cannot answer another question; changing a recorded answer returns conflict. Only the next unanswered question can be submitted. A session is complete only after all selected questions are saved.

ExerciseMistake retains the question ID, target wordId, mode, cumulative wrong count and resolution date. A later correct answer resolves the entry without deleting history. Retry uses exactly the failed IDs from the authenticated user's saved session, including their order; correct questions and other users' sessions cannot be substituted.

A new round requests 10 or 20 questions. If the chosen collection/topic/level lacks enough reviewed items, the API reports the available count and does not fill from another source. An exact retry can contain fewer than 10 questions.

## Database rollout
Apply prisma/study-upgrade.sql first, then prisma/exercises-upgrade.sql, only on a separately authorized database after backup/testing. Grant the configured application role access to the new tables; the migrations add owner RLS for sessions/mistakes and reviewed/admin policies for questions. No production import or migration is run by these tools. New versions use new question IDs; old session snapshots remain intact.

Before publication, map each reviewed question to an actual wordId in the destination, confirm level/topic and usage rights, and obtain editorial approval. The local fixture IDs 500001–500021 are reserved test bindings, not IDs asserted to exist in the user's database.
