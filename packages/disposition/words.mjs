#!/usr/bin/env node
// packages/disposition/words.mjs
//
// Instrument of commons.systems/disposition-graph/quotes, option
// `words-in-a-ledger-on-the-ref`: the author's words are kept once, in a
// ledger on the `disposition` ref beside the node files, at
// `disposition/words/<YYYY-MM-DD>.md`, one file per date. Each entry is
// addressed `words/<date>/<n>` with `n` its ordinal within the date,
// starting at 1; entries are appended and never inserted or reordered.
// Options on nodes reference entries in frontmatter lists `supports:` and
// `diverges:` (values like `words/2026-09-07/3`); this module parses the
// ledger, resolves those references, and reports which entries no option
// references.
//
// A correction to an entry's text is a landed edit, so a reference is
// pinned to the entry's own sha (a plain sha1 over the entry's exact
// source bytes, from its `## <n>` heading to the end of its blockquote) --
// unlike `derive.mjs`'s `blobSha1`, this is a substring of a file and not a
// file of its own, so it carries no git blob framing.
import { createHash } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const HEADING_RE = /^##\s+(\d+)\s*$/;
const REFERENCE_RE = /^words\/\d{4}-\d{2}-\d{2}\/\d+$/;

function entrySha(sourceLines) {
  return createHash('sha1').update(sourceLines.join('\n'), 'utf8').digest('hex');
}

/**
 * Parse one ledger file's text (the content of
 * `disposition/words/<date>.md`) into its entries, in file order.
 *
 * The file may open with nothing or a comment line starting `<!--`; that
 * line carries no entry and is skipped by virtue of never matching
 * `## <n>`. Each entry is a `## <n>` heading, a context, and a blockquote,
 * in that order, separated from its neighbours by blank lines.
 *
 * The context is every consecutive non-blank line before the blockquote,
 * joined with a single space. It reads as one sentence and is rendered
 * inline everywhere the record shows it, so a context hand-wrapped to the
 * prose width is the same context as one written on a single line -- the
 * wrapping is an artifact of writing the file and carries no meaning. The
 * entry's `sha` is still taken over the source bytes as they stand, so
 * rewrapping a landed context is an edit that moves the pin, which is the
 * rule this module already states for a correction. `formatEntry` writes a
 * context back on one line, so re-formatting a hand-wrapped entry is such
 * an edit and not a round trip; nothing in the record re-formats a landed
 * entry, and the round trip holds for every entry `formatEntry` produced.
 *
 * Throws on an ordinal gap (`n` must run 1, 2, 3, ... in file order with no
 * gaps or repeats), a missing context line, a missing blockquote, or a
 * `date` not matching `/^\d{4}-\d{2}-\d{2}$/`.
 *
 * @param {string} text
 * @param {string} date
 * @returns {Array<{address: string, date: string, n: number, context: string, text: string, sha: string}>}
 */
export function parseWordsFile(text, date) {
  if (!DATE_RE.test(String(date))) {
    throw new Error(`words: invalid ledger date '${date}'`);
  }
  const lines = String(text).split('\n');
  const headings = [];
  for (let i = 0; i < lines.length; i += 1) {
    const m = lines[i].match(HEADING_RE);
    if (m) headings.push({ n: Number(m[1]), index: i });
  }

  const entries = [];
  let expected = 1;
  for (let h = 0; h < headings.length; h += 1) {
    const { n, index: headingIndex } = headings[h];
    const sectionEnd = h + 1 < headings.length ? headings[h + 1].index : lines.length;
    if (n !== expected) {
      throw new Error(`words/${date}: entry ordinal gap at '## ${n}' (expected '## ${expected}')`);
    }
    expected += 1;

    let i = headingIndex + 1;
    while (i < sectionEnd && lines[i].trim() === '') i += 1;
    const contextStart = i;
    while (i < sectionEnd && lines[i].trim() !== '' && !lines[i].startsWith('>')) i += 1;
    if (i === contextStart) {
      throw new Error(`words/${date}: '## ${n}' is missing its context line`);
    }
    const context = lines.slice(contextStart, i).map((l) => l.trim()).join(' ');
    while (i < sectionEnd && lines[i].trim() === '') i += 1;

    const quoteStart = i;
    while (i < sectionEnd && lines[i].startsWith('>')) i += 1;
    const quoteEnd = i;
    if (quoteEnd === quoteStart) {
      throw new Error(`words/${date}: '## ${n}' is missing its blockquote`);
    }
    const quoteLines = lines.slice(quoteStart, quoteEnd);
    const entryText = quoteLines.map((l) => l.replace(/^>\s?/, '')).join('\n');
    const sha = entrySha(lines.slice(headingIndex, quoteEnd));

    entries.push({
      address: `words/${date}/${n}`,
      date,
      n,
      context,
      text: entryText,
      sha,
    });
  }
  return entries;
}

