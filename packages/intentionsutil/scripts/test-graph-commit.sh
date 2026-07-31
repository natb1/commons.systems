#!/usr/bin/env bash
#
# test-graph-commit.sh — functional harness for graph-commit.
#
# Recreates the verification setup from PR #2751 (which previously lived only
# in job-scratch dirs): a throwaway bare origin plus two clones (two
# independent writers), `gh` and `npx` PATH shims standing in for the GitHub
# API and the tsx parking helper, and GRAPH_COMMIT_* env overrides shrinking
# the poll windows. The graph-commit under test is the one next to this file;
# it is copied into the scratch repo at its real repo-relative path so its own
# REPO_ROOT resolution points at the scratch clone.
#
# Covers:
#   1. happy path lands (exit 0), scratch branch deleted on origin
#   2. idempotent re-run on a clean tree: exit 0, no new commit on main, and
#      the no-op short-circuit makes zero gh polls and leaves no scratch branch
#   3. non-overlapping concurrent edits auto-merge; both writers' edits survive
#   4. overlapping concurrent edits: exit 1, the other writer's landed content
#      survives on main, this writer's content is NOT landed, the office_hours
#      park commit lands, and the losing content is preserved in the kept
#      snapshot dir
#   5. concluded check failure (gh shim reports "3 1"): immediate die, no
#      retry burn (exactly one poll, no second attempt)
#   6. gh hard failure (shim exits 1): die surfacing gh's stderr after exactly
#      3 consecutive polls
#   7. pending timeout (shim reports "0 0"): still transient — burns all
#      attempts and exits with the busy-main error, whose terminal line names
#      the cause and attributes the observed check state to the SHA it was read
#      on (guarding against a prior attempt's snapshot being shown as this
#      failure's state)
#   8. desynced check-run status (one required check's status is stuck
#      in_progress even though its conclusion already reports success — a
#      known GitHub check-runs desync, #2457): the fixed --jq filter keys off
#      .conclusion alone, so this still counts as the fourth success and
#      lands immediately instead of spinning to the busy-main timeout
#   9. id validation: `v1..v2-migration` lands end-to-end; `/`, `\`, and the
#      exact ids `.` / `..` are rejected with exit 2
#  10. --prune: an ordinary edit id and a prune id land in ONE commit
#  11. --prune guard: a prune id whose file is still present on disk is
#      rejected (no commit lands)
#  12. --base fresh: a --base entry matching origin/main's current blob lands
#  13. --base stale, disjoint appended lines (bare line-based fixture): now
#      that layer 3 attempts an automatic merge before refusing, two disjoint
#      appended lines (this writer's line13, the concurrent writer's line14)
#      auto-resolve — exit 0, both lines land, no park. (Pre-Unit-3 this was a
#      hard `die`; cases 21-22 below cover the field-level resolve/unresolved
#      split this case can no longer distinguish on its own.)
#  14. --prune alone (no positional id, IDS empty): a pure deletion lands on
#      main and the scratch branch is cleaned up — this is the owed-prune
#      backlog's actual shape (a done node with no accompanying edit), not
#      exercised by case 10's mixed edit+prune
#  15. --base manifest-file form: a file of <id>=<blobsha> lines (as opposed
#      to the inline form used by cases 12-13) lands
#  16. far-ahead worktree (PR branch with a non-intentions code commit): the
#      edit is rebuilt on origin/main, ONLY the intentions/ change lands (the
#      code commit is excluded), exit 0, and the worktree HEAD is restored to
#      the PR tip
#  17. overlapping edit vs prune conflict: park recommendation omits a
#      snapshot path (no content to preserve) and states the
#      prune-reconciliation instruction instead
#  18. far-ahead worktree + --prune: a deletion issued from a far-ahead PR
#      branch lands on main (the node is removed) without landing the code
#      commit, HEAD restored
#  19. layer 2 (rebase-conflict field merge) resolves a textual conflict whose
#      two sides touch DIFFERENT fields: exit 0, the "auto-resolved" log
#      suffix appears, both writers' field edits land
#  20. layer 2 leaves a textual conflict whose two sides touch the SAME field
#      mechanical-unresolved: exit 1, office_hours.reason carries
#      "mechanical-unresolved", and the recommendation names both values
#  21. layer 3 (--base stale re-read) auto-resolves a field-level fixture
#      whose disjoint fields diverged: exit 0, no die, no park, both fields land
#  22. layer 3 leaves a stale-`--base` SAME-field divergence
#      mechanical-unresolved: exit 1, office_hours.reason carries
#      "mechanical-unresolved", both values are named in the recommendation
#  23. a --prune id racing a concurrent edit to the same node is excluded from
#      the layer-2 merge attempt entirely (a deletion has nothing to
#      structurally merge against) — no false "auto-resolved" claim, parks
#      with the prune-specific sentinel note
#  24. an unrelated dirty tracked file outside the node set: clear pre-flight
#      error naming the file, no rebase/CI attempted, main untouched
#  25. -C targeting from an unrelated cwd: the graph-commit script FILE lives
#      inside one clone (w16) but is invoked with `-C` pointing at a DIFFERENT
#      clone (w17), from a cwd that is neither — the exact scenario that used
#      to silently break (REPO_ROOT derived from the script's own on-disk
#      location, landing in whatever checkout the script FILE happened to sit
#      in, regardless of caller intent or -C). Asserts the edit lands via w17,
#      not w16 or the cwd.
#      (cwd-derivation with no `-C` — the default path — is already exercised
#      as a regression guard by nearly every other case via run_gc(), which
#      always `cd`s into the target clone and passes no `-C`; no separate case
#      needed.)
#  26. no-repo error: invoked with no `-C` from a cwd that is not inside any
#      git repository at all (a plain `mktemp -d`, never `git init`'d) — a
#      clear non-zero exit naming "not inside a git repository", never a
#      silent fall-back to the script's own checkout.
#  27. fail-loud guard, differing blob: a clone that never edited a given id
#      (nothing staged) while origin/main has since advanced with a DIFFERENT
#      edit to that same id (a stale clone) — dies loudly naming "mis-pointed
#      -C/--repo", never reaches the "landed" success message, main untouched.
#  28. fail-loud guard, benign equal-blob: a clone synced exactly to
#      origin/main's tip (nothing staged, and the local blob for the id
#      equals origin/main's blob) proceeds benignly — exit 0, the same
#      "no new changes to stage" message, no die, and zero gh polls (the
#      no-op short-circuit).
#  29. lock contention is cheap: a waiting writer makes zero gh polls while
#      blocked on the landing lock, then exactly one poll cycle once it
#      acquires the lock and lands (not a re-poll-from-scratch retry burn)
#  30. dead-holder steal: an expired foreign lock claim is stolen promptly,
#      not held to the full lock-wait timeout
#  31. live-holder wait: a live foreign lock is not stolen prematurely; the
#      writer waits for the planted expiry before proceeding
#  32. lock-ref hygiene: refs/graph/landing-lock is absent after a normal
#      landing and never appears under refs/heads/graph/** (disjoint from
#      the scratch-branch namespace graph-fast-path.yml triggers on)
#  33. --expect happy path: an --expect entry matching the blob the caller
#      actually wrote is transparent — exit 0, the edit lands
#  34. --expect catches the equal-blob wrong-repo case that case 28's benign
#      path cannot: a clone synced bit-for-bit to origin/main (nothing staged,
#      local blob == origin/main blob, so the nothing-staged guard passes)
#      invoked with an --expect sha for content that is NOT there — dies
#      naming "mis-pointed -C/--repo", never reaches "landed", main untouched
#  35. --expect on a --prune id is a usage error (exit 2, origin untouched) —
#      a deletion has no content to assert
#  36. a rebase ALREADY in progress in the target checkout: refused up front
#      (non-zero exit naming "already in progress"), main untouched, zero gh
#      calls — graph-commit never runs on a mid-operation worktree, so a
#      caller's own stopped rebase is never aborted by case 37's cleanup
#  37. a rebase THIS run stranded (a die() fires while the pull --rebase
#      conflict is still live) is aborted by cleanup(): no rebase state dir
#      survives, HEAD is reattached to the branch, and the checkout's local
#      commits are intact
#  38. duplicate green rows land: a SHA re-stamped by several pushes carries
#      TWO completed/success rows per required name (plus an unrelated CodeQL
#      row). The gate counts DISTINCT required contexts resolved to their
#      newest run, not rows, so this lands (exit 0) instead of spinning to
#      the busy-main timeout a row-count `== 4` gate could never satisfy
#  39. duplicated rows do not paper over a missing context: four rows but only
#      three distinct required names green (two lint successes, no acceptance
#      row at all) — exit 1, nothing lands on main, and the reported state
#      names "acceptance=absent" (the regression guard against relaxing the
#      gate to `-ge 4`)
#  40. a stale failed row superseded by a newer success lands: acceptance has
#      an older conclusion=failure row and a newer conclusion=success row, so
#      max_by([started_at, id]) resolves it green — exit 0, no "concluded
#      non-success" misdiagnosis
#  41. no-op short-circuit exits 0 even when checks are unusable: a clone
#      synced exactly to origin/main's tip, invoked on an existing id with
#      nothing edited, while gh is in hard-fail mode (every call exits 1) —
#      still exits 0 with zero gh polls and no "polling failed", proving the
#      no-op path never reaches the poller
#      (tactic-graph-commit-noop-landing-false-failure, Defect 1)
#  42. lock-wait exhaustion is diagnosed as lock contention, not as a check
#      state: a foreign lock with a far-future expiry blocks the writer, which
#      exits after zero gh polls — the terminal message names the landing lock
#      as the cause and states that the required-check state was never
#      observed, instead of presenting any check-state snapshot
#      (tactic-graph-commit-noop-landing-false-failure, Defect 3 residue)
#
# No network and no real gh/node needed; requires only bash + git + jq.

set -uo pipefail

HARNESS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
GC_SCRIPT="$HARNESS_DIR/graph-commit"
[[ -f "$GC_SCRIPT" ]] || { echo "error: graph-commit not found at $GC_SCRIPT" >&2; exit 1; }
command -v jq >/dev/null || { echo "error: jq not found (required by the gh shim)" >&2; exit 1; }

WORK="$(mktemp -d)" || { echo "error: mktemp failed" >&2; exit 1; }
declare -a SNAP_DIRS_TO_CLEAN=()
harness_cleanup() {
  rm -rf "$WORK" "${SNAP_DIRS_TO_CLEAN[@]}"
}
trap harness_cleanup EXIT

PASS=0; FAIL=0
ok() { echo "PASS: $1"; PASS=$((PASS + 1)); }
no() { echo "FAIL: $1"; FAIL=$((FAIL + 1)); }

# --- Scratch origin + seed content ------------------------------------------
ORIGIN="$WORK/origin.git"
git init -q --bare "$ORIGIN"
git -C "$ORIGIN" symbolic-ref HEAD refs/heads/main
# plant_lock (cases 30/31) runs `git commit-tree` directly in this bare repo,
# which needs an author identity. CI runners have no global git identity, so
# without this commit-tree fails, plant_lock yields an empty sha, and the lock
# is never planted — case 31 lands immediately instead of waiting out the
# expiry, and case 30 passes vacuously with nothing to steal.
git -C "$ORIGIN" config user.email harness@test
git -C "$ORIGIN" config user.name harness

