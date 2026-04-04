/**
 * One-time script to generate responsive image variants from originals.
 * Output goes to fellspiral/public/ alongside the full-size images.
 *
 * Usage: npx tsx fellspiral/scripts/generate-responsive-images.ts
 */
import sharp from "sharp";
import path from "node:path";
import { BLOG_IMAGES } from "../../blog/src/image-config.ts";

const ORIGINALS_DIR = path.resolve("fellspiral/originals");
const PUBLIC_DIR = path.resolve("fellspiral/public");

for (const img of BLOG_IMAGES) {
  const inputPath = path.join(ORIGINALS_DIR, img.original);
  for (const width of img.responsiveWidths) {
    const outputPath = path.join(PUBLIC_DIR, `${img.baseName}-${width}w.webp`);
    try {
      await sharp(inputPath)
        .resize(width)
        .webp({ quality: 80 })
        .toFile(outputPath);
    } catch (err) {
      throw new Error(`Failed to generate ${img.baseName}-${width}w.webp from ${img.original}`, { cause: err });
    }
    const stats = await sharp(outputPath).metadata();
    console.log(`${img.baseName}-${width}w.webp: ${width}x${stats.height}`);
  }
}
