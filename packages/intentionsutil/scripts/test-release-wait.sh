#!/usr/bin/env bash
#
# test-release-wait.sh — functional harness for `release-wait`, the WRITE half
# of the tick sweep's calendar release (tactic-wait-calendar-release unit 6).
#
# Mirrors test-hold-node.sh's setup: a throwaway bare origin plus a seed clone
# that pushes the fixture nodes, then per-case writer clones with the scripts
# under test copied in at their real repo-relative paths so their
# SCRIPT_DIR/REPO_ROOT resolution points at the scratch clone. The re-assert and
# the writes run for real (write-node.ts, dump-node.ts and the real
# store/schema/waits under packages/intentionsutil/src) — only `graph-commit` is
# stubbed. `node_modules` is a SYMLINK to this repo's own (read-only, never
# written) so `node --import tsx/esm` resolves tsx and the `yaml` package.
#
# THE STUB IS NOT test-hold-node.sh's. release-wait's distinguishing feature is
# its POST-LAND VERIFICATION: after graph-commit reports success it re-fetches
# origin/main and asserts `phase: done` actually landed there (graph-commit's
# layer-2 merge has a documented history of reporting success while dropping
# part of a write). A stub that never touches the origin — like
# test-hold-node.sh's — would make EVERY case fail that verification, so this
# harness's stub actually LANDS by default: it commits intentions/ and pushes to
# the fake origin's main. Two env knobs then drive the failure cases:
#
#   GC_EXIT=1   — the stub fails outright (the CAS-refusal shape).
#   GC_LAND=0   — the stub reports SUCCESS but pushes nothing, so the
#                 subsequent fetch + re-read sees the pre-release content. That
#                 is the only way to exercise the post-land verification branch
#                 without a real graph-commit bug, and it is exactly the failure
#                 mode that branch exists to catch.
#
# Covers:
#   1. An armed, due wait releases: phase becomes "done" ON THE ORIGIN, stdout
#      is `released <id>`, exit 0.
#   2. An armed but NOT-yet-due wait is refused: non-zero exit naming
#      wait_until, nothing written, origin still phase: null.
#   3. A stale `--base` pin refuses BEFORE any mutation: exit 3,
#      `stale-diagnosis` on stderr, clean tree, origin untouched.
#   4. A graph-commit that reports success without landing fails the post-land
#      verification: non-zero exit, a `post-land verification failed` message
#      DISTINCT from the CAS-refusal message, clean tree, origin untouched.
#   5. A failing graph-commit (the CAS-refusal shape) rolls the write back:
#      non-zero exit, a `graph-commit failed` message that does NOT claim a
#      verification failure, clean tree.
#   6. Usage error (no positional wait-node-id) exits 2 without touching
#      anything.
#
# Needs bash, git, jq, and a real `node`. No network.

set -uo pipefail

HARNESS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REAL_REPO_ROOT="$(cd "$HARNESS_DIR/../../.." && pwd)"
for f in release-wait write-node.ts dump-node.ts; do
  [[ -f "$HARNESS_DIR/$f" ]] || { echo "error: $f not found at $HARNESS_DIR/$f" >&2; exit 1; }
done
command -v jq >/dev/null || { echo "error: jq not found" >&2; exit 1; }
command -v node >/dev/null || { echo "error: node not found" >&2; exit 1; }

WORK="$(mktemp -d)" || { echo "error: mktemp failed" >&2; exit 1; }
harness_cleanup() { rm -rf "$WORK"; }
trap harness_cleanup EXIT

PASS=0; FAIL=0
ok() { echo "PASS: $1"; PASS=$((PASS + 1)); }
no() { echo "FAIL: $1"; FAIL=$((FAIL + 1)); }

NOW="2026-06-01T00:00:00Z"
PAST="2020-01-02T03:04:05Z"
FUTURE="2099-03-04T05:06:07Z"

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
for f in release-wait write-node.ts dump-node.ts; do
  cp "$HARNESS_DIR/$f" "$SEED/packages/intentionsutil/scripts/$f"
done
chmod +x "$SEED/packages/intentionsutil/scripts/release-wait"
cp -r "$REAL_REPO_ROOT/packages/intentionsutil/src/." "$SEED/packages/intentionsutil/src/"
cp "$REAL_REPO_ROOT/packages/intentionsutil/package.json" "$SEED/packages/intentionsutil/package.json"

# graph-commit STUB — see the header. Records argv one arg per line into
# $GC_LOG, then (unless told otherwise) actually lands the write on the fake
# origin so the post-land verification has something true to verify.
cat >"$SEED/packages/intentionsutil/scripts/graph-commit" <<'SH'
#!/usr/bin/env bash
: >"${GC_LOG:?GC_LOG must be set}"
for a in "$@"; do printf '%s\n' "$a" >>"$GC_LOG"; done
rc="${GC_EXIT:-0}"
if [[ "$rc" == 0 && "${GC_LAND:-1}" == 1 ]]; then
  git add -A intentions/ >&2 || exit 1
  git commit -qm 'stub graph-commit: land' >&2 || exit 1
  git push -q origin HEAD:main >&2 || exit 1
