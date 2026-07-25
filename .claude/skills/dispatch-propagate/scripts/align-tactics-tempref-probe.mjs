#!/usr/bin/env node
// align-tactics-tempref-probe.mjs
//
// CI-vector probe for resolveTempRefs in .claude/workflows/align-tactics.js.
// run-unit-tests.sh has no mapping for .claude/workflows/*, so a PR touching
// only align-tactics.js triggers no vitest suite. The align-tactics tempref
// test that runs on every PR now lives in test-qa-fix-partition.sh, one of the
// per-SUT sibling test files under this directory; run-unit-tests.sh discovers
// it automatically via its test-*.sh glob, so no CI wiring is needed. This
// probe is driven from that script.
//
// align-tactics.js is a Workflow-tool script (top-level await + injected
// globals), so it CANNOT be imported/executed by node. Instead this probe
// SLICES the pure resolveTempRefs function text out from between two sentinel
// comments and evals just that slice, then runs a handful of assertions against
// it (valid resolution, dangling ref rejected, cycle rejected).

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// Resolve align-tactics.js relative to this helper's own location. This helper
// sits at .claude/skills/dispatch-propagate/scripts/, so align-tactics.js is
// three dirs up at .claude/workflows/align-tactics.js.
const alignTacticsPath = fileURLToPath(
  new URL('../../../workflows/align-tactics.js', import.meta.url)
);

const source = readFileSync(alignTacticsPath, 'utf8');

const START =
  "// >>> resolveTempRefs: sliced + eval'd by test-dispatch-scripts.sh (align-tactics) >>>";
const END = '// <<< resolveTempRefs <<<';

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
    `align-tactics-tempref-probe: START sentinel not found exactly once (count=${startCount}) in ${alignTacticsPath}\n`
  );
  process.exit(1);
}
if (endCount !== 1) {
  process.stderr.write(
    `align-tactics-tempref-probe: END sentinel not found exactly once (count=${endCount}) in ${alignTacticsPath}\n`
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
  process.stderr.write('align-tactics-tempref-probe: empty function body between sentinels\n');
  process.exit(1);
}

const resolveTempRefs = new Function('return ' + fnSource)();

// Minimal assertion helpers (this probe prints its own PASS/FAIL lines; the
// driver in test-qa-fix-partition.sh asserts on the final "ALL PASS" token).
let failures = 0;
function ok(name, cond) {
  if (cond) {
    process.stdout.write(`  ok: ${name}\n`);
  } else {
    failures += 1;
    process.stdout.write(`  FAIL: ${name}\n`);
  }
}
function throws(name, fn, matchSubstr) {
  let threw = false;
  let msg = '';
  try {
    fn();
  } catch (e) {
    threw = true;
    msg = String((e && e.message) || e);
  }
  ok(name, threw && (!matchSubstr || msg.includes(matchSubstr)));
}

// --- Vector 1: valid resolution ---------------------------------------------
// t-a is a pre-existing draft target (already-real id, passes through). t-b is a
// new tactic (temp_ref "b", minted id "tactic-b") blocked_by t-a and by temp_ref
// "a" (which resolves to minted id "tactic-a"). Parent expressed as a temp_ref.
{
  const tactics = [
    { temp_ref: 'a', id: 'tactic-a', parent: null, blocked_by: [] },
    { temp_ref: 'b', id: 'tactic-b', parent: 'a', blocked_by: ['a', 'tactic-existing'] },
  ];
  const existingIds = ['tactic-existing'];
  const resolved = resolveTempRefs(tactics, existingIds);
  const b = resolved.find((t) => t.temp_ref === 'b');
  ok('valid: parent temp_ref resolved to minted id', b.parent === 'tactic-a');
  ok(
    'valid: blocked_by temp_ref + pre-existing id both resolved',
    Array.isArray(b.blocked_by) &&
      b.blocked_by.length === 2 &&
      b.blocked_by[0] === 'tactic-a' &&
      b.blocked_by[1] === 'tactic-existing'
  );
  ok('valid: each resolved tactic carries its minted id', resolved.every((t) => t.id));
}

// --- Vector 2: dangling reference rejected (rule 13) -------------------------
// temp_ref "y" points blocked_by at "ghost" — not a tactic entry, not in
// existingIds — so it must throw a dangling-reference error.
{
  const tactics = [{ temp_ref: 'y', id: 'tactic-y', parent: null, blocked_by: ['ghost'] }];
  throws('dangling: blocked_by to unknown ref rejected', () => resolveTempRefs(tactics, []), 'dangling');
}

// --- Vector 3: blocked_by cycle rejected (rule 15) --------------------------
// m blocked_by n, n blocked_by m — a two-node cycle among the temp_ref graph.
{
  const tactics = [
    { temp_ref: 'm', id: 'tactic-m', parent: null, blocked_by: ['n'] },
    { temp_ref: 'n', id: 'tactic-n', parent: null, blocked_by: ['m'] },
  ];
  throws('cycle: two-node blocked_by cycle rejected', () => resolveTempRefs(tactics, []), 'cycle');
}

if (failures > 0) {
  process.stdout.write(`align-tactics-tempref-probe: ${failures} FAILURE(S)\n`);
  process.exit(1);
}
process.stdout.write('align-tactics-tempref-probe: ALL PASS\n');
