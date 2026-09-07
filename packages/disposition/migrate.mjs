#!/usr/bin/env node
// packages/disposition/migrate.mjs
//
// CLI: node packages/disposition/migrate.mjs <graphDir> [--dry]
//        [--report <file>] [--commit <sha>] [--history <repoDir>]
//        [--no-derived-content]
//
// Migrates a disposition graph from the legacy encoding to the content
// encoding of 2026-09-07 (commons.systems/disposition-graph/dialogue, option
// `an-option-carries-its-content-its-words-and-its-case`), and writes the
// ledger of the author's words the quotes node keeps
// (commons.systems/disposition-graph/quotes, option
// `words-in-a-ledger-on-the-ref`).
//
// For each node still in the legacy encoding:
//
//   * every option of every per-node fact gains its `#### <option>`
//     subsection, carrying, in the order the dialogue node fixes: its
//     sentence, `**AI support.**`, `**AI divergence.**`, and -- on the answer
//     fact -- its content, whole as a fenced ```markdown block or as a named
//     change (`From: <option>` and a fenced ```diff block) against another
//     option's resolved content, whichever is fewer bytes;
//   * the `## Answer` becomes the content of the option `stands` named, the
//     `## Recommendation` fence the content of the option the answer fact
//     recommends, and the `## Rationale` the `**AI support.**` of the option
//     it argues for (the node's, the standing option's; the fence's, the
//     recommended option's);
//   * every `## Disposition` entry becomes an entry of the ledger under
//     `<graphDir>/words/<date>.md`, one entry per distinct quotation across
//     the whole graph, referenced from the options it bears on as `supports`;
//   * `## Answer`, `## Rationale`, `## Recommendation` and `## Disposition`
//     leave the file and `stands` leaves the answer fact, so that the file is
//     its frontmatter, its `## Facts` and its `## Account`;
//   * a manifest line is appended under `## Account`, in a section
//     `### Migrated to the content encoding, <date>`, naming what was
//     absorbed where and the graph commit at which the legacy text stands.
//
// A node already in the content encoding is left alone, byte for byte, so a
// second run over a migrated graph writes nothing.
//
// Nothing here writes a node's argument: where the record wrote no support or
// no divergence for an option, the subsection says so in one sentence rather
// than inventing one.
import { execFileSync } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import YAML from 'yaml';

import { applyStrict, diffText } from './patch.mjs';
import {
  answerText,
  authorEntries,
  parseNode,
  parseOptionSubsection,
  readGraph,
  resolveOptionContent,
} from './read.mjs';
import { appendEntry, parseWordsFile, readWords } from './words.mjs';

const PER_NODE_FACTS = ['answer', 'persistence'];
const ANSWER_FACT = 'answer';

const OWED_SUPPORT = 'The record wrote no case for this option; its support is owed.';
const OWED_DIVERGENCE = 'The record wrote no case against this option; its divergence is owed.';

// ---------------------------------------------------------------------------
// small text helpers
// ---------------------------------------------------------------------------

/** Every content in this record ends in exactly one newline. */
function oneNewline(text) {
  return `${String(text).replace(/\n+$/, '')}\n`;
}

/**
 * Cut a `## Rationale` section out of a whole node text (a fence's content,
 * or the text `answerText` builds from a standing node), returning the text
 * without it and the rationale's own body. The content encoding carries no
 * `## Rationale`: its argument is the option's `**AI support.**`.
 */
