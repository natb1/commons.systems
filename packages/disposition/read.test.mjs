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
  deriveClass,
  deriveClassSource,
  deriveFactRecommendationHash,
  deriveRank,
  deriveReadings,
  deriveRecommendationHash,
  deriveSettles,
  deriveStandingHash,
  deriveStatus,
  divergesFromRecommendation,
  factByName,
  factMoved,
  moved,
  onFrontier,
  proposal,
  reviewStale,
  ruledOption,
} from './derive.mjs';
import { glossary, optionText } from './derive.mjs';
import {
  defineTerms, parseNode, readGraph, readyToRule, surveyJudges, surveyOwed, surveyStale,
} from './read.mjs';
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

// A node as `derive.mjs` sees one: enough of the shape for the derivations,
// hand-built so a rule can be pinned without a fixture graph.
function node(id, { under = [], facts = [], ...rest } = {}) {
  return { id, under, facts, ...rest };
}
const OPTION_DEFAULTS = { source: null, ref: null, status: null, reason: null, ruling: null, prose: '' };
function fact(name, options, { recommends = null, boldness = null, against = null, stands = null, prose = '' } = {}) {
  return {
    name,
    options: options.map((o) => (typeof o === 'string'
      ? { ...OPTION_DEFAULTS, name: o }
      : { ...OPTION_DEFAULTS, ...o })),
    recommends,
    boldness,
    against,
    stands,
    prose,
  };
}
const ruling = (of, { response = 'confirm', date = '2026-09-05', reason = null } = {}) => ({ response, date, of, reason });

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

  // ---- the class, read off the rulings ----

  test('deriveClass: a ruled answer fact is ratified, whatever an ancestor says', () => {
    const parent = node('p', { facts: [fact('authority', [{ name: 'delegated', ruling: ruling('x') }, 'ratified'])] });
    const child = node('c', {
      under: ['p'],
      facts: [fact('answer', [{ name: 'standing', ruling: ruling('x') }], { stands: 'standing' })],
    });
    const graph = [parent, child];
    assert.equal(deriveClass(child, graph), 'ratified');
    assert.deepEqual(deriveClassSource(child, graph), { kind: 'ruling' });
  });

  test('deriveClass: a ruled authority fact confers delegated or deferred; ruled ratified leaves the node unanswered', () => {
    const graph = [];
    const of = (name) => node(name, { facts: [fact('authority', [{ name, ruling: ruling('x') }])] });
    for (const name of ['delegated', 'deferred', 'ratified']) graph.push(of(name));
    assert.equal(deriveClass(graph[0], graph), 'delegated');
    assert.equal(deriveClass(graph[1], graph), 'deferred');
    assert.equal(deriveClass(graph[2], graph), 'unanswered', 'the author asked to be asked and has not been');
    assert.deepEqual(deriveClassSource(graph[2], graph), { kind: 'ruling' }, 'a ruling on the node put it there');
  });

  test('deriveClass: an unruled node takes the nearest ancestor\'s conferred class, and names it as the source', () => {
    const graph = [
      node('root', { facts: [fact('authority', [{ name: 'delegated', ruling: ruling('x') }])] }),
      node('mid', { under: ['root'] }),
      node('leaf', { under: ['mid'] }),
    ];
    assert.equal(deriveClass(graph[2], graph), 'delegated');
    assert.deepEqual(deriveClassSource(graph[2], graph), { kind: 'ancestor', id: 'root' });
    assert.equal(deriveClass(node('lonely'), graph), 'unanswered');
    assert.equal(deriveClassSource(node('lonely'), graph), null);
  });

  test('deriveClass: at equal depth deferred wins, since authority only narrows on the way down', () => {
    const graph = [
      node('a-delegated', { facts: [fact('authority', [{ name: 'delegated', ruling: ruling('x') }])] }),
      node('z-deferred', { facts: [fact('authority', [{ name: 'deferred', ruling: ruling('x') }])] }),
      node('leaf', { under: ['a-delegated', 'z-deferred'] }),
    ];
    assert.equal(deriveClass(graph[2], graph), 'deferred');
    assert.deepEqual(deriveClassSource(graph[2], graph), { kind: 'ancestor', id: 'z-deferred' });
  });

  test('deriveClass: a ratified ancestor confers nothing and does not stop the walk', () => {
    const graph = [
      node('top', { facts: [fact('authority', [{ name: 'delegated', ruling: ruling('x') }])] }),
      node('mid', {
        under: ['top'],
        facts: [fact('answer', [{ name: 'standing', ruling: ruling('x') }], { stands: 'standing' })],
      }),
      node('leaf', { under: ['mid'] }),
    ];
    assert.equal(deriveClass(graph[1], graph), 'ratified');
    assert.equal(deriveClass(graph[2], graph), 'delegated', 'the walk passes the ratified node and reaches the delegation');
    assert.deepEqual(deriveClassSource(graph[2], graph), { kind: 'ancestor', id: 'top' });
  });

  test('deriveStatus: answered iff some ruling confers a class', () => {
    const delegated = node('d', { facts: [fact('authority', [{ name: 'delegated', ruling: ruling('x') }])] });
    const bare = node('b');
    assert.equal(deriveStatus(delegated, [delegated]), 'answered');
    assert.equal(deriveStatus(bare, [bare]), 'unanswered');
  });

  test('deriveClass accepts a Map, an array, or the {nodes} object readGraph returns', async () => {
    const graph = await readGraph(path.join(FIXTURES, 'valid-rulings'));
    const leaf = graph.nodes.find((n) => n.slug === 'inherits-delegated');
    const byId = new Map(graph.nodes.map((n) => [n.id, n]));
    assert.equal(deriveClass(leaf, graph), 'delegated');
    assert.equal(deriveClass(leaf, graph.nodes), 'delegated');
    assert.equal(deriveClass(leaf, byId), 'delegated');
  });

  test('factByName and ruledOption read one fact and its one ruled option', () => {
    const n = node('n', { facts: [fact('answer', [{ name: 'standing', ruling: ruling('x') }, 'other'])] });
    assert.equal(factByName(n, 'answer').name, 'answer');
    assert.equal(factByName(n, 'existence'), null);
    assert.equal(ruledOption(factByName(n, 'answer')), 'standing');
    assert.equal(ruledOption(null), null);
  });

  test('deriveCeiling finds the nearest ratified ancestor, breadth first, ties by id', () => {
    const ratified = (id, under = []) => node(id, {
      under,
      facts: [fact('answer', [{ name: 'standing', ruling: ruling('x') }], { stands: 'standing' })],
    });
    const nodesById = new Map([
      ['root', ratified('root')],
      ['mid', node('mid', { under: ['root'] })],
      ['leaf', node('leaf', { under: ['mid'] })],
      ['unrelated-root', node('unrelated-root')],
    ]);
    assert.equal(deriveCeiling('leaf', nodesById), 'root');
    assert.equal(deriveCeiling('root', nodesById), null, "a node's own ruling is not its own ceiling");
    assert.equal(deriveCeiling('unrelated-root', nodesById), null);
  });

  test("deriveSettles: settles is under + depends only -- a node's own options are carried but not summed in, and 'under' counts descendants that carry a stage", () => {
    const nodes = [
      node('parent', { stage: null }),
      node('child', {
        under: ['parent'],
        stage: 'periagogic',
        facts: [fact('answer', ['a', 'b', 'c'])],
      }),
      node('settled-child', { under: ['parent'], stage: null }),
    ];
    const settled = deriveSettles(nodes, deriveChildren(nodes));
    const parent = settled.get('parent');
    const child = settled.get('child');

    assert.equal(parent.settles, 1, 'only the descendant that carries a stage counts');
    assert.equal(parent.options, 0);
    assert.equal(child.settles, 0, 'child has no descendant or dependant of its own');
    assert.equal(child.options, 3, 'carried on the record even though it settles nothing else');
    assert.ok(parent.settles > child.settles, 'the parent settles strictly more, despite carrying fewer options');
  });

  // ---- the hashes ----

  test('deriveStandingHash: stripped frontmatter, then the answer, then the rationale', () => {
    const hash = deriveStandingHash({ fmText: 'question: Q?\nform: rule', answer: 'Ans.', rationale: 'Rat.' });
    assert.equal(hash, createHash('sha1').update('question: Q?\nform: rule\nAns.\nRat.', 'utf8').digest('hex'));
    const bare = deriveStandingHash({ fmText: 'question: Q?', answer: null, rationale: null });
    assert.equal(bare, createHash('sha1').update('question: Q?\n\n', 'utf8').digest('hex'), 'an absent section hashes as the empty string');
  });

  test('deriveStandingHash: stage, review, depends and facts (with everything nested under them) are invisible to it', () => {
    const bare = deriveStandingHash({ fmText: 'question: Q?\nform: rule', answer: 'Ans.', rationale: null });
    const dressedUp = deriveStandingHash({
      fmText: [
        'question: Q?',
        'stage: review',
        'facts:',
        '  - name: answer',
        '    options:',
        '      - name: standing',
        '        source: ai',
        '        ref: "2026-09-04"',
        '    stands: standing',
        'depends:',
        '  - example.test/main/open',
        'form: rule',
        'review:',
        '  verdict: forward',
        '  strength: none',
        '  date: 2026-01-01',
        `  of: ${'a'.repeat(40)}`,
      ].join('\n'),
      answer: 'Ans.', rationale: null,
    });
    assert.equal(bare, dressedUp, 'adding an option must not stale every pin');
  });

  test('deriveStandingHash: probes (with everything nested under them) are invisible to it', () => {
    const bare = deriveStandingHash({ fmText: 'question: Q?\nform: rule', answer: 'Ans.', rationale: null });
    const withProbe = deriveStandingHash({
      fmText: [
        'question: Q?',
        'stage: maieutic',
        'probes:',
        '  - id: whose-cap',
        '    asks: Is three still the right cap?',
        '    why: no measurement in the record backs the number',
        '    discharges: the cap recommendation',
        '    source: ai',
        '    raised: 2026-09-04',
        'form: rule',
      ].join('\n'),
      answer: 'Ans.', rationale: null,
    });
    assert.equal(bare, withProbe, 'recording a probe must not stale every pin');
  });

  test('deriveFactRecommendationHash: unmoved by a probe on a node with no fence, where the standing text also feeds the answer fact\'s hash', () => {
    const f = fact('answer', [{ name: 'standing', prose: '' }], { recommends: 'standing', boldness: 'low', stands: 'standing' });
    const noProbe = { fmText: 'question: Q?', answer: 'Ans.', rationale: null, fence: null, facts: [f] };
    const withProbe = {
      fmText: 'question: Q?\nprobes:\n  - id: x\n    asks: y\n    why: z\n    discharges: w\n    source: ai\n    raised: 2026-09-04',
      answer: 'Ans.', rationale: null, fence: null, facts: [f],
    };
    assert.equal(
      deriveFactRecommendationHash(noProbe, f),
      deriveFactRecommendationHash(withProbe, f),
      'an unstripped probe would mean recording one moves the answer fact\'s recommendation hash, and so review.of and a ruling\'s of',
    );
  });

  test('deriveFactRecommendationHash: name, recommends, boldness, the fact prose, the option prose, and -- for the answer fact -- the recommended text', () => {
    const f = fact('answer', [{ name: 'standing', prose: '' }, { name: 'other', prose: 'The other way.' }], {
      recommends: 'other', boldness: 'high', stands: 'standing', prose: 'Why the other way.',
    });
    const withFence = { fmText: 'question: Q?', answer: 'Ans.', rationale: null, fence: { raw: 'FENCE' }, facts: [f] };
    assert.equal(
      deriveFactRecommendationHash(withFence, f),
      createHash('sha1').update('answer\nother\nhigh\nWhy the other way.\nThe other way.\nFENCE', 'utf8').digest('hex'),
    );

    const noFence = { ...withFence, fence: null };
    assert.equal(
      deriveFactRecommendationHash(noFence, f),
      createHash('sha1').update('answer\nother\nhigh\nWhy the other way.\nThe other way.\nquestion: Q?\nAns.\n', 'utf8').digest('hex'),
      'with no fence the recommended text is the standing text',
    );

    const reserved = fact('existence', ['keep', 'prune'], { recommends: 'prune', boldness: 'low' });
    assert.equal(
      deriveFactRecommendationHash(noFence, reserved),
      createHash('sha1').update('existence\nprune\nlow\n\n', 'utf8').digest('hex'),
      'a reserved fact folds in no text of its own',
    );

    assert.equal(deriveFactRecommendationHash(noFence, fact('existence', ['keep'])), '', 'nothing recommended, nothing to pin');
  });

  test('deriveRecommendationHash: every fact name and hash in facts order -- what review.of pins', () => {
    const a = fact('answer', ['standing'], { recommends: 'standing', boldness: 'low', stands: 'standing' });
    const e = fact('existence', ['keep', 'prune'], { recommends: 'keep', boldness: 'low' });
    const n = { fmText: 'question: Q?', answer: 'Ans.', rationale: null, fence: null, facts: [a, e] };
    const expected = createHash('sha1').update(
      `answer\n${deriveFactRecommendationHash(n, a)}\nexistence\n${deriveFactRecommendationHash(n, e)}`,
      'utf8',
    ).digest('hex');
    assert.equal(deriveRecommendationHash(n), expected);
  });

  test('moved: a ruling whose pin no longer matches its fact; per fact and for the node', () => {
    const f = fact('answer', [{ name: 'standing', ruling: ruling('a'.repeat(40)) }], {
      recommends: 'standing', boldness: 'low', stands: 'standing',
    });
    const n = { id: 'n', fmText: 'question: Q?', answer: 'Ans.', rationale: null, fence: null, facts: [f] };
    assert.equal(factMoved(n, f), true);
    assert.equal(moved(n), true);
    assert.equal(proposal(n), true, 'a ratified node whose recommendation has moved is a proposal');

    f.options[0].ruling = ruling(deriveFactRecommendationHash(n, f));
    assert.equal(moved(n), false);
    assert.equal(proposal(n), false);
    assert.equal(factMoved(n, fact('existence', ['keep'])), false, 'a fact with no ruling has nothing to move from');
  });

  test('moved is per fact: a delegated node stays off the frontier when only the answer fact moves', () => {
    const answer = fact('answer', ['standing', 'narrower'], {
      recommends: 'narrower', boldness: 'low', stands: 'standing',
    });
    const authority = fact('authority', [{ name: 'delegated', ruling: null }], { recommends: 'delegated', boldness: 'low' });
    const n = { id: 'n', fmText: 'question: Q?', answer: 'Ans.', rationale: null, fence: { raw: 'F' }, facts: [answer, authority] };
    authority.options[0].ruling = ruling(deriveFactRecommendationHash(n, authority));
    assert.equal(moved(n), false, 'the ruling is on the authority fact, whose recommendation has not moved');
    assert.equal(deriveClass(n, [n]), 'delegated');
  });

  test('divergesFromRecommendation: the author ruled against the recommendation, which is not a move', () => {
    const f = fact('answer', [{ name: 'standing', ruling: ruling('x') }, 'bolder'], {
      recommends: 'bolder', boldness: 'high', stands: 'standing',
    });
    const n = { id: 'n', fmText: 'q', answer: 'A', rationale: null, fence: { raw: 'F' }, facts: [f] };
    assert.equal(divergesFromRecommendation(n), true);
    f.recommends = 'standing';
    assert.equal(divergesFromRecommendation(n), false);
    assert.equal(divergesFromRecommendation(node('unruled', { facts: [fact('answer', ['standing'])] })), false);
  });

  test('onFrontier and reviewStale', () => {
    assert.equal(onFrontier({ stage: 'review' }), true);
    assert.equal(onFrontier({ stage: null }), false);
    assert.equal(onFrontier({}), false);
    const n = { fmText: 'q', answer: null, rationale: null, fence: null, facts: [] };
    assert.equal(reviewStale({ ...n, review: null }), false);
    assert.equal(reviewStale({ ...n, review: { of: 'a'.repeat(40) } }), true);
    assert.equal(reviewStale({ ...n, review: { of: deriveRecommendationHash(n) } }), false);
  });

  // ---- the one home for an option's sentence ----

  test('glossary maps every glossed term to its gloss and its definer, first definition winning', () => {
    const graph = [
      node('a', { defines: [{ term: 'ratified', gloss: 'The author ruled on the answer.' }, { term: 'bare', gloss: null }] }),
      node('b', { defines: [{ term: 'ratified', gloss: 'A second definition, which does not win.' }] }),
      node('c'),
    ];
    const terms = glossary(graph);
    assert.deepEqual(terms.get('ratified'), { gloss: 'The author ruled on the answer.', node: 'a' });
    assert.equal(terms.get('bare'), undefined, 'a term with no gloss has no sentence to project');
    assert.equal(terms.size, 1);
    assert.equal(glossary(graph), terms, 'memoized on the graph it was derived from');
    assert.equal(glossary({ nodes: graph }).get('ratified').node, 'a', 'and reads the {nodes} shape too');
  });

  test("optionText reads every option's sentence from its one home, and null where none is recorded", () => {
    const definer = node('def', { defines: [{ term: 'prune', gloss: 'The node leaves the record.' }] });
    const answer = fact('answer', [
      { name: 'standing', prose: '' },
      { name: 'other', prose: 'The other way.' },
      { name: 'silent', prose: '' },
    ], { stands: 'standing' });
    const persistence = fact('persistence', [{ name: 'present', prose: 'Kept on the node.' }]);
    const existence = fact('existence', ['keep', 'prune']);
    const n = node('n', { answer: 'What stands, in full.', facts: [answer, persistence, existence] });
    const graph = [definer, n];

    assert.deepEqual(optionText(graph, n, answer, answer.options[0]), { text: 'What stands, in full.', from: 'n' }, "the standing option's text is the '## Answer' section");
    assert.deepEqual(optionText(graph, n, answer, answer.options[1]), { text: 'The other way.', from: 'n' });
    assert.equal(optionText(graph, n, answer, answer.options[2]), null, 'nothing recorded, nothing to show');
    assert.deepEqual(optionText(graph, n, persistence, persistence.options[0]), { text: 'Kept on the node.', from: 'n' });
    assert.deepEqual(
      optionText(graph, n, existence, existence.options[1]),
      { text: 'The node leaves the record.', from: 'def' },
      "a vocabulary option's sentence comes from the node that defines the term",
    );
    assert.equal(optionText(graph, n, existence, existence.options[0]), null, 'and is null where the term carries no gloss');
    assert.equal(optionText(graph, n, answer, null), null);
  });

  // ---- what the pins do and do not see ----

  test('the pins do not move for an edit beside the recommendation: an option added or removed, passed over, given prose, or a ruling given a reason', () => {
    const base = () => {
      const answer = fact('answer', [
        { name: 'standing', prose: '' },
        { name: 'other', prose: 'The other way.' },
        { name: 'third', prose: '' },
      ], { recommends: 'other', boldness: 'high', stands: 'standing', prose: 'Why the other way.' });
      const existence = fact('existence', [{ name: 'keep', ruling: ruling('x') }, 'prune'], { recommends: 'keep', boldness: 'low' });
      return {
        id: 'n', fmText: 'question: Q?', answer: 'Ans.', rationale: null, fence: { raw: 'FENCE' }, facts: [answer, existence],
      };
    };
    const pins = (n) => [deriveRecommendationHash(n), ...n.facts.map((f) => deriveFactRecommendationHash(n, f))].join(' ');
    const before = pins(base());

    const added = base();
    added.facts[0].options.push({ ...OPTION_DEFAULTS, name: 'fourth', prose: 'A late arrival.' });
    assert.equal(pins(added), before, 'an option added beside the recommended one, subsection and all');

    const removed = base();
    removed.facts[0].options = removed.facts[0].options.filter((o) => o.name !== 'third');
    assert.equal(pins(removed), before, 'and one removed');

    const passed = base();
    Object.assign(passed.facts[0].options[2], { status: 'passed', reason: 'Dominated on every criterion.' });
    assert.equal(pins(passed), before, 'a viability judgment recorded on an option that is not recommended');

    const reasoned = base();
    reasoned.facts[1].options[0].ruling = ruling('x', { reason: 'Because the question is still live.' });
    assert.equal(pins(reasoned), before, "the author's reason for a ruling");

    const argued = base();
    argued.facts[0].against = 'What the recommendation costs, said by the AI that made it.';
    assert.equal(pins(argued), before, 'the case against the recommendation, which argues about it and is not it');
  });

  test("deriveReadings inverts every reading's bears, keyed by node, fact, and option", () => {
    const readings = deriveReadings([
      { id: 'z', bears: [{ node: 'target', fact: 'answer', option: 'standing', relation: 'diverged' }] },
      { id: 'a', bears: [{ node: 'target', fact: 'answer', option: 'standing', relation: 'adopted' }] },
      { id: 'no-bears' },
    ]);
    assert.deepEqual(readings.get('target\nanswer\nstanding'), [
      { id: 'a', relation: 'adopted' },
      { id: 'z', relation: 'diverged' },
    ]);
    assert.equal(readings.get('target\nanswer\nother'), undefined);
  });
});

