#!/usr/bin/env node
// packages/disposition/read.mjs
//
// Parses and validates one disposition graph (a `disposition.yaml` manifest
// plus one markdown file per node) into a plain object tree.
//
// `yaml` resolves from this repo's ancestor node_modules (there is none
// inside this worktree) -- bootstrap shim, see LEDGER.md L04/L14.
import YAML from 'yaml';

import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  blobSha1,
  canonicalizeId,
  deriveCeiling,
  deriveChildren,
  deriveRank,
  deriveStatus,
} from './derive.mjs';

const FRONTMATTER_KEYS = new Set([
  'question', 'form', 'authority', 'under', 'tier', 'boost', 'cites',
  'instrument', 'after', 'source', 'relation', 'defines', 'ledger',
]);
const FORMS = new Set(['target', 'rule', 'assumption', 'arche', 'reading']);
const AUTHORITY_CLASSES = new Set(['ratified', 'delegated', 'deferred']);
const RELATIONS = new Set(['adopted', 'diverged', 'chosen-over']);
const INSTRUMENT_KINDS = new Set(['check', 'assessment']);
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const LEDGER_RE = /^L\d{2}$/;
const HASH_RE = /^[0-9a-f]{40}$/;
const SECTION_ORDER = ['Answer', 'Rationale', 'Proposal'];

function isPlainObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isAbsent(value) {
  return value === undefined || value === null;
}

