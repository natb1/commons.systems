#!/usr/bin/env bash
# Tests for dispatch-blast-radius.
set -euo pipefail

FIXTURE_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=dispatch-test-fixture.sh
source "$FIXTURE_DIR/dispatch-test-fixture.sh"

echo "Test: dispatch-blast-radius"

SUT="$SCRIPT_DIR/dispatch-blast-radius"

# --- fixture tree ------------------------------------------------------------
# A small repo-shaped tree: one helper, one out-of-diff caller, one unrelated
# file, plus an excluded-directory copy and a near-miss identifier.
BR_ROOT=$(mktemp -d)
trap 'rm -rf "$BR_ROOT"' EXIT

mkdir -p "$BR_ROOT/src" "$BR_ROOT/node_modules/pkg" "$BR_ROOT/dist"
printf 'export function computeWidget(a) { return a; }\n' > "$BR_ROOT/src/helper.ts"
printf 'import { computeWidget } from "./helper";\ncomputeWidget(1);\n' > "$BR_ROOT/src/caller.ts"
printf 'const unrelated = 1;\n' > "$BR_ROOT/src/other.ts"
# Near-miss: `computeWidgetExtra` must NOT satisfy a search for `computeWidget`.
printf 'const computeWidgetExtra = 2;\n' > "$BR_ROOT/src/nearmiss.ts"
# Excluded directories: a reference here must never reach the reading list.
printf 'computeWidget();\n' > "$BR_ROOT/node_modules/pkg/index.js"
printf 'computeWidget();\n' > "$BR_ROOT/dist/bundle.js"

# Helper: extract one key's value(s) from the classifier output.
field() { printf '%s\n' "$1" | sed -n "s/^$2=//p"; }

# --- empty stdin -------------------------------------------------------------
out=$(printf '' | "$SUT" --root "$BR_ROOT")
assert_eq "empty stdin → 0 symbols" "0" "$(field "$out" blast_radius_symbols)"
assert_eq "empty stdin → 0 files" "0" "$(field "$out" blast_radius_files)"
assert_eq "empty stdin → not truncated" "false" "$(field "$out" blast_radius_truncated)"

# --- changed exported function ----------------------------------------------
# The core case: a helper's signature changes, and the caller three files away
# is invisible to a literal `git diff` of the delta. That caller is the whole
# reason this classifier exists.
diff_changed=$'--- a/src/helper.ts\n+++ b/src/helper.ts\n@@ -1,1 +1,1 @@\n-export function computeWidget(a) { return a; }\n+export function computeWidget(a, b) { return a + b; }\n'
out=$(printf '%s' "$diff_changed" | "$SUT" --root "$BR_ROOT")
assert_eq "changed fn → symbol extracted" "computeWidget" "$(field "$out" blast_radius_symbol)"
assert_eq "changed fn → out-of-diff caller is the reading list" "src/caller.ts" "$(field "$out" blast_radius_file)"
assert_eq "changed fn → file count" "1" "$(field "$out" blast_radius_files)"

# The diff's OWN file must not appear — it is already in the reviewer's diff,
# and emitting it would pad the reading list with what was already read.
assert_eq "diff's own file excluded from reading list" "" "$(printf '%s\n' "$out" | grep -c 'blast_radius_file=src/helper.ts' | grep -v '^0$' || true)"

# Excluded directories are excluded. `--exclude-dir` is inert when the search
# target is an expanded glob, so this row also pins that the SUT passes a
# DIRECTORY as the target.
assert_eq "node_modules reference not in reading list" "" "$(printf '%s\n' "$out" | grep -c 'node_modules' | grep -v '^0$' || true)"
assert_eq "dist reference not in reading list" "" "$(printf '%s\n' "$out" | grep -c 'dist/' | grep -v '^0$' || true)"

# Word boundary: `computeWidgetExtra` is a different symbol. Without -w the
# reading list silently widens to every identifier with a matching prefix.
assert_eq "near-miss identifier not matched (word boundary)" "" "$(printf '%s\n' "$out" | grep -c 'nearmiss' | grep -v '^0$' || true)"

