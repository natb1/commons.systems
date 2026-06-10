import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, mkdir, writeFile, readFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { inlineCriticalCss } from "../src/index";

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

    // CSP-safe deferral: no inline event handler and no media="print" toggle.
    expect(output).not.toMatch(/onload=/);
    expect(output).not.toMatch(/media="print"/);

    // The full stylesheet remains a plain blocking <link>...
    expect(output).toMatch(
      /<link[^>]*rel="stylesheet"[^>]*href="style\.css"[^>]*>/,
    );

    // ...moved into the <body>, not left in the <head>.
    const [head, body] = output.split("</head>");
    expect(body).toMatch(/<link[^>]*rel="stylesheet"[^>]*href="style\.css"[^>]*>/);
    expect(head).not.toMatch(/<link[^>]*rel="stylesheet"[^>]*href="style\.css"[^>]*>/);
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
