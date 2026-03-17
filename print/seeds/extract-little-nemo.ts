/**
 * Extracts the first N image pages from a Little Nemo CBZ and writes them
 * as base64-encoded JSON for use by the storage seed. Run once to generate:
 *
 *   npx tsx print/seeds/extract-little-nemo.ts ~/Downloads/little-nemo-all-421.cbz print/seeds/little-nemo-pages.json 5
 *
 * Arguments:
 *   1. Path to source CBZ file
 *   2. Output JSON path
 *   3. Number of pages to extract (default: 5)
 */

import { readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, readdirSync } from "node:fs";
import { join, extname } from "node:path";
import { tmpdir } from "node:os";

const IMAGE_EXT = new Set([".jpg", ".jpeg", ".png", ".gif", ".webp"]);

const [cbzPath, outPath, countArg] = process.argv.slice(2);
if (!cbzPath || !outPath) {
  console.error("Usage: extract-little-nemo.ts <cbz-path> <output-json> [count]");
  process.exit(1);
}

const count = parseInt(countArg ?? "5", 10);

const tmp = mkdtempSync(join(tmpdir(), "cbz-extract-"));
try {
  execFileSync("unzip", ["-o", "-q", cbzPath, "-d", tmp]);

  // Collect all image files recursively, sorted numerically
  function collectImages(dir: string): string[] {
    const results: string[] = [];
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.name === "__MACOSX" || entry.name.startsWith("._")) continue;
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        results.push(...collectImages(fullPath));
      } else if (IMAGE_EXT.has(extname(entry.name).toLowerCase())) {
        results.push(fullPath);
      }
    }
    return results;
  }

  const images = collectImages(tmp).sort((a, b) =>
    a.localeCompare(b, undefined, { numeric: true }),
  );

  if (images.length === 0) throw new Error("No images found in archive");

  const pages = images.slice(0, count).map((filePath) => {
    const data = readFileSync(filePath);
    const ext = extname(filePath).toLowerCase();
    const mime = ext === ".png" ? "image/png"
      : ext === ".gif" ? "image/gif"
      : ext === ".webp" ? "image/webp"
      : "image/jpeg";
    return { mime, base64: data.toString("base64") };
  });

  writeFileSync(outPath, JSON.stringify(pages, null, 2));
  console.log(`Extracted ${pages.length} pages to ${outPath}`);
  for (let i = 0; i < pages.length; i++) {
    const kb = Math.round(Buffer.from(pages[i].base64, "base64").length / 1024);
    console.log(`  Page ${i + 1}: ${pages[i].mime}, ${kb} KB`);
  }
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
