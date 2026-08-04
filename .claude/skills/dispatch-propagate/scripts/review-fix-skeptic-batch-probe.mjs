#!/usr/bin/env node
// review-fix-skeptic-batch-probe.mjs (tactic-review-verify-per-file-batching)
//
// CI-vector probe for filePath and skepticBatchJobs in
// .claude/workflows/review-fix.js. run-unit-tests.sh has no mapping for
// .claude/workflows/*, so a PR touching only review-fix.js triggers no
// vitest suite. Its test-*.sh glob over this directory is NOT a fallback
// either: that glob only runs when RUN_PR_SCRIPTS is set, which auto-detect
// sets solely for changed paths under
// .claude/skills/dispatch-propagate/scripts/ (run-unit-tests.sh:88). The
// actual CI vector is the hook-tests job in .github/workflows/unit-tests.yml,
// which runs test-review-fix-skeptic-batch.sh (this probe's driver)
// unconditionally on every PR. Keep that step wired — deleting it removes
// all coverage here.
//
// review-fix.js is a Workflow-tool script (top-level await + injected
// globals), so it CANNOT be imported/executed by node. Instead this probe
// SLICES the pure "skeptic batching" region out from between sentinel
// comments and evals it, then runs the exported functions on a fixture set
// and prints the results.
//
// Unit 1 (this unit) introduces filePath (hoisted to module scope, unchanged
// behavior) and skepticBatchJobs (new pure grouping function) as shared
// primitives for batching the adversarial skeptic gate per (run, file)
// instead of per finding. No call site is rewired yet — Units 2 and 3 do
// that later.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// Resolve review-fix.js relative to this helper's own location. This helper
// sits at .claude/skills/dispatch-propagate/scripts/, so review-fix.js is
// three dirs up at .claude/workflows/review-fix.js.
const reviewFixPath = fileURLToPath(
  new URL('../../../workflows/review-fix.js', import.meta.url)
);

const source = readFileSync(reviewFixPath, 'utf8');

// FAIL LOUDLY: each sentinel must appear exactly once.
function countOccurrences(haystack, needle) {
  let count = 0;
  let idx = haystack.indexOf(needle);
  while (idx !== -1) {
    count += 1;
    idx = haystack.indexOf(needle, idx + needle.length);
  }
  return count;
}

// Slice the text strictly between a START/END sentinel pair, failing loudly
// if either sentinel is missing or duplicated, or the resulting slice is
// empty. Returns the trimmed slice text.
function sliceBetween(src, START, END) {
  const startCount = countOccurrences(src, START);
  const endCount = countOccurrences(src, END);
  if (startCount !== 1) {
    process.stderr.write(
      `review-fix-skeptic-batch-probe: START sentinel not found exactly once (count=${startCount}) for "${START}" in ${reviewFixPath}\n`
    );
    process.exit(1);
  }
  if (endCount !== 1) {
    process.stderr.write(
      `review-fix-skeptic-batch-probe: END sentinel not found exactly once (count=${endCount}) for "${END}" in ${reviewFixPath}\n`
    );
    process.exit(1);
  }
  const startIdx = src.indexOf(START) + START.length;
  const endIdx = src.indexOf(END);
  const slice = src.slice(startIdx, endIdx).trim();
  if (!slice) {
    process.stderr.write(
      `review-fix-skeptic-batch-probe: empty slice between "${START}" and "${END}"\n`
    );
    process.exit(1);
  }
  return slice;
}

const START =
  "// >>> skeptic batching: sliced + eval'd by review-fix-skeptic-batch-probe.mjs >>>";
const END = '// <<< skeptic batching <<<';

const slice = sliceBetween(source, START, END);

// The slice holds two top-level function declarations, not a single
// expression, so it cannot be wrapped as `new Function('return ' + src)()`
// the way a single function expression can. Instead it is eval'd directly
// (in an IIFE, to avoid leaking into this module's top level) and the IIFE
// returns the two names under test.
const { filePath, skepticBatchJobs } = (function () {
  // eslint-disable-next-line no-eval -- see comment above // type-safety-ok: eval is required (not new Function) because the slice has several top-level statements, not a single expression
  return eval(`(function () { ${slice}\nreturn { filePath, skepticBatchJobs }; })()`);
})();

const results = {};

// --- filePath cases ----------------------------------------------------------