SEED="$WORK/seed"
mkdir -p "$SEED"
git -C "$SEED" init -q -b main
git -C "$SEED" config user.email harness@test
git -C "$SEED" config user.name harness
git -C "$SEED" remote add origin "$ORIGIN"
mkdir -p "$SEED/intentions" \
         "$SEED/packages/intentionsutil/scripts" \
         "$SEED/packages/intentionsutil/src"
cp "$GC_SCRIPT" "$SEED/packages/intentionsutil/scripts/graph-commit"
# The path must exist for STORE_MODULE resolution; the npx shim never loads it.
: >"$SEED/packages/intentionsutil/src/store.js"

seed_node() { # <id> — 12 numbered lines so distant edits rebase cleanly
  local i
  {
    echo "id: $1"
    for i in $(seq 1 12); do echo "line$i: base"; done
  } >"$SEED/intentions/$1.md"
}
for id in t-happy t-merge t-conflict t-ckfail t-ghfail t-pending t-desync v1..v2-migration \
          t-prune-edit t-prune t-prune-guard t-prune-solo t-base t-base-manifest \
          t-farahead t-farahead-prune t-prune-conflict t-dirty-preflight \
          t-cwd-target t-fail-loud-diff t-fail-loud-benign \
          t-lock-contend t-lock-steal t-lock-wait t-lock-hygiene \
          t-expect-happy t-expect-wrong-repo t-expect-prune \
          t-preexist-conflict t-preexist-rebase t-strand-other t-strand-main \
          t-dup-rows t-partial-dup t-stale-fail; do
  seed_node "$id"
done

# seed_field_node writes a real ---fenced IntentionNode (id, kind: tactic,
# statement, owner: ai, status: raw — the minimum validateNode requires; see
# packages/intentionsutil/src/schema.ts) plus caller-supplied extra frontmatter
# lines, for the layer-2/3 field-merge cases (17-21) below. Unlike seed_node's
# bare line-based format (kept untouched for cases 1-16, which only exercise
# textual rebase mechanics), this is real enough for a human reader to
# recognize as node content, though the npx merge-node.ts shim below never
# actually parses it as YAML — it only greps `key: value` lines.
seed_field_node() { # <id> <extra-yaml-lines...>
  local id="$1"; shift
  {
    echo "---"
    echo "id: $id"
    echo "kind: tactic"
    echo "statement: base statement for $id"
    echo "owner: ai"
    echo "status: raw"
    local line
    for line in "$@"; do echo "$line"; done
    echo "---"
    echo "Placeholder body for $id."
  } >"$SEED/intentions/$id.md"
}
seed_field_node t-field-merge "fieldA: base" "fieldB: base"
seed_field_node t-field-conflict "sentinel: base"
seed_field_node t-field-base-ok "fieldA: base" "fieldB: base"
seed_field_node t-field-base-bad "sentinel: base"

git -C "$SEED" add -A
git -C "$SEED" commit -qm seed
git -C "$SEED" push -q origin main

# --- Independent writer clones -------------------------------------------
make_clone() { # <dst> <identity>
  git clone -q "$ORIGIN" "$1"
  git -C "$1" config user.email "$2@test"
  git -C "$1" config user.name "$2"
}
A="$WORK/a"; B="$WORK/b"
make_clone "$A" writer-a
make_clone "$B" writer-b

# --- gh / npx PATH shims ------------------------------------------------------
mkdir -p "$WORK/bin" "$WORK/fixtures"
MODE_FILE="$WORK/gh-mode"
CALL_LOG="$WORK/gh-calls"
FIXTURE_DIR="$WORK/fixtures"

# Fixture JSON per mode: {status,conclusion}-shaped check_runs entries for the
# four required names, run through graph-commit's REAL --jq filter below (not
# a hardcoded count) so the filter itself is exercised end-to-end.
cat >"$FIXTURE_DIR/green.json" <<'JSON'
{"check_runs": [
  {"name": "acceptance", "status": "completed", "conclusion": "success"},
  {"name": "preview-and-smoke", "status": "completed", "conclusion": "success"},
  {"name": "lint", "status": "completed", "conclusion": "success"},
  {"name": "unit-tests", "status": "completed", "conclusion": "success"}
]}
JSON

cat >"$FIXTURE_DIR/pending.json" <<'JSON'
{"check_runs": [
  {"name": "acceptance", "status": "in_progress", "conclusion": null},
  {"name": "preview-and-smoke", "status": "in_progress", "conclusion": null},
  {"name": "lint", "status": "in_progress", "conclusion": null},
  {"name": "unit-tests", "status": "in_progress", "conclusion": null}
]}
JSON

cat >"$FIXTURE_DIR/concluded-fail.json" <<'JSON'
{"check_runs": [
  {"name": "acceptance", "status": "completed", "conclusion": "success"},
  {"name": "preview-and-smoke", "status": "completed", "conclusion": "success"},
  {"name": "lint", "status": "completed", "conclusion": "success"},
  {"name": "unit-tests", "status": "completed", "conclusion": "failure"}
]}
JSON

# Desynced-success: one required check's status is still in_progress even
# though its conclusion already reports success (the GitHub check-runs desync
# the fixed --jq filter tolerates by keying off .conclusion alone) — #2457.
cat >"$FIXTURE_DIR/desynced-success.json" <<'JSON'
{"check_runs": [
  {"name": "acceptance", "status": "completed", "conclusion": "success"},
  {"name": "preview-and-smoke", "status": "completed", "conclusion": "success"},
  {"name": "lint", "status": "completed", "conclusion": "success"},
  {"name": "unit-tests", "status": "in_progress", "conclusion": "success"}
]}
JSON

# Duplicate rows: the incident shape. A SHA re-stamped by two pushes carries
# TWO completed/success rows per required name (distinct id and started_at),
# so a row-count gate sees 8 green rows and `== 4` can never fire. The
# unrelated failing CodeQL row proves the name filter still excludes non-
# required runs.
cat >"$FIXTURE_DIR/duplicate-rows.json" <<'JSON'
{"check_runs": [
  {"name": "acceptance",        "id": 101, "started_at": "2026-07-27T10:00:00Z", "status": "completed", "conclusion": "success"},
  {"name": "acceptance",        "id": 201, "started_at": "2026-07-27T11:00:00Z", "status": "completed", "conclusion": "success"},
  {"name": "preview-and-smoke", "id": 102, "started_at": "2026-07-27T10:00:00Z", "status": "completed", "conclusion": "success"},
  {"name": "preview-and-smoke", "id": 202, "started_at": "2026-07-27T11:00:00Z", "status": "completed", "conclusion": "success"},
  {"name": "lint",              "id": 103, "started_at": "2026-07-27T10:00:00Z", "status": "completed", "conclusion": "success"},
  {"name": "lint",              "id": 203, "started_at": "2026-07-27T11:00:00Z", "status": "completed", "conclusion": "success"},
  {"name": "unit-tests",        "id": 104, "started_at": "2026-07-27T10:00:00Z", "status": "completed", "conclusion": "success"},
  {"name": "unit-tests",        "id": 204, "started_at": "2026-07-27T11:00:00Z", "status": "completed", "conclusion": "success"},
  {"name": "Analyze (javascript)", "id": 999, "started_at": "2026-07-27T11:30:00Z", "status": "completed", "conclusion": "failure"}
]}
JSON

# Partial duplicate: four rows total but only THREE distinct required names
# green — lint is duplicated and acceptance has no row at all. The regression
# guard against naively relaxing the gate to a `-ge 4` row count.
cat >"$FIXTURE_DIR/partial-duplicate.json" <<'JSON'
{"check_runs": [
  {"name": "lint",              "id": 301, "started_at": "2026-07-27T10:00:00Z", "status": "completed", "conclusion": "success"},
  {"name": "lint",              "id": 302, "started_at": "2026-07-27T11:00:00Z", "status": "completed", "conclusion": "success"},
  {"name": "preview-and-smoke", "id": 303, "started_at": "2026-07-27T10:00:00Z", "status": "completed", "conclusion": "success"},
  {"name": "unit-tests",        "id": 304, "started_at": "2026-07-27T10:00:00Z", "status": "completed", "conclusion": "success"}
]}
JSON

# Stale fail then green: acceptance's OLDER row concluded failure and its
# NEWER row concluded success, so max_by([started_at, id]) must resolve the
# name to success rather than treating the stale failure as a hard stop.
cat >"$FIXTURE_DIR/stale-fail-then-green.json" <<'JSON'
{"check_runs": [
  {"name": "acceptance",        "id": 401, "started_at": "2026-07-27T10:00:00Z", "status": "completed", "conclusion": "failure"},
  {"name": "acceptance",        "id": 402, "started_at": "2026-07-27T11:00:00Z", "status": "completed", "conclusion": "success"},
  {"name": "preview-and-smoke", "id": 403, "started_at": "2026-07-27T11:00:00Z", "status": "completed", "conclusion": "success"},
  {"name": "lint",              "id": 404, "started_at": "2026-07-27T11:00:00Z", "status": "completed", "conclusion": "success"},
  {"name": "unit-tests",        "id": 405, "started_at": "2026-07-27T11:00:00Z", "status": "completed", "conclusion": "success"}
]}
JSON

cat >"$WORK/bin/gh" <<'SH'
#!/usr/bin/env bash
# gh shim: behavior selected by $GC_GH_MODE_FILE; every invocation appends one
# fixed marker line to $GC_GH_CALL_LOG so tests can assert poll counts (the
# real args contain a multi-line --jq program, so they must not be logged raw).
# For modes that reach the check-runs endpoint, this runs graph-commit's REAL
# --jq program (extracted from "$@") against a mode-specific fixture file, so
# the filter itself is exercised rather than a hardcoded count string.
echo "gh-invocation" >>"$GC_GH_CALL_LOG"
mode="$(cat "$GC_GH_MODE_FILE")"
if [[ "$mode" == "hard-fail" ]]; then
  echo "gh: HTTP 403: API rate limit exceeded (harness shim)" >&2
  exit 1
fi
if [[ "$mode" == "blocked-green" ]]; then
  while [[ ! -e "$GC_GH_SENTINEL_FILE" ]]; do sleep 0.2; done
  mode=green
