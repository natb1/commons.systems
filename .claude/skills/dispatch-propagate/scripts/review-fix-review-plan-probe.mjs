#!/usr/bin/env node
// review-fix-review-plan-probe.mjs (tactic-review-plan-preflight-skill)
//
// CI-vector probe for the /review-plan gate in .claude/workflows/review-fix.js:
// reviewPlanEffort, reviewPlanFinderSet, reviewPlanDeadline, REVIEW_PLAN_BAND,
// REVIEW_PLAN_DEADLINES.
//
// run-unit-tests.sh has no mapping for .claude/workflows/*, so a PR touching
// only review-fix.js triggers no vitest suite, and its test-*.sh glob is not a
// fallback either — that glob only runs when RUN_PR_SCRIPTS is set, which
// auto-detect sets solely for changed paths under
// .claude/skills/dispatch-propagate/scripts/ (run-unit-tests.sh:88). The actual
// CI vector is the hook-tests job in .github/workflows/unit-tests.yml, which
// runs test-review-plan-gate.sh (this probe's driver) unconditionally on every
// PR. Keep that step wired — deleting it removes all coverage here.
//
// review-fix.js is a Workflow-tool script (top-level await + injected globals),
// so it CANNOT be imported or executed by node. This probe SLICES the pure
// "review plan gate" region out from between its sentinel comments, evals it,
// and prints the results of running the exported functions on a fixture set.
// Same mechanism as review-fix-domain-sweep-probe.mjs; the two are deliberately
// alike so a reader who knows one knows both.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

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

// FAIL LOUDLY: each sentinel must appear exactly once. A silently empty slice
// would make every assertion below vacuous.
function sliceBetween(src, START, END) {
  const startCount = countOccurrences(src, START);
  const endCount = countOccurrences(src, END);
  if (startCount !== 1) {
    process.stderr.write(
      `review-fix-review-plan-probe: START sentinel not found exactly once (count=${startCount}) for "${START}" in ${reviewFixPath}\n`
    );
    process.exit(1);
  }
  if (endCount !== 1) {
    process.stderr.write(
      `review-fix-review-plan-probe: END sentinel not found exactly once (count=${endCount}) for "${END}" in ${reviewFixPath}\n`
    );
    process.exit(1);
  }
  const slice = src.slice(src.indexOf(START) + START.length, src.indexOf(END)).trim();
  if (!slice) {
    process.stderr.write(
      `review-fix-review-plan-probe: empty slice between "${START}" and "${END}"\n`
    );
    process.exit(1);
  }
  return slice;
}

const GATE_START =
  "// >>> review plan gate: sliced + eval'd by review-fix-review-plan-probe.mjs >>>";
const GATE_END = '// <<< review plan gate <<<';

const gateSlice = sliceBetween(source, GATE_START, GATE_END);

const {
  REVIEW_PLAN_BAND,
  REVIEW_PLAN_DEFAULT_EFFORT,
  REVIEW_PLAN_DEADLINES,
  REVIEW_PLAN_AWAIT_S,
  REVIEW_PLAN_KNOWN_FINDERS,
  reviewPlanEffort,
  reviewPlanFinderSet,
  reviewPlanDeadline,
} = (function () {
  // eslint-disable-next-line no-eval -- the slice has several top-level statements, not a single expression, so `new Function('return ' + src)()` cannot wrap it // type-safety-ok: eval is required here
  return eval(
    `(function () { ${gateSlice}\nreturn { REVIEW_PLAN_BAND, REVIEW_PLAN_DEFAULT_EFFORT, REVIEW_PLAN_DEADLINES, REVIEW_PLAN_AWAIT_S, REVIEW_PLAN_KNOWN_FINDERS, reviewPlanEffort, reviewPlanFinderSet, reviewPlanDeadline }; })()`
  );
})();

// Today's full roster for surface=code with app_or_rules — the FLOOR.
const FLOOR = ['input-validation', 'domain-sweep', 'red-team', 'security-review', 'api-cost'];
// A NON-code surface floor, so the widen vectors add a KNOWN agent name. Using a
// prescanned source name like `erosion` here would be wrong twice over: it is
// not an agent finder, and the allowlist now rejects it.
const CODE_FLOOR_NOAPP = ['input-validation', 'domain-sweep', 'red-team', 'security-review'];

const results = {};

results.band = REVIEW_PLAN_BAND;
results.default_effort = REVIEW_PLAN_DEFAULT_EFFORT;
results.await_s = REVIEW_PLAN_AWAIT_S;
results.deadlines = REVIEW_PLAN_DEADLINES;

// --- fail-open ---------------------------------------------------------------
results.effort_undefined = reviewPlanEffort(undefined);
results.effort_null = reviewPlanEffort(null);
results.effort_string = reviewPlanEffort('xhigh');
results.effort_array = reviewPlanEffort(['xhigh']);
results.effort_empty_object = reviewPlanEffort({});

