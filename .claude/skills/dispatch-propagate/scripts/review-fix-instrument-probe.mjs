#!/usr/bin/env node
// review-fix-instrument-probe.mjs (tactic-lane-instrument-substitution-guard)
//
// CI-vector probe for instrumentVerdict (and its INSTRUMENTS registry) in
// .claude/workflows/review-fix.js. run-unit-tests.sh has no mapping for
// .claude/workflows/*, so a PR touching only review-fix.js triggers no vitest
// suite. Its test-*.sh glob over this directory is NOT a fallback either: that
// glob only runs when RUN_PR_SCRIPTS is set, which auto-detect sets solely for
// changed paths under .claude/skills/dispatch-propagate/scripts/
// (run-unit-tests.sh:88). The actual CI vector is the hook-tests job in
// .github/workflows/unit-tests.yml, which runs test-review-fix-instrument.sh
// (this probe's driver) unconditionally on every PR. Keep that step wired —
// deleting it removes all coverage here.
//
// review-fix.js is a Workflow-tool script (top-level await + injected globals),
// so it CANNOT be imported/executed by node. Instead this probe SLICES the pure
// INSTRUMENTS + instrumentVerdict text out from between two sentinel comments
// and evals just that slice, then runs it on a fixture set and prints the
// verdicts.

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
  "// >>> instrument gate: sliced + eval'd by review-fix-instrument-probe.mjs >>>";
const END = '// <<< instrument gate <<<';

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
    `review-fix-instrument-probe: START sentinel not found exactly once (count=${startCount}) in ${reviewFixPath}\n`
  );
  process.exit(1);
}
if (endCount !== 1) {
  process.stderr.write(
    `review-fix-instrument-probe: END sentinel not found exactly once (count=${endCount}) in ${reviewFixPath}\n`
  );
  process.exit(1);
}

// The sliced text is strictly between the end of the START sentinel line and
// the start of the END sentinel line.
const startIdx = source.indexOf(START) + START.length;
const endIdx = source.indexOf(END);
// .trim() is load-bearing for the same ASI reason the qa-fix-partition-probe
// documents — but the shape here differs: the slice contains TWO top-level
// statements (`const INSTRUMENTS = {...}` then `function instrumentVerdict...`),
// not a single expression, so it cannot be wrapped as `new Function('return ' +
// fnSource)()` the way a single function expression can. Instead the slice is
// eval'd directly (in an IIFE, to avoid leaking into this module's top level)
// and the IIFE returns instrumentVerdict, closing over INSTRUMENTS.
const sliceSource = source.slice(startIdx, endIdx).trim();

if (!sliceSource) {
  process.stderr.write('review-fix-instrument-probe: empty slice between sentinels\n');
  process.exit(1);
}

const instrumentVerdict = (function () {
  // eslint-disable-next-line no-eval -- see comment above // type-safety-ok: eval is required (not new Function) because the sliced source has two top-level statements, not a single expression
  return eval(`(function () { ${sliceSource}\nreturn instrumentVerdict; })()`);
})();

// Fixture table (Unit 3 of tactic-lane-instrument-substitution-guard).
const NOT_INVOKED_FAILURE_TEXT =
  'Skill code-review cannot be used with Skill tool due to disable-model-invocation';

const cases = [
  { id: 'lane-b', name: 'cost', res: {} },
  { id: 'null-res', name: 'code-review', res: null },
  {
    id: 'no-receipt',
    name: 'code-review',
    res: { fixed: [], residue: [] },
  },
  {
    id: 'wrong-name',
    name: 'code-review',
    res: {
      instrument: { name: 'security-review', invoked: true, failure_text: '' },
      fixed: [],
      residue: [],
    },
  },
  {
    id: 'not-invoked',
    name: 'code-review',
    res: {
      instrument: {
        name: 'code-review',
        invoked: false,
        failure_text: NOT_INVOKED_FAILURE_TEXT,
      },
      fixed: [],
      residue: [],
    },
  },
  {
    id: 'sig-no-touched-files',
    name: 'code-review',
    res: {
      instrument: { name: 'code-review', invoked: true, failure_text: '' },
      fixed: [{ title: 'x', touched_files: [] }],
      residue: [],
    },
  },
  {
    id: 'sig-security-edited',
    name: 'security-review',
    res: {
      instrument: { name: 'security-review', invoked: true, failure_text: '' },
      fixed: [{ title: 'x', touched_files: ['a.js'] }],
      residue: [],
    },
  },
  {
    id: 'clean-code-review',
    name: 'code-review',
    res: {
      instrument: { name: 'code-review', invoked: true, failure_text: '' },
      fixed: [{ title: 'x', touched_files: ['a.js'] }],
      residue: [],
    },
  },
  {
    id: 'clean-security-review',
    name: 'security-review',
    res: {
      instrument: { name: 'security-review', invoked: true, failure_text: '' },
      fixed: [],
      residue: [{ title: 'y' }],
    },
  },
];

const results = {};
for (const c of cases) {
  results[c.id] = instrumentVerdict(c.name, c.res);
}

process.stdout.write(JSON.stringify(results) + '\n');
