#!/usr/bin/env bash
set -euo pipefail

# Enforce .claude/rules/vendored-skills.md. Two tiers, because the interesting
# failures are not visible from a CI runner.
#
#   (default)  INTEGRITY. Committed content vs the digests recorded in each
#              .upstream.json. Portable: reads only the working tree, needs no
#              origin/main baseline and no Claude install. Run by run-lint.sh on
#              every PR.
#
#   --local    INTEGRITY + DRIFT + SHADOW. Adds the two checks that require the
#              machine's own Claude skill roots, which a CI runner does not have:
#                DRIFT  — the vendored copy vs the live account-synced original.
#                         Integrity alone cannot see this: a copy that faithfully
#                         matches its own recorded hashes is still stale once
#                         upstream moves.
#                SHADOW — a repo-authored skill name that silently overrides a
#                         personal or account-synced skill of the same name.
#              Run by .githooks/pre-commit.
#
# Skill roots are read from CLAUDE_CONFIG_DIR (default ~/.claude), so the test
# suite can point both checks at a fixture tree.

usage() { echo "Usage: lint-vendored-skills.sh [--local]" >&2; exit 1; }

LOCAL=false
while [[ $# -gt 0 ]]; do
  case "$1" in
    --local) LOCAL=true; shift ;;
    *) usage ;;
  esac
done

REPO_ROOT=$(git rev-parse --show-toplevel)
SKILLS_DIR="$REPO_ROOT/.claude/skills"
CONFIG_DIR="${CLAUDE_CONFIG_DIR:-$HOME/.claude}"
FAILURES=0

fail() { echo "FAIL: $1" >&2; FAILURES=$((FAILURES + 1)); }

marker_files() {  # marker -> "relpath<TAB>sha256" per line
  python3 - "$1" <<'PY'
import json, sys
for rel, digest in json.load(open(sys.argv[1]))["files"].items():
    print(f"{rel}\t{digest}")
PY
}

# Every directory named <name> under a local skill root, one path per line.
# Personal skills sit directly under <config>/skills; account-synced ones sit a
# bucket deeper, under <config>/skills/synced/<bucket>. Both are roots whose
# skills a project skill of the same name overrides.
local_roots_for() {
  local name="$1" d
  for d in "$CONFIG_DIR/skills/$name" "$CONFIG_DIR"/skills/synced/*/"$name"; do
    [ -d "$d" ] && echo "$d"
  done
  return 0
}

if [ ! -d "$SKILLS_DIR" ]; then
  echo "No .claude/skills directory; nothing to check."
  exit 0
fi

if [ "$LOCAL" = true ] && [ ! -d "$CONFIG_DIR/skills" ]; then
  echo "NOTE: no skill root at $CONFIG_DIR/skills; drift and shadow checks skipped."
  LOCAL=false
fi

VENDORED=0
AUTHORED=0
DRIFT_CHECKED=0

for skill_dir in "$SKILLS_DIR"/*/; do
  [ -d "$skill_dir" ] || continue
  name=$(basename "$skill_dir")
  marker="$skill_dir.upstream.json"

  # ---- repo-authored: nothing to verify, but it must not shadow ----
  if [ ! -f "$marker" ]; then
    AUTHORED=$((AUTHORED + 1))
    if [ "$LOCAL" = true ]; then
      while IFS= read -r hit; do
        [ -n "$hit" ] || continue
        fail "$name: repo-authored skill silently overrides the skill at $hit.
      A project skill wins over a personal or account-synced one of the same
      name, with no warning anywhere. Rename this skill, or -- if it is meant
      to be a committed copy of that one -- vendor it: add .upstream.json per
      .claude/rules/vendored-skills.md."
      done < <(local_roots_for "$name")
    fi
    continue
  fi

  # ---- vendored: marker well-formed ----
  VENDORED=$((VENDORED + 1))

  if ! python3 -c 'import json,sys; json.load(open(sys.argv[1]))' "$marker" 2>/dev/null; then
    fail "$name: .upstream.json is not valid JSON"
    continue
  fi

  missing=$(python3 - "$marker" <<'PY'
import json, sys
doc = json.load(open(sys.argv[1]))
print(" ".join(k for k in ("origin", "vendored_at", "reason", "files") if k not in doc))
PY
)
  if [ -n "$missing" ]; then
    fail "$name: .upstream.json missing required key(s): $missing"
    continue
  fi

  # ---- INTEGRITY: recorded digests still hold ----
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
  done < <(marker_files "$marker")

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

  # ---- DRIFT: the committed copy vs the live original ----
  [ "$LOCAL" = true ] || continue

  upstream=$(local_roots_for "$name" | head -1)
  if [ -z "$upstream" ]; then
    # Not an error: this machine simply may not have that account skill synced.
    echo "NOTE: $name: no local copy under $CONFIG_DIR/skills; drift not checked."
    continue
  fi

  DRIFT_CHECKED=$((DRIFT_CHECKED + 1))
  if ! diff -rq --exclude=.upstream.json "$skill_dir" "$upstream" >/dev/null 2>&1; then
    fail "$name: the vendored copy differs from the live original at $upstream.
      Upstream has moved (or this copy was changed outside the marker). Re-vendor:
      copy the upstream files in, recompute every hash in .upstream.json, and bump
      vendored_at. Diff with:
        diff -r --exclude=.upstream.json .claude/skills/$name $upstream"
  fi
done

if [ "$FAILURES" -gt 0 ]; then
  echo "Vendored-skill lint failed ($FAILURES problem(s))." >&2
  echo "See .claude/rules/vendored-skills.md" >&2
  exit 1
fi

if [ "$LOCAL" = true ]; then
  echo "Vendored-skill lint passed: $VENDORED vendored ($DRIFT_CHECKED drift-checked), $AUTHORED repo-authored shadow-checked."
else
  echo "Vendored-skill lint passed: $VENDORED vendored skill(s) checked (integrity only; --local adds drift and shadow)."
fi