// ---------------------------------------------------------------------------
// parseNode
// ---------------------------------------------------------------------------

describe('parseNode', () => {
  const loc = { id: 'm/g/s', graph: 'g', slug: 's', path: 'g/s.md' };
  // Every staged node carries the authority fact, so every staged fixture
  // text below carries it too (commons.systems/disposition-graph/dialogue,
  // `authority-fact-on-every-node`).
  const AUTHORITY_FACT = [
    '  - name: authority',
    '    options:',
    '      - name: ratified',
    '      - name: delegated',
  ];
  const ANSWER_FACT = [
    'facts:',
    '  - name: answer',
    '    options:',
    '      - name: standing',
    '        source: ai',
    '        ref: "2026-09-04"',
    '    stands: standing',
    ...AUTHORITY_FACT,
  ];

  test('parses a minimal unanswered (un-aligned) question', () => {
    const n = parseNode('---\nquestion: What?\nstage: periagogic\n---\n\n## Disposition\n\nOpen for now.\n', loc);
    assert.equal(n.question, 'What?');
    assert.equal(n.answer, null);
    assert.equal(n.form, null);
    assert.equal(n.stage, 'periagogic');
    assert.equal(n.disposition, 'Open for now.');
    assert.deepEqual(n.under, []);
    assert.deepEqual(n.cites, []);
    assert.deepEqual(n.shims, []);
    assert.deepEqual(n.facts, []);
    assert.equal(n.answerFact, null);
    assert.equal(n.fence, null);
    assert.equal(n.onFrontier, true);
    assert.equal(n.moved, false);
  });

  test('rejects a file with no frontmatter delimiter', () => {
    assert.throws(() => parseNode('question: What?\n', loc), /frontmatter delimiter/);
  });

  test('rejects unclosed frontmatter', () => {
    assert.throws(() => parseNode('---\nquestion: What?\n', loc), /never closed/);
  });

  test('collects multiple problems from one file, not just the first', () => {
    const text = '---\nbogus: 1\nform: reading\n---\n\n## Answer\n\nx\n';
    assert.throws(() => parseNode(text, loc), (err) => {
      const lines = err.message.split('\n');
      assert.ok(lines.some((l) => l.includes("unknown frontmatter key 'bogus'")));
      assert.ok(lines.some((l) => l.includes("'question' is required")));
      assert.ok(lines.some((l) => l.includes("'source' is required")));
      assert.ok(lines.some((l) => l.includes("'bears' is required")));
      assert.ok(lines.every((l) => l.startsWith('g/s.md: ')));
      return true;
    });
  });

  // ---- the keys the encoding of 2026-09-04 removed ----

  for (const [key, block] of [
    ['authority', 'authority:\n  class: ratified\n  by: x\n  date: 2026-01-01'],
    ['alternatives', 'alternatives:\n  - name: other\n    source: ai'],
    ['recommendation', 'recommendation:\n  adopts: standing\n  boldness: low'],
    ['relation', 'relation: adopted'],
  ]) {
    test(`'${key}' is rejected by name, not as an unknown key`, () => {
      const text = `---\nquestion: What?\nstage: periagogic\n${block}\n---\n\n## Disposition\n\nOpen.\n`;
      assert.throws(() => parseNode(text, loc), (err) => {
        assert.match(err.message, new RegExp(`'${key}' is no longer a frontmatter key: the encoding changed on 2026-09-04`));
        assert.doesNotMatch(err.message, new RegExp(`unknown frontmatter key '${key}'`));
        return true;
      });
    });
  }

  // ---- order: per-file shape checks (graph-level scope/existence checks
  // need the whole graph and are covered by the fixtures below instead). ----

  const answered = (extraFm) => [
    '---', 'question: Q?', 'form: rule', 'stage: maieutic', ...(extraFm ?? []), ...ANSWER_FACT, '---', '',
    '## Answer', '', 'x', '',
  ].join('\n');

  test('order: a bare string step and a tied-list step both normalize to arrays of ids', () => {
    assert.deepEqual(parseNode(answered(['order:', '  - [a, b]', '  - c']), loc).order, [['a', 'b'], ['c']]);
  });

  test('order: absent field normalizes to an empty array', () => {
    assert.deepEqual(parseNode(answered(), loc).order, []);
  });

  test('order: rejects a non-list value and a step that is neither a string nor a list', () => {
    assert.throws(
      () => parseNode('---\nquestion: Q?\nstage: periagogic\norder: not-a-list\n---\n\n## Disposition\n\nx\n', loc),
      /'order' must be a list of steps, each a node id or a list of node ids/,
    );
    assert.throws(() => parseNode(answered(['order:', '  - 5']), loc), /'order' must be a list of steps/);
  });

  test('order: an empty-list step is reported by number, one-based', () => {
    assert.throws(() => parseNode(answered(['order:', '  - a', '  - []']), loc), /'order' step 2 is empty/);
  });

  test('order: an id repeated across steps is reported once per repeat', () => {
    assert.throws(() => parseNode(answered(['order:', '  - a', '  - [a, b]']), loc), /'order' names a twice/);
  });

  test("order requires an '## Answer' section", () => {
    const text = '---\nquestion: Q?\nstage: periagogic\norder:\n  - a\n---\n\n## Disposition\n\nOpen.\n';
    assert.throws(() => parseNode(text, loc), /'order' requires an '## Answer' section/);
  });

  // ---- '## Recommendation': dialogue.md's "the validator parses it and
  // checks only that it answers the same question" -- no field rule, shape
  // rule, or vocabulary applies inside the fence beyond the keys that belong
  // to the node rather than to the text it would stand on. ----

  const fenced = (fenceLines) => [
    '---', 'question: What?', 'form: rule', 'stage: maieutic',
    'facts:', '  - name: answer', '    options:',
    '      - name: standing', '        source: ai', '        ref: "2026-09-04"',
    '      - name: other-way', '        source: ai', '        ref: "2026-09-04"',
    '    recommends: other-way', '    boldness: low', '    stands: standing',
    ...AUTHORITY_FACT, '---', '',
    '## Answer', '', 'x', '',
    '## Facts', '', '### answer', '', '#### other-way', '', 'The other way.', '',
    '## Recommendation', '', '```markdown', ...fenceLines, '```', '',
  ].join('\n');

  test('a fence with an unknown frontmatter key parses -- only structure, the question, and the forbidden keys are checked', () => {
    const n = parseNode(fenced(['---', 'question: What?', 'bogus: true', '---', '', '## Answer', '', 'x']), loc);
    assert.ok(n.fence, 'the fence parses despite its unrecognized frontmatter key');
    assert.equal(n.fence.question, 'What?');
    assert.equal(n.fence.frontmatter.bogus, true, 'the frontmatter comes back exactly as written');
    assert.equal(n.fence.sections.Answer, 'x');
  });

  for (const key of ['authority', 'facts', 'stage', 'review', 'depends', 'probes']) {
    test(`a fence carrying '${key}' is rejected: it belongs to the node, not to the text it would stand on`, () => {
      const value = key === 'facts' || key === 'depends' || key === 'probes' ? '\n  - name: answer' : key === 'stage' ? ' review' : '\n  x: 1';
      const text = fenced(['---', 'question: What?', `${key}:${value}`, '---', '', '## Answer', '', 'x']);
      assert.throws(() => parseNode(text, loc), new RegExp(`'## Recommendation' carries '${key}'`));
    });
  }

  test("a fence may carry 'defines' with glosses, which come back exactly as written", () => {
    const n = parseNode(fenced([
      '---', 'question: What?', 'defines:', '  - term: vocabulary', '    gloss: What a reserved fact offers.',
      '---', '', '## Answer', '', 'x',
    ]), loc);
    assert.deepEqual(n.fence.frontmatter.defines, [{ term: 'vocabulary', gloss: 'What a reserved fact offers.' }]);
    assert.equal(n.defines, null, 'the node itself defines nothing');
  });

  test("a fence carrying a '## Facts' section is rejected for the same reason", () => {
    const text = fenced(['---', 'question: What?', '---', '', '## Answer', '', 'x', '', '## Facts', '', '### answer', '', 'y']);
    assert.throws(() => parseNode(text, loc), /'## Recommendation' carries a '## Facts' section/);
  });

  // ---- '## Facts': one '### <fact>' per fact that needs explaining, one
  // '#### <option>' per answer option that is not the one that stands. ----

  test("'## Facts' rejects prose before its first '### ' heading", () => {
    const text = [
      '---', 'question: What?', 'stage: periagogic',
      'facts:', '  - name: existence', '    options:', '      - name: keep', '      - name: prune',
      ...AUTHORITY_FACT, '---', '',
      '## Disposition', '', 'Open.', '',
      '## Facts', '', 'Stray prose belonging to no fact.', '', '### existence', '', 'Keep it.', '',
    ].join('\n');
    assert.throws(
      () => parseNode(text, loc),
      /'## Facts' has text before the first '### ' heading: "Stray prose belonging to no fact\."/,
    );
  });

  test("a '###' heading outside '## Facts' stays content, and so does a '####' one", () => {
    const text = [
      '---', 'question: What?', 'stage: periagogic', '---', '',
      '## Disposition', '', 'Open.', '',
      '## Account', '', '### Clean-context review, 2026-09-03', '',
      'The reviewer read the node and forwarded it.', '', '#### A nested note', '', 'Which is content too.', '',
    ].join('\n');
    const n = parseNode(text, loc);
    assert.ok(n.account.startsWith('### Clean-context review, 2026-09-03'));
    assert.ok(n.account.includes('#### A nested note'));
    assert.deepEqual(n.facts, []);
  });

  test("a '### ' heading inside a fenced example within '## Facts' is content, not a subsection", () => {
    const text = [
      '---', 'question: What?', 'stage: periagogic',
      'facts:', '  - name: existence', '    options:', '      - name: keep', '      - name: prune',
      ...AUTHORITY_FACT, '---', '',
      '## Disposition', '', 'Open.', '',
      '## Facts', '', '### existence', '', 'Shown by example:', '', '```', '### mysterious', '```', '',
    ].join('\n');
    const n = parseNode(text, loc);
    assert.ok(n.facts[0].prose.includes('### mysterious'), 'the fenced heading survives as prose');
  });

  test('the fact and option prose land on the fact and the option', () => {
    const text = [
      '---', 'question: What?', 'form: rule', 'stage: maieutic',
      'facts:', '  - name: answer', '    options:',
      '      - name: standing', '        source: ai', '        ref: "2026-09-04"',
      '      - name: other-way', '        source: ai', '        ref: "2026-09-04"',
      '    stands: standing',
      '  - name: existence', '    options:', '      - name: keep', '      - name: prune',
      ...AUTHORITY_FACT, '---', '',
      '## Answer', '', 'x', '',
      '## Facts', '', '### answer', '', 'Why this one.', '', '#### other-way', '', 'The road not taken.', '',
      '### existence', '', 'Keep it.', '',
    ].join('\n');
    const n = parseNode(text, loc);
    assert.equal(n.answerFact.prose, 'Why this one.');
    assert.equal(n.answerFact.options[0].prose, '', "the standing option's text is the '## Answer' section");
    assert.equal(n.answerFact.options[1].prose, 'The road not taken.');
    assert.equal(n.facts[1].prose, 'Keep it.');
    assert.equal(n.facts[1].options[0].prose, '');
  });

  // A vocabulary fact's option names mean the same on every node, so their
  // sentence is the gloss on the node that defines the term and never a
  // subsection here; a persistence option's is written per node, so every one
  // of them owes one (commons.systems/disposition-graph/dialogue,
  // `every-option-carries-its-sentence`).
  for (const name of ['authority', 'existence']) {
    const option = name === 'authority' ? 'ratified' : 'prune';
    test(`a '#### ' subsection under '### ${name}' is rejected: a vocabulary fact's options carry none`, () => {
      const options = name === 'authority'
        ? ['      - name: ratified', '      - name: delegated']
        : ['      - name: keep', '      - name: prune'];
      const text = [
        '---', 'question: What?', 'stage: periagogic',
        'facts:', `  - name: ${name}`, '    options:', ...options,
        ...(name === 'authority' ? [] : AUTHORITY_FACT), '---', '',
        '## Disposition', '', 'Open.', '',
        '## Facts', '', `### ${name}`, '', 'Why this one.', '', `#### ${option}`, '', 'Said here instead.', '',
      ].join('\n');
      assert.throws(
        () => parseNode(text, loc),
        new RegExp(`'### ${name}' has '#### ${option}', which a vocabulary fact's options do not carry`),
      );
    });
  }

  test("a passed answer option owes its '#### ' subsection like any other option that is not the standing one", () => {
    const text = [
      '---', 'question: What?', 'form: rule', 'stage: periagogic',
      'facts:', '  - name: answer', '    options:',
      '      - name: standing', '        source: ai', '        ref: "2026-09-04"',
      '      - name: dominated', '        source: ai', '        ref: "2026-09-04"',
      '        status: passed', '        reason: Beaten on every criterion the record names.',
      '    stands: standing', ...AUTHORITY_FACT, '---', '', '## Answer', '', 'x', '',
      '## Facts', '', '### answer', '', 'Why this one.', '',
    ].join('\n');
    assert.throws(() => parseNode(text, loc), /expected '#### dominated' at position 1, found nothing/);
    const written = parseNode(`${text}\n#### dominated\n\nWhat it would have answered.\n`, loc);
    assert.equal(written.answerFact.options[1].status, 'passed');
    assert.equal(written.answerFact.options[1].prose, 'What it would have answered.');
  });

  test("a vocabulary fact may only offer its own vocabulary, and persistence names its options freely", () => {
    const withOptions = (name, options, tail = []) => [
      '---', 'question: What?', 'stage: periagogic',
      'facts:', `  - name: ${name}`, '    options:', ...options.map((o) => `      - name: ${o}`),
      ...(name === 'authority' ? [] : AUTHORITY_FACT), '---', '',
      '## Disposition', '', 'Open.', '', ...tail,
    ].join('\n');
    assert.throws(
      () => parseNode(withOptions('existence', ['keep', 'delete']), loc),
      /fact 'existence' may only offer its own vocabulary: keep, prune/,
    );
    assert.throws(
      () => parseNode(withOptions('authority', ['ratified', 'blessed']), loc),
      /fact 'authority' may only offer the classes a ruling confers: ratified, delegated, deferred/,
    );
    const free = parseNode(
      withOptions('persistence', ["with the page's shim"], [
        '## Facts', '', '### persistence', '', "#### with the page's shim", '', 'Kept as it is.', '',
      ]),
      loc,
    );
    assert.deepEqual(free.facts[0].options.map((o) => o.name), ["with the page's shim"]);
  });

  test("every persistence option owes a '#### ' subsection of its own", () => {
    const head = [
      '---', 'question: What?', 'stage: periagogic',
      'facts:', '  - name: persistence', '    options:', '      - name: derived', '      - name: present',
      ...AUTHORITY_FACT, '---', '',
      '## Disposition', '', 'Open.', '',
    ];
    assert.throws(
      () => parseNode([...head, '## Facts', '', '### persistence', '', 'Why present.', '', '#### present', '', 'Kept here.', ''].join('\n'), loc),
      /'### persistence' subsections must match the persistence fact's options in order: expected '#### derived' at position 1, found '#### present'/,
    );
    assert.throws(
      () => parseNode(head.join('\n'), loc),
      /the persistence fact carries 'derived', 'present', which requires a '## Facts' section stating each in prose/,
    );
    const n = parseNode([
      ...head, '## Facts', '', '### persistence', '', 'Why present.', '',
      '#### derived', '', 'Derived from elsewhere.', '', '#### present', '', 'Kept here.', '',
    ].join('\n'), loc);
    assert.equal(n.facts[0].options[0].prose, 'Derived from elsewhere.');
    assert.equal(n.facts[0].options[1].prose, 'Kept here.');
  });

  test('a fact may be omitted from ## Facts, but an answer option that is not the standing one may not', () => {
    const withOwedOption = [
      '---', 'question: What?', 'form: rule', 'stage: maieutic',
      'facts:', '  - name: answer', '    options:',
      '      - name: standing', '        source: ai', '        ref: "2026-09-04"',
      '      - name: other-way', '        source: ai', '        ref: "2026-09-04"',
      '    stands: standing', ...AUTHORITY_FACT, '---', '', '## Answer', '', 'x', '',
      '## Facts', '', '### answer', '', 'Why this one.', '',
    ].join('\n');
    assert.throws(() => parseNode(withOwedOption, loc), /expected '#### other-way' at position 1, found nothing/);
    // the same node with no '## Facts' section at all names what is owed
    assert.throws(
      () => parseNode(withOwedOption.split('\n## Facts')[0] + '\n', loc),
      /the answer fact carries 'other-way' beside the option that stands, which requires a '## Facts' section/,
    );
  });

  test("the option named by 'stands' may keep a '#### ' subsection of its own", () => {
    const text = [
      '---', 'question: What?', 'form: rule', 'stage: maieutic',
      'facts:', '  - name: answer', '    options:',
      '      - name: standing', '        source: ai', '        ref: "2026-09-04"',
      '    stands: standing', ...AUTHORITY_FACT, '---', '', '## Answer', '', 'x', '',
      '## Facts', '', '### answer', '', 'Why this one.', '', '#### standing', '', 'What it answers.', '',
    ].join('\n');
    assert.equal(parseNode(text, loc).answerFact.options[0].prose, 'What it answers.');
  });

  test('facts keep the order they are written in -- presentation order, not a reserved one', () => {
    const order = [['persistence', 'present'], ['authority', 'delegated'], ['existence', 'keep']];
    const lines = ['---', 'question: What?', 'stage: periagogic', 'facts:'];
    for (const [name, option] of order) lines.push(`  - name: ${name}`, '    options:', `      - name: ${option}`);
    lines.push(
      '---', '', '## Disposition', '', 'Open.', '',
      '## Facts', '', '### persistence', '', '#### present', '', 'Kept here.', '',
    );
    assert.deepEqual(parseNode(lines.join('\n'), loc).facts.map((f) => f.name), order.map(([n]) => n));
  });
});

