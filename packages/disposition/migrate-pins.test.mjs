// migrate-pins.test.mjs -- the one act that carries the pins the record
// already holds into the narrowed hash.
//
// `a-pin-moves-on-what-binds-the-node`: "The pins the record already carries
// are migrated once and in the same act: a pin whose recorded hash is the
// node's hash in the old form is rewritten to the new form, nothing the
// reader read having changed, and a pin already stale in the old form stays
// stale, so the node is judged exactly as it would have been."
//
// So the tests are that sentence's three claims: a current pin moves, a
// stale one does not, and nothing else in the file moves at all.

import assert from 'node:assert/strict';
import { cp, mkdtemp, readFile, stat, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { before, describe, test } from 'node:test';

import {
  deriveFactRecommendationHash,
  deriveLegacyFactRecommendationHash,
  deriveLegacyRecommendationHash,
  deriveRecommendationHash,
} from './derive.mjs';
import { fateOf, migratePins, parseArgs, summarize } from './migrate-pins.mjs';
import { readGraph } from './read.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const CONTENT_DIR = path.join(HERE, 'fixtures', 'content');
// The scratch this unit was given; `mkdtemp` under it, never beside the
// record.
const SCRATCH = '/home/n8/.claude/jobs/55639327/tmp';

const STALE = 'a'.repeat(40);

/**
 * A copy of the content fixture graph with pins written into it in the old
 * form: on `ladder`, a draft review and a survey both pinning the node's
 * old-form hash; on `two-wholes`, a draft review pinning nothing the record
 * ever computed; on `confirmed`, a ruling pinning the answer fact's own
 * old-form hash. Returns the directory and everything a test needs to say
 * what should have happened to it.
 */
async function fixtureGraph() {
  const dir = await mkdtemp(path.join(SCRATCH, 'migrate-pins-'));
  await cp(CONTENT_DIR, dir, { recursive: true });

  const graph = await readGraph(dir);
  const bySlug = new Map(graph.nodes.map((n) => [n.slug, n]));
  const want = new Map();
  for (const [slug, node] of bySlug) {
    want.set(slug, {
      old: deriveLegacyRecommendationHash(node),
      new: deriveRecommendationHash(node),
      oldFact: deriveLegacyFactRecommendationHash(node, node.facts[0]),
      newFact: deriveFactRecommendationHash(node, node.facts[0]),
      file: path.join(dir, node.path),
    });
  }

  // A review block is no part of what the content encoding hashes, so
  // writing one in does not move the hash it is about to pin.
  const review = (of, surveyOf) => [
    'review:',
    '  verdict: forward',
    '  strength: moderate',
    '  date: 2026-09-07',
    `  of: ${of}`,
    ...(surveyOf === null ? [] : ['  survey:', '    date: 2026-09-07', `    of: ${surveyOf}`]),
    '',
  ].join('\n');

  const insert = async (slug, block) => {
    const file = want.get(slug).file;
    const text = await readFile(file, 'utf8');
    await writeFile(file, text.replace('facts:\n', `${block}facts:\n`));
  };

  await insert('ladder', review(want.get('ladder').old, want.get('ladder').old));
  await insert('two-wholes', review(STALE, STALE));
  // The legacy-encoded node beside them: its two forms are one hash, so its
  // pin is already in the new form and there is nothing to rewrite.
  await insert('legacy-beside', review(want.get('legacy-beside').new, null));

  const confirmed = want.get('confirmed');
  const confirmedText = await readFile(confirmed.file, 'utf8');
  await writeFile(
    confirmed.file,
    confirmedText.replace(/of: "[0-9a-f]{40}"/, `of: "${confirmed.oldFact}"`),
  );

  const sidecarPath = path.join(dir, 'survey.pins.json');
  await writeFile(sidecarPath, `${JSON.stringify({
    commit: 'e'.repeat(40),
    dirty: false,
    date: '2026-09-07',
    judged: ['example.test/main/ladder'],
    pins: {
      'example.test/main/ladder': want.get('ladder').old,
      'example.test/main/two-wholes': STALE,
      'example.test/main/confirmed': want.get('confirmed').old,
      'example.test/main/gone': STALE,
    },
    read: [{ id: 'example.test/main/two-wholes', text: { question: 'f'.repeat(64) } }],
  }, null, 2)}\n`);

  return { dir, want, sidecarPath };
}

describe('parseArgs', () => {
  test('a directory, an optional sidecar and an optional --dry', () => {
    assert.deepEqual(parseArgs(['disposition']), { dir: 'disposition', sidecar: null, dry: false });
    assert.deepEqual(
      parseArgs(['disposition', '--sidecar', 'tmp/review/survey.pins.json', '--dry']),
      { dir: 'disposition', sidecar: 'tmp/review/survey.pins.json', dry: true },
    );
    assert.throws(() => parseArgs([]), /usage:/);
    assert.throws(() => parseArgs(['a', 'b']), /unexpected argument 'b'/);
    assert.throws(() => parseArgs(['a', '--nope']), /unknown flag '--nope'/);
    assert.throws(() => parseArgs(['a', '--sidecar']), /--sidecar needs a path/);
  });
});

describe('fateOf', () => {
  test('the three fates and the absence of a pin', () => {
    assert.equal(fateOf(null, 'old', 'new'), null);
    assert.equal(fateOf(undefined, 'old', 'new'), null);
    assert.equal(fateOf('old', 'old', 'new'), 'rewritten');
    assert.equal(fateOf('new', 'old', 'new'), 'current');
    assert.equal(fateOf(STALE, 'old', 'new'), 'stale');
    assert.equal(fateOf('same', 'same', 'same'), 'current', 'a node whose two forms coincide has nothing to migrate');
  });
});

describe('migratePins on a fixture graph', () => {
  let fixture = null;
  let counts = null;

  before(async () => {
    fixture = await fixtureGraph();
    ({ counts } = await migratePins({ dir: fixture.dir, sidecar: fixture.sidecarPath }));
  });

  test('a pin that was current in the old form is rewritten to the new one', async () => {
    const ladder = fixture.want.get('ladder');
    const text = await readFile(ladder.file, 'utf8');
    assert.match(text, new RegExp(`^  of: ${ladder.new}$`, 'm'), 'the draft review');
    assert.match(text, new RegExp(`^    of: ${ladder.new}$`, 'm'), 'and the survey beside it');
    assert.equal(text.includes(ladder.old), false, 'and the old form is gone from the file');
    assert.equal(counts.review >= 1 && counts.survey >= 1, true);
  });

  test("the rewritten node reads as unmoved: what the reader read did not change", async () => {
    const graph = await readGraph(fixture.dir);
    const ladder = graph.nodes.find((n) => n.slug === 'ladder');
    assert.equal(ladder.reviewStale, false);
    assert.equal(ladder.surveyStale, false);
    assert.equal(ladder.review.of, ladder.recommendationHash);
  });

  test('a pin already stale in the old form stays exactly as it stood', async () => {
    const two = fixture.want.get('two-wholes');
    const text = await readFile(two.file, 'utf8');
    assert.match(text, new RegExp(`^  of: ${STALE}$`, 'm'));
    assert.match(text, new RegExp(`^    of: ${STALE}$`, 'm'));
    assert.equal(text.includes(two.new), false, 'nothing was written onto it');
    assert.equal(counts.stale.review >= 1 && counts.stale.survey >= 1, true);
  });

  test("a ruling's pin is migrated on its own fact's hash", async () => {
    const confirmed = fixture.want.get('confirmed');
    const text = await readFile(confirmed.file, 'utf8');
    // `repinDialogue` writes the record's canonical literal, which quotes a
    // hash only where an all-digit one would parse as an integer.
    assert.match(text, new RegExp(`^          of: "?${confirmed.newFact}"?$`, 'm'));
    assert.equal(text.includes(confirmed.oldFact), false);
    assert.equal(counts.ruling, 1);
  });

  test('a legacy-encoded node, whose two forms are one hash, is left alone', async () => {
    const legacy = fixture.want.get('legacy-beside');
    assert.equal(legacy.old, legacy.new, 'the narrowing did not touch the legacy encoding');
    const text = await readFile(legacy.file, 'utf8');
    assert.match(text, new RegExp(`^  of: ${legacy.new}$`, 'm'));
  });

  test('the file is byte-identical outside the values that moved', async () => {
    const ladder = fixture.want.get('ladder');
    const after = await readFile(ladder.file, 'utf8');
    const restored = after.split(ladder.new).join(ladder.old);
    // The same file rebuilt from the fixture, with the same block written in.
    const fresh = await fixtureGraph();
    const before = await readFile(fresh.want.get('ladder').file, 'utf8');
    assert.equal(restored, before, 'only the two hashes moved; every other byte is the byte it was');
  });

  test("the sidecar's pins are rewritten and its text hashes are not", async () => {
    const sidecar = JSON.parse(await readFile(fixture.sidecarPath, 'utf8'));
    assert.equal(sidecar.pins['example.test/main/ladder'], fixture.want.get('ladder').new);
    assert.equal(sidecar.pins['example.test/main/confirmed'], fixture.want.get('confirmed').new);
    assert.equal(sidecar.pins['example.test/main/two-wholes'], STALE, 'a stale sidecar pin stays stale');
    assert.equal(sidecar.pins['example.test/main/gone'], STALE, 'and a pin on a node the graph no longer carries');
    assert.deepEqual(sidecar.read, [{ id: 'example.test/main/two-wholes', text: { question: 'f'.repeat(64) } }]);
    assert.equal(sidecar.commit, 'e'.repeat(40), 'and the rest of the sidecar is untouched');
    assert.equal(counts.sidecar, 2);
    assert.equal(counts.stale.sidecar, 2);
  });

  test('running it a second time moves nothing: every pin is already in the new form', async () => {
    const again = await migratePins({ dir: fixture.dir, sidecar: fixture.sidecarPath });
    assert.equal(again.counts.review, 0);
    assert.equal(again.counts.survey, 0);
    assert.equal(again.counts.ruling, 0);
    assert.equal(again.counts.sidecar, 0);
    assert.equal(again.counts.files, 0);
  });

  test('the summary names the nodes scanned and the pins by kind', () => {
    const said = summarize(counts, { dry: false }).join('\n');
    assert.match(said, /^nodes scanned: 4$/m);
    assert.match(said, /^pins rewritten: \d+ \(review 1, survey 1, ruling 1, sidecar 2\)$/m);
    assert.match(said, /^pins left stale: \d+ \(review 1, survey 1, ruling 0, sidecar 2\)$/m);
  });
});

describe('migratePins --dry', () => {
  test('writes nothing, and says what it would have written', async () => {
    const fixture = await fixtureGraph();
    const files = [...fixture.want.values()].map((w) => w.file).concat(fixture.sidecarPath);
    const before = new Map();
    for (const file of files) {
      before.set(file, { text: await readFile(file, 'utf8'), mtime: (await stat(file)).mtimeMs });
    }

    const { counts, lines } = await migratePins({ dir: fixture.dir, sidecar: fixture.sidecarPath, dry: true });
    assert.equal(counts.review, 1);
    assert.equal(counts.survey, 1);
    assert.equal(counts.ruling, 1);
    assert.equal(counts.sidecar, 2);
    assert.equal(counts.files, 2, 'two node files carry a pin that moves: ladder and confirmed');
    assert.match(lines.join('\n'), /repin {2}example\.test\/main\/ladder: review\.of/);
    assert.match(lines.join('\n'), /stale {2}example\.test\/main\/two-wholes: review pin/);
    assert.match(summarize(counts, { dry: true }).join('\n'), /^dry run: nothing was written$/m);

    for (const file of files) {
      assert.equal(await readFile(file, 'utf8'), before.get(file).text, `${file} is untouched`);
      assert.equal((await stat(file)).mtimeMs, before.get(file).mtime, `${file} was not even rewritten in place`);
    }
  });
});

describe('migratePins with no sidecar', () => {
  test('the node files are migrated and nothing else is asked for', async () => {
    const fixture = await fixtureGraph();
    const { counts } = await migratePins({ dir: fixture.dir });
    assert.equal(counts.sidecar, 0);
    assert.equal(counts.review, 1);
    const sidecar = JSON.parse(await readFile(fixture.sidecarPath, 'utf8'));
    assert.equal(sidecar.pins['example.test/main/ladder'], fixture.want.get('ladder').old, 'left where it was');
  });
});

// A note on the scratch: `os.tmpdir()` is not used, because this unit was
// given one directory to write in and writes nowhere else.
void os;