# --- deleted symbol ----------------------------------------------------------
# A removed line is the strongest blast-radius signal there is: the out-of-diff
# callers are exactly the sites that now fail to resolve. Scanning only added
# lines would miss every deletion.
diff_deleted=$'--- a/src/helper.ts\n+++ b/src/helper.ts\n@@ -1,1 +0,0 @@\n-export function computeWidget(a) { return a; }\n'
out=$(printf '%s' "$diff_deleted" | "$SUT" --root "$BR_ROOT")
assert_eq "deleted fn → symbol still extracted" "computeWidget" "$(field "$out" blast_radius_symbol)"
assert_eq "deleted fn → caller still surfaced" "src/caller.ts" "$(field "$out" blast_radius_file)"

# --- a call site is not a declaration ---------------------------------------
# A diff that merely CALLS a symbol has not changed its contract. Treating every
# mentioned identifier as a symbol would make the reading list the whole repo.
diff_call_only=$'--- a/src/other.ts\n+++ b/src/other.ts\n@@ -1,1 +1,2 @@\n+  computeWidget(3);\n'
out=$(printf '%s' "$diff_call_only" | "$SUT" --root "$BR_ROOT")
assert_eq "call site without declaration → no symbols" "0" "$(field "$out" blast_radius_symbols)"
assert_eq "call site without declaration → no reading list" "0" "$(field "$out" blast_radius_files)"

# --- bash and go declaration forms -------------------------------------------
printf 'reap_worktree() { echo hi; }\n' > "$BR_ROOT/src/reaper.sh"
printf 'reap_worktree\n' > "$BR_ROOT/src/driver.sh"
diff_bash=$'--- a/src/reaper.sh\n+++ b/src/reaper.sh\n@@ -1,1 +1,1 @@\n-reap_worktree() { echo hi; }\n+reap_worktree() { echo bye; }\n'
out=$(printf '%s' "$diff_bash" | "$SUT" --root "$BR_ROOT")
assert_eq "bash fn declaration → symbol extracted" "reap_worktree" "$(field "$out" blast_radius_symbol)"
assert_eq "bash fn declaration → caller surfaced" "src/driver.sh" "$(field "$out" blast_radius_file)"

printf 'package main\nfunc ComputeTotal(a int) int { return a }\n' > "$BR_ROOT/src/total.go"
printf 'package main\nfunc use() { ComputeTotal(1) }\n' > "$BR_ROOT/src/usetotal.go"
diff_go=$'--- a/src/total.go\n+++ b/src/total.go\n@@ -1,1 +1,1 @@\n-func ComputeTotal(a int) int { return a }\n+func ComputeTotal(a, b int) int { return a + b }\n'
out=$(printf '%s' "$diff_go" | "$SUT" --root "$BR_ROOT")
assert_eq "go func declaration → symbol extracted" "ComputeTotal" "$(field "$out" blast_radius_symbol)"
assert_eq "go func declaration → caller surfaced" "src/usetotal.go" "$(field "$out" blast_radius_file)"

# --- generic-symbol drop -----------------------------------------------------
# A symbol referenced by more out-of-diff files than the threshold carries no
# locality. It is DROPPED and COUNTED, never silently included: a reading list
# nobody can read is the same as no reading list.
GEN_ROOT=$(mktemp -d)
mkdir -p "$GEN_ROOT/src"
printf 'export function run(a) { return a; }\n' > "$GEN_ROOT/src/runner.ts"
i=1
while [ "$i" -le 25 ]; do
  printf 'run(%d);\n' "$i" > "$GEN_ROOT/src/c$i.ts"
  i=$((i + 1))
done
diff_generic=$'--- a/src/runner.ts\n+++ b/src/runner.ts\n@@ -1,1 +1,1 @@\n-export function run(a) { return a; }\n+export function run(a, b) { return a + b; }\n'
out=$(printf '%s' "$diff_generic" | "$SUT" --root "$GEN_ROOT")
assert_eq "generic symbol → counted as generic" "1" "$(field "$out" blast_radius_generic)"
assert_eq "generic symbol → not emitted as a symbol" "" "$(field "$out" blast_radius_symbol)"
assert_eq "generic symbol → contributes no reading list" "0" "$(field "$out" blast_radius_files)"
rm -rf "$GEN_ROOT"

