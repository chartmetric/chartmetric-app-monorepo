---
name: comment-discipline
description: MUST USE whenever writing, editing, refactoring, or reviewing any code in this repository, and when asked to clean up AI-generated comment noise. Enforces the repo's no-unnecessary-comments policy - self-documenting code over narration, no change-log or process comments, no JSDoc that restates a signature.
---

# Comment Discipline

Code in this repository is self-documenting. Comments are a last resort, not a habit.

## Default: write no comment

Before writing any comment, try to make it unnecessary:

1. Rename the variable, function, or type so the intent is obvious.
2. Extract a well-named function instead of a section header comment.
3. Use types and schemas to encode constraints instead of describing them.

If one of those works, do that and write nothing.

## Banned comment types

Never write these. Remove them when editing code that has them:

- **Narration** — restating what the next line does.
  ```ts
  // fetch the artist from the database
  const artist = await queries.getArtistById(id);
  ```
- **Process/change-log** — talking to the reviewer or describing the edit.
  ```ts
  // updated to use the new schema
  // moved from routes.ts
  // this fixes the bug where ...
  ```
- **Signature-restating JSDoc** — docblocks that repeat parameter names and types already in the signature.
- **Section headers** — `// ---- helpers ----`, `// Validation` above obvious code.
- **Commented-out code** — delete it; git history keeps it.
- **Obvious TODO noise** — `// TODO: add error handling` with no ticket or concrete plan.

## Allowed comment types

Write these sparingly, and only when the code genuinely cannot express it:

- **Non-obvious constraints**: external system quirks, ordering requirements, race conditions.
  ```ts
  // ClickHouse String columns use '' as "no value"; normalize here, never in the query
  ```
- **Why, not what**: the reason a surprising approach was chosen over the obvious one.
- **Math/domain formulas**: a formula's source or derivation.
- **Legal/regulatory requirements**.

## Review check

Before finishing any change, reread the diff and delete every comment that fails this test: "Would a competent teammate, reading only the final code, lose real information if this comment were deleted?" If the answer is no, delete it.

When asked to clean up existing files, apply the banned list above; do not delete comments from the allowed list.