/**
 * Every entry of every `<rootDir>/words/*.md` ledger file, keyed by
 * address. Files are read in name order; a missing `words/` directory
 * yields an empty Map rather than an error, since a ledger that has never
 * been written is not a defect.
 *
 * @param {string} rootDir
 * @returns {Promise<Map<string, {address: string, date: string, n: number, context: string, text: string, sha: string}>>}
 */
export async function readWords(rootDir) {
  const dir = path.join(rootDir, 'words');
  let filenames;
  try {
    filenames = await readdir(dir);
  } catch (err) {
    if (err && err.code === 'ENOENT') return new Map();
    throw err;
  }

  const words = new Map();
  for (const filename of filenames.filter((f) => f.endsWith('.md')).sort()) {
    const date = filename.slice(0, -'.md'.length);
    const text = await readFile(path.join(dir, filename), 'utf8');
    for (const entry of parseWordsFile(text, date)) {
      words.set(entry.address, entry);
    }
  }
  return words;
}

/**
 * The entry a `words/<date>/<n>` reference names. Throws
 * `unresolved words reference '<ref>'` when no entry carries that address,
 * and `malformed words reference '<ref>'` when `ref` does not even have the
 * shape of one.
 *
 * @param {Map<string, object>} words
 * @param {string} ref
 * @returns {{address: string, date: string, n: number, context: string, text: string, sha: string}}
 */
export function resolveReference(words, ref) {
  if (!REFERENCE_RE.test(String(ref))) {
    throw new Error(`malformed words reference '${ref}'`);
  }
  const entry = words.get(ref);
  if (!entry) {
    throw new Error(`unresolved words reference '${ref}'`);
  }
  return entry;
}

/**
 * Every entry of `words` that no reference in `references` names, in
 * address order (by date, then by ordinal).
 *
 * @param {Map<string, object>} words
 * @param {Iterable<string>} references
 * @returns {Array<object>}
 */
export function unreferencedEntries(words, references) {
  const referenced = new Set(references);
  const out = [];
  for (const entry of words.values()) {
    if (!referenced.has(entry.address)) out.push(entry);
  }
  out.sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? -1 : 1;
    return a.n - b.n;
  });
  return out;
}

/**
 * Render one entry back to the ledger's file shape: the `## <n>` heading,
 * a blank line, the context line, a blank line, and the blockquote. Round
 * trips with `parseWordsFile`: `parseWordsFile(formatEntry(e), e.date)[0]`
 * has the same `sha` as `e`.
 *
 * @param {{n: number, context: string, text: string}} entry
 * @returns {string}
 */
export function formatEntry(entry) {
  const quoteLines = String(entry.text).split('\n').map((l) => (l === '' ? '>' : `> ${l}`));
  return `## ${entry.n}\n\n${String(entry.context).trim()}\n\n${quoteLines.join('\n')}`;
}

/**
 * Append one new entry to a ledger file's content, numbering it one past
 * the highest `## <n>` heading already in `text` (or `1` for an empty or
 * new file).
 *
 * @param {string} text
 * @param {string} context
 * @param {string} quotation
 * @returns {{text: string, n: number}}
 */
export function appendEntry(text, context, quotation) {
  const raw = String(text || '');
  let maxN = 0;
  for (const line of raw.split('\n')) {
    const m = line.match(HEADING_RE);
    if (m) maxN = Math.max(maxN, Number(m[1]));
  }
  const n = maxN + 1;
  const entrySource = formatEntry({ n, context, text: String(quotation).replace(/\n+$/, '') });
  const trimmed = raw.replace(/\s+$/, '');
  const newText = trimmed === '' ? `${entrySource}\n` : `${trimmed}\n\n${entrySource}\n`;
  return { text: newText, n };
}
