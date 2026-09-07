// packages/disposition/patch.mjs
//
// Applies and produces the unified-diff hunks by which one option's content
// is stored as a named change to another option's content
// (commons.systems/disposition-graph/dialogue, option
// `an-option-carries-its-content-its-words-and-its-case`). A hunk carries an
// `@@ -l,s +l,s @@` header, context lines prefixed by one space, removals by
// `-` and additions by `+`, with three lines of context each side where the
// text allows; it is applied strictly, at the line its header names, every
// context and removal line matching byte for byte, with no fuzz and no
// offset search, so a hunk that does not apply exactly is an error of the
// record and is never re-anchored. Hunks are produced by diffing the two
// resolved texts and never written by hand -- `diffText` is that production,
// `applyStrict` the strict replay, and `parseHunks` the shared parse both
// rest on.
//
// No dependencies: the line diff is a small LCS dynamic program, and the
// hunk grouping (context, merging hunks whose context would overlap or
// touch) is the standard algorithm behind `diff -U<n>` and
// `difflib.unified_diff`, reimplemented here rather than imported, since
// there is no node_modules inside this worktree
// (commons.systems/disposition-graph/materialization).

// ---------------------------------------------------------------------------
// text <-> lines
// ---------------------------------------------------------------------------

// Content in this record always ends in a newline; empty content is the
// empty string. `linesOf`/`textOf` are inverses under that convention: a
// trailing newline is not itself a line.
function linesOf(text) {
  if (text === '') return [];
  const lines = text.split('\n');
  if (lines.length && lines[lines.length - 1] === '') lines.pop();
  return lines;
}

function textOf(lines) {
  return lines.length ? lines.join('\n') + '\n' : '';
}

// ---------------------------------------------------------------------------
// parseHunks
// ---------------------------------------------------------------------------

const HEADER_RE = /^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/;

/**
 * Parses one or more unified-diff hunks (no `---`/`+++` file headers
 * required; tolerated and skipped if present before the first hunk).
 *
 * @param {string} diff
 * @returns {Array<{oldStart:number, oldLines:number, newStart:number,
 *   newLines:number, lines:string[]}>}
 */
export function parseHunks(diff) {
  if (diff === '') return [];
  const rawLines = diff.split('\n');
  if (rawLines.length && rawLines[rawLines.length - 1] === '') rawLines.pop();

  let idx = 0;
  while (
    idx < rawLines.length &&
    (rawLines[idx].startsWith('---') || rawLines[idx].startsWith('+++'))
  ) {
    idx++;
  }

  const hunks = [];
  let hunkIndex = 0;
  while (idx < rawLines.length) {
    const headerLine = rawLines[idx];
    const m = HEADER_RE.exec(headerLine);
    if (!m) {
      throw new Error(
        `parseHunks: malformed hunk header at line ${idx + 1}: ${JSON.stringify(headerLine)}`
      );
    }
    hunkIndex++;
    const oldStart = Number(m[1]);
    const oldLines = m[2] === undefined ? 1 : Number(m[2]);
    const newStart = Number(m[3]);
    const newLines = m[4] === undefined ? 1 : Number(m[4]);
    idx++;

    const lines = [];
    while (idx < rawLines.length && !rawLines[idx].startsWith('@@ ')) {
      const line = rawLines[idx];
      const prefix = line[0];
      if (prefix !== ' ' && prefix !== '-' && prefix !== '+' && prefix !== '\\') {
        throw new Error(
          `parseHunks: unknown prefix in hunk ${hunkIndex} at line ${idx + 1}: ${JSON.stringify(line)}`
        );
      }
      lines.push(line);
      idx++;
    }
    hunks.push({ oldStart, oldLines, newStart, newLines, lines });
  }
  return hunks;
}

// ---------------------------------------------------------------------------
// applyStrict
// ---------------------------------------------------------------------------

/**
 * Applies unified-diff hunks to `base` strictly: every context and removal
 * line must match the base byte for byte at exactly the line its hunk
 * header names, against the base's original line numbers. No fuzz, no
 * offset search -- a hunk that does not apply exactly throws rather than
 * being re-anchored.
 *
 * @param {string} base
 * @param {string} diff
 * @returns {string}
 */