fi
jq_program=""
while [[ $# -gt 0 ]]; do
  if [[ "$1" == "--jq" ]]; then jq_program="$2"; break; fi
  shift
done
fixture="$GC_FIXTURE_DIR/$mode.json"
[[ -f "$fixture" ]] || { echo "gh shim: no fixture for mode $mode" >&2; exit 99; }
jq -r "$jq_program" "$fixture"
SH

cat >"$WORK/bin/npx" <<'SH'
#!/usr/bin/env bash
# npx shim: dispatches on the script path passed right after `tsx` (argv[2] to
# this shim) so it can emulate TWO distinct real tsx invocations without node:
#
#   merge-node.ts  — graph-commit's run_merge_node() layer-2/3 CLI. This branch
#     does NOT reimplement the real three-way YAML field merge (that primitive,
#     mergeIntentionNodes, is Unit 1's job and its correctness is covered by
#     packages/intentionsutil/test/node-merge.test.ts — the source of truth).
#     This shim only proves graph-commit invokes merge-node.ts at the right
#     point and branches correctly on its resolved/unresolved verdict. It does
#     so with a SIMPLIFIED three-way merge over bare `key: value` lines (works
#     against both seed_node's line1..line12 format and seed_field_node's real
#     frontmatter, since both are just newline-delimited `key: value` pairs):
#     for each key appearing in ours and/or theirs, if both sides agree (or
#     only one side touched it), that value wins; if both sides changed it
#     away from base to DIFFERENT values (or there is no base to compare
#     against and the two sides disagree), it is an unresolved conflict.
#   anything else (park_write's throwaway tsx module) — emulates `npx tsx
#     <helper> <storeModule> <intentionsDir> <since> <reason> <snapDir>
#     <pruneCsv> <id...>` without node. Mirrors the real helper's two-pass
#     shape: verify every id is readable first, then write all. Composes
#     office_hours.recommendation additively like the real helper: a per-id BASE
#     recovery string distinguishing a pruned id (no snapshot) from an ordinary
#     edit id (snapshot path included), then APPENDS the out-of-band field
#     breakdown from $GRAPH_COMMIT_RECOMMENDATION_FILE (the mechanical-unresolved
#     text — see graph-commit's park_write) when it is set, so tests can assert
#     on both the prune-vs-edit distinction and the field detail reaching the
#     landed node.
[[ "$1" == "tsx" ]] || { echo "npx shim: unexpected invocation: $*" >&2; exit 1; }

case "$(basename "$2")" in
  merge-node.ts)
    shift 2
    base=""; ours=""; theirs=""; out=""
    while [[ $# -gt 0 ]]; do
      case "$1" in
        --base) base="$2"; shift 2 ;;
        --ours) ours="$2"; shift 2 ;;
        --theirs) theirs="$2"; shift 2 ;;
        --out) out="$2"; shift 2 ;;
        *) shift ;;
      esac
    done

    # theirs genuinely absent (the id no longer exists on the landed side):
    # ours is the only content, so ours wins outright (mirrors merge-node.ts's
    # real documented behavior for an empty --theirs).
    if [[ -z "$theirs" ]]; then
      [[ -n "$out" && -n "$ours" ]] && cp -- "$ours" "$out"
      printf '{"resolved":true,"conflicts":[]}\n'
      exit 0
    fi

    declare -A BASE_V=() OURS_V=() THEIRS_V=()
    declare -a ALL_KEYS=()
    if [[ -n "$base" && -f "$base" ]]; then
      while IFS= read -r line || [[ -n "$line" ]]; do
        [[ "$line" == *:* ]] || continue
        k="${line%%:*}"; v="${line#*: }"
        [[ -n "${BASE_V[$k]+x}" ]] || BASE_V["$k"]="$v"
      done <"$base"
    fi
    if [[ -n "$ours" && -f "$ours" ]]; then
      while IFS= read -r line || [[ -n "$line" ]]; do
        [[ "$line" == *:* ]] || continue
        k="${line%%:*}"; v="${line#*: }"
        if [[ -z "${OURS_V[$k]+x}" ]]; then OURS_V["$k"]="$v"; ALL_KEYS+=("$k"); fi
      done <"$ours"
    fi
    if [[ -n "$theirs" && -f "$theirs" ]]; then
      while IFS= read -r line || [[ -n "$line" ]]; do
        [[ "$line" == *:* ]] || continue
        k="${line%%:*}"; v="${line#*: }"
        [[ -n "${THEIRS_V[$k]+x}" ]] || THEIRS_V["$k"]="$v"
        seen=0
        for existing in "${ALL_KEYS[@]:-}"; do [[ "$existing" == "$k" ]] && { seen=1; break; }; done
        [[ $seen -eq 1 ]] || ALL_KEYS+=("$k")
      done <"$theirs"
    fi

    conflicts_json="[]"
    resolved=true
    merged_lines=()
    for k in "${ALL_KEYS[@]}"; do
      have_b=0; [[ -n "${BASE_V[$k]+x}" ]] && have_b=1
      have_o=0; [[ -n "${OURS_V[$k]+x}" ]] && have_o=1
      have_t=0; [[ -n "${THEIRS_V[$k]+x}" ]] && have_t=1
      bv="${BASE_V[$k]-}"; ov="${OURS_V[$k]-}"; tv="${THEIRS_V[$k]-}"
      final=""
      if [[ $have_o -eq 1 && $have_t -eq 1 && "$ov" == "$tv" ]]; then
        final="$ov"
      elif [[ $have_b -eq 1 && $have_o -eq 1 && "$ov" == "$bv" && $have_t -eq 1 ]]; then
        final="$tv"
      elif [[ $have_b -eq 1 && $have_t -eq 1 && "$tv" == "$bv" && $have_o -eq 1 ]]; then
        final="$ov"
      elif [[ $have_o -eq 1 && $have_t -eq 0 ]]; then
        final="$ov"
      elif [[ $have_t -eq 1 && $have_o -eq 0 ]]; then
        final="$tv"
      else
        resolved=false
        conflicts_json="$(jq -c --arg field "$k" --arg ours "$ov" --arg theirs "$tv" \
          '. + [{field:$field, ours:$ours, theirs:$theirs}]' <<<"$conflicts_json")"
        continue
      fi
      merged_lines+=("$k: $final")
    done

    if [[ "$resolved" == true ]]; then
      if [[ -n "$out" ]]; then
        printf '%s\n' "${merged_lines[@]}" >"$out"
      fi
      printf '{"resolved":true,"conflicts":[]}\n'
    else
      printf '{"resolved":false,"conflicts":%s}\n' "$conflicts_json"
    fi
    exit 0
    ;;
  *)
    shift 3   # tsx, helper script path, store module path
    dir="$1"; since="$2"; reason="$3"; snap_dir="$4"; prune_csv="$5"; shift 5
    for id in "$@"; do
      [[ -f "$dir/$id.md" ]] || { echo "npx shim: unreadable node $id" >&2; exit 1; }
    done
    # The out-of-band field breakdown (mechanical-unresolved detail), appended
    # after each node's base recovery text — mirrors the real helper.
    field_breakdown=""
    if [[ -n "${GRAPH_COMMIT_RECOMMENDATION_FILE:-}" && -f "$GRAPH_COMMIT_RECOMMENDATION_FILE" ]]; then
      field_breakdown="$(cat "$GRAPH_COMMIT_RECOMMENDATION_FILE")"
    fi
    for id in "$@"; do
      if [[ ",$prune_csv," == *",$id,"* ]]; then
        rec="prune, no content snapshot, mailbox discipline"
      else
        rec="unlanded content preserved at ${snap_dir}/${id}.md; mailbox discipline"
      fi
      [[ -n "$field_breakdown" ]] && rec="$rec"$'\n\n'"$field_breakdown"
      printf 'office_hours: {reason: "%s", since: %s, recommendation: "%s"}\n' "$reason" "$since" "$rec" >>"$dir/$id.md"
      echo "graph-commit: set office_hours on $id (since=$since)" >&2
    done
    ;;
esac
SH
chmod +x "$WORK/bin/gh" "$WORK/bin/npx"

# --- Helpers ------------------------------------------------------------------
set_mode() { printf '%s' "$1" >"$MODE_FILE"; : >"$CALL_LOG"; }
gh_calls() { wc -l <"$CALL_LOG" | tr -d ' '; }
origin_show() { git -C "$ORIGIN" show "main:intentions/$1.md"; }
origin_sha() { git -C "$ORIGIN" rev-parse main; }
sync_clone() { git -C "$1" fetch -q origin main && git -C "$1" reset -q --hard FETCH_HEAD; }
edit_line() { # <clone> <id> <n> <text>
  sed -i "s/^line$3: .*/line$3: $4/" "$1/intentions/$2.md"
}
edit_field() { # <clone> <id> <field> <value> — for seed_field_node fixtures
  sed -i "s/^$3: .*/$3: $4/" "$1/intentions/$2.md"
}
scratch_refs() { git -C "$ORIGIN" for-each-ref --format='%(refname)' 'refs/heads/graph/**'; }
lock_ref_exists() { git -C "$ORIGIN" show-ref --verify --quiet refs/graph/landing-lock; }

run_gc() { # <clone> [graph-commit args...]; knobs: GC_POLL GC_TIMEOUT GC_ATTEMPTS
           # GC_LOCK_TTL GC_LOCK_POLL GC_LOCK_WAIT GC_SENTINEL
  local clone="$1"; shift
  (
    cd "$clone" || exit 99
    export PATH="$WORK/bin:$PATH"
    export GC_GH_MODE_FILE="$MODE_FILE" GC_GH_CALL_LOG="$CALL_LOG" GC_FIXTURE_DIR="$FIXTURE_DIR"
    export GRAPH_COMMIT_CHECK_POLL_SECONDS="${GC_POLL:-0}"
    export GRAPH_COMMIT_CHECK_TIMEOUT_SECONDS="${GC_TIMEOUT:-5}"
    export GRAPH_COMMIT_MAX_ATTEMPTS="${GC_ATTEMPTS:-5}"
    export GRAPH_COMMIT_LOCK_TTL_SECONDS="${GC_LOCK_TTL:-}"
    export GRAPH_COMMIT_LOCK_POLL_SECONDS="${GC_LOCK_POLL:-}"
    export GRAPH_COMMIT_LOCK_WAIT_SECONDS="${GC_LOCK_WAIT:-}"
    export GC_GH_SENTINEL_FILE="${GC_SENTINEL:-}"
    bash packages/intentionsutil/scripts/graph-commit "$@"
  )
}

# --- Case 1: happy path --------------------------------------------------------
set_mode green
edit_line "$A" t-happy 1 A-edit
out="$(run_gc "$A" -m 'test: happy' t-happy 2>&1)"; rc=$?
if [[ $rc -eq 0 ]] && origin_show t-happy | grep -q 'line1: A-edit'; then
  ok "happy path lands on main (exit 0)"
else
  no "happy path (rc=$rc)"; printf '%s\n' "$out"
fi
if [[ -z "$(scratch_refs)" ]]; then
  ok "scratch branch deleted on origin after landing"
else
  no "scratch branch left behind: $(scratch_refs)"
fi

# --- Case 2: idempotent re-run on a clean tree ----------------------------------
set_mode green
before="$(origin_sha)"
out="$(run_gc "$A" t-happy 2>&1)"; rc=$?
if [[ $rc -eq 0 && "$(origin_sha)" == "$before" ]] && grep -q 'no new changes to stage' <<<"$out"; then
  ok "idempotent re-run: exit 0, no new commit on main"
else
  no "idempotent re-run (rc=$rc)"; printf '%s\n' "$out"
fi
if [[ "$(gh_calls)" -eq 0 && -z "$(scratch_refs)" ]]; then
  ok "idempotent re-run: no-op short-circuit makes zero gh polls, no scratch branch"
else
  no "idempotent re-run: expected zero gh polls and no scratch branch (gh_calls=$(gh_calls), scratch_refs=$(scratch_refs))"
fi

