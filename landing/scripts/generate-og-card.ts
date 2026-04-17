/**
 * Offline script to render the 1200x630 Open Graph / Twitter card from its SVG source.
 * Manual regeneration step; the PNG is checked in.
 *
 * Usage: npx tsx landing/scripts/generate-og-card.ts
 */
import sharp from "sharp";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const INPUT = path.resolve(SCRIPT_DIR, "../originals/og-card.svg");
const OUTPUT = path.resolve(SCRIPT_DIR, "../public/og-card.png");

const svg = readFileSync(INPUT);
const info = await sharp(svg, { density: 150 })
  .resize(1200, 630, { fit: "contain", background: "#1a1714" })
  .png({ quality: 90 })
  .toFile(OUTPUT);

if (info.width !== 1200 || info.height !== 630) {
  throw new Error(`Expected 1200x630, got ${info.width}x${info.height}`);
}
console.log(`Generated ${OUTPUT}: ${info.width}x${info.height}`);
