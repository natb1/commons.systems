#!/usr/bin/env node
// packages/disposition/accumulate.mjs
//
// CLI: node packages/disposition/accumulate.mjs <graphDir> [--nodes <id,...>]
//                                               [--dry] [--remote <ref>]
//                                               [--report <file>]
//
// The fold, the half of the accumulation an instrument may run unattended
// (commons.systems/disposition-graph/unconfirmed-accumulation). It strikes
// from a node exactly two things and nothing else:
//
//   (a) every `### ` section of `## Account` that precedes the section of the
//       last clean-context reading on the node -- that reading's section and
//       everything after it is what a re-reading is given
//       (commons.systems/disposition-graph/review-cost), so it stays.
//
//       "Precedes" is position and not date, and that is the whole of the
//       invariant this rule rests on: an account section is APPENDED, so file
//       order is chronological order and the two never disagree. A session
//       that writes a new section at the head of `## Account` instead breaks
//       the invariant, and its section is struck however new it is -- the
//       reachability guard below does not catch that, because such text is
//       genuinely on the ref. The rule is the right one and is not changed
//       here; what was missing was that it rested on an invariant nothing
//       stated and nothing checked, found by reading this file in the sitting
//       of 2026-09-08. So the invariant is written down here, and
//       `dateInversions` below checks it where the headings carry dates,
//       rather than trusting the next session to have read this;
//   (b) a superseded `review` block. The encoding the reader accepts today
//       carries at most one `review` mapping in the frontmatter and has no
//       shape for a second (`read.mjs`, REVIEW_KEY_SET: the five draft keys
//       plus `survey`, and an unknown key is a parse error), so no review
//       block can be superseded and (b) has nothing to strike. The kind is
//       carried through `foldable`'s return shape so that the day the
//       encoding grows one, the caller's contract does not change.
//
// Nothing else: no facts, no options, no fence, no probes, no ledger, no
// rationale. Absorption -- the rewrite that moves a `## Rationale`, a
// `## Disposition` or a stale finding into the parts the dialogue reads -- is
// a separate pass, never runs unattended, and is not this instrument's; a
// `--absorb` flag is refused with that message.
//
// In the place of each struck section stands a manifest line, under one
// `### Manifest` heading placed first in `## Account`:
//
//     - Folded: <section heading>, at <full graph commit sha>
//
// and the sha is a commit reachable from `--remote` (default
// `origin/disposition`) whose copy of that node's file contains the section's
// full text byte for byte. Text that is not there is not struck: the full
// history is in git because it is in git first, so an instrument that struck
// unpushed text would not be moving it to the history but ending it. A node
// carrying one such section has none of its sections folded, and the refusal
// is reported per node.
//
// The fold is idempotent (the `### Manifest` section is never itself folded,
// and a node with nothing left to fold is not rewritten at all), it moves no
// hash (`## Account` is no part of `deriveStandingHash`'s parts, and (b)
// strikes nothing), and it takes no per-section selection flag: the set is
// the checkpoint's, named with `--nodes`, never the session's, since a set
// chosen section by section is a set with no trace of what it left out.
import { execFile } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

import { readGraph } from './read.mjs';

const execFileAsync = promisify(execFile);

const DEFAULT_REMOTE = 'origin/disposition';

// A `### ` section of `## Account` is a clean-context reading's own section
// when its heading opens on the reading's name and carries a date. The record
// has written that heading a dozen ways since 2026-09-03 -- with the sha and
// without it, "of the amendment", "(second reading)", "(ii)" -- and the
// boundary this matcher finds is the one the fold keeps, so the loose end of
// the family is the safe one to be strict about: a heading this misses moves
// the boundary earlier and folds less, a heading it wrongly admits moves the
// boundary later and folds a real reading away. Hence: the name at the front,
// a date somewhere, and nothing about what comes between.
const READING_HEADING_RE = /^clean-context\s+(?:review|re-reading)\b/i;
const DATE_RE = /\b(\d{4}-\d{2}-\d{2})\b/;

// The heading the manifest lines live under, which is never folded: it is the
// one account section that is not the dialogue's history, and folding it would
// make the second run of an idempotent instrument strike its own trace.
const MANIFEST_HEADING = 'Manifest';