results.filePathCases = {
  with_line: filePath('a/b.ts:12'),
  no_line: filePath('a/b.ts'),
  empty: filePath(''),
  undefined_loc: filePath(undefined),
  two_colons: filePath('a:b.ts:12'),
};

// --- skepticBatchJobs cases --------------------------------------------------

// item shape: { id, file, brief, replicas }
function fixtureKeyOf(item) {
  return `${item.brief}::${item.file}`;
}
function fixtureFileOf(item) {
  return item.file;
}
function fixtureReplicasOf(item) {
  return item.replicas;
}
function jobShape(job) {
  return {
    key: job.key,
    file: job.file,
    replica: job.replica,
    ids: job.items.map((it) => it.id),
  };
}
function run(items) {
  return skepticBatchJobs(items, {
    keyOf: fixtureKeyOf,
    fileOf: fixtureFileOf,
    replicasOf: fixtureReplicasOf,
  }).map(jobShape);
}

results.groupingCases = {};

// Empty input.
results.groupingCases.empty = run([]);

// One medium item.
results.groupingCases.one_medium = run([{ id: 'f1', file: 'a.ts', brief: 'x', replicas: 1 }]);

// Two files: 3 items in file A + 1 item in file B, all medium.
results.groupingCases.two_files = run([
  { id: 'a1', file: 'A.ts', brief: 'x', replicas: 1 },
  { id: 'a2', file: 'A.ts', brief: 'x', replicas: 1 },
  { id: 'a3', file: 'A.ts', brief: 'x', replicas: 1 },
  { id: 'b1', file: 'B.ts', brief: 'x', replicas: 1 },
]);

// One file, 1 high (replicas=2) + 3 medium (replicas=1).
results.groupingCases.one_high_three_medium = run([
  { id: 'h1', file: 'A.ts', brief: 'x', replicas: 2 },
  { id: 'm1', file: 'A.ts', brief: 'x', replicas: 1 },
  { id: 'm2', file: 'A.ts', brief: 'x', replicas: 1 },
  { id: 'm3', file: 'A.ts', brief: 'x', replicas: 1 },
]);

// One file, 2 high (replicas=2) + 1 medium (replicas=1).
results.groupingCases.two_high_one_medium = run([
  { id: 'h1', file: 'A.ts', brief: 'x', replicas: 2 },
  { id: 'h2', file: 'A.ts', brief: 'x', replicas: 2 },
  { id: 'm1', file: 'A.ts', brief: 'x', replicas: 1 },
]);

// Same file, different keyOf (simulated brief prefix) -> separate groups.
results.groupingCases.same_file_different_brief = run([
  { id: 'e1', file: 'A.ts', brief: 'erosion', replicas: 1 },
  { id: 's1', file: 'A.ts', brief: 'security', replicas: 1 },
]);

// Mixed fixture for the vote-parity / reduction invariants: multiple files,
// mixed replicasOf.
const mixedItems = [
  { id: 'a1', file: 'A.ts', brief: 'x', replicas: 2 },
  { id: 'a2', file: 'A.ts', brief: 'x', replicas: 1 },
  { id: 'a3', file: 'A.ts', brief: 'x', replicas: 1 },
  { id: 'b1', file: 'B.ts', brief: 'x', replicas: 1 },
  { id: 'c1', file: 'C.ts', brief: 'x', replicas: 2 },
  { id: 'c2', file: 'C.ts', brief: 'x', replicas: 2 },
];
const mixedJobs = skepticBatchJobs(mixedItems, {
  keyOf: fixtureKeyOf,
  fileOf: fixtureFileOf,
  replicasOf: fixtureReplicasOf,
});
results.groupingCases.mixed = mixedJobs.map(jobShape);
// Per-item appearance counts across the whole mixed output, keyed by id.
const appearanceCounts = {};
for (const item of mixedItems) appearanceCounts[item.id] = 0;
for (const job of mixedJobs) {
  for (const item of job.items) appearanceCounts[item.id] += 1;
}
results.mixedAppearanceCounts = appearanceCounts;
results.mixedExpectedReplicas = Object.fromEntries(
  mixedItems.map((it) => [it.id, it.replicas])
);
results.mixedJobCount = mixedJobs.length;
results.mixedReplicaSum = mixedItems.reduce((sum, it) => sum + it.replicas, 0);
// Whether any group in the mixed fixture holds more than one item (true here:
// A.ts has 3 items, C.ts has 2).
results.mixedHasMultiItemGroup = true;

process.stdout.write(JSON.stringify(results) + '\n');
