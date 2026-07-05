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
#   8. id validation: `v1..v2-migration` lands end-to-end; `/`, `\`, and the
#      exact ids `.` / `..` are rejected with exit 2
#
# No network and no real gh/node needed; requires only bash + git.

set -uo pipefail

HARNESS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
GC_SCRIPT="$HARNESS_DIR/graph-commit"
[[ -f "$GC_SCRIPT" ]] || { echo "error: graph-commit not found at $GC_SCRIPT" >&2; exit 1; }

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
for id in t-happy t-merge t-conflict t-ckfail t-ghfail t-pending v1..v2-migration; do
  seed_node "$id"
done
git -C "$SEED" add -A
git -C "$SEED" commit -qm seed
git -C "$SEED" push -q origin main

# --- Two independent writer clones -------------------------------------------
make_clone() { # <dst> <identity>
  git clone -q "$ORIGIN" "$1"
  git -C "$1" config user.email "$2@test"
  git -C "$1" config user.name "$2"
}
A="$WORK/a"; B="$WORK/b"
make_clone "$A" writer-a
make_clone "$B" writer-b

# --- gh / npx PATH shims ------------------------------------------------------
mkdir -p "$WORK/bin"
MODE_FILE="$WORK/gh-mode"
CALL_LOG="$WORK/gh-calls"

cat >"$WORK/bin/gh" <<'SH'
#!/usr/bin/env bash
# gh shim: behavior selected by $GC_GH_MODE_FILE; every invocation appends one
# fixed marker line to $GC_GH_CALL_LOG so tests can assert poll counts (the
# real args contain a multi-line --jq program, so they must not be logged raw).
echo "gh-invocation" >>"$GC_GH_CALL_LOG"
case "$(cat "$GC_GH_MODE_FILE")" in
  green)          echo "4 0" ;;
  pending)        echo "0 0" ;;
  concluded-fail) echo "3 1" ;;
  hard-fail)      echo "gh: HTTP 403: API rate limit exceeded (harness shim)" >&2; exit 1 ;;
  *)              echo "gh shim: unknown mode" >&2; exit 99 ;;
esac
SH

cat >"$WORK/bin/npx" <<'SH'
#!/usr/bin/env bash
# npx shim: emulates `npx tsx <helper> <storeModule> <intentionsDir> <since>
# <reason> <id...>` (graph-commit's park_write) without node. Mirrors the real
# helper's two-pass shape: verify every id is readable first, then write all.
[[ "$1" == "tsx" ]] || { echo "npx shim: unexpected invocation: $*" >&2; exit 1; }
shift 3   # tsx, helper script path, store module path
dir="$1"; since="$2"; reason="$3"; shift 3
for id in "$@"; do
  [[ -f "$dir/$id.md" ]] || { echo "npx shim: unreadable node $id" >&2; exit 1; }
done
for id in "$@"; do
  printf 'office_hours: {reason: "%s", since: %s}\n' "$reason" "$since" >>"$dir/$id.md"
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
    export GC_GH_MODE_FILE="$MODE_FILE" GC_GH_CALL_LOG="$CALL_LOG"
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

# --- Case 8: id validation -------------------------------------------------------
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
