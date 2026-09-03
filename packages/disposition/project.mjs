#!/usr/bin/env node
// Project a disposition graph into one self-contained HTML page.
//
// Usage:
//   node packages/disposition/project.mjs [rootDir] [--input nodes.json] [--out browser/index.html]
//
// Without --input the graph is read with readGraph(rootDir) from ./read.mjs.
// The graph is inlined verbatim into packages/disposition/browser-template.html; every
// projection decision lives in that template, so this script only reads,
// checks, and writes.

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const MARKER = "<!--DG:GRAPH-->";

function parseArgs(argv) {
  const opts = { rootDir: null, input: null, out: "browser/index.html" };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--input" || a === "--out") {
      const v = argv[++i];
      if (v === undefined) throw new Error(`${a} needs a value`);
      if (a === "--input") opts.input = v;
      else opts.out = v;
    } else if (a.startsWith("--")) {
      throw new Error(`unknown flag ${a}`);
    } else if (opts.rootDir === null) {
      opts.rootDir = a;
    } else {
      throw new Error(`unexpected argument ${a}`);
    }
  }
  if (opts.rootDir === null) opts.rootDir = ".";
  return opts;
}

async function loadGraph(opts) {
  if (opts.input) return JSON.parse(await readFile(resolve(opts.input), "utf8"));
  const { readGraph } = await import("./read.mjs");
  return await readGraph(resolve(opts.rootDir));
}

// Fatal on anything the page cannot render around; a warning on a field the
// page reads but the reader did not supply, so a contract drift is visible.
function check(graph) {
  const warn = [];
  if (!graph || typeof graph !== "object") throw new Error("graph is not an object");
  if (!Array.isArray(graph.nodes)) throw new Error("graph.nodes is not an array");
  if (!graph.graphs || typeof graph.graphs !== "object") throw new Error("graph.graphs is not an object");
  if (graph.nodes.length === 0) throw new Error("graph.nodes is empty; nothing to project");

  const seen = new Set();
  const defines = new Map();
  for (const n of graph.nodes) {
    if (!n || typeof n.id !== "string" || !n.id) throw new Error("a node has no id");
    if (seen.has(n.id)) throw new Error(`duplicate node id ${n.id}`);
    seen.add(n.id);
    if (typeof n.question !== "string" || !n.question) warn.push(`${n.id}: no question`);
    if (!(n.graph in graph.graphs)) warn.push(`${n.id}: graph "${n.graph}" is not in graphs`);
    if (typeof n.rank !== "number" || !(n.rank > 0) || n.rank > 1) warn.push(`${n.id}: rank ${n.rank} is not in (0,1]`);
    if (!n.status) warn.push(`${n.id}: no status`);
    if (!Array.isArray(n.children)) warn.push(`${n.id}: children is not an array`);
    if (!Array.isArray(n.under)) warn.push(`${n.id}: under is not an array`);
    for (const t of n.defines || []) {
      const key = String(t).toLowerCase();
      if (defines.has(key)) warn.push(`term "${t}" defined by both ${defines.get(key)} and ${n.id}`);
      else defines.set(key, n.id);
    }
  }
  for (const n of graph.nodes) {
    for (const id of n.under || []) if (!seen.has(id)) warn.push(`${n.id}: under names unknown ${id}`);
    for (const id of n.children || []) if (!seen.has(id)) warn.push(`${n.id}: children names unknown ${id}`);
    for (const c of n.cites || []) if (!seen.has(c && c.id)) warn.push(`${n.id}: cites unknown ${c && c.id}`);
    if (n.ceiling && !seen.has(n.ceiling)) warn.push(`${n.id}: ceiling names unknown ${n.ceiling}`);
  }
  return warn;
}

export function build(template, graph) {
  if (!template.includes(MARKER)) throw new Error(`template has no ${MARKER} marker`);
  // "<" only ever occurs inside a JSON string, so escaping it keeps the
  // payload valid JSON and keeps "</script" out of the document.
  const json = JSON.stringify(graph).replace(/</g, "\\u003c");
  const block = `<script type="application/json" id="graph">${json}</script>`;
  return template.replace(MARKER, () => block);
}

export async function project(opts) {
  const graph = await loadGraph(opts);
  const warnings = check(graph);
  const template = await readFile(resolve(HERE, "browser-template.html"), "utf8");
  const html = build(template, graph);
  const out = resolve(opts.out);
  await mkdir(dirname(out), { recursive: true });
  await writeFile(out, html);
  return { out, html, graph, warnings };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  const opts = parseArgs(process.argv.slice(2));
  const { out, html, graph, warnings } = await project(opts);
  for (const w of warnings) process.stderr.write(`contract: ${w}\n`);
  process.stdout.write(
    `${graph.nodes.length} nodes, ${Object.keys(graph.graphs).length} graphs -> ${out} (${Buffer.byteLength(html)} bytes)\n`
  );
}
