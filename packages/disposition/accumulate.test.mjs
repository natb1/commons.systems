// packages/disposition/accumulate.test.mjs
//
// Run with: node --test packages/disposition/*.test.mjs
//
// The integration tests build a throwaway git repository under the system
// temp directory, copy the fixture graph into it, commit, and run the fold
// against `--remote HEAD`: the safety condition is that the struck text is
// already reachable from the ref, so a test of the fold that does not commit
// is a test of nothing.
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { cp, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { after, describe, test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

import {
  accumulate, dateInversions, foldable, isReadingHeading, parseArgs,
} from './accumulate.mjs';
import { readGraph } from './read.mjs';
import { validate } from './validate.mjs';

const execFileAsync = promisify(execFile);
const HERE = path.dirname(fileURLToPath(import.meta.url));
const FIXTURE = path.join(HERE, 'fixtures', 'accumulate');

const temps = [];
after(async () => {
  for (const dir of temps) await rm(dir, { recursive: true, force: true });
});

/** A throwaway git repo holding a copy of the fixture graph, committed. */
async function repo() {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'accumulate-'));
  temps.push(dir);
  await cp(FIXTURE, dir, { recursive: true });
  const git = (...args) => execFileAsync('git', [
    '-C', dir,
    '-c', 'user.name=fixture',
    '-c', 'user.email=fixture@example.test',
    '-c', 'commit.gpgsign=false',
    ...args,
  ]);
  await git('init', '--quiet');
  await git('add', '-A');
  await git('commit', '--quiet', '-m', 'fixture');
  const { stdout } = await git('rev-parse', 'HEAD');
  return { dir, sha: stdout.trim(), git };
}

async function nodeById(dir, id) {
  const graph = await readGraph(dir);
  return graph.nodes.find((n) => n.id === id);
}

const FOLDS = 'example.test/main/folds';

describe('foldable', () => {
  test('a node with no account folds nothing', () => {
    assert.deepEqual(foldable({}), []);
    assert.deepEqual(foldable({ account: null }), []);
    assert.deepEqual(foldable({ account: '   ' }), []);
  });

  test('a node no reading has read folds nothing', async () => {
    const node = await nodeById(FIXTURE, 'example.test/main/no-reading');
    assert.deepEqual(foldable(node), []);
  });

  test('every section before the last reading, and the offsets slice it out', async () => {
    const node = await nodeById(FIXTURE, FOLDS);
    const folds = foldable(node);
    assert.deepEqual(folds.map((f) => f.heading), [
      'Minted, 2026-09-01',
      'Clean-context review, 2026-09-02, of 1111111111111111111111111111111111111111',
      'Amended after the reading, 2026-09-03',
    ]);
    assert.deepEqual(folds.map((f) => f.kind), ['account', 'account', 'account']);
    assert.deepEqual(folds.map((f) => f.date), ['2026-09-01', '2026-09-02', '2026-09-03']);
    for (const f of folds) {
      const text = node.account.slice(f.start, f.end);
      assert.equal(text.split('\n')[0], `### ${f.heading}`);
    }
    // the last reading's section and everything after it stays
    const struck = folds.map((f) => node.account.slice(f.start, f.end)).join('');
    assert.ok(!struck.includes('Clean-context re-reading, 2026-09-04'));
    assert.ok(!struck.includes('Reply to the re-reading'));
  });

  test('a heading inside a fence is not a section and not a reading', async () => {
    const node = await nodeById(FIXTURE, 'example.test/main/fenced');
    const folds = foldable(node);
    assert.deepEqual(folds.map((f) => f.heading), ['Minted, 2026-09-01']);
    // the fenced example heading travels with the section that quotes it
    assert.ok(node.account.slice(folds[0].start, folds[0].end).includes('2026-09-09'));
  });

  test('the manifest section is never folded', async () => {
    const node = await nodeById(FIXTURE, 'example.test/main/manifest-already');
    assert.deepEqual(foldable(node).map((f) => f.heading), ['Note on the reading, 2026-09-05']);
  });
});

