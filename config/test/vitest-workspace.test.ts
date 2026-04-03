import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it, expect } from "vitest";

const root = resolve(import.meta.dirname, "../..");
const rootPkg = JSON.parse(readFileSync(resolve(root, "package.json"), "utf-8"));

// Dynamic import of the workspace config to test its actual output
const workspaceProjects: string[] = (
  await import(resolve(root, "vitest.workspace.ts"))
).default;

describe("vitest.workspace.ts", () => {
  it("excludes rules-test", () => {
    expect(workspaceProjects).not.toContain("rules-test");
  });

  it("includes all other workspaces from package.json", () => {
    const expected = rootPkg.workspaces.filter(
      (w: string) => w !== "rules-test",
    );
    expect(workspaceProjects).toEqual(expected);
  });

  it("includes known app packages", () => {
    for (const app of ["budget", "fellspiral", "landing", "print"]) {
      expect(workspaceProjects).toContain(app);
    }
  });
});
