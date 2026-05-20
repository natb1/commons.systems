import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { glob } from "node:fs/promises";
import Critters from "critters";

/**
 * Inline critical CSS into all HTML files under `distDir` using Critters.
 * Defers full stylesheets via media="print" with onload swap.
 * Fixes noscript fallback to use a plain blocking link.
 * Returns the number of HTML files processed.
 */
export async function inlineCriticalCss(distDir: string): Promise<number> {
  const critters = new Critters({
    path: distDir,
    preload: "media",
    inlineFonts: true,
  });

  const htmlFiles: string[] = [];
  for await (const entry of glob("**/*.html", { cwd: distDir })) {
    htmlFiles.push(join(distDir, entry));
  }

  if (htmlFiles.length === 0) {
    throw new Error(`No HTML files found in ${distDir}`);
  }

  for (const file of htmlFiles) {
    const html = await readFile(file, "utf-8");
    let inlined: string;
    try {
      inlined = await critters.process(html);
    } catch (err) {
      throw new Error(`Failed to process critical CSS for ${file}`, {
        cause: err,
      });
    }
    // Critters copies the deferred link (media="print" onload=...) into <noscript>,
    // but no-JS users need a plain blocking <link> to get any styles at all.
    inlined = inlined.replace(
      /<noscript><link ([^>]*)media="print"([^>]*)onload="[^"]*"([^>]*)><\/noscript>/g,
      "<noscript><link $1$2$3></noscript>",
    );
    await writeFile(file, inlined);
  }

  console.log(`Critical CSS inlined into ${htmlFiles.length} HTML file(s)`);
  return htmlFiles.length;
}
