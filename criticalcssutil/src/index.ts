import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { glob } from "node:fs/promises";
import Critters from "critters";

/**
 * Inline critical CSS into all HTML files under `distDir` using Critters.
 * Critical CSS is inlined into <head>; the full stylesheet is moved to the
 * end of <body> as a plain blocking <link>, so deferral needs no inline event
 * handler. This keeps the output compatible with a script-src CSP that omits
 * 'unsafe-inline'.
 * Returns the number of HTML files processed.
 */
export async function inlineCriticalCss(distDir: string): Promise<number> {
  const critters = new Critters({
    path: distDir,
    preload: "body",
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
    await writeFile(file, inlined);
  }

  console.log(`Critical CSS inlined into ${htmlFiles.length} HTML file(s)`);
  return htmlFiles.length;
}