// ---------------------------------------------------------------------------
// section geometry
// ---------------------------------------------------------------------------

const FENCE_RE = /^[ \t]*(`{3,}|~{3,})/;
const HEADING_RE = /^(#{1,6})[ \t]+(.*?)\s*$/;

/**
 * The indices of the lines that are headings of exactly `depth` `#`s, fence
 * aware: a heading-looking line inside a fenced code block is content, the
 * same guard `read.mjs`'s own `parseBody` and `level3SectionBodies` use.
 *
 * @param {string[]} lines
 * @param {number} depth
 * @returns {{name: string, index: number}[]}
 */
function headingLines(lines, depth) {
  const out = [];
  let fenceChar = null;
  for (let i = 0; i < lines.length; i += 1) {
    const fence = lines[i].match(FENCE_RE);
    if (fence) {
      if (fenceChar === null) fenceChar = fence[1][0];
      else if (fence[1][0] === fenceChar) fenceChar = null;
      continue;
    }
    if (fenceChar !== null) continue;
    const m = lines[i].match(HEADING_RE);
    if (m && m[1].length === depth) out.push({ name: m[2], index: i });
  }
  return out;
}

/**
 * The `### ` sections of one `## Account` body, in file order, each as the
 * half-open line range `[startLine, endLine)` of `lines` that holds its
 * heading line and everything under it.
 *
 * @param {string[]} lines - the account body's lines, heading line excluded.
 * @returns {{heading: string, startLine: number, endLine: number}[]}
 */
function accountSections(lines) {
  const headings = headingLines(lines, 3);
  return headings.map((h, i) => ({
    heading: h.name,
    startLine: h.index,
    endLine: i + 1 < headings.length ? headings[i + 1].index : lines.length,
  }));
}

/** Is this `### ` heading a clean-context reading's own section? */
function isReadingHeading(heading) {
  return READING_HEADING_RE.test(heading.trim()) && DATE_RE.test(heading);
}

function isManifestHeading(heading) {
  return heading.trim() === MANIFEST_HEADING;
}

/** The first ISO date the heading carries, or null. */
function headingDate(heading) {
  const m = heading.match(DATE_RE);
  return m ? m[1] : null;
}

/**
 * The index of the last reading section in `sections`, or -1 where the node
 * has had no clean-context reading yet -- in which case nothing folds, since
 * the whole account is what the next reading is given.
 */
function lastReadingIndex(sections) {
  let last = -1;
  sections.forEach((s, i) => { if (isReadingHeading(s.heading)) last = i; });
  return last;
}

/**
 * Which of an account's sections the fold would strike, given that account's
 * lines: every section before the last reading's, the `### Manifest` section
 * excepted.
 */
function foldableSections(lines) {
  const sections = accountSections(lines);
  const last = lastReadingIndex(sections);
  if (last < 0) return [];
  return sections.slice(0, last).filter((s) => !isManifestHeading(s.heading));
}

/**
 * Where the position rule and the dates disagree on one account, as refusal
 * entries. A section the fold would strike whose heading carries a date later
 * than the last reading's is a section written out of order: the append
 * invariant above is broken, and striking it would end text newer than the
 * reading it is being folded behind.
 *
 * Silent where either heading carries no date, which is about a twelfth of the
 * record's account headings: a guard that fires only on a difference it can
 * actually read is never wrong, and is worth more than no guard at all. It is
 * a check on the invariant and not a second selection rule -- it never widens
 * what the fold strikes, and only ever refuses.
 *
 * @param {string[]} lines - the `## Account` body, as `foldableSections` takes it
 * @returns {{heading: string, reason: string}[]}
 */
export function dateInversions(lines) {
  const sections = accountSections(lines);
  const last = lastReadingIndex(sections);
  if (last < 0) return [];
  const readingDate = headingDate(sections[last].heading);
  if (readingDate === null) return [];
  const out = [];
  for (const s of sections.slice(0, last)) {
    if (isManifestHeading(s.heading)) continue;
    const d = headingDate(s.heading);
    if (d !== null && d > readingDate) {
      out.push({
        heading: s.heading,
        reason: `dated ${d}, later than the last clean-context reading's `
          + `${readingDate}: an account section stands before a reading older `
          + 'than it is, so it was not appended. Move the section after the '
          + 'reading rather than folding it',
      });
    }
  }
  return out;
}

/** Character offset of the start of each line of `text`. */
function lineOffsets(text) {
  const offsets = [0];
  for (let i = 0; i < text.length; i += 1) {
    if (text[i] === '\n') offsets.push(i + 1);
  }
  return offsets;
}

// ---------------------------------------------------------------------------
// foldable
// ---------------------------------------------------------------------------

/**
 * The sections the fold would strike from one node, in the order they stand
 * in the file. `start` and `end` are character offsets into `node.account`
 * (the `## Account` body as the reader gives it, its heading line excluded
 * and its ends trimmed), so that `node.account.slice(start, end)` is the
 * section's text, heading line included.
 *
 * `kind` is `'account'` for a struck account section and `'review'` for a
 * superseded review block; the encoding carries no second review block, so
 * `'review'` is never returned today (see the head of this file).
 *
 * A node with no `## Account`, with no clean-context reading section, or with
 * nothing before its last one, folds nothing and is untouched.
 *
 * @param {object} node - a node as `read.mjs`'s `parseNode`/`readGraph`
 *   shapes it; only `account` is read.
 * @returns {{heading: string, start: number, end: number, kind: string, date: string|null}[]}
 */
export function foldable(node) {
  const account = node && typeof node.account === 'string' ? node.account : null;
  if (account === null || account.trim() === '') return [];
  const lines = account.split('\n');
  const offsets = lineOffsets(account);
  return foldableSections(lines).map((s) => ({
    heading: s.heading,
    start: offsets[s.startLine],
    end: s.endLine < lines.length ? offsets[s.endLine] : account.length,
    kind: 'account',
    date: headingDate(s.heading),
  }));
}

// ---------------------------------------------------------------------------
// the rewrite
// ---------------------------------------------------------------------------

/** Drop trailing blank lines from a block of lines. */
function trimTrailingBlank(lines) {
  const out = lines.slice();
  while (out.length > 0 && out[out.length - 1].trim() === '') out.pop();
  return out;
}

/**
 * Locate one node file's `## Account` section in its raw text.
 *
 * @param {string} raw
 * @returns {{lines: string[], headingLine: number, bodyStart: number, bodyEnd: number}|null}
 */
function accountRegion(raw) {
  const lines = raw.split('\n');
  const level2 = headingLines(lines, 2);
  const idx = level2.findIndex((h) => h.name === 'Account');
  if (idx < 0) return null;
  return {
    lines,
    headingLine: level2[idx].index,
    bodyStart: level2[idx].index + 1,
    bodyEnd: idx + 1 < level2.length ? level2[idx + 1].index : lines.length,
  };
}

/**
 * Rewrite one node file's raw text with the named sections struck and one
 * manifest line standing for each, under a `### Manifest` heading placed
 * first in `## Account`. Called only when `folds` is non-empty, so a node
 * with nothing to fold is never reformatted.
 *
 * @param {string} raw
 * @param {{startLine: number, endLine: number, heading: string}[]} folds -
 *   sections of the account region, in file order.
 * @param {string} sha - the full commit the manifest lines name.
 * @returns {string}
 */
function rewrite(raw, folds, sha) {
  const { lines, headingLine, bodyStart, bodyEnd } = accountRegion(raw);
  const body = lines.slice(bodyStart, bodyEnd);
  const sections = accountSections(body);
  const struck = new Set(folds.map((f) => f.startLine));

  const firstSectionLine = sections.length > 0 ? sections[0].startLine : body.length;
  const preamble = trimTrailingBlank(body.slice(0, firstSectionLine));

  const newLines = folds.map((f) => `- Folded: ${f.heading}, at ${sha}`);
  let manifest = null;
  const kept = [];
  for (const s of sections) {
    if (struck.has(s.startLine)) continue;
    const text = trimTrailingBlank(body.slice(s.startLine, s.endLine));
    if (isManifestHeading(s.heading)) manifest = text;
    else kept.push(text);
  }
  if (manifest === null) manifest = [`### ${MANIFEST_HEADING}`, '', ...newLines];
  else manifest = [...trimTrailingBlank(manifest), ...newLines];

  const blocks = [];
  if (preamble.length > 0) blocks.push(preamble);
  blocks.push(manifest);
  for (const k of kept) blocks.push(k);

  const out = [...lines.slice(0, headingLine + 1), ''];
  blocks.forEach((block, i) => {
    if (i > 0) out.push('');
    out.push(...block);
  });
  const rest = lines.slice(bodyEnd);
  if (rest.length > 0) out.push('', ...rest);
  else out.push('');
  return out.join('\n');
}

// ---------------------------------------------------------------------------
// git
// ---------------------------------------------------------------------------

async function git(graphDir, args) {
  const { stdout } = await execFileAsync('git', ['-C', graphDir, ...args], {
    maxBuffer: 256 * 1024 * 1024,
    encoding: 'utf8',
  });
  return stdout;
}

/** The full commit sha the ref names. Throws with git's own message. */
async function refCommit(graphDir, ref) {
  const out = await git(graphDir, ['rev-parse', '--verify', `${ref}^{commit}`]);
  return out.trim();
}

/**
 * One node file's text at the ref, or null where the ref's tree has no such
 * file (a node minted since the push).
 */
async function fileAtRef(graphDir, ref, relPath) {
  try {
    return await git(graphDir, ['show', `${ref}:${relPath}`]);
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// accumulate
// ---------------------------------------------------------------------------

/**
 * Run the fold over a graph.
 *
 * @param {string} graphDir - the graph's root (the directory holding
 *   `disposition.yaml`), which must also be inside the git work tree that
 *   holds the ref `--remote` names.
 * @param {object} [opts]
 * @param {string[]|null} [opts.nodes] - restrict to these nodes, each named
 *   by full id or by any trailing path segment of one (`<graph>/<slug>` or
 *   `<slug>`). A name matching no node is an error.
 * @param {boolean} [opts.dry] - compute and report, write nothing.
 * @param {string} [opts.remote] - the ref the struck text must be reachable
 *   from; default `origin/disposition`.
 * @returns {Promise<object>} the report `--report` writes.
 */
export async function accumulate(graphDir, opts = {}) {
  const root = path.resolve(graphDir);
  const dry = opts.dry === true;
  const remote = opts.remote || DEFAULT_REMOTE;
  const graph = await readGraph(root);

  let selected = graph.nodes;
  if (Array.isArray(opts.nodes) && opts.nodes.length > 0) {
    const wanted = opts.nodes.map((n) => n.trim()).filter((n) => n.length > 0);
    const matched = new Set();
    selected = [];
    for (const name of wanted) {
      const hits = graph.nodes.filter((n) => n.id === name || n.id.endsWith(`/${name}`));
      if (hits.length === 0) throw new Error(`--nodes: no node named ${name}`);
      if (hits.length > 1) {
        throw new Error(`--nodes: ${name} names ${hits.length} nodes; use the full id`);
      }
      if (!matched.has(hits[0].id)) {
        matched.add(hits[0].id);
        selected.push(hits[0]);
      }
    }
  }

  const sha = await refCommit(root, remote);

  const report = {
    graphDir: root,
    remote,
    commit: sha,
    dry,
    nodes: [],
    summary: {
      nodesRead: selected.length,
      nodesFolded: 0,
      nodesRefused: 0,
      sectionsFolded: 0,
      bytesStruck: 0,
    },
  };

  for (const node of selected) {
    const abs = path.join(root, node.path);
    const raw = await readFile(abs, 'utf8');
    const region = accountRegion(raw);
    if (region === null) continue;
    const body = region.lines.slice(region.bodyStart, region.bodyEnd);
    const folds = foldableSections(body);
    if (folds.length === 0) continue;

    // Nothing is struck that is not already in the history: the whole node is
    // refused where any one of its sections is not byte for byte in the
    // node's file at the ref.
    const at = await fileAtRef(root, remote, node.path);
    const refused = dateInversions(body);
    if (at === null) {
      for (const f of folds) {
        refused.push({ heading: f.heading, reason: `no ${node.path} at ${remote}` });
      }
    } else {
      for (const f of folds) {
        const text = body.slice(f.startLine, f.endLine).join('\n');
        if (!at.includes(text)) {
          refused.push({
            heading: f.heading,
            reason: `text is not byte-for-byte in ${node.path} at ${remote}`,
          });
        }
      }
    }

    const bytesBefore = Buffer.byteLength(raw, 'utf8');
    if (refused.length > 0) {
      report.summary.nodesRefused += 1;
      report.nodes.push({
        id: node.id,
        path: node.path,
        folded: [],
        refused,
        bytesBefore,
        bytesAfter: bytesBefore,
      });
      continue;
    }

    const next = rewrite(raw, folds, sha);
    const bytesAfter = Buffer.byteLength(next, 'utf8');
    if (!dry) await writeFile(abs, next, 'utf8');

    report.summary.nodesFolded += 1;
    report.summary.sectionsFolded += folds.length;
    report.summary.bytesStruck += bytesBefore - bytesAfter;
    report.nodes.push({
      id: node.id,
      path: node.path,
      folded: folds.map((f) => ({
        heading: f.heading,
        kind: 'account',
        date: headingDate(f.heading),
        sha,
      })),
      refused: [],
      bytesBefore,
      bytesAfter,
    });
  }

  return report;
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

const USAGE = 'usage: node accumulate.mjs <graphDir> [--nodes <id,...>] [--dry]'
  + ' [--remote <ref>] [--report <file>]';

/** @param {string[]} argv */
export function parseArgs(argv) {
  const out = { graphDir: null, nodes: null, dry: false, remote: DEFAULT_REMOTE, report: null };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--absorb') {
      throw new Error(
        'absorption is not this instrument: a fold is a deletion the history undoes and'
        + ' a rewrite is not, so absorption never runs unattended'
        + ' (commons.systems/disposition-graph/unconfirmed-accumulation).',
      );
    }
    if (a === '--dry') { out.dry = true; continue; }
    if (a === '--nodes' || a === '--remote' || a === '--report') {
      const v = argv[i + 1];
      if (v === undefined || v.startsWith('--')) throw new Error(`${a} needs a value\n${USAGE}`);
      i += 1;
      if (a === '--nodes') out.nodes = v.split(',').map((s) => s.trim()).filter(Boolean);
      else if (a === '--remote') out.remote = v;
      else out.report = v;
      continue;
    }
    if (a.startsWith('--')) {
      // The fold takes no per-section selection flag, by the accumulation's
      // own condition: it runs by an instrument and never at a session's
      // choosing.
      throw new Error(`unknown flag ${a}\n${USAGE}`);
    }
    if (out.graphDir !== null) throw new Error(`unexpected argument ${a}\n${USAGE}`);
    out.graphDir = a;
  }
  if (out.graphDir === null) throw new Error(USAGE);
  return out;
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isMain) {
  try {
    const args = parseArgs(process.argv.slice(2));
    const report = await accumulate(args.graphDir, {
      nodes: args.nodes,
      dry: args.dry,
      remote: args.remote,
    });
    if (args.report !== null) {
      await writeFile(path.resolve(args.report), `${JSON.stringify(report, null, 2)}\n`, 'utf8');
    }
    for (const n of report.nodes) {
      for (const f of n.folded) console.log(`${args.dry ? 'would fold' : 'folded'}: ${n.id}: ${f.heading}, at ${f.sha}`);
      for (const r of n.refused) console.error(`refused: ${n.id}: ${r.heading}: ${r.reason}`);
    }
    const s = report.summary;
    console.log(
      `${args.dry ? 'dry: ' : ''}${s.nodesFolded} nodes, ${s.sectionsFolded} sections,`
      + ` ${s.bytesStruck} bytes${args.dry ? ' would be' : ''} folded at ${report.commit};`
      + ` ${s.nodesRefused} nodes refused; ${s.nodesRead} read`,
    );
    process.exitCode = s.nodesRefused > 0 ? 1 : 0;
  } catch (err) {
    console.error(err.message);
    process.exitCode = 1;
  }
}

export { MANIFEST_HEADING, isReadingHeading };
