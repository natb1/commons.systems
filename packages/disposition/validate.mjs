#!/usr/bin/env node
// packages/disposition/validate.mjs
//
// CLI: node packages/disposition/validate.mjs [rootDir] [--strict] [--tier]
//
// Validates the disposition graph rooted at rootDir (default: cwd). Exits 0
// and prints "ok: N nodes" to stdout on success, then one
// "encodings: legacy L, content C" line saying how many node files are
// written in each of the two encodings the reader accepts (`nodeEncoding`),
// followed by one `finding: <node id>: <text>` line per mechanical finding
// any node carries, and one `finding: <text>` line per finding the graph
// itself carries (an unreferenced entry of the ledger of the author's words)
// (`read.mjs`'s `deriveMechanicalFindings` -- never a parse error, so a node
// with one still validates); on a graph that does not parse, prints every
// validation problem to stderr and exits 1. `--strict` turns a run that
// carries any finding into a failure too: exit 1, findings on stderr instead
// of stdout, after the same "ok: N nodes" line. Thin wrapper over readGraph
// -- all validation and finding logic lives there.
//
// `--tier` runs the mechanical tier instead (`tier.mjs`, the
// survey-selection node's `the-mechanical-tier-gates-the-launch`): it prints
// one `tier: <check>: <node>: <detail>` line per finding, one
// `note: <detail>` line per thing reported beside the tier and gating
// nothing, and always a `checks ran: ...` line, because "a clean tier is not
// a clean frontier and is never reported as one: the reading's own report
// says which checks ran". Exit 1 on any finding, so a caller can gate a
// launch on it.
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { readGraph } from './read.mjs';
import { checkTier, tierNotes, loadFoldable, TIER_CHECKS } from './tier.mjs';

/**
 * @param {string} rootDir
 * @returns {Promise<{ok: boolean, message: string, findings: string[]}>}
 */
export async function validate(rootDir) {
  try {
    const graph = await readGraph(rootDir);
    const findings = [];
    for (const node of graph.nodes) {
      for (const text of node.findings || []) {
        findings.push(`finding: ${node.id}: ${text}`);
      }
    }
    // The graph's own findings carry no node: an unreferenced ledger entry
    // is missing from every option and belongs to none.
    for (const text of graph.findings || []) {
      findings.push(`finding: ${text}`);
    }
    const legacy = graph.nodes.filter((n) => n.encoding !== 'content').length;
    const content = graph.nodes.length - legacy;
    return {
      ok: true,
      message: `ok: ${graph.nodes.length} nodes`,
      encodings: `encodings: legacy ${legacy}, content ${content}`,
      findings,
    };
  } catch (err) {
    return { ok: false, message: err.message, encodings: null, findings: [] };
  }
}

/**
 * The mechanical tier over one graph: its findings, the notes reported
 * beside it, and the checks that ran. `ok` is false on any finding, which is
 * what gates a reader's launch.
 *
 * @param {string} rootDir
 */
export async function tier(rootDir) {
  const graph = await readGraph(rootDir);
  const foldable = await loadFoldable();
  const findings = checkTier(graph, { words: graph.words, foldable });
  return { ok: findings.length === 0, findings, notes: tierNotes(graph, { words: graph.words }), checks: TIER_CHECKS };
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isMain) {
  const args = process.argv.slice(2);
  const strict = args.includes('--strict');
  const wantsTier = args.includes('--tier');
  const positional = args.filter((a) => a !== '--strict' && a !== '--tier');
  const rootDir = path.resolve(positional[0] ?? process.cwd());
  if (wantsTier) {
    try {
      const result = await tier(rootDir);
      for (const f of result.findings) {
        console.log(`tier: ${f.check}: ${f.node ?? '(graph)'}: ${f.detail}`);
      }
      for (const n of result.notes) console.log(`note: ${n.detail}`);
      console.log(`checks ran: ${result.checks.join(', ')}`);
      console.log(`tier: ${result.findings.length} finding(s) over ${result.checks.length} checks`);
      process.exitCode = result.ok ? 0 : 1;
    } catch (err) {
      console.error(err.message);
      process.exitCode = 1;
    }
  } else {
    const result = await validate(rootDir);
    if (!result.ok) {
      console.error(result.message);
      process.exitCode = 1;
    } else if (strict && result.findings.length > 0) {
      console.error(result.message);
      console.error(result.encodings);
      for (const line of result.findings) console.error(line);
      process.exitCode = 1;
    } else {
      console.log(result.message);
      console.log(result.encodings);
      for (const line of result.findings) console.log(line);
      process.exitCode = 0;
    }
  }
}
