import { describe, expect, it } from "vitest";
import {
  auditForkDocs,
  enumerateArtifacts,
  formatReport,
  type FsFacade,
} from "../scripts/audit-fork-docs.js";

/** A `.firebaserc` fixture with the given hosting-target names under one project. */
function firebaserc(project: string, targets: string[]): string {
  const hosting = Object.fromEntries(targets.map((t) => [t, [`site-${t}`]]));
  return JSON.stringify({
    projects: { default: project },
    targets: { [project]: { hosting } },
  });
}

/**
 * Build an fs facade from a file map (path→content) and a set of directory
 * paths. Any path absent from `files` reads as `null`.
 */
function fsFixture(files: Record<string, string>, dirs: string[] = []): FsFacade {
  const dirSet = new Set(dirs);
  return {
    readText(path) {
      return path in files ? files[path] : null;
    },
    isDir(path) {
      return dirSet.has(path);
    },
  };
}

describe("enumerateArtifacts", () => {
  it("always includes the repo artifact plus one per hosting target", () => {
    const fs = fsFixture(
      { ".firebaserc": firebaserc("commons-systems", ["landing", "budget"]) },
      ["landing", "budget"],
    );
    expect(enumerateArtifacts(fs)).toEqual([
      { name: "repo", readme: "README.md" },
      { name: "landing", readme: "landing/README.md" },
      { name: "budget", readme: "budget/README.md" },
    ]);
  });

  it("derives target names from .firebaserc so a new app enters automatically", () => {
    const fs = fsFixture(
      { ".firebaserc": firebaserc("my-fork", ["landing", "newapp"]) },
      ["landing", "newapp"],
    );
    const names = enumerateArtifacts(fs).map((a) => a.name);
    expect(names).toEqual(["repo", "landing", "newapp"]);
  });

  it("is fork-friendly: does not hardcode the project id", () => {
    const fs = fsFixture(
      { ".firebaserc": firebaserc("someone-elses-fork", ["landing"]) },
      ["landing"],
    );
    expect(enumerateArtifacts(fs).map((a) => a.name)).toEqual(["repo", "landing"]);
  });

  it("throws when .firebaserc is unreadable", () => {
    const fs = fsFixture({}, []);
    expect(() => enumerateArtifacts(fs)).toThrow(".firebaserc");
  });

  it("throws when .firebaserc is unparseable", () => {
    const fs = fsFixture({ ".firebaserc": "{ not json" }, []);
    expect(() => enumerateArtifacts(fs)).toThrow("parse");
  });

  it("throws when there is more than one project under targets", () => {
    const fs = fsFixture(
      {
        ".firebaserc": JSON.stringify({
          targets: { one: { hosting: { a: ["x"] } }, two: { hosting: { b: ["y"] } } },
        }),
      },
      ["a", "b"],
    );
    expect(() => enumerateArtifacts(fs)).toThrow("exactly one project");
  });

  it("throws when there are zero projects under targets", () => {
    const fs = fsFixture({ ".firebaserc": JSON.stringify({ targets: {} }) }, []);
    expect(() => enumerateArtifacts(fs)).toThrow("exactly one project");
  });

  it("throws on an empty hosting map", () => {
    const fs = fsFixture(
      { ".firebaserc": JSON.stringify({ targets: { p: { hosting: {} } } }) },
      [],
    );
    expect(() => enumerateArtifacts(fs)).toThrow("empty");
  });

  it("throws when a hosting target has no same-named source directory", () => {
    const fs = fsFixture(
      { ".firebaserc": firebaserc("commons-systems", ["landing", "ghost"]) },
      ["landing"], // "ghost" dir absent
    );
    expect(() => enumerateArtifacts(fs)).toThrow("ghost");
  });
});

describe("auditForkDocs", () => {
  it("classifies each artifact present/missing and reports exit 0 when all present", () => {
    const fs = fsFixture(
      {
        ".firebaserc": firebaserc("commons-systems", ["landing"]),
        "README.md": "# Repo\nfork docs here",
        "landing/README.md": "# Landing\nfork docs here",
      },
      ["landing"],
    );
    const summary = auditForkDocs(fs);
    expect(summary.allPresent).toBe(true);
    expect(summary.exitCode).toBe(0);
    expect(summary.artifacts).toEqual([
      { name: "repo", readme: "README.md", present: true },
      { name: "landing", readme: "landing/README.md", present: true },
    ]);
  });

  it("treats a missing README as absent and reports exit 1", () => {
    const fs = fsFixture(
      {
        ".firebaserc": firebaserc("commons-systems", ["landing"]),
        "README.md": "# Repo\nfork docs",
        // landing/README.md absent
      },
      ["landing"],
    );
    const summary = auditForkDocs(fs);
    expect(summary.allPresent).toBe(false);
    expect(summary.exitCode).toBe(1);
    expect(summary.artifacts.map((a) => a.present)).toEqual([true, false]);
  });

  it("treats an empty (whitespace-only) README as absent", () => {
    const fs = fsFixture(
      {
        ".firebaserc": firebaserc("commons-systems", ["landing"]),
        "README.md": "# Repo",
        "landing/README.md": "   \n  \n",
      },
      ["landing"],
    );
    const summary = auditForkDocs(fs);
    expect(summary.allPresent).toBe(false);
    expect(summary.exitCode).toBe(1);
    expect(summary.artifacts[1]).toMatchObject({ name: "landing", present: false });
  });
});

describe("formatReport", () => {
  it("renders the artifact table and one attestation line per artifact", () => {
    const report = formatReport({
      allPresent: false,
      exitCode: 1,
      artifacts: [
        { name: "repo", readme: "README.md", present: true },
        { name: "landing", readme: "landing/README.md", present: false },
      ],
    });
    expect(report).toContain("| repo | README.md | yes |");
    expect(report).toContain("| landing | landing/README.md | no |");
    expect(report).toContain(
      "- [ ] repo: documentation sufficient for a shallow fork to stand alone?",
    );
    expect(report).toContain(
      "- [ ] landing: documentation sufficient for a shallow fork to stand alone?",
    );
    expect(report).toContain("CC-BY-SA share-alike terms");
    expect(report).toContain("intentions/strategy-open-source-as-gift.md");
  });
});
