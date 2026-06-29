// @vitest-environment node
import { describe, it, expect } from "vitest";
import { FOOTER_HTML } from "../src/footer";

describe("footer (Node environment)", () => {
  it("exports FOOTER_HTML as a string", () => {
    expect(typeof FOOTER_HTML).toBe("string");
  });

  it('FOOTER_HTML contains "RUMOR.ML"', () => {
    expect(FOOTER_HTML).toContain("RUMOR.ML");
  });
});
