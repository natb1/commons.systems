// packages/disposition/read.test.mjs
//
// Run with: node --test packages/disposition/*.test.mjs
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { cp, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { after, describe, test } from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  blobSha1,
  canonicalizeId,
  deriveCeiling,
  deriveChildren,
  deriveRank,
  deriveStatus,
} from './derive.mjs';
import { parseNode, readGraph } from './read.mjs';
import { validate } from './validate.mjs';
import { ratify } from './ratify.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const FIXTURES = path.join(HERE, 'fixtures');
const VALID_DIR = path.join(FIXTURES, 'valid');
const READ_MJS = path.join(HERE, 'read.mjs');
const VALIDATE_MJS = path.join(HERE, 'validate.mjs');
const RATIFY_MJS = path.join(HERE, 'ratify.mjs');

// os.tmpdir() may be unset in this sandbox; when a job scratch dir is
// available, prefer it over an empty os.tmpdir().
function tmpBase() {
  const jobDir = process.env.CLAUDE_JOB_DIR;
  return jobDir ? path.join(jobDir, 'tmp') : os.tmpdir();
}
const tmpDirs = [];
async function freshTmpDir(prefix) {
  const dir = await mkdtemp(path.join(tmpBase(), prefix));
  tmpDirs.push(dir);
  return dir;
}
async function makeTmpCopy() {
  const dir = await freshTmpDir('disposition-ratify-');
  await cp(VALID_DIR, dir, { recursive: true });
  return dir;
}
after(async () => {
  await Promise.all(tmpDirs.map((d) => import('node:fs/promises').then((fs) => fs.rm(d, { recursive: true, force: true }))));
});

function runCli(scriptPath, args) {
  try {
    const stdout = execFileSync(process.execPath, [scriptPath, ...args], { encoding: 'utf8' });
    return { stdout, stderr: '', status: 0 };
  } catch (err) {
    return { stdout: err.stdout ?? '', stderr: err.stderr ?? '', status: err.status };
  }
}

// ---------------------------------------------------------------------------
// derive.mjs
// ---------------------------------------------------------------------------

describe('derive.mjs', () => {
  test('blobSha1 matches git hash-object (empty blob and a known constant)', () => {
    assert.equal(blobSha1(Buffer.from('')), 'e69de29bb2d1d6434b8b29ae775ad8c2e48c5391');
    assert.equal(blobSha1(Buffer.from('hello\n')), 'ce013625030ba8dba906f756967f9e9ca394464a');
  });

  test('blobSha1 hashes exact bytes, independent of node:crypto call shape', () => {
    const bytes = Buffer.from('unicode: café\n', 'utf8');
    const expected = createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex');
    assert.equal(blobSha1(bytes), expected);
  });

  test('canonicalizeId rewrites a target-prefixed id to local form; local ids pass through', () => {
    const manifest = { module: 'example.test', graphs: { pub: { target: 'pub.example/pub' }, main: {} } };
    assert.equal(canonicalizeId('pub.example/pub/note', manifest), 'example.test/pub/note');
    assert.equal(canonicalizeId('pub.example/pub', manifest), 'example.test/pub');
    assert.equal(canonicalizeId('example.test/main/x', manifest), 'example.test/main/x');
  });

  test('deriveChildren sorts children and rejects an unresolved parent', () => {
    const nodes = [{ id: 'a', under: [] }, { id: 'b', under: ['a'] }, { id: 'c', under: ['a'] }];
    const children = deriveChildren(nodes);
    assert.deepEqual(children.get('a'), ['b', 'c']);
    assert.deepEqual(children.get('b'), []);
    assert.throws(() => deriveChildren([{ id: 'x', under: ['missing'] }]), /unresolved/);
  });

  test('deriveRank throws a cycle error carrying the involved ids', () => {
    const nodes = [{ id: 'a', under: ['b'] }, { id: 'b', under: ['a'] }];
    assert.throws(() => deriveRank(nodes), (err) => {
      assert.match(err.message, /cycle/);
      assert.deepEqual([...err.cycleIds].sort(), ['a', 'b']);
      return true;
    });
  });

  test('deriveRank splits a root among children in proportion to boost', () => {
    const nodes = [
      { id: 'root', under: [] },
      { id: 'heavy', under: ['root'], boost: 3 },
      { id: 'light', under: ['root'] },
    ];
    const rank = deriveRank(nodes);
    assert.equal(rank.get('root'), 1);
    assert.equal(rank.get('heavy'), 0.75);
    assert.equal(rank.get('light'), 0.25);
  });

  test('deriveCeiling finds the nearest ratified ancestor, breadth first, ties by id', () => {
    const nodesById = new Map([
      ['root', { id: 'root', under: [], authority: { class: 'ratified' } }],
      ['mid', { id: 'mid', under: ['root'], authority: null }],
      ['leaf', { id: 'leaf', under: ['mid'], authority: null }],
      ['unrelated-root', { id: 'unrelated-root', under: [], authority: null }],
    ]);
    assert.equal(deriveCeiling('leaf', nodesById), 'root');
    assert.equal(deriveCeiling('root', nodesById), null, "a node's own authority is not its own ceiling");
    assert.equal(deriveCeiling('unrelated-root', nodesById), null);
  });

  test('deriveStatus reads the stamp, then answer-without-stamp, then question', () => {
    assert.equal(deriveStatus({ authority: { class: 'ratified' }, answer: 'x' }), 'ratified');
    assert.equal(deriveStatus({ authority: { class: 'deferred' }, answer: null }), 'deferred');
    assert.equal(deriveStatus({ authority: null, answer: 'x' }), 'proposal');
    assert.equal(deriveStatus({ authority: null, answer: null }), 'question');
  });
});

