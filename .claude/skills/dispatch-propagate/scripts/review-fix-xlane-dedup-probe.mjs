#!/usr/bin/env node
// review-fix-xlane-dedup-probe.mjs (tactic-review-cross-lane-dedup)
//
// CI-vector probe for the cross-lane absorption logic in
// .claude/workflows/review-fix.js. run-unit-tests.sh has no mapping for
// .claude/workflows/*, so a PR touching only review-fix.js triggers no vitest
// suite. Its test-*.sh glob over this directory is NOT a fallback either: that
// glob only runs when RUN_PR_SCRIPTS is set, which auto-detect sets solely for
// changed paths under .claude/skills/dispatch-propagate/scripts/
// (run-unit-tests.sh:88). The actual CI vector is the hook-tests job in
// .github/workflows/unit-tests.yml, which runs test-review-fix-xlane-dedup.sh
// (this probe's driver) unconditionally on every PR. Keep that step wired —
// deleting it removes all coverage here.
//
// review-fix.js is a Workflow-tool script (top-level await + injected globals),
// so it CANNOT be imported/executed by node. Instead this probe SLICES two
// pure sentinel-bounded regions out of review-fix.js:
//   - `dedup merge` (Unit 1) — dedupMerge + its CONF_RANK/rankConf/LANE_A_SOURCES
//     helpers
//   - `cross-lane dedup` (Unit 4, this tactic) — laneAAbsorbCandidates,
//     projectLaneAResidue, contestedLocationGroups, applyXlaneAbsorption
// and evals BOTH together in one scope, so the cross-lane functions can be
// driven by the REAL sliced dedupMerge (not a stand-in).

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// Resolve review-fix.js relative to this helper's own location. This helper
// sits at .claude/skills/dispatch-propagate/scripts/, so review-fix.js is
// three dirs up at .claude/workflows/review-fix.js.
const reviewFixPath = fileURLToPath(
  new URL('../../../workflows/review-fix.js', import.meta.url)
);

const source = readFileSync(reviewFixPath, 'utf8');

const DEDUP_START =
  "// >>> dedup merge: sliced + eval'd by review-fix-xlane-dedup-probe.mjs >>>";
const DEDUP_END = '// <<< dedup merge <<<';
const XLANE_START =
  "// >>> cross-lane dedup: sliced + eval'd by review-fix-xlane-dedup-probe.mjs >>>";
const XLANE_END = '// <<< cross-lane dedup <<<';

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

function requireExactlyOne(label, needle) {
  const count = countOccurrences(source, needle);
  if (count !== 1) {
    process.stderr.write(
      `review-fix-xlane-dedup-probe: ${label} sentinel not found exactly once (count=${count}) in ${reviewFixPath}\n`
    );
    process.exit(1);
  }
}

requireExactlyOne('dedup merge START', DEDUP_START);
requireExactlyOne('dedup merge END', DEDUP_END);
requireExactlyOne('cross-lane dedup START', XLANE_START);
requireExactlyOne('cross-lane dedup END', XLANE_END);

function sliceBetween(label, start, end) {
  const startIdx = source.indexOf(start) + start.length;
  const endIdx = source.indexOf(end);
  const slice = source.slice(startIdx, endIdx).trim();
  if (!slice) {
    process.stderr.write(`review-fix-xlane-dedup-probe: empty ${label} slice\n`);
    process.exit(1);
  }
  return slice;
}

// Both slices independently declare their own local `LANE_A_SOURCES` copy (by
// design — see the sentinel-region comments in review-fix.js), so evaling them
// concatenated into ONE scope collides on that name. applyXlaneAbsorption never
// references `dedupMerge` by name internally (it takes `merge` as an injected
// parameter instead), so the two slices don't actually need to share a scope —
// eval each into its own IIFE, and the fixtures below pass the REAL sliced
// dedupMerge in as `merge` wherever cross-lane's dedupMerge-driven behavior
// needs exercising (see the `lane-b-wins` and `absorb-success` cases).
const dedupMergeSlice = sliceBetween('dedup merge', DEDUP_START, DEDUP_END);
const xlaneSlice = sliceBetween('cross-lane dedup', XLANE_START, XLANE_END);

const { dedupMerge } = (function () {
  // eslint-disable-next-line no-eval -- see comment above // type-safety-ok: eval is required (not new Function) because the slice has multiple top-level statements, not a single expression
  return eval(`(function () {\n${dedupMergeSlice}\nreturn { dedupMerge }; })()`);
})();

const { laneAAbsorbCandidates, projectLaneAResidue, contestedLocationGroups, applyXlaneAbsorption } =
  (function () {
    // eslint-disable-next-line no-eval -- see comment above // type-safety-ok: eval is required (not new Function) because the slice has multiple top-level statements, not a single expression
    return eval(
      `(function () {\n${xlaneSlice}\nreturn { laneAAbsorbCandidates, projectLaneAResidue, contestedLocationGroups, applyXlaneAbsorption }; })()`
    );
  })();

// Fixture table (Unit 4 of tactic-review-cross-lane-dedup).

function finding(overrides) {
  return {
    id: 'f-default',
    Location: 'foo.js:1',
    Description: 'a finding',
    Confidence: 'medium',
    Source: 'secrets',
    OWASP: '',
    STRIDE: '',
    _idx: 0,
    ...overrides,
  };
}

