#!/usr/bin/env node
// review-fix-domain-sweep-probe.mjs (tactic-review-domain-lens-consolidation)
//
// CI-vector probe for agentFinderSet, DOMAIN_PROMPTS, sweepDomains, and
// sweepSections in .claude/workflows/review-fix.js. run-unit-tests.sh has no
// mapping for .claude/workflows/*, so a PR touching only review-fix.js
// triggers no vitest suite. Its test-*.sh glob over this directory is NOT a
// fallback either: that glob only runs when RUN_PR_SCRIPTS is set, which
// auto-detect sets solely for changed paths under
// .claude/skills/dispatch-propagate/scripts/ (run-unit-tests.sh:88). The
// actual CI vector is the hook-tests job in .github/workflows/unit-tests.yml,
// which runs test-review-fix-domain-sweep.sh (this probe's driver)
// unconditionally on every PR. Keep that step wired — deleting it removes
// all coverage here.
//
// review-fix.js is a Workflow-tool script (top-level await + injected
// globals), so it CANNOT be imported/executed by node. Instead this probe
// SLICES two pure regions out from between sentinel comments and evals them
// together, then runs the exported functions on a fixture set and prints the
// results.
//
// Unit 1 (already landed) folded three review-fix.js finder agents
// (secrets/auth/data-exposure) into one `domain-sweep` Opus agent, wrapping
// two regions in sentinel comments:
//   - "domain sweep gate" — wraps agentFinderSet.
//   - "domain sweep brief" — wraps DOMAIN_PROMPTS, sweepDomains, and
//     sweepSections.

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
      `review-fix-domain-sweep-probe: START sentinel not found exactly once (count=${startCount}) for "${START}" in ${reviewFixPath}\n`
    );
    process.exit(1);
  }
  if (endCount !== 1) {
    process.stderr.write(
      `review-fix-domain-sweep-probe: END sentinel not found exactly once (count=${endCount}) for "${END}" in ${reviewFixPath}\n`
    );
    process.exit(1);
  }
  const startIdx = src.indexOf(START) + START.length;
  const endIdx = src.indexOf(END);
  const slice = src.slice(startIdx, endIdx).trim();
  if (!slice) {
    process.stderr.write(
      `review-fix-domain-sweep-probe: empty slice between "${START}" and "${END}"\n`
    );
    process.exit(1);
  }
  return slice;
}

const GATE_START =
  "// >>> domain sweep gate: sliced + eval'd by review-fix-domain-sweep-probe.mjs >>>";
const GATE_END = '// <<< domain sweep gate <<<';
const BRIEF_START =
  "// >>> domain sweep brief: sliced + eval'd by review-fix-domain-sweep-probe.mjs >>>";
const BRIEF_END = '// <<< domain sweep brief <<<';

const gateSlice = sliceBetween(source, GATE_START, GATE_END);
const briefSlice = sliceBetween(source, BRIEF_START, BRIEF_END);

// The combined slice holds several top-level statements (a function
// declaration, a const object, and two more function declarations), not a
// single expression, so it cannot be wrapped as `new Function('return ' +
// src)()` the way a single function expression can. Instead the concatenated
// slices are eval'd directly (in an IIFE, to avoid leaking into this
// module's top level) and the IIFE returns the four names under test.
const { agentFinderSet, sweepDomains, sweepSections, DOMAIN_PROMPTS } = (function () {
  const combinedSource = `${gateSlice}\n${briefSlice}`;
  // eslint-disable-next-line no-eval -- see comment above // type-safety-ok: eval is required (not new Function) because the combined slice has several top-level statements, not a single expression
  return eval(
    `(function () { ${combinedSource}\nreturn { agentFinderSet, sweepDomains, sweepSections, DOMAIN_PROMPTS }; })()`
  );
})();

const results = {};

results.roster_empty = agentFinderSet('empty', false);
results.roster_docs = agentFinderSet('docs', true);
results.roster_tests = agentFinderSet('tests', true);
results.roster_code_noapp = agentFinderSet('code', false);
results.roster_code_app = agentFinderSet('code', true);

results.domains_noapp = sweepDomains(false);
results.domains_app = sweepDomains(true);

results.sections_noapp = sweepSections(false);
results.sections_app = sweepSections(true);

results.brief_secrets = DOMAIN_PROMPTS.secrets;
results.brief_auth = DOMAIN_PROMPTS.auth;
results.brief_data_exposure = DOMAIN_PROMPTS['data-exposure'];

process.stdout.write(JSON.stringify(results) + '\n');