// --- band ---------------------------------------------------------------------
results.effort_ultra = reviewPlanEffort({ effort: 'ultra', raise: ['contract-delta'] });
results.effort_bogus = reviewPlanEffort({ effort: 'extreme', raise: ['contract-delta'] });
results.effort_max = reviewPlanEffort({ effort: 'max', raise: ['irreversible-ish'] });
results.effort_low_ok = reviewPlanEffort({ effort: 'low', raise: [], cheapen: ['test-only', 'no-contract-delta', 'small'] });
results.effort_high_noop = reviewPlanEffort({ effort: 'high', raise: [] });

// --- irreversibility floor overrides a unanimous cheapen ----------------------
results.effort_irreversible_cheapen = reviewPlanEffort({
  effort: 'low',
  irreversible: true,
  raise: [],
  cheapen: ['test-only', 'mechanical', 'small', 'no-contract-delta'],
});
results.effort_irreversible_already_max = reviewPlanEffort({
  effort: 'max',
  irreversible: true,
  raise: ['destructive-git-op'],
});
results.effort_irreversible_at_xhigh = reviewPlanEffort({
  effort: 'xhigh',
  irreversible: true,
  raise: ['migration'],
});

// --- asymmetry ----------------------------------------------------------------
// One raise signal kills a cheapen; nothing is needed to go deep.
results.effort_cheapen_blocked_by_raise = reviewPlanEffort({
  effort: 'low',
  raise: ['contract-delta'],
  cheapen: ['small', 'mechanical'],
});
results.effort_cheapen_no_signals = reviewPlanEffort({ effort: 'medium', raise: [], cheapen: [] });
results.effort_raise_no_signals = reviewPlanEffort({ effort: 'xhigh', raise: [], cheapen: [] });

// --- deadline scaling ---------------------------------------------------------
results.deadline_low = reviewPlanDeadline('low');
results.deadline_medium = reviewPlanDeadline('medium');
results.deadline_high = reviewPlanDeadline('high');
results.deadline_xhigh = reviewPlanDeadline('xhigh');
results.deadline_max = reviewPlanDeadline('max');
results.deadline_bogus = reviewPlanDeadline('extreme');
results.deadline_undefined = reviewPlanDeadline(undefined);
// cap × await == deadline at EVERY level, not just at high.
results.deadline_equality_holds = REVIEW_PLAN_BAND.every((e) => {
  const d = reviewPlanDeadline(e);
  return d.poll_cap * d.await_s === d.deadline_s && Number.isInteger(d.poll_cap);
});

// --- finder set ---------------------------------------------------------------
results.finders_fail_open = reviewPlanFinderSet(FLOOR, undefined);
results.finders_no_finder_set = reviewPlanFinderSet(FLOOR, { effort: 'low' });
// A genuine widen: `api-cost` is a KNOWN agent finder absent from the
// no-app_or_rules floor, so a verdict may add it on the semantics of the diff.
results.finders_widen = reviewPlanFinderSet(CODE_FLOOR_NOAPP, {
  finder_set: CODE_FLOOR_NOAPP.concat(['api-cost']),
});
// A verdict that OMITS floor lenses must not remove them.
results.finders_removal_refused = reviewPlanFinderSet(FLOOR, { finder_set: ['red-team'] });
results.finders_empty_refused = reviewPlanFinderSet(FLOOR, { finder_set: [] });
// Non-code surface: the floor is already [], so a verdict cannot conjure a
// roster from nothing... but it CAN add, which is the widen direction and is
// allowed.
results.finders_empty_floor_widen = reviewPlanFinderSet([], { finder_set: ['red-team'] });
results.finders_empty_floor_fail_open = reviewPlanFinderSet([], undefined);
// Junk entries are dropped, not propagated into a spawn loop.
results.finders_junk = reviewPlanFinderSet(CODE_FLOOR_NOAPP, {
  finder_set: CODE_FLOOR_NOAPP.concat([null, 42, '', 'api-cost', 'api-cost']),
});
results.finders_bad_base = reviewPlanFinderSet(undefined, { finder_set: ['red-team'] });

// --- the allowlist ------------------------------------------------------------
// A name outside the known agent roster must NEVER reach the spawn loop.
// `erosion`/`codeql`/`npm` are PRESCANNED sources, not agent finders: launching
// one as an agent gives it a brief reading "Domain: undefined" and tags its
// findings with a Source that collides with the real prescanned one in dedup.
results.finders_unknown_name = reviewPlanFinderSet(FLOOR, {
  finder_set: FLOOR.concat(['erosion', 'codeql', 'npm']),
});
// A prototype-shaped name would reach DOMAIN_PROMPTS[name] as an inherited
// function and stringify into a prompt.
results.finders_proto_name = reviewPlanFinderSet(FLOOR, {
  finder_set: FLOOR.concat(['__proto__', 'constructor', 'toString']),
});
results.known_finders = REVIEW_PLAN_KNOWN_FINDERS;

process.stdout.write(JSON.stringify(results) + '\n');
