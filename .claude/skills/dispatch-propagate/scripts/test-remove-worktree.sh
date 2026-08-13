#!/usr/bin/env bash
# Tests for `remove-worktree` — the standalone worktree-removal primitive.
#
# REAL GIT, NO STUBS. This is the script that deletes directories, so every
# fixture is an actual repository: a bare `origin`, a primary `main` checkout,
# and linked worktrees under `<main>/.claude/worktrees/<name>` (the layout the
# real repo uses). A `git` stub would prove the argv, not the behavior, and the
# behavior under test — what survives on disk after a refusal, what is left
# registered after a removal — only exists on disk.
#
# Covered:
#   1  no argument                        → usage, exit 2
#   2  relative path                      → exit 2
#   3  path that is not in a git repo     → exit 3
#   4  subdirectory OF a worktree         → exit 3 (not a registered worktree)
#   5  the primary checkout               → exit 5
#   6  the CURRENT worktree (cwd inside)  → exit 4
#   7  uncommitted tracked changes        → exit 7, worktree survives
#   8  unlanded content on the branch     → exit 9, worktree survives
#   9  clean + fully landed               → exit 0, gone AND deregistered
#  10  content-equal but commits ahead    → exit 0 (content gate, not count)
#  11  divergence only under intentions/  → exit 0 (':!intentions' exclusion)
#  12  fetch fails (broken origin)        → exit 6, worktree survives
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd -P)"
# shellcheck source=test-helpers.sh
source "$SCRIPT_DIR/test-helpers.sh"

SUT="$SCRIPT_DIR/remove-worktree"

TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT

# --- fixture -----------------------------------------------------------------
# new_fixture: a fresh bare origin + primary `main` checkout, seeded and pushed.
# Sets ORIGIN, MAIN, WT_ROOT, ERRLOG.
FIX_N=0
new_fixture() {
  FIX_N=$((FIX_N + 1))
  FIX="$TMP/fix$FIX_N"
  ORIGIN="$FIX/origin.git"
  MAIN="$FIX/main"
  WT_ROOT="$MAIN/.claude/worktrees"
  ERRLOG="$FIX/stderr.log"
  mkdir -p "$FIX"

  git init -q --bare -b main "$ORIGIN"
  git init -q -b main "$MAIN"
  git -C "$MAIN" config user.email test@example.com
  git -C "$MAIN" config user.name "Test User"
  git -C "$MAIN" remote add origin "$ORIGIN"
  printf 'seed\n' >"$MAIN/README.md"
  mkdir -p "$MAIN/intentions"
  printf -- '---\nid: seed-node\n---\n\nSeed.\n' >"$MAIN/intentions/seed-node.md"
  git -C "$MAIN" add -A
  git -C "$MAIN" commit -q -m seed
  git -C "$MAIN" push -q -u origin main
  mkdir -p "$WT_ROOT"
}

# add_wt <name> — a linked worktree on a new branch cut from main. Echoes path.
add_wt() {
  local name="$1"
  git -C "$MAIN" worktree add -q -b "$name" "$WT_ROOT/$name" main
  printf '%s\n' "$WT_ROOT/$name"
}

# run_sut [args...] — runs the SUT from $TMP (never from inside a fixture),
# capturing stdout in RUN_OUT, stderr in RUN_ERR, exit code in RUN_RC.
run_sut() {
  if RUN_OUT=$(cd "$TMP" && "$SUT" "$@" 2>"$ERRLOG"); then RUN_RC=0; else RUN_RC=$?; fi
  RUN_ERR=$(cat "$ERRLOG")
}

# run_sut_from <dir> [args...] — same, but with cwd set to <dir>.
run_sut_from() {
  local dir="$1"; shift
  if RUN_OUT=$(cd "$dir" && "$SUT" "$@" 2>"$ERRLOG"); then RUN_RC=0; else RUN_RC=$?; fi
  RUN_ERR=$(cat "$ERRLOG")
}

# reg_dir_of <worktree-path> — the `<repo>/.git/worktrees/<name>` admin dir git
# itself reports for that worktree (the registration half of the post-state).
reg_dir_of() {
  git -C "$1" rev-parse --path-format=absolute --git-dir
}

