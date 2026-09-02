import { describe, expect, it } from "vitest";
import {
  citedRetiredSkills,
  staleSkillReferences,
  type ScannedFile,
} from "../src/stale-skill-reference.js";

describe("citedRetiredSkills", () => {
  it("finds a retired skill cited as /name", () => {
    expect(citedRetiredSkills("run `/dispatch-token-audit` for a report", new Set(["dispatch-token-audit"]))).toEqual([
      "dispatch-token-audit",
    ]);
  });

  it("does not match a name that is only a PREFIX of a longer cited name", () => {
    // /align-tactics must not be misread as a citation of retired /align.
    expect(citedRetiredSkills("run /align-tactics next", new Set(["align"]))).toEqual([]);
  });

  it("does not match when the retired name is not present at all", () => {
    expect(citedRetiredSkills("nothing relevant here", new Set(["dispatch-token-audit"]))).toEqual([]);
  });

  it("returns every retired name the content cites, sorted", () => {
    const hits = citedRetiredSkills(
      "see /align-init and also /align-strategy for background",
      new Set(["align-init", "align-strategy", "unrelated-name"]),
    );
    expect(hits).toEqual(["align-init", "align-strategy"]);
  });
});

describe("staleSkillReferences", () => {
  function file(path: string, content: string): ScannedFile {
    return { path, content };
  }

  it("emits one seed per (file, retired name) citation", () => {
    const files = [file("intentions/tactic-foo.md", "see /align-init for the old flow")];
    const seeds = staleSkillReferences(files, new Set(["align-init"]));
    expect(seeds).toHaveLength(1);
    expect(seeds[0].subject).toContain("align-init");
    expect(seeds[0].detail).toContain(".claude/skills/align-init/");
  });

  it("emits nothing for a file that cites no retired skill", () => {
    const files = [file("intentions/tactic-foo.md", "no skill citations in here")];
    expect(staleSkillReferences(files, new Set(["align-init"]))).toEqual([]);
  });

  it("emits two seeds for a file citing two different retired names", () => {
    const files = [file("intentions/tactic-foo.md", "/align-init then /align-strategy")];
    const seeds = staleSkillReferences(files, new Set(["align-init", "align-strategy"]));
    expect(seeds).toHaveLength(2);
  });
});
