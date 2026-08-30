#!/usr/bin/env bash
#
# test-verify-landed.sh — functional harness for the `verify-landed` primitive
# (tactic-graph-commit-landing-signal-unreliable, Unit 1).
#
# Shape follows test-park-node.sh: a throwaway bare origin plus a clone. Unlike
# that harness, nothing is shimmed and nothing is copied into the scratch tree —
# verify-landed is read-only and resolves the repo it inspects from `-C`, so the
# REAL script (next to this file, with the real node_modules behind it for the
# `@<jq-filter>` mode's tsx call) is pointed at the scratch clone. That is
# itself part of the contract under test: a script invoked by absolute path
# from one checkout must answer about the checkout it was given.
#
# Covers:
#   1. blob-equal                       → landed, exit 0
#   2. blob-differs                     → not-landed, exit 4
#   3. absent, expected absent          → landed, exit 0
#   4. present, expected absent         → not-landed, exit 4
#   5. unreachable origin               → unknown, exit 1, and the word
#                                         'not-landed' appears NOWHERE in the
#                                         output (the collapse this primitive
#                                         exists to prevent)
#   6. jq predicate true                → landed, exit 0
#   7. jq predicate false               → not-landed, exit 4
#   8. jq predicate on an absent node   → not-landed, exit 4
#   9. malformed spec (including the retired single-token `<id>=<sha>` /
#                       `<id>@<filter>` positional forms)
#                                       → usage error, exit 2, before any fetch
#  9b. id/filter injection — an id carrying '@'/'#', or a filter carrying '#'
#      or `env`/`$ENV` → usage error, exit 2, and NO verdict line at all
#  10. --json emits one parseable object with the documented shape
#  11. multi-spec: one unsatisfied spec decides the whole verdict
#  12. the working tree is never written (no fetch-into-tree, no index touch)
#  13. `git rev-parse origin/main` fails (a configured-but-never-fetched clone,
#      --no-fetch) → unknown, exit 1 — the arm at verify-landed's
#      `MAIN_SHA=...` rev-parse, distinct from case 5's fetch-failure arm
#  14. jq-mode readNodeAtRef failure (malformed frontmatter on the node as of
#      origin/main) → unknown, exit 1
#  15. jq filter runtime error (a type mismatch jq itself rejects, e.g. exit 5)
#      → unknown, exit 1, distinct from a false predicate (case 7)
set -uo pipefail

HARNESS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VL_SCRIPT="$HARNESS_DIR/verify-landed"
[[ -x "$VL_SCRIPT" ]] || { echo "error: verify-landed not executable at $VL_SCRIPT" >&2; exit 1; }
command -v jq >/dev/null || { echo "error: jq not found (required by verify-landed)" >&2; exit 1; }

WORK="$(mktemp -d)" || { echo "error: mktemp failed" >&2; exit 1; }
trap 'rm -rf "$WORK"' EXIT

PASS=0; FAIL=0
ok() { echo "PASS: $1"; PASS=$((PASS + 1)); }
no() { echo "FAIL: $1"; FAIL=$((FAIL + 1)); }

# --- Scratch origin + seed content -------------------------------------------
ORIGIN="$WORK/origin.git"
git init -q --bare "$ORIGIN"
git -C "$ORIGIN" symbolic-ref HEAD refs/heads/main

SEED="$WORK/seed"
mkdir -p "$SEED/intentions"
git -C "$SEED" init -q -b main
git -C "$SEED" config user.email harness@test
git -C "$SEED" config user.name harness
git -C "$SEED" remote add origin "$ORIGIN"

cat >"$SEED/intentions/t-plain.md" <<'NODE'
---
id: t-plain
kind: tactic
statement: harness node with no office_hours
owner: ai
status: codified
---
# harness node with no office_hours
NODE

cat >"$SEED/intentions/t-parked.md" <<'NODE'
---
id: t-parked
kind: tactic
statement: harness node that is parked to office hours
owner: ai
status: codified
office_hours:
  reason: harness park
  since: "2026-08-05"
  recommendation: null
---
# harness node that is parked to office hours
NODE

