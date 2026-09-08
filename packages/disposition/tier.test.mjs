// packages/disposition/tier.test.mjs
//
// The mechanical tier (`tier.mjs`) and the term concordance it reads
// (`concordance.mjs`), with the one flag they are run behind
// (`validate.mjs --tier`).
//
// Most of these build a graph object by hand rather than a fixture tree. The
// tier takes a graph as `readGraph` returns it and never touches a file, and
// four of its checks name states `read.mjs` refuses at parse time, so a
// fixture could not carry them at all -- the tier holds them because the
// answer says the validator holds them, not because a graph on disk can be
// made to fail them.
//
// Run with: node --test packages/disposition/*.test.mjs
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { cp, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { after, describe, test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

import { TERM_KEY_MAX_SHARE, concordance, nodeText, usesTerm } from './concordance.mjs';
import {
  PASSAGE_BYTES,
  TIER_CHECKS,
  TIER_GATE_CHECKS,
  TIER_REPORT_CHECKS,
  checkTier,
  foldableSections,
  partitionTier,
  tierNotes,
} from './tier.mjs';

const execFileAsync = promisify(execFile);
const HERE = path.dirname(fileURLToPath(import.meta.url));
// `fixtures/valid` itself carries a `term-without-a-path` finding (one
// fixture node uses a term another defines with no edge between them), which
// is a fair sample of how loud that check is on real text; the dialogue
// fixture is tier-clean and is what the clean run reads.
const VALID_FIXTURE = path.join(HERE, 'fixtures', 'valid-dialogue');
const VALIDATE_MJS = path.join(HERE, 'validate.mjs');
const CONCORDANCE_MJS = path.join(HERE, 'concordance.mjs');

const tmpDirs = [];
after(async () => {
  await Promise.all(tmpDirs.map((d) => rm(d, { recursive: true, force: true })));
});

async function scratch(prefix) {
  const dir = await mkdtemp(path.join(os.tmpdir(), `tier-${prefix}`));
  tmpDirs.push(dir);
  return dir;
}

/** A fresh copy of the `valid` fixture graph: `dir` is a valid rootDir. */
async function freshValid(prefix) {
  const dir = await scratch(prefix);
  await cp(VALID_FIXTURE, dir, { recursive: true });
  return dir;
}

/** A node as `readGraph` returns one, with only the fields a check reads. */
function node(id, extra = {}) {
  return {
    id,
    question: `What is ${id}?`,
    under: [],
    depends: [],
    cites: [],
    bears: [],
    defines: [],
    facts: [],
    stage: null,
    review: null,
    account: null,
    recommendationHash: 'a'.repeat(40),
    ...extra,
  };
}

const of = (check, findings) => findings.filter((f) => f.check === check);

describe('TIER_CHECKS', () => {
  test('is the eight checks the answer lists, in its order', () => {
    assert.deepEqual(TIER_CHECKS, [
      'unresolved-reference',
      'recommendation-past-its-pin',
      'duplicate-option-name',
      'option-content-unresolvable',
      'term-without-a-path',
      'unresolved-words-reference',
      'duplicated-passage',
      'unfolded-account-section',
    ]);
  });

  test('a graph with nothing wrong with it reports nothing', () => {
    assert.deepEqual(checkTier({ nodes: [node('g/a'), node('g/b')] }), []);
  });
});

describe('TIER_GATE_CHECKS and TIER_REPORT_CHECKS', () => {
  test('every check the tier holds has a kind', () => {
    for (const check of TIER_CHECKS) {
      assert.ok(
        TIER_GATE_CHECKS.includes(check) || TIER_REPORT_CHECKS.includes(check),
        `${check} is neither a gate check nor a report check`,
      );
    }
  });

  test('the two lists partition TIER_CHECKS exactly: no overlap, nothing left over', () => {
    const union = new Set([...TIER_GATE_CHECKS, ...TIER_REPORT_CHECKS]);
    assert.deepEqual([...union].sort(), [...TIER_CHECKS].sort());
    assert.equal(TIER_GATE_CHECKS.length + TIER_REPORT_CHECKS.length, TIER_CHECKS.length);
    for (const check of TIER_GATE_CHECKS) assert.ok(!TIER_REPORT_CHECKS.includes(check));
  });

  test('the four defects of the encoding gate; the four states of the record report', () => {
    assert.deepEqual(TIER_GATE_CHECKS, [
      'unresolved-reference',
      'duplicate-option-name',
      'option-content-unresolvable',
      'unresolved-words-reference',
    ]);
    assert.deepEqual(TIER_REPORT_CHECKS, [
      'recommendation-past-its-pin',
      'term-without-a-path',
      'duplicated-passage',
      'unfolded-account-section',
    ]);
  });
});

describe('checkTier: every finding carries its check\'s kind', () => {
  test('a gate finding and a report finding are each stamped correctly', () => {
    const findings = checkTier({
      nodes: [
        node('g/a', { under: ['g/gone'] }),
        node('g/b', { facts: [{ name: 'answer', options: [{ name: 'x' }, { name: 'x' }] }] }),
      ],
    });
    const unresolved = findings.find((f) => f.check === 'unresolved-reference');
    const duplicate = findings.find((f) => f.check === 'duplicate-option-name');
    assert.equal(unresolved.kind, 'gate');
    assert.equal(duplicate.kind, 'gate');
  });
});

describe('partitionTier', () => {
  test('splits findings by kind', () => {
    const findings = [
      { check: 'unresolved-reference', node: 'g/a', detail: 'x', kind: 'gate' },
      { check: 'term-without-a-path', node: 'g/b', detail: 'y', kind: 'report' },
    ];
    assert.deepEqual(partitionTier(findings), {
      gate: [findings[0]],
      report: [findings[1]],
    });
  });

  test('a fixture with one gating defect and one report finding yields one of each', () => {
    const definer = node('g/def', { defines: [{ term: 'judged set', gloss: 'what a survey reads' }] });
    const filler = Array.from({ length: 10 }, (_, i) => node(`g/filler${i}`));
    const findings = checkTier({
      nodes: [
        node('g/a', { under: ['g/gone'] }),
        definer,
        node('g/user', { question: 'What is the judged set?' }),
        ...filler,
      ],
    });
    const { gate, report } = partitionTier(findings);
    assert.equal(gate.length, 1);
    assert.equal(gate[0].check, 'unresolved-reference');
    assert.equal(report.length, 1);
    assert.equal(report[0].check, 'term-without-a-path');
  });

  test('an empty finding list partitions to two empty lists', () => {
    assert.deepEqual(partitionTier([]), { gate: [], report: [] });
  });
});

describe('checkTier: unresolved-reference', () => {
  test("an 'under', a 'depends' and a 'bears' naming a node the graph does not carry", () => {
    const findings = of('unresolved-reference', checkTier({
      nodes: [
        node('g/a', { under: ['g/gone'] }),
        node('g/b', { depends: [{ id: 'g/gone', option: null }] }),
        node('g/c', {
          under: ['g/a'],
          bears: [{ node: 'g/gone', fact: 'answer', option: 'x' }],
        }),
      ],
    }));
    assert.equal(findings.length, 3);
    assert.deepEqual(findings.map((f) => f.node), ['g/a', 'g/b', 'g/c']);
    for (const f of findings) assert.match(f.detail, /g\/gone/);
  });

  test("a 'depends' on an option the target does not carry, and a 'bears' on a fact it does not carry", () => {
    const target = node('g/t', { facts: [{ name: 'answer', options: [{ name: 'stands' }] }] });
    const findings = of('unresolved-reference', checkTier({
      nodes: [
        target,
        node('g/a', { depends: [{ id: 'g/t', option: 'nope' }] }),
        node('g/b', { under: ['g/t'], bears: [{ fact: 'authority', option: 'stands' }] }),
        node('g/c', { under: ['g/t'], bears: [{ fact: 'answer', option: 'nope' }] }),
      ],
    }));
    assert.equal(findings.length, 3);
    assert.match(findings[0].detail, /carries no option 'nope'/);
    assert.match(findings[1].detail, /carries no fact 'authority'/);
    assert.match(findings[2].detail, /carries no option 'nope'/);
  });

  test("a 'bears' with no node on a reading with two parents names the ambiguity itself", () => {
    const findings = of('unresolved-reference', checkTier({
      nodes: [
        node('g/p'),
        node('g/q'),
        node('g/r', { under: ['g/p', 'g/q'], bears: [{ fact: 'answer', option: 'x' }] }),
      ],
    }));
    assert.equal(findings.length, 1);
    assert.match(findings[0].detail, /names no node and the reading has 2 parents/);
  });
});

describe('checkTier: recommendation-past-its-pin', () => {
  const stale = { date: '2026-09-01', of: 'b'.repeat(40), survey: null };

  test('a stale draft pin on a node carrying no stage is a finding: nothing will read it again', () => {
    const findings = of('recommendation-past-its-pin', checkTier({
      nodes: [node('g/a', { review: stale })],
    }));
    assert.equal(findings.length, 1);
    assert.match(findings[0].detail, /no re-reading is owed/);
  });

  test('the same pin at the review or the ruling stage is not a finding, and this is the whole of the check', () => {
    // The regression this guards: written without the stage clause the check
    // fired on every node the survey was about to judge -- 55 of them on the
    // record of 2026-09-07 -- so the gate made the reading it gates
    // impossible. A stale draft pin at these stages is what `chooseMode`
    // turns into the delta re-reading, and a stale survey pin is the
    // definition of the judged set.
    for (const stage of ['review', 'ruling']) {
      assert.deepEqual(
        of('recommendation-past-its-pin', checkTier({
          nodes: [node('g/a', {
            stage,
            review: { ...stale, survey: { date: '2026-09-01', of: 'c'.repeat(40) } },
          })],
        })),
        [],
        `a pin at stage ${stage} is the reading's subject matter and not a defect`,
      );
    }
  });

  test('a stale survey pin off those stages is its own finding', () => {
    const findings = of('recommendation-past-its-pin', checkTier({
      nodes: [node('g/a', {
        stage: 'maieutic',
        review: { date: '2026-09-01', of: 'a'.repeat(40), survey: { date: '2026-09-01', of: 'd'.repeat(40) } },
      })],
    }));
    assert.equal(findings.length, 1);
    assert.match(findings[0].detail, /no survey will judge it again/);
  });

  test("a fact moved past its ruling on a node with no stage: read.mjs refuses it, and the tier says so anyway", () => {
    const findings = of('recommendation-past-its-pin', checkTier({
      nodes: [node('g/a', {
        facts: [{
          name: 'answer',
          moved: true,
          options: [{ name: 'x', ruling: { date: '2026-09-02', of: 'e'.repeat(40) } }],
        }],
      })],
    }));
    assert.equal(findings.length, 1);
    assert.match(findings[0].detail, /carries a ruling of 2026-09-02/);
  });

  test('a fact that has not moved past its ruling is nothing', () => {
    assert.deepEqual(of('recommendation-past-its-pin', checkTier({
      nodes: [node('g/a', {
        facts: [{
          name: 'answer',
          moved: false,
          options: [{ name: 'x', ruling: { date: '2026-09-02', of: 'e'.repeat(40) } }],
        }],
      })],
    })), []);
  });
});

describe('checkTier: duplicate-option-name', () => {
  test('two options of one name on one fact', () => {
    const findings = of('duplicate-option-name', checkTier({
      nodes: [node('g/a', {
        facts: [
          { name: 'answer', options: [{ name: 'x' }, { name: 'y' }, { name: 'x' }] },
          { name: 'authority', options: [{ name: 'x' }] },
        ],
      })],
    }));
    assert.equal(findings.length, 1);
    assert.match(findings[0].detail, /fact 'answer' carries two options named 'x'/);
  });
});

describe('checkTier: option-content-unresolvable', () => {
  const contentNode = (options) => node('g/a', { facts: [{ name: 'answer', options }] });

  test('content resolving through a name no option carries', () => {
    const findings = of('option-content-unresolvable', checkTier({
      nodes: [contentNode([
        { name: 'x', content: { form: 'change', from: 'nowhere', diff: '' } },
      ])],
    }));
    assert.equal(findings.length, 1);
    assert.match(findings[0].detail, /has no option 'nowhere'/);
  });

  test('content resolving through a cycle', () => {
    const findings = of('option-content-unresolvable', checkTier({
      nodes: [contentNode([
        { name: 'x', content: { form: 'change', from: 'y', diff: '' } },
        { name: 'y', content: { form: 'change', from: 'x', diff: '' } },
      ])],
    }));
    assert.equal(findings.length, 2, 'each option is entered on its own and each finds the cycle');
    for (const f of findings) assert.match(f.detail, /resolves through a cycle/);
  });

  test('content whose hunk does not apply exactly', () => {
    const findings = of('option-content-unresolvable', checkTier({
      nodes: [contentNode([
        { name: 'base', content: { form: 'whole', text: 'one\ntwo\n' } },
        {
          name: 'x',
          content: {
            form: 'change',
            from: 'base',
            diff: '@@ -1,1 +1,1 @@\n-three\n+four\n',
          },
        },
      ])],
    }));
    assert.equal(findings.length, 1);
    assert.match(findings[0].detail, /does not apply to 'base'/);
  });

  test('content that resolves is nothing', () => {
    assert.deepEqual(of('option-content-unresolvable', checkTier({
      nodes: [contentNode([
        { name: 'base', content: { form: 'whole', text: 'one\ntwo\n' } },
        {
          name: 'x',
          content: { form: 'change', from: 'base', diff: '@@ -1,1 +1,1 @@\n-one\n+ONE\n' },
        },
      ])],
    })), []);
  });
});

describe('checkTier: term-without-a-path', () => {
  const definer = node('g/def', { defines: [{ term: 'judged set', gloss: 'what a survey reads' }] });

  // A term used by only one node of two is a share of one half, which the
  // hub-share bound below would itself skip; every test here that expects a
  // finding pads the graph with enough plain nodes that the term's share
  // stays under `TERM_KEY_MAX_SHARE`, so the bound is not what is under
  // test in this block.
  const padded = (nodes) => [
    ...nodes,
    ...Array.from({ length: 10 }, (_, i) => node(`g/filler${i}`)),
  ];

  test('a user with no path to the definer', () => {
    const findings = of('term-without-a-path', checkTier({
      nodes: padded([definer, node('g/user', { question: 'What is the judged set?' })]),
    }));
    assert.equal(findings.length, 1);
    assert.equal(findings[0].node, 'g/user');
    assert.match(findings[0].detail, /uses the term 'judged set'/);
  });

  test("a path over 'under', over 'depends' or over 'cites' clears it", () => {
    for (const edge of [
      { under: ['g/def'] },
      { depends: [{ id: 'g/def', option: null }] },
      { cites: [{ id: 'g/def' }] },
    ]) {
      assert.deepEqual(
        of('term-without-a-path', checkTier({
          nodes: [definer, node('g/user', { question: 'What is the judged set?', ...edge })],
        })),
        [],
        `an edge ${Object.keys(edge)[0]} is a path a reader can follow`,
      );
    }
  });

  test('the path may run through another node', () => {
    assert.deepEqual(of('term-without-a-path', checkTier({
      nodes: [
        definer,
        node('g/mid', { under: ['g/def'] }),
        node('g/user', { question: 'What is the judged set?', under: ['g/mid'] }),
      ],
    })), []);
  });

  test('a precomputed concordance gives the same findings as one derived inside', () => {
    const graph = { nodes: [definer, node('g/user', { question: 'What is the judged set?' })] };
    assert.deepEqual(
      checkTier(graph, { concordance: concordance(graph) }),
      checkTier(graph),
    );
  });

  test('a term used by more than TERM_KEY_MAX_SHARE of the nodes nominates nothing', () => {
    // 2 users of 3 nodes is a share of 2/3, well past the tenth the record's
    // own ordinary vocabulary clears; the record's rule
    // (`survey-selection`, quoted in `candidatePairs`) is that such a term
    // "orders nothing and grows with the graph", the same reason
    // `candidatePairs` already skips it. Before this fix every one of these
    // users was its own finding.
    const graph = {
      nodes: [
        definer,
        node('g/u1', { question: 'What is the judged set?' }),
        node('g/u2', { question: 'What is the judged set?' }),
      ],
    };
    assert.equal(concordance(graph).terms[0].users.length, 2);
    assert.ok(2 > TERM_KEY_MAX_SHARE * graph.nodes.length, 'the fixture is actually over the ceiling');
    assert.deepEqual(of('term-without-a-path', checkTier(graph)), []);
  });

  test('a term at or under the share still reports its unreachable users', () => {
    // The same term, the same absolute count of users (1), but padded out
    // with enough other nodes that the share falls at the record's ordinary
    // vocabulary threshold and the check still holds it.
    const filler = Array.from({ length: 10 }, (_, i) => node(`g/filler${i}`));
    const graph = { nodes: [definer, node('g/user', { question: 'What is the judged set?' }), ...filler] };
    assert.ok(1 <= TERM_KEY_MAX_SHARE * graph.nodes.length, 'the fixture sits at or under the ceiling');
    const findings = of('term-without-a-path', checkTier(graph));
    assert.equal(findings.length, 1);
    assert.equal(findings[0].node, 'g/user');
  });
});

describe('checkTier: unresolved-words-reference', () => {
  const words = new Map([['words/2026-09-05/1', { address: 'words/2026-09-05/1' }]]);
  const withRefs = (refs) => ({
    nodes: [node('g/a', { facts: [{ name: 'answer', options: [{ name: 'x', ...refs }] }] })],
  });

  test('a reference that is not the shape of a ledger address', () => {
    const findings = of('unresolved-words-reference', checkTier(withRefs({ supports: ['the author said so'] }), { words }));
    assert.equal(findings.length, 1);
    assert.match(findings[0].detail, /is not the shape of a ledger address/);
  });

  test('a well-shaped reference resolving to no entry', () => {
    const findings = of('unresolved-words-reference', checkTier(withRefs({ diverges: ['words/2026-01-01/9'] }), { words }));
    assert.equal(findings.length, 1);
    assert.match(findings[0].detail, /resolves to no entry of the ledger/);
  });

  test('a reference the ledger carries is nothing', () => {
    assert.deepEqual(
      of('unresolved-words-reference', checkTier(withRefs({ supports: ['words/2026-09-05/1'] }), { words })),
      [],
    );
  });
});

describe('checkTier: duplicated-passage', () => {
  const long = `A passage of the record repeated word for word on two nodes, which is the duplication the tier reports, and it is written out here at length so that it passes the ${PASSAGE_BYTES}-byte floor the check holds without any help.`;

  test('a paragraph byte-identical across two nodes, with its byte count and the other node named', () => {
    assert.ok(Buffer.byteLength(long, 'utf8') >= PASSAGE_BYTES);
    const findings = of('duplicated-passage', checkTier({
      nodes: [
        node('g/a', { answer: long }),
        node('g/b', { rationale: long }),
      ],
    }));
    assert.equal(findings.length, 1);
    assert.equal(findings[0].node, 'g/a');
    assert.match(findings[0].detail, /bytes byte-identical with g\/b/);
  });

  test('a passage under the floor is not a finding', () => {
    assert.deepEqual(of('duplicated-passage', checkTier({
      nodes: [node('g/a', { answer: 'short and shared' }), node('g/b', { answer: 'short and shared' })],
    })), []);
  });

  test('a sentence inside a reported paragraph, on the same nodes, is not the same defect said twice', () => {
    const paragraph = `${long} And a second sentence, carried along with it on both nodes, so that the paragraph and the sentence inside it would each clear the floor on their own and only the longer of the two is reported.`;
    const findings = of('duplicated-passage', checkTier({
      nodes: [node('g/a', { answer: paragraph }), node('g/b', { answer: paragraph })],
    }));
    assert.equal(findings.length, 1);
  });

  test('the same passage shared only in the account is not a finding: the apply script writes it there itself', () => {
    // The regression this guards: the apply script's own generated account
    // sentence -- e.g. the 238-byte "Read in clean context by a subagent
    // given the amendment, ..." notice -- lands on every node it touches,
    // which is not the duplication the check exists to find (prose two
    // authors wrote alike). `nodeText` is read here with `account: false`.
    assert.deepEqual(of('duplicated-passage', checkTier({
      nodes: [node('g/a', { account: long }), node('g/b', { account: long })],
    })), []);
  });

  test('the same passage in one node\'s account and another\'s answer is not a finding: only the answer side is text', () => {
    // With `account` excluded, `g/a` no longer carries the passage at all,
    // so this is not duplication of anything -- confirming the account is
    // actually dropped from the text the check reads, not merely
    // deprioritized.
    assert.deepEqual(of('duplicated-passage', checkTier({
      nodes: [node('g/a', { account: long }), node('g/b', { answer: long })],
    })), []);
  });
});

describe('checkTier: unfolded-account-section, and foldableSections', () => {
  const account = [
    '### Recorded, 2026-09-01',
    '',
    'something',
    '',
    '### Clean-context review, 2026-09-02',
    '',
    'a reading',
    '',
  ].join('\n');

  test('the sections before the last reading, on a node at the review or the ruling stage', () => {
    for (const stage of ['review', 'ruling']) {
      const findings = of('unfolded-account-section', checkTier({ nodes: [node('g/a', { stage, account })] }));
      assert.equal(findings.length, 1, `stage ${stage}`);
      assert.match(findings[0].detail, /1 '### ' account section\(s\)/);
      assert.match(findings[0].detail, /Recorded, 2026-09-01/);
    }
  });

  test('off those stages the fold is not owed and nothing is reported', () => {
    assert.deepEqual(of('unfolded-account-section', checkTier({ nodes: [node('g/a', { stage: 'maieutic', account })] })), []);
  });

  test('an account whose only section is the reading itself has nothing before it', () => {
    const only = '### Clean-context review, 2026-09-02\n\na reading\n';
    assert.deepEqual(foldableSections(node('g/a', { stage: 'review', account: only })), []);
  });

  test("a heading inside a fence is not a heading: an account quotes node text", () => {
    const fenced = [
      '```markdown',
      '### Recorded, 2026-09-01',
      '```',
      '',
      '### Clean-context review, 2026-09-02',
      '',
      'a reading',
    ].join('\n');
    assert.deepEqual(foldableSections(node('g/a', { stage: 'review', account: fenced })), []);
  });

  test("accumulate.mjs's own fold is used in place of this one wherever it is given", () => {
    const findings = of('unfolded-account-section', checkTier(
      { nodes: [node('g/a', { stage: 'maieutic', account })] },
      { foldable: () => ['a section the accumulation names'] },
    ));
    assert.equal(findings.length, 1);
    assert.match(findings[0].detail, /a section the accumulation names/);
  });
});

describe('tierNotes', () => {
  test('an unreferenced ledger entry is a note beside the tier and never a finding', () => {
    const words = new Map([
      ['words/2026-09-05/1', {}],
      ['words/2026-09-05/2', {}],
    ]);
    const graph = {
      nodes: [node('g/a', { facts: [{ name: 'answer', options: [{ name: 'x', supports: ['words/2026-09-05/1'] }] }] })],
      words,
    };
    assert.deepEqual(of('unresolved-words-reference', checkTier(graph)), []);
    const notes = tierNotes(graph);
    assert.equal(notes.length, 1);
    assert.equal(notes[0].note, 'unreferenced-ledger-entry');
    assert.match(notes[0].detail, /words\/2026-09-05\/2/);
  });
});

describe('concordance', () => {
  test('one entry per defined term, with the users and whether each can reach the definer', () => {
    const graph = {
      nodes: [
        node('g/def', { defines: ['mechanical tier', 'judged set'] }),
        node('g/near', { under: ['g/def'], answer: 'The mechanical tier gates the launch.' }),
        node('g/far', { answer: 'The judged set is what a survey reads.' }),
      ],
    };
    const { terms } = concordance(graph);
    assert.deepEqual(terms.map((t) => t.term), ['judged set', 'mechanical tier'], 'sorted by term');
    const judged = terms.find((t) => t.term === 'judged set');
    assert.equal(judged.defines, 'g/def');
    assert.deepEqual(judged.users, [{ node: 'g/far', reachable: false }]);
    const tier = terms.find((t) => t.term === 'mechanical tier');
    assert.deepEqual(tier.users, [{ node: 'g/near', reachable: true }]);
  });

  test('the definer is never a user of its own term', () => {
    const { terms } = concordance({
      nodes: [node('g/def', { defines: ['judged set'], answer: 'The judged set is this.' })],
    });
    assert.deepEqual(terms[0].users, []);
  });

  test('two nodes defining one term are two entries, not one', () => {
    const { terms } = concordance({
      nodes: [node('g/a', { defines: ['judged set'] }), node('g/b', { defines: ['judged set'] })],
    });
    assert.equal(terms.length, 2);
    assert.deepEqual(terms.map((t) => t.defines), ['g/a', 'g/b']);
  });

  test('usesTerm asserts a word boundary and matches a phrase across a line break', () => {
    assert.equal(usesTerm('the judged set stands', 'judged set'), true);
    assert.equal(usesTerm('the judged\nset stands', 'judged set'), true);
    assert.equal(usesTerm('the Judged Set stands', 'judged set'), true, 'case-insensitive');
    assert.equal(usesTerm('unjudged sets', 'judged set'), false);
    assert.equal(usesTerm('judged-set', 'judged set'), false, 'a hyphen is not a boundary here');
  });

  test('nodeText carries the question, the sections, and every fact and option', () => {
    const text = nodeText(node('g/a', {
      question: 'Q?',
      answer: 'A.',
      rationale: 'R.',
      account: 'Acc.',
      facts: [{ name: 'answer', prose: 'P.', options: [{ name: 'x', sentence: 'S.', resolved: 'C.' }] }],
    }));
    for (const part of ['Q?', 'A.', 'R.', 'Acc.', 'P.', 'S.', 'C.']) {
      assert.ok(text.includes(part), `nodeText carries ${part}`);
    }
  });

  test('nodeText omits the account when told to', () => {
    const withAccount = nodeText(node('g/a', { account: 'Only in the account.' }));
    const without = nodeText(node('g/a', { account: 'Only in the account.' }), { account: false });
    assert.ok(withAccount.includes('Only in the account.'));
    assert.ok(!without.includes('Only in the account.'));
  });

  test('nodeText contributes an option held whole once, not once as its raw fence and again as its resolution', () => {
    // In the content encoding `prose` is the whole `#### <option>`
    // subsection, content fence included, and for an option held whole
    // `resolved` is exactly that fence's text -- pushing both put the same
    // body into the concordance, the passage check, and `candidatePairs`'
    // `cites` key twice.
    const wholeFenceText = 'The node as it would stand under this option.';
    const text = nodeText(node('g/a', {
      facts: [{
        name: 'answer',
        options: [{
          name: 'x',
          prose: `A sentence.\n\n**Content.**\n\n\`\`\`markdown\n${wholeFenceText}\n\`\`\``,
          sentence: 'A sentence.',
          resolved: wholeFenceText,
        }],
      }],
    }));
    const occurrences = text.split(wholeFenceText).length - 1;
    assert.equal(occurrences, 1, `the fence's text should appear once, appeared ${occurrences} times`);
  });

  test('nodeText still carries a named change\'s resolution, which never appears in prose at all', () => {
    // `prose` for a named change carries the diff hunks, never the resolved
    // text those hunks produce, so `resolved` is not a duplicate here and
    // must still be pushed -- the fix is a containment check, not a
    // blanket drop of `resolved`.
    const resolvedText = 'The base with the hunk applied.';
    const text = nodeText(node('g/a', {
      facts: [{
        name: 'answer',
        options: [{
          name: 'x',
          prose: "A sentence.\n\nFrom: base\n\n```diff\n-old line\n+new line\n```",
          sentence: 'A sentence.',
          resolved: resolvedText,
        }],
      }],
    }));
    assert.ok(text.includes(resolvedText));
  });

  test('the CLI writes the concordance as JSON to --out', async () => {
    const dir = await freshValid('conc-cli-');
    const out = path.join(dir, 'concordance.json');
    await execFileAsync(process.execPath, [CONCORDANCE_MJS, dir, '--out', out]);
    const parsed = JSON.parse(await readFile(out, 'utf8'));
    assert.ok(Array.isArray(parsed.terms), 'the file holds { terms: [...] }');
  });
});

describe('validate.mjs --tier', () => {
  test('a clean graph exits 0 and still says which checks ran', async () => {
    const dir = await freshValid('cli-clean-');
    const { stdout } = await execFileAsync(process.execPath, [VALIDATE_MJS, dir, '--tier']);
    assert.match(stdout, new RegExp(`checks ran: ${TIER_CHECKS.join(', ')}`));
    assert.match(stdout, /tier: 0 finding\(s\) over 8 checks/);
    assert.doesNotMatch(stdout, /^tier: [a-z]/m, 'no finding line');
  });

  test('a graph with a finding exits 1 and names the check, the node and the detail', async () => {
    const dir = await freshValid('cli-finding-');
    // A passage over the floor, written into two node files: the check is
    // byte identity across nodes, so this is a finding wherever it lands --
    // in the '## Answer' section, which every node carries and which
    // `duplicated-passage` always reads, unlike '## Account'.
    const passage = 'A paragraph long enough to clear the two hundred byte floor the tier holds, written into two node files of this fixture so that the duplicated-passage check has something to find, and byte-identical in both.';
    const files = (await execFileAsync('find', [dir, '-name', '*.md'])).stdout.split('\n').filter(Boolean).slice(0, 2);
    assert.equal(files.length, 2, 'the fixture carries at least two node files');
    for (const file of files) {
      const content = await readFile(file, 'utf8');
      const updated = content.replace(/^## Answer\n/m, `$&\n${passage}\n`);
      assert.notEqual(updated, content, `${file} carries an '## Answer' heading to insert after`);
      await writeFile(file, updated);
    }

    const err = await execFileAsync(process.execPath, [VALIDATE_MJS, dir, '--tier']).then(
      () => null,
      (e) => e,
    );
    assert.ok(err !== null, 'a finding exits non-zero, so a caller can gate a launch on it');
    assert.equal(err.code, 1);
    assert.match(err.stdout, /^tier: duplicated-passage: /m);
    assert.match(err.stdout, new RegExp(`checks ran: ${TIER_CHECKS.join(', ')}`));
  });
});
