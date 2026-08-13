#!/usr/bin/env node
// review-fix-diff-context-probe.mjs (tactic-review-delta-base-and-blast-radius)
//
// CI-vector probe for `diffContext` in .claude/workflows/review-fix.js —
// the function that pairs the review BASE with the review FILE LIST.
//
// Why this file exists at all: run-unit-tests.sh has no mapping for
// .claude/workflows/*, so a PR touching only review-fix.js triggers no vitest
// suite, and its test-*.sh glob over this directory only runs when
// RUN_PR_SCRIPTS is set (auto-detect sets that solely for changed paths under
// .claude/skills/dispatch-propagate/scripts/). The actual CI vector is the
// hook-tests job in .github/workflows/unit-tests.yml, which runs this probe's
// driver — test-review-fix-diff-context.sh — unconditionally on every PR.
// Keep that step wired; deleting it removes all coverage here. This mirrors
// review-fix-domain-sweep-probe.mjs exactly.
//
// review-fix.js is a Workflow-tool script (top-level await + injected globals),
// so it cannot be imported or executed by node. This probe SLICES the pure
// `diffContext` region out from between sentinel comments and evals it.
//
// WHAT IS UNDER TEST — the invariant that base and file list move TOGETHER.
// There are exactly two coherent pairs:
//   (narrowed base, delta list)  and  (full base, whole-PR list)
// The third combination — narrowed base paired with the whole PR's file list —
// tells a finder "review only the delta" and then hands it an inventory of
// every file the PR ever touched. That is the shape a bare truthiness check on
// review_changed_files produces when the delta is EMPTY, and the vectors below
// pin it closed.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// Resolve review-fix.js relative to this helper's own location: this helper
// sits at .claude/skills/dispatch-propagate/scripts/, so review-fix.js is three
// dirs up at .claude/workflows/review-fix.js.
const reviewFixPath = fileURLToPath(
  new URL('../../../workflows/review-fix.js', import.meta.url)
);

const source = readFileSync(reviewFixPath, 'utf8');

function countOccurrences(haystack, needle) {
  let count = 0;
  let idx = haystack.indexOf(needle);
  while (idx !== -1) {
    count += 1;
    idx = haystack.indexOf(needle, idx + needle.length);
  }
  return count;
}

// FAIL LOUDLY: the sentinel pair must appear exactly once and bound a non-empty
// slice. A silently-empty slice would make every assertion below vacuous.
function sliceBetween(src, START, END) {
  const startCount = countOccurrences(src, START);
  const endCount = countOccurrences(src, END);
  if (startCount !== 1) {
    process.stderr.write(
      `review-fix-diff-context-probe: START sentinel not found exactly once (count=${startCount}) for "${START}" in ${reviewFixPath}\n`
    );
    process.exit(1);
  }
  if (endCount !== 1) {
    process.stderr.write(
      `review-fix-diff-context-probe: END sentinel not found exactly once (count=${endCount}) for "${END}" in ${reviewFixPath}\n`
    );
    process.exit(1);
  }
  const startIdx = src.indexOf(START) + START.length;
  const endIdx = src.indexOf(END);
  const slice = src.slice(startIdx, endIdx).trim();
  if (!slice) {
    process.stderr.write(
      `review-fix-diff-context-probe: empty slice between "${START}" and "${END}"\n`
    );
    process.exit(1);
  }
  return slice;
}

const START =
  "// >>> diff context: sliced + eval'd by review-fix-diff-context-probe.mjs >>>";
const END = '// <<< diff context <<<';

const slice = sliceBetween(source, START, END);

const { diffContext } = (function () {
  // eslint-disable-next-line no-eval -- see comment above // type-safety-ok: eval is required (not new Function) because the slice is a top-level function declaration, not a single expression
  return eval(`(function () { ${slice}\nreturn { diffContext }; })()`);
})();

const MB = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
const RB = 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
const REC = 'cccccccccccccccccccccccccccccccccccccccc';
const ALL = ['a.ts', 'b.ts', 'c.ts'];
const DELTA = ['b.ts'];

const results = {};

// 1. FIRST review — no review_base at all. Today's behaviour, unchanged.
results.first_review = diffContext({ merge_base: MB, changed_files: ALL });

// 2. RE-review with a real delta — the narrowed pair.
results.re_review = diffContext({
  merge_base: MB,
  review_base: RB,
  changed_files: ALL,
  review_changed_files: DELTA,
});

// 3. RE-review with an EMPTY delta — must take the FULL pair, not the
//    incoherent (narrowed base, whole-PR list) third combination.
results.empty_delta = diffContext({
  merge_base: MB,
  review_base: RB,
  changed_files: ALL,
  review_changed_files: [],
});

// 4. review_base === merge_base (every fail-closed path in dispatch-review-base
//    returns exactly this). Must be indistinguishable from a first review.
results.base_equals_merge_base = diffContext({
  merge_base: MB,
  review_base: MB,
  changed_files: ALL,
  review_changed_files: ALL,
});

// 5. The `sidecar-rebased` path: review_base is synthetic, so the recorded sha
//    is the only one `git log` resolves and must be surfaced.
results.rebased = diffContext({
  merge_base: MB,
  review_base: RB,
  review_base_recorded: REC,
  changed_files: ALL,
  review_changed_files: DELTA,
});

// The plain-sidecar path (vector 2, no review_base_recorded) must NOT emit the
// synthetic-commit paragraph; the driver asserts that against `re_review`.

process.stdout.write(JSON.stringify(results) + '\n');