function residueItem(overrides) {
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

// --- lane-b-wins: drives the real sliced dedupMerge directly (Unit 1 tie-break).
{
  const laneA = finding({ id: 'a', Source: 'code-review', Confidence: 'high', _idx: 0 });
  const laneB = finding({ id: 'b', Source: 'secrets', Confidence: 'low', _idx: 1 });
  const merged = dedupMerge([laneA, laneB]);
  results['lane-b-wins'] = {
    id: merged.id,
    Source: merged.Source,
    sources: merged.sources,
  };
}

// --- candidates-exclude-high-severity-security-review.
{
  const laneAResidue = [
    residueItem({ source: 'security-review', severity: 'high' }),
    residueItem({ source: 'security-review', severity: 'medium' }),
    residueItem({ source: 'code-review', severity: 'high' }),
  ];
  const candidates = laneAAbsorbCandidates(laneAResidue);
  results['candidates-exclude-high-severity-security-review'] = {
    survivingIdx: candidates.map(({ i }) => i),
    survivingSourceSeverity: candidates.map(({ r }) => `${r.source}:${r.severity}`),
  };
}

// --- contested-groups.
{
  const laneBEligible = [
    finding({ id: 'b1', Location: 'shared.js:1', Source: 'secrets' }),
    finding({ id: 'b2', Location: 'laneb-only.js:5', Source: 'secrets' }),
  ];
  const laneAProjections = [
    projectLaneAResidue({ r: residueItem({ location: 'shared.js:1' }), i: 0 }, 100),
    projectLaneAResidue({ r: residueItem({ location: 'lanea-only.js:9' }), i: 1 }, 100),
  ];
  const contested = contestedLocationGroups(laneBEligible, laneAProjections);
  results['contested-groups'] = {
    locations: [...contested.keys()].sort(),
    hasSharedLocation: contested.has('shared.js:1'),
    hasLaneBOnlyLocation: contested.has('laneb-only.js:5'),
    hasLaneAOnlyLocation: contested.has('lanea-only.js:9'),
  };
}

// --- absorb-fail-closed-bad-merge: injected merge returns a Lane-A Source.
{
  const laneA = finding({ id: 'a1', Source: 'code-review', _laneAIdx: 0 });
  const laneB = finding({ id: 'b1', Source: 'secrets' });
  const deduped = [finding({ id: 'b1', Source: 'secrets' })];
  const badMerge = () => finding({ id: 'b1', Source: 'code-review' });
  const byId = new Map([
    ['a1', laneA],
    ['b1', laneB],
  ]);
  const result = applyXlaneAbsorption({
    deduped,
    subgroups: [['a1', 'b1']],
    byId,
    merge: badMerge,
  });
  results['absorb-fail-closed-bad-merge'] = {
    skipped: result.skipped,
    dedupedUnchanged: JSON.stringify(result.deduped) === JSON.stringify(deduped),
    absorbedIdxEmpty: result.absorbedIdx.size === 0,
  };
}

// --- absorb-fail-closed-id-not-found: merged id absent from deduped.
{
  const laneA = finding({ id: 'a1', Source: 'code-review', _laneAIdx: 0 });
  const laneB = finding({ id: 'b1', Source: 'secrets' });
  const deduped = [finding({ id: 'b1', Source: 'secrets' })];
  const missingIdMerge = () => finding({ id: 'nope', Source: 'secrets' });
  const byId = new Map([
    ['a1', laneA],
    ['b1', laneB],
  ]);
  const result = applyXlaneAbsorption({
    deduped,
    subgroups: [['a1', 'b1']],
    byId,
    merge: missingIdMerge,
  });
  results['absorb-fail-closed-id-not-found'] = {
    skipped: result.skipped,
    dedupedUnchanged: JSON.stringify(result.deduped) === JSON.stringify(deduped),
    absorbedIdxEmpty: result.absorbedIdx.size === 0,
  };
}

// --- absorb-success: real dedupMerge, id present in deduped, Lane-B wins.
{
  const laneA = finding({ id: 'a1', Source: 'code-review', Confidence: 'high', _idx: 0, _laneAIdx: 3 });
  const laneB = finding({ id: 'b1', Source: 'secrets', Confidence: 'low', _idx: 1 });
  const deduped = [finding({ id: 'other', Source: 'secrets' }), laneB];
  const byId = new Map([
    ['a1', laneA],
    ['b1', laneB],
  ]);
  const result = applyXlaneAbsorption({
    deduped,
    subgroups: [['a1', 'b1']],
    byId,
    merge: dedupMerge,
  });
  const replaced = result.deduped.find((f) => f.id === 'b1');
  results['absorb-success'] = {
    skipped: result.skipped,
    replacedSource: replaced ? replaced.Source : null,
    replacedSources: replaced ? replaced.sources : null,
    absorbedIdx: [...result.absorbedIdx],
    otherEntryUntouched: result.deduped[0].id === 'other',
  };
}

// --- empty-inputs.
{
  const candidates = laneAAbsorbCandidates([]);
  const contested = contestedLocationGroups([], []);
  const result = applyXlaneAbsorption({
    deduped: [],
    subgroups: [],
    byId: new Map(),
    merge: dedupMerge,
  });
  results['empty-inputs'] = {
    candidatesLength: candidates.length,
    contestedSize: contested.size,
    dedupedLength: result.deduped.length,
    skipped: result.skipped,
    absorbedIdxSize: result.absorbedIdx.size,
  };
}

process.stdout.write(JSON.stringify(results) + '\n');
