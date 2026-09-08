// derive.test.mjs -- what the recommendation hash covers in the content
// encoding, and what it must not.
//
// The rule is `survey-selection`'s `a-pin-moves-on-what-binds-the-node`:
// "What moves the pin the judged set turns on is what binds the node and
// nothing beside it: the question, which option the answer fact recommends,
// that option's sentence, its resolved content and the ledger addresses it
// references, and the status any option of the fact carries, a status being
// the record's own ruling that an option is out. A rival's body is not that.
// An option recorded beside the recommendation -- its sentence, its source,
// its ref, the AI's case on it and its content -- moves no pin, whoever
// recorded it."
//
// So every test here is one half of that sentence: something named moves the
// hash, or something not named does not.

import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, test } from 'node:test';

import {
  deriveFactRecommendationHash,
  deriveLegacyFactRecommendationHash,
  deriveLegacyRecommendationHash,
  deriveRecommendationHash,
  legacyContentFactRecommendationHash,
} from './derive.mjs';
import { readGraph } from './read.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const CONTENT_DIR = path.join(HERE, 'fixtures', 'content');

/** An option as the reader writes one onto a content-encoded fact. */
function option(name, over = {}) {
  return {
    name,
    source: 'ai',
    ref: '2026-09-07',
    status: null,
    reason: null,
    ruling: null,
    supports: [],
    diverges: [],
    prose: `#### ${name}`,
    sentence: `What ${name} would answer.`,
    aiSupport: `The case for ${name}.`,
    aiDivergence: `The case against ${name}.`,
    content: null,
    resolved: `The whole content of ${name}.`,
    readings: [],
    ...over,
  };
}

/** A content-encoded node, as `parseNode` hands one to the hashes. */
function node(facts, over = {}) {
  return {
    id: 'example.test/main/n',
    question: 'Q?',
    encoding: 'content',
    fmText: 'question: Q?',
    answer: null,
    rationale: null,
    fence: null,
    facts,
    ...over,
  };
}

/** The one answer fact these tests vary, with two rivals beside the pick. */
function answerFact(over = {}) {
  return {
    name: 'answer',
    options: [option('the-first'), option('the-second'), option('the-third')],
    recommends: 'the-second',
    boldness: 'moderate',
    against: 'The counter-argument on the fact.',
    stands: null,
    prose: 'Why the second.',
    hasHeading: true,
    ...over,
  };
}

/** The hash of a node built from one answer fact, and the fact's own. */
function hashes(fact, over = {}) {
  const n = node([fact], over);
  return { node: deriveRecommendationHash(n), fact: deriveFactRecommendationHash(n, fact) };
}

/** A deep copy, so a test may edit one field and compare against the original. */
const copy = (x) => structuredClone(x);

describe('the content encoding: a rival recorded beside the recommendation moves no pin', () => {
  test('recording a rival with no status moves neither the fact hash nor the node hash', () => {
    const before = answerFact();
    const after = copy(before);
    after.options.push(option('a-rival-recorded-later'));
    assert.deepEqual(hashes(after), hashes(before), 'recording an option is not a movement of the recommendation');
  });

  test("a rival's sentence, source, ref, reason, resolved content and the AI's case on it move nothing", () => {
    const before = answerFact();
    for (const [field, value] of [
      ['sentence', 'A wholly different sentence.'],
      ['source', 'review'],
      ['ref', '2026-01-01'],
      ['reason', 'A reason recorded without a status.'],
      ['resolved', 'A wholly different content, at length.'],
      ['aiSupport', 'A new case for the rival.'],
      ['aiDivergence', 'A new case against the rival.'],
      ['prose', '#### the-third\n\nrewritten whole'],
      ['supports', ['words/2026-09-07/1']],
      ['diverges', ['words/2026-09-07/2']],
    ]) {
      const after = copy(before);
      after.options[2][field] = value;
      assert.deepEqual(hashes(after), hashes(before), `a rival's '${field}' is not what binds the node`);
    }
  });

  test("the fact's own boldness, against and reason prose move nothing", () => {
    const before = answerFact();
    for (const [field, value] of [
      ['boldness', 'high'],
      ['against', 'A different counter-argument entirely.'],
      ['prose', 'A different reason for the same recommendation.'],
    ]) {
      const after = copy(before);
      after[field] = value;
      assert.deepEqual(hashes(after), hashes(before), `'${field}' is no part of what is recommended`);
    }
  });

  test('a ruling recorded on an option moves nothing', () => {
    const before = answerFact();
    const after = copy(before);
    after.options[1].ruling = { response: 'confirm', date: '2026-09-07', of: 'a'.repeat(40), reason: null };
    assert.deepEqual(hashes(after), hashes(before));
  });
});

