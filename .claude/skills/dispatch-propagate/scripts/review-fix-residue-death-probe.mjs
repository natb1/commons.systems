#!/usr/bin/env node
// review-fix-residue-death-probe.mjs (tactic-review-fix-residue-death-coverage)
//
// CI-vector probe for undispositionedResidueRecords in
// .claude/workflows/review-fix.js. run-unit-tests.sh has no mapping for
// .claude/workflows/*, so a PR touching only review-fix.js triggers no vitest
// suite. Its test-*.sh glob over this directory is NOT a fallback either: that
// glob only runs when RUN_PR_SCRIPTS is set, which auto-detect sets solely for
// changed paths under .claude/skills/dispatch-propagate/scripts/
// (run-unit-tests.sh:88). The actual CI vector is the hook-tests job in
// .github/workflows/unit-tests.yml, which runs test-review-fix-residue-death.sh
// (this probe's driver) unconditionally on every PR. Keep that step wired —
// deleting it removes all coverage here.
//
// review-fix.js is a Workflow-tool script (top-level await + injected globals),
// so it CANNOT be imported/executed by node. Instead this probe SLICES the pure
// residueTruncate + undispositionedResidueRecords text out from between two
// sentinel comments and evals just that slice, then runs it on a fixture set
// and prints the results.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// Resolve review-fix.js relative to this helper's own location. This helper
// sits at .claude/skills/dispatch-propagate/scripts/, so review-fix.js is
// three dirs up at .claude/workflows/review-fix.js.
const reviewFixPath = fileURLToPath(
  new URL('../../../workflows/review-fix.js', import.meta.url)
);

const source = readFileSync(reviewFixPath, 'utf8');

const START =
  "// >>> residue death coverage: sliced + eval'd by review-fix-residue-death-probe.mjs >>>";
const END = '// <<< residue death coverage <<<';

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

const startCount = countOccurrences(source, START);
const endCount = countOccurrences(source, END);
if (startCount !== 1) {
  process.stderr.write(
    `review-fix-residue-death-probe: START sentinel not found exactly once (count=${startCount}) in ${reviewFixPath}\n`
  );
  process.exit(1);
}
if (endCount !== 1) {
  process.stderr.write(
    `review-fix-residue-death-probe: END sentinel not found exactly once (count=${endCount}) in ${reviewFixPath}\n`
  );
  process.exit(1);
}

// The sliced text is strictly between the end of the START sentinel line and
// the start of the END sentinel line.
const startIdx = source.indexOf(START) + START.length;
const endIdx = source.indexOf(END);
// .trim() is load-bearing for the same ASI reason the qa-fix-partition-probe
// documents — but the shape here differs: the slice contains TWO top-level
// statements (`const residueTruncate = ...` then `function
// undispositionedResidueRecords...`), not a single expression, so it cannot be
// wrapped as `new Function('return ' + fnSource)()` the way a single function
// expression can. Instead the slice is eval'd directly (in an IIFE, to avoid
// leaking into this module's top level) and the IIFE returns
// undispositionedResidueRecords, closing over residueTruncate.
const sliceSource = source.slice(startIdx, endIdx).trim();

if (!sliceSource) {
  process.stderr.write('review-fix-residue-death-probe: empty slice between sentinels\n');
  process.exit(1);
}

const undispositionedResidueRecords = (function () {
  // eslint-disable-next-line no-eval -- see comment above // type-safety-ok: eval is required (not new Function) because the sliced source has two top-level statements, not a single expression
  return eval(`(function () { ${sliceSource}\nreturn undispositionedResidueRecords; })()`);
})();

// Fixture table (Unit 2 of tactic-review-fix-residue-death-coverage).

function item(overrides) {
  return {
    description: 'a residue finding',
    location: 'foo.js:1',
    recommended_fix: 'do the thing',
    source: 'code-review',
    severity: 'medium',
    ...overrides,
  };
}

const results = {};

// all-triaged: both indices present in dispositionedIdx (values irrelevant —
// only .has() is consulted) → nothing undispositioned.
results['all-triaged'] = undispositionedResidueRecords(
  [item({ description: 'first' }), item({ description: 'second' })],
  new Map([
    [0, true],
    [1, false],
  ]),
  {}
);

// total-death: no index triaged → every item surfaces.
results['total-death'] = undispositionedResidueRecords(
  [item({ description: 'first' }), item({ description: 'second' })],
  new Map(),
  {}
);

// partial-drop: index 1 triaged, 0 and 2 are not.
results['partial-drop'] = undispositionedResidueRecords(
  [
    item({ description: 'first' }),
    item({ description: 'second' }),
    item({ description: 'third' }),
  ],
  new Map([[1, true]]),
  {}
);

// empty-residue: no items at all.
results['empty-residue'] = undispositionedResidueRecords([], new Map(), {});

// fields: a single item whose description is well over 200 non-whitespace
// characters (so the 140-char truncation is real, not a no-op), plus explicit
// source/recommended_fix/opts to pin the body/short_desc/title/backlink shape.
const LONG_DESCRIPTION = 'x'.repeat(250);
results['fields'] = undispositionedResidueRecords(
  [
    item({
      description: LONG_DESCRIPTION,
      source: 'security-review',
      recommended_fix: 'RFX',
    }),
  ],
  new Map(),
  { pr_num: 4242, blocker_issue_nums: [7, 9] }
);

// independent-blockers: blocker_issue_nums passed through verbatim when it is
// the sentinel string 'independent' (mirrors the Lane-B blockerNums shape).
results['independent-blockers'] = undispositionedResidueRecords(
  [item({ description: 'lone item' })],
  new Map(),
  { pr_num: 1, blocker_issue_nums: 'independent' }
);

process.stdout.write(JSON.stringify(results) + '\n');
