import { describe, it, expect } from "vitest";
import { SITE_DEFAULTS } from "../src/site-config";

describe("SITE_DEFAULTS", () => {
  it("description stays within the 160-char limit enforced by Google search snippets", () => {
    expect(SITE_DEFAULTS.description.length).toBeLessThanOrEqual(160);
  });
});