describe('the content encoding: what does move the pin', () => {
  test('a status set on any option -- passing one over is the record ruling it out', () => {
    const before = answerFact();
    for (const index of [0, 1, 2]) {
      const after = copy(before);
      after.options[index].status = 'passed';
      after.options[index].reason = 'dominated.';
      assert.notEqual(hashes(after).fact, hashes(before).fact, `a status on option ${index} moves the pin`);
      assert.notEqual(hashes(after).node, hashes(before).node);
    }
  });

  test('the status is what counts, not the reason recorded beside it', () => {
    const passed = answerFact();
    passed.options[0].status = 'passed';
    passed.options[0].reason = 'the first reason.';
    const reworded = copy(passed);
    reworded.options[0].reason = 'a different reason, at much greater length.';
    assert.deepEqual(hashes(reworded), hashes(passed), 'a status is the ruling; its reason is prose beside it');
  });

  test('moving `recommends` to another option', () => {
    const before = answerFact();
    const after = copy(before);
    after.recommends = 'the-third';
    assert.notEqual(hashes(after).fact, hashes(before).fact);
    assert.notEqual(hashes(after).node, hashes(before).node);
  });

  test("the recommended option's sentence", () => {
    const before = answerFact();
    const after = copy(before);
    after.options[1].sentence = 'What the second would answer, said another way.';
    assert.notEqual(hashes(after).fact, hashes(before).fact);
  });

  test("the recommended option's resolved content", () => {
    const before = answerFact();
    const after = copy(before);
    after.options[1].resolved = 'The whole content of the second, amended.';
    assert.notEqual(hashes(after).fact, hashes(before).fact);
  });

  test("the ledger addresses the recommended option references, on `supports` and on `diverges`", () => {
    const before = answerFact();
    const withSupport = copy(before);
    withSupport.options[1].supports = ['words/2026-09-07/9'];
    assert.notEqual(hashes(withSupport).fact, hashes(before).fact, 'supports');

    const withDivergence = copy(before);
    withDivergence.options[1].diverges = ['words/2026-09-07/9'];
    assert.notEqual(hashes(withDivergence).fact, hashes(before).fact, 'diverges');
    assert.notEqual(hashes(withDivergence).fact, hashes(withSupport).fact, 'and the two lists are told apart');
  });

  test('the question, folded once at the node level', () => {
    const fact = answerFact();
    const before = hashes(fact);
    const after = hashes(fact, { question: 'A different question?' });
    assert.notEqual(after.node, before.node);
    assert.notEqual(after.fact, before.fact);
  });

  test('a fact that recommends nothing pins nothing', () => {
    const fact = answerFact({ recommends: null });
    assert.equal(deriveFactRecommendationHash(node([fact]), fact), '');
  });
});

describe('the node fold', () => {
  test('every fact name and hash in facts order, headed by the question', () => {
    const answer = answerFact();
    const authority = {
      name: 'authority',
      options: [option('ratified'), option('delegated')],
      recommends: 'ratified',
      boldness: 'low',
      against: null,
      stands: null,
      prose: '',
      hasHeading: false,
    };
    const one = node([answer, authority]);
    const flipped = node([authority, answer]);
    assert.notEqual(deriveRecommendationHash(one), deriveRecommendationHash(flipped), 'facts order is part of the fold');

    const movedAuthority = copy(one);
    movedAuthority.facts[1].recommends = 'delegated';
    assert.notEqual(deriveRecommendationHash(movedAuthority), deriveRecommendationHash(one), 'any fact moving moves the node');
  });
});

describe('the old form, kept for the migration', () => {
  test('the legacy content hash still moves on a rival recorded with no status, where the new one does not', () => {
    const before = answerFact();
    const after = copy(before);
    after.options.push(option('a-rival-recorded-later'));
    const nBefore = node([before]);
    const nAfter = node([after]);
    assert.notEqual(
      legacyContentFactRecommendationHash(nAfter, after),
      legacyContentFactRecommendationHash(nBefore, before),
      'which is the defect the narrowing answers',
    );
    assert.equal(deriveFactRecommendationHash(nAfter, after), deriveFactRecommendationHash(nBefore, before));
    assert.notEqual(
      deriveLegacyRecommendationHash(nAfter),
      deriveRecommendationHash(nAfter),
      'the two forms of one node are different hashes, which is what the migration rewrites between',
    );
  });

  test('the legacy fold and the legacy fact hash agree with each other', () => {
    const fact = answerFact();
    const n = node([fact]);
    assert.equal(deriveLegacyFactRecommendationHash(n, fact), legacyContentFactRecommendationHash(n, fact));
    assert.equal(deriveLegacyFactRecommendationHash(n, answerFact({ recommends: null })), '');
  });

  test('a legacy-encoded node is untouched: the old form and the new are one hash', () => {
    const legacy = {
      id: 'example.test/main/l',
      question: 'Q?',
      fmText: 'question: Q?',
      answer: 'Ans.',
      rationale: null,
      fence: null,
      facts: [{
        name: 'answer',
        options: [{ name: 'standing', prose: '' }],
        recommends: 'standing',
        boldness: 'low',
        stands: 'standing',
        prose: 'Why.',
      }],
    };
    assert.equal(deriveLegacyRecommendationHash(legacy), deriveRecommendationHash(legacy));
    assert.equal(
      deriveLegacyFactRecommendationHash(legacy, legacy.facts[0]),
      deriveFactRecommendationHash(legacy, legacy.facts[0]),
    );
  });
});

describe('the content fixture graph, read as the record is read', () => {
  test('recording a rival on a real node moves no pin; passing one over does', async () => {
    const graph = await readGraph(CONTENT_DIR);
    const read = graph.nodes.find((n) => n.slug === 'ladder');
    const before = deriveRecommendationHash(read);
    assert.equal(before, read.recommendationHash, 'the reader and the derivation agree');

    read.facts[0].options.push(option('a-rung-recorded-by-the-survey'));
    assert.equal(deriveRecommendationHash(read), before, 'the survey may write on a node without staling its own pin');

    read.facts[0].options[0].status = 'passed';
    read.facts[0].options[0].reason = 'dominated by the rung above it.';
    assert.notEqual(deriveRecommendationHash(read), before, 'and passing a rung over is the record ruling it out');
  });
});