fi
exit "$rc"
SH
chmod +x "$SEED/packages/intentionsutil/scripts/graph-commit"

seed_wait() { # <source-slug> <wait_until> — id is tactic-wait-<slug>
  cat >"$SEED/intentions/tactic-wait-$1.md" <<NODE
---
id: tactic-wait-$1
kind: tactic
statement: 'wait: harness wait for tactic-$1'
owner: ai
status: codified
serves:
  - strategy-harness
phase: null
office_hours: null
attributes:
  wait_for: tactic-$1
  wait_until: $2
  wait_attempts: 1
  wait_reason: seeded wait reason
  wait_recommendation: seeded wait recommendation
---
# wait: tactic-$1

ORIGINAL-WAIT-BODY-MARKER
NODE
}

seed_wait due "$PAST"
seed_wait future "$FUTURE"
seed_wait pinned "$PAST"
seed_wait drop "$PAST"
seed_wait cas "$PAST"

git -C "$SEED" add -A
git -C "$SEED" commit -qm seed
git -C "$SEED" push -q origin main

make_clone() { # <dst> <identity>
  git clone -q "$ORIGIN" "$1"
  git -C "$1" config user.email "$2@test"
  git -C "$1" config user.name "$2"
  ln -s "$REAL_REPO_ROOT/node_modules" "$1/node_modules"
}

run_rw() { # <clone> <gc-log> <gc-exit> <gc-land> [release-wait args...]
  local clone="$1" gclog="$2" gcexit="$3" gcland="$4"; shift 4
  (
    cd "$clone" || exit 99
    export GC_LOG="$gclog" GC_EXIT="$gcexit" GC_LAND="$gcland"
    bash packages/intentionsutil/scripts/release-wait "$@"
  )
}

# The authoritative post-run read: what does the FAKE ORIGIN carry?
origin_phase() { # <id>
  git -C "$ORIGIN" show "main:intentions/$1.md" 2>/dev/null | sed -n 's/^phase: //p' | head -1
}

# ---------------------------------------------------------------------------
# Case 1: an armed, due wait releases.
# ---------------------------------------------------------------------------
A="$WORK/a"; make_clone "$A" writer-a
out="$(run_rw "$A" "$WORK/gclog-a" 0 1 tactic-wait-due --now "$NOW" 2>&1)"; rc=$?
if [[ $rc -eq 0 ]] \
   && grep -qx 'released tactic-wait-due' <<<"$out" \
   && [[ "$(origin_phase tactic-wait-due)" == "done" ]] \
   && grep -qx 'tactic-wait-due' "$WORK/gclog-a" \
   && grep -q '^tactic-wait-due=' "$WORK/gclog-a"; then
  ok "armed + due: released to phase done on origin, one graph-commit with a --base CAS token, exit 0"
else
  no "armed + due release (rc=$rc phase=$(origin_phase tactic-wait-due))"
  printf '%s\n' "$out"; cat "$WORK/gclog-a" 2>/dev/null
fi

# ---------------------------------------------------------------------------
# Case 2: an armed but not-yet-due wait is REFUSED — the sweep's own re-assert.
# ---------------------------------------------------------------------------
B="$WORK/b"; make_clone "$B" writer-b
out="$(run_rw "$B" "$WORK/gclog-b" 0 1 tactic-wait-future --now "$NOW" 2>&1)"; rc=$?
status_after="$(git -C "$B" status --porcelain -- intentions/)"
if [[ $rc -ne 0 ]] \
   && grep -q 'has NOT passed' <<<"$out" \
   && [[ "$(origin_phase tactic-wait-future)" == "null" ]] \
   && [[ -z "$status_after" ]] \
   && [[ ! -s "$WORK/gclog-b" ]]; then
  ok "not yet due: release refused before any write (origin still phase null, clean tree, no graph-commit)"
else
  no "not-yet-due refusal (rc=$rc phase=$(origin_phase tactic-wait-future))"
  printf '%s\n' "$out"; printf 'status: %s\n' "$status_after"
fi

