import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";

const pkgRoot = join(dirname(new URL(import.meta.url).pathname), "..");
const css = readFileSync(join(pkgRoot, "src/style/theme.css"), "utf-8");

const bodyRule = css.match(
  /#posts article \[id\^="post-content-"\]\s*\{[^}]*\}/,
)?.[0];

const codeRule = css.match(
  /#posts article \[id\^="post-content-"\] code,\s*#posts article \[id\^="post-content-"\] pre,\s*#posts article \[id\^="post-content-"\] kbd,\s*#posts article \[id\^="post-content-"\] samp\s*\{[^}]*\}/,
)?.[0];

describe("post body typography", () => {
  describe("body rule", () => {
    it("exists", () => {
      expect(bodyRule, "expected a rule for #posts article [id^=post-content-]").toBeDefined();
    });

    it("declares IBM Plex Serif first in the family stack", () => {
      expect(bodyRule).toMatch(/font-family:\s*"IBM Plex Serif"/);
    });

    it("falls back to a generic serif", () => {
      expect(bodyRule).toMatch(/serif\s*;/);
    });

    it("sets line-height to 1.6 for serif readability", () => {
      expect(bodyRule).toMatch(/line-height:\s*1\.6/);
    });

    it("constrains line length to 70ch", () => {
      expect(bodyRule).toMatch(/max-width:\s*70ch/);
    });
  });

  describe("code override rule", () => {
    it("exists and targets code/pre/kbd/samp", () => {
      expect(codeRule).toBeDefined();
      expect(codeRule).toContain("code");
      expect(codeRule).toContain("pre");
      expect(codeRule).toContain("kbd");
      expect(codeRule).toContain("samp");
    });

    it("restores the body monospace font", () => {
      expect(codeRule).toMatch(/font-family:\s*var\(--font-body\)/);
    });
  });
});