describe('dateInversions', () => {
  const account = (...headings) => headings.flatMap((h) => [`### ${h}`, '', 'body', '']);

  test('silent where the account is in order', () => {
    assert.deepEqual(dateInversions(account(
      'Minted, 2026-09-01',
      'Amended, 2026-09-02',
      'Clean-context review, 2026-09-05, of 1111',
      'Reply, 2026-09-06',
    )), []);
  });

  test('names a section standing before a reading older than it is', () => {
    const found = dateInversions(account(
      'Minted, 2026-09-01',
      'Amended, 2026-09-09',
      'Clean-context review, 2026-09-05, of 1111',
    ));
    assert.deepEqual(found.map((r) => r.heading), ['Amended, 2026-09-09']);
    assert.match(found[0].reason, /dated 2026-09-09, later than .* 2026-09-05/);
  });

  test('reads the LAST reading, and says nothing about what stays', () => {
    // 09-09 precedes the last reading and is later than it: an inversion.
    // 09-08 follows it and is never a candidate, late as it is.
    const found = dateInversions(account(
      'Clean-context review, 2026-09-02, of 1111',
      'Amended, 2026-09-09',
      'Clean-context review, 2026-09-05, of 2222',
      'Amended again, 2026-09-08',
    ));
    assert.deepEqual(found.map((r) => r.heading), ['Amended, 2026-09-09']);
  });

  test('silent where either heading carries no date', () => {
    assert.deepEqual(dateInversions(account(
      'Amended',
      'Clean-context review, 2026-09-05, of 1111',
    )), []);
    // a reading heading with no date is not a reading at all, so nothing folds
    assert.deepEqual(dateInversions(account(
      'Amended, 2026-09-09',
      'Clean-context review',
    )), []);
  });

  test('silent where no reading has read the node', () => {
    assert.deepEqual(dateInversions(account('Minted, 2026-09-01')), []);
    assert.deepEqual(dateInversions([]), []);
  });

  test('never fires on the manifest, whose fold lines carry dates of their own', () => {
    // the manifest heading carries no date, and the later dates in its body
    // are the folded sections' and not the manifest's
    assert.deepEqual(dateInversions([
      '### Manifest',
      '',
      '- Folded: Amended, 2026-09-09, at 1111',
      '',
      '### Clean-context review, 2026-09-05, of 2222',
      '',
      'body',
    ]), []);
  });
});

describe('isReadingHeading', () => {
  test('accepts the forms the record has actually written', () => {
    for (const h of [
      'Clean-context review, 2026-09-03',
      'Clean-context review, 2026-09-05, of 8f2c1d4a',
      'Clean-context re-reading, 2026-09-07, of 8f2c1d4a (ii)',
      'Clean-context review of the amendment, 2026-09-03',
      'Clean-context review, 2026-09-03 (second reading)',
    ]) assert.ok(isReadingHeading(h), h);
  });

  test('rejects a heading that is not a reading, and one with no date', () => {
    for (const h of [
      'Minted, 2026-09-01',
      'Amended by the clean-context reading of d35b0014',
      'Frontier finding, 2026-09-04',
      'Clean-context review',
      'Manifest',
    ]) assert.ok(!isReadingHeading(h), h);
  });
});

