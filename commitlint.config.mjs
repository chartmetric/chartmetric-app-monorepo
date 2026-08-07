// The conventional preset's types, plus `phase` for the harness runner's
// auto-commit stage (commit_message_format in harness.config.json).
// Listed explicitly rather than spread from the preset: its rule shape is
// not a stable API, and a break here rejects every commit in the repo.
const types = [
  "build",
  "chore",
  "ci",
  "docs",
  "feat",
  "fix",
  "perf",
  "phase",
  "refactor",
  "revert",
  "style",
  "test",
];

export default {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "type-enum": [2, "always", types],
  },
};
