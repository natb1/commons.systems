#!/usr/bin/env bash
# Tests for `diffContext` in .claude/workflows/review-fix.js, sliced out by
# review-fix-diff-context-probe.mjs — modeled directly on
# test-review-fix-domain-sweep.sh.
set -euo pipefail

FIXTURE_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=dispatch-test-fixture.sh
source "$FIXTURE_DIR/dispatch-test-fixture.sh"

# ============================================================================
# === review-fix diff context (tactic-review-delta-base-and-blast-radius) ===
# ============================================================================
# CI vector: run-unit-tests.sh has no mapping for .claude/workflows/*, so a PR
# touching only review-fix.js triggers no vitest suite. The hook-tests job
# (this script) is the only test that runs on every PR, so coverage for
# diffContext must live here.
#
# THE INVARIANT: the review BASE and the review FILE LIST must move together.
# Only two pairs are coherent — (narrowed base, delta list) and (full base,
# whole-PR list). The third combination, a narrowed base paired with the whole
# PR's file list, tells the finder "review only the delta" and then hands it an
# inventory of every file the PR ever touched: it either reviews the full PR
# anyway (no saving) or treats the list as the delta (wrong scope).

echo "Test: review-fix diff context"

out=$(node "$SCRIPT_DIR/review-fix-diff-context-probe.mjs")

REVIEW_FIX_JS="$REPO_ROOT/.claude/workflows/review-fix.js"

MB=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
RB=bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb
REC=cccccccccccccccccccccccccccccccccccccccc

field() { printf '%s' "$out" | jq -r ".$1"; }

FIRST=$(field first_review)
RE=$(field re_review)
EMPTY=$(field empty_delta)
SAME=$(field base_equals_merge_base)
REBASED=$(field rebased)

# --- 1. first review: the full pair, and no re-review paragraph --------------

assert_contains_local "first review: diffs against the merge base" \
  "against \`$MB\`" "$FIRST"
assert_contains_local "first review: lists every changed file" \
  "Changed files: a.ts, b.ts, c.ts." "$FIRST"
assert_not_contains_local "first review: says nothing about a RE-review" \
  "This is a RE-review" "$FIRST"

# --- 2. re-review with a real delta: the narrowed pair -----------------------

assert_contains_local "re-review: diffs against the NARROWED base" \
  "against \`$RB\`" "$RE"
assert_contains_local "re-review: lists the DELTA's files only" \
  "Changed files: b.ts." "$RE"
assert_not_contains_local "re-review: does NOT list the whole PR's files" \
  "a.ts, b.ts, c.ts" "$RE"
assert_contains_local "re-review: says so" "This is a RE-review" "$RE"
# The full merge base stays READable — the narrowing must not fence off context.
assert_contains_local "re-review: full merge base is still readable" \
  "git diff $MB..HEAD" "$RE"

# --- 3. EMPTY delta: the FULL pair, never the incoherent third combination ---
#
# This is the regression this file exists for. `dispatch-review-base` returns a
# synthetic base that cancels origin/main churn, so when the only change since
# the last pass IS that churn, the delta comes back empty. A bare truthiness
# check on review_changed_files then keeps the narrowed base and swaps in the
# whole PR's file list.

assert_contains_local "empty delta: falls back to the FULL base" \
  "against \`$MB\`" "$EMPTY"
assert_not_contains_local "empty delta: does NOT keep the narrowed base" \
  "$RB" "$EMPTY"
assert_contains_local "empty delta: pairs it with the whole-PR list" \
  "Changed files: a.ts, b.ts, c.ts." "$EMPTY"
assert_not_contains_local "empty delta: claims no narrowing it did not do" \
  "This is a RE-review" "$EMPTY"
# The strongest statement of the invariant: an empty delta is INDISTINGUISHABLE
# from a first review. Any drift between them is the incoherent pair returning.
assert_eq "empty delta: byte-identical to a first review" "$FIRST" "$EMPTY"

# --- 4. review_base === merge_base: every fail-closed path lands here --------

assert_eq "review_base == merge_base: byte-identical to a first review" "$FIRST" "$SAME"

# --- 5. the `sidecar-rebased` path surfaces the recorded sha -----------------
#
# review_base is a synthetic commit no `git log` resolves. Without this, an
# agent orienting itself with `git log <base>` gets "unknown revision" and has
# no route to the real previous-pass sha.

assert_contains_local "rebased: still diffs from the synthetic base" \
  "against \`$RB\`" "$REBASED"
assert_contains_local "rebased: names the base as synthetic" \
  "is a SYNTHETIC commit" "$REBASED"
assert_contains_local "rebased: reports the recorded sha" \
  "actually covered \`$REC\`" "$REBASED"
# The recorded sha is REPORTED, never a range start — diffing from it is exactly
# the origin/main churn bug the synthetic base replaced.
assert_contains_local "rebased: forbids diffing from the recorded sha" \
  "do NOT diff from it" "$REBASED"
assert_not_contains_local "rebased: never offers the recorded sha as a range" \
  "git diff $REC" "$REBASED"

# The plain-sidecar path carries no recorded sha and must stay silent about it.
assert_not_contains_local "plain sidecar: no synthetic-commit paragraph" \
  "is a SYNTHETIC commit" "$RE"

# --- 6. pin the literal ------------------------------------------------------
#
# The behaviour above is pinned by the probe, but a rewrite back to a bare
# truthiness check would read as equivalent. Pin the explicit length test so
# that regression cannot slip in as a cosmetic simplification.
assert_eq "the empty-delta guard is an explicit length test" "1" \
  "$(grep -c "args.review_changed_files.length > 0" "$REVIEW_FIX_JS" || true)"

report_results
