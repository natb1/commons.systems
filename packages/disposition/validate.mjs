#!/usr/bin/env node
// packages/disposition/validate.mjs
//
// CLI: node packages/disposition/validate.mjs [rootDir]
//
// Validates the disposition graph rooted at rootDir (default: cwd). Exits 0
// and prints "ok: N nodes" to stdout on success; on failure prints every
// validation problem to stderr and exits 1. Thin wrapper over readGraph --
// all validation logic lives there.
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { readGraph } from './read.mjs';

/**
 * @param {string} rootDir
 * @returns {Promise<{ok: boolean, message: string}>}
 */
export async function validate(rootDir) {
  try {
    const graph = await readGraph(rootDir);
    return { ok: true, message: `ok: ${graph.nodes.length} nodes` };
  } catch (err) {
    return { ok: false, message: err.message };
  }
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isMain) {
  const rootDir = path.resolve(process.argv[2] ?? process.cwd());
  const result = await validate(rootDir);
  if (result.ok) {
    console.log(result.message);
    process.exitCode = 0;
  } else {
    console.error(result.message);
    process.exitCode = 1;
  }
}
