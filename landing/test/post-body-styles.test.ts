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

    it("uses the ds prose font token", () => {
      expect(bodyRule).toMatch(/font-family:\s*var\(--font-prose\)/);
    });

    it("uses the ds prose leading token", () => {
      expect(bodyRule).toMatch(/line-height:\s*var\(--leading-prose\)/);
    });

    it("uses the ds prose measure token", () => {
      expect(bodyRule).toMatch(/max-width:\s*var\(--measure-prose\)/);
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