export function applyStrict(base, diff) {
  if (!base.endsWith('\n')) {
    throw new Error('applyStrict: base does not end in a newline');
  }
  if (diff === '') return base;

  const hunks = parseHunks(diff);
  if (hunks.length === 0) return base;

  const baseLines = linesOf(base);
  const result = [];
  let pointer = 0;

  hunks.forEach((hunk, hi) => {
    const hunkNumber = hi + 1;
    // A hunk's old-side start refers to the base's ORIGINAL line numbers,
    // not to lines already emitted by earlier hunks; walking `baseLines`
    // with a single forward pointer gets this for free, since baseLines
    // itself is never mutated. `oldLines === 0` is the insertion form
    // (including `l = 0, s = 0` at the very top of an empty base): the
    // position to insert at is the old-side start itself, not start - 1.
    const targetIndex = hunk.oldLines === 0 ? hunk.oldStart : hunk.oldStart - 1;
    if (targetIndex < pointer) {
      throw new Error(
        `applyStrict: hunk ${hunkNumber} old-side start ${hunk.oldStart} lies before line ${pointer + 1}, ` +
          `which an earlier hunk already consumed`
      );
    }
    for (; pointer < targetIndex; pointer++) {
      result.push(baseLines[pointer]);
    }

    for (const line of hunk.lines) {
      const prefix = line[0];
      const text = line.slice(1);
      if (prefix === '\\') {
        throw new Error(
          `applyStrict: hunk ${hunkNumber} carries a "\\ No newline" marker; every content in this record ends in a newline`
        );
      }
      if (prefix === ' ' || prefix === '-') {
        const actual = pointer < baseLines.length ? baseLines[pointer] : undefined;
        if (actual !== text) {
          throw new Error(
            `applyStrict: hunk ${hunkNumber}, base line ${pointer + 1}: expected ${JSON.stringify(text)}, found ${JSON.stringify(actual)}`
          );
        }
        if (prefix === ' ') result.push(text);
        pointer++;
      } else if (prefix === '+') {
        result.push(text);
      } else {
        throw new Error(
          `applyStrict: hunk ${hunkNumber} has an unknown line prefix ${JSON.stringify(prefix)}`
        );
      }
    }
  });

  for (; pointer < baseLines.length; pointer++) {
    result.push(baseLines[pointer]);
  }

  return textOf(result);
}

// ---------------------------------------------------------------------------
// diffText
// ---------------------------------------------------------------------------

