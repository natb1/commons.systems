#!/usr/bin/env node
// packages/disposition/concordance.mjs
//
// The term concordance the survey-selection node names: "a term used by a
// node with no path to the node whose `defines` carries it, read off a term
// concordance the projector emits". This module derives the concordance; the
// tier (`tier.mjs`) reads the finding off it, and the projector emits it.
//
// One entry per term any node's `defines` carries, naming the node that
// defines it, every node whose own text uses it (word-boundary,
// case-insensitive), and, for each of those, whether that node has a path to
// the defining node over the record's own reference edges -- `under`,
// `depends` and `cites`. A term used with no such path is a term a reader
// meets with no way to reach the sentence that fixes it, which is the defect
// the tier reports.
//
// Two terms defined by two different nodes are two entries, not one: nothing
// in the encoding forbids it, and collapsing them would hide exactly the
// duplication a reader would want reported.
//
// The reachability is directed and outward from the user: the edges a
// projection walks from a node are `under` (the node it stands beneath),
// `depends` (the questions its answer waits on) and `cites` (the evidence and
// nodes it names), and a path over them is the path a reader following the
// record's own references would take. `cites[].id` is often a path into
// `bootstrap/` rather than a node id; an id that names no node is not an
// edge and is skipped.
//
// CLI: node packages/disposition/concordance.mjs <graphDir> [--out <file>]
// prints the concordance as JSON (or writes it to `--out`).
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { readGraph, defineTerms } from './read.mjs';

/**
 * The canonical text of one node, for every scan that asks what a node says:
 * its question, the sections it carries, every fact's prose, every option's
 * prose, and the '## Recommendation' fence where it has one. The reader
 * keeps no raw file bytes on a node, so this is the record's own answer to
 * "the node's text" and is the one definition `concordance` and `tier` share
 * -- a scan that composed its own would find terms and passages the other
 * did not.
 *
 * @param {object} node
 * @returns {string}
 */
export function nodeText(node) {
  const parts = [];
  const push = (s) => {
    if (typeof s === 'string' && s.length > 0) parts.push(s);
  };
  push(node?.question);
  push(node?.disposition);
  push(node?.answer);
  push(node?.rationale);
  push(node?.account);
  for (const fact of node?.facts ?? []) {
    push(fact?.prose);
    for (const option of fact?.options ?? []) {
      push(option?.prose);
      push(option?.sentence);
      push(option?.aiSupport);
      push(option?.aiDivergence);
      push(option?.resolved);
    }
  }
  if (node?.fence && typeof node.fence.raw === 'string') push(node.fence.raw);
  return parts.join('\n\n');
}

function escapeRegExp(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Whether `text` uses `term` at a word boundary, case-insensitively. The
 * record's terms are phrases ("judged set", "mechanical tier"), so the
 * boundary is asserted at the ends of the whole phrase and the inner
 * whitespace is matched as whitespace: a term written across a line break in
 * a paragraph the record wraps is the same use.
 *
 * @param {string} text
 * @param {string} term
 * @returns {boolean}
 */
export function usesTerm(text, term) {
  const pattern = term
    .trim()
    .split(/\s+/)
    .map(escapeRegExp)
    .join('\\s+');
  if (pattern === '') return false;
  return new RegExp(`(?<![A-Za-z0-9-])${pattern}(?![A-Za-z0-9-])`, 'i').test(text);
}

/**
 * The ids one node points at over the reference edges a reader follows:
 * `under`, `depends[].id` and `cites[].id`. Ids that name no node in the
 * graph are dropped by the caller, which holds the index.
 */
function outgoingIds(node) {
  return [
    ...(node?.under ?? []),
    ...(node?.depends ?? []).map((d) => (typeof d === 'string' ? d : d?.id)),
    ...(node?.cites ?? []).map((c) => (typeof c === 'string' ? c : c?.id)),
  ].filter((id) => typeof id === 'string' && id.length > 0);
}

/**
 * Every node reachable from `startId` over those edges, `startId` itself
 * included (a node defines a term for itself trivially).
 */
function reachableFrom(startId, adjacency) {
  const seen = new Set([startId]);
  const queue = [startId];
  while (queue.length > 0) {
    const id = queue.shift();
    for (const next of adjacency.get(id) ?? []) {
      if (seen.has(next)) continue;
      seen.add(next);
      queue.push(next);
    }
  }
  return seen;
}

/**
 * The term concordance.
 *
 * @param {{nodes: object[]}} graph - a graph as `readGraph` returns it, or
 *   anything carrying a `nodes` array of the same shape.
 * @returns {{terms: Array<{term: string, defines: string,
 *   users: Array<{node: string, reachable: boolean}>}>}}
 */
export function concordance(graph) {
  const nodes = Array.isArray(graph) ? graph : (graph?.nodes ?? []);
  const ids = new Set(nodes.map((n) => n.id));
  const adjacency = new Map(
    nodes.map((n) => [n.id, outgoingIds(n).filter((id) => ids.has(id))]),
  );
  const texts = new Map(nodes.map((n) => [n.id, nodeText(n)]));
  const reach = new Map();
  const reachable = (fromId, toId) => {
    if (!reach.has(fromId)) reach.set(fromId, reachableFrom(fromId, adjacency));
    return reach.get(fromId).has(toId);
  };

  const terms = [];
  for (const definer of nodes) {
    for (const term of defineTerms(definer)) {
      const users = [];
      for (const user of nodes) {
        if (user.id === definer.id) continue;
        if (!usesTerm(texts.get(user.id) ?? '', term)) continue;
        users.push({ node: user.id, reachable: reachable(user.id, definer.id) });
      }
      terms.push({ term, defines: definer.id, users });
    }
  }
  terms.sort((a, b) => (a.term < b.term ? -1 : a.term > b.term ? 1 : a.defines < b.defines ? -1 : a.defines > b.defines ? 1 : 0));
  return { terms };
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isMain) {
  const args = process.argv.slice(2);
  let out = null;
  const positional = [];
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--out') {
      out = args[i + 1];
      i += 1;
      if (out === undefined) {
        console.error('--out needs a file');
        process.exitCode = 2;
      }
    } else {
      positional.push(args[i]);
    }
  }
  const rootDir = path.resolve(positional[0] ?? process.cwd());
  try {
    const graph = await readGraph(rootDir);
    const text = `${JSON.stringify(concordance(graph), null, 2)}\n`;
    if (out) await writeFile(path.resolve(out), text);
    else process.stdout.write(text);
  } catch (err) {
    console.error(err.message);
    process.exitCode = 1;
  }
}