# t-broken: invalid YAML frontmatter, so readNodeAtRef's readNode parse throws
# — the only way to drive verify-landed's jq-mode readNodeAtRef-failure arm
# (case 14) without editing verify-landed itself. Nothing in this harness
# enumerates the whole store (verify-landed only ever reads ONE node at a
# time via readNodeAtRef), so a permanently-malformed node here cannot affect
# any other case.
cat >"$SEED/intentions/t-broken.md" <<'NODE'
---
id: t-broken
kind: tactic
statement: [this is not valid: yaml: because of bad nesting
owner: ai
status: codified
---
# broken node — malformed frontmatter, deliberately
NODE

git -C "$SEED" add -A
git -C "$SEED" commit -qm seed
git -C "$SEED" push -q origin main

CLONE="$WORK/clone"
git clone -q "$ORIGIN" "$CLONE"
git -C "$CLONE" config user.email harness@test
git -C "$CLONE" config user.name harness

PLAIN_BLOB="$(git -C "$CLONE" rev-parse origin/main:intentions/t-plain.md)"
WRONG_BLOB="0000000000000000000000000000000000000000"

# run <expected-exit> <label> -- <verify-landed args...>
# Captures stdout+stderr into $OUT for follow-up assertions.
OUT=""
run() {
  local want="$1" label="$2"; shift 3
  OUT="$("$VL_SCRIPT" "$@" 2>&1)"; local rc=$?
  if [[ $rc -eq $want ]]; then
    ok "$label (exit $rc)"
  else
    no "$label (expected exit $want, got $rc)"
    echo "$OUT" | sed 's/^/    /'
  fi
  return 0
}

# --- 1. blob-equal → landed ---------------------------------------------------
run 0 "blob-equal is landed" -- -C "$CLONE" --no-fetch --node t-plain --blob "$PLAIN_BLOB"
grep -q "verdict=landed" <<<"$OUT" || no "case 1: terminal line does not say verdict=landed"

# --- 2. blob-differs → not-landed --------------------------------------------
run 4 "blob-differs is not-landed" -- -C "$CLONE" --no-fetch --node t-plain --blob "$WRONG_BLOB"
grep -q "verdict=not-landed" <<<"$OUT" || no "case 2: terminal line does not say verdict=not-landed"

# --- 3. absent, expected absent → landed -------------------------------------
run 0 "absent-and-expected-absent is landed" -- -C "$CLONE" --no-fetch --node t-never-existed --blob absent

# --- 4. present, expected absent → not-landed --------------------------------
run 4 "present-but-expected-absent is not-landed" -- -C "$CLONE" --no-fetch --node t-plain --blob absent

# --- 5. unreachable origin → unknown, never not-landed ------------------------
BROKEN="$WORK/broken"
git clone -q "$ORIGIN" "$BROKEN"
git -C "$BROKEN" remote set-url origin "$WORK/no-such-origin.git"
run 1 "unreachable origin is unknown" -- -C "$BROKEN" --node t-plain --blob "$PLAIN_BLOB"
if grep -q "not-landed" <<<"$OUT"; then
  no "case 5: the word 'not-landed' appears in an UNKNOWN result — the collapse this primitive prevents"
else
  ok "case 5: unknown output never says 'not-landed'"
fi
grep -q "verdict=unknown" <<<"$OUT" || no "case 5: terminal line does not say verdict=unknown"

# --- 6/7/8. jq predicates -----------------------------------------------------
run 0 "jq predicate true is landed" -- -C "$CLONE" --no-fetch --node t-parked --jq '.office_hours != null'
run 4 "jq predicate false is not-landed" -- -C "$CLONE" --no-fetch --node t-parked --jq '.office_hours == null'
run 4 "jq predicate on an absent node is not-landed" -- -C "$CLONE" --no-fetch --node t-never-existed --jq '.office_hours != null'

# --- 9. malformed spec → usage error -----------------------------------------
run 2 "a bare positional spec is a usage error" -- -C "$CLONE" --no-fetch "t-plain"
run 2 "the retired '<id>=<sha>' positional form is a usage error" -- -C "$CLONE" --no-fetch "t-plain=$PLAIN_BLOB"
run 2 "the retired '<id>@<filter>' positional form is a usage error" -- -C "$CLONE" --no-fetch 't-parked@.office_hours != null'
run 2 "--blob with a non-sha, non-absent value is a usage error" -- -C "$CLONE" --no-fetch --node t-plain --blob maybe
run 2 "--node without --blob/--jq is a usage error" -- -C "$CLONE" --no-fetch --node t-plain
run 2 "--blob without a preceding --node is a usage error" -- -C "$CLONE" --no-fetch --blob "$PLAIN_BLOB"
run 2 "no specs at all is a usage error" -- -C "$CLONE" --no-fetch
run 2 "a repo path outside any git repo is a usage error" -- -C "$WORK" --no-fetch --node t-plain --blob "$PLAIN_BLOB"

# --- 9b. id/filter injection is refused, never answered -----------------------
# The defect this argument shape exists to end: with a single-token spec, an id
# containing '@' split the spec early and the tail became jq source, and its '#'
# commented out the intended predicate — 'tactic-x@true #.office_hours != null'
# reported `landed` for a node that does not exist on origin/main at all. Every
# shape of that attack must now be a usage error (exit 2, no verdict word).
run 2 "an id containing '@' is a malformed id, not a spec split" -- \
  -C "$CLONE" --no-fetch --node 't-plain@true #' --jq '.office_hours != null'
grep -q "verdict=" <<<"$OUT" && no "case 9b: a refused id still printed a verdict line"
run 2 "a filter containing '#' is refused (jq comment truncation)" -- \
  -C "$CLONE" --no-fetch --node t-parked --jq 'true #.office_hours != null'
run 2 "a filter referencing \$ENV is refused (exfiltration channel)" -- \
  -C "$CLONE" --no-fetch --node t-parked --jq '$ENV.PATH != null'
run 2 "a filter referencing env is refused (exfiltration channel)" -- \
  -C "$CLONE" --no-fetch --node t-parked --jq 'env.PATH != null'

# --- 10. --json shape ---------------------------------------------------------
JSON_OUT="$("$VL_SCRIPT" -C "$CLONE" --no-fetch --json --node t-plain --blob "$PLAIN_BLOB" --node t-parked --blob absent 2>/dev/null)"
JSON_RC=$?
[[ $JSON_RC -eq 4 ]] || no "case 10: expected exit 4 from the mixed --json run, got $JSON_RC"
# The JSON object is the tail of stdout, after the per-spec and terminal lines.
JSON_BODY="$(sed -n '/^{/,$p' <<<"$JSON_OUT")"
if jq -e '
      .verdict == "not-landed"
      and (.main | type) == "string"
      and (.specs | length) == 2
      and (.specs[0] | .id == "t-plain" and .mode == "blob" and .status == "satisfied")
      and (.specs[1] | .id == "t-parked" and .status == "unsatisfied" and .expected == "absent")
    ' <<<"$JSON_BODY" >/dev/null 2>&1; then
  ok "case 10: --json emits one parseable object with the documented shape"
else
  no "case 10: --json object missing or malformed"
  echo "$JSON_OUT" | sed 's/^/    /'
fi

# --- 11. multi-spec: one unsatisfied decides ---------------------------------
run 4 "one unsatisfied spec decides a multi-spec verdict" -- \
  -C "$CLONE" --no-fetch --node t-plain --blob "$PLAIN_BLOB" --node t-parked --blob "$WRONG_BLOB"
run 0 "all-satisfied multi-spec is landed" -- \
  -C "$CLONE" --no-fetch --node t-plain --blob "$PLAIN_BLOB" --node t-parked --jq '.office_hours != null'

# --- 12. never writes ---------------------------------------------------------
BEFORE_STATUS="$(git -C "$CLONE" status --porcelain)"
BEFORE_HEAD="$(git -C "$CLONE" rev-parse HEAD)"
"$VL_SCRIPT" -C "$CLONE" --node t-plain --blob "$PLAIN_BLOB" >/dev/null 2>&1
AFTER_STATUS="$(git -C "$CLONE" status --porcelain)"
AFTER_HEAD="$(git -C "$CLONE" rev-parse HEAD)"
if [[ "$BEFORE_STATUS" == "$AFTER_STATUS" && "$BEFORE_HEAD" == "$AFTER_HEAD" ]]; then
  ok "case 12: a real fetching run leaves the working tree and HEAD untouched"
else
  no "case 12: verify-landed mutated the checkout (status or HEAD changed)"
fi

# --- 13. rev-parse origin/main fails → unknown (distinct from case 5) --------
# Case 5 drives the FETCH-failure arm (verify-landed:~205-208) by pointing
# `origin` at a nonexistent path and letting the fetch itself fail. This case
# drives the SEPARATE rev-parse arm a few lines below it (~211-214): a repo
# with `origin` configured but that has never run a single fetch has no
# `refs/remotes/origin/main` at all, so `git rev-parse origin/main` fails even
# though nothing about the remote is unreachable. `--no-fetch` skips the fetch
# step entirely, so this is the only way to reach the rev-parse arm without
# going through (and being shadowed by) the fetch arm first.
NEVERFETCHED="$WORK/never-fetched"
mkdir -p "$NEVERFETCHED"
git -C "$NEVERFETCHED" init -q -b main
git -C "$NEVERFETCHED" remote add origin "$ORIGIN"
if git -C "$NEVERFETCHED" rev-parse origin/main >/dev/null 2>&1; then
  no "case 13 setup: never-fetched clone unexpectedly already has origin/main"
fi
run 1 "rev-parse origin/main fails on a never-fetched clone" -- \
  -C "$NEVERFETCHED" --no-fetch --node t-plain --blob "$PLAIN_BLOB"
if grep -q "not-landed" <<<"$OUT"; then
  no "case 13: the word 'not-landed' appears in an UNKNOWN result"
fi
grep -q "verdict=unknown" <<<"$OUT" || no "case 13: terminal line does not say verdict=unknown"
grep -q "could not resolve origin/main" <<<"$OUT" || no "case 13: missing the rev-parse-specific diagnostic"

# --- 14. jq-mode readNodeAtRef failure → unknown ------------------------------
# t-broken has invalid YAML frontmatter as of origin/main. readNodeAtRef's
# parse throws, node_json_at_main's `node --import tsx/esm` subprocess exits
# non-zero, and verify-landed must report `unknown` — never treat a read
# failure as "the predicate was false" (that would be case 7's arm, and would
# silently misreport a corrupt node as a definite not-landed).
run 1 "jq-mode readNodeAtRef failure on a malformed node is unknown" -- \
  -C "$CLONE" --no-fetch --node t-broken --jq '.office_hours != null'
if grep -q "not-landed" <<<"$OUT"; then
  no "case 14: the word 'not-landed' appears in an UNKNOWN result"
fi
grep -q "verdict=unknown" <<<"$OUT" || no "case 14: terminal line does not say verdict=unknown"
grep -q "readNodeAtRef failed" <<<"$OUT" || no "case 14: missing the readNodeAtRef-specific diagnostic"

# --- 15. jq filter runtime error → unknown (distinct from a false predicate) -
# `.owner + 1` is a well-formed filter (passes the `#`/env charset checks at
# parse time) that jq itself rejects at evaluation time — t-parked's `owner`
# is the string "ai", and jq refuses `string + number` (exit 5, not 0 or 1).
# A filter error must report `unknown`, never collapse into `not-landed`
# (case 7's false-predicate arm) — a broken predicate says nothing about
# whether the node landed.
run 1 "a jq filter type error is unknown, not a false predicate" -- \
  -C "$CLONE" --no-fetch --node t-parked --jq '.owner + 1 == 1'
if grep -q "not-landed" <<<"$OUT"; then
  no "case 15: the word 'not-landed' appears in an UNKNOWN result"
fi
grep -q "verdict=unknown" <<<"$OUT" || no "case 15: terminal line does not say verdict=unknown"
grep -q "jq filter '.owner + 1 == 1' failed" <<<"$OUT" || no "case 15: missing the jq-filter-specific diagnostic"

echo
echo "test-verify-landed: $PASS passed, $FAIL failed"
[[ $FAIL -eq 0 ]]