// The line-level edit script, as a run-length-coalesced list of
// {tag: 'equal'|'delete'|'insert', i1, i2, j1, j2} opcodes (`i` indexes `a`,
// `j` indexes `b`, both half-open ranges) -- the same shape difflib's
// SequenceMatcher.get_opcodes() produces, computed here from a plain LCS
// dynamic program (no 'replace' tag: a delete run directly followed by an
// insert run reads the same to the grouping and formatting steps below).
function computeOpcodes(a, b) {
  const na = a.length;
  const nb = b.length;
  const dp = new Array(na + 1);
  for (let i = 0; i <= na; i++) dp[i] = new Int32Array(nb + 1);
  for (let i = na - 1; i >= 0; i--) {
    for (let j = nb - 1; j >= 0; j--) {
      dp[i][j] =
        a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }

  const ops = [];
  const emit = (tag, i1, i2, j1, j2) => {
    const last = ops[ops.length - 1];
    if (last && last.tag === tag) {
      last.i2 = i2;
      last.j2 = j2;
    } else {
      ops.push({ tag, i1, i2, j1, j2 });
    }
  };

  let i = 0;
  let j = 0;
  while (i < na || j < nb) {
    if (i < na && j < nb && a[i] === b[j]) {
      emit('equal', i, i + 1, j, j + 1);
      i++;
      j++;
    } else if (j < nb && (i === na || dp[i][j + 1] > dp[i + 1][j])) {
      emit('insert', i, i, j, j + 1);
      j++;
    } else {
      emit('delete', i, i + 1, j, j);
      i++;
    }
  }
  return ops;
}

// Groups opcodes into hunks with up to `n` lines of context each side,
// merging hunks whose context would overlap or touch -- ported directly
// from the algorithm behind Python's difflib.SequenceMatcher
// .get_grouped_opcodes(), which is also the algorithm behind `diff -U<n>`'s
// hunk boundaries.
function groupOpcodes(codes, n) {
  if (codes.length === 0) return [];
  codes = codes.map((c) => ({ ...c }));

  if (codes[0].tag === 'equal') {
    const c = codes[0];
    c.i1 = Math.max(c.i1, c.i2 - n);
    c.j1 = Math.max(c.j1, c.j2 - n);
  }
  if (codes[codes.length - 1].tag === 'equal') {
    const c = codes[codes.length - 1];
    c.i2 = Math.min(c.i2, c.i1 + n);
    c.j2 = Math.min(c.j2, c.j1 + n);
  }

  const nn = n + n;
  const groups = [];
  let group = [];
  for (const c of codes) {
    let { tag, i1, i2, j1, j2 } = c;
    if (tag === 'equal' && i2 - i1 > nn) {
      group.push({ tag, i1, i2: Math.min(i2, i1 + n), j1, j2: Math.min(j2, j1 + n) });
      groups.push(group);
      group = [];
      i1 = Math.max(i1, i2 - n);
      j1 = Math.max(j1, j2 - n);
    }
    group.push({ tag, i1, i2, j1, j2 });
  }
  if (group.length && !(group.length === 1 && group[0].tag === 'equal')) {
    groups.push(group);
  }
  return groups;
}

// The GNU-diff "ed" range form: a single number when the range is exactly
// one line, `start,length` otherwise, and the `l = 0` empty-range form
// (start one before the range) when length is 0.
function formatRange(start, stop) {
  const length = stop - start;
  if (length === 1) return { start: start + 1, length: 1 };
  const s = length === 0 ? start - 1 : start;
  return { start: s + 1, length };
}

function formatHunk(group, a, b) {
  const first = group[0];
  const last = group[group.length - 1];
  const oldRange = formatRange(first.i1, last.i2);
  const newRange = formatRange(first.j1, last.j2);

  const lines = [];
  for (const { tag, i1, i2, j1, j2 } of group) {
    if (tag === 'equal') {
      for (let k = i1; k < i2; k++) lines.push(' ' + a[k]);
    } else if (tag === 'delete') {
      for (let k = i1; k < i2; k++) lines.push('-' + a[k]);
    } else if (tag === 'insert') {
      for (let k = j1; k < j2; k++) lines.push('+' + b[k]);
    }
  }

  return {
    oldStart: oldRange.start,
    oldLines: oldRange.length,
    newStart: newRange.start,
    newLines: newRange.length,
    lines,
  };
}

/**
 * Produces unified-diff hunks (no `---`/`+++` file headers) such that
 * `applyStrict(base, diffText(base, target)) === target`. Equal texts
 * return the empty string.
 *
 * @param {string} base
 * @param {string} target
 * @param {number} [context]
 * @returns {string}
 */
export function diffText(base, target, context = 3) {
  if (base === target) return '';

  const a = linesOf(base);
  const b = linesOf(target);
  const opcodes = computeOpcodes(a, b);
  const groups = groupOpcodes(opcodes, context);

  const out = [];
  for (const group of groups) {
    const hunk = formatHunk(group, a, b);
    const oldHeader = hunk.oldLines === 1 ? `${hunk.oldStart}` : `${hunk.oldStart},${hunk.oldLines}`;
    const newHeader = hunk.newLines === 1 ? `${hunk.newStart}` : `${hunk.newStart},${hunk.newLines}`;
    out.push(`@@ -${oldHeader} +${newHeader} @@`);
    out.push(...hunk.lines);
  }
  return out.length ? out.join('\n') + '\n' : '';
}
