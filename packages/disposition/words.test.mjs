// packages/disposition/words.test.mjs
//
// Run with: node --test packages/disposition/*.test.mjs
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { describe, test } from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  appendEntry,
  formatEntry,
  parseWordsFile,
  readWords,
  resolveReference,
  unreferencedEntries,
} from './words.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const FIXTURES = path.join(HERE, 'fixtures', 'words');

describe('parseWordsFile', () => {
  test('parses a fixture with three entries, one spanning two paragraphs', async () => {
    const text = await readFile(path.join(FIXTURES, '2026-09-05.md'), 'utf8');
    const entries = parseWordsFile(text, '2026-09-05');
    assert.equal(entries.length, 3);

    assert.equal(entries[0].address, 'words/2026-09-05/1');
    assert.equal(entries[0].date, '2026-09-05');
    assert.equal(entries[0].n, 1);
    assert.equal(entries[0].context, 'Asked whether the ledger keeps entries in order.');
    assert.equal(entries[0].text, 'Entries are appended and never inserted or reordered.');
    assert.match(entries[0].sha, /^[0-9a-f]{40}$/);

    assert.equal(entries[1].address, 'words/2026-09-05/2');
    assert.equal(
      entries[1].text,
      "The author's words are kept once, in a ledger on the disposition ref\n"
        + 'beside the node files.\n'
        + '\n'
        + "A correction to an entry's text is a landed edit, so the reader records\n"
        + "each entry's own sha and a reference to since-changed text is\n"
        + 'reportable.',
    );

    assert.equal(entries[2].n, 3);
    assert.equal(entries[2].address, 'words/2026-09-05/3');

    // every sha is distinct
    const shas = new Set(entries.map((e) => e.sha));
    assert.equal(shas.size, 3);
  });

  test('throws on an ordinal gap, naming the file and the heading', () => {
    const text = '## 1\n\ncontext one\n\n> quote one\n\n## 3\n\ncontext three\n\n> quote three\n';
    assert.throws(
      () => parseWordsFile(text, '2026-09-01'),
      /2026-09-01.*## 3/s,
    );
  });

  test('throws on a missing context line', () => {
    const text = '## 1\n\n> quote with no context\n';
    assert.throws(() => parseWordsFile(text, '2026-09-01'), /context/);
  });

  test('throws on a missing blockquote', () => {
    const text = '## 1\n\ncontext with no quote\n';
    assert.throws(() => parseWordsFile(text, '2026-09-01'), /blockquote/);
  });

  test('throws on a malformed date', () => {
    assert.throws(() => parseWordsFile('## 1\n\nc\n\n> q\n', '2026-9-1'), /date/);
  });

  test('joins a context hand-wrapped over several lines with single spaces', () => {
    const text = '## 1\n\nThe author, 2026-09-08, on a question long enough\n'
      + 'that the sentence describing it wraps to the prose width\n'
      + 'of the rest of the record.\n\n> a quotation\n';
    const [entry] = parseWordsFile(text, '2026-09-01');
    assert.equal(
      entry.context,
      'The author, 2026-09-08, on a question long enough that the sentence '
        + 'describing it wraps to the prose width of the rest of the record.',
    );
    assert.equal(entry.text, 'a quotation');
  });

  test('does not report a wrapped context as a missing blockquote', () => {
    const text = '## 1\n\ncontext line one\ncontext line two\n\n> a quotation\n';
    assert.doesNotThrow(() => parseWordsFile(text, '2026-09-01'));
  });

  test('a wrapped entry keeps its own sha over the bytes as they stand', () => {
    const wrapped = '## 1\n\ncontext line one\ncontext line two\n\n> a quotation\n';
    const flat = '## 1\n\ncontext line one context line two\n\n> a quotation\n';
    const [a] = parseWordsFile(wrapped, '2026-09-01');
    const [b] = parseWordsFile(flat, '2026-09-01');
    assert.equal(a.context, b.context);
    assert.notEqual(a.sha, b.sha);
  });

  test('tolerates a leading comment line', () => {
    const text = '<!-- fixture -->\n## 1\n\ncontext\n\n> quote\n';
    const entries = parseWordsFile(text, '2026-09-01');
    assert.equal(entries.length, 1);
    assert.equal(entries[0].context, 'context');
  });

  test('sha changes when the quotation text changes and not when a different entry changes', () => {
    const base = '## 1\n\ncontext one\n\n> original quote\n\n## 2\n\ncontext two\n\n> another quote\n';
    const changedOther = '## 1\n\ncontext one\n\n> original quote\n\n## 2\n\ncontext two\n\n> a DIFFERENT quote\n';
    const changedSame = '## 1\n\ncontext one\n\n> a DIFFERENT quote\n\n## 2\n\ncontext two\n\n> another quote\n';

    const baseEntries = parseWordsFile(base, '2026-09-01');
    const changedOtherEntries = parseWordsFile(changedOther, '2026-09-01');
    const changedSameEntries = parseWordsFile(changedSame, '2026-09-01');

    // entry 1 is untouched when only entry 2's text changes
    assert.equal(baseEntries[0].sha, changedOtherEntries[0].sha);
    // entry 2 did change
    assert.notEqual(baseEntries[1].sha, changedOtherEntries[1].sha);
    // entry 1's own quotation changing changes its sha
    assert.notEqual(baseEntries[0].sha, changedSameEntries[0].sha);
  });
});

