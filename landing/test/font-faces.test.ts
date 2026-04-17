import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";

const srcDir = join(dirname(new URL(import.meta.url).pathname), "..");
const themePath = join(srcDir, "src/style/theme.css");
const fontsDir = join(srcDir, "public/fonts");

const theme = readFileSync(themePath, "utf-8");

interface FaceSpec {
  weight: 400 | 700;
  style: "normal" | "italic";
  file: string;
}

const serifFaces: FaceSpec[] = [
  { weight: 400, style: "normal", file: "ibm-plex-serif-latin-400-normal.woff2" },
  { weight: 400, style: "italic", file: "ibm-plex-serif-latin-400-italic.woff2" },
  { weight: 700, style: "normal", file: "ibm-plex-serif-latin-700-normal.woff2" },
];

describe("IBM Plex Serif @font-face declarations", () => {
  for (const face of serifFaces) {
    describe(`weight ${face.weight} ${face.style}`, () => {
      const blockPattern = new RegExp(
        String.raw`@font-face\s*\{[^}]*?font-family:\s*"IBM Plex Serif"[^}]*?font-style:\s*${face.style}[^}]*?font-weight:\s*${face.weight}[^}]*?\}`,
        "s",
      );
      const block = theme.match(blockPattern)?.[0];

      it("has a matching @font-face block in theme.css", () => {
        expect(block, `expected an IBM Plex Serif ${face.weight} ${face.style} block`).toBeDefined();
      });

      it("uses font-display: optional", () => {
        expect(block).toMatch(/font-display:\s*optional/);
      });

      it(`references /fonts/${face.file}`, () => {
        expect(block).toContain(`url("/fonts/${face.file}")`);
      });

      it("ships a valid woff2 file", () => {
        const filePath = join(fontsDir, face.file);
        expect(existsSync(filePath)).toBe(true);
        const buf = readFileSync(filePath);
        expect(buf.length).toBeGreaterThan(1000);
        expect(buf.subarray(0, 4).toString("ascii")).toBe("wOF2");
      });
    });
  }
});
