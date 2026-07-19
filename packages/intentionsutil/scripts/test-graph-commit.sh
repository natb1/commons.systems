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
#   2. idempotent re-run on a clean tree: exit 0, no new commit on main
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
#      attempts and exits with the busy-main error
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
#  13. --base stale: a --base entry pointing at a blob origin/main no longer
#      has is refused (no commit lands, no rebase-retry burned)
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
          t-farahead t-farahead-prune t-prune-conflict; do
  seed_node "$id"
done
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
# npx shim: emulates `npx tsx <helper> <storeModule> <intentionsDir> <since>
# <reason> <snapDir> <pruneCsv> <id...>` (graph-commit's park_write) without
# node. Mirrors the real helper's two-pass shape: verify every id is readable
# first, then write all; fakes a recommendation string per-id distinguishing a
# pruned id (no snapshot) from an ordinary edit id (snapshot path included) so
# tests can assert on the distinction without needing the real store.ts.
[[ "$1" == "tsx" ]] || { echo "npx shim: unexpected invocation: $*" >&2; exit 1; }
shift 3   # tsx, helper script path, store module path
dir="$1"; since="$2"; reason="$3"; snap_dir="$4"; prune_csv="$5"; shift 5
for id in "$@"; do
  [[ -f "$dir/$id.md" ]] || { echo "npx shim: unreadable node $id" >&2; exit 1; }
done
for id in "$@"; do
  if [[ ",$prune_csv," == *",$id,"* ]]; then
    rec="prune, no content snapshot, mailbox discipline"
  else
    rec="unlanded content preserved at ${snap_dir}/${id}.md; mailbox discipline"
  fi
  printf 'office_hours: {reason: "%s", since: %s, recommendation: "%s"}\n' "$reason" "$since" "$rec" >>"$dir/$id.md"
  echo "graph-commit: set office_hours on $id (since=$since)" >&2
done
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
scratch_refs() { git -C "$ORIGIN" for-each-ref --format='%(refname)' 'refs/heads/graph/**'; }

run_gc() { # <clone> [graph-commit args...]; knobs: GC_POLL GC_TIMEOUT GC_ATTEMPTS
  local clone="$1"; shift
  (
    cd "$clone" || exit 99
    export PATH="$WORK/bin:$PATH"
    export GC_GH_MODE_FILE="$MODE_FILE" GC_GH_CALL_LOG="$CALL_LOG" GC_FIXTURE_DIR="$FIXTURE_DIR"
    export GRAPH_COMMIT_CHECK_POLL_SECONDS="${GC_POLL:-0}"
    export GRAPH_COMMIT_CHECK_TIMEOUT_SECONDS="${GC_TIMEOUT:-5}"
    export GRAPH_COMMIT_MAX_ATTEMPTS="${GC_ATTEMPTS:-5}"
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
before="$(origin_sha)"
out="$(run_gc "$A" t-happy 2>&1)"; rc=$?
if [[ $rc -eq 0 && "$(origin_sha)" == "$before" ]] && grep -q 'no new changes to stage' <<<"$out"; then
  ok "idempotent re-run: exit 0, no new commit on main"
else
  no "idempotent re-run (rc=$rc)"; printf '%s\n' "$out"
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
   && ! grep -q 'B-loses' <<<"$content" \
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
   && grep -q 'could not land on main after 2 attempts' <<<"$out"; then
  ok "pending timeout stays transient: burns attempts, exits busy-main"
else
  no "pending timeout retry path (rc=$rc)"; printf '%s\n' "$out"
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

# Case 13: --base stale — a blob origin/main no longer has is refused.
W4="$WORK/w4"
make_clone "$W4" writer-4
stale_sha="$(git -C "$W4" hash-object intentions/t-base.md)"
before_sha="$(origin_sha)"

# Simulate a concurrent writer landing an unrelated change to the SAME node
# on origin/main, bypassing graph-commit (representing "another session
# already committed" for fast test setup — the mechanism under test is the
# blob comparison, not how the concurrent write itself lands).
OTHER="$WORK/other"
make_clone "$OTHER" other
echo "line14: concurrent edit" >>"$OTHER/intentions/t-base.md"
git -C "$OTHER" commit -qam 'concurrent edit'
git -C "$OTHER" push -q origin main

echo "line13: writer4 edit (based on a stale read)" >>"$W4/intentions/t-base.md"
if out="$(run_gc "$W4" -m 'test: base stale' --base "t-base=$stale_sha" t-base 2>&1)"; then
  no "base stale: expected refusal, got exit 0"
else
  after_sha="$(origin_sha)"
  concurrent_sha="$(git -C "$OTHER" rev-parse HEAD)"
  if grep -q "stale base" <<<"$out" && [[ "$after_sha" == "$concurrent_sha" ]]; then
    ok "base stale: refuses a --base whose blob no longer matches origin/main, writer4 content NOT landed"
  else
    no "base stale: refused but wrong error or main moved unexpectedly"; printf '%s\n' "$out"
  fi
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