echo ""
echo "=== argument validation ==="

# 1. No argument at all → usage + exit 2. The script must never guess a target.
echo "Test: no argument → exit 2"
new_fixture
run_sut
assert_eq "no argument → exit 2" "2" "$RUN_RC"
assert_contains "no argument → usage on stderr" "Usage: remove-worktree" "$RUN_ERR"

# 2. A relative path → exit 2. Refused before any git call, so a caller with a
#    surprising cwd cannot aim the script at the wrong tree.
echo "Test: relative path → exit 2"
new_fixture
WT=$(add_wt node-rel)
run_sut ".claude/worktrees/node-rel"
assert_eq "relative path → exit 2" "2" "$RUN_RC"
assert_contains "relative path → names the problem" "not an absolute path" "$RUN_ERR"
assert_eq "relative path → worktree untouched" "yes" "$([[ -d "$WT" ]] && echo yes || echo no)"

echo ""
echo "=== registration validation ==="

# 3. An absolute path that is not inside any git repository → exit 3.
echo "Test: path outside any git repo → exit 3"
new_fixture
mkdir -p "$FIX/loose"
printf 'x\n' >"$FIX/loose/file.txt"
run_sut "$FIX/loose"
assert_eq "non-repo path → exit 3" "3" "$RUN_RC"
assert_eq "non-repo path → directory untouched" "yes" \
  "$([[ -f "$FIX/loose/file.txt" ]] && echo yes || echo no)"

# 4. A SUBDIRECTORY of a real worktree resolves a repo root fine, but git does
#    not list it as a worktree → exit 3. This is the `rm -rf` guard doing its
#    job on a path that looks git-ish.
echo "Test: subdirectory of a worktree → exit 3"
new_fixture
WT=$(add_wt node-sub)
mkdir -p "$WT/sub"
printf 'x\n' >"$WT/sub/file.txt"
run_sut "$WT/sub"
assert_eq "worktree subdir → exit 3" "3" "$RUN_RC"
assert_contains "worktree subdir → names the check" "not a registered worktree" "$RUN_ERR"
assert_eq "worktree subdir → subdir untouched" "yes" \
  "$([[ -f "$WT/sub/file.txt" ]] && echo yes || echo no)"

echo ""
echo "=== footguns ==="

# 5. The primary checkout (which also has `main` checked out) → exit 5.
echo "Test: primary checkout → exit 5"
new_fixture
run_sut "$MAIN"
assert_eq "primary checkout → exit 5" "5" "$RUN_RC"
assert_eq "primary checkout → still there" "yes" "$([[ -f "$MAIN/README.md" ]] && echo yes || echo no)"

# 6. The worktree the caller is standing in → exit 4, before any removal.
echo "Test: current worktree (cwd inside it) → exit 4"
new_fixture
WT=$(add_wt node-cwd)
run_sut_from "$WT" "$WT"
assert_eq "current worktree → exit 4" "4" "$RUN_RC"
assert_contains "current worktree → names the check" "CURRENT worktree" "$RUN_ERR"
assert_eq "current worktree → survives" "yes" "$([[ -d "$WT" ]] && echo yes || echo no)"

echo ""
echo "=== safety gate ==="

# 7. Uncommitted tracked changes → exit 7, nothing deleted.
echo "Test: uncommitted tracked changes → exit 7"
new_fixture
WT=$(add_wt node-dirty)
printf 'local edit\n' >>"$WT/README.md"
run_sut "$WT"
assert_eq "dirty tree → exit 7" "7" "$RUN_RC"
assert_contains "dirty tree → names the check" "uncommitted tracked changes" "$RUN_ERR"
assert_eq "dirty tree → worktree survives" "yes" "$([[ -d "$WT" ]] && echo yes || echo no)"
assert_eq "dirty tree → edit survives" "yes" \
  "$(grep -q 'local edit' "$WT/README.md" && echo yes || echo no)"

