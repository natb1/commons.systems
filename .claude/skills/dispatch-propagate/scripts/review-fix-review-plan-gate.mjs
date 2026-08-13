#!/usr/bin/env node
// review-fix-review-plan-gate.mjs — the node half of dispatch-review-plan-gate.
//
// Reads a /review-plan verdict as JSON on stdin, applies the SAME gate the
// Workflow applies (sliced live out of the `review plan gate` sentinel region
// of review-fix.js, never re-implemented here), and prints key=value lines for
// the bash caller.
//
// Argv[2] is the path to review-fix.js — passed in by dispatch-review-plan-gate
// rather than resolved here, so the two agree by construction.
//
// This is the seam that makes the gate bind BEFORE /review-fix Step 1b launches
// the real review. See dispatch-review-plan-gate's header for why a gate that
// only runs inside the Workflow is worse than no gate at all.

import { readFileSync } from 'node:fs';

const reviewFixPath = process.argv[2];
if (!reviewFixPath) {
  process.stderr.write('review-fix-review-plan-gate: missing review-fix.js path argument\n');
  process.exit(1);
}

const source = readFileSync(reviewFixPath, 'utf8');

const START =
  "// >>> review plan gate: sliced + eval'd by review-fix-review-plan-probe.mjs >>>";
const END = '// <<< review plan gate <<<';

// FAIL LOUDLY on a missing or duplicated sentinel: a silently empty slice would
// make the gate a no-op that still printed a confident-looking effort line. The
// bash caller turns a non-zero exit here into its documented fail-open answer.
const startCount = source.split(START).length - 1;
const endCount = source.split(END).length - 1;
if (startCount !== 1 || endCount !== 1) {
  process.stderr.write(
    `review-fix-review-plan-gate: sentinels not found exactly once (start=${startCount} end=${endCount}) in ${reviewFixPath}\n`
  );
  process.exit(1);
}
const slice = source.slice(source.indexOf(START) + START.length, source.indexOf(END)).trim();
if (!slice) {
  process.stderr.write('review-fix-review-plan-gate: empty gate slice\n');
  process.exit(1);
}

const { reviewPlanEffort, reviewPlanDeadline } = (function () {
  // eslint-disable-next-line no-eval -- the slice has several top-level statements, not a single expression, so `new Function('return ' + src)()` cannot wrap it. The interpolated text is a first-party repo file read from disk, never caller input. // type-safety-ok: eval is required here
  return eval(`(function () { ${slice}\nreturn { reviewPlanEffort, reviewPlanDeadline }; })()`);
})();

let verdict;
try {
  verdict = JSON.parse(readFileSync(0, 'utf8'));
} catch {
  // Unparseable stdin is a fail-open case, not a crash: hand the gate `null`
  // and let its own fail-open branch produce the answer, so there is exactly
  // one place that decides what "no usable verdict" means.
  verdict = null;
}

const effort = reviewPlanEffort(verdict);
const deadline = reviewPlanDeadline(effort.effort);

// Newlines in a reason would break the key=value contract the bash caller parses
// with `sed -n 's/^key=//p'`.
const flat = String(effort.reason).replace(/[\r\n]+/g, ' ');

process.stdout.write(
  [
    `effort=${effort.effort}`,
    `effort_reason=${flat}`,
    `deadline_s=${deadline.deadline_s}`,
    `poll_cap=${deadline.poll_cap}`,
    `await_s=${deadline.await_s}`,
    '',
  ].join('\n')
);
