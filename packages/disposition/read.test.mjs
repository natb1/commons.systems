// packages/disposition/read.test.mjs
//
// Run with: node --test packages/disposition/*.test.mjs
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtemp, readFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { after, describe, test } from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  blobSha1,
  canonicalizeId,
  deriveCeiling,
  deriveChildren,
  deriveDraftHash,
  deriveRank,
  deriveStandingHash,
  deriveStatus,
} from './derive.mjs';
import { parseNode, readGraph } from './read.mjs';
import { validate } from './validate.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const FIXTURES = path.join(HERE, 'fixtures');
const VALID_DIR = path.join(FIXTURES, 'valid');
const READ_MJS = path.join(HERE, 'read.mjs');
const VALIDATE_MJS = path.join(HERE, 'validate.mjs');

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

  test('deriveStatus: answered only for a ratified or delegated stamp; unanswered for deferred, no stamp, or no answer', () => {
    assert.equal(deriveStatus({ authority: { class: 'ratified' }, answer: 'x' }), 'answered');
    assert.equal(deriveStatus({ authority: { class: 'delegated' }, answer: 'x' }), 'answered');
    assert.equal(deriveStatus({ authority: { class: 'deferred' }, answer: 'x' }), 'unanswered');
    assert.equal(deriveStatus({ authority: { class: 'deferred' }, answer: null }), 'unanswered');
    assert.equal(deriveStatus({ authority: null, answer: 'x' }), 'unanswered');
    assert.equal(deriveStatus({ authority: null, answer: null }), 'unanswered');
  });

  test('deriveDraftHash: with a Recommendation fence, hashes the fence content exactly; without one, falls back to the standing hash', () => {
    const withDraft = deriveDraftHash({ fmText: 'question: Q?\nstage: ruling', draftFence: 'question: Q?\n', answer: 'ignored', rationale: 'ignored' });
    assert.equal(withDraft, createHash('sha1').update('question: Q?\n', 'utf8').digest('hex'));

    const parts = { fmText: 'question: Q?\nstage: review', answer: 'Ans.', rationale: 'Rat.' };
    const noDraft = deriveDraftHash({ ...parts, draftFence: null });
    assert.equal(noDraft, createHash('sha1').update('question: Q?\nAns.\nRat.', 'utf8').digest('hex'));
    assert.equal(noDraft, deriveStandingHash(parts), 'the no-fence draft hash is exactly the standing hash');
  });

  test('deriveStandingHash: stripped frontmatter, then the answer, then the rationale', () => {
    const hash = deriveStandingHash({ fmText: 'question: Q?\nform: rule', answer: 'Ans.', rationale: 'Rat.' });
    assert.equal(hash, createHash('sha1').update('question: Q?\nform: rule\nAns.\nRat.', 'utf8').digest('hex'));
    const bare = deriveStandingHash({ fmText: 'question: Q?', answer: null, rationale: null });
    assert.equal(bare, createHash('sha1').update('question: Q?\n\n', 'utf8').digest('hex'), 'an absent section hashes as the empty string');
  });

  test('deriveStandingHash: every dialogue key (and everything nested under it) is invisible to the hash', () => {
    const bare = deriveStandingHash({ fmText: 'question: Q?\nform: rule', answer: 'Ans.', rationale: null });
    const dressedUp = deriveStandingHash({
      fmText: [
        'question: Q?',
        'stage: review',
        'alternatives:',
        '  - name: other-way',
        '    source: ai',
        'depends:',
        '  - example.test/main/open',
        'recommendation:',
        '  adopts: other-way',
        '  class: ratified',
        '  boldness: high',
        `  amends: ${'b'.repeat(40)}`,
        '  at: a1b2c3d',
        'form: rule',
        'review:',
        '  verdict: forward',
        '  strength: none',
        '  date: 2026-01-01',
        `  of: ${'a'.repeat(40)}`,
      ].join('\n'),
      answer: 'Ans.', rationale: null,
    });
    assert.equal(bare, dressedUp, 'stage, alternatives, depends, recommendation, and review are all stripped');
  });

  test('deriveDraftHash and deriveStandingHash agree with the reader on a real fixture node', async () => {
    const graph = await readGraph(path.join(FIXTURES, 'valid-alternatives'));
    const fresh = graph.nodes.find((n) => n.id === 'example.test/main/fresh-node');
    assert.equal(fresh.recommendation.amends, fresh.standingHash, 'the fixture pins the current standing hash');
    assert.equal(fresh.review.of, fresh.draftHash, 'the fixture pins the current fence hash');
    assert.notEqual(fresh.standingHash, fresh.draftHash, 'a fence makes the two hashes diverge');
  });
});

