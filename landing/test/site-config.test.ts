import { describe, it, expect } from "vitest";
import { SITE_DEFAULTS } from "../src/site-config";

describe("SITE_DEFAULTS", () => {
  it("description stays within 160 chars (Google SERP truncation threshold)", () => {
    expect(SITE_DEFAULTS.description.length).toBeLessThanOrEqual(160);
  });

  it("image is an absolute path starting with /", () => {
    expect(SITE_DEFAULTS.image.startsWith("/")).toBe(true);
  });

  it("image is a .png asset", () => {
    expect(SITE_DEFAULTS.image.endsWith(".png")).toBe(true);
  });
});
