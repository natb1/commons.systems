#!/usr/bin/env node
// dispatch-review-erosion-diff.mjs (#2064)
//
// JSON-diff sidecar for the dispatch-review-erosion finder. The bash driver
// materializes a pre-PR baseline tree, runs eslint (complexity) and jscpd
// (duplication) over the baseline and HEAD trees, and hands the four artifact
// paths to this script. This script computes the NET structural increase the
// PR introduces — complexity-per-file scalars and duplication counts — and
// prints the {"findings":[...]} payload (Per-finding schema, review-fix.js
// lines 62-99) to stdout. Net increase only; no increase → {"findings":[]}.
//
// Why a sidecar: cross-tree scalar diffing and worst-function line tracking are
// fiddly enough to justify a node helper over bash/jq (precedent:
// qa-fix-partition-probe.mjs). No git, no network — pure file reads.
//
// Usage (all flags required except the optional baseline jscpd report, which is
// absent when no baseline file survived materialization):
//   dispatch-review-erosion-diff.mjs \
//     --eslint-head <json> --eslint-base <json> \
//     --jscpd-head <json> [--jscpd-base <json>] \
//     --baseline-dir <relpath>

import { readFileSync, existsSync } from 'node:fs';

// --- arg parsing -------------------------------------------------------------

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 2) {
    const key = argv[i];
    if (!key.startsWith('--')) {
      throw new Error(`expected --flag, got: ${key}`);
    }
    args[key.slice(2)] = argv[i + 1];
  }
  return args;
}

const args = parseArgs(process.argv.slice(2));

function readJson(path) {
  // FAIL LOUDLY on a missing required artifact rather than defaulting — a
  // missing eslint/jscpd report means the driver mis-ran, not "no findings".
  return JSON.parse(readFileSync(path, 'utf8'));
}

// --- complexity: per-file max/sum scalars from an eslint JSON report ---------
// eslint --format json emits an array of result objects, each with .filePath
// and .messages[]. Every complexity violation message carries
// "... has a complexity of N. Maximum allowed is 0." (threshold 0 ⇒ every
// function reports). We extract N per message, tracking the per-file max (with
// the line of that worst function) and the per-file sum.
//
// Keys are normalized to a path RELATIVE to the given tree root so the baseline
// tree and the HEAD tree line up for diffing. For the baseline tree the root is
// the materialized baseline dir; for HEAD it is the repo root (cwd).

const COMPLEXITY_RE = /complexity of (\d+)/;

function relpath(filePath, root) {
  // Both filePath (absolute, from eslint) and root (relative like "./tmp.XXXX"
  // or "") need normalizing. Resolve against cwd for a stable comparison.
  const abs = filePath;
  const rootAbs = root ? new URL(root + '/', `file://${process.cwd()}/`).pathname : `${process.cwd()}/`;
  return abs.startsWith(rootAbs) ? abs.slice(rootAbs.length) : abs;
}

function complexityScalars(report, root) {
  const perFile = new Map(); // relpath -> { max, maxLine, sum }
  for (const result of report) {
    const rel = relpath(result.filePath, root);
    let max = 0;
    let maxLine = 1;
    let sum = 0;
    for (const msg of result.messages || []) {
      if (msg.ruleId !== 'complexity') continue;
      const m = COMPLEXITY_RE.exec(msg.message || '');
      if (!m) continue;
      const n = Number(m[1]);
      sum += n;
      if (n > max) {
        max = n;
        maxLine = msg.line || 1;
      }
    }
    perFile.set(rel, { max, maxLine, sum });
  }
  return perFile;
}

// --- duplication: clone count + duplicated lines from a jscpd JSON report ----
// jscpd's json reporter writes <output>/jscpd-report.json with a .statistics
// .total block: { clones, duplicatedLines, lines, percentage, ... }. Absent
// fields default to 0 (a clean tree yields zeroes).

function jscpdTotals(report) {
  const total = report?.statistics?.total ?? {};
  return {
    clones: Number(total.clones || 0),
    duplicatedLines: Number(total.duplicatedLines || 0),
    percentage: Number(total.percentage || 0),
  };
}