# 8. A committed-but-unlanded change outside intentions/ → exit 9. The work is
#    only in this worktree's branch; deleting it would destroy it.
echo "Test: unlanded content → exit 9"
new_fixture
WT=$(add_wt node-unlanded)
printf 'unlanded work\n' >"$WT/feature.txt"
git -C "$WT" add feature.txt
git -C "$WT" commit -q -m "unlanded work"
run_sut "$WT"
assert_eq "unlanded content → exit 9" "9" "$RUN_RC"
assert_contains "unlanded content → names the check" "unlanded content" "$RUN_ERR"
assert_eq "unlanded content → worktree survives" "yes" "$([[ -d "$WT" ]] && echo yes || echo no)"

# 12 (run here, with the other refusals). A fetch that fails means origin/main
#    cannot be trusted, so the content gate cannot be judged → exit 6, keep.
echo "Test: fresh fetch fails → exit 6"
new_fixture
WT=$(add_wt node-nofetch)
git -C "$MAIN" remote set-url origin "$FIX/does-not-exist.git"
run_sut "$WT"
assert_eq "fetch failure → exit 6" "6" "$RUN_RC"
assert_contains "fetch failure → names the check" "git fetch origin main failed" "$RUN_ERR"
assert_eq "fetch failure → worktree survives" "yes" "$([[ -d "$WT" ]] && echo yes || echo no)"

echo ""
echo "=== successful removal ==="

# 9. Clean and fully landed → removed, deregistered, VERIFIED. Both halves of
#    the post-state are asserted here: the checkout AND `.git/worktrees/<name>`.
echo "Test: clean, fully landed → removed and deregistered"
new_fixture
WT=$(add_wt node-clean)
REG=$(reg_dir_of "$WT")
run_sut "$WT"
assert_eq "clean worktree → exit 0" "0" "$RUN_RC"
assert_eq "clean worktree → prints removed" "removed" "$RUN_OUT"
assert_eq "clean worktree → checkout gone" "no" "$([[ -e "$WT" ]] && echo yes || echo no)"
assert_eq "clean worktree → registration gone" "no" "$([[ -e "$REG" ]] && echo yes || echo no)"
assert_eq "clean worktree → no longer listed" "" \
  "$(git -C "$MAIN" worktree list --porcelain | grep -F "worktree $WT" || true)"
assert_eq "clean worktree → branch retained" "node-clean" \
  "$(git -C "$MAIN" rev-parse --abbrev-ref node-clean)"

# 10. The squash-merge shape: the branch is several commits ahead of
#     origin/main, but its CONTENT is identical. A commits-ahead count would
#     refuse this forever; the content gate lets it go.
echo "Test: commits ahead but content-equal → removed"
new_fixture
WT=$(add_wt node-squashed)
printf 'shared feature\n' >"$WT/feature.txt"
git -C "$WT" add feature.txt
git -C "$WT" commit -q -m "feature, commit 1"
printf 'shared feature\nmore\n' >"$WT/feature.txt"
git -C "$WT" commit -q -am "feature, commit 2"
# The same CONTENT lands on origin/main as one squashed commit.
printf 'shared feature\nmore\n' >"$MAIN/feature.txt"
git -C "$MAIN" add feature.txt
git -C "$MAIN" commit -q -m "feature (squashed)"
git -C "$MAIN" push -q origin main
ahead=$(git -C "$WT" rev-list --count origin/main..HEAD 2>/dev/null || echo 0)
assert_eq "squash shape → branch really is commits ahead" "2" "$ahead"
run_sut "$WT"
assert_eq "content-equal branch → exit 0" "0" "$RUN_RC"
assert_eq "content-equal branch → checkout gone" "no" "$([[ -e "$WT" ]] && echo yes || echo no)"

# 11. Divergence confined to intentions/ is excluded by the gate's pathspec —
#     graph nodes land through their own path, not this branch.
echo "Test: divergence only under intentions/ → removed"
new_fixture
WT=$(add_wt node-intentions-only)
printf -- '---\nid: draft-node\n---\n\nDraft.\n' >"$WT/intentions/draft-node.md"
git -C "$WT" add intentions/draft-node.md
git -C "$WT" commit -q -m "draft node"
run_sut "$WT"
assert_eq "intentions-only divergence → exit 0" "0" "$RUN_RC"
assert_eq "intentions-only divergence → checkout gone" "no" \
  "$([[ -e "$WT" ]] && echo yes || echo no)"

echo ""
echo "=== partial-delete recovery ==="