describe('readWords', () => {
  test('reads every ledger file under words/, keyed by address', async () => {
    const words = await readWords(path.join(HERE, 'fixtures'));
    assert.equal(words.size, 4);
    assert.ok(words.has('words/2026-09-05/1'));
    assert.ok(words.has('words/2026-09-05/2'));
    assert.ok(words.has('words/2026-09-05/3'));
    assert.ok(words.has('words/2026-09-06/1'));
    assert.equal(words.get('words/2026-09-06/1').context.startsWith('Asked, on a later date'), true);
  });

  test('a missing words/ directory yields an empty Map', async () => {
    const words = await readWords(path.join(HERE, 'fixtures', 'alignment'));
    assert.equal(words.size, 0);
  });
});

describe('resolveReference', () => {
  test('resolves a present address', async () => {
    const words = await readWords(path.join(HERE, 'fixtures'));
    const entry = resolveReference(words, 'words/2026-09-05/2');
    assert.equal(entry.n, 2);
  });

  test('throws unresolved on an absent address', async () => {
    const words = await readWords(path.join(HERE, 'fixtures'));
    assert.throws(
      () => resolveReference(words, 'words/2026-09-05/99'),
      /unresolved words reference 'words\/2026-09-05\/99'/,
    );
  });

  test('throws on a malformed reference', async () => {
    const words = await readWords(path.join(HERE, 'fixtures'));
    assert.throws(
      () => resolveReference(words, 'words/2026-09-05'),
      /malformed words reference/,
    );
  });
});

describe('unreferencedEntries', () => {
  test('returns entries no reference names, in address order', async () => {
    const words = await readWords(path.join(HERE, 'fixtures'));
    const unreferenced = unreferencedEntries(words, ['words/2026-09-05/2']);
    assert.deepEqual(
      unreferenced.map((e) => e.address),
      ['words/2026-09-05/1', 'words/2026-09-05/3', 'words/2026-09-06/1'],
    );
  });
});

describe('formatEntry / parseWordsFile round trip', () => {
  test('reassembling formatted entries reparses to the same shas', async () => {
    const text = await readFile(path.join(FIXTURES, '2026-09-05.md'), 'utf8');
    const entries = parseWordsFile(text, '2026-09-05');
    const rebuilt = entries.map((e) => formatEntry(e)).join('\n\n');
    const reparsed = parseWordsFile(rebuilt, '2026-09-05');
    assert.equal(reparsed.length, entries.length);
    for (let i = 0; i < entries.length; i += 1) {
      assert.equal(reparsed[i].sha, entries[i].sha);
      assert.equal(reparsed[i].context, entries[i].context);
      assert.equal(reparsed[i].text, entries[i].text);
      assert.equal(reparsed[i].n, entries[i].n);
    }
  });

  test("a lone first entry (n === 1) round-trips through formatEntry alone", () => {
    const text = '## 1\n\na single context\n\n> a single quotation\n';
    const [entry] = parseWordsFile(text, '2026-09-01');
    const reparsed = parseWordsFile(formatEntry(entry), '2026-09-01');
    assert.equal(reparsed.length, 1);
    assert.equal(reparsed[0].sha, entry.sha);
  });
});

describe('appendEntry', () => {
  test('numbers the first entry of an empty file 1', () => {
    const { text, n } = appendEntry('', 'a context', 'a quotation');
    assert.equal(n, 1);
    const entries = parseWordsFile(text, '2026-09-01');
    assert.equal(entries.length, 1);
    assert.equal(entries[0].n, 1);
    assert.equal(entries[0].context, 'a context');
    assert.equal(entries[0].text, 'a quotation');
  });

  test('numbers the next entry one past the highest existing ordinal', async () => {
    const existing = await readFile(path.join(FIXTURES, '2026-09-05.md'), 'utf8');
    const { text, n } = appendEntry(existing, 'a fourth question', 'a fourth quotation');
    assert.equal(n, 4);
    const entries = parseWordsFile(text, '2026-09-05');
    assert.equal(entries.length, 4);
    assert.equal(entries[3].n, 4);
    assert.equal(entries[3].address, 'words/2026-09-05/4');
    assert.equal(entries[3].text, 'a fourth quotation');
    // the earlier entries are untouched
    const before = parseWordsFile(existing, '2026-09-05');
    for (let i = 0; i < 3; i += 1) {
      assert.equal(entries[i].sha, before[i].sha);
    }
  });
});