# --- Case 3: non-overlapping concurrent edits auto-merge ------------------------
set_mode green
sync_clone "$A"                       # B stays stale at the seed commit
edit_line "$A" t-merge 1 A-top
run_gc "$A" t-merge >/dev/null 2>&1; rcA=$?
edit_line "$B" t-merge 12 B-bottom
out="$(run_gc "$B" t-merge 2>&1)"; rcB=$?
content="$(origin_show t-merge)"
if [[ $rcA -eq 0 && $rcB -eq 0 ]] \
   && grep -q 'line1: A-top' <<<"$content" \
   && grep -q 'line12: B-bottom' <<<"$content"; then
  ok "non-overlapping concurrent edits auto-merge; both survive on main"
else
  no "non-overlapping merge (rcA=$rcA rcB=$rcB)"; printf '%s\n' "$out"
fi

# --- Case 4: overlapping concurrent edits — fail closed, park -------------------
set_mode green
sync_clone "$A"; sync_clone "$B"
edit_line "$A" t-conflict 1 A-wins
run_gc "$A" t-conflict >/dev/null 2>&1
edit_line "$B" t-conflict 1 B-loses
out="$(run_gc "$B" t-conflict 2>&1)"; rc=$?
content="$(origin_show t-conflict)"
snap="$(sed -n 's/.*preserved at \(.*\) for the manual merge.*/\1/p' <<<"$out")"
[[ -n "$snap" ]] && SNAP_DIRS_TO_CLEAN+=("$snap")
if [[ $rc -eq 1 ]] \
   && grep -q 'concurrent-edit conflict' <<<"$out" \
   && grep -q 'line1: A-wins' <<<"$content" \
   && ! grep -q '^line1: B-loses' <<<"$content" \
   && grep -q 'office_hours' <<<"$content"; then
  ok "overlap: exit 1, other writer survives on main, office_hours park landed"
else
  no "overlap conflict handling (rc=$rc)"; printf '%s\n' "$out"; printf '%s\n' "$content"
fi
if [[ -n "$snap" && -f "$snap/t-conflict.md" ]] && grep -q 'B-loses' "$snap/t-conflict.md"; then
  ok "overlap: losing writer's content preserved in the kept snapshot dir"
else
  no "overlap snapshot preservation (snap='$snap')"
fi
if [[ -n "$snap" ]] && grep -q 'recommendation' <<<"$content" \
   && grep -q "$snap/t-conflict.md" <<<"$content" \
   && grep -q 'mailbox discipline' <<<"$content"; then
  ok "overlap: office_hours recommendation carries the snapshot path and mailbox instruction"
else
  no "overlap: recommendation missing snapshot path or mailbox instruction"; printf '%s\n' "$content"
fi

# --- Case 5: concluded check failure — immediate die, no retry burn -------------
set_mode concluded-fail
sync_clone "$A"
edit_line "$A" t-ckfail 1 never-lands
out="$(run_gc "$A" t-ckfail 2>&1)"; rc=$?
calls="$(gh_calls)"
if [[ $rc -eq 1 && "$calls" -eq 1 ]] \
   && grep -q 'concluded non-success' <<<"$out" \
   && grep -q 'not retrying' <<<"$out" \
   && ! grep -q 'attempt 2/' <<<"$out" \
   && ! grep -q 'retry later' <<<"$out"; then
  ok "concluded check failure dies immediately (1 poll, no retries, no busy-main misdiagnosis)"
else
  no "concluded check failure (rc=$rc gh_calls=$calls)"; printf '%s\n' "$out"
fi
sync_clone "$A"   # drop the never-landed local commit

# --- Case 6: gh hard failure — die with surfaced stderr after 3 polls -----------
set_mode hard-fail
sync_clone "$B"
edit_line "$B" t-ghfail 1 never-lands
out="$(run_gc "$B" t-ghfail 2>&1)"; rc=$?
calls="$(gh_calls)"
if [[ $rc -eq 1 && "$calls" -eq 3 ]] \
   && grep -q 'polling failed 3 consecutive times' <<<"$out" \
   && grep -q 'API rate limit exceeded' <<<"$out"; then
  ok "gh hard failure dies after 3 consecutive polls with gh's stderr surfaced"
else
  no "gh hard failure (rc=$rc gh_calls=$calls)"; printf '%s\n' "$out"
fi
sync_clone "$B"

# --- Case 7: pending timeout is transient — retries then busy-main --------------
set_mode pending
sync_clone "$A"
edit_line "$A" t-pending 1 stuck
out="$(export GC_POLL=1 GC_TIMEOUT=1 GC_ATTEMPTS=2; run_gc "$A" t-pending 2>&1)"; rc=$?
if [[ $rc -eq 1 ]] \
   && grep -q 'attempt 2/2' <<<"$out" \
   && grep -q 'could not land on main after 2/2 attempts' <<<"$out"; then
  ok "pending timeout stays transient: burns attempts, exits busy-main"
else
  no "pending timeout retry path (rc=$rc)"; printf '%s\n' "$out"
fi
# The terminal line must attribute the check state to the commit it was read
# on, and must name what ended the run. Without the SHA, a snapshot carried
# over from an earlier attempt (an attempt can end before any poll runs) would
# be printed as if it described this failure.
if grep -Eq 'required-check state observed on [0-9a-f]{7,}: .*acceptance=' <<<"$out" \
   && grep -q 'cause: the required checks did not report green' <<<"$out"; then
  ok "pending timeout: terminal line attributes the observed state to a SHA and names the cause"
else
  no "pending timeout terminal attribution"; printf '%s\n' "$out"
fi
sync_clone "$A"

# --- Case 8: desynced check-run status — fixed filter counts it as concluded ----
# GitHub sometimes leaves a check-run's status stuck at in_progress even after
# its conclusion is already populated (a known check-runs desync, #2457). The
# fixed --jq filter keys off .conclusion alone, so this fixture's fourth entry
# (status=in_progress, conclusion=success) still counts toward nsucc==4 and
# lands immediately instead of spinning to the busy-main timeout the
# pre-fix status=="completed"-gated filter would hit.
set_mode desynced-success
sync_clone "$A"
edit_line "$A" t-desync 1 desync-lands
out="$(run_gc "$A" t-desync 2>&1)"; rc=$?
if [[ $rc -eq 0 ]] && origin_show t-desync | grep -q 'line1: desync-lands'; then
  ok "desynced check-run (status stuck in_progress, conclusion success) still lands"
else
  no "desynced check-run handling (rc=$rc)"; printf '%s\n' "$out"
fi
sync_clone "$A"

# --- Case 9: id validation -------------------------------------------------------
set_mode green
sync_clone "$A"
edit_line "$A" v1..v2-migration 1 dotdot-ok
out="$(run_gc "$A" v1..v2-migration 2>&1)"; rc=$?
if [[ $rc -eq 0 ]] && origin_show v1..v2-migration | grep -q 'line1: dotdot-ok'; then
  ok "id with '..' substring lands end-to-end"
else
  no "dotdot-substring id (rc=$rc)"; printf '%s\n' "$out"
fi
for bad in 'a/b' 'a\b' '.' '..'; do
  run_gc "$A" "$bad" >/dev/null 2>&1; rc=$?
  if [[ $rc -eq 2 ]]; then
    ok "id '$bad' rejected with exit 2"
  else
    no "id '$bad' expected exit 2, got $rc"
  fi
done

# ---------------------------------------------------------------------------
# Cases 10-11: --prune
# ---------------------------------------------------------------------------
set_mode green

# Case 10: an ordinary edit id and a prune id land in ONE commit.
W1="$WORK/w1"
make_clone "$W1" writer-1
echo "line13: edited" >>"$W1/intentions/t-prune-edit.md"
rm -f "$W1/intentions/t-prune.md"
if out="$(run_gc "$W1" -m 'test: prune + edit' t-prune-edit --prune t-prune 2>&1)"; then
  landed_edit="$(origin_show t-prune-edit 2>/dev/null | grep -c 'line13: edited')"
  pruned_gone=1
  git -C "$ORIGIN" cat-file -e main:intentions/t-prune.md 2>/dev/null && pruned_gone=0
  if [[ "$landed_edit" -eq 1 && "$pruned_gone" -eq 1 ]]; then
    ok "prune: edit + prune land together, deletion visible on main"
  else
    no "prune: edit=$landed_edit pruned_gone=$pruned_gone"; printf '%s\n' "$out"
  fi
  # The edit and the deletion must be the SAME commit, not two commits.
  changed_paths="$(git -C "$ORIGIN" show --name-only --format= main | sort | tr '\n' ' ')"
  if [[ "$changed_paths" == *"intentions/t-prune-edit.md"* && "$changed_paths" == *"intentions/t-prune.md"* ]]; then
    ok "prune: edit + prune land in the SAME commit"
  else
    no "prune: expected one commit touching both paths, got: $changed_paths"
  fi
else
  no "prune: expected exit 0, got $? (see below)"; printf '%s\n' "$out"
fi

# Case 11: a prune id whose file is still present on disk is rejected.
W2="$WORK/w2"
make_clone "$W2" writer-2
before_sha="$(origin_sha)"
if out="$(run_gc "$W2" --prune t-prune-guard 2>&1)"; then
  no "prune guard: expected rejection when file still present on disk, got exit 0"
else
  after_sha="$(origin_sha)"
  if grep -q "still exists on disk" <<<"$out" && [[ "$before_sha" == "$after_sha" ]]; then
    ok "prune guard: rejects a prune id still present on disk, no commit landed"
  else
    no "prune guard: rejected but wrong error or main moved"; printf '%s\n' "$out"
  fi
fi

# Case 14: --prune alone (no positional id) — a pure deletion-only commit.
# This is the owed-prune backlog's actual shape (a `phase: done` node with no
# accompanying edit), distinct from case 10's mixed edit+prune: IDS is empty
# here, so ALL_IDS[0] resolves entirely from PRUNE_IDS, exercising the
# scratch-branch ref-name path and id_files_dirty()/commit_files() with no
# ordinary ids at all.
W5="$WORK/w5"
make_clone "$W5" writer-5
rm -f "$W5/intentions/t-prune-solo.md"
if out="$(run_gc "$W5" -m 'test: pure prune' --prune t-prune-solo 2>&1)"; then
  pruned_gone=1
  git -C "$ORIGIN" cat-file -e main:intentions/t-prune-solo.md 2>/dev/null && pruned_gone=0
  if [[ "$pruned_gone" -eq 1 ]]; then
    ok "pure prune: a --prune-only invocation (no positional id) lands the deletion on main"
  else
    no "pure prune: deletion did not land"; printf '%s\n' "$out"
  fi
else
  no "pure prune: expected exit 0, got $? (see below)"; printf '%s\n' "$out"
fi
if [[ -z "$(scratch_refs)" ]]; then
  ok "pure prune: scratch branch cleaned up after landing"
else
  no "pure prune: leftover scratch branch: $(scratch_refs)"
fi

# ---------------------------------------------------------------------------
# Cases 12-13: --base compare-and-swap
# ---------------------------------------------------------------------------