# 13. The sandbox half-delete. This is the one branch a real repository cannot
#     reach on its own — it needs the sandbox's read-only root — so the FAILURE
#     is injected rather than the repository mocked: a PATH shim that forwards
#     every git call to the real binary EXCEPT `worktree remove`, which it makes
#     fail the way the sandbox does (target's `.git` destroyed, checkout and
#     registration left behind). Everything the recovery then does — rm -rf,
#     prune, the post-state verification — runs against real git on a real repo.
echo "Test: half-deleted checkout → recovered, deregistered, verified"
new_fixture
WT=$(add_wt node-partial)
REG=$(reg_dir_of "$WT")
REAL_GIT=$(command -v git)
STUB_BIN="$FIX/stub-bin"
mkdir -p "$STUB_BIN"
cat >"$STUB_BIN/git" <<STUB
#!/usr/bin/env bash
# Forward everything to real git except \`worktree remove\`, which simulates the
# sandboxed half-delete described in .claude/rules/sandbox.md.
if [[ "\${1:-}" == "-C" && "\${3:-}" == "worktree" && "\${4:-}" == "remove" ]]; then
  target="\${5:-}"
  rm -f "\$target/.git"
  printf "error: failed to delete '%s': Read-only file system\n" "\$target" >&2
  exit 1
fi
exec "$REAL_GIT" "\$@"
STUB
chmod +x "$STUB_BIN/git"
if RUN_OUT=$(cd "$TMP" && PATH="$STUB_BIN:$PATH" "$SUT" "$WT" 2>"$ERRLOG"); then
  RUN_RC=0
else
  RUN_RC=$?
fi
RUN_ERR=$(cat "$ERRLOG")
assert_eq "half-delete → exit 0" "0" "$RUN_RC"
assert_eq "half-delete → prints removed-after-recovery" "removed-after-recovery" "$RUN_OUT"
assert_contains "half-delete → detection reported" "PARTIAL DELETE detected" "$RUN_ERR"
assert_contains "half-delete → git's error surfaced" "Read-only file system" "$RUN_ERR"
assert_eq "half-delete → checkout gone" "no" "$([[ -e "$WT" ]] && echo yes || echo no)"
assert_eq "half-delete → registration gone" "no" "$([[ -e "$REG" ]] && echo yes || echo no)"
assert_eq "half-delete → no longer listed" "" \
  "$(git -C "$MAIN" worktree list --porcelain | grep -F "worktree $WT" || true)"

# 14. The other side of the same branch: a removal that fails with the checkout
#     INTACT is not a partial delete. It is git refusing for a reason the gates
#     did not model, so the worktree must be KEPT, not rm -rf'd.
echo "Test: removal refused with checkout intact → exit 10, kept"
new_fixture
WT=$(add_wt node-refused)
STUB_BIN="$FIX/stub-bin"
REAL_GIT=$(command -v git)
mkdir -p "$STUB_BIN"
cat >"$STUB_BIN/git" <<STUB
#!/usr/bin/env bash
# \`worktree remove\` refuses without touching anything (git's own clean-check).
if [[ "\${1:-}" == "-C" && "\${3:-}" == "worktree" && "\${4:-}" == "remove" ]]; then
  printf "fatal: '%s' contains modified or untracked files, use --force to delete it\n" "\${5:-}" >&2
  exit 1
fi
exec "$REAL_GIT" "\$@"
STUB
chmod +x "$STUB_BIN/git"
if RUN_OUT=$(cd "$TMP" && PATH="$STUB_BIN:$PATH" "$SUT" "$WT" 2>"$ERRLOG"); then
  RUN_RC=0
else
  RUN_RC=$?
fi
RUN_ERR=$(cat "$ERRLOG")
assert_eq "intact refusal → exit 10" "10" "$RUN_RC"
assert_contains "intact refusal → says the checkout is intact" "checkout is INTACT" "$RUN_ERR"
assert_eq "intact refusal → worktree kept" "yes" "$([[ -d "$WT" ]] && echo yes || echo no)"
assert_eq "intact refusal → still registered" "yes" \
  "$(git -C "$MAIN" worktree list --porcelain | grep -qF "worktree $WT" && echo yes || echo no)"

report_results
