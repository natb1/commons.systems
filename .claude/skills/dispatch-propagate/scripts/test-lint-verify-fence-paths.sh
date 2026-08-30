#!/usr/bin/env bash
# Tests for lint-verify-fence-paths.sh (and the lib-verify-fence.sh extraction
# it shares with dispatch-run-verification).
#
# Every case builds a throwaway git repo under mktemp -d — with real history, so
# the orphan-vs-forward-reference discriminator can be exercised — and points
# the checker at it with --repo-root/--intentions-dir/--baseline. Nothing is
# ever written under this repo's own intentions/.
set -euo pipefail

FIXTURE_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=dispatch-test-fixture.sh
source "$FIXTURE_DIR/dispatch-test-fixture.sh"

LINT="$SCRIPT_DIR/lint-verify-fence-paths.sh"

echo ""
echo "=== lint-verify-fence-paths.sh ==="

# --- fixture repo -----------------------------------------------------------
# Layout mirrors the real repo's shape closely enough for the leading-segment
# filter: top-level `.claude`, `packages`, `intentions`.
#   .claude/live-script.sh    — exists (committed, never deleted)
#   packages/keep.ts          — exists
#   .claude/dead-script.sh    — committed then DELETED: the incident class
#   .claude/never-existed.sh  — no history at all: a plan's forward reference
#   gone-pkg/tool.sh          — committed, then the WHOLE top-level `gone-pkg`
#                               tree deleted: the largest-blast-radius case,
#                               where the leading path segment itself is gone
# No EXIT trap here: dispatch-test-fixture.sh installs its own leak-guard EXIT
# traps and overriding them would silently disable those guards. The fixture
# repo is removed explicitly at the end instead.
FIXTURE_REPO="$(mktemp -d)"

mkdir -p "$FIXTURE_REPO/.claude" "$FIXTURE_REPO/packages" "$FIXTURE_REPO/intentions" \
         "$FIXTURE_REPO/gone-pkg"
: > "$FIXTURE_REPO/.claude/live-script.sh"
: > "$FIXTURE_REPO/.claude/dead-script.sh"
: > "$FIXTURE_REPO/packages/keep.ts"
: > "$FIXTURE_REPO/gone-pkg/tool.sh"
git -C "$FIXTURE_REPO" init -q
git -C "$FIXTURE_REPO" config user.email test@example.com
git -C "$FIXTURE_REPO" config user.name Test
git -C "$FIXTURE_REPO" add -A
git -C "$FIXTURE_REPO" commit -qm "seed"
rm "$FIXTURE_REPO/.claude/dead-script.sh"
rm -rf "$FIXTURE_REPO/gone-pkg"
git -C "$FIXTURE_REPO" add -A
git -C "$FIXTURE_REPO" commit -qm "delete dead-script.sh and the whole gone-pkg tree"

EMPTY_BASELINE="$FIXTURE_REPO/baseline.json"
echo '[]' > "$EMPTY_BASELINE"

# Write one node file; $1 = node id, $2 = phase, $3 = body markdown.
write_node() {
  # `printf '%s\n' ...` rather than a `---`-leading format string, which bash's
  # printf would try to parse as options.
  printf '%s\n' "---" "id: $1" "kind: tactic" "phase: $2" "---" "" "$3" \
    > "$FIXTURE_REPO/intentions/$1.md"
}