# Case 12: --base fresh — a blob matching origin/main's current content lands.
W3="$WORK/w3"
make_clone "$W3" writer-3
fresh_sha="$(git -C "$W3" hash-object intentions/t-base.md)"
echo "line13: writer3 edit" >>"$W3/intentions/t-base.md"
if out="$(run_gc "$W3" -m 'test: base fresh' --base "t-base=$fresh_sha" t-base 2>&1)"; then
  landed="$(origin_show t-base 2>/dev/null | grep -c 'line13: writer3 edit')"
  if [[ "$landed" -eq 1 ]]; then
    ok "base fresh: a --base matching origin/main's blob lands"
  else
    no "base fresh: landed but content missing"; printf '%s\n' "$out"
  fi
else
  no "base fresh: expected exit 0, got $? (see below)"; printf '%s\n' "$out"
fi

# Case 13: --base stale, disjoint appended lines (bare line-based fixture) —
# now auto-resolves via layer 3 instead of dying. Pre-Unit-3 this was a hard
# `die "stale base for ..."`. Since Unit 3, check_base_freshness() attempts an
# automatic structural merge (run_merge_node()) before refusing; against this
# harness's npx merge-node.ts shim (a simplified key:value three-way merge —
# see the shim's own comment), two writers appending DIFFERENT new lines
# (line13 vs line14, neither present in the other's base or landed content) is
# exactly the disjoint case the shim resolves cleanly, so this now lands
# (exit 0) rather than refusing. Cases 19-20 below cover the resolve/unresolved
# split on real seed_field_node fixtures that this bare-line fixture can no
# longer distinguish (a genuine same-line divergence is exercised by case 4,
# and a same-FIELD divergence specifically by cases 18/20).
W4="$WORK/w4"
make_clone "$W4" writer-4
stale_sha="$(git -C "$W4" hash-object intentions/t-base.md)"

# Simulate a concurrent writer landing an unrelated change to the SAME node
# on origin/main, bypassing graph-commit (representing "another session
# already committed" for fast test setup — the mechanism under test is the
# blob comparison, not how the concurrent write itself lands).
# NOTE: case 11 (above) already landed a "line13" key onto this same t-base
# node — the appended keys here must be fresh (line15/line16) or the harness's
# simplified key:value merge shim (first-occurrence-wins per file) would treat
# "line13" as an already-known key colliding with a stale duplicate rather
# than the genuinely disjoint new key this case means to exercise.
OTHER="$WORK/other"
make_clone "$OTHER" other
echo "line16: concurrent edit" >>"$OTHER/intentions/t-base.md"
git -C "$OTHER" commit -qam 'concurrent edit'
git -C "$OTHER" push -q origin main

echo "line15: writer4 edit (based on a stale read)" >>"$W4/intentions/t-base.md"
out="$(run_gc "$W4" -m 'test: base stale, disjoint fields' --base "t-base=$stale_sha" t-base 2>&1)"; rc=$?
content="$(origin_show t-base 2>/dev/null)"
if [[ $rc -eq 0 ]] \
   && grep -q 'line15: writer4 edit (based on a stale read)' <<<"$content" \
   && grep -q 'line16: concurrent edit' <<<"$content"; then
  ok "base stale, disjoint lines: layer 3 auto-resolves rather than dying, both edits land"
else
  no "base stale disjoint-lines resolve (rc=$rc)"; printf '%s\n' "$out"; printf '%s\n' "$content"
fi

# Case 15: --base manifest-file form — a file of <id>=<blobsha> lines (as
# opposed to cases 12-13's inline <id>=<blobsha> argument).
W6="$WORK/w6"
make_clone "$W6" writer-6
manifest_sha="$(git -C "$W6" hash-object intentions/t-base-manifest.md)"
manifest_file="$WORK/base-manifest.txt"
printf 't-base-manifest=%s\n' "$manifest_sha" >"$manifest_file"
echo "line13: writer6 edit" >>"$W6/intentions/t-base-manifest.md"
if out="$(run_gc "$W6" -m 'test: base manifest' --base "$manifest_file" t-base-manifest 2>&1)"; then
  landed="$(origin_show t-base-manifest 2>/dev/null | grep -c 'line13: writer6 edit')"
  if [[ "$landed" -eq 1 ]]; then
    ok "base manifest-file form: a fresh entry read from a manifest file lands"
  else
    no "base manifest-file form: landed but content missing"; printf '%s\n' "$out"
  fi
else
  no "base manifest-file form: expected exit 0, got $? (see below)"; printf '%s\n' "$out"
fi

# --- Case 16: far-ahead worktree (PR branch) — rebuild on origin/main -----------
# A PR-branch checkout whose HEAD carries a non-intentions code commit. A commit
# made on top of it is NOT intentions/-only, so the pre-fix graph-commit's
# scratch push would fail the fast-path guard and never land. The fix rebuilds
# the edit on origin/main: only the intentions/ change lands (never the code
# commit), and the worktree HEAD is restored to the PR tip.
set_mode green
W7="$WORK/w7"
make_clone "$W7" writer-7
mkdir -p "$W7/src"
echo "console.log('pr feature code')" >"$W7/src/feature.js"
git -C "$W7" add src/feature.js
git -C "$W7" commit -qm 'pr: non-intentions code change (simulated PR branch)'
far_tip="$(git -C "$W7" rev-parse HEAD)"
edit_line "$W7" t-farahead 1 farahead-edit
out="$(run_gc "$W7" -m 'test: far-ahead edit' t-farahead 2>&1)"; rc=$?
landed="$(origin_show t-farahead 2>/dev/null || true)"
main_tree="$(git -C "$ORIGIN" ls-tree -r --name-only main)"
restored="$(git -C "$W7" rev-parse HEAD)"
if [[ $rc -eq 0 ]] \
   && grep -q 'line1: farahead-edit' <<<"$landed" \
   && ! grep -q 'src/feature.js' <<<"$main_tree" \
   && [[ "$restored" == "$far_tip" ]]; then
  ok "far-ahead worktree: intentions edit lands, code commit excluded, HEAD restored to PR tip"
else
  no "far-ahead worktree (rc=$rc restored=$restored far_tip=$far_tip code-on-main=$(grep -c 'src/feature.js' <<<"$main_tree"))"; printf '%s\n' "$out"
fi

# --- Case 17: overlapping edit vs prune conflict — park recommendation covers the prune branch ---
# A rebase CONFLICT where the losing writer's commit is a --prune (delete)
# racing another writer's edit to the SAME node exercises park_write()'s
# prune-vs-edit recommendation branch (Unit 1): a pruned id has no on-disk
# snapshot, so its recommendation must say so instead of pointing at a
# (nonexistent) SNAP_DIR/<id>.md.
set_mode green
W8="$WORK/w8"; W9="$WORK/w9"
make_clone "$W8" writer-8
make_clone "$W9" writer-9
sync_clone "$W8"; sync_clone "$W9"
edit_line "$W8" t-prune-conflict 1 W8-edit
run_gc "$W8" t-prune-conflict >/dev/null 2>&1
rm -f "$W9/intentions/t-prune-conflict.md"
out="$(run_gc "$W9" --prune t-prune-conflict 2>&1)"; rc=$?
content="$(origin_show t-prune-conflict)"
if [[ $rc -eq 1 ]] \
   && grep -q 'concurrent-edit conflict' <<<"$out" \
   && grep -q 'line1: W8-edit' <<<"$content" \
   && grep -q 'office_hours' <<<"$content" \
   && grep -q 'recommendation' <<<"$content" \
   && ! grep -q 'preserved at' <<<"$content"; then
  ok "prune-vs-edit conflict: park recommendation omits a snapshot path for a pruned id"
else
  no "prune-vs-edit conflict handling (rc=$rc)"; printf '%s\n' "$out"; printf '%s\n' "$content"
fi

# --- Case 18: far-ahead worktree + --prune --------------------------------------
# A prune issued from the same far-ahead PR branch: the node is removed from
# main, the code commit is still excluded, and HEAD is restored.
set_mode green
git -C "$W7" fetch -q origin main
rm -f "$W7/intentions/t-farahead-prune.md"
far_tip2="$(git -C "$W7" rev-parse HEAD)"   # still the code-commit tip
out="$(run_gc "$W7" -m 'test: far-ahead prune' --prune t-farahead-prune 2>&1)"; rc=$?
restored2="$(git -C "$W7" rev-parse HEAD)"
main_tree2="$(git -C "$ORIGIN" ls-tree -r --name-only main)"
if [[ $rc -eq 0 ]] \
   && ! grep -q 'intentions/t-farahead-prune.md' <<<"$main_tree2" \
   && ! grep -q 'src/feature.js' <<<"$main_tree2" \
   && [[ "$restored2" == "$far_tip2" ]]; then
  ok "far-ahead worktree + --prune: node removed from main, code commit excluded, HEAD restored"
else
  no "far-ahead prune (rc=$rc restored2=$restored2 far_tip2=$far_tip2)"; printf '%s\n' "$out"
fi

# ---------------------------------------------------------------------------
# Cases 19-23: layer 2 (rebase-conflict field merge) and layer 3 (stale --base
# re-read) auto-merge, using seed_field_node's real-frontmatter fixtures.
# ---------------------------------------------------------------------------

# Case 19: layer 2 resolves a textual rebase conflict whose two sides touch
# DIFFERENT fields. fieldA and fieldB are adjacent lines in the seeded
# frontmatter, so editing each independently still produces a textual git
# CONFLICT (the diff hunks' contexts overlap) even though the fields
# themselves never collide — exactly the case run_merge_node() should resolve.
set_mode green
sync_clone "$A"; sync_clone "$B"
edit_field "$A" t-field-merge fieldA A-edit
run_gc "$A" t-field-merge >/dev/null 2>&1
edit_field "$B" t-field-merge fieldB B-edit
out="$(run_gc "$B" t-field-merge 2>&1)"; rc=$?
content="$(origin_show t-field-merge)"
if [[ $rc -eq 0 ]] \
   && grep -q 'layer 2/3 auto-resolved a concurrent-edit divergence' <<<"$out" \
   && grep -q 'fieldA: A-edit' <<<"$content" \
   && grep -q 'fieldB: B-edit' <<<"$content"; then
  ok "layer 2: non-overlapping field-level conflict auto-merges, both writers' edits land"
else
  no "layer 2 field-merge (rc=$rc)"; printf '%s\n' "$out"; printf '%s\n' "$content"
fi

# Case 20: layer 2 leaves a textual conflict whose two sides touch the SAME
# field mechanical-unresolved: exit 1, office_hours.reason carries the stable
# "mechanical-unresolved" marker, and the recommendation names both values.
set_mode green
sync_clone "$A"; sync_clone "$B"
edit_field "$A" t-field-conflict sentinel A-value
run_gc "$A" t-field-conflict >/dev/null 2>&1
edit_field "$B" t-field-conflict sentinel B-value
out="$(run_gc "$B" t-field-conflict 2>&1)"; rc=$?
content="$(origin_show t-field-conflict)"
snap="$(sed -n 's/.*preserved at \(.*\) for the manual merge.*/\1/p' <<<"$out")"
[[ -n "$snap" ]] && SNAP_DIRS_TO_CLEAN+=("$snap")
if [[ $rc -eq 1 ]] \
   && grep -q 'mechanical-unresolved' <<<"$content" \
   && grep -q 'A-value' <<<"$content" \
   && grep -q 'B-value' <<<"$content"; then
  ok "layer 2: same-field divergence stays mechanical-unresolved, both values named in the recommendation"