describe('accumulate', () => {
  test('folds, writes one manifest line per struck section, and keeps the rest', async () => {
    const { dir, sha } = await repo();
    const report = await accumulate(dir, { remote: 'HEAD' });

    assert.equal(report.commit, sha);
    assert.equal(report.summary.nodesFolded, 3); // folds, fenced, manifest-already
    assert.equal(report.summary.nodesRefused, 1); // out-of-order
    assert.equal(report.summary.sectionsFolded, 5);
    assert.ok(report.summary.bytesStruck > 0);

    const text = await readFile(path.join(dir, 'main', 'folds.md'), 'utf8');
    const account = text.slice(text.indexOf('## Account'));
    assert.equal(account.split('\n')[2], '### Manifest');
    assert.deepEqual(
      account.split('\n').filter((l) => l.startsWith('- Folded:')),
      [
        `- Folded: Minted, 2026-09-01, at ${sha}`,
        `- Folded: Clean-context review, 2026-09-02, of 1111111111111111111111111111111111111111, at ${sha}`,
        `- Folded: Amended after the reading, 2026-09-03, at ${sha}`,
      ],
    );
    assert.ok(!account.includes('Minted in the sitting of that day'));
    assert.ok(account.includes('### Clean-context re-reading, 2026-09-04, of 2222'));
    assert.ok(account.includes('### Reply to the re-reading, 2026-09-05'));
    assert.ok(account.includes('Nothing was owed;'));
    // the frontmatter and every other section are untouched
    assert.ok(text.startsWith('---\nquestion: What does the fold strike'));
    assert.ok(text.includes('\n## Answer\n\nEvery account section before'));
    assert.ok(text.endsWith('\n'));
  });

  test('a node with no account and a node with no reading are not rewritten', async () => {
    const { dir } = await repo();
    const before = await Promise.all(['no-account.md', 'no-reading.md']
      .map((f) => readFile(path.join(dir, 'main', f), 'utf8')));
    const report = await accumulate(dir, { remote: 'HEAD' });
    const after_ = await Promise.all(['no-account.md', 'no-reading.md']
      .map((f) => readFile(path.join(dir, 'main', f), 'utf8')));
    assert.deepEqual(after_, before);
    const ids = report.nodes.map((n) => n.id);
    assert.ok(!ids.includes('example.test/main/no-account'));
    assert.ok(!ids.includes('example.test/main/no-reading'));
  });

  test('a node whose sections are out of order is refused whole', async () => {
    const { dir } = await repo();
    const file = path.join(dir, 'main', 'out-of-order.md');
    const before = await readFile(file, 'utf8');
    const report = await accumulate(dir, { remote: 'HEAD' });
    assert.equal(await readFile(file, 'utf8'), before);

    const node = report.nodes.find((n) => n.id === 'example.test/main/out-of-order');
    assert.deepEqual(node.folded, []);
    // the reachability guard sees nothing wrong: the text IS on the ref
    assert.deepEqual(node.refused.map((r) => r.heading), ['Amended, 2026-09-09']);
    assert.match(node.refused[0].reason, /not appended/);
    // and the section that would have folded cleanly is spared with it
    assert.ok(before.includes('### Minted, 2026-09-01'));
  });

  test('a second manifest line goes under the heading the first fold wrote', async () => {
    const { dir, sha } = await repo();
    await accumulate(dir, { remote: 'HEAD' });
    const text = await readFile(path.join(dir, 'main', 'manifest-already.md'), 'utf8');
    assert.deepEqual(
      text.split('\n').filter((l) => l.startsWith('- Folded:')),
      [
        '- Folded: Minted, 2026-09-01, at 5555555555555555555555555555555555555555',
        `- Folded: Note on the reading, 2026-09-05, at ${sha}`,
      ],
    );
    assert.equal((text.match(/^### Manifest$/gm) || []).length, 1);
  });

  test('the account preamble stays, above the manifest', async () => {
    const { dir } = await repo();
    await accumulate(dir, { remote: 'HEAD' });
    const text = await readFile(path.join(dir, 'main', 'fenced.md'), 'utf8');
    const account = text.slice(text.indexOf('## Account'));
    assert.ok(account.indexOf('belonging to no section') < account.indexOf('### Manifest'));
    assert.ok(account.includes('### Clean-context review, 2026-09-02, of 4444'));
    assert.ok(!account.includes('That block is an example'));
  });

  test('is idempotent: the second run changes no byte and folds nothing', async () => {
    const { dir, git } = await repo();
    const files = ['folds.md', 'fenced.md', 'manifest-already.md', 'no-reading.md',
      'no-account.md', 'out-of-order.md'];
    await accumulate(dir, { remote: 'HEAD' });
    const once = await Promise.all(files.map((f) => readFile(path.join(dir, 'main', f), 'utf8')));

    // The fold is idempotent against the ref the first fold's text is in, so
    // the second run is asked over a commit that holds the folded files.
    await git('add', '-A');
    await git('commit', '--quiet', '-m', 'folded');

    const second = await accumulate(dir, { remote: 'HEAD' });
    assert.equal(second.summary.sectionsFolded, 0);
    assert.equal(second.summary.nodesFolded, 0);
    // the out-of-order node is refused on every run, which is the point: a
    // refusal is a standing report and not a one-off the second run forgets
    assert.equal(second.summary.nodesRefused, 1);
    const twice = await Promise.all(files.map((f) => readFile(path.join(dir, 'main', f), 'utf8')));
    assert.deepEqual(twice, once);
  });

  test('refuses a node whose section text is not at the ref, and folds nothing on it', async () => {
    const { dir } = await repo();
    const file = path.join(dir, 'main', 'folds.md');
    const before = await readFile(file, 'utf8');
    await writeFile(file, before.replace('Minted in the sitting of that day, from the author\'s words.',
      'Minted in the sitting of that day, from words written since the push.'), 'utf8');
    const edited = await readFile(file, 'utf8');

    const report = await accumulate(dir, { remote: 'HEAD' });
    assert.equal(await readFile(file, 'utf8'), edited);
    const entry = report.nodes.find((n) => n.id === FOLDS);
    assert.deepEqual(entry.folded, []);
    assert.equal(entry.refused.length, 1);
    assert.match(entry.refused[0].reason, /not byte-for-byte/);
    assert.equal(entry.bytesBefore, entry.bytesAfter);
    assert.equal(report.summary.nodesRefused, 2); // and out-of-order
    // the other nodes still fold: the refusal is per node
    assert.equal(report.summary.nodesFolded, 2);
  });

  test('a node minted since the push is refused, not folded', async () => {
    const { dir } = await repo();
    const minted = path.join(dir, 'main', 'minted.md');
    const source = await readFile(path.join(dir, 'main', 'folds.md'), 'utf8');
    await writeFile(minted, source.replace(
      'What does the fold strike from a node that has been read twice?',
      'What does the fold strike from a node minted since the push?',
    ), 'utf8');
    const report = await accumulate(dir, { remote: 'HEAD' });
    const entry = report.nodes.find((n) => n.id === 'example.test/main/minted');
    assert.deepEqual(entry.folded, []);
    assert.equal(entry.refused.length, 3);
    assert.match(entry.refused[0].reason, /no main\/minted\.md at HEAD/);
    assert.equal(await readFile(minted, 'utf8'), source.replace(
      'What does the fold strike from a node that has been read twice?',
      'What does the fold strike from a node minted since the push?',
    ));
  });

  test('--dry writes nothing and reports what it would strike', async () => {
    const { dir } = await repo();
    const file = path.join(dir, 'main', 'folds.md');
    const before = await readFile(file, 'utf8');
    const report = await accumulate(dir, { remote: 'HEAD', dry: true });
    assert.equal(report.dry, true);
    assert.equal(await readFile(file, 'utf8'), before);
    assert.equal(report.summary.sectionsFolded, 5);
    assert.ok(report.summary.bytesStruck > 0);
    const entry = report.nodes.find((n) => n.id === FOLDS);
    assert.ok(entry.bytesAfter < entry.bytesBefore);
  });

  test('--nodes restricts the run and rejects a name matching nothing', async () => {
    const { dir } = await repo();
    const report = await accumulate(dir, { remote: 'HEAD', nodes: ['folds'] });
    assert.deepEqual(report.nodes.map((n) => n.id), [FOLDS]);
    assert.equal(report.summary.nodesRead, 1);
    const fenced = await readFile(path.join(dir, 'main', 'fenced.md'), 'utf8');
    assert.ok(fenced.includes('That block is an example'));
    await assert.rejects(
      () => accumulate(dir, { remote: 'HEAD', nodes: ['no-such-node'] }),
      /no node named no-such-node/,
    );
  });

  test('--nodes takes a full id as well as a slug', async () => {
    const { dir } = await repo();
    const report = await accumulate(dir, { remote: 'HEAD', nodes: [FOLDS, 'main/fenced'], dry: true });
    assert.deepEqual(report.nodes.map((n) => n.id).sort(), [
      'example.test/main/fenced', FOLDS,
    ].sort());
  });

  test('a bad ref fails rather than folding', async () => {
    const { dir } = await repo();
    await assert.rejects(() => accumulate(dir, { remote: 'no/such/ref' }));
    const text = await readFile(path.join(dir, 'main', 'folds.md'), 'utf8');
    assert.ok(text.includes('Minted in the sitting of that day'));
  });

  test('the folded graph still validates, and the fold moves no hash', async () => {
    const { dir } = await repo();
    const before = await readGraph(dir);
    const beforeHashes = new Map(before.nodes.map((n) => [n.id, n.recommendationHash]));
    const beforeStanding = new Map(before.nodes.map((n) => [n.id, n.standingHash]));

    await accumulate(dir, { remote: 'HEAD' });

    const result = await validate(dir);
    assert.equal(result.ok, true, result.message);
    assert.equal(result.message, 'ok: 6 nodes');
    const after_ = await readGraph(dir);
    for (const n of after_.nodes) {
      assert.equal(n.recommendationHash, beforeHashes.get(n.id), n.id);
      assert.equal(n.standingHash, beforeStanding.get(n.id), n.id);
    }
    // and the fold left nothing else in the report's way
    assert.deepEqual(after_.findings, before.findings);
  });
});

describe('parseArgs', () => {
  test('defaults the ref to origin/disposition', () => {
    const args = parseArgs(['disposition']);
    assert.equal(args.graphDir, 'disposition');
    assert.equal(args.remote, 'origin/disposition');
    assert.equal(args.dry, false);
    assert.equal(args.nodes, null);
    assert.equal(args.report, null);
  });

  test('reads the flags it has', () => {
    const args = parseArgs(['g', '--dry', '--nodes', 'a, b', '--remote', 'r', '--report', 'f.json']);
    assert.deepEqual(args, {
      graphDir: 'g', nodes: ['a', 'b'], dry: true, remote: 'r', report: 'f.json',
    });
  });

  test('refuses --absorb, and any flag that would select sections', () => {
    assert.throws(() => parseArgs(['g', '--absorb']), /absorption is not this instrument/);
    assert.throws(() => parseArgs(['g', '--sections', 'x']), /unknown flag --sections/);
    assert.throws(() => parseArgs(['g', '--remote']), /--remote needs a value/);
    assert.throws(() => parseArgs([]), /usage:/);
    assert.throws(() => parseArgs(['a', 'b']), /unexpected argument b/);
  });
});