reset_nodes() { rm -f "$FIXTURE_REPO"/intentions/*.md; }

# Run the checker over the fixture; sets RC and OUT.
# `--no-status-warn` by default: every existing case here asserts on exactly-
# empty COMBINED output (2>&1), and the advisory swallowed-status warning writes
# to stderr. The warning has its own cases below, which call run_lint_warn.
run_lint() {
  local baseline="${1:-$EMPTY_BASELINE}"
  if OUT=$("$LINT" --repo-root "$FIXTURE_REPO" \
                   --intentions-dir "$FIXTURE_REPO/intentions" \
                   --baseline "$baseline" --no-status-warn 2>&1); then RC=0; else RC=$?; fi
}

# Same, but with the advisory warning ENABLED (the default in production).
run_lint_warn() {
  local baseline="${1:-$EMPTY_BASELINE}"
  if OUT=$("$LINT" --repo-root "$FIXTURE_REPO" \
                   --intentions-dir "$FIXTURE_REPO/intentions" \
                   --baseline "$baseline" 2>&1); then RC=0; else RC=$?; fi
}

# --- 1. live node, fence names an EXISTING path -> pass ---------------------
echo "Test: live node with an existing fence path passes"
reset_nodes
write_node live-existing implement '## Verification
```verify
bash .claude/live-script.sh
```'
run_lint
assert_eq "existing fence path exits 0" "0" "$RC"
assert_eq "existing fence path prints nothing" "" "$OUT"

# --- 2. live node, fence names a DELETED path -> fail, names node and path ---
# This is the incident: a path that once existed and was deleted out from under
# a live node's verify fence.
echo "Test: live node with a deleted fence path fails and names node + path"
reset_nodes
write_node live-orphan implement '## Verification
```verify
bash .claude/dead-script.sh
```'
run_lint
assert_eq "orphaned fence path exits 1" "1" "$RC"
assert_eq "orphaned fence path names node id and path" \
  "live-orphan: .claude/dead-script.sh" "$OUT"

# --- 3. `done` node naming the same deleted path -> pass (archive exemption) -
echo "Test: done node with a deleted fence path is exempt"
reset_nodes
write_node done-orphan done '## Verification
```verify
bash .claude/dead-script.sh
```'
run_lint
assert_eq "done node exits 0" "0" "$RC"
assert_eq "done node prints nothing" "" "$OUT"

# --- 4. fence OUTSIDE the Verification section -> ignored -------------------
echo "Test: verify fence outside the Verification section is ignored"
reset_nodes
write_node outside-section implement '## Scope
```verify
bash .claude/dead-script.sh
```

## Notes
nothing else'
run_lint
assert_eq "out-of-section fence exits 0" "0" "$RC"
assert_eq "out-of-section fence prints nothing" "" "$OUT"

# Same, via a section that ENDED before the fence.
echo "Test: fence after the Verification section ended is ignored"
reset_nodes
write_node after-section implement '## Verification
prose only

## Appendix
```verify
bash .claude/dead-script.sh
```'
run_lint
assert_eq "post-section fence exits 0" "0" "$RC"
assert_eq "post-section fence prints nothing" "" "$OUT"

# --- 5. in-section fence whose info string is NOT exactly `verify` ----------
echo "Test: non-verify info string inside Verification is ignored"
reset_nodes
write_node bash-fence implement '## Verification
```bash
bash .claude/dead-script.sh
```
```verifysomething
bash .claude/dead-script.sh
```'
run_lint
assert_eq "non-verify info string exits 0" "0" "$RC"
assert_eq "non-verify info string prints nothing" "" "$OUT"

# Converse: `verify` with trailing whitespace IS a verify fence (the trailing
# spaces after `verify` below are load-bearing — do not strip them).
echo "Test: 'verify' with trailing whitespace is still a verify fence"
reset_nodes
write_node verify-trailing-ws implement $'## Verification\n```verify  \nbash .claude/dead-script.sh\n```'
run_lint
assert_eq "trailing-whitespace info string exits 1" "1" "$RC"
assert_eq "trailing-whitespace info string names the path" \
  "verify-trailing-ws: .claude/dead-script.sh" "$OUT"

# --- 6. $VAR / glob / URL tokens are never candidates ----------------------
echo "Test: variable, glob, brace, paren and URL tokens are ignored"
reset_nodes
write_node noisy-tokens implement '## Verification
```verify
bash "$SCRIPTS/dead-script.sh"
bash .claude/$MISSING/dead-script.sh
ls .claude/dead-*.sh
ls .claude/dead-script.sh?
ls .claude/{dead-script.sh,other}
echo $(cat .claude/dead-script.sh)
curl https://example.com/.claude/dead-script.sh
plainword
```'
run_lint
assert_eq "noisy tokens exit 0" "0" "$RC"
assert_eq "noisy tokens print nothing" "" "$OUT"

# Guard the leading-segment filter too: a token whose first segment is not a
# top-level repo entry is ignored even though it is missing.
echo "Test: token whose leading segment is not a top-level repo entry is ignored"
reset_nodes
write_node foreign-segment implement '## Verification
```verify
bash notatoplevel/dead-script.sh
```'
run_lint
assert_eq "non-top-level leading segment exits 0" "0" "$RC"
assert_eq "non-top-level leading segment prints nothing" "" "$OUT"

# --- 7. `path:12-34` anchors are stripped before the existence test --------
echo "Test: a line/range anchor is stripped before the existence test"
reset_nodes
write_node anchored implement '## Verification
```verify
see packages/keep.ts:12-34 and packages/keep.ts:7
```'
run_lint
assert_eq "anchored existing path exits 0" "0" "$RC"
assert_eq "anchored existing path prints nothing" "" "$OUT"

# ...and an anchor on a DELETED path is still caught, reported without anchor.
echo "Test: an anchored deleted path is still caught, reported anchor-free"
reset_nodes
write_node anchored-orphan implement '## Verification
```verify
see .claude/dead-script.sh:42
```'
run_lint
assert_eq "anchored orphan exits 1" "1" "$RC"
assert_eq "anchored orphan reported without the anchor" \
  "anchored-orphan: .claude/dead-script.sh" "$OUT"

# --- forward references (never existed) are NOT violations -----------------
# A plan routinely names the file its own unit will CREATE. Those have no git
# history; flagging them would park the node this guard protects.
echo "Test: a forward reference (path that never existed) is not flagged"
reset_nodes
write_node forward-ref implement '## Verification
```verify
bash .claude/never-existed.sh
```'
run_lint
assert_eq "forward reference exits 0" "0" "$RC"
assert_eq "forward reference prints nothing" "" "$OUT"

# --- whole top-level tree deleted (the fail-open case) ----------------------
# The leading-segment filter must not be read off the POST-deletion working
# tree: when the deletion removes or renames the top-level directory itself,
# every orphaned path beneath it loses its key and would be silently skipped —
# the guard failing open at exactly its largest blast radius.
echo "Test: a path orphaned by deleting its whole top-level tree is caught"
reset_nodes
write_node gone-tree implement '## Verification
```verify
bash gone-pkg/tool.sh
```'
run_lint
assert_eq "orphan under a deleted top-level tree exits 1" "1" "$RC"
assert_eq "orphan under a deleted top-level tree is named" \
  "gone-tree: gone-pkg/tool.sh" "$OUT"

# ...and widening the candidate set does not widen what is REPORTED: a never-
# existed path under the same deleted tree is still a forward reference.
echo "Test: a forward reference under a deleted top-level tree is not flagged"
reset_nodes
write_node gone-tree-forward implement '## Verification
```verify
bash gone-pkg/brand-new.sh
```'
run_lint
assert_eq "forward reference under a deleted tree exits 0" "0" "$RC"
assert_eq "forward reference under a deleted tree prints nothing" "" "$OUT"

# --- baseline grandfathering ----------------------------------------------
echo "Test: a baselined violation is grandfathered; a new one still fails"
reset_nodes
write_node live-orphan implement '## Verification
```verify
bash .claude/dead-script.sh
```'
GRANDFATHERED="$FIXTURE_REPO/grandfathered.json"
printf '[{"id":"live-orphan","path":".claude/dead-script.sh"}]\n' > "$GRANDFATHERED"
run_lint "$GRANDFATHERED"
assert_eq "baselined violation exits 0" "0" "$RC"
assert_eq "baselined violation prints nothing" "" "$OUT"

write_node other-orphan implement '## Verification
```verify
bash .claude/dead-script.sh
```'
run_lint "$GRANDFATHERED"
assert_eq "non-baselined violation still exits 1" "1" "$RC"
assert_eq "non-baselined violation is the only one reported" \
  "other-orphan: .claude/dead-script.sh" "$OUT"

echo "Test: a malformed baseline is a clear error (exit 2), not a silent pass"
reset_nodes
BAD_BASELINE="$FIXTURE_REPO/bad.json"
printf '{"not":"an array"}\n' > "$BAD_BASELINE"
run_lint "$BAD_BASELINE"
assert_eq "malformed baseline exits 2" "2" "$RC"

# --- no verify blocks at all ----------------------------------------------
echo "Test: a node with no Verification section is a no-op"
reset_nodes
write_node no-section implement 'just prose, no verification'
run_lint
assert_eq "no Verification section exits 0" "0" "$RC"
assert_eq "no Verification section prints nothing" "" "$OUT"

# --- shipped baseline is empty --------------------------------------------
# The sibling sweep cleared every live violation, so the shipped baseline must
# ship empty and must not grow.
echo "Test: the shipped baseline is empty"
shipped=$(jq -r 'length' "$SCRIPT_DIR/verify-fence-path-baseline.json")
assert_eq "shipped verify-fence-path-baseline.json has no entries" "0" "$shipped"

# --- 10. swallowed non-final statement status -> WARN on stderr, exit 0 -----
# The advisory check the linter's header documents: dispatch-run-verification
# runs a block as plain `bash <file>` with no `set -e`, so only the LAST
# statement decides pass/fail. These cases pin the warning's shape and, just as
# importantly, its inability to change the exit status.
echo "Test: a non-final unguarded statement warns but does not fail"
reset_nodes
write_node warn-unguarded implement '## Verification
```verify
bash .claude/live-script.sh
bash packages/keep.ts
```'
run_lint_warn
assert_eq "unguarded non-final statement still exits 0" "0" "$RC"
case "$OUT" in *"WARN warn-unguarded"*) : ;; *) echo "FAIL: expected a WARN, got: $OUT"; exit 1 ;; esac

echo "Test: --no-status-warn silences it"
run_lint
assert_eq "--no-status-warn exits 0" "0" "$RC"
assert_eq "--no-status-warn prints nothing" "" "$OUT"

echo "Test: a single-statement block never warns"
reset_nodes
write_node warn-single implement '## Verification
```verify
bash .claude/live-script.sh
```'
run_lint_warn
assert_eq "single statement exits 0" "0" "$RC"
assert_eq "single statement prints nothing" "" "$OUT"

echo "Test: guarded non-final statements never warn"
reset_nodes
write_node warn-guarded implement '## Verification
```verify
bash .claude/live-script.sh || exit 1
! bash .claude/live-script.sh
bash packages/keep.ts; rc=$?
bash .claude/live-script.sh
```'
run_lint_warn
assert_eq "guarded statements exit 0" "0" "$RC"
assert_eq "guarded statements print nothing" "" "$OUT"

echo "Test: a block that sets errexit itself never warns"
reset_nodes
write_node warn-errexit implement '## Verification
```verify
set -euo pipefail
bash .claude/live-script.sh
bash packages/keep.ts
```'
run_lint_warn
assert_eq "set -e block exits 0" "0" "$RC"
assert_eq "set -e block prints nothing" "" "$OUT"

# --- 11. the exemptions are ANCHORED, not substring/head-word/leading-regex ---
# Five defects the line-wise splitter carried at introduction (PR #3145 review,
# findings 1-5). Each case below was PROVEN red against that splitter: every one
# emitted NO warning at all, so a genuinely swallowed assertion read as clean.
# They pin the one direction this check cannot afford to be wrong in — an
# over-broad exemption is INVISIBLE, whereas a false positive is merely noise on
# an advisory channel. If one of these ever goes quiet again, the exemption it
# guards has widened.

echo "Test: an echo/printf-headed PIPELINE is an assertion, not an exempt builtin"
reset_nodes
write_node warn-pipeline-head implement $'## Verification\n```verify\nprintf \'%s\' "$out" | grep -q ok\nbash packages/keep.ts\n```'
run_lint_warn
assert_eq "printf-headed pipeline still exits 0" "0" "$RC"
assert_contains_local "the printf-headed pipeline itself is warned" \
  ": printf '%s' \"\$out\" | grep -q ok" "$OUT"

echo "Test: a one-line compound does not leak depth and drop the rest of the block"
reset_nodes
write_node warn-oneline-compound implement '## Verification
```verify
if [ -f x ]; then echo y; fi
bash .claude/live-script.sh
bash packages/keep.ts
```'
run_lint_warn
assert_eq "one-line-compound block still exits 0" "0" "$RC"
assert_contains_local "the statement after a one-line if is still analysed" \
  ": bash .claude/live-script.sh" "$OUT"

echo "Test: a one-line case closed with 'esac;' does not leak depth either"
reset_nodes
write_node warn-oneline-esac implement '## Verification
```verify
case x in a) echo a ;; esac;
bash .claude/live-script.sh
bash packages/keep.ts
```'
run_lint_warn
assert_eq "one-line-esac block still exits 0" "0" "$RC"
assert_contains_local "the statement after a one-line case is still analysed" \
  ": bash .claude/live-script.sh" "$OUT"

echo "Test: a quote nested inside the other kind does not swallow the block's tail"
reset_nodes
write_node warn-nested-quote implement $'## Verification\n```verify\n! grep -q \'AW_DISP" == "pruned"\' packages/keep.ts\nbash .claude/live-script.sh\nbash packages/keep.ts\n```'
run_lint_warn
assert_eq "nested-quote block still exits 0" "0" "$RC"
assert_contains_local "the statement after a nested quote is still analysed" \
  ": bash .claude/live-script.sh" "$OUT"
assert_not_contains_local "the !-guarded nested-quote statement is not itself warned" \
  "AW_DISP" "$OUT"

echo "Test: 'set -e' quoted inside a command does not exempt the whole block"
reset_nodes
write_node warn-quoted-set-e implement $'## Verification\n```verify\nbash -c \'set -e; grep -q x packages/keep.ts\'\nbash .claude/live-script.sh\nbash packages/keep.ts\n```'
run_lint_warn
assert_eq "quoted set -e block still exits 0" "0" "$RC"
assert_contains_local "a block whose only 'set -e' is quoted is still analysed" \
  ": bash .claude/live-script.sh" "$OUT"

echo "Test: an env-var-prefixed command is not exempted as an assignment"
reset_nodes
write_node warn-env-prefix implement '## Verification
```verify
NODE_ENV=test npx vitest run
bash packages/keep.ts
```'
run_lint_warn
assert_eq "env-prefixed command block still exits 0" "0" "$RC"
assert_contains_local "the env-prefixed command is warned" \
  ": NODE_ENV=test npx vitest run" "$OUT"

# ...and the converse the anchored assignment test must not break: a REAL
# assignment whose value legitimately contains spaces stays exempt. Without
# this, the obvious "warn unless the whole statement is one word" fix would
# false-positive on `out=$(cmd a b)`, the corpus's most common shape.
echo "Test: an assignment whose value contains spaces is still exempt"
reset_nodes
write_node warn-real-assignment implement $'## Verification\n```verify\nout=$(cat packages/keep.ts)\nmsg="a b"\nbash packages/keep.ts\n```'
run_lint_warn
assert_eq "assignment-only statements exit 0" "0" "$RC"
assert_eq "assignment-only statements print nothing" "" "$OUT"


# --- 12. the SPLITTER cannot be made to drop the block's tail ----------------
# The exemptions above are anchored; these pin the other half — the statement
# SPLIT itself. Each shape below leaked `depth`, opened a phantom continuation,
# or matched the errexit exemption from a place that never runs, and the result
# was the same in every case: the rest of the block silently left the analysis
# and a swallowed assertion read as clean. Every case was PROVEN red before the
# fix. Each asserts on a statement that comes AFTER the awkward line, because
# that is what a leak destroys.

echo "Test: a one-line compound with a trailing redirect does not leak depth"
reset_nodes
write_node warn-oneline-redirect implement '## Verification
```verify
for f in a b; do bash "$f"; done > /dev/null
bash .claude/live-script.sh
bash packages/keep.ts
```'
run_lint_warn
assert_eq "trailing-redirect compound block still exits 0" "0" "$RC"
assert_contains_local "the statement after a redirected one-line loop is still analysed" \
  ": bash .claude/live-script.sh" "$OUT"

echo "Test: a one-line compound with a trailing comment does not leak depth"
reset_nodes
write_node warn-oneline-comment implement '## Verification
```verify
if [ -f x ]; then echo y; fi  # sanity
bash .claude/live-script.sh
bash packages/keep.ts
```'
run_lint_warn
assert_eq "trailing-comment compound block still exits 0" "0" "$RC"
assert_contains_local "the statement after a commented one-line if is still analysed" \
  ": bash .claude/live-script.sh" "$OUT"

echo "Test: a closer written 'fi ;' still closes the compound"
reset_nodes
write_node warn-spaced-closer implement '## Verification
```verify
if [ -f x ]; then
  bash .claude/live-script.sh
fi ;
bash .claude/live-script.sh
bash packages/keep.ts
```'
run_lint_warn
assert_eq "spaced-closer block still exits 0" "0" "$RC"
assert_contains_local "the statement after a 'fi ;' closer is still analysed" \
  ": bash .claude/live-script.sh" "$OUT"

echo "Test: an apostrophe in a trailing comment does not swallow the block"
reset_nodes
write_node warn-comment-apostrophe implement $'## Verification\n```verify\nbash .claude/live-script.sh  # it\'s fine\nbash .claude/live-script.sh\nbash packages/keep.ts\n```'
run_lint_warn
assert_eq "comment-apostrophe block still exits 0" "0" "$RC"
assert_contains_local "the statement after an apostrophe comment is still analysed" \
  ": bash .claude/live-script.sh" "$OUT"

echo "Test: a heredoc payload's 'set -e' does not exempt the whole block"
reset_nodes
write_node warn-heredoc-set-e implement '## Verification
```verify
cat > f <<EOF
set -euo pipefail
EOF
bash .claude/live-script.sh
bash packages/keep.ts
```'
run_lint_warn
assert_eq "heredoc set -e block still exits 0" "0" "$RC"
assert_contains_local "a block whose only 'set -e' is a heredoc payload is still analysed" \
  ": bash .claude/live-script.sh" "$OUT"
assert_not_contains_local "the heredoc payload line is not itself a statement" \
  "set -euo pipefail" "$OUT"

# ...and the converse: `<<EOF` named inside quotes opens no heredoc, so the rest
# of the block must not be consumed as its payload.
echo "Test: a quoted <<EOF opens no heredoc"
reset_nodes
write_node warn-quoted-heredoc implement '## Verification
```verify
grep -q "<<EOF" packages/keep.ts
bash .claude/live-script.sh
bash packages/keep.ts
```'
run_lint_warn
assert_eq "quoted-heredoc block still exits 0" "0" "$RC"
assert_contains_local "the statement after a quoted <<EOF is still analysed" \
  ": bash .claude/live-script.sh" "$OUT"

echo "Test: an assignment carrying an escaped quote is still exempt"
reset_nodes
write_node warn-escaped-quote-assignment implement $'## Verification\n```verify\nmsg="a\\" b"\nbash packages/keep.ts\n```'
run_lint_warn
assert_eq "escaped-quote assignment exits 0" "0" "$RC"
assert_eq "escaped-quote assignment prints nothing" "" "$OUT"

# ---------------------------------------------------------------------------
# lib-verify-fence.sh extraction regression: dispatch-run-verification's exit
# codes must be unchanged now that it calls the shared parser.
#
# test-dispatch-run-verification.sh already covers 0/1/2/3/4/5 exhaustively
# (23 assertions, including both unclosed-fence boundaries). Rather than
# duplicate it, this smoke case pins the two ends of the range — that the
# script still sources the extracted lib and still returns its documented codes
# — so a breakage in the extraction fails HERE too, not only in that suite.
echo ""
echo "=== dispatch-run-verification exit codes after the lib extraction ==="
RUN_VERIFY="$SCRIPT_DIR/dispatch-run-verification"
declare -A EXPECTED_RC=()
EXPECTED_RC[0]=$'## Verification\n```verify\ntrue\n```\n'
EXPECTED_RC[1]=$'## Verification\n```verify\nfalse\n```\n'
EXPECTED_RC[3]=$'## Verification\nprose only\n```bash\ntrue\n```\n'
EXPECTED_RC[4]=$'   \n'
EXPECTED_RC[5]=$'## Verification\n```verify\ntrue\n'
for want in 0 1 3 4 5; do
  if printf '%s' "${EXPECTED_RC[$want]}" | "$RUN_VERIFY" >/dev/null 2>&1; then got=0; else got=$?; fi
  assert_eq "dispatch-run-verification still exits $want" "$want" "$got"
done
if "$RUN_VERIFY" bogus-arg </dev/null >/dev/null 2>&1; then got=0; else got=$?; fi
assert_eq "dispatch-run-verification still exits 2 on a bad argument" "2" "$got"

rm -rf "$FIXTURE_REPO"

report_results