# --- file cap reports truncation --------------------------------------------
# Truncation must be VISIBLE. A silently capped list reads as "everything
# relevant", which is the failure mode the flag exists to prevent. Five symbols
# each just under the generic threshold overflow the 40-file emit cap between
# them.
CAP_ROOT=$(mktemp -d)
mkdir -p "$CAP_ROOT/src"
cap_diff="--- a/src/api.ts"$'\n'"+++ b/src/api.ts"$'\n'"@@ -1,5 +1,5 @@"$'\n'
s=1
while [ "$s" -le 5 ]; do
  cap_diff="${cap_diff}+export function widgetSym${s}(a) { return a; }"$'\n'
  j=1
  while [ "$j" -le 15 ]; do
    printf 'widgetSym%d(%d);\n' "$s" "$j" > "$CAP_ROOT/src/s${s}_c${j}.ts"
    j=$((j + 1))
  done
  s=$((s + 1))
done
out=$(printf '%s' "$cap_diff" | "$SUT" --root "$CAP_ROOT")
assert_eq "file cap → truncated flag set" "true" "$(field "$out" blast_radius_truncated)"
assert_eq "file cap → emitted count is the cap" "40" "$(field "$out" blast_radius_files)"
assert_eq "file cap → emitted lines match the count" "40" "$(printf '%s\n' "$out" | grep -c '^blast_radius_file=')"
rm -rf "$CAP_ROOT"

# --- symbol cap reports truncation ------------------------------------------
SYM_ROOT=$(mktemp -d)
mkdir -p "$SYM_ROOT/src"
sym_diff="--- a/src/many.ts"$'\n'"+++ b/src/many.ts"$'\n'"@@ -1,50 +1,50 @@"$'\n'
k=1
while [ "$k" -le 45 ]; do
  sym_diff="${sym_diff}+export const manySymbol${k} = ${k};"$'\n'
  k=$((k + 1))
done
out=$(printf '%s' "$sym_diff" | "$SUT" --root "$SYM_ROOT")
assert_eq "symbol cap → total count is the real total, not the cap" "45" "$(field "$out" blast_radius_symbols)"
assert_eq "symbol cap → truncated flag set" "true" "$(field "$out" blast_radius_truncated)"
assert_eq "symbol cap → at most MAX_SYMBOLS emitted" "40" "$(printf '%s\n' "$out" | grep -c '^blast_radius_symbol=')"
rm -rf "$SYM_ROOT"

# --- read-only contract ------------------------------------------------------
# The script reads the working tree — the one way it differs from its three
# pure siblings on this seam. It must never WRITE it, or the "no
# dangerouslyDisableSandbox needed" property in its header is false.
RO_ROOT=$(mktemp -d)
mkdir -p "$RO_ROOT/src"
printf 'export function computeWidget(a) { return a; }\n' > "$RO_ROOT/src/helper.ts"
printf 'computeWidget(1);\n' > "$RO_ROOT/src/caller.ts"
before=$(cd "$RO_ROOT" && find . -type f | sort && cd "$RO_ROOT" && cat src/helper.ts src/caller.ts)
printf '%s' "$diff_changed" | "$SUT" --root "$RO_ROOT" >/dev/null
after=$(cd "$RO_ROOT" && find . -type f | sort && cd "$RO_ROOT" && cat src/helper.ts src/caller.ts)
assert_eq "SUT leaves the searched tree byte-identical" "$before" "$after"
rm -rf "$RO_ROOT"

# --- argument errors ---------------------------------------------------------
rc=0
printf '' | "$SUT" --root /nonexistent-blast-radius-root >/dev/null 2>&1 || rc=$?
assert_eq "missing --root dir → exit 2" "2" "$rc"

rc=0
printf '' | "$SUT" --bogus >/dev/null 2>&1 || rc=$?
assert_eq "unknown argument → exit 2" "2" "$rc"

report_results
