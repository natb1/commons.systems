// packages/disposition/migrate.test.mjs
//
// Tests for migrate.mjs, the one-time migration from the legacy encoding to
// the content encoding of 2026-09-07
// (commons.systems/disposition-graph/dialogue, option
// `an-option-carries-its-content-its-words-and-its-case`, and
// commons.systems/disposition-graph/quotes, option
// `words-in-a-ledger-on-the-ref`).
//
// Run with: node --test packages/disposition/*.test.mjs
import assert from 'node:assert/strict';
import { cp, mkdtemp, readFile, readdir, rm, stat } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { after, before, describe, test } from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  editFrontmatter,
  firstSentence,
  ledgerContext,
  migrate,
  removeRationale,
  splitProse,
  withAnswerBody,
} from './migrate.mjs';
import { answerText, readGraph, resolveOptionContent } from './read.mjs';
import { validate } from './validate.mjs';
import { parseWordsFile } from './words.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const LEGACY = path.join(HERE, 'fixtures', 'migrate', 'legacy');
const COMMIT = 'deadbeefdeadbeefdeadbeefdeadbeefdeadbeef';
const DATE = '2026-09-08';

/** A throwaway copy of the legacy fixture, since the migration writes in place. */
async function copyFixture() {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'migrate-'));
  const graph = path.join(dir, 'graph');
  await cp(LEGACY, graph, { recursive: true });
  return { dir, graph };
}

/** Every file of a directory tree, by relative path, as text. */
async function snapshot(dir) {
  const out = new Map();
  const walk = async (current, prefix) => {
    for (const entry of (await readdir(current, { withFileTypes: true })).sort((a, b) => (a.name < b.name ? -1 : 1))) {
      const next = path.join(current, entry.name);
      const rel = prefix === '' ? entry.name : `${prefix}/${entry.name}`;
      if (entry.isDirectory()) await walk(next, rel);
      else out.set(rel, await readFile(next, 'utf8'));
    }
  };
  await walk(dir, '');
  return out;
}

const run = (graph, options = {}) => migrate(graph, {
  commit: COMMIT, date: DATE, historyDir: null, ...options,
});

// ---------------------------------------------------------------------------
// the text helpers
// ---------------------------------------------------------------------------

describe('the text helpers', () => {
  test('removeRationale cuts the section and returns its body', () => {
    const text = '---\nq: 1\n---\n\n## Answer\n\nOne.\n\n## Rationale\n\nBecause.\n';
    const cut = removeRationale(text);
    assert.equal(cut.text, '---\nq: 1\n---\n\n## Answer\n\nOne.\n');
    assert.equal(cut.rationale, 'Because.');
  });

  test('removeRationale leaves a text with no rationale alone but for its newline', () => {
    const cut = removeRationale('## Answer\n\nOne.\n\n\n');
    assert.equal(cut.text, '## Answer\n\nOne.\n');
    assert.equal(cut.rationale, null);
  });

  test('withAnswerBody replaces the answer and keeps the frontmatter', () => {
    const base = '---\nq: 1\n---\n\n## Answer\n\nOne long answer.\n';
    assert.equal(withAnswerBody(base, 'Another.'), '---\nq: 1\n---\n\n## Answer\n\nAnother.\n');
    assert.equal(withAnswerBody('---\nq: 1\n---\n', 'Another.'), null);
  });

  test('firstSentence takes the first sentence of the first paragraph, line breaks and all', () => {
    assert.equal(firstSentence('One sentence.\nStill one.\n\nA second paragraph.'), 'One sentence.');
    assert.equal(firstSentence('A wrapped\nsentence ends here. And another.'), 'A wrapped\nsentence ends here.');
    assert.equal(firstSentence('No terminator at all'), 'No terminator at all');
  });

  test('splitProse splits at the record\'s own markers and moves no other text', () => {
    const split = splitProse('The option says this. For it: it is cheap. Against it: it is wrong.');
    assert.equal(split.sentence, 'The option says this.');
    assert.equal(split.support, 'For it: it is cheap.');
    assert.equal(split.divergence, 'Against it: it is wrong.');
  });

  test('splitProse leaves an unmarked prose whole', () => {
    const split = splitProse('Just a sentence about the option.');
    assert.equal(split.sentence, 'Just a sentence about the option.');
    assert.equal(split.support, '');
    assert.equal(split.divergence, '');
  });

  test('splitProse does not split a prose that would be left with no sentence', () => {
    const split = splitProse('For it: everything.');
    assert.equal(split.sentence, 'For it: everything.');
    assert.equal(split.support, '');
  });

  test('ledgerContext names the date and the node and does not say "the author" twice', () => {
    assert.equal(
      ledgerContext('example.test/main/root', '2026-09-06', 'The author, 2026-09-06, on brevity:'),
      'The author, 2026-09-06, on brevity; said on example.test/main/root.',
    );
    assert.equal(
      ledgerContext('example.test/main/root', '2026-09-06', ''),
      'The author, 2026-09-06, said on example.test/main/root.',
    );
  });
});

