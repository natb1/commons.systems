import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { buildPageData } from "../src/build-payload.js";

/**
 * Emit the baked snapshot as JSON.
 *
 * Run under `tsx` by `scripts/build.mjs`. Split out from the assembler so the
 * build has two clean halves — derive the data in TypeScript against the real
 * store, then assemble a file out of it — and so the payload can be inspected
 * or diffed on its own without rebuilding the page.
 *
 * Usage: emit-payload.ts <repoRoot> <outFile>
 */
const [repoRoot, outFile] = process.argv.slice(2);
if (repoRoot === undefined || outFile === undefined) {
  console.error("usage: emit-payload.ts <repoRoot> <outFile>");
  process.exit(2);
}

const data = buildPageData({
  repoDir: resolve(repoRoot),
  intentionsDir: resolve(repoRoot, "intentions"),
});

mkdirSync(dirname(resolve(outFile)), { recursive: true });
writeFileSync(resolve(outFile), JSON.stringify(data));

const { counts, provenance, velocity } = data.payload;
console.error(
  `payload: ${counts.openTactics} open tactics ` +
    `(${counts.selectable} scheduled, ${counts.parked} parked, ${counts.blocked} blocked) ` +
    `@ ${provenance.shaShort}${provenance.clean ? "" : " DIRTY"} ` +
    `· velocity ${velocity.perDay.toFixed(2)}/day`,
);