# ---------------------------------------------------------------------------
# Case 3: a stale --base pin refuses with exit 3 before any mutation.
# ---------------------------------------------------------------------------
C="$WORK/c"; make_clone "$C" writer-c
STALE_BASE="0123456789abcdef0123456789abcdef01234567"
out="$(run_rw "$C" "$WORK/gclog-c" 0 1 tactic-wait-pinned --now "$NOW" --base "$STALE_BASE" 2>&1)"; rc=$?
status_after="$(git -C "$C" status --porcelain -- intentions/)"
if [[ $rc -eq 3 ]] \
   && grep -q 'stale-diagnosis' <<<"$out" \
   && [[ "$(origin_phase tactic-wait-pinned)" == "null" ]] \
   && [[ -z "$status_after" ]] \
   && [[ ! -s "$WORK/gclog-c" ]]; then
  ok "stale --base pin: exit 3 stale-diagnosis before any mutation, origin untouched, clean tree"
else
  no "stale --base (rc=$rc phase=$(origin_phase tactic-wait-pinned))"
  printf '%s\n' "$out"; printf 'status: %s\n' "$status_after"
fi

# A matching pin must be transparent: capture origin/main's current blob for
# tactic-wait-pinned and pass it back, in the <id>=<sha> form.
C2="$WORK/c2"; make_clone "$C2" writer-c2
GOOD_BASE="$(git -C "$C2" rev-parse origin/main:intentions/tactic-wait-pinned.md)"
out="$(run_rw "$C2" "$WORK/gclog-c2" 0 1 tactic-wait-pinned --now "$NOW" --base "tactic-wait-pinned=$GOOD_BASE" 2>&1)"; rc=$?
if [[ $rc -eq 0 ]] \
   && grep -qx 'released tactic-wait-pinned' <<<"$out" \
   && [[ "$(origin_phase tactic-wait-pinned)" == "done" ]]; then
  ok "matching --base pin (<id>=<sha> form): transparent to the release, exit 0"
else
  no "matching --base pin (rc=$rc phase=$(origin_phase tactic-wait-pinned))"; printf '%s\n' "$out"
fi

# ---------------------------------------------------------------------------
# Case 4: graph-commit reports success but nothing lands — the post-land
# verification must catch it (GC_LAND=0; see the header).
# ---------------------------------------------------------------------------
D="$WORK/d"; make_clone "$D" writer-d
out="$(run_rw "$D" "$WORK/gclog-d" 0 0 tactic-wait-drop --now "$NOW" 2>&1)"; rc=$?
status_after="$(git -C "$D" status --porcelain -- intentions/)"
if [[ $rc -ne 0 ]] \
   && grep -q 'post-land verification failed' <<<"$out" \
   && ! grep -q 'graph-commit failed' <<<"$out" \
   && [[ "$(origin_phase tactic-wait-drop)" == "null" ]] \
   && [[ -z "$status_after" ]]; then
  ok "reported-success land that did not survive: post-land verification fails loudly (distinct from the CAS-refusal message), clean tree"
else
  no "post-land verification (rc=$rc phase=$(origin_phase tactic-wait-drop))"
  printf '%s\n' "$out"; printf 'status: %s\n' "$status_after"
fi

# ---------------------------------------------------------------------------
# Case 5: a failing graph-commit (CAS refusal) rolls the write back.
# ---------------------------------------------------------------------------
E="$WORK/e"; make_clone "$E" writer-e
out="$(run_rw "$E" "$WORK/gclog-e" 1 1 tactic-wait-cas --now "$NOW" 2>&1)"; rc=$?
status_after="$(git -C "$E" status --porcelain -- intentions/)"
if [[ $rc -eq 1 ]] \
   && grep -q 'graph-commit failed' <<<"$out" \
   && ! grep -q 'post-land verification failed' <<<"$out" \
   && [[ "$(origin_phase tactic-wait-cas)" == "null" ]] \
   && [[ -z "$status_after" ]]; then
  ok "graph-commit failure: the release write is rolled back (clean tree), reported distinctly from a verification failure"
else
  no "graph-commit failure rollback (rc=$rc phase=$(origin_phase tactic-wait-cas))"
  printf '%s\n' "$out"; printf 'status: %s\n' "$status_after"
fi

# ---------------------------------------------------------------------------
# Case 6: usage error (no positional wait-node-id) exits 2, touches nothing.
# ---------------------------------------------------------------------------
F="$WORK/f"; make_clone "$F" writer-f
out="$(run_rw "$F" "$WORK/gclog-f" 0 1 --now "$NOW" 2>&1)"; rc=$?
status_after="$(git -C "$F" status --porcelain -- intentions/)"
if [[ $rc -eq 2 ]] && grep -q 'usage: release-wait' <<<"$out" && [[ -z "$status_after" ]]; then
  ok "usage error (no wait-node-id): exit 2, nothing written"
else
  no "usage error (rc=$rc)"; printf '%s\n' "$out"; printf 'status: %s\n' "$status_after"
fi

echo
echo "passed: $PASS  failed: $FAIL"
[[ $FAIL -eq 0 ]] || exit 1
exit 0
