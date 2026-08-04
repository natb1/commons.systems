#!/usr/bin/env node
// align-tactics-target-context-probe.mjs
//
// CI-vector probe for synthesizeTargetPlanTactic and tacticModeFraming in
// .claude/workflows/align-tactics.js. run-unit-tests.sh has no mapping for
// .claude/workflows/*, so a PR touching only align-tactics.js triggers no
// vitest suite. Its test-*.sh glob over this directory is NOT a fallback
// either: that glob only runs when RUN_PR_SCRIPTS is set, which auto-detect
// sets solely for changed paths under
// .claude/skills/dispatch-propagate/scripts/ (run-unit-tests.sh:88). The
// actual CI vector is the hook-tests job in .github/workflows/unit-tests.yml,
// which runs test-align-tactics-target-context.sh (this probe's driver)
// unconditionally on every PR. Keep that step wired — deleting it removes all
// coverage here.
//
// align-tactics.js is a Workflow-tool script (top-level await + injected
// globals), so it CANNOT be imported/executed by node. Instead this probe
// SLICES the pure functions' text out from between sentinel comments and
// evals just those slices, then runs a handful of assertions against them —
// mirroring align-tactics-tempref-probe.mjs's scaffold.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// Resolve align-tactics.js relative to this helper's own location. This helper
// sits at .claude/skills/dispatch-propagate/scripts/, so align-tactics.js is
// three dirs up at .claude/workflows/align-tactics.js.
const alignTacticsPath = fileURLToPath(
  new URL('../../../workflows/align-tactics.js', import.meta.url)
);

const source = readFileSync(alignTacticsPath, 'utf8');

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

// sliceFn — locate a START/END sentinel pair exactly once each, slice the text
// strictly between them, trim it, and eval it into a standalone function via
// `new Function('return ' + slice)()`.
//
// .trim() is load-bearing: a raw slice begins with a newline, and
// `'return ' + '\nfunction...'` triggers automatic semicolon insertion after
// `return`, so the constructed function would return undefined. Trimming makes
// the slice start with `function`, yielding a same-line function expression.
function sliceFn(src, start, end, label) {
  const startCount = countOccurrences(src, start);
  const endCount = countOccurrences(src, end);
  if (startCount !== 1) {
    process.stderr.write(
      `align-tactics-target-context-probe: START sentinel for ${label} not found exactly once (count=${startCount}) in ${alignTacticsPath}\n`
    );
    process.exit(1);
  }
  if (endCount !== 1) {
    process.stderr.write(
      `align-tactics-target-context-probe: END sentinel for ${label} not found exactly once (count=${endCount}) in ${alignTacticsPath}\n`
    );
    process.exit(1);
  }
  const startIdx = src.indexOf(start) + start.length;
  const endIdx = src.indexOf(end);
  const fnSource = src.slice(startIdx, endIdx).trim();
  if (!fnSource) {
    process.stderr.write(
      `align-tactics-target-context-probe: empty function body between sentinels for ${label}\n`
    );
    process.exit(1);
  }
  return new Function('return ' + fnSource)();
}

const SPECS = {
  synthesizeTargetPlanTactic: {
    start: "// >>> synthesizeTargetPlanTactic: sliced + eval'd by test-align-tactics-target-context.sh >>>",
    end: '// <<< synthesizeTargetPlanTactic <<<',
  },
  tacticModeFraming: {
    start: "// >>> tacticModeFraming: sliced + eval'd by test-align-tactics-target-context.sh >>>",
    end: '// <<< tacticModeFraming <<<',
  },
};

const synthesizeTargetPlanTactic = sliceFn(
  source,
  SPECS.synthesizeTargetPlanTactic.start,
  SPECS.synthesizeTargetPlanTactic.end,
  'synthesizeTargetPlanTactic'
);
const tacticModeFraming = sliceFn(
  source,
  SPECS.tacticModeFraming.start,
  SPECS.tacticModeFraming.end,
  'tacticModeFraming'
);

// Minimal assertion helpers (this probe prints its own PASS/FAIL lines; the
// driver in test-align-tactics-target-context.sh asserts on the final "ALL
// PASS" token).
let failures = 0;
function ok(name, cond) {
  if (cond) {
    process.stdout.write(`  ok: ${name}\n`);
  } else {
    failures += 1;
    process.stdout.write(`  FAIL: ${name}\n`);
  }
}
function doesNotThrow(name, fn) {
  try {
    const result = fn();
    ok(name, true);
    return result;
  } catch (e) {
    ok(name, false);
    process.stderr.write(`  ${name}: unexpected throw: ${String((e && e.message) || e)}\n`);
    return undefined;
  }
}

// --- synthesizeTargetPlanTactic ---------------------------------------------