// ---------------------------------------------------------------------------
// the frontmatter edit
// ---------------------------------------------------------------------------

describe('editFrontmatter', () => {
  const fmText = [
    'question: What?',
    'facts:',
    '  - name: answer',
    '    options:',
    '      - name: one',
    '        source: ai',
    '        ref: "2026-09-05"',
    '      - name: two',
    '        source: author',
    '        ref: "2026-09-06"',
    '        ruling:',
    '          response: confirm',
    '          date: "2026-09-06"',
    '          of: "0000000000000000000000000000000000000000"',
    '    recommends: one',
    '    stands: one',
    '  - name: authority',
    '    options:',
    '      - name: ratified',
    '    recommends: ratified',
    'form: rule',
  ].join('\n');

  test('strikes stands and writes supports at the end of the option it belongs to', () => {
    const edited = editFrontmatter(fmText, new Map([
      ['answer\ntwo', ['words/2026-09-06/1', 'words/2026-09-06/2']],
    ]));
    assert.equal(edited.standsRemoved, 1);
    assert.equal(edited.supportsWritten, 1);
    assert.ok(!edited.text.includes('stands:'), 'stands is struck');
    assert.ok(edited.text.includes('form: rule'), 'keys outside the facts block are untouched');
    assert.match(
      edited.text,
      /of: "0{40}"\n {8}supports:\n {10}- words\/2026-09-06\/1\n {10}- words\/2026-09-06\/2\n {4}recommends: one/,
      'supports lands past the nested ruling and before the next fact key',
    );
  });

  test('leaves a frontmatter with no facts alone', () => {
    const edited = editFrontmatter('question: What?\nform: rule', new Map());
    assert.equal(edited.text, 'question: What?\nform: rule');
    assert.equal(edited.standsRemoved, 0);
  });
});

// ---------------------------------------------------------------------------
// the migration over the fixture graph
// ---------------------------------------------------------------------------

