#!/usr/bin/env node
// qa-fix-partition-probe.mjs (#1844)
//
// CI-vector probe for partitionDispositions in .claude/workflows/qa-fix.js.
// run-unit-tests.sh has no mapping for .claude/workflows/*, so a PR touching
// only qa-fix.js triggers no vitest suite. Its test-*.sh glob over this
// directory is NOT a fallback either: that glob only runs when RUN_PR_SCRIPTS
// is set, which auto-detect sets solely for changed paths under
// .claude/skills/dispatch-propagate/scripts/ (run-unit-tests.sh:88). The actual
// CI vector is the hook-tests job in .github/workflows/unit-tests.yml, which
// runs test-qa-fix-partition.sh (this probe's driver) unconditionally on every
// PR. Keep that step wired — deleting it removes all coverage here.
//
// qa-fix.js is a Workflow-tool script (top-level await + injected globals), so
// it CANNOT be imported/executed by node. Instead this probe SLICES the pure
// partitionDispositions function text out from between two sentinel comments and
// evals just that slice, then runs it on a fixture and prints the partition.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// Resolve qa-fix.js relative to this helper's own location. This helper sits at
// .claude/skills/dispatch-propagate/scripts/, so qa-fix.js is three dirs up at
// .claude/workflows/qa-fix.js.
const qaFixPath = fileURLToPath(
  new URL('../../../workflows/qa-fix.js', import.meta.url)
);

const source = readFileSync(qaFixPath, 'utf8');

const START =
  "// >>> partitionDispositions: sliced + eval'd by test-dispatch-scripts.sh (#1844) >>>";
const END = '// <<< partitionDispositions <<<';

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
    `qa-fix-partition-probe: START sentinel not found exactly once (count=${startCount}) in ${qaFixPath}\n`
  );
  process.exit(1);
}
if (endCount !== 1) {
  process.stderr.write(
    `qa-fix-partition-probe: END sentinel not found exactly once (count=${endCount}) in ${qaFixPath}\n`
  );
  process.exit(1);
}

// The sliced function source is the text strictly between the end of the START
// sentinel line and the start of the END sentinel line.
const startIdx = source.indexOf(START) + START.length;
const endIdx = source.indexOf(END);
// .trim() is load-bearing: a raw slice begins with a newline, and
// `'return ' + '\nfunction...'` triggers automatic semicolon insertion after
// `return`, so the constructed function would return undefined. Trimming makes
// the slice start with `function`, yielding a same-line function expression.
const fnSource = source.slice(startIdx, endIdx).trim();

if (!fnSource) {
  process.stderr.write('qa-fix-partition-probe: empty function body between sentinels\n');
  process.exit(1);
}

const partitionDispositions = new Function('return ' + fnSource)();

// Fixture mirroring the f7-fixture class vocabulary, with the real disposition
// shape { id, title, kind, class, aesthetic, verify, rationale }.
const allDispositions = [
  {
    id: 'p1',
    title: 'Submit button misaligned on the settings form',
    kind: 'fail',
    class: 'opus-fixable',
    aesthetic: false,
    verify: 'n/a',
    rationale: 'CSS flex gap regression visible in the DOM; fixable in code.',
  },
  {
    id: 'p2',
    title: 'Member list query denied for non-author email',
    kind: 'main-gated-fail',
    class: 'needs-main',
    aesthetic: false,
    verify: 'n/a',
    rationale: 'Only verifiable against deployed main/prod Firestore rules.',
  },
  {
    id: 'p3',
    title: 'Does the new hero illustration match the brand tone?',
    kind: 'needs-human-judgment',
    class: 'needs-human',
    aesthetic: true,
    verify: 'n/a',
    rationale: 'Pure pixel-level aesthetic judgment requiring a human eye.',
  },
  {
    id: 'p4',
    title: 'Pagination control already present on the table',
    kind: 'fail',
    class: 'already-satisfied',
    aesthetic: false,
    verify: 'n/a',
    rationale: 'Page text shows the pagination control already rendered; no fix needed.',
  },
];

const { dispositions, already_satisfied } = partitionDispositions(allDispositions);

process.stdout.write(
  JSON.stringify({
    dispositions: dispositions.map((d) => d.id),
    already_satisfied: already_satisfied.map((d) => d.id),
    // Shape probe: the keys of an already_satisfied element, sorted. The
    // projection in partitionDispositions strips class/aesthetic/verify and
    // must keep exactly {id, title, kind, rationale}; a regression that omits
    // a key or leaks a stripped one changes this set.
    already_satisfied_keys: Object.keys(already_satisfied[0]).sort(),
  }) + '\n'
);