// ---------------------------------------------------------------------------
// parseNode
// ---------------------------------------------------------------------------

describe('parseNode', () => {
  const loc = { id: 'm/g/s', graph: 'g', slug: 's', path: 'g/s.md' };

  test('parses a minimal unanswered question', () => {
    const node = parseNode('---\nquestion: What?\n---\n', loc);
    assert.equal(node.question, 'What?');
    assert.equal(node.answer, null);
    assert.equal(node.form, null);
    assert.deepEqual(node.under, []);
    assert.deepEqual(node.cites, []);
  });

  test('rejects a file with no frontmatter delimiter', () => {
    assert.throws(
      () => parseNode('question: What?\n', loc),
      /frontmatter delimiter/,
    );
  });

  test('rejects unclosed frontmatter', () => {
    assert.throws(
      () => parseNode('---\nquestion: What?\n', loc),
      /never closed/,
    );
  });

  test('collects multiple problems from one file, not just the first', () => {
    const text = '---\nbogus: 1\nform: reading\n---\n\n## Answer\n\nx\n';
    assert.throws(() => parseNode(text, loc), (err) => {
      const lines = err.message.split('\n');
      assert.ok(lines.some((l) => l.includes("unknown frontmatter key 'bogus'")));
      assert.ok(lines.some((l) => l.includes("'question' is required")));
      assert.ok(lines.some((l) => l.includes("'source' is required")));
      assert.ok(lines.some((l) => l.includes("'relation' is required")));
      assert.ok(lines.every((l) => l.startsWith('g/s.md: ')));
      return true;
    });
  });
});

// ---------------------------------------------------------------------------
// readGraph: valid fixture
// ---------------------------------------------------------------------------