// ---------------------------------------------------------------------------
// parseNode
// ---------------------------------------------------------------------------

describe('parseNode', () => {
  const loc = { id: 'm/g/s', graph: 'g', slug: 's', path: 'g/s.md' };

  test('parses a minimal unanswered (un-aligned) question', () => {
    const node = parseNode('---\nquestion: What?\nstage: periagogic\n---\n\n## Disposition\n\nOpen for now.\n', loc);
    assert.equal(node.question, 'What?');
    assert.equal(node.answer, null);
    assert.equal(node.form, null);
    assert.equal(node.stage, 'periagogic');
    assert.equal(node.disposition, 'Open for now.');
    assert.deepEqual(node.under, []);
    assert.deepEqual(node.cites, []);
    assert.deepEqual(node.shims, []);
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

  // ---- order: per-file shape checks (graph-level scope/existence checks
  // need the whole graph and are covered by the fixtures below instead). ----

  test('order: a bare string step and a tied-list step both normalize to arrays of ids', () => {
    const text = '---\nquestion: Q?\nform: rule\nauthority:\n  class: deferred\n  by: x\n  date: 2026-01-01\nstage: maieutic\norder:\n  - [a, b]\n  - c\n---\n\n## Answer\n\nx\n';
    const node = parseNode(text, loc);
    assert.deepEqual(node.order, [['a', 'b'], ['c']]);
  });

  test('order: absent field normalizes to an empty array', () => {
    const text = '---\nquestion: Q?\nform: rule\nauthority:\n  class: deferred\n  by: x\n  date: 2026-01-01\nstage: maieutic\n---\n\n## Answer\n\nx\n';
    assert.deepEqual(parseNode(text, loc).order, []);
  });

  test('order: rejects a non-list value and a step that is neither a string nor a list', () => {
    assert.throws(
      () => parseNode('---\nquestion: Q?\nstage: periagogic\norder: not-a-list\n---\n\n## Disposition\n\nx\n', loc),
      /'order' must be a list of steps, each a node id or a list of node ids/,
    );
    const text = '---\nquestion: Q?\nform: rule\nauthority:\n  class: deferred\n  by: x\n  date: 2026-01-01\norder:\n  - 5\n---\n\n## Answer\n\nx\n';
    assert.throws(() => parseNode(text, loc), /'order' must be a list of steps, each a node id or a list of node ids/);
  });

  test('order: an empty-list step is reported by number, one-based', () => {
    const text = '---\nquestion: Q?\nform: rule\nauthority:\n  class: deferred\n  by: x\n  date: 2026-01-01\norder:\n  - a\n  - []\n---\n\n## Answer\n\nx\n';
    assert.throws(() => parseNode(text, loc), /'order' step 2 is empty/);
  });

  test('order: an id repeated across steps is reported once per repeat', () => {
    const text = '---\nquestion: Q?\nform: rule\nauthority:\n  class: deferred\n  by: x\n  date: 2026-01-01\norder:\n  - a\n  - [a, b]\n---\n\n## Answer\n\nx\n';
    assert.throws(() => parseNode(text, loc), /'order' names a twice/);
  });

  test("order requires an '## Answer' section", () => {
    const text = '---\nquestion: Q?\nstage: periagogic\norder:\n  - a\n---\n\n## Disposition\n\nOpen.\n';
    assert.throws(() => parseNode(text, loc), /'order' requires an '## Answer' section/);
  });

  // ---- '## Recommendation': dialogue.md's "the validator parses it and
  // checks only that it answers the same question" -- no field rule, shape
  // rule, vocabulary, or section-requirement rule applies inside the fence. ----

  test('a ## Recommendation fence with an unknown frontmatter key parses without error -- only structure and the question are checked', () => {
    const text = [
      '---',
      'question: What?',
      'stage: periagogic',
      '---',
      '',
      '## Disposition',
      '',
      'Open.',
      '',
      '## Recommendation',
      '',
      '```markdown',
      '---',
      'question: What?',
      'bogus: true',
      '---',
      '',
      '## Answer',
      '',
      'x',
      '```',
      '',
    ].join('\n');
    const node = parseNode(text, loc);
    assert.ok(node.draft, 'the draft parses despite its unrecognized frontmatter key');
    assert.equal(node.draft.question, 'What?');
  });

  // ---- '## Alternatives': every line of it belongs to one alternative,
  // so prose before the first '### ' heading has no alternative to belong
  // to. (The list/heading correspondence rules are covered by fixtures.) ----

  test("'## Alternatives' rejects prose before its first '### ' heading", () => {
    const text = [
      '---',
      'question: What?',
      'stage: periagogic',
      'alternatives:',
      '  - name: other-way',
      '    source: ai',
      '---',
      '',
      '## Disposition',
      '',
      'Open.',
      '',
      '## Alternatives',
      '',
      'Stray prose belonging to no alternative.',
      '',
      '### other-way',
      '',
      'The one alternative on the table.',
      '',
    ].join('\n');
    assert.throws(
      () => parseNode(text, loc),
      /'## Alternatives' has text before the first '### ' heading: "Stray prose belonging to no alternative\."/,
    );
  });

  test("a '### ' heading outside '## Alternatives' stays content", () => {
    const text = [
      '---',
      'question: What?',
      'stage: periagogic',
      '---',
      '',
      '## Disposition',
      '',
      'Open.',
      '',
      '## Account',
      '',
      '### Clean-context review, 2026-09-03',
      '',
      'The reviewer read the node and forwarded it.',
      '',
    ].join('\n');
    const node = parseNode(text, loc);
    assert.ok(node.account.startsWith('### Clean-context review, 2026-09-03'));
    assert.deepEqual(node.alternativesText, {});
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
    assert.equal((await byId('example.test/main/root-a')).status, 'unanswered');
    assert.equal((await byId('example.test/main/root-b')).status, 'answered');
    assert.equal((await byId('example.test/main/child-a1')).status, 'unanswered');
    assert.equal((await byId('example.test/main/child-a2')).status, 'unanswered');
    assert.equal((await byId('example.test/main/multi')).status, 'unanswered');
    assert.equal((await byId('example.test/main/reading')).status, 'unanswered');
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
    ['invalid-unresolved-under', /unresolved 'under' reference: example\.test\/main\/does-not-exist/],
    ['invalid-cycle', /cycle in 'under'/],
    ['invalid-stamp-without-answer', /'authority' requires an '## Answer' section/],
    ['invalid-stray-heading', /unexpected '## Notes' heading/],
    // validator rule: a repeated id in 'under' would double that parent's
    // rank contribution and duplicate the child in `children`.
    ['invalid-duplicate-under', /duplicate under reference: example\.test\/main\/root/],
    // validator rule: an 'after' reference must resolve like 'under' does.
    ['invalid-unresolved-after', /unresolved after reference: example\.test\/main\/does-not-exist/],
    // validator rules for 'depends': a dependency must resolve, must not
    // repeat, must not be the node's own id, and must name an unanswered
    // node -- a dependency is on an open question, not a settled one.
    ['invalid-unresolved-depends', /unresolved 'depends' reference: example\.test\/main\/does-not-exist/],
    ['invalid-duplicate-depends', /duplicate 'depends' reference: example\.test\/main\/root/],
    ['invalid-depends-answered', /'depends' names example\.test\/main\/root, which is answered; a dependency is on an open question/],
    ['invalid-depends-self', /'depends' names itself/],
    // ledger is no longer a field: a 'ledger:' key is just another unknown key.
    ['invalid-ledger-key', /unknown frontmatter key 'ledger'/],
    ['invalid-shim-missing-liquidation', /'shims\[0\]\.liquidation' is required/],
    ['invalid-shim-unknown-key', /unknown key 'shims\[0\]\.bogus'/],
    // status / dialogue rules (session-context: an unanswered node -- a
    // deferred stamp, no stamp, or no '## Answer' -- carries the dialogue).
    ['invalid-unaligned-without-stage', /example\.test\/main\/bad is unanswered and must carry stage/],
    ['invalid-stage-without-dialogue', /stage requires a '## Disposition', '## Account', or '## Answer' section/],
    ['invalid-disposition-without-stage', /'## Disposition' requires 'stage'/],
    ['invalid-stage-value', /'stage' must be one of: periagogic, maieutic, ruling, review/],
    ['invalid-unaligned-tier', /'tier' requires an '## Answer' section/],
    ['invalid-section-order', /'## Disposition' heading is out of order/],
    // order rule (i): the boosts of b and c contradict the recorded step order.
    ['invalid-order-violated', /'order' step 2 names example\.test\/main\/b \(rank 0\.0090\), which does not outrank example\.test\/main\/c \(rank 0\.0901\) of step 3/],
    // order rule (ii): d is an unrelated (not ancestor) sibling that outranks
    // a's first (and only) step.
    ['invalid-order-head', /'order' puts example\.test\/main\/a in its first step, but example\.test\/main\/d \(rank 0\.9901\) outranks it and is not its ancestor/],
    ['invalid-order-unresolved', /'order' names example\.test\/main\/does-not-exist, which is not a node/],
    ['invalid-order-no-answer', /'order' requires an '## Answer' section/],
    // dialogue fields: alternatives, recommendation, review, and the
    // '## Alternatives' / '## Recommendation' / '## Account' sections.
    ['invalid-recommendation-shape', /'recommendation' must be \{adopts: standing\|<alternative name>, class: ratified\|delegated, boldness: low\|moderate\|high, amends: <sha1>, at: <7-40 hex commit>\}/],
    ['invalid-recommendation-missing-amends', /'recommendation' must be \{adopts: .*amends: <sha1>, at: <7-40 hex commit>\}/],
    ['invalid-review-shape', /'review' must be \{verdict: forward\|kickback, strength: strong\|moderate\|weak\|none, date: YYYY-MM-DD, of: <sha1>\}/],
    // `siblings` (the other drafts a per-node reviewer once read) is no
    // longer part of the review schema now that every review is a batch
    // over the whole frontier; this fixture's extra 'siblings' key fails
    // the same generic shape check invalid-review-shape does.
    ['invalid-review-siblings-unresolved', /'review' must be \{verdict: forward\|kickback, strength: strong\|moderate\|weak\|none, date: YYYY-MM-DD, of: <sha1>\}/],
    ['invalid-dialogue-without-stage', /'alternatives', 'recommendation', 'review', 'depends', '## Alternatives', '## Recommendation', and '## Account' are parts of the dialogue and require stage/],
    ['invalid-account-without-stage', /'alternatives', 'recommendation', 'review', 'depends', '## Alternatives', '## Recommendation', and '## Account' are parts of the dialogue and require stage/],
    ['invalid-draft-not-fenced', /'## Recommendation' must hold exactly one fenced markdown block/],
    ['invalid-draft-parse-error', /'## Recommendation' does not parse as a node: /],
    ['invalid-draft-wrong-question', /'## Recommendation' answers a different question/],
    ['invalid-stage-needs-recommendation', /stage review or ruling requires 'recommendation'/],
    ['invalid-stage-ruling-needs-forward-review', /stage ruling requires a 'review' with verdict forward/],
    // the 'alternatives' list: its own shape, its unique names, and the
    // name 'standing', which belongs to the node as it stands.
    ['invalid-alternatives-shape', /'alternatives' must be a list of \{name: <lowercase slug>, source: author\|ai\|review\|proposal, ref: <non-empty string, required when source is proposal>, prune: <optional boolean>\}/],
    ['invalid-alternatives-proposal-without-ref', /'alternatives' must be a list of \{name: <lowercase slug>, source: author\|ai\|review\|proposal, ref: <non-empty string, required when source is proposal>, prune: <optional boolean>\}/],
    ['invalid-alternatives-duplicate-name', /'alternatives' names same twice/],
    ['invalid-alternatives-standing-name', /'alternatives' names an alternative 'standing', which is reserved for the node as it stands/],
    // '## Alternatives' stands with the list: present iff it is non-empty,
    // one '### <name>' subsection per entry, in the entries' order.
    ['invalid-alternatives-without-section', /'alternatives' is non-empty and requires a '## Alternatives' section/],
    ['invalid-alternatives-section-without-list', /'## Alternatives' requires a non-empty 'alternatives' list/],
    ['invalid-alternatives-heading-mismatch', /'## Alternatives' subsections must match the 'alternatives' list in order: expected '### second' at position 2, found '### third'/],
    // 'recommendation.adopts' resolves, and the '## Recommendation' fence
    // is present exactly when it names an alternative.
    ['invalid-adopts-unlisted', /'recommendation\.adopts' names 'unlisted', which is neither 'standing' nor a listed alternative/],
    ['invalid-adopts-standing-without-answer', /'recommendation\.adopts' is 'standing', which requires an '## Answer' section/],
    ['invalid-adopts-standing-with-fence', /'recommendation\.adopts' is 'standing', so the node carries no '## Recommendation' section/],
    ['invalid-adopts-alternative-without-fence', /'recommendation\.adopts' names the alternative 'the-other-way', which requires a '## Recommendation' section/],
    // a prune alternative deletes the node, so it proposes no text and
    // carries no fence (the amendment of 2026-09-03).
    ['invalid-adopts-prune-with-fence', /'recommendation\.adopts' names the prune alternative 'delete-it', so the node carries no '## Recommendation' section/],
    // the two retired headings are now just unknown headings.
    ['invalid-proposal-heading', /unexpected '## Proposal' heading \(only Disposition, Answer, Rationale, Alternatives, Recommendation, Account are allowed\)/],
    ['invalid-draft-heading', /unexpected '## Draft' heading \(only Disposition, Answer, Rationale, Alternatives, Recommendation, Account are allowed\)/],
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

  test('invalid-draft-parse-error fails structurally (no frontmatter delimiter), not on any field rule', async () => {
    await assert.rejects(readGraph(path.join(FIXTURES, 'invalid-draft-parse-error')), (err) => {
      assert.match(err.message, /file must begin with a '---' frontmatter delimiter/);
      assert.doesNotMatch(err.message, /authority\.date|unknown frontmatter key|'form' must be one of|unanswered and must carry stage/);
      return true;
    });
  });

  test('invalid-draft-wrong-question fails on the question mismatch alone -- the fence is otherwise old-doctrine-valid', async () => {
    await assert.rejects(readGraph(path.join(FIXTURES, 'invalid-draft-wrong-question')), (err) => {
      const lines = err.message.split('\n');
      assert.equal(lines.length, 1, 'no other field on this well-formed draft is checked, so this is the only problem');
      assert.match(lines[0], /'## Recommendation' answers a different question$/);
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
// readGraph: fenced-body fixture
// ---------------------------------------------------------------------------

describe('readGraph: fenced-body fixture', () => {
  // covers finding read.mjs:65 (parseBody fence handling): pre-fix, a '##'
  // line inside a fenced code block was read as a real section boundary, so
  // this fixture's nested '## Answer' example threw "duplicate '## Answer'
  // heading" instead of parsing as content.
  test('a "## Answer" line inside a fenced example is content, not a section boundary', async () => {
    const graph = await readGraph(path.join(FIXTURES, 'valid-fenced-body'));
    assert.equal(graph.nodes.length, 1);
    const node = graph.nodes[0];
    assert.equal(node.rationale, null);
    assert.equal(node.account, null, "the section is 'account' now, not 'proposal'");
    assert.equal(node.proposal, undefined, "'proposal' is gone from the node object");
    assert.ok(node.answer.startsWith('Real answer text before the example.'));
    assert.ok(node.answer.endsWith('More real answer text after the fence.'));
    assert.ok(
      node.answer.includes('## Answer\n\nFenced example text that must not be treated as a boundary.'),
      'the fenced heading survives verbatim as body content',
    );
  });
});

// ---------------------------------------------------------------------------
// readGraph: deferred-boost fixture
// ---------------------------------------------------------------------------

describe('readGraph: deferred-boost fixture', () => {
  // covers the removal of the old "'boost' is only allowed when
  // authority.class is 'ratified'" rule: a boost is the author's act
  // whatever the answer's stamp (an allocation only the author may ratify),
  // so a node stamped deferred may carry one too.
  test('a deferred node with a positive boost parses', async () => {
    const graph = await readGraph(path.join(FIXTURES, 'valid-deferred-boost'));
    assert.equal(graph.nodes.length, 1);
    const node = graph.nodes[0];
    assert.equal(node.authority.class, 'deferred');
    assert.equal(node.boost, 2);
  });
});

// ---------------------------------------------------------------------------
// readGraph: shims fixture
// ---------------------------------------------------------------------------

describe('readGraph: shims fixture', () => {
  test('a node with two shims parses with both entries in order', async () => {
    const graph = await readGraph(path.join(FIXTURES, 'valid-shims'));
    assert.equal(graph.nodes.length, 1);
    const node = graph.nodes[0];
    assert.deepEqual(node.shims, [
      {
        artifact: "packages/disposition/read.mjs's ledger field",
        liquidation: 'when the ledger field is fully removed from the schema',
        declared: '2026-09-01',
        for: null,
      },
      {
        artifact: "packages/disposition/browser-template.html's mount notes",
        liquidation: 'when the namespaces node declares the mount as its own shim',
        declared: '2026-09-02',
        for: "the namespaces node's target metadata",
      },
    ]);
  });
});

// ---------------------------------------------------------------------------
// readGraph: valid-unaligned fixture
// ---------------------------------------------------------------------------

describe('readGraph: valid-unaligned fixture', () => {
  test('an unanswered node reads with stage/disposition populated; a mid-dialogue node with an answer stays unanswered until ratified', async () => {
    const graph = await readGraph(path.join(FIXTURES, 'valid-unaligned'));
    const byId = (slug) => graph.nodes.find((n) => n.id === `example.test/main/${slug}`);

    // root is ratified: answered, and so carries no stage of its own, even
    // though this fixture is otherwise about nodes still in the dialogue.
    const root = byId('root');
    assert.equal(root.status, 'answered');
    assert.equal(root.stage, null);

    const unaligned = byId('child-unaligned');
    assert.equal(unaligned.status, 'unanswered');
    assert.equal(unaligned.stage, 'periagogic');
    assert.equal(unaligned.disposition, 'The author has not yet ruled on this branch.');
    assert.equal(unaligned.answer, null);

    // a node with '## Disposition', '## Answer', '## Rationale', and
    // '## Account' all together: still mid-dialogue (carries a stage,
    // recommendation, and a forward review), but an '## Answer' means it
    // is not an un-aligned disposition -- it is unanswered only because its
    // stamp is deferred, not because it has no answer.
    const ruling = byId('child-ruling');
    assert.equal(ruling.status, 'unanswered');
    assert.equal(ruling.stage, 'ruling');
    assert.deepEqual(ruling.recommendation, {
      adopts: 'standing',
      class: 'ratified',
      boldness: 'moderate',
      amends: ruling.standingHash,
      at: 'a1b2c3d',
    });
    assert.equal(ruling.recommendationStale, false, "the fixture's amends pins the current standing hash");
    assert.equal(ruling.review.verdict, 'forward');
    assert.equal(ruling.reviewStale, true, "the fixture's placeholder review.of does not match the computed draft hash");
    assert.ok(ruling.disposition && ruling.answer && ruling.rationale && ruling.account);
    assert.deepEqual(ruling.alternatives, [], 'a recommendation that adopts the standing answer needs none');
    assert.deepEqual(ruling.alternativesText, {});
  });
});

describe('readGraph: valid-unanswered-with-child fixture', () => {
  // an unanswered parent (no '## Answer') may have a child: the graph-level
  // rule that once forbade this was retired, so this fixture -- an
  // unaligned node with a child under it -- now validates cleanly.
  test('loads without throwing', async () => {
    const graph = await readGraph(path.join(FIXTURES, 'valid-unanswered-with-child'));
    assert.equal(graph.nodes.length, 2);
  });
});

describe('readGraph: valid-depends fixture', () => {
  // 'depends' names a dependency that must itself be an open question: an
  // unanswered node may depend on another unanswered node.
  test('loads without throwing, and depends resolves to the local canonical id', async () => {
    const graph = await readGraph(path.join(FIXTURES, 'valid-depends'));
    assert.equal(graph.nodes.length, 2);
    const dependent = graph.nodes.find((n) => n.id === 'example.test/main/dependent');
    assert.ok(dependent);
    assert.equal(dependent.status, 'unanswered');
    assert.deepEqual(dependent.depends, ['example.test/main/prerequisite']);
    const prerequisite = graph.nodes.find((n) => n.id === 'example.test/main/prerequisite');
    assert.equal(prerequisite.status, 'unanswered');
  });
});

// ---------------------------------------------------------------------------
// readGraph: valid-dialogue fixture
// ---------------------------------------------------------------------------

describe('readGraph: valid-dialogue fixture', () => {
  const graphPromise = readGraph(path.join(FIXTURES, 'valid-dialogue'));
  async function byId(slug) {
    const graph = await graphPromise;
    const node = graph.nodes.find((n) => n.id === `example.test/main/${slug}`);
    assert.ok(node, `expected a node with slug ${slug}`);
    return node;
  }

  test('a node at ruling carries recommendation, a forward review whose "of" matches the draft hash, and a parsed Recommendation fence', async () => {
    const node = await byId('ruling-node');
    assert.equal(node.status, 'unanswered');
    assert.equal(node.stage, 'ruling');
    assert.deepEqual(node.recommendation, {
      adopts: 'whole-node',
      class: 'ratified',
      boldness: 'moderate',
      amends: node.standingHash,
      at: 'a1b2c3d',
    });
    assert.equal(node.recommendationStale, false);
    assert.deepEqual(node.alternatives, [{ name: 'whole-node', source: 'ai', ref: '2026-09-03', prune: false }]);
    assert.ok(node.alternativesText['whole-node'].startsWith('Read the fence as a whole proposed node'));
    assert.ok(node.account.startsWith('Ratify the alternative above'), "the account replaces the old '## Proposal'");
    assert.equal(node.review.verdict, 'forward');
    assert.deepEqual(Object.keys(node.review).sort(), ['date', 'of', 'strength', 'verdict'], "no 'siblings' key");
    assert.equal(node.review.of, node.draftHash, "the fixture's review.of is kept in step with the draft hash");
    assert.equal(node.reviewStale, false);
    assert.ok(node.draft, 'the node carries a parsed Recommendation fence');
    assert.equal(node.draft.question, node.question, "the draft answers the node's own question");
    assert.equal(node.draft.frontmatter.authority.class, 'ratified');
    assert.ok(node.draft.sections.Answer.startsWith('Yes: a draft is a whole proposed node'));
  });

  test('a node at review carries a recommendation only -- no review yet', async () => {
    const node = await byId('review-node');
    assert.equal(node.status, 'unanswered');
    assert.equal(node.stage, 'review');
    assert.deepEqual(node.recommendation, {
      adopts: 'standing',
      class: 'delegated',
      boldness: 'high',
      amends: node.standingHash,
      at: 'a1b2c3d',
    });
    assert.equal(node.review, null);
    assert.equal(node.reviewStale, false, 'reviewStale is only ever true when a review exists');
    assert.equal(node.draft, null, "adopts: standing means there is no '## Recommendation' fence");
    assert.equal(node.draftHash, node.standingHash, 'with no fence the two hashes are the same');
  });

  test('an answered ratified node needs no stage at all', async () => {
    const node = await byId('answered-no-stage');
    assert.equal(node.status, 'answered');
    assert.equal(node.stage, null);
    assert.equal(node.recommendation, null);
    assert.equal(node.recommendationStale, false, 'recommendationStale is only ever true when a recommendation exists');
    assert.equal(node.review, null);
  });

  test('a ratified node may still carry a stage, satisfied by "## Answer" alone (the relaxed rule)', async () => {
    const node = await byId('answered-with-stage');
    assert.equal(node.status, 'answered');
    assert.equal(node.stage, 'review');
    assert.equal(node.disposition, null);
    assert.equal(node.account, null);
    assert.ok(node.answer, 'only an Answer section supports the stage here');
    assert.deepEqual(node.recommendation, {
      adopts: 'standing',
      class: 'ratified',
      boldness: 'low',
      amends: node.standingHash,
      at: 'a1b2c3d',
    });
  });
});

// ---------------------------------------------------------------------------
// readGraph: valid-order fixture
// ---------------------------------------------------------------------------

describe('readGraph: valid-order fixture', () => {
  // order-node's order ties itself with leaf-a (deeper, under the sibling
  // hub) ahead of leaf-b; hub outranks leaf-a but is excepted as its
  // ancestor; solo-child (leaf-a's lone child) ties leaf-a's rank exactly
  // but is excepted as its descendant.
  test('loads without throwing, and order normalizes to canonical ids', async () => {
    const graph = await readGraph(path.join(FIXTURES, 'valid-order'));
    const byId = (slug) => graph.nodes.find((n) => n.id === `example.test/main/${slug}`);

    const orderNode = byId('order-node');
    assert.deepEqual(orderNode.order, [
      ['example.test/main/order-node', 'example.test/main/leaf-a'],
      ['example.test/main/leaf-b'],
    ]);

    // the depths and the ancestor/descendant exceptions this fixture exists
    // to cover, stated as ranks so a future change to the rule notices them.
    assert.ok(orderNode.rank > byId('leaf-a').rank, 'order-node outranks leaf-a (its step-1 partner)');
    assert.ok(byId('leaf-a').rank > byId('leaf-b').rank, 'leaf-a (step 1) outranks leaf-b (step 2)');
    assert.ok(byId('hub').rank > byId('leaf-a').rank, "hub outranks leaf-a but is leaf-a's ancestor");
    assert.equal(byId('solo-child').rank, byId('leaf-a').rank, "leaf-a's lone child ties its rank exactly");
  });
});

// ---------------------------------------------------------------------------
// readGraph: valid-draft-old-doctrine fixture
// ---------------------------------------------------------------------------

describe('readGraph: valid-draft-old-doctrine fixture', () => {
  // dialogue.md: "A draft may be invalid under the doctrine of the day, as
  // when it presumes a ruling not yet given; the validator parses it and
  // checks only that it answers the same question." This draft carries a
  // form outside FORMS, an authority.date that is still the sitting's
  // placeholder text, and a tier outside its vocabulary -- none of it is a
  // validation problem.
  test('a draft with an out-of-vocabulary form, a placeholder authority date, and an out-of-vocabulary tier still validates', async () => {
    const result = await validate(path.join(FIXTURES, 'valid-draft-old-doctrine'));
    assert.equal(result.ok, true);
    assert.equal(result.message, 'ok: 1 nodes');
  });

  test("the draft's frontmatter is returned exactly as written, not normalized or rejected", async () => {
    const graph = await readGraph(path.join(FIXTURES, 'valid-draft-old-doctrine'));
    const node = graph.nodes.find((n) => n.id === 'example.test/main/ruling-node');
    assert.ok(node, 'expected the fixture node to parse');
    assert.equal(node.draft.question, node.question, "the draft still answers the node's own question");
    assert.equal(node.draft.frontmatter.form, 'disposition', "'form' outside FORMS is passed through, not rejected");
    assert.deepEqual(node.draft.frontmatter.authority, {
      class: 'ratified',
      by: 'Fixture Author',
      date: '<the date of the ruling>',
    }, 'an authority.date that fails isValidDate is passed through unvalidated, not rejected or normalized to null');
    assert.equal(node.draft.frontmatter.tier, 'cosmic', "'tier' outside its vocabulary is passed through, not rejected");
    assert.equal(node.reviewStale, false, "the fixture's review.of is kept in step with the draft hash");
    assert.equal(node.recommendationStale, false, "the fixture's recommendation.amends is kept in step with the standing hash");
  });
});

// ---------------------------------------------------------------------------
// readGraph: valid-alternatives fixture
// ---------------------------------------------------------------------------

describe('readGraph: valid-alternatives fixture', () => {
  const graphPromise = readGraph(path.join(FIXTURES, 'valid-alternatives'));
  async function byId(slug) {
    const graph = await graphPromise;
    const node = graph.nodes.find((n) => n.id === `example.test/main/${slug}`);
    assert.ok(node, `expected a node with slug ${slug}`);
    return node;
  }

  test('a stamped node carries its alternatives, one per source, with ref null only where the source allows it', async () => {
    const node = await byId('fresh-node');
    assert.equal(node.status, 'unanswered', 'a deferred stamp is still unanswered');
    assert.equal(node.authority.class, 'deferred');
    assert.deepEqual(node.alternatives, [
      { name: 'keep-standing', source: 'author', ref: '2026-09-01', prune: false },
      { name: 'split-the-node', source: 'review', ref: '2026-09-02', prune: false },
      { name: 'follow-the-instrument', source: 'proposal', ref: 'node --test packages/disposition/read.test.mjs', prune: false },
    ], "an entry with no 'prune' key reads as prune: false");
  });

  test('alternativesText maps each listed name to its trimmed subsection prose', async () => {
    const node = await byId('fresh-node');
    assert.deepEqual(Object.keys(node.alternativesText), [
      'keep-standing', 'split-the-node', 'follow-the-instrument',
    ], "the map's keys are the list's names, in the list's order");
    assert.ok(node.alternativesText['keep-standing'].startsWith("The author's own alternative"));
    assert.ok(node.alternativesText['split-the-node'].endsWith('before any of it is ratified.'));
    assert.ok(!node.alternativesText['follow-the-instrument'].includes('###'), 'the heading itself is not part of the prose');
  });

  test('a recommendation adopting an alternative carries the fence, and both hashes pin what they name', async () => {
    const node = await byId('fresh-node');
    assert.equal(node.recommendation.adopts, 'split-the-node');
    assert.equal(node.recommendation.class, 'ratified');
    assert.equal(node.recommendation.boldness, 'high');
    assert.ok(node.draft, "adopting an alternative means a '## Recommendation' fence");
    assert.equal(node.draft.question, node.question);
    assert.ok(node.draft.sections.Answer.startsWith('Split the node'));
    assert.equal(node.review.of, node.draftHash);
    assert.equal(node.reviewStale, false);
    assert.equal(node.recommendation.amends, node.standingHash);
    assert.equal(node.recommendationStale, false, 'amends equals the computed standing hash');
    assert.notEqual(node.standingHash, node.draftHash);
  });

  test('a recommendation adopting a prune alternative carries no fence, and the node still stands', async () => {
    const node = await byId('prune-node');
    assert.equal(node.status, 'unanswered');
    assert.deepEqual(node.alternatives, [
      { name: 'fold-into-the-parent', source: 'review', ref: '2026-09-02', prune: true },
    ]);
    assert.equal(node.recommendation.adopts, 'fold-into-the-parent');
    assert.equal(node.draft, null, 'a deleted node has no text, so there is no fence to parse');
    assert.equal(node.draftHash, node.standingHash, 'with no fence the draft hash is the standing hash');
    assert.equal(node.review.of, node.draftHash);
    assert.equal(node.reviewStale, false);
    assert.equal(node.recommendation.amends, node.standingHash);
    assert.equal(node.recommendationStale, false);
    assert.ok(node.answer, 'the node as it stands is what remains if the author denies the prune');
    assert.ok(node.alternativesText['fold-into-the-parent'].startsWith('Prune the node'));
  });

  test('recommendationStale is true when amends no longer matches the standing hash', async () => {
    const node = await byId('stale-node');
    assert.equal(node.recommendation.adopts, 'standing');
    assert.equal(node.recommendation.amends, 'a'.repeat(40));
    assert.notEqual(node.standingHash, 'a'.repeat(40));
    assert.equal(node.recommendationStale, true);
    assert.equal(node.reviewStale, false, 'no review, so nothing is stale on that side');
    assert.equal(node.draft, null);
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
