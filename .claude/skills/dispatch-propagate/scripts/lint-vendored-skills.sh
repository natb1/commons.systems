#!/usr/bin/env bash
set -euo pipefail

# Enforce .claude/rules/vendored-skills.md: a skill directory carrying
# .upstream.json is upstream-owned, and its committed content must still match
# the hashes recorded when it was vendored.
#
# Deliberately NOT gated on changed files, and deliberately diff-free. Every
# other prose-style check here needs an origin/main baseline; this one reads
# only the working tree, so it also runs on a plain checkout, on main, and in a
# worktree with no upstream ref. The cost is a sha256 over a handful of small
# files, so there is no gate worth adding to skip it.

REPO_ROOT=$(git rev-parse --show-toplevel)
SKILLS_DIR="$REPO_ROOT/.claude/skills"
FAILURES=0

fail() {
  echo "FAIL: $1" >&2
  FAILURES=$((FAILURES + 1))
}

if [ ! -d "$SKILLS_DIR" ]; then
  echo "No .claude/skills directory; nothing to check."
  exit 0
fi

VENDORED=0

for skill_dir in "$SKILLS_DIR"/*/; do
  [ -d "$skill_dir" ] || continue
  name=$(basename "$skill_dir")
  marker="$skill_dir.upstream.json"

  [ -f "$marker" ] || continue
  VENDORED=$((VENDORED + 1))

  if ! python3 -c 'import json,sys; json.load(open(sys.argv[1]))' "$marker" 2>/dev/null; then
    fail "$name: .upstream.json is not valid JSON"
    continue
  fi

  # Required keys, so provenance is never reduced to a bare hash list.
  missing=$(python3 - "$marker" <<'PY'
import json, sys
doc = json.load(open(sys.argv[1]))
required = ("origin", "vendored_at", "reason", "files")
print(" ".join(k for k in required if k not in doc))
PY
)
  if [ -n "$missing" ]; then
    fail "$name: .upstream.json missing required key(s): $missing"
    continue
  fi

  # Every listed file must exist and still hash to the recorded value.
  while IFS=$'\t' read -r rel want; do
    [ -n "$rel" ] || continue
    path="$skill_dir$rel"
    if [ ! -f "$path" ]; then
      fail "$name: .upstream.json lists '$rel', which is not in the directory"
      continue
    fi
    got=$(sha256sum "$path" | cut -d' ' -f1)
    if [ "$got" != "$want" ]; then
      fail "$name: '$rel' does not match the hash recorded when it was vendored.
      A vendored skill is upstream-owned and must not be hand-edited. Either
      revert this file, or fork the skill: delete .upstream.json, rename the
      directory to a name this repo owns, and update every caller. To record a
      genuine re-sync from upstream, recompute the hash and bump vendored_at."
    fi
  done < <(python3 - "$marker" <<'PY'
import json, sys
for rel, digest in json.load(open(sys.argv[1]))["files"].items():
    print(f"{rel}\t{digest}")
PY
)

  # And every file in the directory must be listed, so a new file cannot be
  # smuggled into an upstream-owned directory without appearing in the marker.
  while IFS= read -r rel; do
    [ -n "$rel" ] || continue
    [ "$rel" = ".upstream.json" ] && continue
    if ! python3 - "$marker" "$rel" <<'PY'
import json, sys
sys.exit(0 if sys.argv[2] in json.load(open(sys.argv[1]))["files"] else 1)
PY
    then
      fail "$name: '$rel' is in the directory but not listed in .upstream.json"
    fi
  done < <(cd "$skill_dir" && find . -type f | sed 's|^\./||' | sort)

  [ -f "$skill_dir/SKILL.md" ] || fail "$name: vendored skill has no SKILL.md"
done

if [ "$FAILURES" -gt 0 ]; then
  echo "Vendored-skill lint failed ($FAILURES problem(s))." >&2
  echo "See .claude/rules/vendored-skills.md" >&2
  exit 1
fi

echo "Vendored-skill lint passed ($VENDORED vendored skill(s) checked)."
