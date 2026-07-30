import { describe, expect, it } from "vitest";
import {
  MACHINERY_SENTINEL,
  appendMachinerySection,
  isMachinerySentinelLine,
  isNeedsMainHeadingText,
  planSubstance,
} from "../src/body-substance.js";
import { tacticScopeFingerprint } from "../src/router.js";

const PLAN = [
  "# A tactic",
  "",
  "## Context",
  "",
  "Why the change is being made.",
  "",
  "## Verification",
  "",
  "Run the suite.",
  "",
].join("\n");

const RESIDUE = ["## needs-main residue", "", "Verify the banner on prod.", ""].join("\n");

describe("isMachinerySentinelLine", () => {
  it("matches the sentinel (and an indented one), not ordinary comments or prose", () => {
    expect(isMachinerySentinelLine(MACHINERY_SENTINEL)).toBe(true);
    expect(isMachinerySentinelLine(`   ${MACHINERY_SENTINEL}`)).toBe(true);
    expect(isMachinerySentinelLine("<!-- machinery -->")).toBe(true);
    expect(isMachinerySentinelLine("<!-- dispatch:plan -->")).toBe(false);
    expect(isMachinerySentinelLine("machinery output below")).toBe(false);
  });
});

describe("isNeedsMainHeadingText", () => {
  it("matches needs-main heading text case-insensitively, and nothing else", () => {
    expect(isNeedsMainHeadingText("needs-main")).toBe(true);
    expect(isNeedsMainHeadingText("Needs-main residue")).toBe(true);
    expect(isNeedsMainHeadingText("  NEEDS-MAIN QA  ")).toBe(true);
    expect(isNeedsMainHeadingText("needs-main-ish")).toBe(false);
    expect(isNeedsMainHeadingText("Verification")).toBe(false);
  });
});

describe("planSubstance", () => {
  it("returns the body byte-identically when no boundary is present", () => {
    expect(planSubstance(PLAN)).toBe(PLAN);
    // Including bodies with unusual trailing whitespace — untouched without a boundary.
    expect(planSubstance("# t\n\n\n")).toBe("# t\n\n\n");
    expect(planSubstance("# t")).toBe("# t");
    expect(planSubstance("")).toBe("");
  });

  it("truncates at the machinery sentinel", () => {
    const body = `${PLAN}\n${MACHINERY_SENTINEL}\n\n${RESIDUE}`;
    expect(planSubstance(body)).toBe("# A tactic\n\n## Context\n\nWhy the change is being made.\n\n## Verification\n\nRun the suite.\n");
  });

  it("truncates at a `## needs-main residue` H2 when no sentinel is present (legacy bodies)", () => {
    const body = `${PLAN}${RESIDUE}`;
    expect(planSubstance(body)).toBe(planSubstance(`${PLAN}\n${MACHINERY_SENTINEL}\n\n${RESIDUE}`));
  });

  it("truncates at whichever boundary comes FIRST", () => {
    // needs-main H2 above, sentinel below: the H2 wins.
    const headingFirst = `${PLAN}${RESIDUE}\n${MACHINERY_SENTINEL}\n\n## needs-main more\n`;
    expect(planSubstance(headingFirst)).toBe(planSubstance(`${PLAN}${RESIDUE}`));

    // sentinel above, needs-main H2 below: the sentinel wins.
    const sentinelFirst = `${PLAN}\n${MACHINERY_SENTINEL}\n\n${RESIDUE}`;
    expect(planSubstance(sentinelFirst)).not.toContain("needs-main");
    expect(planSubstance(sentinelFirst)).not.toContain("machinery");
  });

  it("matches the needs-main heading case-insensitively", () => {
    const body = `${PLAN}## Needs-main QA\n\nCheck prod.\n`;
    expect(planSubstance(body)).toBe(planSubstance(`${PLAN}${RESIDUE}`));
  });

  it("does NOT treat an ordinary H2 as a boundary", () => {
    const body = `${PLAN}## Dependencies\n\nUnit 1 first.\n`;
    expect(planSubstance(body)).toBe(body);
  });

  it("collapses the substance's trailing newline run to exactly one newline", () => {
    const padded = `# t\n\n## Context\n\nWhy.\n\n\n\n${MACHINERY_SENTINEL}\n\n${RESIDUE}`;
    expect(planSubstance(padded)).toBe("# t\n\n## Context\n\nWhy.\n");
  });

  it("returns an empty substance when the boundary is the first line", () => {
    expect(planSubstance(`${MACHINERY_SENTINEL}\n\n${RESIDUE}`)).toBe("");
    expect(planSubstance(RESIDUE)).toBe("");
  });
});

describe("appendMachinerySection", () => {
  it("inserts the sentinel on the FIRST append and reuses it on the second", () => {
    const first = appendMachinerySection(PLAN, RESIDUE);
    expect(first.split(MACHINERY_SENTINEL).length - 1).toBe(1);

    const second = appendMachinerySection(first, "## needs-main follow-up\n\nAlso check the footer.\n");
    expect(second.split(MACHINERY_SENTINEL).length - 1).toBe(1);
    expect(second).toContain("Also check the footer.");
    expect(second.indexOf(MACHINERY_SENTINEL)).toBeLessThan(second.indexOf("Also check the footer."));
  });

  it("never mutates the bytes above the boundary", () => {
    const first = appendMachinerySection(PLAN, RESIDUE);
    expect(first.startsWith(PLAN)).toBe(true);
    const second = appendMachinerySection(first, "## needs-main follow-up\n");
    expect(second.startsWith(first)).toBe(true);
  });

  it("normalizes the appended section's trailing whitespace to one newline", () => {
    expect(appendMachinerySection(PLAN, "## needs-main x\n\nbody\n\n\n").endsWith("body\n")).toBe(true);
    expect(appendMachinerySection(PLAN, "## needs-main x\n\nbody").endsWith("body\n")).toBe(true);
  });

  it("invariant: a machinery append never changes the plan substance or the scope fingerprint", () => {
    const statement = "A tactic";
    const before = tacticScopeFingerprint(statement, PLAN);

    // First append — the sentinel is inserted.
    const first = appendMachinerySection(PLAN, RESIDUE);
    expect(planSubstance(first)).toBe(planSubstance(PLAN));
    expect(tacticScopeFingerprint(statement, first)).toBe(before);

    // Second append — the sentinel is already present.
    const second = appendMachinerySection(first, "## needs-main follow-up\n\nAlso check the footer.\n");
    expect(planSubstance(second)).toBe(planSubstance(PLAN));
    expect(tacticScopeFingerprint(statement, second)).toBe(before);

    // A non-machinery section appended directly (no boundary) DOES change it.
    expect(tacticScopeFingerprint(statement, `${PLAN}## Dependencies\n\nUnit 1.\n`)).not.toBe(before);
  });
});
