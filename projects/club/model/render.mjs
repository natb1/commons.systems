#!/usr/bin/env node
// Writes every derived number in the club project from model/model.mjs.
//
//   node model/render.mjs          regenerate the artifact source and the docs
//   node model/render.mjs --check  fail if anything is out of date (CI/pre-push)
//
// Three kinds of generated region, all addressed by marker so the surrounding
// prose stays hand-written:
//
//   HTML   the artifact's <script> carries the model verbatim between
//          `// model:begin` and `// model:end` — the published page's model
//          bytes are model.mjs's bytes, re-indented and with `export` stripped.
//   BLOCK  `<!-- model:begin <name> -->` … `<!-- model:end <name> -->` in a
//          markdown file, filled by the matching entry in figures.mjs BLOCKS.
//   SPAN   `<!--m:<name>-->…<!--/m-->` inline, filled from figures.mjs FIGURES.
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { BLOCKS, FIGURES } from "./figures.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "..");
const MODEL = resolve(HERE, "model.mjs");
const ARTIFACT = "claude/benchmark-explorer-src.html";
const DOCS = [
  "business-plan.md",
  "claude/benchmark-matrix.md",
  "claude/benchmark-explorer.md",
  "pilot/interim-phase-options.md",
  "pilot/phase-0.5-spec.md",
  "validation/data.md",
  "validation/precedent-research.md",
  "validation/runbook.md",
];

// The model, as it is spliced into the page: `export` stripped, indented into
// the artifact's IIFE. Nothing else is transformed — a diff between the two is
// a whitespace-and-keyword diff by construction.
function modelForPage(indent = "  ") {
  const body = readFileSync(MODEL, "utf8")
    .replace(/^\/\/ The club model[\s\S]*?\n(?=\/\/ ---- calibration)/, "") // the module-level header is about the file, not the page
    .replace(/^export /gm, "")
    .trimEnd();
  return body
    .split("\n")
    .map((l) => (l.trim() === "" ? "" : indent + l))
    .join("\n");
}

function spliceHtml(src) {
  const re = /([ \t]*)(\/\/ model:begin[^\n]*\n)[\s\S]*?([ \t]*\/\/ model:end[^\n]*)/;
  const m = src.match(re);
  if (!m) throw new Error(`${ARTIFACT}: no '// model:begin' … '// model:end' region found`);
  return src.replace(re, (_all, indent, begin, end) => `${indent}${begin}${modelForPage(indent)}\n${end}`);
}

function fillDoc(file, src) {
  let out = src.replace(
    /([ \t]*)<!-- model:begin ([a-z-]+) -->\n[\s\S]*?[ \t]*<!-- model:end \2 -->/g,
    (_all, indent, name) => {
      const block = BLOCKS[name];
      if (!block) throw new Error(`${file}: unknown generated block '${name}' — add it to figures.mjs BLOCKS`);
      return `${indent}<!-- model:begin ${name} -->\n${block()}\n${indent}<!-- model:end ${name} -->`;
    },
  );
  out = out.replace(/<!--m:([A-Za-z]+)-->.*?<!--\/m-->/gs, (_all, name) => {
    if (!(name in FIGURES)) throw new Error(`${file}: unknown figure '${name}' — add it to figures.mjs FIGURES`);
    return `<!--m:${name}-->${FIGURES[name]}<!--/m-->`;
  });
  return out;
}

const check = process.argv.includes("--check");
const stale = [];
for (const file of [ARTIFACT, ...DOCS]) {
  const path = resolve(ROOT, file);
  const src = readFileSync(path, "utf8");
  // The artifact takes the model itself as well as the figures its notes card
  // quotes; the documents take figures only.
  const next = file === ARTIFACT ? fillDoc(file, spliceHtml(src)) : fillDoc(file, src);
  if (next === src) continue;
  stale.push(file);
  if (!check) writeFileSync(path, next);
}

if (check && stale.length) {
  console.error("Out of date with model/model.mjs:\n  " + stale.join("\n  "));
  console.error("\nRun `node model/render.mjs` from projects/club and commit the result.");
  process.exit(1);
}
console.log(check ? "model: all generated regions are up to date" : stale.length ? "model: rewrote\n  " + stale.join("\n  ") : "model: already up to date");
