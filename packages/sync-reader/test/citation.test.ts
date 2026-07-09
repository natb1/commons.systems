import { describe, expect, it } from "vitest";
import type { TocEntry } from "../src/epub-read.js";
import { mapRangeToSections } from "../src/citation.js";

function toc(entries: [string, number][]): TocEntry[] {
  return entries.map(([label, spineIndex]) => ({
    label,
    href: "",
    fragment: "",
    spineIndex,
  }));
}

const republicToc = toc([
  ["Introduction", 0],
  ["Book VI", 1],
  ["Book VII", 2],
  ["Book VIII", 3],
]);

const kantToc = toc([
  ["Preface 4:387", 0],
  ["First Section 4:393", 1],
  ["Second Section 4:406", 2],
  ["Third Section 4:427", 3],
]);

describe("mapRangeToSections", () => {
  it("maps a Stephanus book range to the containing section span", () => {
    expect(mapRangeToSections("VII 514a-521b", republicToc, 4)).toEqual({
      kind: "sections",
      spineIndices: [2],
    });
  });

  it("selects only the cited book, not adjacent ones", () => {
    expect(mapRangeToSections("VI 507b-509c", republicToc, 4)).toEqual({
      kind: "sections",
      spineIndices: [1],
    });
  });

  it("maps a book range at the end of the spine through the last section", () => {
    // A shorter TOC where Book VII is the final entry: span runs to spine end.
    const shortToc = toc([
      ["Book VI", 0],
      ["Book VII", 1],
    ]);
    expect(mapRangeToSections("VII 514a", shortToc, 3)).toEqual({
      kind: "sections",
      spineIndices: [1, 2],
    });
  });

  it("maps a volume:page citation to the section containing the page", () => {
    expect(mapRangeToSections("4:429", kantToc, 4)).toEqual({
      kind: "sections",
      spineIndices: [3],
    });
  });

  it("maps a page span to the section containing its start page", () => {
    expect(mapRangeToSections("4:406-410", kantToc, 4)).toEqual({
      kind: "sections",
      spineIndices: [2],
    });
  });

  it("returns unmapped with a reason when no designator matches", () => {
    const result = mapRangeToSections("IX 999a", republicToc, 4);
    expect(result.kind).toBe("unmapped");
    if (result.kind === "unmapped") {
      expect(result.reason).toContain("IX 999a");
      expect(result.reason).toContain("Book VII");
    }
  });

  it("returns unmapped when the range has no recognizable designator", () => {
    const result = mapRangeToSections("see the appendix", republicToc, 4);
    expect(result.kind).toBe("unmapped");
  });
});
