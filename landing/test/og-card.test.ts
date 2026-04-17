import { describe, it, expect } from "vitest";
import sharp from "sharp";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const TEST_DIR = dirname(fileURLToPath(import.meta.url));
const OG_CARD = resolve(TEST_DIR, "../public/og-card.png");

describe("og-card.png", () => {
  it("is exactly 1200x630 (OG / Twitter summary_large_image)", async () => {
    const meta = await sharp(OG_CARD).metadata();
    expect(meta.width).toBe(1200);
    expect(meta.height).toBe(630);
  });
});