else
  no "layer 2 field-conflict (rc=$rc)"; printf '%s\n' "$out"; printf '%s\n' "$content"
fi

# Case 21: layer 3 (--base stale re-read) auto-resolves a stale --base whose
# delta touches a DIFFERENT field than the concurrently-landed write.
set_mode green
W21="$WORK/w21"
make_clone "$W21" writer-21
base_ok_sha="$(git -C "$W21" hash-object intentions/t-field-base-ok.md)"
edit_field "$W21" t-field-base-ok fieldA writer8-edit

OTHER2="$WORK/other2"
make_clone "$OTHER2" other2
edit_field "$OTHER2" t-field-base-ok fieldB concurrent-edit
git -C "$OTHER2" commit -qam 'concurrent field edit'
git -C "$OTHER2" push -q origin main

out="$(run_gc "$W21" -m 'test: base field resolve' --base "t-field-base-ok=$base_ok_sha" t-field-base-ok 2>&1)"; rc=$?
content="$(origin_show t-field-base-ok 2>/dev/null)"
if [[ $rc -eq 0 ]] \
   && grep -q 'fieldA: writer8-edit' <<<"$content" \
   && grep -q 'fieldB: concurrent-edit' <<<"$content"; then
  ok "layer 3: stale --base auto-resolves a disjoint-field divergence, both edits land"
else
  no "layer 3 base resolve (rc=$rc)"; printf '%s\n' "$out"; printf '%s\n' "$content"
fi

# Case 22: layer 3 leaves a stale --base SAME-field divergence
# mechanical-unresolved: exit 1, office_hours.reason carries
# "mechanical-unresolved", both values are named in the recommendation.
set_mode green
W22="$WORK/w22"
make_clone "$W22" writer-22
base_bad_sha="$(git -C "$W22" hash-object intentions/t-field-base-bad.md)"
edit_field "$W22" t-field-base-bad sentinel writer9-value

OTHER3="$WORK/other3"
make_clone "$OTHER3" other3
edit_field "$OTHER3" t-field-base-bad sentinel concurrent-value
git -C "$OTHER3" commit -qam 'concurrent same-field edit'
git -C "$OTHER3" push -q origin main

out="$(run_gc "$W22" -m 'test: base field conflict' --base "t-field-base-bad=$base_bad_sha" t-field-base-bad 2>&1)"; rc=$?
content="$(origin_show t-field-base-bad 2>/dev/null)"
calls="$(gh_calls)"
snap="$(sed -n 's/.*preserved at \(.*\) for the manual merge.*/\1/p' <<<"$out")"
[[ -n "$snap" ]] && SNAP_DIRS_TO_CLEAN+=("$snap")
if [[ $rc -eq 1 ]] \
   && grep -q 'mechanical-unresolved' <<<"$content" \
   && grep -q 'writer9-value' <<<"$content" \
   && grep -q 'concurrent-value' <<<"$content" \
   && [[ "$calls" -eq 1 ]] \
   && [[ -n "$snap" && -f "$snap/t-field-base-bad.md" ]] \
   && grep -q 'writer9-value' "$snap/t-field-base-bad.md"; then
  ok "layer 3: stale --base same-field divergence stays mechanical-unresolved (parks via a single stamp poll, no prior retry loop), and SNAP_DIR retains the writer's original node content"
else
  no "layer 3 base conflict (rc=$rc calls=$calls)"; printf '%s\n' "$out"; printf '%s\n' "$content"
fi

# Case 23: a --prune id racing a concurrent edit to the same node is excluded
# from the layer-2 merge attempt entirely (a deletion has nothing to
# structurally merge against) — no false "auto-resolved" claim, parks with the
# prune-specific sentinel note.
set_mode green
sync_clone "$A"; sync_clone "$B"
edit_line "$A" t-prune-conflict 1 landed-edit
run_gc "$A" t-prune-conflict >/dev/null 2>&1
rm -f "$B/intentions/t-prune-conflict.md"
out="$(run_gc "$B" --prune t-prune-conflict 2>&1)"; rc=$?
content="$(origin_show t-prune-conflict 2>/dev/null)"
snap="$(sed -n 's/.*preserved at \(.*\) for the manual merge.*/\1/p' <<<"$out")"
[[ -n "$snap" ]] && SNAP_DIRS_TO_CLEAN+=("$snap")
if [[ $rc -eq 1 ]] \
   && ! grep -q 'layer 2/3 auto-resolved' <<<"$out" \
   && grep -q 'mechanical-unresolved' <<<"$content" \
   && grep -q 'prune vs. concurrent edit' <<<"$content" \
   && grep -q 'landed-edit' <<<"$content"; then
  ok "prune-vs-edit: excluded from the layer-2 merge attempt, parks with the prune-specific reason"
else
  no "prune-vs-edit exclusion (rc=$rc)"; printf '%s\n' "$out"; printf '%s\n' "$content"
fi

# --- Case 24: unrelated dirty tracked file — clear pre-flight error, no rebase attempted ---
set_mode green
W10="$WORK/w10"
make_clone "$W10" writer-10
sync_clone "$W10"
edit_line "$W10" t-dirty-preflight 1 dirty-edit
echo "unrelated local change" >>"$W10/packages/intentionsutil/src/store.js"
before_sha="$(origin_sha)"
out="$(run_gc "$W10" t-dirty-preflight 2>&1)"; rc=$?
after_sha="$(origin_sha)"
if [[ $rc -eq 1 ]] \
   && grep -q 'unrelated dirty tracked file' <<<"$out" \
   && grep -q 'store.js' <<<"$out" \
   && [[ "$after_sha" == "$before_sha" ]] \
   && [[ "$(gh_calls)" -eq 0 ]]; then
  ok "unrelated dirty tracked file: clear pre-flight error names the file, no rebase/CI attempted, main untouched"
else
  no "unrelated dirty tracked file pre-flight (rc=$rc)"; printf '%s\n' "$out"
fi

# --- Case 25: -C targeting from an unrelated cwd --------------------------------
# The graph-commit script FILE lives inside w16's checkout, but the invocation
# passes `-C` pointing at a DIFFERENT clone (w17), from a cwd that is neither.
# Pre-fix, REPO_ROOT was derived from the script's own on-disk location
# (SCRIPT_DIR-climbing), so this would have silently landed in w16 regardless
# of -C or cwd. Post-fix, REPO_ROOT is resolved from -C, so the edit must land
# via w17's tree.
set_mode green
W16="$WORK/w16"; make_clone "$W16" writer-16   # only the script FILE's location
W17="$WORK/w17"; make_clone "$W17" writer-17   # the actual -C target
edit_line "$W17" t-cwd-target 1 target-edit-via-C
UNRELATED_DIR="$WORK/unrelated-cwd"
mkdir -p "$UNRELATED_DIR"
out="$(
  cd "$UNRELATED_DIR" || exit 99
  export PATH="$WORK/bin:$PATH"
  export GC_GH_MODE_FILE="$MODE_FILE" GC_GH_CALL_LOG="$CALL_LOG" GC_FIXTURE_DIR="$FIXTURE_DIR"
  export GRAPH_COMMIT_CHECK_POLL_SECONDS=0 GRAPH_COMMIT_CHECK_TIMEOUT_SECONDS=5 GRAPH_COMMIT_MAX_ATTEMPTS=5
  bash "$W16/packages/intentionsutil/scripts/graph-commit" -C "$W17" -m 'test: -C from unrelated cwd' t-cwd-target 2>&1
)"; rc=$?
if [[ $rc -eq 0 ]] && origin_show t-cwd-target | grep -q 'line1: target-edit-via-C'; then
  ok "-C targeting: script physically inside w16, targeting w17 via -C from an unrelated cwd, lands in w17's repo"
else
  no "-C targeting from unrelated cwd (rc=$rc)"; printf '%s\n' "$out"
fi

# --- Case 26: no-repo error -------------------------------------------------------
# No `-C` given, invoked from a cwd that is not inside any git repository at
# all (a plain mktemp -d, never `git init`'d). Must die loudly naming the
# problem — never silently fall back to the script's own on-disk checkout.
NOREPO_DIR="$WORK/no-repo-dir"
mkdir -p "$NOREPO_DIR"
out="$(
  cd "$NOREPO_DIR" || exit 99
  export PATH="$WORK/bin:$PATH"
  export GC_GH_MODE_FILE="$MODE_FILE" GC_GH_CALL_LOG="$CALL_LOG" GC_FIXTURE_DIR="$FIXTURE_DIR"
  export GRAPH_COMMIT_CHECK_POLL_SECONDS=0 GRAPH_COMMIT_CHECK_TIMEOUT_SECONDS=5 GRAPH_COMMIT_MAX_ATTEMPTS=5
  bash "$A/packages/intentionsutil/scripts/graph-commit" -m 'test: no repo' t-happy 2>&1
)"; rc=$?
if [[ $rc -ne 0 ]] && grep -q 'not inside a git repository' <<<"$out"; then
  ok "no-repo error: cwd outside any git repository dies with a clear message, no silent fallback"
else
  no "no-repo error (rc=$rc)"; printf '%s\n' "$out"
fi

# --- Case 27: fail-loud guard, differing blob -------------------------------------
# A clone that never edited t-fail-loud-diff (nothing staged for it) while
# origin/main has since advanced with a DIFFERENT edit to that same id (a
# stale clone/checkout). Under caller-derived repo resolution this can only
# mean the wrong checkout is targeted, so graph-commit must die loudly rather
# than emit the false "landed" success the old script-location-derived
# resolution risked.
set_mode green
W13="$WORK/w13"; make_clone "$W13" writer-13   # stays at the seed tip — never synced
OTHER4="$WORK/other4"; make_clone "$OTHER4" other4
edit_line "$OTHER4" t-fail-loud-diff 1 concurrent-landed
git -C "$OTHER4" commit -qam 'concurrent edit lands on origin, unrelated to w13'
git -C "$OTHER4" push -q origin main
before_sha="$(origin_sha)"
out="$(run_gc "$W13" t-fail-loud-diff 2>&1)"; rc=$?
after_sha="$(origin_sha)"
if [[ $rc -ne 0 ]] \
   && grep -q 'mis-pointed -C/--repo' <<<"$out" \
   && ! grep -q 'landed t-fail-loud-diff on main' <<<"$out" \
   && [[ "$after_sha" == "$before_sha" ]]; then
  ok "fail-loud guard: differing blob vs origin/main with nothing staged dies loudly, never lands"
else
  no "fail-loud guard differing-blob (rc=$rc)"; printf '%s\n' "$out"
fi

