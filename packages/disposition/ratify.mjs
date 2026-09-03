#!/usr/bin/env node
// packages/disposition/ratify.mjs
//
// CLI: node packages/disposition/ratify.mjs <full-id> [--no-commit] [rootDir]
//
// THE ONLY CODE PATH IN THIS REPOSITORY THAT EVER WRITES `class: ratified`.
// It is run by the author, never by AI tooling (LEDGER.md L04): it stamps a
// node's `authority` as ratified, by the git-configured author, dated today
// (UTC).
//
// The frontmatter is edited textually -- only the `authority:` key line and
// its indented continuation lines are replaced (or a new such block is
// inserted after `form:`/`question:`), so the rest of the file is left
// byte-identical. The whole graph is re-validated afterward; on failure the
// original bytes are restored and the tool exits 1.
import { execFileSync } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import YAML from 'yaml';

import { canonicalizeId } from './derive.mjs';
import { parseNode, readGraph } from './read.mjs';

async function readManifest(rootDir) {
  const manifestPath = path.join(rootDir, 'disposition.yaml');
  const text = await readFile(manifestPath, 'utf8');
  const manifest = YAML.parse(text);
  if (!manifest || typeof manifest !== 'object' || Array.isArray(manifest)) {
    throw new Error(`${manifestPath}: must be a YAML mapping`);
  }
  return manifest;
}

function resolveNodeLocation(id, manifest) {
  const prefix = `${manifest.module}/`;
  if (!id.startsWith(prefix)) {
    throw new Error(`'${id}' is not under module '${manifest.module}'`);
  }
  const rest = id.slice(prefix.length);
  const slashIndex = rest.indexOf('/');
  if (slashIndex === -1) {
    throw new Error(`'${id}' has no <graph>/<slug> after the module prefix`);
  }
  const graph = rest.slice(0, slashIndex);
  const slug = rest.slice(slashIndex + 1);
  if (!manifest.graphs || !(graph in manifest.graphs)) {
    throw new Error(`'${id}' names graph '${graph}', which disposition.yaml does not declare`);
  }
  return { graph, slug };
}

function closingDelimiterIndex(lines) {
  if (lines[0].trim() !== '---') {
    throw new Error("file must begin with a '---' frontmatter delimiter");
  }
  for (let i = 1; i < lines.length; i += 1) {
    if (lines[i].trim() === '---') return i;
  }
  throw new Error("frontmatter is opened with '---' but never closed");
}

/** Find a top-level `key:` line and the indented continuation lines under it. */
function findKeyBlock(lines, end, keyName) {
  const re = new RegExp(`^${keyName}:`);
  for (let i = 1; i < end; i += 1) {
    if (re.test(lines[i])) {
      let j = i + 1;
      while (j < end && /^[ \t]/.test(lines[j])) j += 1;
      return { start: i, end: j };
    }
  }
  return null;
}

function findAuthorityBlock(lines, end) {
  for (let i = 1; i < end; i += 1) {
    if (/^authority:/.test(lines[i])) {
      if (!/^authority:\s*$/.test(lines[i])) {
        throw new Error(
          "existing 'authority:' is not in block-mapping style (has an inline value); ratify.mjs cannot textually edit it",
        );
      }
      let j = i + 1;
      while (j < end && /^[ \t]/.test(lines[j])) j += 1;
      return { start: i, end: j };
    }
  }
  return null;
}

/**
 * Stamp `id`'s node as ratified. Resolves the node file, requires it to
 * have an `## Answer`, requires it not already be ratified, edits its
 * `authority:` block textually, and re-validates the whole graph -- rolling
 * back the file on failure.
 *
 * @param {string} id - full id, in local or target-prefixed form.
 * @param {string} rootDir
 * @returns {Promise<{stamp: {class: 'ratified', by: string, date: string}, filePath: string, relPath: string, canonicalId: string}>}
 */