// ---------------------------------------------------------------------------
// parseNode: probes
// ---------------------------------------------------------------------------

describe('parseNode: probes', () => {
  const loc = { id: 'm/g/s', graph: 'g', slug: 's', path: 'g/s.md' };
  const AUTHORITY_FACT = [
    '  - name: authority',
    '    options:',
    '      - name: ratified',
    '      - name: delegated',
  ];
  const ANSWER_FACT = [
    'facts:',
    '  - name: answer',
    '    options:',
    '      - name: standing',
    '        source: ai',
    '        ref: "2026-09-04"',
    '    stands: standing',
    ...AUTHORITY_FACT,
  ];
  // A node at the maieutic stage, with an answer fact, and whatever extra
  // frontmatter lines a test needs spliced in above the facts -- the same
  // shape 'parseNode's own 'answered' helper builds.
  const answered = (extraFm) => [
    '---', 'question: Q?', 'form: rule', 'stage: maieutic', ...(extraFm ?? []), ...ANSWER_FACT, '---', '',
    '## Answer', '', 'x', '',
  ].join('\n');

  const PROBE_BASE = {
    id: 'cap-still-right',
    asks: 'Is three still the right cap?',
    why: 'no measurement in the record backs the number',
    discharges: 'the cap recommendation',
    source: 'ai',
    raised: '2026-09-04',
  };
  // One probe's fields as YAML lines under 'probes:', in insertion order --
  // so a required key can be tested by omitting it from the object passed in.
  function probeYaml(fields) {
    const keys = Object.keys(fields);
    const lines = ['probes:'];
    keys.forEach((k, i) => {
      lines.push(`${i === 0 ? '  - ' : '    '}${k}: ${fields[k]}`);
    });
    return lines;
  }

  test('a well-formed probe parses onto the node', () => {
    const n = parseNode(answered(probeYaml(PROBE_BASE)), loc);
    assert.deepEqual(n.probes, [{
      ...PROBE_BASE,
      fact: null,
      status: null,
      reason: null,
    }]);
  });

  for (const key of ['id', 'asks', 'why', 'discharges', 'source', 'raised']) {
    test(`a probe missing '${key}' is a problem`, () => {
      const fields = { ...PROBE_BASE };
      delete fields[key];
      assert.throws(() => parseNode(answered(probeYaml(fields)), loc), new RegExp(`'probes\\[0\\]\\.${key}'`));
    });
  }

  test("a probe with 'status' and no 'reason' is a problem", () => {
    const text = answered(probeYaml({ ...PROBE_BASE, status: 'discharged' }));
    assert.throws(
      () => parseNode(text, loc),
      /'probes\[0\]\.reason' is required when 'probes\[0\]\.status' is present/,
    );
  });

  test("a probe with 'reason' and no 'status' is a problem", () => {
    const text = answered(probeYaml({ ...PROBE_BASE, reason: 'the record already answers it' }));
    assert.throws(
      () => parseNode(text, loc),
      /'probes\[0\]\.reason' is only allowed when 'probes\[0\]\.status' is present/,
    );
  });

  test("a probe 'status' other than 'discharged' is a problem", () => {
    const text = answered(probeYaml({ ...PROBE_BASE, status: 'closed', reason: 'the author answered it' }));
    assert.throws(() => parseNode(text, loc), /'probes\[0\]\.status' must be 'discharged'/);
  });

  test('a probe discharged with status and reason together parses', () => {
    const n = parseNode(answered(probeYaml({ ...PROBE_BASE, status: 'discharged', reason: 'the author answered it' })), loc);
    assert.equal(n.probes[0].status, 'discharged');
    assert.equal(n.probes[0].reason, 'the author answered it');
  });

  test('a duplicate probe id on one node is a problem', () => {
    const text = answered([
      'probes:',
      '  - id: same-id',
      '    asks: First question?',
      '    why: First why.',
      '    discharges: First discharge.',
      '    source: ai',
      '    raised: 2026-09-04',
      '  - id: same-id',
      '    asks: Second question?',
      '    why: Second why.',
      '    discharges: Second discharge.',
      '    source: review',
      '    raised: 2026-09-04',
    ]);
    assert.throws(() => parseNode(text, loc), /'probes\[1\]\.id' duplicates another probe's id 'same-id'/);
  });

  test("a probe with a bad 'raised' date is a problem", () => {
    const text = answered(probeYaml({ ...PROBE_BASE, raised: '09-04-2026' }));
    assert.throws(() => parseNode(text, loc), /'probes\[0\]\.raised' must be a YYYY-MM-DD date string/);
  });

  test("a probe 'fact' outside FACT_NAMES is a problem", () => {
    const text = answered(probeYaml({ ...PROBE_BASE, fact: 'bogus' }));
    assert.throws(() => parseNode(text, loc), /'probes\[0\]\.fact' must be one of: answer, authority, existence, persistence/);
  });

  test("a probe naming a valid fact parses", () => {
    const n = parseNode(answered(probeYaml({ ...PROBE_BASE, fact: 'answer' })), loc);
    assert.equal(n.probes[0].fact, 'answer');
  });

  test('an unknown key on a probe is a problem', () => {
    const text = answered(probeYaml({ ...PROBE_BASE, bogus: 'nope' }));
    assert.throws(() => parseNode(text, loc), /unknown key 'probes\[0\]\.bogus'/);
  });

  test('four open probes parse without complaint -- the cap of three binds the movement and is checked by the readings, not the reader', () => {
    const lines = ['probes:'];
    for (let i = 0; i < 4; i += 1) {
      lines.push(
        `  - id: probe-${i}`,
        `    asks: Question ${i}?`,
        `    why: Why ${i}.`,
        `    discharges: Discharge ${i}.`,
        '    source: ai',
        '    raised: 2026-09-04',
      );
    }
    const n = parseNode(answered(lines), loc);
    assert.equal(n.probes.length, 4);
    assert.ok(n.probes.every((p) => p.status === null), 'all four stand open');
  });

  test("a node with 'probes' and no 'stage' is a problem", () => {
    const text = [
      '---', 'question: What?',
      ...probeYaml(PROBE_BASE),
      '---', '',
      'Just body text, no dialogue section at all.', '',
    ].join('\n');
    assert.throws(
      () => parseNode(text, loc),
      /'review', 'depends', 'probes', and '## Account' are parts of the dialogue and require stage/,
    );
  });

  test("'probes' absent normalizes to an empty array", () => {
    assert.deepEqual(parseNode(answered(), loc).probes, []);
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
    const n = graph.nodes.find((x) => x.id === id);
    assert.ok(n, `expected a node with id ${id}`);
    return n;
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

  test('ceiling: nearest ancestor whose class is ratified, across a multi-parent join, or null', async () => {
    assert.equal((await byId('example.test/main/root-a')).ceiling, null);
    assert.equal((await byId('example.test/main/root-b')).ceiling, null, 'ratified is not its own ceiling');
    assert.equal((await byId('example.test/pub/note')).ceiling, null);
    assert.equal((await byId('example.test/main/child-a1')).ceiling, null);
    assert.equal((await byId('example.test/main/multi')).ceiling, 'example.test/main/root-b');
    assert.equal((await byId('example.test/main/reading')).ceiling, 'example.test/main/root-b');
  });

  test('class and status', async () => {
    const rootB = await byId('example.test/main/root-b');
    assert.equal(rootB.class, 'ratified');
    assert.deepEqual(rootB.classSource, { kind: 'ruling' });
    assert.equal(rootB.status, 'answered');
    assert.equal(rootB.stage, null, 'a ratified node carries no stage');
    for (const slug of ['root-a', 'child-a1', 'child-a2', 'multi', 'reading']) {
      const n = await byId(`example.test/main/${slug}`);
      assert.equal(n.class, 'unanswered', `${slug} carries no ruling and none reaches it`);
      assert.equal(n.classSource, null);
      assert.equal(n.status, 'unanswered');
    }
  });

  test('children', async () => {
    assert.deepEqual((await byId('example.test/main/root-a')).children, [
      'example.test/main/child-a1',
      'example.test/main/child-a2',
    ]);
    assert.deepEqual((await byId('example.test/main/root-b')).children, ['example.test/main/multi']);
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

  test("a reading carries source and bears; an entry with no node of its own takes the reading's one parent", async () => {
    const reading = await byId('example.test/main/reading');
    assert.equal(reading.form, 'reading');
    assert.equal(reading.source, 'Aristotle, Nicomachean Ethics I.4');
    assert.deepEqual(reading.bears, [
      { node: 'example.test/main/multi', fact: 'answer', option: 'standing', relation: 'adopted' },
    ]);
    const multi = await byId('example.test/main/multi');
    assert.deepEqual(multi.answerFact.options[0].readings, [
      { id: 'example.test/main/reading', relation: 'adopted' },
    ], 'the option carries the derived inverse');
  });

  test('boost is recorded only on the ratified node', async () => {
    assert.equal((await byId('example.test/main/root-b')).boost, 2);
    assert.equal((await byId('example.test/main/root-a')).boost, null);
  });

  test('hash is a 40-hex git blob sha', async () => {
    const n = await byId('example.test/main/root-a');
    assert.match(n.hash, /^[0-9a-f]{40}$/);
    const bytes = await readFile(path.join(VALID_DIR, 'main/root-a.md'));
    assert.equal(n.hash, blobSha1(bytes));
  });

  test('the reader recomputes its own hashes from the node it returns', async () => {
    const n = await byId('example.test/main/root-b');
    assert.equal(deriveStandingHash(n), n.standingHash);
    assert.equal(deriveRecommendationHash(n), n.recommendationHash);
    assert.equal(n.answerFact.options[0].ruling.of, n.answerFact.recommendationHash, 'the fixture pins its own recommendation');
    assert.equal(n.moved, false);
  });
});

// ---------------------------------------------------------------------------
// readGraph: valid-rulings fixture -- the class, read off the rulings
// ---------------------------------------------------------------------------

describe('readGraph: valid-rulings fixture', () => {
  const graphPromise = readGraph(path.join(FIXTURES, 'valid-rulings'));
  async function bySlug(slug) {
    const graph = await graphPromise;
    const n = graph.nodes.find((x) => x.slug === slug);
    assert.ok(n, `expected a node with slug ${slug}`);
    return n;
  }

  test('a ruled answer fact makes the node ratified, off the frontier, and not a proposal', async () => {
    const n = await bySlug('ratified');
    assert.equal(n.class, 'ratified');
    assert.deepEqual(n.classSource, { kind: 'ruling' });
    assert.equal(n.status, 'answered');
    assert.equal(n.stage, null);
    assert.equal(n.onFrontier, false);
    assert.equal(n.moved, false);
    assert.equal(n.proposal, false);
    assert.equal(n.divergesFromRecommendation, false);
    assert.equal(n.answerFact.ruled, 'standing');
    assert.equal(n.answerFact.options[0].ruling.response, 'confirm');
  });

  test('a ruled authority fact confers delegated, and the answer fact may then move without moving the node onto the frontier', async () => {
    const n = await bySlug('delegated');
    assert.equal(n.class, 'delegated');
    assert.deepEqual(n.classSource, { kind: 'ruling' });
    assert.equal(n.stage, null);
    assert.equal(n.moved, false, 'the ruling is on the authority fact, and its recommendation has not moved');
    assert.equal(n.answerFact.recommends, 'narrower');
    assert.equal(n.answerFact.stands, 'standing');
    assert.ok(n.fence, 'a recommendation that is not what stands is quoted whole');
    assert.equal(n.fence.question, n.question);
    assert.equal(n.facts[1].ruled, 'delegated');
    assert.equal(n.facts[1].moved, false);
  });

  test('a ruled authority fact of deferred keeps the node on the alignment frontier', async () => {
    const n = await bySlug('deferred');
    assert.equal(n.class, 'deferred');
    assert.equal(n.status, 'answered');
    assert.equal(n.onFrontier, true);
    assert.equal(n.stage, 'review');
  });

  test("a ruled authority fact of ratified leaves the node unanswered: the author has not been asked", async () => {
    const n = await bySlug('authority-ratified');
    assert.equal(n.class, 'unanswered');
    assert.deepEqual(n.classSource, { kind: 'ruling' });
    assert.equal(n.status, 'unanswered');
    assert.equal(n.onFrontier, true);
  });

  test('an unruled node takes its class from the nearest ancestor that has one', async () => {
    const delegated = await bySlug('inherits-delegated');
    assert.equal(delegated.class, 'delegated');
    assert.deepEqual(delegated.classSource, { kind: 'ancestor', id: 'example.test/main/delegated' });
    assert.equal(delegated.stage, null, 'a delegated node is off the alignment frontier');

    const deferred = await bySlug('inherits-deferred');
    assert.equal(deferred.class, 'deferred');
    assert.deepEqual(deferred.classSource, { kind: 'ancestor', id: 'example.test/main/deferred' });
    assert.equal(deferred.stage, 'periagogic', 'a deferred node stays on it');
  });

  test('a ratified node whose recommendation has moved is a proposal, and carries a stage again', async () => {
    const n = await bySlug('moved');
    assert.equal(n.class, 'ratified');
    assert.equal(n.moved, true);
    assert.equal(n.proposal, true);
    assert.equal(n.onFrontier, true);
    assert.equal(n.answerFact.moved, true);
    assert.notEqual(n.answerFact.options[0].ruling.of, n.answerFact.recommendationHash);
  });

  test('a ratified node whose ruled option is not the recommended one diverges, and is not on the frontier', async () => {
    const n = await bySlug('diverges');
    assert.equal(n.class, 'ratified');
    assert.equal(n.divergesFromRecommendation, true);
    assert.equal(n.moved, false, 'the ruling pins the recommendation it answered');
    assert.equal(n.proposal, false);
    assert.equal(n.onFrontier, false);
    assert.equal(n.answerFact.ruled, 'standing');
    assert.equal(n.answerFact.recommends, 'bolder');
    assert.ok(n.fence, 'the recommended option is quoted whole beside what stands');
  });

  test('a reading bears on named options of named nodes, and each option carries the inverse', async () => {
    const reading = await bySlug('reading-diverged');
    assert.deepEqual(reading.bears, [
      { node: 'example.test/main/delegated', fact: 'answer', option: 'narrower', relation: 'diverged' },
      { node: 'example.test/main/ratified', fact: 'answer', option: 'standing', relation: 'adopted' },
    ]);
    const delegated = await bySlug('delegated');
    const narrower = delegated.answerFact.options.find((o) => o.name === 'narrower');
    assert.deepEqual(narrower.readings, [{ id: 'example.test/main/reading-diverged', relation: 'diverged' }]);
    assert.deepEqual(delegated.answerFact.options[0].readings, [], 'the standing option carries none');
    const ratified = await bySlug('ratified');
    assert.deepEqual(ratified.answerFact.options[0].readings, [
      { id: 'example.test/main/reading-diverged', relation: 'adopted' },
    ]);
  });

  test('settles counts the descendants that carry a stage', async () => {
    const deferred = await bySlug('deferred');
    assert.equal(deferred.settles, 1, 'inherits-deferred carries a stage');
    assert.deepEqual(deferred.settledBy, { under: 1, options: 1, depends: 0 });
    const delegated = await bySlug('delegated');
    assert.equal(delegated.settles, 0, 'neither node under it carries a stage');
  });
});

// ---------------------------------------------------------------------------
// readGraph: invalid fixtures
// ---------------------------------------------------------------------------

describe('readGraph: invalid fixtures', () => {
  const cases = [
    // the keys the encoding of 2026-09-04 removed, each named in its message
    ['invalid-authority-key', /'authority' is no longer a frontmatter key: the encoding changed on 2026-09-04, and a node's class is derived from the rulings on its facts/],
    ['invalid-alternatives-key', /'alternatives' is no longer a frontmatter key/],
    ['invalid-recommendation-key', /'recommendation' is no longer a frontmatter key/],
    ['invalid-relation-key', /'relation' is no longer a frontmatter key/],
    ['invalid-unknown-key', /unknown frontmatter key 'bogus'/],
    ['invalid-ledger-key', /unknown frontmatter key 'ledger'/],
    // readings: source, bears, and what bears must resolve to
    ['invalid-reading-without-source', /'source' is required.*form: reading/],
    ['invalid-bears-not-a-reading', /'bears' is only allowed when form: reading/],
    ['invalid-bears-shape', /'bears' must be a non-empty list of \{node: <optional node id>, fact: answer\|authority\|existence\|persistence, option: <option name>, relation: adopted\|diverged\}/],
    ['invalid-bears-node-required', /'bears' entry on fact 'answer' must name a 'node': the reading has 2 parents/],
    ['invalid-bears-unknown-node', /'bears' names example\.test\/main\/does-not-exist, which is not a node/],
    ['invalid-bears-unknown-fact', /'bears' names the 'existence' fact of example\.test\/main\/root, which has no such fact/],
    ['invalid-bears-unknown-option', /'bears' names option nope on the 'answer' fact of example\.test\/main\/root, which has no such option/],
    // references
    ['invalid-unresolved-under', /unresolved 'under' reference: example\.test\/main\/does-not-exist/],
    ['invalid-cycle', /cycle in 'under'/],
    ['invalid-duplicate-under', /duplicate under reference: example\.test\/main\/root/],
    ['invalid-unresolved-after', /unresolved after reference: example\.test\/main\/does-not-exist/],
    ['invalid-unresolved-depends', /unresolved 'depends' reference: example\.test\/main\/does-not-exist/],
    ['invalid-duplicate-depends', /duplicate 'depends' reference: example\.test\/main\/root/],
    ['invalid-depends-self', /'depends' names itself/],
    ['invalid-depends-no-stage', /'depends' names example\.test\/main\/root, which carries no stage; a dependency is on an open question/],
    ['invalid-depends-empty-option', /'depends' names an empty option on example\.test\/main\/root/],
    ['invalid-depends-unknown-option', /'depends' names option nonexistent-option on example\.test\/main\/root, whose answer fact has no such option/],
    // sections
    ['invalid-stray-heading', /unexpected '## Notes' heading \(only Disposition, Answer, Rationale, Facts, Recommendation, Account are allowed\)/],
    ['invalid-alternatives-heading', /unexpected '## Alternatives' heading \(only Disposition, Answer, Rationale, Facts, Recommendation, Account are allowed\)/],
    ['invalid-section-order', /'## Disposition' heading is out of order/],
    // facts: shape, names, order, options
    ['invalid-facts-shape', /'facts' must be a non-empty list of \{name: answer\|authority\|existence\|persistence, options: <one or more \{name: <lowercase slug on the answer fact, non-empty on a reserved one>, source: <non-empty string>, ref: <non-empty string>, status: <passed>, reason: <non-empty string, with status>, ruling: <optional \{response: confirm\|edit, date: YYYY-MM-DD, of: <hash>, reason: <optional non-empty string>\}>\}>/],
    ['invalid-fact-unknown-name', /'facts' must be a non-empty list of \{name: answer\|authority\|existence\|persistence/],
    ['invalid-ruling-response', /'facts' must be a non-empty list of .*ruling: <optional \{response: confirm\|edit/],
    ['invalid-duplicate-fact', /duplicate fact 'existence'/],
    ['invalid-answer-fact-not-first', /'facts' lists the answer fact at position 2; the answer fact comes first/],
    ['invalid-option-duplicate-name', /fact 'existence' names option 'keep' twice/],
    ['invalid-answer-option-without-source', /fact 'answer' option 'only-way' requires 'source' \(author, ai, review, or the node or instrument that raised it\)/],
    ['invalid-answer-option-without-ref', /fact 'answer' option 'only-way' requires 'ref'/],
    ['invalid-fact-authority-class', /fact 'authority' may only offer the classes a ruling confers: ratified, delegated, deferred/],
    ['invalid-fact-recommends-unlisted', /fact 'existence' recommends 'delete', which is not one of its own options/],
    ['invalid-boldness-without-recommends', /fact 'existence' states a boldness but recommends no option/],
    ['invalid-two-rulings', /fact 'answer' carries a ruling on 2 options \(standing, other-way\); the author rules on one/],
    // what stands, what is recommended, and the fence between them
    ['invalid-stands-unlisted', /fact 'answer' stands on 'elsewhere', which is not one of its own options/],
    ['invalid-stands-not-ruled', /fact 'answer' is ruled on 'the-ruled-one' but stands on 'standing'; what stands is what the author confirmed/],
    ['invalid-stands-without-answer', /'stands' names the option whose text '## Answer' holds, so it requires an '## Answer' section/],
    ['invalid-answer-without-fact', /an '## Answer' section requires an answer fact, whose options are the candidate answers to this question/],
    ['invalid-stands-on-authority-fact', /fact 'authority' carries 'stands', which is the answer fact's alone/],
    ['invalid-recommends-without-fence', /the answer fact recommends 'the-other-way' rather than the standing 'standing', which requires a '## Recommendation' section holding it whole/],
    ['invalid-first-answer-without-fence', /the answer fact recommends 'only-way' and nothing stands yet, which requires a '## Recommendation' section holding the recommended node whole/],
    ['invalid-fence-with-standing-recommendation', /'## Recommendation' holds the recommended node where it differs from what stands, and the answer fact recommends the standing option 'standing'/],
    // the fence itself
    ['invalid-fence-not-fenced', /'## Recommendation' must hold exactly one fenced markdown block/],
    ['invalid-fence-parse-error', /'## Recommendation' does not parse as a node: /],
    ['invalid-fence-wrong-question', /'## Recommendation' answers a different question/],
    ['invalid-fence-forbidden-key', /'## Recommendation' carries 'facts', which belongs to the node and not to the text it would stand on/],
    ['invalid-fence-facts-section', /'## Recommendation' carries a '## Facts' section, which belongs to the node and not to the text it would stand on/],
    // stage: when it is required, and what it requires
    ['invalid-stage-value', /'stage' must be one of: periagogic, maieutic, ruling, review/],
    ['invalid-stage-without-dialogue', /stage requires a '## Disposition', '## Account', or '## Answer' section/],
    ['invalid-disposition-without-stage', /'## Disposition' requires 'stage'/],
    ['invalid-dialogue-without-stage', /'review', 'depends', 'probes', and '## Account' are parts of the dialogue and require stage/],
    ['invalid-account-without-stage', /'review', 'depends', 'probes', and '## Account' are parts of the dialogue and require stage/],
    ['invalid-stage-needs-recommends', /stage review requires every fact to recommend one of its options; fact 'answer' recommends none/],
    ['invalid-stage-ruling-needs-forward-review', /stage ruling requires a 'review' with verdict forward/],
    ['invalid-unanswered-without-stage', /example\.test\/main\/bad is unanswered and must carry stage/],
    ['invalid-deferred-without-stage', /example\.test\/main\/bad is deferred and must carry stage/],
    ['invalid-inherited-deferred-without-stage', /example\.test\/main\/bad is deferred and must carry stage/],
    ['invalid-moved-without-stage', /example\.test\/main\/bad has a recommendation that has moved since its ruling and must carry stage/],
    // review
    ['invalid-review-shape', /'review' must be \{verdict: forward\|kickback, strength: strong\|moderate\|weak\|none, date: YYYY-MM-DD, of: <sha1>\}/],
    // `siblings` (the other drafts a per-node reviewer once read) is no
    // longer part of the review schema now that every review is a batch
    // over the whole frontier; this fixture's extra key fails the same
    // generic shape check invalid-review-shape does.
    ['invalid-review-siblings-unresolved', /'review' must be \{verdict: forward\|kickback/],
    // the survey's pin: its two keys, both required, both typed, and the
    // four draft-review keys given together or not at all. Every one of
    // these is the same combined message the review's shape has always had.
    ['invalid-review-survey-missing-of', /an optional survey: \{date: YYYY-MM-DD, of: <sha1>\}/],
    ['invalid-review-survey-unknown-key', /an optional survey: \{date: YYYY-MM-DD, of: <sha1>\}/],
    ['invalid-review-survey-type', /an optional survey: \{date: YYYY-MM-DD, of: <sha1>\}/],
    ['invalid-review-partial', /the four draft-review keys are given together or not at all, and the survey may stand alone/],
    // '## Facts' and its subsections
    ['invalid-facts-section-without-list', /'## Facts' requires a non-empty 'facts' list/],
    ['invalid-facts-heading-mismatch', /'## Facts' has '### mysterious', which is not a fact on this node \(facts: existence, authority\)/],
    ['invalid-answer-option-heading-mismatch', /'### answer' subsections must match the answer fact's options in order: expected '#### second' at position 2, found '#### third'/],
    ['invalid-answer-option-without-subsection', /the answer fact carries 'unwritten' beside the option that stands, which requires a '## Facts' section stating each in prose/],
    // shims, tier, order
    ['invalid-shim-missing-liquidation', /'shims\[0\]\.liquidation' is required/],
    ['invalid-shim-unknown-key', /unknown key 'shims\[0\]\.bogus'/],
    ['invalid-unaligned-tier', /'tier' requires an '## Answer' section/],
    // order rule (i): the boosts of b and c contradict the recorded step order.
    ['invalid-order-violated', /'order' step 2 names example\.test\/main\/b \(rank 0\.0090\), which does not outrank example\.test\/main\/c \(rank 0\.0901\) of step 3/],
    // order rule (ii): d is an unrelated (not ancestor) sibling that outranks
    // a's first (and only) step.
    ['invalid-order-head', /'order' puts example\.test\/main\/a in its first step, but example\.test\/main\/d \(rank 0\.9901\) outranks it and is not its ancestor/],
    ['invalid-order-unresolved', /'order' names example\.test\/main\/does-not-exist, which is not a node/],
    ['invalid-order-no-answer', /'order' requires an '## Answer' section/],
    // the viability judgment on an option: its one value, its reason, and
    // the three things a passed option may not be
    ['invalid-option-status-value', /'facts' must be a non-empty list of .*status: <passed>/],
    ['invalid-option-reason-without-status', /fact 'answer' option 'other-way' carries a 'reason' with no 'status'; a reason is why an option was passed over/],
    ['invalid-passed-option-without-reason', /fact 'existence' option 'prune' is passed over and must say why \('reason'\)/],
    ['invalid-passed-option-recommended', /fact 'existence' recommends 'prune', which it has passed over/],
    ['invalid-passed-option-stands', /fact 'answer' stands on 'standing', which it has passed over/],
    ['invalid-passed-option-with-ruling', /fact 'existence' option 'prune' is passed over and carries a ruling; the author's ruling supersedes the AI's viability judgment/],
    // every option's sentence, in its one home
    ['invalid-authority-option-subsection', /'### authority' has '#### ratified', which a vocabulary fact's options do not carry; 'ratified' means the same on every node, so its sentence is the gloss on the node that defines the term/],
    ['invalid-persistence-option-without-subsection', /'### persistence' subsections must match the persistence fact's options in order: expected '#### derived' at position 1, found '#### present'/],
    ['invalid-defines-gloss-shape', /'defines' must be a non-empty list of terms, each a non-empty string or \{term, gloss\} with both non-empty/],
    // the authority fact on every staged node that carries facts, and the
    // facts every node past the maieutic stage carries
    ['invalid-staged-facts-without-authority', /a staged node's facts must include authority/],
    ['invalid-factless-node-at-review', /stage review requires 'facts': there is nothing for a review or a ruling to read/],
    // the case against a recommendation needs a recommendation, and the
    // review's needs a verdict
    ['invalid-fact-against-without-recommends', /fact 'existence' states a case against a recommendation but recommends no option/],
    ['invalid-review-against-without-verdict', /'review' must be \{verdict: forward\|kickback/],
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
      assert.ok(lines.some((l) => l.includes("'bears' is required")));
      return true;
    });
  });

  test('invalid-fence-parse-error fails structurally (no frontmatter delimiter), not on any field rule', async () => {
    await assert.rejects(readGraph(path.join(FIXTURES, 'invalid-fence-parse-error')), (err) => {
      assert.match(err.message, /file must begin with a '---' frontmatter delimiter/);
      assert.doesNotMatch(err.message, /unknown frontmatter key|'form' must be one of|must carry stage/);
      return true;
    });
  });

  test('invalid-fence-wrong-question fails on the question mismatch alone -- the fence is otherwise valid', async () => {
    await assert.rejects(readGraph(path.join(FIXTURES, 'invalid-fence-wrong-question')), (err) => {
      const lines = err.message.split('\n');
      assert.equal(lines.length, 1, 'no other field on this well-formed fence is checked, so this is the only problem');
      assert.match(lines[0], /'## Recommendation' answers a different question$/);
      return true;
    });
  });

  test('cycle reports one problem line per node in the cycle', async () => {
    await assert.rejects(readGraph(path.join(FIXTURES, 'invalid-cycle')), (err) => {
      const lines = err.message.split('\n');
      assert.equal(lines.length, 2);
      assert.ok(lines.some((l) => l.startsWith('main/b.md:')));
      assert.ok(lines.some((l) => l.startsWith('main/bad.md:')));
      return true;
    });
  });

  test('a missing disposition.yaml is a clear, path-named error', async () => {
    const dir = await freshTmpDir('disposition-empty-');
    await assert.rejects(readGraph(dir), /disposition\.yaml.*cannot read manifest/s);
  });
});

// ---------------------------------------------------------------------------
// readGraph: the smaller valid fixtures
// ---------------------------------------------------------------------------

describe('readGraph: fenced-body fixture', () => {
  // covers parseBody's fence handling: pre-fix, a '##' line inside a fenced
  // code block was read as a real section boundary, so this fixture's nested
  // '## Answer' example threw "duplicate '## Answer' heading".
  test('a "## Answer" line inside a fenced example is content, not a section boundary', async () => {
    const graph = await readGraph(path.join(FIXTURES, 'valid-fenced-body'));
    assert.equal(graph.nodes.length, 1);
    const n = graph.nodes[0];
    assert.equal(n.rationale, null);
    assert.equal(n.account, null);
    assert.equal(n.authority, undefined, "'authority' is gone from the node object");
    assert.equal(n.alternatives, undefined, "'alternatives' is gone from the node object");
    assert.equal(n.recommendation, undefined, "'recommendation' is gone from the node object");
    assert.ok(n.answer.startsWith('Real answer text before the example.'));
    assert.ok(n.answer.endsWith('More real answer text after the fence.'));
    assert.ok(
      n.answer.includes('## Answer\n\nFenced example text that must not be treated as a boundary.'),
      'the fenced heading survives verbatim as body content',
    );
  });
});

describe('readGraph: deferred-boost fixture', () => {
  // a boost is the author's act whatever class their rulings confer, so a
  // node the author deferred may carry one too.
  test('a deferred node with a positive boost parses', async () => {
    const graph = await readGraph(path.join(FIXTURES, 'valid-deferred-boost'));
    assert.equal(graph.nodes.length, 1);
    const n = graph.nodes[0];
    assert.equal(n.class, 'deferred');
    assert.equal(n.boost, 2);
  });
});

describe('readGraph: shims fixture', () => {
  test('a node with two shims parses with both entries in order', async () => {
    const graph = await readGraph(path.join(FIXTURES, 'valid-shims'));
    assert.equal(graph.nodes.length, 1);
    assert.deepEqual(graph.nodes[0].shims, [
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

describe('readGraph: valid-unaligned fixture', () => {
  test('an unanswered node reads with stage/disposition populated; a node at ruling carries its review', async () => {
    const graph = await readGraph(path.join(FIXTURES, 'valid-unaligned'));
    const bySlug = (slug) => graph.nodes.find((n) => n.id === `example.test/main/${slug}`);

    const root = bySlug('root');
    assert.equal(root.class, 'ratified');
    assert.equal(root.status, 'answered');
    assert.equal(root.stage, null);

    const unaligned = bySlug('child-unaligned');
    assert.equal(unaligned.class, 'unanswered');
    assert.equal(unaligned.stage, 'periagogic');
    assert.equal(unaligned.disposition, 'The author has not yet ruled on this branch.');
    assert.equal(unaligned.answer, null);

    const ruling_ = bySlug('child-ruling');
    assert.equal(ruling_.class, 'unanswered', 'a node awaiting the ruling is unanswered');
    assert.equal(ruling_.stage, 'ruling');
    assert.equal(ruling_.answerFact.recommends, 'standing');
    assert.equal(ruling_.answerFact.stands, 'standing');
    assert.equal(ruling_.fence, null, 'a recommendation of what stands quotes nothing');
    assert.equal(ruling_.review.verdict, 'forward');
    assert.equal(ruling_.reviewStale, true, "the fixture's placeholder review.of does not match the computed hash");
    assert.ok(ruling_.disposition && ruling_.answer && ruling_.rationale && ruling_.account);
  });
});

describe('readGraph: valid-unanswered-with-child fixture', () => {
  test('an unanswered parent may have a child', async () => {
    const graph = await readGraph(path.join(FIXTURES, 'valid-unanswered-with-child'));
    assert.equal(graph.nodes.length, 2);
  });
});

describe('readGraph: valid-depends fixture', () => {
  test('a bare depends entry resolves to {id, option: null} and names a node on the frontier', async () => {
    const graph = await readGraph(path.join(FIXTURES, 'valid-depends'));
    assert.equal(graph.nodes.length, 3);
    const dependent = graph.nodes.find((n) => n.id === 'example.test/main/dependent');
    assert.deepEqual(dependent.depends, [{ id: 'example.test/main/prerequisite', option: null }]);
    const prerequisite = graph.nodes.find((n) => n.id === 'example.test/main/prerequisite');
    assert.equal(prerequisite.onFrontier, true);
    assert.equal(prerequisite.answer, null, 'nothing stands on it yet');
    assert.equal(prerequisite.answerFact.stands, null);
  });

  test("a qualified depends entry names an option on the ancestor's answer fact", async () => {
    const graph = await readGraph(path.join(FIXTURES, 'valid-depends'));
    const sibling = graph.nodes.find((n) => n.id === 'example.test/main/sibling');
    assert.deepEqual(sibling.depends, [{ id: 'example.test/main/prerequisite', option: 'split-it' }]);
  });
});

// ---------------------------------------------------------------------------
// readGraph: valid-dialogue fixture
// ---------------------------------------------------------------------------

describe('readGraph: valid-dialogue fixture', () => {
  const graphPromise = readGraph(path.join(FIXTURES, 'valid-dialogue'));
  async function bySlug(slug) {
    const graph = await graphPromise;
    const n = graph.nodes.find((x) => x.id === `example.test/main/${slug}`);
    assert.ok(n, `expected a node with slug ${slug}`);
    return n;
  }

  test('a node at ruling carries a forward review whose "of" is the node\'s recommendation hash, and a parsed fence', async () => {
    const n = await bySlug('ruling-node');
    assert.equal(n.class, 'unanswered');
    assert.equal(n.stage, 'ruling');
    assert.equal(n.answerFact.recommends, 'whole-node');
    assert.equal(n.answerFact.boldness, 'moderate');
    assert.equal(n.answerFact.stands, 'standing');
    assert.equal(n.review.verdict, 'forward');
    assert.deepEqual(Object.keys(n.review).sort(), ['against', 'commit', 'date', 'of', 'strength', 'survey', 'verdict'], "the two readings and nothing else -- no 'siblings' key");
    assert.equal(n.review.against, null, 'the review recorded no counter-argument');
    assert.equal(n.review.commit, 'c1a5c1a5c1a5c1a5c1a5c1a5c1a5c1a5c1a5c1a5', 'a review block with commit parses');
    assert.equal(n.review.survey, null, 'the survey has not read this node yet');
    assert.equal(n.review.of, n.recommendationHash, "the fixture's review.of is kept in step");
    assert.equal(n.reviewStale, false);
    assert.ok(n.fence, 'the node carries a parsed Recommendation fence');
    assert.equal(n.fence.question, n.question, "the fence answers the node's own question");
    assert.ok(n.fence.sections.Answer.startsWith('Yes: a fence holds a whole proposed node'));
    assert.equal(n.fence.frontmatter.authority, undefined, 'no stamp inside a fence');
  });

  test('a node at review carries a recommendation only -- no review yet', async () => {
    const n = await bySlug('review-node');
    assert.equal(n.class, 'unanswered');
    assert.equal(n.stage, 'review');
    assert.equal(n.answerFact.recommends, 'standing');
    assert.equal(n.answerFact.boldness, 'high');
    assert.equal(n.review, null);
    assert.equal(n.reviewStale, false, 'reviewStale is only ever true when a review exists');
    assert.equal(n.fence, null, 'recommending what stands means no fence');
  });

  test('a ratified node needs no stage at all', async () => {
    const n = await bySlug('answered-no-stage');
    assert.equal(n.class, 'ratified');
    assert.equal(n.status, 'answered');
    assert.equal(n.stage, null);
    assert.equal(n.review, null);
    assert.equal(n.moved, false);
  });

  test('a ratified node may still carry a stage, satisfied by "## Answer" alone', async () => {
    const n = await bySlug('answered-with-stage');
    assert.equal(n.class, 'ratified');
    assert.equal(n.stage, 'review');
    assert.equal(n.disposition, null);
    assert.equal(n.account, null);
    assert.ok(n.answer, 'only an Answer section supports the stage here');
  });

  test('facts keep the order the frontmatter writes them in, with the answer fact first', async () => {
    const n = await bySlug('facts-node');
    assert.deepEqual(n.facts.map((f) => f.name), ['answer', 'persistence', 'authority', 'existence']);
    assert.equal(n.answerFact, n.facts[0]);
  });

  test('a fact with no ruling reads as ruled: null; one with a ruling carries it on the option', async () => {
    const n = await bySlug('facts-node');
    assert.equal(n.facts[0].ruled, null);
    const persistence = n.facts.find((f) => f.name === 'persistence');
    assert.equal(persistence.ruled, 'present');
    assert.deepEqual(persistence.options[1].ruling, {
      response: 'confirm',
      date: '2026-09-03',
      of: persistence.recommendationHash,
      reason: null,
    });
    assert.equal(persistence.moved, false);
    assert.equal(n.class, 'unanswered', 'a ruling on persistence confers no class');
  });

  test("a fact's prose is the '## Facts' subsection, and a fact with no subsection keeps ''", async () => {
    const n = await bySlug('facts-node');
    assert.ok(n.facts.find((f) => f.name === 'persistence').prose.startsWith('Present, because'));
    assert.equal(n.facts.find((f) => f.name === 'authority').prose, '');
    assert.equal(n.facts.find((f) => f.name === 'existence').prose, '');
  });

  test('changing the facts does not change the standing hash -- facts is stripped like stage, review and depends', async () => {
    const original = await bySlug('facts-node');
    const changed = await bySlug('facts-node-changed');
    assert.equal(original.facts.length, 4);
    assert.equal(changed.facts.length, 3);
    assert.notEqual(
      original.facts.find((f) => f.name === 'existence').recommends,
      changed.facts.find((f) => f.name === 'existence').recommends,
      'the fixture pair genuinely differs in its facts',
    );
    assert.equal(original.standingHash, changed.standingHash, "their frontmatter differs only in 'facts', and their text is identical");
    assert.notEqual(original.recommendationHash, changed.recommendationHash, 'what they recommend does differ');
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
    const bySlug = (slug) => graph.nodes.find((n) => n.id === `example.test/main/${slug}`);

    assert.deepEqual(bySlug('order-node').order, [
      ['example.test/main/order-node', 'example.test/main/leaf-a'],
      ['example.test/main/leaf-b'],
    ]);

    assert.ok(bySlug('order-node').rank > bySlug('leaf-a').rank, 'order-node outranks leaf-a (its step-1 partner)');
    assert.ok(bySlug('leaf-a').rank > bySlug('leaf-b').rank, 'leaf-a (step 1) outranks leaf-b (step 2)');
    assert.ok(bySlug('hub').rank > bySlug('leaf-a').rank, "hub outranks leaf-a but is leaf-a's ancestor");
    assert.equal(bySlug('solo-child').rank, bySlug('leaf-a').rank, "leaf-a's lone child ties its rank exactly");
  });
});

// ---------------------------------------------------------------------------
// readGraph: valid-draft-old-doctrine fixture
// ---------------------------------------------------------------------------

describe('readGraph: valid-draft-old-doctrine fixture', () => {
  // dialogue.md: "A draft may be invalid under the doctrine of the day, as
  // when it presumes a ruling not yet given; the validator parses it and
  // checks only that it answers the same question." This fence carries a
  // form outside FORMS, a tier outside its vocabulary, and an `under` that
  // resolves to nothing -- none of it is a validation problem.
  test('a fence with an out-of-vocabulary form and tier and an unresolvable under still validates', async () => {
    const result = await validate(path.join(FIXTURES, 'valid-draft-old-doctrine'));
    assert.equal(result.ok, true);
    assert.equal(result.message, 'ok: 1 nodes');
  });

  test("the fence's frontmatter comes back exactly as written, not normalized or rejected", async () => {
    const graph = await readGraph(path.join(FIXTURES, 'valid-draft-old-doctrine'));
    const n = graph.nodes.find((x) => x.id === 'example.test/main/ruling-node');
    assert.equal(n.fence.question, n.question, "the fence still answers the node's own question");
    assert.equal(n.fence.frontmatter.form, 'disposition', "'form' outside FORMS is passed through, not rejected");
    assert.equal(n.fence.frontmatter.tier, 'cosmic', "'tier' outside its vocabulary is passed through");
    assert.deepEqual(n.fence.frontmatter.under, ['example.test/main/nowhere'], "the fence's references are not resolved");
    assert.equal(n.reviewStale, false, "the fixture's review.of is kept in step with the recommendation hash");
  });
});

// ---------------------------------------------------------------------------
// readGraph: valid-options fixture
// ---------------------------------------------------------------------------

describe('readGraph: valid-options fixture', () => {
  const graphPromise = readGraph(path.join(FIXTURES, 'valid-options'));
  async function bySlug(slug) {
    const graph = await graphPromise;
    const n = graph.nodes.find((x) => x.id === `example.test/main/${slug}`);
    assert.ok(n, `expected a node with slug ${slug}`);
    return n;
  }

  test("the answer fact's options carry name, source, ref, and a ruling only where the author gave one", async () => {
    const n = await bySlug('fresh-node');
    assert.equal(n.class, 'unanswered');
    assert.deepEqual(n.answerFact.options.map((o) => [o.name, o.source, o.ref, o.ruling]), [
      ['standing', 'author', '2026-09-01', null],
      ['split-the-node', 'review', '2026-09-02', null],
      ['follow-the-instrument', 'node --test packages/disposition/read.test.mjs', '2026-09-03', null],
    ]);
    assert.equal(n.answerFact.ruled, null);
  });

  test("each option's prose is its '#### ' subsection, and the standing one's text is '## Answer'", async () => {
    const n = await bySlug('fresh-node');
    assert.ok(n.answerFact.prose.startsWith("The review's option is recommended"));
    assert.equal(n.answerFact.options[0].prose, '');
    assert.ok(n.answerFact.options[1].prose.startsWith("The clean-context review's option"));
    assert.ok(n.answerFact.options[2].prose.startsWith('An option that arose outside alignment'));
    assert.ok(!n.answerFact.options[2].prose.includes('####'), 'the heading itself is not part of the prose');
  });

  test('a recommendation that is not what stands carries the fence, and the review pins the whole recommendation', async () => {
    const n = await bySlug('fresh-node');
    assert.equal(n.answerFact.recommends, 'split-the-node');
    assert.equal(n.answerFact.boldness, 'high');
    assert.equal(n.facts[1].name, 'authority');
    assert.equal(n.facts[1].recommends, 'ratified', 'the class a ruling would confer is the authority fact');
    assert.ok(n.fence);
    assert.ok(n.fence.sections.Answer.startsWith('Split the node'));
    assert.equal(n.review.of, n.recommendationHash);
    assert.equal(n.reviewStale, false);
    assert.notEqual(n.standingHash, n.recommendationHash);
  });

  // pruning the node is the 'existence' fact, never an answer option: an
  // option is a candidate answer to this node's question, and deleting the
  // node answers nothing.
  test("pruning is the 'existence' fact, so the answer fact still recommends what stands and carries no fence", async () => {
    const n = await bySlug('prune-node');
    assert.equal(n.class, 'unanswered');
    assert.deepEqual(n.answerFact.options.map((o) => o.name), ['standing']);
    assert.equal(n.answerFact.recommends, 'standing');
    assert.equal(n.fence, null);
    assert.equal(n.review.of, n.recommendationHash);
    assert.equal(n.reviewStale, false);
    assert.ok(n.answer, 'the node as it stands is what remains if the author denies the prune');
    const existence = n.facts.find((f) => f.name === 'existence');
    assert.deepEqual(existence.options.map((o) => o.name), ['keep', 'prune']);
    assert.equal(existence.recommends, 'prune');
    assert.ok(existence.prose.startsWith('Prune the node'));
  });

  test('reviewStale is true when review.of no longer matches the recommendation hash', async () => {
    const n = await bySlug('stale-review');
    assert.equal(n.review.of, 'a'.repeat(40));
    assert.notEqual(n.recommendationHash, 'a'.repeat(40));
    assert.equal(n.reviewStale, true);
    assert.equal(n.moved, false, 'no ruling, so nothing has moved from one');
  });
});

// ---------------------------------------------------------------------------
// readGraph: valid-sentences fixture -- every option's sentence in its one
// home, the author's reason for a ruling, the viability judgment on an
// option, and the case against a recommendation
// (commons.systems/disposition-graph/dialogue,
// `every-option-carries-its-sentence`, `ruling-carries-the-reason`)
// ---------------------------------------------------------------------------

describe('readGraph: valid-sentences fixture', () => {
  const graphPromise = readGraph(path.join(FIXTURES, 'valid-sentences'));
  async function bySlug(slug) {
    const graph = await graphPromise;
    const n = graph.nodes.find((x) => x.id === `example.test/main/${slug}`);
    assert.ok(n, `expected a node with slug ${slug}`);
    return n;
  }

  test("a 'defines' entry normalizes to {term, gloss}, a bare term keeping a null gloss", async () => {
    const n = await bySlug('glossary');
    assert.deepEqual(n.defines.slice(0, 2), [
      { term: 'ratified', gloss: 'The author ruled on the answer itself and wants to be asked before it changes.' },
      { term: 'delegated', gloss: 'The recommendation acts, and the author does not want to be asked again.' },
    ]);
    assert.deepEqual(n.defines.at(-1), { term: 'vocabulary', gloss: null }, 'a bare string still defines a term');
    assert.deepEqual(defineTerms(n), ['ratified', 'delegated', 'deferred', 'keep', 'prune', 'vocabulary']);
    assert.deepEqual(defineTerms({}), [], 'a node that defines nothing');
    assert.deepEqual(defineTerms({ defines: ['bare'] }), ['bare'], 'and a hand-built node reads too');
  });

  test("a ruling carries the author's own reason beside the response, the date and the pin", async () => {
    const n = await bySlug('glossary');
    assert.equal(n.class, 'ratified');
    assert.deepEqual(n.answerFact.options[0].ruling, {
      response: 'confirm',
      date: '2026-09-04',
      of: n.answerFact.recommendationHash,
      reason: 'Say it once, here, and let every page read it from here.',
    });
    assert.equal(n.moved, false, "the reason is no part of what the ruling pinned");
  });

  test('a passed option carries its status and its reason, stays on the list, and owes its subsection', async () => {
    const n = await bySlug('passed-and-reasoned');
    const passed = n.answerFact.options.find((o) => o.name === 'list-the-viable-only');
    assert.equal(passed.status, 'passed');
    assert.equal(passed.reason, 'A candidate that silently leaves the list cannot be ruled for.');
    assert.ok(passed.prose.startsWith('Drop an option once it is dominated'), 'a passed option still says what it would answer');
    const viable = n.answerFact.options.find((o) => o.name === 'keep-every-candidate');
    assert.deepEqual([viable.status, viable.reason], [null, null], 'absent means viable');
  });

  test('a fact and a review each carry their own case against, and neither is in any hash', async () => {
    const n = await bySlug('passed-and-reasoned');
    assert.ok(n.answerFact.against.startsWith('Two more rows on every fact'));
    assert.ok(n.review.against.startsWith('The passed status is the AI accounting'));
    assert.equal(n.facts[1].against, null, 'absent where the fact records none');
    assert.equal(n.reviewStale, false, "the review's own pin still matches");

    const raw = await readFile(path.join(FIXTURES, 'valid-sentences/main/passed-and-reasoned.md'), 'utf8');
    const rewritten = raw
      .replace(/^    against: .*$/m, '    against: A different case entirely, made in different words.')
      .replace(/^  against: .*$/m, '  against: And a different counter-argument on the review.');
    assert.notEqual(rewritten, raw, 'the fixture really carries both fields');
    const edited = parseNode(rewritten, {
      id: n.id, graph: 'main', slug: 'passed-and-reasoned', path: 'main/passed-and-reasoned.md',
    });
    assert.equal(edited.standingHash, n.standingHash);
    assert.equal(edited.recommendationHash, n.recommendationHash);
    assert.equal(edited.answerFact.recommendationHash, n.answerFact.recommendationHash);
    assert.equal(edited.reviewStale, false);
  });

  test("every persistence option states itself, and the vocabulary facts state nothing of their own", async () => {
    const n = await bySlug('passed-and-reasoned');
    const persistence = n.facts.find((f) => f.name === 'persistence');
    assert.deepEqual(persistence.options.map((o) => o.prose.split('\n')[0]), [
      'Read the answer off whatever stands elsewhere, and keep nothing here.',
      'Keep the answer present on the node, in its own words.',
    ]);
    for (const name of ['authority', 'existence']) {
      const vocabulary = n.facts.find((f) => f.name === name);
      assert.deepEqual(vocabulary.options.map((o) => o.prose), ['', ''], `${name} carries no option prose`);
    }
  });

  test('optionText finds a sentence for every option of every fact, from the graph the reader returns', async () => {
    const graph = await graphPromise;
    const n = await bySlug('passed-and-reasoned');
    const definer = 'example.test/main/glossary';
    const found = n.facts.flatMap((f) => f.options.map((o) => [f.name, o.name, optionText(graph, n, f, o)]));
    for (const [factName, optionName, text] of found) {
      assert.ok(text !== null, `${factName}/${optionName} has no sentence`);
      assert.ok(text.text.trim().length > 0);
    }
    const byKey = new Map(found.map(([f, o, t]) => [`${f}/${o}`, t]));
    assert.ok(byKey.get('answer/standing').text.startsWith('Only the ones the AI still holds viable'), "the standing option's is the '## Answer'");
    assert.equal(byKey.get('answer/standing').from, n.id);
    assert.deepEqual(byKey.get('authority/ratified'), {
      text: 'The author ruled on the answer itself and wants to be asked before it changes.',
      from: definer,
    });
    assert.deepEqual(byKey.get('existence/prune'), {
      text: 'The node leaves the record, its question answered elsewhere or not at all.',
      from: definer,
    });
    assert.equal(byKey.get('persistence/derived').from, n.id);
  });

  test('a gloss is part of what stands, so adding one on the node that defines the term moves that node\'s pins and no other', async () => {
    const n = await bySlug('glossary');
    const other = await bySlug('passed-and-reasoned');
    const raw = await readFile(path.join(FIXTURES, 'valid-sentences/main/glossary.md'), 'utf8');
    const rewritten = raw.replace('  - vocabulary\n', '  - term: vocabulary\n    gloss: The names a reserved fact offers, which are not slugs.\n');
    assert.throws(
      () => parseNode(rewritten, { id: n.id, graph: 'main', slug: 'glossary', path: 'main/glossary.md' }),
      /has a recommendation that has moved since its ruling and must carry stage/,
      "the ruling's pin no longer matches, which is the reader saying the node must be asked again",
    );
    // The same text with the stage that move now requires, so the hashes can
    // be read rather than only inferred from the refusal above.
    const staged = parseNode(
      rewritten
        .replace('form: rule\n', 'form: rule\nstage: review\n')
        .replace('    stands: standing\n', '    stands: standing\n  - name: authority\n    options:\n      - name: ratified\n      - name: delegated\n    recommends: ratified\n    boldness: low\n'),
      { id: n.id, graph: 'main', slug: 'glossary', path: 'main/glossary.md' },
    );
    assert.notEqual(staged.standingHash, n.standingHash, "'defines' is frontmatter the standing text covers");
    assert.notEqual(staged.answerFact.recommendationHash, n.answerFact.recommendationHash);
    const otherAgain = await bySlug('passed-and-reasoned');
    assert.equal(otherAgain.recommendationHash, other.recommendationHash, 'and no node but the definer is asked again');
    assert.equal(otherAgain.reviewStale, false);
  });
});

// ---------------------------------------------------------------------------
// readGraph: valid-survey fixture -- the survey's pin beside the draft
// review's (commons.systems/disposition-graph/dialogue, `survey-pin-in-review`)
// ---------------------------------------------------------------------------

describe('readGraph: valid-survey fixture', () => {
  const graphPromise = readGraph(path.join(FIXTURES, 'valid-survey'));
  async function bySlug(slug) {
    const graph = await graphPromise;
    const n = graph.nodes.find((x) => x.id === `example.test/main/${slug}`);
    assert.ok(n, `expected a node with slug ${slug}`);
    return n;
  }

  test('a survey pin beside a forward verdict, both on the recommendation as it stands, is ready to rule', async () => {
    const n = await bySlug('ready-node');
    assert.equal(n.stage, 'ruling');
    assert.equal(n.review.verdict, 'forward');
    assert.deepEqual(n.review.survey, { date: '2026-09-04', of: n.recommendationHash });
    assert.equal(n.review.of, n.recommendationHash, 'the draft review pins the same recommendation');
    assert.equal(n.review.commit, null, "a review block with no 'commit' still parses, as null: the fixture's review predates the field");
    assert.equal(n.reviewStale, false);
    assert.equal(n.surveyStale, false);
    assert.equal(n.surveyOwed, false);
    assert.equal(n.readyToRule, true);
  });

  test('a survey pin stands alone on a node the survey judged before its draft review ran', async () => {
    const n = await bySlug('survey-only');
    assert.equal(n.stage, 'review');
    assert.equal(n.review.verdict, null, 'no verdict: the draft review has not run');
    assert.deepEqual(
      [n.review.strength, n.review.date, n.review.of],
      [null, null, null],
      'and none of the other three draft-review keys either',
    );
    assert.deepEqual(n.review.survey, { date: '2026-09-04', of: n.recommendationHash });
    assert.equal(n.reviewStale, false, 'there is no draft-review pin for a move to overtake');
    assert.equal(n.surveyStale, false);
    assert.equal(n.surveyOwed, false, 'the survey has read this recommendation');
    assert.equal(n.readyToRule, false, 'and the draft review is still owed');
  });

  test('each pin goes stale by itself: a stale survey leaves a current draft review alone', async () => {
    const n = await bySlug('stale-survey');
    assert.equal(n.stage, 'ruling');
    assert.equal(n.review.survey.of, 'a'.repeat(40));
    assert.notEqual(n.recommendationHash, 'a'.repeat(40));
    assert.equal(n.review.of, n.recommendationHash);
    assert.equal(n.reviewStale, false, 'the draft review still pins the recommendation');
    assert.equal(n.surveyStale, true);
    assert.equal(n.surveyOwed, true);
    assert.equal(n.readyToRule, false, 'a forward verdict alone does not make a node ruleable');
  });

  test('a node at the review stage with no review at all owes the survey and is not stale', async () => {
    const n = await bySlug('unsurveyed');
    assert.equal(n.review, null);
    assert.equal(n.reviewStale, false);
    assert.equal(n.surveyStale, false, 'nothing has been pinned for a move to overtake');
    assert.equal(n.surveyOwed, true);
    assert.equal(n.readyToRule, false);
  });

  test('the survey is owed only at the review and ruling stages: a stale pin below them owes nothing', async () => {
    const n = await bySlug('kicked-back');
    assert.equal(n.stage, 'maieutic');
    assert.equal(n.surveyStale, true, 'the pin it carries is stale all the same');
    assert.equal(n.surveyOwed, false);
    assert.equal(n.readyToRule, false);
  });

  test('surveyJudges lists exactly the nodes the next survey reads, in input order, from a graph or a node list', async () => {
    const graph = await graphPromise;
    const judged = surveyJudges(graph).map((n) => n.slug);
    assert.deepEqual(judged, ['stale-survey', 'unsurveyed']);
    assert.deepEqual(surveyJudges(graph.nodes).map((n) => n.slug), judged, 'the node list alone works too');
    assert.deepEqual(surveyJudges({}), [], 'and a graph with no nodes judges nothing');
  });
});

// ---------------------------------------------------------------------------
// the survey derivations on their own
// ---------------------------------------------------------------------------

describe('surveyStale, surveyOwed, readyToRule', () => {
  // A node with no facts hashes to a fixed recommendation hash, which is all
  // these three read besides the stage and the review.
  const HASH = deriveRecommendationHash({ facts: [] });
  const pin = (of) => ({ date: '2026-09-04', of });
  const forward = { verdict: 'forward', strength: 'strong', date: '2026-09-04', of: HASH, survey: null };

  test('surveyStale is true only where a pin exists and the recommendation has moved past it', () => {
    assert.equal(surveyStale({ facts: [], review: null }), false);
    assert.equal(surveyStale({ facts: [], review: { ...forward, survey: null } }), false);
    assert.equal(surveyStale({ facts: [], review: { ...forward, survey: pin(HASH) } }), false);
    assert.equal(surveyStale({ facts: [], review: { ...forward, survey: pin('a'.repeat(40)) } }), true);
  });

  test('surveyOwed gates on the stage: the survey judges review and ruling and nothing else', () => {
    for (const stage of ['review', 'ruling']) {
      assert.equal(surveyOwed({ facts: [], stage, review: null }), true, `${stage}: no pin`);
      assert.equal(surveyOwed({ facts: [], stage, review: { ...forward, survey: pin('a'.repeat(40)) } }), true, `${stage}: stale pin`);
      assert.equal(surveyOwed({ facts: [], stage, review: { ...forward, survey: pin(HASH) } }), false, `${stage}: current pin`);
    }
    for (const stage of ['periagogic', 'maieutic', null]) {
      assert.equal(surveyOwed({ facts: [], stage, review: null }), false, `${stage}: not a stage the survey judges`);
    }
  });

  test('readyToRule takes the ruling stage, a forward verdict, and both pins on the recommendation as it stands', () => {
    const ready = { facts: [], stage: 'ruling', review: { ...forward, survey: pin(HASH) } };
    assert.equal(readyToRule(ready), true);
    assert.equal(readyToRule({ ...ready, stage: 'review' }), false, 'the review stage is not the ruling stage');
    assert.equal(readyToRule({ ...ready, review: { ...ready.review, verdict: 'kickback' } }), false, 'a kickback forwards nothing');
    assert.equal(readyToRule({ ...ready, review: { ...forward, survey: null } }), false, 'no survey pin');
    assert.equal(readyToRule({ ...ready, review: { ...forward, of: 'a'.repeat(40), survey: pin(HASH) } }), false, 'a stale draft review');
    assert.equal(readyToRule({ ...ready, review: { ...forward, survey: pin('a'.repeat(40)) } }), false, 'a stale survey');
    assert.equal(readyToRule({ facts: [], stage: 'ruling', review: null }), false, 'no review at all');
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