// Vector 1: full node — rationale/body/phase must all ride through unchanged.
// This is the exact regression the tactic exists to prevent.
{
  const targetNode = {
    id: 'tactic-x',
    statement: 's',
    rationale: 'r',
    body: 'B',
    phase: 'qa',
  };
  const out = synthesizeTargetPlanTactic(targetNode);
  ok('vector1: rationale rides through', out.rationale === 'r');
  ok('vector1: body rides through', out.body === 'B');
  ok('vector1: phase rides through', out.phase === 'qa');
  ok('vector1: temp_ref === id', out.temp_ref === 'tactic-x');
  ok('vector1: existing_id === id', out.existing_id === 'tactic-x');
  ok('vector1: draft_source_id === id', out.draft_source_id === 'tactic-x');
  ok('vector1: claude_eligible === true', out.claude_eligible === true);

  // Vector 4: serialization guard — an undefined field silently vanishes from
  // JSON.stringify, so assert these three fields actually survive it (this is
  // exactly what buildPlanPrompt embeds via asJson).
  const serialized = JSON.stringify(out);
  ok('vector4: serialized JSON contains "rationale"', serialized.includes('"rationale"'));
  ok('vector4: serialized JSON contains "body"', serialized.includes('"body"'));
  ok('vector4: serialized JSON contains "phase"', serialized.includes('"phase"'));
}

// Vector 2: draft node — no rationale/body/phase supplied. rationale/body
// default to '', phase must be explicitly null (not undefined).
{
  const targetNode = { id: 'tactic-y', statement: 's' };
  const out = synthesizeTargetPlanTactic(targetNode);
  ok('vector2: rationale defaults to empty string', out.rationale === '');
  ok('vector2: body defaults to empty string', out.body === '');
  ok('vector2: phase is explicitly null', Object.is(out.phase, null));
}

// Vector 3: undefined targetNode does not throw and yields safe defaults.
{
  const out = doesNotThrow('vector3: synthesizeTargetPlanTactic(undefined) does not throw', () =>
    synthesizeTargetPlanTactic(undefined)
  );
  if (out) {
    ok('vector3: temp_ref defaults to "target"', out.temp_ref === 'target');
    ok('vector3: phase is explicitly null', Object.is(out.phase, null));
  } else {
    ok('vector3: temp_ref defaults to "target"', false);
    ok('vector3: phase is explicitly null', false);
  }
}

// --- tacticModeFraming -------------------------------------------------------

// Vector 5: strategy mode returns [] — a decomposed tactic is new work with no
// prior body to reconcile.
{
  const out = tacticModeFraming('strategy', { phase: 'qa' });
  ok('vector5: strategy mode returns an empty array', Array.isArray(out) && out.length === 0);
}

// Vector 6: tactic mode, phase null — FINALIZE branch, no RE-PLAN text.
{
  const out = tacticModeFraming('tactic', { phase: null });
  const text = out.join('\n');
  ok('vector6: phase null includes FINALIZE', text.includes('FINALIZE'));
  ok('vector6: phase null excludes RE-PLAN', !text.includes('RE-PLAN'));
  // Vector 10 (part 1): both tactic-mode branches carry the wholesale-replace warning.
  ok(
    'vector10a: FINALIZE branch includes REPLACES THE NODE BODY WHOLESALE',
    text.includes('REPLACES THE NODE BODY WHOLESALE')
  );
}

// Vector 7: tactic mode, phase 'draft' — equivalent to absent, still FINALIZE.
{
  const out = tacticModeFraming('tactic', { phase: 'draft' });
  const text = out.join('\n');
  ok('vector7: phase draft includes FINALIZE', text.includes('FINALIZE'));
}

// Vector 8: tactic mode, phase 'implement' — RE-PLAN branch, carries the
// literal quoted phase value, and excludes FINALIZE.
{
  const out = tacticModeFraming('tactic', { phase: 'implement' });
  const text = out.join('\n');
  ok('vector8: phase implement includes RE-PLAN', text.includes('RE-PLAN'));
  ok('vector8: phase implement includes literal "implement"', text.includes('"implement"'));
  ok('vector8: phase implement excludes FINALIZE', !text.includes('FINALIZE'));
  // Vector 10 (part 2): both tactic-mode branches carry the wholesale-replace warning.
  ok(
    'vector10b: RE-PLAN branch includes REPLACES THE NODE BODY WHOLESALE',
    text.includes('REPLACES THE NODE BODY WHOLESALE')
  );
}

// Vector 9: tactic mode, phase 'qa' — RE-PLAN branch.
{
  const out = tacticModeFraming('tactic', { phase: 'qa' });
  const text = out.join('\n');
  ok('vector9: phase qa includes RE-PLAN', text.includes('RE-PLAN'));
}

// Vector 11: undefined tactic in tactic mode does not throw and yields the
// FINALIZE branch (phase treated as absent).
{
  const out = doesNotThrow('vector11: tacticModeFraming("tactic", undefined) does not throw', () =>
    tacticModeFraming('tactic', undefined)
  );
  if (out) {
    const text = out.join('\n');
    ok('vector11: undefined tactic yields FINALIZE branch', text.includes('FINALIZE'));
  } else {
    ok('vector11: undefined tactic yields FINALIZE branch', false);
  }
}

if (failures > 0) {
  process.stdout.write(`align-tactics-target-context-probe: ${failures} FAILURE(S)\n`);
  process.exit(1);
}
process.stdout.write('align-tactics-target-context-probe: ALL PASS\n');