export async function ratify(id, rootDir) {
  const manifest = await readManifest(rootDir);
  const canonicalId = canonicalizeId(id, manifest);
  const { graph, slug } = resolveNodeLocation(canonicalId, manifest);
  const filePath = path.join(rootDir, graph, `${slug}.md`);
  const relPath = path.relative(rootDir, filePath);

  let originalBytes;
  try {
    originalBytes = await readFile(filePath);
  } catch (err) {
    throw new Error(`no node file for '${canonicalId}' at ${relPath}: ${err.message}`);
  }
  const originalText = originalBytes.toString('utf8');

  const current = parseNode(originalText, { id: canonicalId, graph, slug, path: relPath });
  if (current.answer === null) {
    throw new Error(`cannot ratify '${canonicalId}': it has no '## Answer' section`);
  }
  if (current.authority && current.authority.class === 'ratified') {
    throw new Error(`'${canonicalId}' is already ratified`);
  }

  const by = execFileSync('git', ['config', 'user.name'], { cwd: rootDir, encoding: 'utf8' }).trim();
  if (!by) {
    throw new Error('git config user.name is not set; ratify requires an author identity');
  }
  const date = new Date().toISOString().slice(0, 10);
  const stamp = { class: 'ratified', by, date };

  const eol = originalText.includes('\r\n') ? '\r\n' : '\n';
  const fileLines = originalText.split(eol);
  const frontmatterEnd = closingDelimiterIndex(fileLines);

  const stampYaml = YAML.stringify({ authority: stamp }).replace(/\n$/, '');
  const blockLines = stampYaml.split('\n');

  const authorityBlock = findAuthorityBlock(fileLines, frontmatterEnd);
  let spliceStart;
  let spliceDeleteCount;
  if (authorityBlock) {
    spliceStart = authorityBlock.start;
    spliceDeleteCount = authorityBlock.end - authorityBlock.start;
  } else {
    const anchor = findKeyBlock(fileLines, frontmatterEnd, 'form') ?? findKeyBlock(fileLines, frontmatterEnd, 'question');
    if (!anchor) {
      throw new Error("cannot find a 'form:' or 'question:' line to insert the authority stamp after");
    }
    spliceStart = anchor.end;
    spliceDeleteCount = 0;
  }

  const newLines = fileLines.slice();
  newLines.splice(spliceStart, spliceDeleteCount, ...blockLines);
  const newText = newLines.join(eol);

  await writeFile(filePath, newText, 'utf8');
  try {
    await readGraph(rootDir);
  } catch (err) {
    await writeFile(filePath, originalBytes);
    throw new Error(`ratifying '${canonicalId}' would leave the graph invalid, rolled back:\n${err.message}`);
  }

  return { stamp, filePath, relPath, canonicalId };
}

function parseArgv(argv) {
  const noCommit = argv.includes('--no-commit');
  const positional = argv.filter((a) => a !== '--no-commit');
  const [id, rootDirArg] = positional;
  return { id, noCommit, rootDir: path.resolve(rootDirArg ?? process.cwd()) };
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isMain) {
  const { id, noCommit, rootDir } = parseArgv(process.argv.slice(2));
  if (!id) {
    console.error('usage: node packages/disposition/ratify.mjs <full-id> [--no-commit] [rootDir]');
    process.exitCode = 1;
  } else {
    try {
      const { stamp, relPath, canonicalId } = await ratify(id, rootDir);
      if (!noCommit) {
        execFileSync('git', ['add', relPath], { cwd: rootDir, stdio: 'inherit' });
        execFileSync('git', ['commit', '-m', `ratify ${canonicalId}`], { cwd: rootDir, stdio: 'inherit' });
      }
      console.log(`ratified ${canonicalId}`);
      console.log(JSON.stringify(stamp, null, 2));
    } catch (err) {
      console.error(err.message);
      process.exitCode = 1;
    }
  }
}
