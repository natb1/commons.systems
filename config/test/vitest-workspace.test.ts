import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it, expect } from "vitest";

const root = resolve(import.meta.dirname, "../..");
const rootPkg = JSON.parse(readFileSync(resolve(root, "package.json"), "utf-8"));

const { workspaceDirs } = await import(resolve(root, "vitest.workspace.ts"));
const workspaceConfig: Array<{ test: { name: string; root: string } }> = (
  await import(resolve(root, "vitest.workspace.ts"))
).default;

describe("vitest.workspace.ts", () => {
  it("excludes rules-test", () => {
    expect(workspaceDirs).not.toContain("rules-test");
  });

  it("includes all other workspaces from package.json", () => {
    const expected = rootPkg.workspaces.filter(
      (w: string) => w !== "rules-test",
    );
    expect(workspaceDirs).toEqual(expected);
  });

  it("includes known app packages", () => {
    for (const app of ["budget", "fellspiral", "landing", "print"]) {
      expect(workspaceDirs).toContain(app);
    }
  });

  it("sets project names to directory names", () => {
    const names = workspaceConfig.map((p) => p.test.name);
    for (const dir of workspaceDirs) {
      expect(names).toContain(dir);
    }
  });
});
