/**
 * Extracts chapter body HTML from a real EPUB file and writes it to a JSON file
 * for use by the storage seed. Run once to generate the fixture:
 *
 *   npx tsx print/seeds/extract-epub-chapters.ts ~/Downloads/pg3296-images-3.epub print/seeds/confessions-chapters.json 3
 *
 * Arguments:
 *   1. Path to source EPUB file
 *   2. Output JSON path
 *   3. Number of spine items to extract (default: 3)
 */

import { readFileSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";
import { mkdtempSync, rmSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const [epubPath, outPath, countArg] = process.argv.slice(2);
if (!epubPath || !outPath) {
  console.error("Usage: extract-epub-chapters.ts <epub-path> <output-json> [count]");
  process.exit(1);
}

const count = parseInt(countArg ?? "3", 10);

// Extract EPUB (it's a ZIP) to a temp directory
const tmp = mkdtempSync(join(tmpdir(), "epub-extract-"));
try {
  execSync(`unzip -o -q "${epubPath}" -d "${tmp}"`);

  // Parse container.xml to find the OPF path
  const containerXml = readFileSync(join(tmp, "META-INF/container.xml"), "utf-8");
  const opfMatch = containerXml.match(/full-path="([^"]+)"/);
  if (!opfMatch) throw new Error("Could not find OPF path in container.xml");
  const opfPath = join(tmp, opfMatch[1]);
  const opfDir = opfPath.replace(/\/[^/]+$/, "");

  // Parse OPF to get spine item hrefs
  const opfXml = readFileSync(opfPath, "utf-8");

  // Get spine idrefs in order
  const spineRefs: string[] = [];
  const spineRegex = /<itemref\s+idref="([^"]+)"/g;
  let spineMatch;
  while ((spineMatch = spineRegex.exec(opfXml)) !== null) {
    spineRefs.push(spineMatch[1]);
  }

  // Map manifest ids to hrefs (attributes can appear in any order)
  const manifestMap = new Map<string, string>();
  const itemRegex = /<item\s+[^>]*?(?=id=)[^>]*/g;
  let itemMatch;
  while ((itemMatch = itemRegex.exec(opfXml)) !== null) {
    const tag = itemMatch[0];
    const idMatch = tag.match(/id="([^"]+)"/);
    const hrefMatch = tag.match(/href="([^"]+)"/);
    if (idMatch && hrefMatch) {
      manifestMap.set(idMatch[1], hrefMatch[1]);
    }
  }

  // Extract body content from each spine item, skipping very small ones (covers, wrappers)
  const MIN_CHAPTER_SIZE = 1000;
  const chapters: string[] = [];
  for (let i = 0; i < spineRefs.length && chapters.length < count; i++) {
    const href = manifestMap.get(spineRefs[i]);
    if (!href) throw new Error(`No manifest entry for spine ref: ${spineRefs[i]}`);

    const filePath = join(opfDir, href);
    const xhtml = readFileSync(filePath, "utf-8");

    // Extract content between <body...> and </body>
    const bodyMatch = xhtml.match(/<body[^>]*>([\s\S]*)<\/body>/i);
    if (!bodyMatch) throw new Error(`No <body> found in ${href}`);

    const body = bodyMatch[1].trim();
    if (body.length < MIN_CHAPTER_SIZE) continue;
    chapters.push(body);
  }

  writeFileSync(outPath, JSON.stringify(chapters, null, 2));
  console.log(`Extracted ${chapters.length} chapters to ${outPath}`);
  for (let i = 0; i < chapters.length; i++) {
    console.log(`  Chapter ${i + 1}: ${chapters[i].length} bytes`);
  }
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