# --- Case 28: fail-loud guard, benign equal-blob ----------------------------------
# A clone synced exactly to origin/main's current tip: nothing staged, and the
# local blob for the id already EQUALS origin/main's blob (the already-landed
# / already-at-HEAD case). This must proceed benignly — same "no new changes
# to stage" message as case 2, no die.
set_mode green
W15="$WORK/w15"; make_clone "$W15" writer-15
sync_clone "$W15"   # now bit-for-bit at origin/main's tip
before_sha="$(origin_sha)"
out="$(run_gc "$W15" t-happy 2>&1)"; rc=$?
after_sha="$(origin_sha)"
if [[ $rc -eq 0 ]] \
   && grep -q 'no new changes to stage' <<<"$out" \
   && ! grep -q 'mis-pointed' <<<"$out" \
   && [[ "$after_sha" == "$before_sha" ]]; then
  ok "fail-loud guard: benign equal-blob (already at origin/main's tip) proceeds without error"
else
  no "fail-loud guard benign-equal-blob (rc=$rc)"; printf '%s\n' "$out"
fi
if [[ "$(gh_calls)" -eq 0 ]]; then
  ok "fail-loud guard benign-equal-blob: no-op short-circuit makes zero gh polls"
else
  no "fail-loud guard benign-equal-blob: expected zero gh polls (gh_calls=$(gh_calls))"
fi

# --- Case 29: contention is now cheap, not exhausting -----------------------
set_mode blocked-green
W18="$WORK/w18"; W19="$WORK/w19"
make_clone "$W18" writer-18
make_clone "$W19" writer-19
edit_line "$W18" t-lock-contend 1 A-top
edit_line "$W19" t-lock-contend 12 B-bottom
SENTINEL="$WORK/lock-sentinel-29"; rm -f "$SENTINEL"
outA="$WORK/out-29-a.log"; outB="$WORK/out-29-b.log"
( GC_SENTINEL="$SENTINEL" run_gc "$W18" -m 'test: lock contend A' t-lock-contend >"$outA" 2>&1; echo $? >"$WORK/rc-29-a" ) &
pidA=$!
# Wait (bounded poll) for A to have made its gh call (now blocked inside the
# shim on the sentinel) — this guarantees A already holds the lock and is
# parked in await_checks(), so the reset+start-B sequence below cannot race
# against A's own call landing in the log after the reset.
claimed=0
for _ in $(seq 1 100); do
  [[ "$(gh_calls)" -ge 1 ]] && { claimed=1; break; }
  sleep 0.1
done
if [[ "$claimed" -ne 1 ]]; then
  no "lock contend: writer A never reached await_checks (no gh call observed)"
  rm -f "$SENTINEL"; wait "$pidA" 2>/dev/null
else
  : >"$CALL_LOG"   # from here, CALL_LOG counts only B's calls
  ( GC_LOCK_POLL=1 GC_SENTINEL="$SENTINEL" run_gc "$W19" -m 'test: lock contend B' t-lock-contend >"$outB" 2>&1; echo $? >"$WORK/rc-29-b" ) &
  pidB=$!
  sleep 1   # give B a moment to attempt (and fail) to claim the held lock
  callsB_while_blocked="$(gh_calls)"
  : >"$SENTINEL"   # release A
  wait "$pidA"; rcA="$(cat "$WORK/rc-29-a")"
  wait "$pidB"; rcB="$(cat "$WORK/rc-29-b")"
  callsB_final="$(gh_calls)"
  content="$(origin_show t-lock-contend)"
  if [[ "$callsB_while_blocked" -eq 0 && "$rcA" -eq 0 && "$rcB" -eq 0 && "$callsB_final" -eq 1 ]] \
     && grep -q 'line1: A-top' <<<"$content" && grep -q 'line12: B-bottom' <<<"$content"; then
    ok "lock contend: B makes 0 polls while A holds the lock, then lands in exactly 1 poll cycle"
  else
    no "lock contend: callsB_while_blocked=$callsB_while_blocked rcA=$rcA rcB=$rcB callsB_final=$callsB_final"
    printf '%s\n' "$(cat "$outA" 2>/dev/null)" "$(cat "$outB" 2>/dev/null)"
  fi
fi
rm -f "$SENTINEL"

plant_lock() { # <expiry_unix_ts> <holder>
  local expiry="$1" holder="$2" sha
  sha="$(git -C "$ORIGIN" commit-tree 4b825dc642cb6eb9a060e54bf8d69288fbee4904 \
    -m "graph-commit-lock v1" -m "holder=$holder expiry=$expiry")"
  # Fail loudly: an empty sha here means no lock gets planted, which silently
  # turns the steal/wait cases into vacuous passes rather than failures.
  if [[ -z "$sha" ]]; then
    echo "plant_lock: commit-tree produced no sha in $ORIGIN" >&2
    exit 1
  fi
  git -C "$ORIGIN" update-ref refs/graph/landing-lock "$sha"
}

# --- Case 30: dead-holder steal ----------------------------------------------
set_mode green
past_expiry=$(( $(date +%s) - 60 ))
plant_lock "$past_expiry" dead-holder-test
W20="$WORK/w20"
make_clone "$W20" writer-20
edit_line "$W20" t-lock-steal 1 steal-lands
start_ts=$(date +%s)
out="$(GC_LOCK_POLL=1 run_gc "$W20" -m 'test: dead-holder steal' t-lock-steal 2>&1)"; rc=$?
elapsed=$(( $(date +%s) - start_ts ))
if [[ $rc -eq 0 ]] && origin_show t-lock-steal | grep -q 'line1: steal-lands' && [[ "$elapsed" -le 10 ]]; then
  ok "dead-holder steal: expired foreign lock is stolen and lands promptly (${elapsed}s)"
else
  no "dead-holder steal (rc=$rc elapsed=${elapsed}s)"; printf '%s\n' "$out"
fi

# --- Case 31: live-holder wait (no premature steal) --------------------------
set_mode green
future_expiry=$(( $(date +%s) + 3 ))
plant_lock "$future_expiry" live-holder-test
planted_sha="$(git -C "$ORIGIN" for-each-ref --format='%(objectname)' refs/graph/landing-lock)"
W11="$WORK/w11"
make_clone "$W11" writer-11
edit_line "$W11" t-lock-wait 1 wait-then-lands
outfile="$WORK/out-31.log"
start_ts=$(date +%s)
( GC_LOCK_POLL=1 run_gc "$W11" -m 'test: live-holder wait' t-lock-wait >"$outfile" 2>&1; echo $? >"$WORK/rc-31" ) &
pid20=$!
sleep 1
current_sha="$(git -C "$ORIGIN" for-each-ref --format='%(objectname)' refs/graph/landing-lock)"
no_premature_steal=0
[[ "$current_sha" == "$planted_sha" ]] && no_premature_steal=1
wait "$pid20"
end_ts=$(date +%s)
elapsed=$(( end_ts - start_ts ))
rc="$(cat "$WORK/rc-31")"
out="$(cat "$outfile")"
if [[ "$no_premature_steal" -eq 1 && $rc -eq 0 && "$elapsed" -ge 2 ]] \
   && origin_show t-lock-wait | grep -q 'line1: wait-then-lands'; then
  ok "live-holder wait: does not steal before the planted expiry (${elapsed}s elapsed), lands once it passes"
else
  no "live-holder wait (no_premature_steal=$no_premature_steal rc=$rc elapsed=${elapsed}s)"; printf '%s\n' "$out"
fi

# --- Case 32: lock-ref hygiene ------------------------------------------------
set_mode green
W12="$WORK/w12"
make_clone "$W12" writer-12
edit_line "$W12" t-lock-hygiene 1 hygiene-lands
out="$(run_gc "$W12" -m 'test: lock hygiene' t-lock-hygiene 2>&1)"; rc=$?
if [[ $rc -eq 0 ]] && ! lock_ref_exists; then
  ok "lock hygiene: refs/graph/landing-lock absent on origin after a normal successful landing"
else
  no "lock hygiene: rc=$rc"; printf '%s\n' "$out"
fi
if ! git -C "$ORIGIN" for-each-ref --format='%(refname)' 'refs/heads/graph/**' | grep -q landing-lock; then
  ok "lock hygiene: refs/heads/graph/** never lists the landing-lock ref (disjoint namespaces)"
else
  no "lock hygiene: landing-lock ref leaked into refs/heads/graph/**"
fi

# --- Case 33: --expect is transparent on the happy path -----------------------
# The caller hashes the content it just wrote in its OWN checkout and pins it.
# The resolved repo is that same checkout, so the assertion holds and the edit
# lands exactly as it would without --expect.
set_mode green
W33="$WORK/w33"; make_clone "$W33" writer-33
sync_clone "$W33"
edit_line "$W33" t-expect-happy 1 expect-happy-lands
expect_sha="$(git -C "$W33" hash-object -- intentions/t-expect-happy.md)"
out="$(run_gc "$W33" -m 'test: expect happy' --expect "t-expect-happy=$expect_sha" t-expect-happy 2>&1)"; rc=$?
if [[ $rc -eq 0 ]] && origin_show t-expect-happy | grep -q 'line1: expect-happy-lands'; then
  ok "--expect happy path: matching blob assertion is transparent, edit lands"
else
  no "--expect happy path (rc=$rc)"; printf '%s\n' "$out"
fi

# --- Case 34: --expect catches the equal-blob wrong-repo case -------------------
# The exact hole case 28 leaves open. This clone is bit-for-bit at origin/main
# and has nothing staged, so the nothing-staged guard sees local_blob ==
# main_blob and proceeds benignly ("no new changes to stage" + "landed") — a
# false success when the caller's real edit lives in a DIFFERENT checkout.
# With --expect naming the content the caller actually wrote, graph-commit must
# refuse instead.
set_mode green
W34="$WORK/w34"; make_clone "$W34" writer-34
sync_clone "$W34"   # bit-for-bit at origin/main, nothing staged
elsewhere_sha="$(printf 'content that lives in some OTHER checkout\n' | git -C "$W34" hash-object --stdin)"
before_sha="$(origin_sha)"
out="$(run_gc "$W34" -m 'test: expect wrong repo' --expect "t-expect-wrong-repo=$elsewhere_sha" t-expect-wrong-repo 2>&1)"; rc=$?
after_sha="$(origin_sha)"
# The assertion greps an --expect-SPECIFIC substring. 'mis-pointed -C/--repo'
# appears in BOTH the --expect die and the pre-existing nothing-staged guard
# (which case 27 greps with exactly that string), so it cannot tell the two
# apart — and this case exists precisely to prove --expect fired where the
# nothing-staged guard structurally could not.
if [[ $rc -ne 0 ]] \
   && grep -q 'does not hold the content the caller asserted' <<<"$out" \
   && ! grep -q 'landed t-expect-wrong-repo on main' <<<"$out" \
   && [[ "$after_sha" == "$before_sha" ]]; then
  ok "--expect: equal-blob wrong-repo invocation dies loudly, never emits a false landed"
else
  no "--expect wrong-repo (rc=$rc)"; printf '%s\n' "$out"
fi

