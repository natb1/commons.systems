#!/usr/bin/env bash
set -uo pipefail

# Tests for lint-vendored-skills.sh. Each case builds a throwaway git repo plus a
# fake CLAUDE_CONFIG_DIR skill root, so the drift and shadow checks are exercised
# for real rather than mocked.

SCRIPTS="$(cd "$(dirname "$0")" && pwd)"
LINTER="$SCRIPTS/lint-vendored-skills.sh"

# shellcheck source=test-helpers.sh
source "$SCRIPTS/test-helpers.sh"

# expect <expected-exit> <name> [linter args...] -- runs the linter in $TMP/repo
# against the fixture skill root at $TMP/config.
expect() {
  local want="$1" name="$2"; shift 2
  local got=0 out
  out=$(cd "$TMP/repo" && CLAUDE_CONFIG_DIR="$TMP/config" "$LINTER" "$@" 2>&1) || got=$?
  assert_eq "$name" "$want" "$got"
  [ "$got" = "$want" ] || echo "$out" | sed 's/^/      /'
}

setup() {
  TMP=$(mktemp -d)
  mkdir -p "$TMP/repo/.claude/skills" "$TMP/config/skills/synced/bucket"
  git -C "$TMP/repo" init -q
}

teardown() { rm -rf "$TMP"; }

# Write a skill directory with one SKILL.md; echo nothing.
make_skill() { mkdir -p "$1"; printf -- '---\ndescription: %s\n---\nbody\n' "$2" > "$1/SKILL.md"; }

# Write .upstream.json for a vendored skill, hashing its current SKILL.md.
mark_vendored() {
  local dir="$1" digest
  digest=$(sha256sum "$dir/SKILL.md" | cut -d' ' -f1)
  cat > "$dir/.upstream.json" <<JSON
{
  "origin": "test fixture",
  "vendored_at": "2026-08-29",
  "reason": "test",
  "files": { "SKILL.md": "$digest" }
}
JSON
}

echo "== integrity (CI tier, no local roots needed) =="

setup
make_skill "$TMP/repo/.claude/skills/vend" v
mark_vendored "$TMP/repo/.claude/skills/vend"
expect 0 "clean vendored skill passes"
echo 'edited' >> "$TMP/repo/.claude/skills/vend/SKILL.md"
expect 1 "hand-edited vendored file fails"
teardown

setup
make_skill "$TMP/repo/.claude/skills/vend" v
mark_vendored "$TMP/repo/.claude/skills/vend"
touch "$TMP/repo/.claude/skills/vend/extra.md"
expect 1 "unlisted file in a vendored directory fails"
teardown

setup
make_skill "$TMP/repo/.claude/skills/vend" v
mark_vendored "$TMP/repo/.claude/skills/vend"
python3 - "$TMP/repo/.claude/skills/vend/.upstream.json" <<'PY'
import json, sys
d = json.load(open(sys.argv[1])); d.pop("reason")
json.dump(d, open(sys.argv[1], "w"))
PY
expect 1 "marker missing a required key fails"
teardown

echo "== drift (local tier) =="

setup
make_skill "$TMP/repo/.claude/skills/vend" v
mark_vendored "$TMP/repo/.claude/skills/vend"
cp -R "$TMP/repo/.claude/skills/vend" "$TMP/config/skills/synced/bucket/vend"
rm "$TMP/config/skills/synced/bucket/vend/.upstream.json"
expect 0 "vendored copy identical to upstream passes --local" --local
printf 'upstream moved\n' >> "$TMP/config/skills/synced/bucket/vend/SKILL.md"
expect 1 "upstream moving ahead is caught as drift" --local
expect 0 "...and is invisible to the CI tier"
teardown

setup
make_skill "$TMP/repo/.claude/skills/vend" v
mark_vendored "$TMP/repo/.claude/skills/vend"
expect 0 "no local copy of a vendored skill is a note, not a failure" --local
teardown

echo "== shadow (local tier) =="

setup
make_skill "$TMP/repo/.claude/skills/mine" m
make_skill "$TMP/config/skills/synced/bucket/mine" m
expect 1 "repo-authored skill shadowing a synced skill fails --local" --local
expect 0 "...and is invisible to the CI tier"
teardown

setup
make_skill "$TMP/repo/.claude/skills/mine" m
make_skill "$TMP/config/skills/mine" m
expect 1 "repo-authored skill shadowing a personal skill fails --local" --local
teardown

setup
make_skill "$TMP/repo/.claude/skills/mine" m
expect 0 "repo-authored skill with no local namesake passes --local" --local
teardown

setup
make_skill "$TMP/repo/.claude/skills/vend" v
mark_vendored "$TMP/repo/.claude/skills/vend"
cp -R "$TMP/repo/.claude/skills/vend" "$TMP/config/skills/synced/bucket/vend"
rm "$TMP/config/skills/synced/bucket/vend/.upstream.json"
expect 0 "a vendored skill overriding its own original is not shadowing" --local
teardown

setup
make_skill "$TMP/repo/.claude/skills/mine" m
make_skill "$TMP/config/skills/synced/bucket/mine" m
rm -rf "$TMP/config/skills"
expect 0 "absent skill root downgrades --local instead of failing" --local
teardown

report_results