describe('readGraph: valid fixture', () => {
  const graphPromise = readGraph(VALID_DIR);

  test('loads without throwing and returns 8 nodes sorted by id', async () => {
    const graph = await graphPromise;
    const ids = graph.nodes.map((n) => n.id);
    assert.deepEqual(ids, [...ids].sort());
    assert.deepEqual(ids, [
      'example.test/main/child-a1',
      'example.test/main/child-a2',
      'example.test/main/multi',
      'example.test/main/reading',
      'example.test/main/root-a',
      'example.test/main/root-b',
      'example.test/pub/note',
      'example.test/pub/note2',
    ]);
  });

  test('module/ref/graphs pass through from the manifest', async () => {
    const graph = await graphPromise;
    assert.equal(graph.module, 'example.test');
    assert.equal(graph.ref, 'disposition');
    assert.ok(graph.graphs.main);
    assert.equal(graph.graphs.pub.target, 'pub.example/pub');
  });

  async function byId(id) {
    const graph = await graphPromise;
    const node = graph.nodes.find((n) => n.id === id);
    assert.ok(node, `expected a node with id ${id}`);
    return node;
  }

  test('rank: exact per-node numbers', async () => {
    assert.equal((await byId('example.test/main/root-a')).rank, 0.25);
    assert.equal((await byId('example.test/main/root-b')).rank, 0.5);
    assert.equal((await byId('example.test/pub/note')).rank, 0.25);
    assert.equal((await byId('example.test/main/child-a1')).rank, 0.125);
    assert.equal((await byId('example.test/main/child-a2')).rank, 0.125);
    assert.equal((await byId('example.test/main/multi')).rank, 0.625);
    assert.equal((await byId('example.test/main/reading')).rank, 0.625);
    assert.equal((await byId('example.test/pub/note2')).rank, 0.25);
  });

  test('ceiling: nearest ratified ancestor across a multi-parent join, or null', async () => {
    assert.equal((await byId('example.test/main/root-a')).ceiling, null);
    assert.equal((await byId('example.test/main/root-b')).ceiling, null, 'ratified is not its own ceiling');
    assert.equal((await byId('example.test/pub/note')).ceiling, null);
    assert.equal((await byId('example.test/main/child-a1')).ceiling, null);
    assert.equal((await byId('example.test/main/child-a2')).ceiling, null);
    assert.equal((await byId('example.test/pub/note2')).ceiling, null);
    assert.equal((await byId('example.test/main/multi')).ceiling, 'example.test/main/root-b');
    assert.equal((await byId('example.test/main/reading')).ceiling, 'example.test/main/root-b');
  });

  test('status', async () => {
    assert.equal((await byId('example.test/main/root-a')).status, 'proposal');
    assert.equal((await byId('example.test/main/root-b')).status, 'ratified');
    assert.equal((await byId('example.test/main/child-a1')).status, 'question');
    assert.equal((await byId('example.test/main/child-a2')).status, 'proposal');
    assert.equal((await byId('example.test/main/multi')).status, 'proposal');
    assert.equal((await byId('example.test/main/reading')).status, 'proposal');
  });

  test('children', async () => {
    assert.deepEqual((await byId('example.test/main/root-a')).children, [
      'example.test/main/child-a1',
      'example.test/main/child-a2',
    ]);
    assert.deepEqual((await byId('example.test/main/root-b')).children, ['example.test/main/multi']);
    assert.deepEqual((await byId('example.test/main/child-a1')).children, ['example.test/main/multi']);
    assert.deepEqual((await byId('example.test/main/child-a2')).children, []);
    assert.deepEqual((await byId('example.test/main/multi')).children, ['example.test/main/reading']);
    assert.deepEqual((await byId('example.test/pub/note')).children, ['example.test/pub/note2']);
  });

  test('multi-parent node under lists both parents, in file order', async () => {
    assert.deepEqual((await byId('example.test/main/multi')).under, [
      'example.test/main/child-a1',
      'example.test/main/root-b',
    ]);
  });

  test('target-prefixed under and cites[].id canonicalize to local form', async () => {
    assert.deepEqual((await byId('example.test/pub/note2')).under, ['example.test/pub/note']);
    assert.deepEqual((await byId('example.test/main/child-a2')).cites, [
      { id: 'example.test/pub/note', hash: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' },
    ]);
  });

  test('reading node carries source and relation', async () => {
    const reading = await byId('example.test/main/reading');
    assert.equal(reading.form, 'reading');
    assert.equal(reading.source, 'Aristotle, Nicomachean Ethics I.4');
    assert.equal(reading.relation, 'adopted');
  });

  test('boost is recorded only on the ratified node', async () => {
    assert.equal((await byId('example.test/main/root-b')).boost, 2);
    assert.equal((await byId('example.test/main/root-a')).boost, null);
  });

  test('hash is a 40-hex git blob sha', async () => {
    const node = await byId('example.test/main/root-a');
    assert.match(node.hash, /^[0-9a-f]{40}$/);
    const bytes = await readFile(path.join(VALID_DIR, 'main/root-a.md'));
    assert.equal(node.hash, blobSha1(bytes));
  });
});

// ---------------------------------------------------------------------------
// readGraph: invalid fixtures
// ---------------------------------------------------------------------------

describe('readGraph: invalid fixtures', () => {
  const cases = [
    ['invalid-unknown-key', /unknown frontmatter key 'bogus'/],
    ['invalid-reading-without-source', /'source' is required.*form: reading/],
    ['invalid-boost-without-ratified', /'boost' is only allowed when authority\.class is 'ratified'/],
    ['invalid-unresolved-under', /unresolved 'under' reference: example\.test\/main\/does-not-exist/],
    ['invalid-cycle', /cycle in 'under'/],
    ['invalid-stamp-without-answer', /'authority' requires an '## Answer' section/],
    ['invalid-stray-heading', /unexpected '## Notes' heading/],
  ];

  for (const [dirName, pattern] of cases) {
    test(`${dirName} fails validation with a path-prefixed message`, async () => {
      await assert.rejects(readGraph(path.join(FIXTURES, dirName)), (err) => {
        assert.match(err.message, pattern);
        for (const line of err.message.split('\n')) {
          assert.match(line, /^main\/[\w.-]+\.md: /);
        }
        return true;
      });
    });
  }

  test('reading-without-source reports every missing field, not just the first', async () => {
    await assert.rejects(readGraph(path.join(FIXTURES, 'invalid-reading-without-source')), (err) => {
      const lines = err.message.split('\n');
      assert.ok(lines.some((l) => l.includes("'source' is required")));
      assert.ok(lines.some((l) => l.includes("'relation' is required")));
      return true;
    });
  });

  test('cycle reports one problem line per node in the cycle', async () => {
    await assert.rejects(readGraph(path.join(FIXTURES, 'invalid-cycle')), (err) => {
      const lines = err.message.split('\n');
      assert.equal(lines.length, 2);
      assert.ok(lines.some((l) => l.startsWith('main/a.md:')));
      assert.ok(lines.some((l) => l.startsWith('main/b.md:')));
      return true;
    });
  });

  test('a missing disposition.yaml is a clear, path-named error', async () => {
    const dir = await freshTmpDir('disposition-empty-');
    await assert.rejects(readGraph(dir), /disposition\.yaml.*cannot read manifest/s);
  });
});

// ---------------------------------------------------------------------------
// validate.mjs
// ---------------------------------------------------------------------------

describe('validate.mjs', () => {
  test('validate() succeeds on the valid fixture', async () => {
    const result = await validate(VALID_DIR);
    assert.equal(result.ok, true);
    assert.equal(result.message, 'ok: 8 nodes');
  });

  test('validate() fails on an invalid fixture without throwing', async () => {
    const result = await validate(path.join(FIXTURES, 'invalid-cycle'));
    assert.equal(result.ok, false);
    assert.match(result.message, /cycle/);
  });

  test('CLI exits 0 and prints "ok: N nodes" on the valid fixture', () => {
    const { stdout, status } = runCli(VALIDATE_MJS, [VALID_DIR]);
    assert.equal(status, 0);
    assert.equal(stdout.trim(), 'ok: 8 nodes');
  });

  test('CLI exits 1 and prints problems to stderr on an invalid fixture', () => {
    const { stderr, status } = runCli(VALIDATE_MJS, [path.join(FIXTURES, 'invalid-unknown-key')]);
    assert.equal(status, 1);
    assert.match(stderr, /unknown frontmatter key 'bogus'/);
  });
});

// ---------------------------------------------------------------------------
// read.mjs CLI
// ---------------------------------------------------------------------------

describe('read.mjs CLI', () => {
  test('prints the graph as JSON to stdout', () => {
    const { stdout, status } = runCli(READ_MJS, [VALID_DIR]);
    assert.equal(status, 0);
    const graph = JSON.parse(stdout);
    assert.equal(graph.nodes.length, 8);
    assert.equal(graph.module, 'example.test');
  });
});

// ---------------------------------------------------------------------------
// ratify.mjs
// ---------------------------------------------------------------------------

describe('ratify.mjs', () => {
  test('stamps a proposal as ratified, leaves the rest of the file untouched, then refuses a second ratify', async () => {
    const dir = await makeTmpCopy();
    const id = 'example.test/main/root-a';
    const filePath = path.join(dir, 'main/root-a.md');
    const before = await readFile(filePath, 'utf8');

    const result = await ratify(id, dir);
    assert.equal(result.stamp.class, 'ratified');
    assert.match(result.stamp.date, /^\d{4}-\d{2}-\d{2}$/);
    assert.ok(result.stamp.by.length > 0);
    assert.equal(result.canonicalId, id);

    const after = await readFile(filePath, 'utf8');
    assert.notEqual(after, before);
    assert.ok(after.includes('class: ratified'));
    assert.ok(after.includes(`by: ${result.stamp.by}`));
    // everything else in the file is byte-identical
    assert.ok(after.includes('question: Why does the fixture graph exist?'));
    assert.ok(after.includes('form: assumption'));
    assert.ok(after.includes('defines:\n  - fixture'));
    assert.ok(after.includes('## Answer\n\nTo exercise the reader against a small, hand-checkable graph.'));

    const graph = await readGraph(dir);
    const node = graph.nodes.find((n) => n.id === id);
    assert.equal(node.status, 'ratified');
    assert.equal(node.authority.by, result.stamp.by);
    assert.equal(node.authority.date, result.stamp.date);

    await assert.rejects(ratify(id, dir), /already ratified/);
  });

  test('refuses to ratify a node with no Answer section', async () => {
    const dir = await makeTmpCopy();
    await assert.rejects(ratify('example.test/main/child-a1', dir), /no '## Answer' section/);
  });

  test('accepts a target-prefixed id and resolves it to the local form', async () => {
    const dir = await makeTmpCopy();
    const result = await ratify('pub.example/pub/note', dir);
    assert.equal(result.canonicalId, 'example.test/pub/note');
  });

  test('inserts a fresh authority block when none exists yet (no prior stamp)', async () => {
    const dir = await makeTmpCopy();
    // child-a2 has an Answer and no authority key at all yet.
    const result = await ratify('example.test/main/child-a2', dir);
    assert.equal(result.stamp.class, 'ratified');
    const text = await readFile(path.join(dir, 'main/child-a2.md'), 'utf8');
    assert.ok(text.includes('form: target\nauthority:\n  class: ratified'));
  });

  test('rolls back and restores original bytes when a sibling file is already broken', async () => {
    const dir = await makeTmpCopy();
    const brokenPath = path.join(dir, 'main/child-a2.md');
    const original = await readFile(brokenPath, 'utf8');
    assert.ok(original.includes('form: target'));
    await writeFile(brokenPath, original.replace('form: target', 'form: target\nbogus: yes'), 'utf8');

    const targetPath = path.join(dir, 'main/root-a.md');
    const before = await readFile(targetPath);

    await assert.rejects(ratify('example.test/main/root-a', dir), /rolled back/);

    const after = await readFile(targetPath);
    assert.ok(before.equals(after), 'the ratified file must be restored byte-for-byte');
  });

  test('CLI --no-commit stamps the file and exits 0 with no git repository present', async () => {
    const dir = await makeTmpCopy(); // a plain directory, not a git repository
    const { stdout, status } = runCli(RATIFY_MJS, ['example.test/main/child-a2', '--no-commit', dir]);
    assert.equal(status, 0);
    assert.match(stdout, /ratified example\.test\/main\/child-a2/);
    const text = await readFile(path.join(dir, 'main/child-a2.md'), 'utf8');
    assert.ok(text.includes('class: ratified'));
    const graph = await readGraph(dir);
    assert.equal(graph.nodes.find((n) => n.id === 'example.test/main/child-a2').status, 'ratified');
  });

  test('CLI without an id prints usage and exits 1', () => {
    const { status, stderr } = runCli(RATIFY_MJS, []);
    assert.equal(status, 1);
    assert.match(stderr, /usage:/);
  });
});
