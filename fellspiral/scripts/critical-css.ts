/**
 * Post-build script: inline critical CSS into pre-rendered HTML files.
 * Runs after prerender so Critters can analyze the actual DOM content.
 *
 * Usage: npx tsx fellspiral/scripts/critical-css.ts
 */
import { readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { glob } from "node:fs/promises";
import Critters from "critters";

const distDir = join(dirname(new URL(import.meta.url).pathname), "..", "dist");

const critters = new Critters({
  path: distDir,
  preload: "media",
  inlineFonts: true,
});

const htmlFiles: string[] = [];
for await (const entry of glob("**/*.html", { cwd: distDir })) {
  htmlFiles.push(join(distDir, entry));
}

if (htmlFiles.length === 0) throw new Error(`No HTML files found in ${distDir}`);

for (const file of htmlFiles) {
  const html = await readFile(file, "utf-8");
  let inlined = await critters.process(html);
  // Critters copies the deferred link (media="print" onload=...) into <noscript>,
  // but no-JS users need a plain blocking <link> to get any styles at all.
  inlined = inlined.replace(
    /<noscript><link ([^>]*)media="print"([^>]*)onload="[^"]*"([^>]*)><\/noscript>/g,
    '<noscript><link $1$2$3></noscript>',
  );
  await writeFile(file, inlined);
}

console.log(`Critical CSS inlined into ${htmlFiles.length} HTML file(s)`);