export function removeRationale(nodeText) {
  const lines = String(nodeText).split('\n');
  const at = lines.findIndex((l) => /^##[ \t]+Rationale[ \t]*$/.test(l));
  if (at === -1) return { text: oneNewline(nodeText), rationale: null };
  let end = lines.length;
  for (let i = at + 1; i < lines.length; i += 1) {
    if (/^##[ \t]+\S/.test(lines[i])) { end = i; break; }
  }
  const rationale = lines.slice(at + 1, end).join('\n').trim();
  const kept = [...lines.slice(0, at), ...lines.slice(end)].join('\n');
  return { text: oneNewline(kept), rationale: rationale === '' ? null : rationale };
}

/**
 * The body of a whole content's `## Answer` section, and the same content
 * with that body replaced. Used to express an option whose own text the
 * record never wrote: the node as it stands, saying what this option's own
 * sentence says. Returns null where the base carries no `## Answer`.
 */
export function withAnswerBody(baseText, body) {
  const lines = String(baseText).split('\n');
  const at = lines.findIndex((l) => /^##[ \t]+Answer[ \t]*$/.test(l));
  if (at === -1) return null;
  return oneNewline([...lines.slice(0, at + 1), '', String(body).trim()].join('\n'));
}

/**
 * The first sentence of a text, keeping its own line breaks: the standing
 * option's sentence, which the legacy encoding never wrote because the
 * option's text was the `## Answer` itself.
 */
export function firstSentence(text) {
  const paragraph = String(text).trim().split(/\n[ \t]*\n/)[0].trim();
  const m = paragraph.match(/^[\s\S]*?[.!?](?=\s|$)/);
  return (m ? m[0] : paragraph).trim();
}

/**
 * Where a `For it` or an `Against it` marker opens a case in an option's
 * prose: at the start, at the start of a line, or after a sentence's end.
 * The record wrote its cases that way and nowhere else, so the split moves
 * text and never rewrites it.
 */
function findMarkers(prose) {
  const out = [];
  const re = /(For|Against) it\b[,:]/g;
  let m;
  while ((m = re.exec(prose)) !== null) {
    const before = prose.slice(0, m.index);
    const opens = m.index === 0
      || /\n[ \t]*$/.test(before)
      || /[.!?]["'’”)]?\s+$/.test(before);
    if (opens) out.push({ index: m.index, kind: m[1] === 'For' ? 'support' : 'divergence' });
  }
  return out;
}

/**
 * One option's legacy `#### ` prose, split into what it says the option
 * answers and the cases the record wrote for and against it. Nothing is
 * rewritten: the split is at the markers the record already carries, and a
 * prose with none is wholly the option's sentence.
 */
export function splitProse(prose) {
  const text = String(prose || '').trim();
  if (text === '') return { sentence: '', support: '', divergence: '' };
  const marks = findMarkers(text);
  if (marks.length === 0) return { sentence: text, support: '', divergence: '' };
  const sentence = text.slice(0, marks[0].index).trim();
  // A prose that opens on its own marker has no sentence left to state what
  // the option answers, so it is left whole rather than split into nothing.
  if (sentence === '') return { sentence: text, support: '', divergence: '' };
  const parts = { support: [], divergence: [] };
  marks.forEach((mark, i) => {
    const end = i + 1 < marks.length ? marks[i + 1].index : text.length;
    parts[mark.kind].push(text.slice(mark.index, end).trim());
  });
  return {
    sentence,
    support: parts.support.join('\n\n'),
    divergence: parts.divergence.join('\n\n'),
  };
}

// ---------------------------------------------------------------------------
// the frontmatter edit: `stands` out, `supports` in
// ---------------------------------------------------------------------------

/**
 * Walk a node's raw frontmatter text and locate, by indentation, the line
 * ranges of each fact and of each of its options. Returns null where there
 * is no top-level `facts:` key, which is a node with no facts at all.
 *
 * @param {string} fmText
 * @returns {{facts: Array<{name: string|null, start: number, end: number,
 *   keyIndent: number, options: Array<{name: string|null, start: number,
 *   end: number, keyIndent: number}>}>}|null}
 */
export function locateFacts(fmText) {
  const lines = String(fmText).split('\n');
  const factsAt = lines.findIndex((l) => /^facts:[ \t]*$/.test(l));
  if (factsAt === -1) return null;
  let blockEnd = lines.length;
  for (let i = factsAt + 1; i < lines.length; i += 1) {
    if (lines[i].trim() !== '' && /^\S/.test(lines[i])) { blockEnd = i; break; }
  }

  const indentOf = (line) => line.match(/^[ \t]*/)[0].length;
  const itemsIn = (from, to) => {
    let least = null;
    for (let i = from; i < to; i += 1) {
      if (lines[i].trim() === '' || !/^[ \t]*-[ \t]/.test(lines[i])) continue;
      const ind = indentOf(lines[i]);
      if (least === null || ind < least) least = ind;
    }
    if (least === null) return [];
    const starts = [];
    for (let i = from; i < to; i += 1) {
      if (lines[i].trim() === '') continue;
      if (/^[ \t]*-[ \t]/.test(lines[i]) && indentOf(lines[i]) === least) starts.push(i);
    }
    return starts.map((start, k) => ({
      start,
      end: k + 1 < starts.length ? starts[k + 1] : to,
      keyIndent: least + 2,
    }));
  };
  const nameIn = (from, to, keyIndent) => {
    const re = new RegExp(`^(?:[ \\t]{${keyIndent - 2}}-[ \\t]|[ \\t]{${keyIndent}})name:[ \\t]*(.+?)[ \\t]*$`);
    for (let i = from; i < to; i += 1) {
      const m = lines[i].match(re);
      if (m) return m[1].replace(/^["']|["']$/g, '');
    }
    return null;
  };

  const facts = itemsIn(factsAt + 1, blockEnd).map((fact) => {
    const optionsAt = (() => {
      for (let i = fact.start; i < fact.end; i += 1) {
        if (new RegExp(`^[ \\t]{${fact.keyIndent}}options:[ \\t]*$`).test(lines[i])) return i;
      }
      return -1;
    })();
    let optionsEnd = fact.end;
    if (optionsAt !== -1) {
      for (let i = optionsAt + 1; i < fact.end; i += 1) {
        if (lines[i].trim() !== '' && indentOf(lines[i]) <= fact.keyIndent) { optionsEnd = i; break; }
      }
    }
    const options = optionsAt === -1 ? [] : itemsIn(optionsAt + 1, optionsEnd).map((o) => ({
      ...o,
      name: nameIn(o.start, o.end, o.keyIndent),
    }));
    return { ...fact, name: nameIn(fact.start, fact.end, fact.keyIndent), options };
  });
  return { facts };
}

/**
 * The node's frontmatter with `stands` struck from every fact and a
 * `supports:` list written onto every option the ledger's entries reach.
 * A line edit, so that every other byte of the author's own YAML -- its
 * order, its quoting, its wrapping -- survives the migration untouched.
 *
 * @param {string} fmText
 * @param {Map<string, string[]>} supports - `<fact>\n<option>` to addresses.
 * @returns {{text: string, standsRemoved: number, supportsWritten: number}}
 */
export function editFrontmatter(fmText, supports) {
  const located = locateFacts(fmText);
  if (located === null) return { text: fmText, standsRemoved: 0, supportsWritten: 0 };
  const lines = String(fmText).split('\n');
  /** @type {Map<number, {drop?: boolean, after?: string[]}>} */
  const edits = new Map();
  let standsRemoved = 0;
  let supportsWritten = 0;

  for (const fact of located.facts) {
    for (let i = fact.start; i < fact.end; i += 1) {
      if (new RegExp(`^[ \\t]{${fact.keyIndent}}stands:[ \\t]`).test(lines[i])) {
        edits.set(i, { drop: true });
        standsRemoved += 1;
      }
    }
    for (const option of fact.options) {
      const refs = supports.get(`${fact.name}\n${option.name}`) ?? [];
      if (refs.length === 0) continue;
      const pad = ' '.repeat(option.keyIndent);
      const block = [`${pad}supports:`, ...refs.map((r) => `${pad}  - ${r}`)];
      // At the end of the option's own lines, past any nested block (a
      // `ruling:`, say), and before the next option or the next fact.
      let last = option.end - 1;
      while (last > option.start && lines[last].trim() === '') last -= 1;
      edits.set(last, { ...(edits.get(last) ?? {}), after: block });
      supportsWritten += 1;
    }
  }

  const out = [];
  lines.forEach((line, i) => {
    const edit = edits.get(i);
    if (!edit || !edit.drop) out.push(line);
    if (edit && edit.after) out.push(...edit.after);
  });
  return { text: out.join('\n'), standsRemoved, supportsWritten };
}

// ---------------------------------------------------------------------------
// re-pinning the dialogue's hashes for the new encoding
// ---------------------------------------------------------------------------

function indentOf(line) {
  return line.match(/^[ \t]*/)[0].length;
}

/** A hash literal, quoted where an all-digit string would otherwise parse as
 * a YAML number rather than the string it is. */
function yamlHashLiteral(hash) {
  return /^[0-9]+$/.test(hash) ? `"${hash}"` : hash;
}

function replaceOfLine(line, newHash) {
  const m = line.match(/^([ \t]*of:[ \t]*)(.*)$/);
  const prefix = m ? m[1] : `${line.match(/^[ \t]*/)[0]}of: `;
  return `${prefix}${yamlHashLiteral(newHash)}`;
}

/**
 * Locate a node's top-level `review:` block in frontmatter text: the line
 * carrying its own `of:` pin and, where a nested `survey:` block sits beside
 * it, the line carrying the survey's own `of:` pin. Null where the
 * frontmatter carries no `review:` key.
 *
 * @param {string} fmText
 * @returns {{start: number, end: number, ofAt: number|null,
 *   surveyOfAt: number|null}|null}
 */
export function locateReview(fmText) {
  const lines = String(fmText).split('\n');
  const at = lines.findIndex((l) => /^review:[ \t]*$/.test(l));
  if (at === -1) return null;
  let end = lines.length;
  for (let i = at + 1; i < lines.length; i += 1) {
    if (lines[i].trim() !== '' && /^\S/.test(lines[i])) { end = i; break; }
  }
  let childIndent = null;
  for (let i = at + 1; i < end; i += 1) {
    if (lines[i].trim() === '') continue;
    const ind = indentOf(lines[i]);
    if (childIndent === null || ind < childIndent) childIndent = ind;
  }
  let ofAt = null;
  let surveyAt = -1;
  if (childIndent !== null) {
    for (let i = at + 1; i < end; i += 1) {
      if (indentOf(lines[i]) !== childIndent) continue;
      if (/^[ \t]*of:/.test(lines[i])) ofAt = i;
      if (/^[ \t]*survey:[ \t]*$/.test(lines[i])) surveyAt = i;
    }
  }
  let surveyOfAt = null;
  if (surveyAt !== -1) {
    let surveyEnd = end;
    for (let i = surveyAt + 1; i < end; i += 1) {
      if (lines[i].trim() !== '' && indentOf(lines[i]) <= childIndent) { surveyEnd = i; break; }
    }
    let surveyChildIndent = null;
    for (let i = surveyAt + 1; i < surveyEnd; i += 1) {
      if (lines[i].trim() === '') continue;
      const ind = indentOf(lines[i]);
      if (surveyChildIndent === null || ind < surveyChildIndent) surveyChildIndent = ind;
    }
    if (surveyChildIndent !== null) {
      for (let i = surveyAt + 1; i < surveyEnd; i += 1) {
        if (indentOf(lines[i]) === surveyChildIndent && /^[ \t]*of:/.test(lines[i])) surveyOfAt = i;
      }
    }
  }
  return { start: at, end, ofAt, surveyOfAt };
}

/**
 * Rewrite the `of:` pins the migration re-computes for the content
 * encoding -- the draft review's, the survey's, and any per-fact ruling's --
 * each only where the caller asks for it (`repin.review`, `repin.survey`,
 * each a new hash to write; `repin.rulings`, a `<fact>\n<option>` to new
 * hash map). A line edit, like `editFrontmatter`: everything else in the
 * frontmatter, including a pin the caller leaves out, survives untouched.
 *
 * @param {string} fmText
 * @param {{review?: string|null, survey?: string|null,
 *   rulings?: Map<string, string>}} [repin]
 * @returns {{text: string, review: boolean, survey: boolean, rulings: number}}
 */
export function repinDialogue(fmText, repin = {}) {
  const lines = String(fmText).split('\n');
  let review = false;
  let survey = false;
  let rulings = 0;

  if (repin.review || repin.survey) {
    const located = locateReview(fmText);
    if (located !== null) {
      if (repin.review && located.ofAt !== null) {
        lines[located.ofAt] = replaceOfLine(lines[located.ofAt], repin.review);
        review = true;
      }
      if (repin.survey && located.surveyOfAt !== null) {
        lines[located.surveyOfAt] = replaceOfLine(lines[located.surveyOfAt], repin.survey);
        survey = true;
      }
    }
  }

  if (repin.rulings && repin.rulings.size > 0) {
    const located = locateFacts(fmText);
    if (located !== null) {
      for (const fact of located.facts) {
        for (const option of fact.options) {
          const newHash = repin.rulings.get(`${fact.name}\n${option.name}`);
          if (newHash === undefined) continue;
          let rulingAt = -1;
          for (let i = option.start; i < option.end; i += 1) {
            if (new RegExp(`^[ \\t]{${option.keyIndent}}ruling:[ \\t]*$`).test(lines[i])) { rulingAt = i; break; }
          }
          if (rulingAt === -1) continue;
          let rulingEnd = option.end;
          for (let i = rulingAt + 1; i < option.end; i += 1) {
            if (lines[i].trim() !== '' && indentOf(lines[i]) <= option.keyIndent) { rulingEnd = i; break; }
          }
          for (let i = rulingAt + 1; i < rulingEnd; i += 1) {
            if (indentOf(lines[i]) === option.keyIndent + 2 && /^[ \t]*of:/.test(lines[i])) {
              lines[i] = replaceOfLine(lines[i], newHash);
              rulings += 1;
              break;
            }
          }
        }
      }
    }
  }

  return { text: lines.join('\n'), review, survey, rulings };
}

/**
 * One sentence naming a pin's fate: re-computed against the migrated text
 * where it was not already stale, or left exactly as it stood where it was.
 * Null where there was no such pin to say anything about.
 *
 * @param {string} label - e.g. "The draft reading's".
 * @param {{status: 'repinned'|'stale', old: string, new?: string}|null} decision
 * @returns {string|null}
 */
function pinSentence(label, decision) {
  if (decision === null) return null;
  if (decision.status === 'repinned') {
    return `${label} pin \`${decision.old}\` is re-computed for the encoding as \`${decision.new}\`; nothing it read changed.`;
  }
  return `${label} pin \`${decision.old}\` was already past the recommendation and is left as it stood.`;
}

// ---------------------------------------------------------------------------
// the ledger
// ---------------------------------------------------------------------------

/**
 * One `## Disposition` section's entries, as the ledger would hold them: the
 * quotation the entry carries, and the prose that introduced it, collapsed to
 * the ledger's one line of context.
 *
 * @param {string} disposition
 * @returns {Array<{date: string|null, quotation: string, context: string}>}
 */
export function dispositionEntries(disposition) {
  const out = [];
  for (const entry of authorEntries(disposition)) {
    const lines = entry.blocks.join('\n\n').split('\n');
    const quoted = [];
    const prose = [];
    let run = null;
    for (const line of lines) {
      if (/^>/.test(line)) {
        if (run === null) { run = []; quoted.push(run); }
        run.push(line.replace(/^>[ \t]?/, ''));
      } else {
        run = null;
        if (line.trim() !== '') prose.push(line.trim());
      }
    }
    const quotation = quoted.map((r) => r.join('\n').replace(/\n+$/, '')).join('\n\n').trim();
    if (quotation === '') continue;
    out.push({
      date: entry.date,
      quotation,
      context: prose.join(' ').replace(/\s+/g, ' ').trim(),
    });
  }
  return out;
}

/**
 * The ledger's one line of context: who said it, when, what they were
 * answering as the node's own prose introduced it, and the node it was said
 * on, which is where a reader goes for the sitting it belongs to.
 */
export function ledgerContext(nodeId, date, intro) {
  const rest = String(intro || '')
    .replace(/^The author,?\s*\d{4}-\d{2}-\d{2}\s*[,:;-]?\s*/i, '')
    .replace(/[\s,;:.]+$/, '')
    .trim();
  return rest === ''
    ? `The author, ${date}, said on ${nodeId}.`
    : `The author, ${date}, ${rest}; said on ${nodeId}.`;
}

/**
 * Every distinct quotation in the graph, addressed, with the nodes that
 * carried it. One entry per byte-identical text, so a quotation eight nodes
 * copied is one entry eight options reference.
 *
 * `existing` is the ledger already on the ref, which the migration never
 * rewrites: an entry whose text is already there keeps the address it has,
 * and a new one is numbered past the highest ordinal its date carries. That
 * is what makes a second run over a partly-migrated graph safe -- the ledger
 * is append-only, and a re-run must not renumber a reference already written
 * onto an option.
 *
 * @param {object[]} nodes - in id order.
 * @param {Map<string, object>} [existing] - as `readWords` returns it.
 * @returns {{entries: Array<object>, byNode: Map<string, Array<object>>,
 *   undated: Array<object>}}
 */
export function buildLedger(nodes, existing = new Map()) {
  const byText = new Map();
  const byNode = new Map();
  const undated = [];
  const counters = new Map();
  for (const entry of existing.values()) {
    counters.set(entry.date, Math.max(counters.get(entry.date) ?? 0, entry.n));
    if (!byText.has(entry.text)) {
      byText.set(entry.text, {
        date: entry.date,
        n: entry.n,
        address: entry.address,
        quotation: entry.text,
        context: entry.context,
        nodes: [],
        onTheRef: true,
      });
    }
  }
  for (const node of nodes) {
    if (!node.disposition) continue;
    const here = [];
    for (const found of dispositionEntries(node.disposition)) {
      if (found.date === null) {
        undated.push({ node: node.id, quotation: found.quotation });
        continue;
      }
      let entry = byText.get(found.quotation);
      if (entry === undefined) {
        const n = (counters.get(found.date) ?? 0) + 1;
        counters.set(found.date, n);
        entry = {
          date: found.date,
          n,
          address: `words/${found.date}/${n}`,
          quotation: found.quotation,
          context: ledgerContext(node.id, found.date, found.context),
          nodes: [],
          onTheRef: false,
        };
        byText.set(found.quotation, entry);
      }
      if (!entry.nodes.includes(node.id)) entry.nodes.push(node.id);
      here.push(entry);
    }
    if (here.length > 0) byNode.set(node.id, here);
  }
  const entries = [...byText.values()]
    .filter((e) => !e.onTheRef || e.nodes.length > 0)
    .sort((a, b) => (a.date === b.date ? a.n - b.n : (a.date < b.date ? -1 : 1)));
  return { entries, byNode, undated };
}

/**
 * The ledger files this run must write: one per date carrying a quotation the
 * ledger does not already hold, each the file as it stands with the new
 * entries appended. A date whose entries are all already on the ref is not
 * written at all, so a re-run rewrites nothing.
 *
 * @param {Array<object>} entries - as `buildLedger` returns them.
 * @param {Map<string, string>} onDisk - filename to the file's current text.
 * @returns {Map<string, string>}
 */
export function ledgerFiles(entries, onDisk = new Map()) {
  const files = new Map();
  const touched = new Set();
  for (const entry of entries) {
    const filename = `${entry.date}.md`;
    if (entry.onTheRef) continue;
    const current = files.get(filename) ?? onDisk.get(filename) ?? '';
    const { text, n } = appendEntry(current, entry.context, entry.quotation);
    if (n !== entry.n) {
      throw new Error(`migrate: ledger ${entry.address} would be written as entry ${n}`);
    }
    files.set(filename, text);
    touched.add(filename);
  }
  // Parsing each file back is the cheapest guarantee that what was written
  // is what the reader will read.
  for (const [filename, text] of files) {
    parseWordsFile(text, filename.slice(0, -'.md'.length));
  }
  return new Map([...files].filter(([filename]) => touched.has(filename)));
}

// ---------------------------------------------------------------------------
// the history, for an option that was once recommended
// ---------------------------------------------------------------------------

/**
 * Every blob each node file has held on the ref, newest first, with its
 * bytes. Read-only git: `log` and `cat-file`.
 *
 * @param {string} repoDir
 * @returns {Map<string, Array<{commit: string, text: string}>>}
 */
export function loadHistory(repoDir) {
  const raw = execFileSync(
    'git',
    ['-C', repoDir, 'log', '--format=C %H', '--raw', '--no-abbrev', '--no-renames'],
    { maxBuffer: 1 << 30, encoding: 'utf8' },
  );
  const byPath = new Map();
  const blobs = new Set();
  let commit = null;
  for (const line of raw.split('\n')) {
    if (line.startsWith('C ')) { commit = line.slice(2).trim(); continue; }
    const m = line.match(/^:\S+ \S+ \S+ (\S+) (\S+)\t(.+)$/);
    if (m === null) continue;
    const [, blob, status, filePath] = m;
    if (status === 'D' || /^0+$/.test(blob)) continue;
    if (!filePath.endsWith('.md')) continue;
    if (!byPath.has(filePath)) byPath.set(filePath, []);
    byPath.get(filePath).push({ commit, blob });
    blobs.add(blob);
  }
  const contents = new Map();
  const list = [...blobs];
  for (let i = 0; i < list.length; i += 500) {
    const batch = list.slice(i, i + 500);
    const out = execFileSync('git', ['-C', repoDir, 'cat-file', '--batch'], {
      input: `${batch.join('\n')}\n`,
      maxBuffer: 1 << 30,
    });
    let off = 0;
    while (off < out.length) {
      const nl = out.indexOf(10, off);
      if (nl === -1) break;
      const [sha, , sizeStr] = out.toString('utf8', off, nl).split(' ');
      const size = Number(sizeStr);
      if (!Number.isFinite(size)) break;
      contents.set(sha, out.toString('utf8', nl + 1, nl + 1 + size));
      off = nl + 1 + size + 1;
    }
  }
  const out = new Map();
  for (const [filePath, history] of byPath) {
    out.set(filePath, history
      .map((h) => ({ commit: h.commit, text: contents.get(h.blob) }))
      .filter((h) => typeof h.text === 'string'));
  }
  return out;
}

/** The `## Recommendation` fence, or the `## Answer` body, of a file's text. */
function historicalTexts(text) {
  const nl = String(text).replace(/\r\n/g, '\n');
  const lines = nl.split('\n');
  let fmEnd = -1;
  if (lines[0] === '---') {
    for (let i = 1; i < lines.length; i += 1) if (lines[i] === '---') { fmEnd = i; break; }
  }
  if (fmEnd === -1) return null;
  let fm;
  try {
    fm = YAML.parse(lines.slice(1, fmEnd).join('\n'));
  } catch {
    return null;
  }
  if (fm === null || typeof fm !== 'object') return null;
  const body = lines.slice(fmEnd + 1);
  const section = (name) => {
    const at = body.findIndex((l) => new RegExp(`^##[ \\t]+${name}[ \\t]*$`).test(l));
    if (at === -1) return null;
    let end = body.length;
    for (let i = at + 1; i < body.length; i += 1) if (/^##[ \t]+\S/.test(body[i])) { end = i; break; }
    return body.slice(at + 1, end).join('\n').trim();
  };
  const rec = section('Recommendation');
  let fence = null;
  if (rec !== null) {
    const rl = rec.split('\n');
    if (rl[0].trim() === '```markdown') {
      const close = rl.findIndex((l, i) => i > 0 && l.trim() === '```');
      if (close !== -1) fence = oneNewline(rl.slice(1, close).join('\n'));
    }
  }
  return { fm, fence, answer: section('Answer') };
}

// ---------------------------------------------------------------------------
// one node
// ---------------------------------------------------------------------------

function fenceBlock(language, text) {
  return ['```' + language, oneNewline(text).replace(/\n$/, ''), '```'].join('\n');
}

/** The option's content, rendered for its subsection. */
function renderContent(content) {
  if (content.form === 'whole') return ['**Content.**', '', fenceBlock('markdown', content.text)].join('\n');
  return [
    '**Content.**',
    '',
    `From: ${content.from}`,
    '',
    fenceBlock('diff', content.diff),
  ].join('\n');
}

/**
 * Whole, or a named change against `base`, whichever is fewer bytes. The
 * change is checked by replaying it: a hunk that does not reproduce the
 * target exactly is never written.
 */
function chooseForm(target, baseName, baseText, stats) {
  const whole = { form: 'whole', text: target };
  if (baseName === null || baseText === null || baseText === target) {
    if (baseText === target && baseName !== null) {
      // Identical to its base: the empty change would say the two options
      // answer the same, which is a claim the record never made.
      stats.wholeBecauseIdentical += 1;
    }
    stats.whole += 1;
    return whole;
  }
  const diff = diffText(baseText, target);
  if (diff === '') { stats.whole += 1; return whole; }
  if (applyStrict(baseText, diff) !== target) {
    throw new Error(`migrate: a named change against '${baseName}' does not replay to its target`);
  }
  const change = { form: 'change', from: baseName, diff };
  const wholeBytes = Buffer.byteLength(renderContent(whole));
  const changeBytes = Buffer.byteLength(renderContent(change));
  if (changeBytes < wholeBytes) { stats.change += 1; return change; }
  stats.whole += 1;
  return whole;
}

/**
 * Whether an option's own recorded content still says what it said: a whole
 * that is the target, or a named change that replays onto what its base now
 * carries and lands on the target exactly.
 */
function keeps(content, target, targets) {
  if (content.form === 'whole') return content.text === target;
  const base = targets.get(`${ANSWER_FACT}\n${content.from}`) ?? null;
  if (base === null) return false;
  try {
    return applyStrict(base, content.diff) === target;
  } catch {
    return false;
  }
}

/**
 * The migrated text of one legacy node, and what the migration did to it.
 *
 * @param {object} node - as `readGraph` returns it.
 * @param {object} ctx - `{date, commit, ledger, history, derive, stats}`.
 * @returns {{text: string, note: object}}
 */
export function migrateNode(node, ctx) {
  const stats = ctx.stats;
  const answerFact = (node.facts ?? []).find((f) => f.name === ANSWER_FACT) ?? null;
  const stands = answerFact === null ? null : answerFact.stands;
  const recommends = answerFact === null ? null : answerFact.recommends;

  // The two texts the legacy encoding held: what stands, and what is
  // recommended. Both come back through `answerText`, so the migration
  // reproduces the reader's own answer and never a second reading of it.
  let standingWhole = null;
  let standingRationale = null;
  if (node.answer !== null && node.answer !== undefined) {
    const cut = removeRationale(answerText({ ...node, fence: null }));
    standingWhole = cut.text;
    standingRationale = cut.rationale;
  }
  let fenceWhole = null;
  let fenceRationale = null;
  if (node.fence && typeof node.fence.raw === 'string') {
    const cut = removeRationale(oneNewline(node.fence.raw));
    fenceWhole = cut.text;
    fenceRationale = cut.rationale;
  }

  const note = {
    id: node.id,
    stands,
    recommends,
    contentWhole: 0,
    contentChange: 0,
    contentKept: 0,
    contentNone: [],
    contentRecovered: [],
    contentDerived: [],
    ledger: [],
    referencesByRule: 0,
    referencesByFallback: 0,
  };

  // A subsection already written in the content encoding is read with the
  // reader's own parser and not split at the legacy markers: parts of this
  // record were written in the new shape before the migration ran, and what
  // they already carry is the record's and not the migration's to restate.
  const shaped = new Map();
  const asRead = { id: node.id, facts: [] };
  for (const fact of node.facts ?? []) {
    if (!PER_NODE_FACTS.includes(fact.name)) continue;
    const options = [];
    for (const option of fact.options) {
      const prose = option.prose ?? '';
      const marked = /^\*\*AI (?:support|divergence)\.\*\*/m.test(prose)
        || /^\*\*Content\.\*\*/m.test(prose)
        || /^From:[ \t]*\S/m.test(prose);
      let content = null;
      if (marked) {
        const parsed = parseOptionSubsection(prose, `fact '${fact.name}' option '${option.name}'`, []);
        shaped.set(`${fact.name}\n${option.name}`, parsed);
        content = parsed.content;
      }
      // The legacy encoding held the standing and the recommended texts in
      // sections and not in the option's subsection, so those two options
      // carry their content here for the resolution below: without them a
      // named change written against one of them would resolve through a
      // base the file does not appear to have.
      if (content === null && fact.name === ANSWER_FACT) {
        if (option.name === stands && standingWhole !== null) content = { form: 'whole', text: standingWhole };
        else if (option.name === recommends && fenceWhole !== null) content = { form: 'whole', text: fenceWhole };
      }
      options.push({ name: option.name, content });
    }
    asRead.facts.push({ name: fact.name, options });
  }
  const asReadResolved = new Map();
  for (const fact of asRead.facts) {
    for (const option of fact.options) {
      if (option.content === null) continue;
      try {
        asReadResolved.set(
          `${fact.name}\n${option.name}`,
          oneNewline(resolveOptionContent(asRead, fact.name, option.name)),
        );
      } catch {
        // An option whose own content does not resolve is re-expressed below
        // against the option the legacy encoding actually held.
      }
    }
  }

  const history = ctx.history === null ? [] : (ctx.history.get(`${node.graph}/${node.slug}.md`) ?? []);
  const recoverable = new Map();
  if (history.length > 0) {
    for (const revision of history) {
      const read = historicalTexts(revision.text);
      if (read === null) continue;
      const facts = Array.isArray(read.fm.facts) ? read.fm.facts : [];
      const fact = facts.find((f) => f && f.name === ANSWER_FACT) ?? null;
      if (fact === null || !fact.recommends) continue;
      if (recoverable.has(fact.recommends)) continue;
      const text = read.fence !== null
        ? read.fence
        : (read.answer === null || (standingWhole ?? fenceWhole) === null
          ? null
          : withAnswerBody(standingWhole ?? fenceWhole, read.answer));
      if (text !== null) recoverable.set(fact.recommends, { text, commit: revision.commit });
    }
  }

  // What each option carries: its sentence, its two accumulations, and, on
  // the answer fact, its content.
  const rendered = new Map();
  const contents = new Map();
  for (const fact of node.facts ?? []) {
    if (!PER_NODE_FACTS.includes(fact.name)) continue;
    for (const option of fact.options) {
      const key = `${fact.name}\n${option.name}`;
      const already = shaped.get(key) ?? null;
      const split = already === null
        ? splitProse(option.prose)
        : {
          sentence: already.sentence,
          support: already.aiSupport ?? '',
          divergence: already.aiDivergence ?? '',
        };
      let sentence = split.sentence;
      if (sentence === '' && fact.name === ANSWER_FACT && option.name === stands) {
        sentence = firstSentence(node.answer ?? '');
        stats.sentenceFromAnswer += 1;
      }
      if (sentence === '') {
        sentence = firstSentence(option.reason ?? '')
          || `This option is recorded on the ${fact.name} fact; its sentence is owed.`;
        stats.sentenceOwed += 1;
      }

      const support = [];
      if (split.support !== '') support.push(split.support);
      if (fact.name === ANSWER_FACT) {
        // The node's own `## Rationale` argues for the text `## Answer`
        // holds, which is the standing option's; the fence's argues for the
        // recommendation, which is the recommended option's.
        const absorb = (text) => {
          if (text === null || text === undefined) return;
          if (support.some((s) => s.includes(text))) return;
          support.push(text);
        };
        if (option.name === stands) absorb(standingRationale);
        if (option.name === recommends) absorb(fenceRationale);
      }
      const divergence = [];
      if (split.divergence !== '') divergence.push(split.divergence);
      if (fact.name === ANSWER_FACT && option.name === recommends && fact.against) {
        const against = String(fact.against).trim();
        if (!divergence.some((d) => d.includes(against))) divergence.push(against);
      }
      if (support.length === 0) stats.supportOwed += 1;
      if (divergence.length === 0) stats.divergenceOwed += 1;

      rendered.set(key, {
        sentence,
        support: support.length === 0 ? OWED_SUPPORT : support.join('\n\n'),
        divergence: divergence.length === 0 ? OWED_DIVERGENCE : divergence.join('\n\n'),
      });
    }
  }

  // The text each answer option would make the node stand on, before any
  // choice of form: the record's own where it wrote one, and nowhere an
  // argument the migration invented.
  const targets = new Map();
  if (answerFact !== null) {
    for (const option of answerFact.options) {
      const key = `${ANSWER_FACT}\n${option.name}`;
      let target = null;
      if (option.name === stands && standingWhole !== null) target = standingWhole;
      else if (option.name === recommends && fenceWhole !== null) target = fenceWhole;
      else if (asReadResolved.has(key)) target = asReadResolved.get(key);
      else if (recoverable.has(option.name)) {
        target = recoverable.get(option.name).text;
        note.contentRecovered.push(`${option.name} (at ${recoverable.get(option.name).commit.slice(0, 8)})`);
        stats.recovered += 1;
      }
      targets.set(key, target);
    }
  }

  // The base every other option's content is a change against: the option
  // whose text the legacy encoding actually held, and where it held none,
  // the first option that carries a text of its own.
  let baseName = null;
  if (answerFact !== null) {
    if (stands !== null && standingWhole !== null) baseName = stands;
    else if (recommends !== null && fenceWhole !== null) baseName = recommends;
    else {
      const first = answerFact.options.find((o) => targets.get(`${ANSWER_FACT}\n${o.name}`) !== null) ?? null;
      baseName = first === null ? null : first.name;
    }
  }
  const baseText = baseName === null ? null : targets.get(`${ANSWER_FACT}\n${baseName}`);

  if (answerFact !== null && ctx.derive && baseText !== null) {
    for (const option of answerFact.options) {
      const key = `${ANSWER_FACT}\n${option.name}`;
      if (targets.get(key) !== null) continue;
      const derived = withAnswerBody(baseText, rendered.get(key)?.sentence ?? '');
      if (derived === null) continue;
      targets.set(key, derived);
      note.contentDerived.push(option.name);
      stats.derived += 1;
    }
  }

  if (answerFact !== null) {
    for (const option of answerFact.options) {
      const key = `${ANSWER_FACT}\n${option.name}`;
      const target = targets.get(key);
      if (target === null || target === undefined) {
        note.contentNone.push(option.name);
        stats.none += 1;
        continue;
      }
      if (option.name === baseName) {
        contents.set(key, { form: 'whole', text: target });
        stats.whole += 1;
        note.contentWhole += 1;
        continue;
      }
      // The record's own form is kept wherever it still replays exactly
      // against what its base now carries; only where it does not is the
      // content re-expressed against the base the legacy encoding held.
      const own = shaped.get(key)?.content ?? null;
      if (own !== null && keeps(own, target, targets)) {
        contents.set(key, own);
        stats.kept += 1;
        note.contentKept += 1;
        if (own.form === 'whole') { stats.whole += 1; note.contentWhole += 1; }
        else { stats.change += 1; note.contentChange += 1; }
        continue;
      }
      const content = chooseForm(target, baseName, baseText, stats);
      contents.set(key, content);
      if (content.form === 'whole') note.contentWhole += 1; else note.contentChange += 1;
    }
  }

  // Content on a persistence option is the record's own and is carried over
  // as written; the encoding requires none there.
  for (const fact of node.facts ?? []) {
    if (fact.name === ANSWER_FACT || !PER_NODE_FACTS.includes(fact.name)) continue;
    for (const option of fact.options) {
      const key = `${fact.name}\n${option.name}`;
      const own = shaped.get(key)?.content ?? null;
      if (own !== null) contents.set(key, own);
    }
  }

  // The author's words: every entry this node carried becomes a reference on
  // the options its date names, and where the node has none, on the option
  // the answer fact recommends.
  const supports = new Map();
  const addRef = (factName, optionName, address) => {
    const key = `${factName}\n${optionName}`;
    const list = supports.get(key) ?? [];
    if (!list.includes(address)) list.push(address);
    supports.set(key, list);
  };
  for (const entry of ctx.ledger.byNode.get(node.id) ?? []) {
    note.ledger.push(entry.address);
    let placed = 0;
    for (const fact of node.facts ?? []) {
      for (const option of fact.options) {
        if (option.source === 'author' && option.ref === entry.date) {
          addRef(fact.name, option.name, entry.address);
          placed += 1;
        }
      }
    }
    if (placed > 0) { note.referencesByRule += placed; stats.byRule += placed; continue; }
    if (answerFact !== null && recommends !== null) {
      addRef(ANSWER_FACT, recommends, entry.address);
      note.referencesByFallback += 1;
      stats.byFallback += 1;
    } else {
      stats.unplaced += 1;
    }
  }
  // Addressed by date and then by the entry's ordinal within it, which is a
  // number and not a string: `words/2026-09-07/4` comes before `/14`.
  const addressKey = (ref) => {
    const m = ref.match(/^words\/(\d{4}-\d{2}-\d{2})\/(\d+)$/);
    return m === null ? [ref, 0] : [m[1], Number(m[2])];
  };
  for (const [key, list] of supports) {
    list.sort((a, b) => {
      const [da, na] = addressKey(a);
      const [db, nb] = addressKey(b);
      return da === db ? na - nb : (da < db ? -1 : 1);
    });
    supports.set(key, list);
  }

  // The file: frontmatter, '## Facts', '## Account'.
  const fm = editFrontmatter(node.fmText, supports);

  const factsBody = [];
  for (const fact of node.facts ?? []) {
    const perNode = PER_NODE_FACTS.includes(fact.name);
    const prose = (fact.prose ?? '').trim();
    if (!perNode && prose === '') continue;
    if (!perNode && !fact.hasHeading) continue;
    factsBody.push(`### ${fact.name}`);
    if (prose !== '') factsBody.push(prose);
    if (!perNode) continue;
    for (const option of fact.options) {
      const key = `${fact.name}\n${option.name}`;
      const parts = rendered.get(key);
      factsBody.push(`#### ${option.name}`);
      factsBody.push(parts.sentence);
      factsBody.push(`**AI support.** ${parts.support}`);
      factsBody.push(`**AI divergence.** ${parts.divergence}`);
      const content = contents.get(key);
      if (content !== undefined) factsBody.push(renderContent(content));
    }
  }

  // The dialogue's own pins -- the draft review's, its survey's, and each
  // ruled option's -- are computed against the migrated text itself, so a
  // pin that was current before the migration reads current after it: only
  // the encoding changed, and staleness the record already carried through
  // the migration is left exactly as it stood, in one further reading and
  // never a second reckoning of what "stale" means. `## Account` is never
  // part of the hashed text (`hashParts` in `derive.mjs` does not include
  // it), so the base manifest line can be written into the draft before this
  // read without the read then invalidating itself.
  const draftAccount = [];
  if (node.account !== null && node.account !== undefined && node.account.trim() !== '') {
    draftAccount.push(node.account.trim());
  }
  draftAccount.push(`### Migrated to the content encoding, ${ctx.date}`);
  const baseNote = manifestLine(node, note, ctx, null);
  draftAccount.push(baseNote);
  const draftOut = [`---\n${fm.text}\n---`];
  if (factsBody.length > 0) draftOut.push(['## Facts', ...factsBody].join('\n\n'));
  draftOut.push(['## Account', ...draftAccount].join('\n\n'));
  const draftText = `${draftOut.join('\n\n')}\n`;

  let repin = null;
  try {
    const parsedNew = parseNode(draftText, {
      id: node.id, graph: node.graph, slug: node.slug, path: node.path,
    });
    const newFactHash = new Map((parsedNew.facts ?? []).map((f) => [f.name, f.recommendationHash]));

    const review = (node.reviewStale === false && node.review && node.review.of)
      ? { old: node.review.of, new: parsedNew.recommendationHash }
      : null;
    const survey = (node.surveyStale === false && node.review && node.review.survey && node.review.survey.of)
      ? { old: node.review.survey.of, new: parsedNew.recommendationHash }
      : null;
    const rulings = new Map();
    const rulingSentences = [];
    for (const fact of node.facts ?? []) {
      for (const option of fact.options ?? []) {
        if (!option.ruling || !option.ruling.of) continue;
        const key = `${fact.name}\n${option.name}`;
        const newHash = newFactHash.get(fact.name);
        if (fact.moved === false && newHash) {
          rulings.set(key, newHash);
          rulingSentences.push({ status: 'repinned', old: option.ruling.of, new: newHash, fact: fact.name, option: option.name });
        } else {
          rulingSentences.push({ status: 'stale', old: option.ruling.of, fact: fact.name, option: option.name });
        }
      }
    }

    const applied = repinDialogue(fm.text, {
      review: review === null ? null : review.new,
      survey: survey === null ? null : survey.new,
      rulings,
    });
    repin = {
      fmText: applied.text,
      review: review === null ? null : { status: 'repinned', old: review.old, new: review.new },
      reviewLeftStale: review === null && node.review && node.review.of
        ? { status: 'stale', old: node.review.of }
        : null,
      survey: survey === null ? null : { status: 'repinned', old: survey.old, new: survey.new },
      surveyLeftStale: survey === null && node.review && node.review.survey && node.review.survey.of
        ? { status: 'stale', old: node.review.survey.of }
        : null,
      rulingSentences,
      counts: {
        reviewRepinned: review === null ? 0 : 1,
        reviewLeftStale: review === null && node.review && node.review.of ? 1 : 0,
        surveyRepinned: survey === null ? 0 : 1,
        surveyLeftStale: survey === null && node.review && node.review.survey && node.review.survey.of ? 1 : 0,
        rulingsRepinned: rulingSentences.filter((s) => s.status === 'repinned').length,
        rulingsLeftStale: rulingSentences.filter((s) => s.status === 'stale').length,
      },
    };
  } catch {
    // The draft does not parse (unexpected, since it is checked again below
    // and the migration refuses it there); no pin is re-computed and none of
    // the dialogue's `of:` values are touched.
    repin = null;
  }

  const finalFmText = repin === null ? fm.text : repin.fmText;
  const out = [`---\n${finalFmText}\n---`];
  if (factsBody.length > 0) out.push(['## Facts', ...factsBody].join('\n\n'));

  const account = [];
  if (node.account !== null && node.account !== undefined && node.account.trim() !== '') {
    account.push(node.account.trim());
  }
  account.push(`### Migrated to the content encoding, ${ctx.date}`);
  account.push(manifestLine(node, note, ctx, repin));
  out.push(['## Account', ...account].join('\n\n'));

  if (repin !== null) {
    stats.reviewRepinned += repin.counts.reviewRepinned;
    stats.reviewLeftStale += repin.counts.reviewLeftStale;
    stats.surveyRepinned += repin.counts.surveyRepinned;
    stats.surveyLeftStale += repin.counts.surveyLeftStale;
    stats.rulingsRepinned += repin.counts.rulingsRepinned;
    stats.rulingsLeftStale += repin.counts.rulingsLeftStale;
  }

  return { text: `${out.join('\n\n')}\n`, note };
}

/** The manifest line: what was absorbed where, and where the legacy text stands. */
function manifestLine(node, note, ctx, repin) {
  const said = [];
  said.push(
    `Written by \`packages/disposition/migrate.mjs\` on ${ctx.date}. The legacy text of `
    + `${node.id} stands at graph commit \`${ctx.commit}\`, and this file is its `
    + 'projection into the content encoding of 2026-09-07 '
    + '(`commons.systems/disposition-graph/dialogue`, '
    + '`an-option-carries-its-content-its-words-and-its-case`).',
  );
  const moved = [];
  if (note.stands !== null) {
    moved.push(`the \`## Answer\` became the content of \`${note.stands}\``);
    moved.push(`the \`## Rationale\` its \`**AI support.**\``);
  }
  if (node.fence) {
    moved.push(`the \`## Recommendation\` fence became the content of \`${note.recommends}\``);
  }
  if (note.ledger.length > 0) {
    moved.push(
      `${note.ledger.length} \`## Disposition\` `
      + `${note.ledger.length === 1 ? 'entry' : 'entries'} became the ledger `
      + `${note.ledger.length === 1 ? 'entry' : 'entries'} ${note.ledger.join(', ')}, `
      + `referenced by ${note.referencesByRule} option`
      + `${note.referencesByRule === 1 ? '' : 's'} the entry's own date names`
      + (note.referencesByFallback > 0
        ? ` and by the recommended option for ${note.referencesByFallback} the date named none`
        : ''),
    );
  }
  if (note.stands !== null) moved.push('and `stands` left the answer fact');
  if (moved.length > 0) {
    const joined = moved.join('; ');
    said.push(`${joined.charAt(0).toUpperCase()}${joined.slice(1)}.`);
  }
  if (note.contentRecovered.length > 0) {
    said.push(
      `The content of ${note.contentRecovered.map((r) => `\`${r}\``).join(', ')} was `
      + 'recovered from the commit at which the answer fact recommended it.',
    );
  }
  if (note.contentDerived.length > 0) {
    said.push(
      `The record wrote no text of its own for ${note.contentDerived.map((n) => `\`${n}\``).join(', ')}, `
      + "so each carries the node as it stands with its own sentence in the answer's place: "
      + 'a transcription of what the option already said it would answer, and not an '
      + 'argument the migration wrote. Each is owed the text a sitting will give it.',
    );
  }
  if (note.contentNone.length > 0) {
    said.push(
      `No content is recorded for ${note.contentNone.map((n) => `\`${n}\``).join(', ')}: `
      + 'the record never wrote one and the migration invents none.',
    );
  }
  if (repin !== null) {
    const draftSentence = pinSentence('The draft review\'s', repin.review ?? repin.reviewLeftStale);
    if (draftSentence !== null) said.push(draftSentence);
    const surveySentence = pinSentence('The survey\'s', repin.survey ?? repin.surveyLeftStale);
    if (surveySentence !== null) said.push(surveySentence);
    for (const r of repin.rulingSentences) {
      const label = `The author's ruling on \`${r.fact}\`'s \`${r.option}\` option's`;
      const sentence = pinSentence(label, r);
      if (sentence !== null) said.push(sentence);
    }
  }
  return said.join(' ');
}

// ---------------------------------------------------------------------------
// the graph
// ---------------------------------------------------------------------------

/**
 * Migrate every legacy node of the graph at `graphDir`.
 *
 * @param {string} graphDir
 * @param {{dry?: boolean, commit?: string|null, date?: string,
 *   historyDir?: string|null, derive?: boolean}} [options]
 * @returns {Promise<{report: string, stats: object, files: Map<string,string>}>}
 */
export async function migrate(graphDir, options = {}) {
  const root = path.resolve(graphDir);
  const graph = await readGraph(root);
  const nodes = [...graph.nodes].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  const legacy = nodes.filter((n) => n.encoding !== 'content');

  const date = options.date ?? new Date().toISOString().slice(0, 10);
  const commit = options.commit ?? headCommit(options.historyDir ?? root) ?? 'unknown';
  const derive = options.derive !== false;

  let history = null;
  const historyDir = options.historyDir ?? (isRepo(root) ? root : null);
  if (historyDir !== null) {
    try {
      history = loadHistory(historyDir);
    } catch (err) {
      history = null;
      options.historyError = err.message;
    }
  }

  // The ledger already on the ref, which this run appends to and never
  // rewrites (commons.systems/disposition-graph/quotes: it is append-only).
  const onTheRef = await readWords(root);
  const onDisk = new Map();
  for (const entry of onTheRef.values()) {
    const filename = `${entry.date}.md`;
    if (onDisk.has(filename)) continue;
    onDisk.set(filename, await readFile(path.join(root, 'words', filename), 'utf8'));
  }
  const ledger = buildLedger(legacy, onTheRef);
  const stats = {
    nodes: nodes.length,
    legacy: legacy.length,
    alreadyContent: nodes.length - legacy.length,
    whole: 0,
    change: 0,
    kept: 0,
    wholeBecauseIdentical: 0,
    none: 0,
    recovered: 0,
    derived: 0,
    sentenceFromAnswer: 0,
    sentenceOwed: 0,
    supportOwed: 0,
    divergenceOwed: 0,
    byRule: 0,
    byFallback: 0,
    unplaced: 0,
    ledgerEntries: ledger.entries.length,
    ledgerQuotations: 0,
    reviewRepinned: 0,
    reviewLeftStale: 0,
    surveyRepinned: 0,
    surveyLeftStale: 0,
    rulingsRepinned: 0,
    rulingsLeftStale: 0,
    refused: [],
  };
  for (const node of legacy) {
    if (node.disposition) stats.ledgerQuotations += dispositionEntries(node.disposition).length;
  }

  const files = new Map();
  const notes = [];
  for (const node of legacy) {
    let migrated;
    try {
      migrated = migrateNode(node, { date, commit, ledger, history, derive, stats });
    } catch (err) {
      stats.refused.push(`${node.id}: ${err.message}`);
      continue;
    }
    // A node the reader cannot read is never written: the migration refuses
    // it and says so, one node at a time.
    try {
      parseNode(migrated.text, {
        id: node.id, graph: node.graph, slug: node.slug, path: node.path,
      });
    } catch (err) {
      stats.refused.push(err.message);
      continue;
    }
    files.set(node.path, migrated.text);
    notes.push(migrated.note);
  }

  for (const [filename, text] of ledgerFiles(ledger.entries, onDisk)) {
    files.set(path.join('words', filename), text);
  }

  if (options.dry !== true) {
    for (const [relPath, text] of files) {
      const target = path.join(root, relPath);
      await mkdir(path.dirname(target), { recursive: true });
      await writeFile(target, text, 'utf8');
    }
  }

  return { report: renderReport(stats, ledger, notes, { date, commit, derive }), stats, files, ledger, notes };
}

function isRepo(dir) {
  try {
    execFileSync('git', ['-C', dir, 'rev-parse', '--git-dir'], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function headCommit(dir) {
  try {
    return execFileSync('git', ['-C', dir, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
  } catch {
    return null;
  }
}

function renderReport(stats, ledger, notes, ctx) {
  const fan = {};
  for (const entry of ledger.entries) {
    fan[entry.nodes.length] = (fan[entry.nodes.length] ?? 0) + 1;
  }
  const lines = [];
  lines.push(`migration report, ${ctx.date}, graph commit ${ctx.commit}`);
  lines.push('');
  lines.push(`nodes: ${stats.nodes}, legacy ${stats.legacy}, already content ${stats.alreadyContent}`);
  lines.push(`migrated: ${notes.length}, refused ${stats.refused.length}`);
  lines.push(
    `option content: whole ${stats.whole}, named change ${stats.change}, none ${stats.none}`
    + ` (of which ${stats.kept} kept in the form the record already wrote)`
    + ` (recovered from history ${stats.recovered}, derived from the option's own sentence ${stats.derived}`
    + `${ctx.derive ? '' : ', derivation off'})`,
  );
  lines.push(`sentences: ${stats.sentenceFromAnswer} taken from the node's '## Answer', ${stats.sentenceOwed} owed`);
  lines.push(`accumulations owed: support ${stats.supportOwed}, divergence ${stats.divergenceOwed}`);
  lines.push(
    `ledger: ${stats.ledgerQuotations} quotations, ${stats.ledgerEntries} distinct entries`
    + ` over ${new Set(ledger.entries.map((e) => e.date)).size} dates`,
  );
  lines.push(
    `references: ${stats.byRule} placed by the option's own source and ref, `
    + `${stats.byFallback} by the recommended option where the node had no such option, `
    + `${stats.unplaced} unplaced`,
  );
  lines.push(`fan-out of a quotation over nodes: ${Object.entries(fan).sort((a, b) => Number(a[0]) - Number(b[0])).map(([k, v]) => `${v} on ${k}`).join(', ')}`);
  lines.push(
    `pins re-computed: review ${stats.reviewRepinned}, survey ${stats.surveyRepinned}, `
    + `rulings ${stats.rulingsRepinned}; left stale: review ${stats.reviewLeftStale}, `
    + `survey ${stats.surveyLeftStale}, rulings ${stats.rulingsLeftStale}`,
  );
  if (ledger.undated.length > 0) {
    lines.push(`undated quotations left in place: ${ledger.undated.length}`);
  }
  if (stats.refused.length > 0) {
    lines.push('');
    lines.push('refused:');
    for (const why of stats.refused) lines.push(`  ${why}`);
  }
  lines.push('');
  lines.push('per node:');
  for (const note of notes) {
    const bits = [
      `whole ${note.contentWhole}`,
      `change ${note.contentChange}`,
      `none ${note.contentNone.length}`,
      `derived ${note.contentDerived.length}`,
      `recovered ${note.contentRecovered.length}`,
      `words ${note.ledger.length}`,
    ];
    lines.push(`  ${note.id}: ${bits.join(', ')}`);
  }
  return `${lines.join('\n')}\n`;
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isMain) {
  const args = process.argv.slice(2);
  const positional = [];
  const options = { dry: false, derive: true };
  let reportPath = null;
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === '--dry') options.dry = true;
    else if (arg === '--no-derived-content') options.derive = false;
    else if (arg === '--report') { reportPath = args[i + 1]; i += 1; }
    else if (arg === '--commit') { options.commit = args[i + 1]; i += 1; }
    else if (arg === '--date') { options.date = args[i + 1]; i += 1; }
    else if (arg === '--history') { options.historyDir = args[i + 1]; i += 1; }
    else positional.push(arg);
  }
  if (positional.length !== 1) {
    console.error('usage: migrate.mjs <graphDir> [--dry] [--report <file>] [--commit <sha>] [--history <repoDir>] [--no-derived-content]');
    process.exitCode = 1;
  } else {
    try {
      const result = await migrate(positional[0], options);
      process.stdout.write(result.report);
      if (reportPath !== null) await writeFile(path.resolve(reportPath), result.report, 'utf8');
      process.exitCode = result.stats.refused.length === 0 ? 0 : 1;
    } catch (err) {
      console.error(err.message);
      process.exitCode = 1;
    }
  }
}
