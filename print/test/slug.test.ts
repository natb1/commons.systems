import { describe, it, expect } from "vitest";
import { titleToFilename } from "../src/slug";

describe("titleToFilename", () => {
  it("converts title to lowercase kebab-case with .md extension", () => {
    expect(titleToFilename("The Confessions of St. Augustine")).toBe("the-confessions-of-st-augustine.md");
  });

  it("handles special characters", () => {
    expect(titleToFilename("Plato's Republic (Vol. 1)")).toBe("plato-s-republic-vol-1.md");
  });

  it("collapses consecutive special characters into a single hyphen", () => {
    expect(titleToFilename("Hello---World")).toBe("hello-world.md");
  });

  it("strips leading and trailing hyphens", () => {
    expect(titleToFilename("--Hello--")).toBe("hello.md");
  });

  it("handles single word", () => {
    expect(titleToFilename("Phaedrus")).toBe("phaedrus.md");
  });
});