describe('migrate over the legacy fixture', () => {
  let dir;
  let graph;
  let before_;
  let result;

  before(async () => {
    ({ dir, graph } = await copyFixture());
    before_ = await readGraph(graph);
    result = await run(graph);
  });

  after(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  test('migrates every node and refuses none', () => {
    assert.equal(result.stats.legacy, 4);
    assert.equal(result.stats.refused.length, 0, result.stats.refused.join('\n'));
  });

  test('the migrated graph validates, and no node is left in the legacy encoding', async () => {
    const checked = await validate(graph);
    assert.equal(checked.ok, true, checked.message);
    assert.equal(checked.encodings, 'encodings: legacy 0, content 4');
  });

  test('the four struck sections and stands are gone from every file', async () => {
    const now = await readGraph(graph);
    for (const node of now.nodes) {
      assert.equal(node.encoding, 'content', node.id);
      assert.equal(node.answer, null, node.id);
      assert.equal(node.rationale, null, node.id);
      assert.equal(node.disposition, null, node.id);
      assert.equal(node.fence, null, node.id);
      assert.deepEqual(node.facts.map((f) => f.stands), node.facts.map(() => null), node.id);
      const text = await readFile(path.join(graph, `${node.slug === 'root' ? 'main/root' : `main/${node.slug}`}.md`), 'utf8');
      assert.ok(!/^ {4}stands:/m.test(text), `${node.id} carries no stands`);
    }
  });

  test("each node's account carries one migration manifest line naming the commit", async () => {
    const text = await readFile(path.join(graph, 'main', 'root.md'), 'utf8');
    assert.match(text, /### Migrated to the content encoding, 2026-09-08/);
    assert.match(text, new RegExp(`stands at graph commit \`${COMMIT}\``));
    assert.match(text, /The `## Answer` became the content of `the-root-answers-plainly`/);
  });

  test('the answer of every node survives byte for byte, but for the rationale the encoding strikes', async () => {
    const now = await readGraph(graph);
    const byId = new Map(now.nodes.map((n) => [n.id, n]));
    let compared = 0;
    for (const node of before_.nodes) {
      const legacy = answerText(node);
      if (legacy === null) continue;
      compared += 1;
      assert.equal(answerText(byId.get(node.id)), removeRationale(legacy).text, node.id);
    }
    assert.equal(compared, 4);
  });

  test("the standing text becomes the standing option's content, byte for byte", async () => {
    const now = await readGraph(graph);
    const byId = new Map(now.nodes.map((n) => [n.id, n]));
    for (const node of before_.nodes) {
      const fact = node.facts.find((f) => f.name === 'answer');
      if (!fact || fact.stands === null) continue;
      const want = removeRationale(answerText({ ...node, fence: null })).text;
      assert.equal(resolveOptionContent(byId.get(node.id), 'answer', fact.stands), want, node.id);
    }
  });

  test("the recommendation fence becomes the recommended option's content, byte for byte", async () => {
    const now = await readGraph(graph);
    const child = now.nodes.find((n) => n.slug === 'child');
    const legacy = before_.nodes.find((n) => n.slug === 'child');
    const want = removeRationale(`${legacy.fence.raw}\n`).text;
    assert.equal(resolveOptionContent(child, 'answer', 'the-child-refines-the-root'), want);
  });

  test("the rationale becomes the AI support of the option it argued for", async () => {
    const now = await readGraph(graph);
    const root = now.nodes.find((n) => n.slug === 'root');
    const option = root.facts[0].options.find((o) => o.name === 'the-root-answers-plainly');
    assert.match(option.aiSupport, /A root read by every session is read most often/);

    const child = now.nodes.find((n) => n.slug === 'child');
    const refines = child.facts[0].options.find((o) => o.name === 'the-child-refines-the-root');
    assert.match(refines.aiSupport, /One question is answered once/);
    // The fact's own case against the recommendation is the recommended
    // option's divergence.
    assert.match(refines.aiDivergence, /A refinement the root does not carry/);
  });

  test("an option's own 'For it:' and 'Against it:' become its two accumulations", async () => {
    const now = await readGraph(graph);
    const root = now.nodes.find((n) => n.slug === 'root');
    const option = root.facts[0].options.find((o) => o.name === 'the-root-answers-at-length');
    assert.equal(option.sentence, 'The root carries the whole argument itself.');
    assert.match(option.aiSupport, /^For it: a reader who opens one\nfile has read everything\.$/);
    assert.match(option.aiDivergence, /^Against it: every session pays for the detail/);
  });

  test('an option the record wrote no support for says so and invents none', async () => {
    const now = await readGraph(graph);
    const root = now.nodes.find((n) => n.slug === 'root');
    const option = root.facts[0].options.find((o) => o.name === 'the-root-says-nothing');
    assert.match(option.aiSupport, /wrote no case for this option; its support is owed/);
    assert.equal(option.status, 'passed');
    assert.equal(option.reason, 'a node that says nothing answers no question');
  });

  test('a named change the record already wrote is kept in its own form and still replays', async () => {
    const now = await readGraph(graph);
    const ladder = now.nodes.find((n) => n.slug === 'ladder');
    const second = ladder.facts[0].options.find((o) => o.name === 'the-second-rung');
    assert.equal(second.content.form, 'change');
    assert.equal(second.content.from, 'the-first-rung');
    assert.match(
      resolveOptionContent(ladder, 'answer', 'the-second-rung'),
      /An option carries its content whole, or as a named change to another/,
    );
    assert.equal(result.stats.kept, 1);
  });

  test('the reading node is migrated like any other and keeps its bears', async () => {
    const now = await readGraph(graph);
    const reading = now.nodes.find((n) => n.slug === 'reading');
    assert.equal(reading.encoding, 'content');
    assert.equal(reading.form, 'reading');
    assert.deepEqual(reading.bears.map((b) => b.option), ['the-root-answers-plainly']);
  });

  // `root` carries a review, a survey, and a ruling that all pin the hash
  // the legacy encoding actually recommends -- none of them stale before the
  // migration -- so migration must re-pin all three to the new encoding's
  // hash rather than leave them reading as stale for no reason but the
  // encoding change. `ladder` carries the same three pins already stale
  // (pinned to a hash nothing recommends), so migration must leave them
  // exactly as they stood.
  test("a review, a survey, and a ruling that were not stale are re-pinned to the migrated node's hash", async () => {
    const now = await readGraph(graph);
    const root = now.nodes.find((n) => n.slug === 'root');
    assert.equal(root.reviewStale, false);
    assert.equal(root.surveyStale, false);
    assert.equal(root.review.of, root.recommendationHash);
    assert.equal(root.review.survey.of, root.recommendationHash);
    const authority = root.facts.find((f) => f.name === 'authority');
    assert.equal(authority.moved, false);
    const ruled = authority.options.find((o) => o.ruling);
    assert.equal(ruled.ruling.of, authority.recommendationHash);
    // The pins moved from the legacy hashes: re-pinning is not a no-op that
    // happens to read the same by coincidence.
    assert.notEqual(root.review.of, before_.nodes.find((n) => n.slug === 'root').review.of);
  });

  test('a review, a survey, and a ruling that were already stale are left exactly as they stood', async () => {
    const now = await readGraph(graph);
    const ladder = now.nodes.find((n) => n.slug === 'ladder');
    const legacyLadder = before_.nodes.find((n) => n.slug === 'ladder');
    assert.equal(ladder.reviewStale, true);
    assert.equal(ladder.surveyStale, true);
    assert.equal(ladder.review.of, legacyLadder.review.of);
    assert.equal(ladder.review.survey.of, legacyLadder.review.survey.of);
    const authority = ladder.facts.find((f) => f.name === 'authority');
    assert.equal(authority.moved, true);
    const ruled = authority.options.find((o) => o.ruling);
    const legacyRuled = legacyLadder.facts.find((f) => f.name === 'authority').options.find((o) => o.ruling);
    assert.equal(ruled.ruling.of, legacyRuled.ruling.of);
  });

  test('the account names the old and new hash of each pin it re-pins', async () => {
    const text = await readFile(path.join(graph, 'main', 'root.md'), 'utf8');
    const legacyRoot = before_.nodes.find((n) => n.slug === 'root');
    const now = await readGraph(graph);
    const root = now.nodes.find((n) => n.slug === 'root');
    const authority = root.facts.find((f) => f.name === 'authority');
    const legacyAuthority = legacyRoot.facts.find((f) => f.name === 'authority').options.find((o) => o.ruling);
    assert.match(text, new RegExp(`draft review's pin \`${legacyRoot.review.of}\` is re-computed for the encoding as \`${root.review.of}\``));
    assert.match(text, new RegExp(`survey's pin \`${legacyRoot.review.survey.of}\` is re-computed for the encoding as \`${root.review.survey.of}\``));
    assert.match(
      text,
      new RegExp(`ruling on \`authority\`'s \`deferred\` option's pin \`${legacyAuthority.ruling.of}\` is re-computed for the encoding as \`${authority.recommendationHash}\``),
    );
  });

  test('the account says a stale pin was already past the recommendation and is left as it stood', async () => {
    const text = await readFile(path.join(graph, 'main', 'ladder.md'), 'utf8');
    assert.match(text, /draft review's pin `deadbeefdeadbeefdeadbeefdeadbeefdeadbeef` was already past the recommendation and is left as it stood/);
    assert.match(text, /survey's pin `deadbeefdeadbeefdeadbeefdeadbeefdeadbeef` was already past the recommendation and is left as it stood/);
    assert.match(text, /ruling on `authority`'s `deferred` option's pin `deadbeefdeadbeefdeadbeefdeadbeefdeadbeef` was already past the recommendation and is left as it stood/);
  });

  test('the report counts what it re-pinned and what it left stale', () => {
    assert.equal(result.stats.reviewRepinned, 1);
    assert.equal(result.stats.surveyRepinned, 1);
    assert.equal(result.stats.rulingsRepinned, 1);
    assert.equal(result.stats.reviewLeftStale, 1);
    assert.equal(result.stats.surveyLeftStale, 1);
    assert.equal(result.stats.rulingsLeftStale, 1);
    assert.match(
      result.report,
      /pins re-computed: review 1, survey 1, rulings 1; left stale: review 1, survey 1, rulings 1/,
    );
  });
});

// ---------------------------------------------------------------------------
// the ledger
// ---------------------------------------------------------------------------

describe('the ledger the migration writes', () => {
  let dir;
  let graph;
  let result;

  before(async () => {
    ({ dir, graph } = await copyFixture());
    result = await run(graph);
  });

  after(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  test('one entry per distinct quotation, whatever number of nodes carried it', () => {
    // Four '## Disposition' entries over two nodes, of which one quotation is
    // on both: three entries.
    assert.equal(result.stats.ledgerQuotations, 4);
    assert.equal(result.stats.ledgerEntries, 3);
    const shared = result.ledger.entries.filter((e) => e.nodes.length === 2);
    assert.equal(shared.length, 1);
    assert.deepEqual(shared[0].nodes, ['example.test/main/child', 'example.test/main/root']);
  });

  test('the files are one per date and parse as the reader reads them', async () => {
    assert.deepEqual((await readdir(path.join(graph, 'words'))).sort(), ['2026-09-06.md', '2026-09-07.md']);
    const text = await readFile(path.join(graph, 'words', '2026-09-06.md'), 'utf8');
    const entries = parseWordsFile(text, '2026-09-06');
    assert.equal(entries.length, 2);
    // Entries are numbered in the order the graph is walked, by node id, so
    // the quotation the child carries too is the first of its date.
    assert.equal(entries[0].address, 'words/2026-09-06/1');
    assert.equal(entries[0].text, 'one quote may be referenced by options across nodes');
    assert.match(entries[0].context, /said on example\.test\/main\/child\.$/);
    assert.equal(entries[1].address, 'words/2026-09-06/2');
    assert.equal(entries[1].text, 'keep the root short. the detail belongs on the children.');
    assert.match(entries[1].context, /^The author, 2026-09-06, on how long the root's answer should be; said on example\.test\/main\/root\.$/);
    assert.match(entries[1].sha, /^[0-9a-f]{40}$/);
  });

  test("an option whose source is the author and whose ref is the entry's date carries the reference", async () => {
    const now = await readGraph(graph);
    const root = now.nodes.find((n) => n.slug === 'root');
    const atLength = root.facts[0].options.find((o) => o.name === 'the-root-answers-at-length');
    assert.deepEqual(atLength.supports, ['words/2026-09-06/1', 'words/2026-09-06/2']);
    assert.deepEqual(atLength.diverges, [], 'nothing is filed as a divergence, which is a judgment');
  });

  test('a shared quotation is referenced from the options of both nodes that carried it', async () => {
    const now = await readGraph(graph);
    const shared = result.ledger.entries.find((e) => e.nodes.length === 2).address;
    const child = now.nodes.find((n) => n.slug === 'child');
    const refines = child.facts[0].options.find((o) => o.name === 'the-child-refines-the-root');
    assert.ok(refines.supports.includes(shared), 'the child references it');
    const root = now.nodes.find((n) => n.slug === 'root');
    const atLength = root.facts[0].options.find((o) => o.name === 'the-root-answers-at-length');
    assert.ok(atLength.supports.includes(shared), 'the root references it too');
  });

  test('an entry whose date no option of its node names falls to the recommended option', async () => {
    const now = await readGraph(graph);
    const child = now.nodes.find((n) => n.slug === 'child');
    const refines = child.facts[0].options.find((o) => o.name === 'the-child-refines-the-root');
    // The child's words of 2026-09-07 are named by no option's `ref`.
    assert.ok(refines.supports.includes('words/2026-09-07/1'));
    assert.equal(result.stats.byFallback, 1);
    assert.equal(result.stats.unplaced, 0);
  });

  test('every reference resolves: the graph carries no unresolved words reference', async () => {
    const checked = await validate(graph);
    assert.equal(checked.ok, true, checked.message);
    assert.deepEqual(
      checked.findings.filter((f) => /words reference/.test(f)),
      [],
    );
  });
});

// ---------------------------------------------------------------------------
// idempotence, refusal, and --dry
// ---------------------------------------------------------------------------

describe('running the migration twice', () => {
  test('a second run changes no byte and migrates nothing', async () => {
    const { dir, graph } = await copyFixture();
    try {
      await run(graph);
      const first = await snapshot(graph);
      const again = await run(graph);
      assert.equal(again.stats.legacy, 0);
      assert.equal(again.stats.alreadyContent, 4);
      assert.equal(again.files.size, 0, 'a graph already in the content encoding is written nothing');
      assert.deepEqual([...(await snapshot(graph))], [...first]);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  test('a node already in the content encoding is left alone beside one that is not', async () => {
    const { dir, graph } = await copyFixture();
    try {
      // Migrate the reading alone, by hand, then run over the whole graph:
      // the already-migrated node must come out untouched.
      const first = await run(graph);
      const readingText = first.files.get(path.join('main', 'reading.md'));
      const { dir: dir2, graph: graph2 } = await copyFixture();
      try {
        await cp(path.join(graph, 'main', 'reading.md'), path.join(graph2, 'main', 'reading.md'));
        const second = await run(graph2);
        assert.equal(second.stats.legacy, 3);
        assert.equal(second.stats.alreadyContent, 1);
        assert.ok(!second.files.has(path.join('main', 'reading.md')));
        assert.equal(await readFile(path.join(graph2, 'main', 'reading.md'), 'utf8'), readingText);
      } finally {
        await rm(dir2, { recursive: true, force: true });
      }
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});

describe('--dry', () => {
  test('writes nothing and still reports what it would do', async () => {
    const { dir, graph } = await copyFixture();
    try {
      const first = await snapshot(graph);
      const result = await run(graph, { dry: true });
      assert.equal(result.stats.legacy, 4);
      assert.ok(result.files.size > 4, 'the files it would write are still returned');
      assert.deepEqual([...(await snapshot(graph))], [...first], 'the graph on disk is untouched');
      await assert.rejects(stat(path.join(graph, 'words')));
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});

describe('the ledger is append-only across runs', () => {
  test('a re-run over a partly migrated graph renumbers no entry and rewrites no file', async () => {
    const { dir, graph } = await copyFixture();
    try {
      // The first run refuses `child`, which is at the review stage and has
      // an option the record wrote no text for, so the graph is left part
      // migrated with the ledger already written.
      const first = await run(graph, { derive: false });
      assert.equal(first.stats.refused.length, 1);
      const ledgerAfterFirst = await snapshot(path.join(graph, 'words'));
      assert.equal(ledgerAfterFirst.size, 2);

      const second = await run(graph);
      assert.equal(second.stats.refused.length, 0);
      assert.equal(second.stats.legacy, 1, 'only the refused node is left to migrate');
      assert.equal(
        [...second.files.keys()].filter((f) => f.startsWith('words')).length,
        0,
        'every quotation is already on the ref, so no ledger file is rewritten',
      );
      assert.deepEqual([...(await snapshot(path.join(graph, 'words')))], [...ledgerAfterFirst]);

      // And the addresses the first run wrote are the ones the second run
      // puts on the newly migrated node's options.
      const now = await readGraph(graph);
      const child = now.nodes.find((n) => n.slug === 'child');
      const refines = child.facts[0].options.find((o) => o.name === 'the-child-refines-the-root');
      for (const ref of refines.supports) {
        assert.ok(now.words.has(ref), `${ref} resolves in the ledger the first run wrote`);
      }
      const checked = await validate(graph);
      assert.equal(checked.ok, true, checked.message);
      assert.equal(checked.encodings, 'encodings: legacy 0, content 4');
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});

describe('--no-derived-content', () => {
  test('an option the record wrote no text for carries none, and the node is refused where the stage owes one', async () => {
    const { dir, graph } = await copyFixture();
    try {
      const result = await run(graph, { derive: false });
      assert.equal(result.stats.derived, 0);
      assert.ok(result.stats.none > 0, 'options are left without content');
      // `child` is at the review stage, where the encoding owes every option
      // its content, so it cannot be written without one.
      assert.equal(result.stats.refused.length, 1);
      assert.match(result.stats.refused[0], /requires every answer option to carry its content/);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});
