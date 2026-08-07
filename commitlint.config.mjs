import conventional from "@commitlint/config-conventional";

// `phase` is emitted by the harness runner's auto-commit stage
// (commit_message_format in harness.config.json); the conventional
// preset would otherwise reject every phase commit.
const types = [...conventional.rules["type-enum"][2], "phase"];

export default {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "type-enum": [2, "always", types],
  },
};