# --- Case 35: --expect on a --prune id is a usage error ------------------------
# A deletion has no content to assert, so pinning one is a caller mistake.
set_mode green
W35="$WORK/w35"; make_clone "$W35" writer-35
sync_clone "$W35"
prune_sha="$(git -C "$W35" hash-object -- intentions/t-expect-prune.md)"
rm -f "$W35/intentions/t-expect-prune.md"   # --prune requires the file gone on disk
before_sha="$(origin_sha)"
out="$(run_gc "$W35" -m 'test: expect prune' --prune t-expect-prune --expect "t-expect-prune=$prune_sha" 2>&1)"; rc=$?
after_sha="$(origin_sha)"
if [[ $rc -eq 2 ]] \
   && grep -q 'no content to assert' <<<"$out" \
   && [[ "$after_sha" == "$before_sha" ]]; then
  ok "--expect on a --prune id is a usage error (exit 2), origin untouched"
else
  no "--expect on a prune id (rc=$rc)"; printf '%s\n' "$out"
fi

# --- Case 36: a pre-existing rebase is refused up front -------------------------
# graph-commit must not run on a mid-operation worktree. The refusal runs before
# the EXIT trap is installed, precisely so this caller-owned rebase survives the
# refusal untouched (case 37's cleanup abort would otherwise destroy it).
set_mode green
W36="$WORK/w36"; make_clone "$W36" writer-36
sync_clone "$W36"
OTHER36="$WORK/other36"; make_clone "$OTHER36" other36
sync_clone "$OTHER36"
edit_line "$OTHER36" t-preexist-conflict 1 landed-remote
git -C "$OTHER36" commit -qam 'concurrent edit lands on origin (case 36 fixture)'
git -C "$OTHER36" push -q origin main
# W36 is now stale: give it a conflicting local commit and start the rebase that
# stops on it, leaving a live rebase state dir and a detached HEAD.
edit_line "$W36" t-preexist-conflict 1 local-side
git -C "$W36" commit -qam 'local conflicting commit (case 36 fixture)'
git -C "$W36" fetch -q origin main
git -C "$W36" rebase FETCH_HEAD >/dev/null 2>&1
rebase_started=0
[[ -d "$W36/.git/rebase-merge" || -d "$W36/.git/rebase-apply" ]] && rebase_started=1
# An unrelated node edit, so the invocation would otherwise be a normal landing.
edit_line "$W36" t-preexist-rebase 1 should-never-land
set_mode green   # resets the gh call log
before_sha="$(origin_sha)"
out="$(run_gc "$W36" -m 'test: pre-existing rebase' t-preexist-rebase 2>&1)"; rc=$?
after_sha="$(origin_sha)"
if [[ "$rebase_started" -eq 1 && $rc -ne 0 ]] \
   && grep -q 'a rebase is already in progress' <<<"$out" \
   && [[ "$after_sha" == "$before_sha" ]] \
   && [[ "$(gh_calls)" -eq 0 ]]; then
  ok "pre-existing rebase: refused up front, main untouched, zero gh calls"
else
  no "pre-existing rebase refusal (rebase_started=$rebase_started rc=$rc gh_calls=$(gh_calls))"; printf '%s\n' "$out"
fi
# The caller's rebase must still be there — the refusal aborts nothing.
if [[ -d "$W36/.git/rebase-merge" || -d "$W36/.git/rebase-apply" ]]; then
  ok "pre-existing rebase: the caller's own rebase is left in progress, not aborted"
else
  no "pre-existing rebase: the caller's rebase was destroyed by the refusal"
fi
git -C "$W36" rebase --abort >/dev/null 2>&1

# --- Case 37: a rebase this run stranded is aborted by cleanup() ----------------
# End-to-end (not the sourced-function fallback): the run is driven down a real
# die() that fires while `git pull --rebase origin main`'s conflict is still
# live. The lever is try_layer2_resolve()'s broken-staging-invariant die — an
# EXTRA local commit touching a DIFFERENT node id conflicts on the rebase, and
# that conflicted path is outside this invocation's node set, so layer 2 dies
# instead of reaching its own explicit `git rebase --abort`. Only cleanup() can
# clear the rebase on this path. (The extra commit is intentions/-only, so
# ensure_intentions_only_base() leaves the worktree alone and the commit
# survives to be replayed.)
set_mode green
W37="$WORK/w37"; make_clone "$W37" writer-37
sync_clone "$W37"
OTHER37="$WORK/other37"; make_clone "$OTHER37" other37
sync_clone "$OTHER37"
edit_line "$OTHER37" t-strand-other 1 landed-remote
git -C "$OTHER37" commit -qam 'concurrent edit lands on origin (case 37 fixture)'
git -C "$OTHER37" push -q origin main
edit_line "$W37" t-strand-other 1 local-strand
git -C "$W37" commit -qam 'local conflicting commit on an out-of-set node (case 37 fixture)'
edit_line "$W37" t-strand-main 1 strand-edit   # the node actually passed to graph-commit
before_sha="$(origin_sha)"
out="$(run_gc "$W37" -m 'test: stranded rebase' t-strand-main 2>&1)"; rc=$?
after_sha="$(origin_sha)"
if [[ $rc -ne 0 ]] \
   && grep -q 'unexpected conflicted path' <<<"$out" \
   && [[ "$after_sha" == "$before_sha" ]]; then
  ok "stranded rebase: the run dies mid-rebase on the broken-staging-invariant path"
else
  no "stranded rebase setup (rc=$rc)"; printf '%s\n' "$out"
fi
if [[ ! -d "$W37/.git/rebase-merge" && ! -d "$W37/.git/rebase-apply" ]] \
   && [[ "$(git -C "$W37" symbolic-ref -q HEAD)" == "refs/heads/main" ]] \
   && git -C "$W37" show HEAD:intentions/t-strand-other.md | grep -q 'line1: local-strand'; then
  ok "stranded rebase: cleanup() aborted it — no state dir, HEAD reattached, local commits intact"
else
  no "stranded rebase not aborted by cleanup (HEAD=$(git -C "$W37" symbolic-ref -q HEAD))"; printf '%s\n' "$out"
fi

# --- Case 38: duplicate green rows still land --------------------------------
set_mode duplicate-rows
W38="$WORK/w38"
make_clone "$W38" writer-38
edit_line "$W38" t-dup-rows 1 dup-rows-land
out="$(run_gc "$W38" -m 'test: duplicate rows' t-dup-rows 2>&1)"; rc=$?
if [[ $rc -eq 0 ]] && origin_show t-dup-rows | grep -q 'line1: dup-rows-land' \
   && ! grep -q 'retry later' <<<"$out"; then
  ok "duplicate green rows per required name still land (distinct-context gate)"
else
  no "duplicate green rows (rc=$rc)"; printf '%s\n' "$out"
fi

# --- Case 39: duplicated rows do not paper over a missing context ------------
set_mode partial-duplicate
W39="$WORK/w39"
make_clone "$W39" writer-39
edit_line "$W39" t-partial-dup 1 must-not-land
before="$(origin_sha)"
out="$(export GC_POLL=0 GC_TIMEOUT=1 GC_ATTEMPTS=1; run_gc "$W39" -m 'test: partial dup' t-partial-dup 2>&1)"; rc=$?
if [[ $rc -eq 1 && "$(origin_sha)" == "$before" ]] \
   && grep -q 'acceptance=absent' <<<"$out"; then
  ok "duplicated rows do not satisfy the gate when a required context is absent"
else
  no "partial-duplicate gate (rc=$rc)"; printf '%s\n' "$out"
fi
sync_clone "$W39"   # drop the never-landed local commit

# --- Case 40: a stale failed row superseded by a newer success lands ---------
set_mode stale-fail-then-green
W40="$WORK/w40"
make_clone "$W40" writer-40
edit_line "$W40" t-stale-fail 1 newest-run-wins
out="$(run_gc "$W40" -m 'test: stale fail then green' t-stale-fail 2>&1)"; rc=$?
if [[ $rc -eq 0 ]] && origin_show t-stale-fail | grep -q 'line1: newest-run-wins' \
   && ! grep -q 'concluded non-success' <<<"$out"; then
  ok "stale failed row superseded by a newer success lands (newest run per name)"
else
  no "stale-fail-then-green (rc=$rc)"; printf '%s\n' "$out"
fi

# --- Case 41: no-op short-circuit exits 0 even when checks are unusable ------
# A clone synced exactly to origin/main's tip, invoked on an existing id with
# nothing edited, while gh is in hard-fail mode (every call exits 1). If the
# no-op guard did not short-circuit before the poller, this would die with
# "polling failed" instead of landing (a genuine no-op) cleanly.
set_mode hard-fail
W41="$WORK/w41"
make_clone "$W41" writer-41
sync_clone "$W41"   # now bit-for-bit at origin/main's tip
before_sha="$(origin_sha)"
out="$(run_gc "$W41" t-happy 2>&1)"; rc=$?
after_sha="$(origin_sha)"
calls="$(gh_calls)"
if [[ $rc -eq 0 ]] \
   && ! grep -q 'polling failed' <<<"$out" \
   && [[ "$calls" -eq 0 ]] \
   && [[ "$after_sha" == "$before_sha" ]]; then
  ok "no-op short-circuit exits 0 with zero gh polls even when checks are unusable (hard-fail mode)"
else
  no "no-op short-circuit under hard-fail (rc=$rc gh_calls=$calls)"; printf '%s\n' "$out"
fi

# --- Case 42: lock-wait exhaustion names the lock, not a check observation ---
# A foreign lock with a far-future expiry is never stolen, so the writer exits
# the attempt loop having made ZERO check-run polls. The terminal message must
# then name the landing lock as the cause and state plainly that no check state
# was ever observed — never print a check-state snapshot (which, before
# LAST_CHECK_SHA, could only have come from an unrelated earlier attempt).
# Reuses the t-lock-wait node on a different line; this run must not land.
set_mode green
blocking_expiry=$(( $(date +%s) + 3600 ))
plant_lock "$blocking_expiry" blocking-holder-test
W42="$WORK/w42"
make_clone "$W42" writer-42
edit_line "$W42" t-lock-wait 5 must-not-land
before="$(origin_sha)"
out="$(export GC_LOCK_POLL=1 GC_LOCK_WAIT=1 GC_ATTEMPTS=1; run_gc "$W42" -m 'test: lock wait exhausted' t-lock-wait 2>&1)"; rc=$?
calls="$(gh_calls)"
if [[ $rc -eq 1 && "$(origin_sha)" == "$before" && "$calls" -eq 0 ]] \
   && grep -q 'could not land on main after 1/1 attempts' <<<"$out" \
   && grep -q 'cause: the landing lock was not acquired' <<<"$out" \
   && grep -q 'required-check state was never observed' <<<"$out" \
   && ! grep -q 'required-check state observed on' <<<"$out"; then
  ok "lock-wait exhaustion: names the landing lock as the cause, reports no check observation (0 polls)"
else
  no "lock-wait exhaustion diagnostic (rc=$rc gh_calls=$calls origin_moved=$([[ "$(origin_sha)" == "$before" ]] && echo no || echo yes))"
  printf '%s\n' "$out"
fi
git -C "$ORIGIN" update-ref -d refs/graph/landing-lock

# --- No scratch branches left behind anywhere ------------------------------------
if [[ -z "$(scratch_refs)" ]]; then
  ok "no graph/** scratch branches remain on origin after all cases"
else
  no "leftover scratch branches: $(scratch_refs)"
fi

echo
echo "passed: $PASS  failed: $FAIL"
[[ $FAIL -eq 0 ]] || exit 1
exit 0