function isValidDate(s) {
  if (!DATE_RE.test(s)) return false;
  const [y, m, d] = s.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

/**
 * Split a body into its `## Answer` / `## Rationale` / `## Proposal`
 * sections. `###`+ headings are content, not section boundaries. Pushes one
 * message per problem (without file-path prefix) onto `problems`.
 *
 * @param {string} bodyText
 * @param {string[]} problems
 * @returns {{Answer: string|null, Rationale: string|null, Proposal: string|null}}
 */
function parseBody(bodyText, problems) {
  const lines = bodyText.split('\n');
  const headingRe = /^(#{1,6})[ \t]+(.*?)\s*$/;
  const fenceRe = /^[ \t]*(`{3,}|~{3,})/;
  const boundaries = [];
  // A '##' line inside a fenced code block is content, not a boundary: a node
  // that shows this very file format in an example must not be re-sliced by it.
  let fenceChar = null;
  lines.forEach((line, index) => {
    const fence = line.match(fenceRe);
    if (fence) {
      if (fenceChar === null) fenceChar = fence[1][0];
      else if (fence[1][0] === fenceChar) fenceChar = null;
      return;
    }
    if (fenceChar !== null) return;
    const m = line.match(headingRe);
    if (m && m[1].length === 2) {
      boundaries.push({ name: m[2], index });
    }
  });

  const firstIndex = boundaries.length > 0 ? boundaries[0].index : lines.length;
  const prefix = lines.slice(0, firstIndex).join('\n');
  if (prefix.trim().length > 0) {
    const snippet = JSON.stringify(prefix.trim().slice(0, 60));
    problems.push(`body has text before the first '##' heading: ${snippet}`);
  }

  const sections = { Answer: null, Rationale: null, Proposal: null };
  let lastOrder = -1;
  boundaries.forEach((boundary, idx) => {
    const end = idx + 1 < boundaries.length ? boundaries[idx + 1].index : lines.length;
    const raw = lines.slice(boundary.index + 1, end).join('\n').trim();

    if (!SECTION_ORDER.includes(boundary.name)) {
      problems.push(`unexpected '## ${boundary.name}' heading (only Answer, Rationale, Proposal are allowed)`);
      return;
    }
    if (sections[boundary.name] !== null) {
      problems.push(`duplicate '## ${boundary.name}' heading`);
      return;
    }
    const order = SECTION_ORDER.indexOf(boundary.name);
    if (order < lastOrder) {
      problems.push(`'## ${boundary.name}' heading is out of order (must follow Answer, Rationale, Proposal order)`);
    }
    lastOrder = Math.max(lastOrder, order);
    sections[boundary.name] = raw;
  });

  return sections;
}

function readIdList(fm, key, problems) {
  if (isAbsent(fm[key])) return [];
  const list = fm[key];
  if (!Array.isArray(list) || list.some((x) => typeof x !== 'string' || x.length === 0)) {
    problems.push(`'${key}' must be a list of full id strings`);
    return [];
  }
  return list;
}

function fail(relPath, problemList) {
  return new Error(problemList.map((p) => `${relPath}: ${p}`).join('\n'));
}

/**
 * Parse and validate a single node file's text (frontmatter + body).
 * Does not resolve `under`/`after`/`cites[].id` against a manifest or
 * against sibling nodes, and does not compute `children`/`rank`/`ceiling`/
 * `status`/`hash` -- those need the whole graph and the raw file bytes, and
 * are added by `readGraph`.
 *
 * @param {string} text - the file's decoded text.
 * @param {{id: string, graph: string, slug: string, path: string}} loc
 * @returns {object} a partial node (all deliverable-1 fields except
 *   `children`, `rank`, `ceiling`, `status`, `hash`).
 * @throws {Error} listing every problem found in this file, one per line,
 *   each prefixed with `loc.path`.
 */
export function parseNode(text, { id, graph, slug, path: relPath }) {
  const problems = [];

  const normalized = text.replace(/\r\n/g, '\n');
  const lines = normalized.split('\n');
  if (lines[0].trim() !== '---') {
    throw fail(relPath, ["file must begin with a '---' frontmatter delimiter"]);
  }
  let end = -1;
  for (let i = 1; i < lines.length; i += 1) {
    if (lines[i].trim() === '---') {
      end = i;
      break;
    }
  }
  if (end === -1) {
    throw fail(relPath, ["frontmatter is opened with '---' but never closed"]);
  }
  const fmText = lines.slice(1, end).join('\n');
  const bodyText = lines.slice(end + 1).join('\n');

  let fm;
  try {
    fm = YAML.parse(fmText);
  } catch (err) {
    throw fail(relPath, [`invalid YAML frontmatter: ${err.message}`]);
  }
  if (isAbsent(fm)) fm = {};
  if (!isPlainObject(fm)) {
    throw fail(relPath, ['frontmatter must be a YAML mapping']);
  }

  for (const key of Object.keys(fm)) {
    if (!FRONTMATTER_KEYS.has(key)) {
      problems.push(`unknown frontmatter key '${key}'`);
    }
  }

  // question
  let question = null;
  if (typeof fm.question !== 'string' || fm.question.trim().length === 0) {
    problems.push("'question' is required and must be a non-empty string");
  } else {
    question = fm.question;
  }

  // form
  let form = null;
  if (!isAbsent(fm.form)) {
    if (typeof fm.form !== 'string' || !FORMS.has(fm.form)) {
      problems.push(`'form' must be one of: ${[...FORMS].join(', ')}`);
    } else {
      form = fm.form;
    }
  }

  // authority
  let authority = null;
  if (!isAbsent(fm.authority)) {
    if (!isPlainObject(fm.authority)) {
      problems.push("'authority' must be a mapping with class, by, date");
    } else {
      const a = fm.authority;
      for (const k of Object.keys(a)) {
        if (!['class', 'by', 'date'].includes(k)) problems.push(`unknown key 'authority.${k}'`);
      }
      let ok = true;
      if (typeof a.class !== 'string' || !AUTHORITY_CLASSES.has(a.class)) {
        problems.push(`'authority.class' must be one of: ${[...AUTHORITY_CLASSES].join(', ')}`);
        ok = false;
      }
      if (typeof a.by !== 'string' || a.by.trim().length === 0) {
        problems.push("'authority.by' is required and must be a non-empty string");
        ok = false;
      }
      if (typeof a.date !== 'string' || !isValidDate(a.date)) {
        problems.push("'authority.date' must be a YYYY-MM-DD date string");
        ok = false;
      }
      if (ok) authority = { class: a.class, by: a.by, date: a.date };
    }
  }

  // under / after
  const under = readIdList(fm, 'under', problems);
  const after = readIdList(fm, 'after', problems);

  // tier
  let tier = null;
  if (!isAbsent(fm.tier)) {
    if (fm.tier !== 'global') {
      problems.push("'tier' may only be 'global'");
    } else {
      tier = 'global';
    }
  }

  // boost
  let boost = null;
  if (!isAbsent(fm.boost)) {
    if (typeof fm.boost !== 'number' || !(fm.boost > 0)) {
      problems.push("'boost' must be a positive number");
    } else {
      boost = fm.boost;
    }
  }

  // cites
  let cites = [];
  if (!isAbsent(fm.cites)) {
    if (!Array.isArray(fm.cites)) {
      problems.push("'cites' must be a list of {id, hash}");
    } else {
      cites = fm.cites
        .map((entry, i) => {
          if (!isPlainObject(entry)) {
            problems.push(`'cites[${i}]' must be a mapping with id and hash`);
            return null;
          }
          for (const k of Object.keys(entry)) {
            if (!['id', 'hash'].includes(k)) problems.push(`unknown key 'cites[${i}].${k}'`);
          }
          let entryOk = true;
          if (typeof entry.id !== 'string' || entry.id.length === 0) {
            problems.push(`'cites[${i}].id' is required and must be a non-empty string`);
            entryOk = false;
          }
          if (typeof entry.hash !== 'string' || !HASH_RE.test(entry.hash)) {
            problems.push(`'cites[${i}].hash' must be a 40-character hex git blob sha`);
            entryOk = false;
          }
          return entryOk ? { id: entry.id, hash: entry.hash } : null;
        })
        .filter((x) => x !== null);
    }
  }

  // instrument
  let instrument = null;
  if (!isAbsent(fm.instrument)) {
    if (!isPlainObject(fm.instrument)) {
      problems.push("'instrument' must be a mapping with kind, ref, and optional note");
    } else {
      const inst = fm.instrument;
      for (const k of Object.keys(inst)) {
        if (!['kind', 'ref', 'note'].includes(k)) problems.push(`unknown key 'instrument.${k}'`);
      }
      let ok = true;
      if (typeof inst.kind !== 'string' || !INSTRUMENT_KINDS.has(inst.kind)) {
        problems.push(`'instrument.kind' must be one of: ${[...INSTRUMENT_KINDS].join(', ')}`);
        ok = false;
      }
      if (typeof inst.ref !== 'string' || inst.ref.trim().length === 0) {
        problems.push("'instrument.ref' is required and must be a non-empty string");
        ok = false;
      }
      if (!isAbsent(inst.note) && typeof inst.note !== 'string') {
        problems.push("'instrument.note' must be a string");
        ok = false;
      }
      if (ok) instrument = { kind: inst.kind, ref: inst.ref, note: isAbsent(inst.note) ? null : inst.note };
    }
  }

  // source / relation: required together under form:reading, forbidden otherwise
  let source = null;
  let relation = null;
  const hasSource = !isAbsent(fm.source);
  const hasRelation = !isAbsent(fm.relation);
  if (form === 'reading') {
    if (!hasSource || typeof fm.source !== 'string' || fm.source.trim().length === 0) {
      problems.push("'source' is required and must be a non-empty string when form: reading");
    } else {
      source = fm.source;
    }
    if (!hasRelation || typeof fm.relation !== 'string' || !RELATIONS.has(fm.relation)) {
      problems.push(`'relation' is required and must be one of: ${[...RELATIONS].join(', ')} when form: reading`);
    } else {
      relation = fm.relation;
    }
  } else {
    if (hasSource) problems.push("'source' is only allowed when form: reading");
    if (hasRelation) problems.push("'relation' is only allowed when form: reading");
  }

  // defines
  let defines = null;
  if (!isAbsent(fm.defines)) {
    if (!Array.isArray(fm.defines) || fm.defines.some((d) => typeof d !== 'string')) {
      problems.push("'defines' must be a list of strings");
    } else {
      defines = fm.defines;
    }
  }

  // ledger
  let ledger = null;
  if (!isAbsent(fm.ledger)) {
    if (typeof fm.ledger !== 'string' || !LEDGER_RE.test(fm.ledger)) {
      problems.push("'ledger' must match L\\d{2}");
    } else {
      ledger = fm.ledger;
    }
  }

  // body
  const sections = parseBody(bodyText, problems);
  const hasAnswer = sections.Answer !== null;

  if (hasAnswer && form === null) {
    problems.push("'form' is required when the body has an '## Answer' section");
  }
  if (authority !== null && !hasAnswer) {
    problems.push("'authority' requires an '## Answer' section");
  }
  if (boost !== null && !(authority !== null && authority.class === 'ratified')) {
    problems.push("'boost' is only allowed when authority.class is 'ratified'");
  }

  if (problems.length > 0) {
    throw fail(relPath, problems);
  }

  return {
    id,
    graph,
    slug,
    path: relPath,
    hash: null, // set by readGraph from the file's raw bytes
    question,
    form,
    authority,
    under,
    tier,
    boost,
    cites,
    instrument,
    after,
    source,
    relation,
    defines,
    ledger,
    answer: sections.Answer,
    rationale: sections.Rationale,
    proposal: sections.Proposal,
  };
}

async function pathIsDirectory(p) {
  try {
    const st = await stat(p);
    return st.isDirectory();
  } catch {
    return false;
  }
}

async function walkMarkdownFiles(dir) {
  const out = [];
  async function walk(current, relParts) {
    const entries = await readdir(current, { withFileTypes: true });
    entries.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
    for (const entry of entries) {
      if (entry.isDirectory()) {
        await walk(path.join(current, entry.name), [...relParts, entry.name]);
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        out.push({
          absPath: path.join(current, entry.name),
          relSlashPath: [...relParts, entry.name].join('/'),
        });
      }
    }
  }
  await walk(dir, []);
  return out;
}

/**
 * Read and validate the whole disposition graph rooted at `rootDir`:
 * `disposition.yaml` plus every `<graph>/**\/*.md` node file it declares.
 *
 * @param {string} rootDir
 * @returns {Promise<{module: string, ref: string|null, graphs: object, nodes: object[]}>}
 * @throws {Error} whose message lists every validation problem found (one
 *   per line, each prefixed by the file's path relative to `rootDir`), not
 *   just the first.
 */
export async function readGraph(rootDir) {
  const manifestPath = path.join(rootDir, 'disposition.yaml');
  let manifestText;
  try {
    manifestText = await readFile(manifestPath, 'utf8');
  } catch (err) {
    throw new Error(`${path.relative(rootDir, manifestPath)}: cannot read manifest: ${err.message}`);
  }
  let manifest;
  try {
    manifest = YAML.parse(manifestText);
  } catch (err) {
    throw new Error(`disposition.yaml: invalid YAML: ${err.message}`);
  }
  if (!isPlainObject(manifest)) {
    throw new Error('disposition.yaml: must be a YAML mapping');
  }
  if (typeof manifest.module !== 'string' || manifest.module.length === 0) {
    throw new Error("disposition.yaml: 'module' is required and must be a non-empty string");
  }
  if (!isPlainObject(manifest.graphs)) {
    throw new Error("disposition.yaml: 'graphs' is required and must be a mapping");
  }

  const problems = [];

  // discover files declared by the manifest's graphs
  const fileEntries = [];
  for (const graphName of Object.keys(manifest.graphs)) {
    const graphDir = path.join(rootDir, graphName);
    if (!(await pathIsDirectory(graphDir))) continue; // not yet populated -- not an error
    const files = await walkMarkdownFiles(graphDir);
    for (const f of files) {
      fileEntries.push({
        graph: graphName,
        slug: f.relSlashPath.replace(/\.md$/, ''),
        absPath: f.absPath,
        relPath: path.relative(rootDir, f.absPath),
      });
    }
  }

  // parse each file, collecting every problem rather than stopping at the first
  const parsed = [];
  for (const entry of fileEntries) {
    const id = `${manifest.module}/${entry.graph}/${entry.slug}`;
    let bytes;
    try {
      bytes = await readFile(entry.absPath);
    } catch (err) {
      problems.push(`${entry.relPath}: cannot read file: ${err.message}`);
      continue;
    }
    try {
      const node = parseNode(bytes.toString('utf8'), {
        id,
        graph: entry.graph,
        slug: entry.slug,
        path: entry.relPath,
      });
      node.hash = blobSha1(bytes);
      parsed.push(node);
    } catch (err) {
      problems.push(err.message);
    }
  }

  // canonicalize reference fields to local form now that we have the manifest
  for (const node of parsed) {
    node.under = node.under.map((refId) => canonicalizeId(refId, manifest));
    node.after = node.after.map((refId) => canonicalizeId(refId, manifest));
    node.cites = node.cites.map((c) => ({ ...c, id: canonicalizeId(c.id, manifest) }));
  }

  // referential integrity: every 'under' entry must resolve within this
  // graph and must not repeat the same parent twice (a repeated id would
  // double that parent's rank contribution and duplicate the child in
  // `children`); every 'after' entry must also resolve within this graph.
  const idSet = new Set(parsed.map((n) => n.id));
  for (const node of parsed) {
    const seenUnder = new Set();
    for (const u of node.under) {
      if (!idSet.has(u)) {
        problems.push(`${node.path}: unresolved 'under' reference: ${u}`);
      }
      if (seenUnder.has(u)) {
        problems.push(`${node.path}: duplicate under reference: ${u}`);
      }
      seenUnder.add(u);
    }
    for (const a of node.after) {
      if (!idSet.has(a)) {
        problems.push(`${node.path}: unresolved after reference: ${a}`);
      }
    }
  }

  if (problems.length > 0) {
    throw new Error(problems.join('\n'));
  }

  // structural derivation: only reached once every file and every reference
  // is individually valid, so a thrown error here can only be a cycle.
  const nodesById = new Map(parsed.map((n) => [n.id, n]));
  let rankMap;
  try {
    rankMap = deriveRank(parsed);
  } catch (err) {
    const byPath = (err.cycleIds ?? []).map((id) => `${nodesById.get(id).path}: ${err.message}`);
    throw new Error((byPath.length > 0 ? byPath : [err.message]).join('\n'));
  }
  const childrenMap = deriveChildren(parsed);

  const nodes = parsed
    .map((node) => ({
      ...node,
      children: childrenMap.get(node.id) ?? [],
      rank: rankMap.get(node.id) ?? 0,
      ceiling: deriveCeiling(node.id, nodesById),
      status: deriveStatus(node),
    }))
    .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));

  return {
    module: manifest.module,
    ref: isAbsent(manifest.ref) ? null : manifest.ref,
    graphs: manifest.graphs,
    nodes,
  };
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isMain) {
  const rootDir = path.resolve(process.argv[2] ?? process.cwd());
  readGraph(rootDir)
    .then((graph) => {
      console.log(JSON.stringify(graph, null, 2));
    })
    .catch((err) => {
      console.error(err.message);
      process.exitCode = 1;
    });
}
