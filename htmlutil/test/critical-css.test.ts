import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, mkdir, writeFile, readFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { inlineCriticalCss } from "../src/critical-css";

const MINIMAL_CSS = `
body { margin: 0; font-family: sans-serif; }
h1 { color: red; }
.unused { display: none; }
`;

const MINIMAL_HTML = `<!DOCTYPE html>
<html>
<head>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <h1>Hello</h1>
</body>
</html>`;

describe("inlineCriticalCss", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "critical-css-test-"));
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  it("inlines critical CSS and returns file count", async () => {
    await writeFile(join(tempDir, "style.css"), MINIMAL_CSS);
    await writeFile(join(tempDir, "index.html"), MINIMAL_HTML);

    const count = await inlineCriticalCss(tempDir);
    expect(count).toBe(1);

    const output = await readFile(join(tempDir, "index.html"), "utf-8");

    // Inlined style tag in head
    expect(output).toContain("<style>");

    // Deferred full stylesheet via media="print" with onload swap
    expect(output).toMatch(/link[^>]*media="print"/);
    expect(output).toMatch(/link[^>]*onload="/);

    // Noscript fallback link must NOT have media="print" or onload
    const noscriptMatch = output.match(/<noscript>([\s\S]*?)<\/noscript>/);
    expect(noscriptMatch).not.toBeNull();
    const noscriptContent = noscriptMatch![1];
    expect(noscriptContent).not.toContain('media="print"');
    expect(noscriptContent).not.toContain("onload=");
  });

  it("processes multiple HTML files", async () => {
    await writeFile(join(tempDir, "style.css"), MINIMAL_CSS);
    await writeFile(join(tempDir, "index.html"), MINIMAL_HTML);

    await mkdir(join(tempDir, "about"));
    await writeFile(join(tempDir, "about", "index.html"), MINIMAL_HTML);

    const count = await inlineCriticalCss(tempDir);
    expect(count).toBe(2);
  });

  it("throws when distDir has no HTML files", async () => {
    await writeFile(join(tempDir, "style.css"), MINIMAL_CSS);

    await expect(inlineCriticalCss(tempDir)).rejects.toThrow(
      /No HTML files found/,
    );
  });
});
