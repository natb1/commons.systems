/**
 * One-time script to generate responsive image variants from originals.
 * Output goes to fellspiral/public/ alongside the full-size images.
 *
 * Usage: npx tsx fellspiral/scripts/generate-responsive-images.ts
 */
import sharp from "sharp";
import path from "node:path";

const ORIGINALS_DIR = path.resolve("fellspiral/originals");
const PUBLIC_DIR = path.resolve("fellspiral/public");

interface ImageSpec {
  original: string;
  baseName: string;
  widths: number[];
}

const IMAGES: ImageSpec[] = [
  { original: "blog-map-color.jpg", baseName: "blog-map-color", widths: [400, 800] },
  { original: "woman-with-a-flower-head.webp", baseName: "woman-with-a-flower-head", widths: [400, 800] },
  { original: "alienurn.jpg", baseName: "alienurn", widths: [400, 800] },
  { original: "tile10-armadillo-crag.png", baseName: "tile10-armadillo-crag", widths: [400] },
];

for (const img of IMAGES) {
  const inputPath = path.join(ORIGINALS_DIR, img.original);
  for (const width of img.widths) {
    const outputPath = path.join(PUBLIC_DIR, `${img.baseName}-${width}w.webp`);
    await sharp(inputPath)
      .resize(width)
      .webp({ quality: 80 })
      .toFile(outputPath);
    const stats = await sharp(outputPath).metadata();
    console.log(`${img.baseName}-${width}w.webp: ${width}x${stats.height}`);
  }
}
