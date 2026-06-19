import { Linter } from "eslint";
import { describe, it, expect } from "vitest";
import config from "../eslint.config.js";

// Use the flat-config Linter API so the real shipped config is exercised without
// spawning a child process. Pass a .ts filename so the TS-file `files` glob in
// the config matches and the @typescript-eslint/no-restricted-imports rule fires.

const linter = new Linter({ configType: "flat" });

function lint(code: string): Linter.LintMessage[] {
  return linter.verify(code, config as Parameters<typeof linter.verify>[1], {
    filename: "src/foo.ts",
  });
}

function restrictedImportMessages(messages: Linter.LintMessage[]) {
  return messages.filter(
    (m) => m.ruleId === "@typescript-eslint/no-restricted-imports",
  );
}

describe("eslint layering boundary rules", () => {
  it("flags a bare app-package import", () => {
    const messages = lint('import x from "landing";');
    const violations = restrictedImportMessages(messages);
    expect(violations).toHaveLength(1);
    expect(violations[0].message).toMatch(/top-level app package/);
    expect(violations[0].message).toContain("landing");
  });

  it("flags a subpath import from an app package", () => {
    const messages = lint('import x from "landing/foo";');
    const violations = restrictedImportMessages(messages);
    expect(violations).toHaveLength(1);
    expect(violations[0].message).toMatch(/top-level app package/);
    expect(violations[0].message).toContain("landing");
  });

  it("does not flag a scoped leaf-lib import", () => {
    const messages = lint('import { x } from "@commons-systems/errorutil";');
    const violations = restrictedImportMessages(messages);
    expect(violations).toHaveLength(0);
  });
});
