import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  isFirebaseSpecifier,
  extractImports,
  runAudit,
  formatReport,
} from "../src/audit.js";

// --- isFirebaseSpecifier ----------------------------------------------------

describe("isFirebaseSpecifier", () => {
  it("matches the firebase SDK packages and subpaths", () => {
    for (const s of [
      "firebase",
      "firebase/app",
      "firebase/firestore",
      "firebase-admin",
      "firebase-admin/app",
      "firebase-functions",
      "firebase-functions/v2/https",
    ]) {
      expect(isFirebaseSpecifier(s)).toBe(true);
    }
  });

  it("matches the shared firebase wrapper packages and their subpaths", () => {
    for (const s of [
      "@commons-systems/firebaseutil",
      "@commons-systems/firebaseutil/app-context",
      "@commons-systems/firestoreutil/namespace",
      "@commons-systems/authutil/app-auth",
      "@commons-systems/mediautil/firebase",
      "@commons-systems/blog/firestore",
    ]) {
      expect(isFirebaseSpecifier(s)).toBe(true);
    }
  });

  it("does not match firebase-free specifiers", () => {
    for (const s of [
      "react",
      "firebaseui-x", // not a boundary match
      "@commons-systems/mediautil/source", // mediautil non-firebase subpath
      "@commons-systems/blog/date", // blog non-firestore subpath
      "@commons-systems/idbutil/connection",
      "node:fs",
    ]) {
      expect(isFirebaseSpecifier(s)).toBe(false);
    }
  });
});

// --- extractImports ---------------------------------------------------------

describe("extractImports", () => {
  it("captures static, dynamic, and re-export specifiers", () => {
    const src = `
      import a from "./a.js";
      import { b } from "firebase/app";
      export { c } from "./c.js";
      const d = await import("./d.js");
    `;
    const found = extractImports(src);
    expect(found).toContain("./a.js");
    expect(found).toContain("firebase/app");
    expect(found).toContain("./c.js");
    expect(found).toContain("./d.js");
  });
});

// --- runAudit over a materialized fixture workspace -------------------------

describe("runAudit", () => {
  let repo: string;

  const write = (rel: string, content: string) => {
    const full = join(repo, rel);
    mkdirSync(dirname(full), { recursive: true });
    writeFileSync(full, content);
  };

  beforeAll(() => {
    repo = mkdtempSync(join(tmpdir(), "fb-audit-"));

    write(
      "package.json",
      JSON.stringify({
        name: "fixture-root",
        workspaces: ["liveapp", "fbwrap", "deadpkg", "functions"],
      }),
    );
    write(
      ".firebaserc",
      JSON.stringify({
        projects: { default: "fixture" },
        targets: { fixture: { hosting: { liveapp: ["fixture-site"] } } },
      }),
    );

    // Live hosting app: entry declared via index.html module script.
    write(
      "liveapp/index.html",
      `<!doctype html><html><body>` +
        `<script type="module" src="/src/main.tsx"></script></body></html>`,
    );
    write("liveapp/package.json", JSON.stringify({ name: "@fixture/liveapp" }));
    write(
      "liveapp/src/main.tsx",
      `import "firebase/app";\n` +
        `import { x } from "@fixture/fbwrap/x";\n` +
        `import "./local.js";\n` +
        `import "./plain.js";\n` +
        `export const app = x;\n`,
    );
    // Reached from the app, imports firebase -> live.
    write("liveapp/src/local.ts", `import "firebase/auth";\nexport const l = 1;\n`);
    // Reached from the app, no firebase -> must not appear in verdicts.
    write("liveapp/src/plain.ts", `export const p = 2;\n`);

    // Wrapper package reached via the app through its exports map.
    write(
      "fbwrap/package.json",
      JSON.stringify({ name: "@fixture/fbwrap", exports: { "./x": "./src/x.ts" } }),
    );
    write("fbwrap/src/x.ts", `import "firebase/firestore";\nexport const x = 3;\n`);

    // Firebase-importing package no root reaches -> dead.
    write(
      "deadpkg/package.json",
      JSON.stringify({ name: "@fixture/deadpkg", exports: { ".": "./src/dead.ts" } }),
    );
    write("deadpkg/src/dead.ts", `import "firebase/storage";\nexport const d = 4;\n`);

    // Functions root: entry re-exports a .js specifier that resolves to a .ts file.
    write("functions/package.json", JSON.stringify({ name: "@fixture/functions" }));
    write("functions/src/index.ts", `export { fn } from "./fn.js";\n`);
    write("functions/src/fn.ts", `import "firebase-admin/app";\nexport const fn = 5;\n`);
  });

  afterAll(() => {
    rmSync(repo, { recursive: true, force: true });
  });

  it("discovers hosting + functions roots", () => {
    const result = runAudit(repo);
    expect(result.roots).toEqual([
      "functions/src/index.ts",
      "liveapp/src/main.tsx",
    ]);
  });

  it("classifies every firebase-importing module by live consumer", () => {
    const result = runAudit(repo);
    const byModule = new Map(result.verdicts.map((v) => [v.module, v]));

    // The complete firebase-importing set — the scanner must find exactly these.
    expect([...byModule.keys()].sort()).toEqual([
      "deadpkg/src/dead.ts",
      "fbwrap/src/x.ts",
      "functions/src/fn.ts",
      "liveapp/src/local.ts",
      "liveapp/src/main.tsx",
    ]);

    // Live modules carry the reaching consumer; the wrapper is reached via the app.
    expect(byModule.get("liveapp/src/main.tsx")?.nearestLiveConsumer).toBe("liveapp");
    expect(byModule.get("liveapp/src/local.ts")?.nearestLiveConsumer).toBe("liveapp");
    expect(byModule.get("fbwrap/src/x.ts")?.nearestLiveConsumer).toBe("liveapp");
    // .js -> .ts resolution across the functions entry.
    expect(byModule.get("functions/src/fn.ts")?.nearestLiveConsumer).toBe("functions");

    // The unreferenced package is dead.
    expect(byModule.get("deadpkg/src/dead.ts")?.nearestLiveConsumer).toBeNull();

    // plain.ts is reached but firebase-free -> absent from verdicts.
    expect(byModule.has("liveapp/src/plain.ts")).toBe(false);

    expect(result.deadCount).toBe(1);
    expect(result.liveCount).toBe(4);
  });

  it("records the matched firebase specifiers per module", () => {
    const result = runAudit(repo);
    const wrap = result.verdicts.find((v) => v.module === "fbwrap/src/x.ts");
    expect(wrap?.firebaseImports).toEqual(["firebase/firestore"]);
  });

  it("formatReport renders roots, verdicts, and a summary", () => {
    const report = formatReport(runAudit(repo));
    expect(report).toContain("Live-consumer roots (2):");
    expect(report).toContain("deadpkg/src/dead.ts");
    expect(report).toContain("DEAD (no live consumer)");
    expect(report).toContain("Summary: 4 live, 1 dead, 5 firebase-importing total.");
  });
});