// jscpd's .duplicates[] each carry a clone with .firstFile.{name,start} and
// .secondFile.{name,start}. Return a repo-relative `path:line` for the largest
// clone (most duplicated lines), so the duplication finding points at a real
// location a downstream inline-comment poster can use. Returns null when no
// clones are present.
function worstCloneLocation(report) {
  const dupes = report?.duplicates ?? [];
  if (dupes.length === 0) return null;
  let worst = dupes[0];
  let worstLines = -1;
  for (const d of dupes) {
    const lines = (d?.lines ?? d?.fragment?.split('\n').length ?? 0);
    if (lines > worstLines) {
      worstLines = lines;
      worst = d;
    }
  }
  const file = worst?.firstFile?.name ?? worst?.secondFile?.name;
  const line = worst?.firstFile?.start ?? worst?.secondFile?.start ?? 1;
  if (!file) return null;
  // jscpd file names are relative to the tree root it was run over; the HEAD
  // tree root is cwd, so strip any leading cwd prefix for a repo-relative path.
  const cwdPrefix = `${process.cwd()}/`;
  const rel = file.startsWith(cwdPrefix) ? file.slice(cwdPrefix.length) : file;
  return `${rel}:${line}`;
}

// --- build findings ----------------------------------------------------------

const findings = [];

// Complexity findings: one per file whose max OR sum rose vs baseline.
const headCx = complexityScalars(readJson(args['eslint-head']), '');
const baseCx = complexityScalars(readJson(args['eslint-base']), args['baseline-dir']);

for (const [rel, head] of headCx) {
  const base = baseCx.get(rel); // undefined ⇒ added file, no baseline ⇒ skip
  if (!base) continue; // correction 3: added files have no net-vs-main baseline
  const maxRose = head.max > base.max;
  const sumRose = head.sum > base.sum;
  if (!maxRose && !sumRose) continue;

  // Confidence: a single-function max jump is concrete and locatable (high);
  // a diffuse rise that only moves the sum is medium.
  const confidence = maxRose ? 'high' : 'medium';

  const parts = [];
  if (maxRose) {
    parts.push(
      `worst-function cyclomatic complexity rose from ${base.max} to ${head.max}`
    );
  }
  if (sumRose) {
    parts.push(`total file complexity rose from ${base.sum} to ${head.sum}`);
  }

  findings.push({
    Location: `${rel}:${head.maxLine}`,
    Description:
      `Net cyclomatic-complexity increase in ${rel} vs origin/main: ` +
      parts.join('; ') +
      '. The PR makes this file structurally harder to follow than its pre-PR state.',
    Source: 'erosion',
    OWASP: '',
    STRIDE: '',
    Confidence: confidence,
    'Recommended fix':
      'Decompose the most complex function at the flagged line — extract ' +
      'nested branches into named helpers or guard clauses — to bring this ' +
      "file's complexity back toward its pre-PR baseline.",
    Disposition: 'skipped',
  });
}

// Duplication finding: one aggregate finding when clone count or duplicated-line
// percentage rose across the changed-file set vs baseline.
const headDupReport = readJson(args['jscpd-head']);
const headDup = jscpdTotals(headDupReport);
const baseDup = args['jscpd-base'] && existsSync(args['jscpd-base'])
  ? jscpdTotals(readJson(args['jscpd-base']))
  : { clones: 0, duplicatedLines: 0, percentage: 0 };

const clonesRose = headDup.clones > baseDup.clones;
const dupLinesRose = headDup.duplicatedLines > baseDup.duplicatedLines;

if (clonesRose || dupLinesRose) {
  // A concrete new clone block (clone count up) is high confidence; a rise only
  // in duplicated-line count without new clones is diffuse → medium.
  const confidence = clonesRose ? 'high' : 'medium';
  const parts = [];
  if (clonesRose) {
    parts.push(`clone blocks rose from ${baseDup.clones} to ${headDup.clones}`);
  }
  if (dupLinesRose) {
    parts.push(
      `duplicated lines rose from ${baseDup.duplicatedLines} to ${headDup.duplicatedLines}`
    );
  }
  findings.push({
    // Point at the largest HEAD clone's real path:line when jscpd reports one,
    // so a downstream inline-comment poster can place the finding; fall back to
    // a generic marker if the report carries no per-clone detail.
    Location: worstCloneLocation(headDupReport) ?? 'changed files:0',
    Description:
      'Net code-duplication increase across the changed files vs origin/main: ' +
      parts.join('; ') +
      '. The PR introduces copy-pasted blocks not present in the pre-PR state.',
    Source: 'erosion',
    OWASP: '',
    STRIDE: '',
    Confidence: confidence,
    'Recommended fix':
      'Factor the newly duplicated block into a single shared helper and call ' +
      'it from both sites, rather than maintaining parallel copies.',
    Disposition: 'skipped',
  });
}

process.stdout.write(JSON.stringify({ findings }, null, 2) + '\n');
