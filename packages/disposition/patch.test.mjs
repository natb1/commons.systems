// packages/disposition/patch.test.mjs
//
// Tests for patch.mjs (commons.systems/disposition-graph/dialogue, option
// `an-option-carries-its-content-its-words-and-its-case`).
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { applyStrict, diffText, parseHunks } from './patch.mjs';

function repeat(n, fn) {
  return Array.from({ length: n }, (_, i) => fn(i + 1)).join('');
}

// ---------------------------------------------------------------------------
// (a) round trip
// ---------------------------------------------------------------------------

const pairs = {
  'insertion at the top': {
    base: 'a\nb\nc\nd\ne\n',
    target: 'X\na\nb\nc\nd\ne\n',
  },
  'deletion at the end': {
    base: 'a\nb\nc\n',
    target: 'a\nb\n',
  },
  'two changes far apart, two hunks': {
    base: repeat(20, (n) => `l${n}\n`),
    target: repeat(20, (n) => (n === 2 ? 'CHANGED-2\n' : n === 18 ? 'CHANGED-18\n' : `l${n}\n`)),
  },
  'two changes close together, one merged hunk': {
    base: repeat(20, (n) => `l${n}\n`),
    target: repeat(20, (n) => (n === 8 ? 'CHANGED-8\n' : n === 12 ? 'CHANGED-12\n' : `l${n}\n`)),
  },
  'repeated identical lines': {
    base: 'a\na\na\na\na\n',
    target: 'a\na\nb\na\na\n',
  },
  'identical texts': {
    base: 'same\ntext\nhere\n',
    target: 'same\ntext\nhere\n',
  },
};

for (const [name, { base, target }] of Object.entries(pairs)) {
  test(`round trip: ${name}`, () => {
    const diff = diffText(base, target);
    assert.equal(applyStrict(base, diff), target);
  });
}

test('round trip: identical texts produce an empty diff', () => {
  const { base, target } = pairs['identical texts'];
  assert.equal(diffText(base, target), '');
});

test('round trip: two changes far apart produce two hunks', () => {
  const { base, target } = pairs['two changes far apart, two hunks'];
  const diff = diffText(base, target);
  assert.equal(parseHunks(diff).length, 2);
});

test('round trip: two changes close together produce one hunk', () => {
  const { base, target } = pairs['two changes close together, one merged hunk'];
  const diff = diffText(base, target);
  assert.equal(parseHunks(diff).length, 1);
});

// ---------------------------------------------------------------------------
// (b) mismatched context throws, naming the hunk and the line
// ---------------------------------------------------------------------------

test('a hunk whose context does not match throws, naming the hunk and the line', () => {
  const base = 'a\nb\nc\nd\ne\n';
  const diff = '@@ -1,5 +1,5 @@\n a\n b\n-c\n+C\n d\n e\n';
  const tampered = diff.replace(' b\n', ' NOT-B\n');
  assert.throws(
    () => applyStrict(base, tampered),
    (err) => {
      assert.match(err.message, /hunk 1/);
      assert.match(err.message, /line 2/);
      return true;
    }
  );
});

// ---------------------------------------------------------------------------
// (c) a correct header at the wrong line throws rather than re-anchoring
// ---------------------------------------------------------------------------

test('a hunk at the wrong line throws rather than being re-anchored', () => {
  const base = 'a\nb\nc\nd\ne\n';
  // Correct hunk for changing "b" -> "X" starts at old line 1 (three lines
  // of context either side, whole file). Shift the header's old-side start
  // by one without touching the content: the context no longer matches at
  // that position, and a re-anchoring patch tool would slide it back --
  // applyStrict must throw instead.
  const correctDiff = diffText(base, 'a\nX\nc\nd\ne\n');
  const hunk = parseHunks(correctDiff)[0];
  assert.equal(hunk.oldStart, 1);
  const shifted = correctDiff.replace(
    `@@ -${hunk.oldStart},${hunk.oldLines} +${hunk.newStart},${hunk.newLines} @@`,
    `@@ -${hunk.oldStart + 1},${hunk.oldLines} +${hunk.newStart + 1},${hunk.newLines} @@`
  );
  assert.notEqual(shifted, correctDiff);
  assert.throws(() => applyStrict(base, shifted), /base line/);
});

// ---------------------------------------------------------------------------
// (d) "\ No newline at end of file" throws
// ---------------------------------------------------------------------------

test('a "\\ No newline at end of file" line throws', () => {
  const base = 'a\nb\n';
  const diff = '@@ -1,2 +1,2 @@\n a\n-b\n+B\n\\ No newline at end of file\n';
  assert.throws(() => applyStrict(base, diff), /No newline/);
});

// ---------------------------------------------------------------------------
// (e) parseHunks: omitted count, and a malformed header
// ---------------------------------------------------------------------------

test('parseHunks handles an omitted old-side count', () => {
  const hunks = parseHunks('@@ -1 +1,2 @@\n a\n+b\n');
  assert.equal(hunks.length, 1);
  assert.deepEqual(hunks[0], {
    oldStart: 1,
    oldLines: 1,
    newStart: 1,
    newLines: 2,
    lines: [' a', '+b'],
  });
});

test('parseHunks rejects a malformed header', () => {
  assert.throws(() => parseHunks('@@ garbage @@\n a\n'), /malformed hunk header/);
});

test('parseHunks rejects an unknown line prefix', () => {
  assert.throws(() => parseHunks('@@ -1,1 +1,1 @@\n*bad\n'), /unknown prefix/);
});

// ---------------------------------------------------------------------------
// applyStrict: base validation and the empty-diff case
// ---------------------------------------------------------------------------

test('applyStrict throws when base does not end in a newline', () => {
  assert.throws(() => applyStrict('a\nb', ''), /newline/);
});

test('applyStrict returns the base unchanged for an empty diff', () => {
  assert.equal(applyStrict('a\nb\n', ''), 'a\nb\n');
});

// ---------------------------------------------------------------------------
// comparison against the system `diff`, if present
// ---------------------------------------------------------------------------

function systemDiffAvailable() {
  try {
    execFileSync('diff', ['--version'], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

const tmpRoot = process.env.CLAUDE_JOB_DIR
  ? path.join(process.env.CLAUDE_JOB_DIR, 'tmp')
  : os.tmpdir();

test('diffText matches `diff -U3` byte for byte', { skip: !systemDiffAvailable() && 'diff is not on PATH' }, () => {
  if (!existsSync(tmpRoot)) mkdirSync(tmpRoot, { recursive: true });

  for (const name of ['insertion at the top', 'two changes far apart, two hunks']) {
    const { base, target } = pairs[name];
    const baseFile = path.join(tmpRoot, `patch-test-base-${process.pid}.txt`);
    const targetFile = path.join(tmpRoot, `patch-test-target-${process.pid}.txt`);
    writeFileSync(baseFile, base);
    writeFileSync(targetFile, target);

    let systemOutput;
    try {
      systemOutput = execFileSync('diff', ['-U3', baseFile, targetFile], { encoding: 'utf8' });
    } catch (err) {
      // `diff` exits 1 when the files differ; its output is on stdout still.
      systemOutput = err.stdout;
    }
    const systemHunks = systemOutput
      .split('\n')
      .filter((line) => !line.startsWith('---') && !line.startsWith('+++'))
      .join('\n');

    assert.equal(diffText(base, target), systemHunks, `mismatch for "${name}"`);
  }
});
