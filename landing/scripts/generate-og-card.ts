/**
 * Offline script to render the 1200x630 Open Graph / Twitter card from its SVG source.
 * Manual regeneration step; the PNG is checked in.
 *
 * Usage: npx tsx landing/scripts/generate-og-card.ts
 */
import sharp from "sharp";
import { readFileSync } from "node:fs";
import path from "node:path";

const INPUT = path.resolve("landing/originals/og-card.svg");
const OUTPUT = path.resolve("landing/public/og-card.png");

const svg = readFileSync(INPUT);
await sharp(svg, { density: 150 })
  .resize(1200, 630, { fit: "contain", background: "#1a1714" })
  .png({ quality: 90 })
  .toFile(OUTPUT);

const meta = await sharp(OUTPUT).metadata();
if (meta.width === undefined || meta.height === undefined) {
  throw new Error(`sharp returned no dimensions for ${OUTPUT}`);
}
if (meta.width !== 1200 || meta.height !== 630) {
  throw new Error(`Expected 1200x630, got ${meta.width}x${meta.height}`);
}
console.log(`Generated ${OUTPUT}: ${meta.width}x${meta.height}`);
