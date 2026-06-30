// Regenerate PWA icon PNGs from the source SVGs in audio/public/icons.
// Not part of `npm run build` — run manually (`npm run icons --prefix audio`)
// when the source art changes; the committed PNGs are what deploy ships.
import sharp from "sharp";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const iconsDir = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "icons");

async function render(svgName, size, outName) {
  const svg = await readFile(join(iconsDir, svgName));
  await sharp(svg, { density: 384 }).resize(size, size).png().toFile(join(iconsDir, outName));
  console.log(`wrote icons/${outName} (${size}x${size})`);
}

await Promise.all([
  render("icon.svg", 192, "icon-192.png"),
  render("icon.svg", 512, "icon-512.png"),
  render("icon.svg", 180, "apple-touch-icon-180.png"),
  render("icon-maskable.svg", 512, "icon-maskable-512.png"),
]);
