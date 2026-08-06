#!/usr/bin/env node
// align-tactics-gates-probe.mjs
//
// CI-vector probe for computePhaseGates in .claude/workflows/align-tactics.js.
// run-unit-tests.sh has no mapping for .claude/workflows/*, so a PR touching
// only align-tactics.js triggers no vitest suite. The only test that runs on
// every PR is the hook-tests job, which invokes test-dispatch-scripts.sh
// directly. So this probe is driven from that script.
//
// align-tactics.js is a Workflow-tool script (top-level await + injected
// globals), so it CANNOT be imported/executed by node. Instead this probe
// SLICES the pure computePhaseGates function text out from between two
// sentinel comments and evals just that slice, then runs a handful of
// assertions against it (tactic-mode drift gate, strategy-mode round
// eligibility gate, defensive fallbacks).

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
  "// >>> computePhaseGates: sliced + eval'd by test-dispatch-scripts.sh (align-tactics) >>>";
const END = '// <<< computePhaseGates <<<';

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
    `align-tactics-gates-probe: START sentinel not found exactly once (count=${startCount}) in ${alignTacticsPath}\n`
  );
  process.exit(1);
}
if (endCount !== 1) {
  process.stderr.write(
    `align-tactics-gates-probe: END sentinel not found exactly once (count=${endCount}) in ${alignTacticsPath}\n`
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
  process.stderr.write('align-tactics-gates-probe: empty function body between sentinels\n');
  process.exit(1);
}

const computePhaseGates = new Function('return ' + fnSource)();

// Minimal assertion helper (this probe prints its own PASS/FAIL lines; the
// driver in test-dispatch-scripts.sh asserts on the final "ALL PASS" token).
let failures = 0;
function ok(name, cond) {
  if (cond) {
    process.stdout.write(`  ok: ${name}\n`);
  } else {
    failures += 1;
    process.stdout.write(`  FAIL: ${name}\n`);
  }
}

// --- Vector 1: the reported bug ---------------------------------------------
// Tactic mode ignores round decomposability: proceed=true with a
// non-decomposable round must still allow planning.
{
  const g = computePhaseGates('tactic', {
    proceed: true,
    eligibility: { decomposable: false },
  });
  ok('bug: tactic mode planProceed true despite non-decomposable round', g.planProceed === true);
  ok('bug: tactic mode decomposeProceed false (tactic mode never decomposes)', g.decomposeProceed === false);
}

// --- Vector 2: fails closed on a genuine per-node blocker -------------------
// Tactic mode with proceed=false must block planning regardless of round
// decomposability.
{
  const g = computePhaseGates('tactic', {
    proceed: false,
    eligibility: { decomposable: true },
  });
  ok('blocker: tactic mode planProceed false on drift blocker', g.planProceed === false);
  ok('blocker: tactic mode decomposeProceed false on drift blocker', g.decomposeProceed === false);
}

// --- Vector 3: strategy mode, clear round -----------------------------------
// proceed=true and decomposable=true must allow both gates.
{
  const g = computePhaseGates('strategy', {
    proceed: true,
    eligibility: { decomposable: true },
  });
  ok('strategy clear: decomposeProceed true', g.decomposeProceed === true);
  ok('strategy clear: planProceed true', g.planProceed === true);
}

// --- Vector 4: strategy mode, ineligible round ------------------------------
// Round eligibility still gates strategy mode (the Unit-1 tightening): a
// non-decomposable round blocks both gates even though proceed=true.
{
  const g = computePhaseGates('strategy', {
    proceed: true,
    eligibility: { decomposable: false },
  });
  ok('strategy ineligible: decomposeProceed false', g.decomposeProceed === false);
  ok('strategy ineligible: planProceed false', g.planProceed === false);
}

// --- Vector 5: strategy mode, drift blocker ---------------------------------
// proceed=false blocks both gates even with a decomposable round.
{
  const g = computePhaseGates('strategy', {
    proceed: false,
    eligibility: { decomposable: true },
  });
  ok('strategy blocker: decomposeProceed false', g.decomposeProceed === false);
  ok('strategy blocker: planProceed false', g.planProceed === false);
}

// --- Vector 6: defensive fallbacks ------------------------------------------
// Missing/empty drift objects must fail closed on both gates, for both modes.
{
  const gTactic = computePhaseGates('tactic', null);
  ok('defensive: tactic mode + null drift, decomposeProceed false', gTactic.decomposeProceed === false);
  ok('defensive: tactic mode + null drift, planProceed false', gTactic.planProceed === false);

  const gStrategy = computePhaseGates('strategy', {});
  ok('defensive: strategy mode + empty drift, decomposeProceed false', gStrategy.decomposeProceed === false);
  ok('defensive: strategy mode + empty drift, planProceed false', gStrategy.planProceed === false);
}

if (failures > 0) {
  process.stdout.write(`align-tactics-gates-probe: ${failures} FAILURE(S)\n`);
  process.exit(1);
}
process.stdout.write('align-tactics-gates-probe: ALL PASS\n');
