import { chmodSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { parse } from "yaml";
import { describe, expect, it } from "vitest";
import { buildDefaultRegistry, readMainHealth } from "../scripts/read-sensors.js";

const GREEN_READING =
  "green: every check on the current origin/main HEAD concludes success (or neutral/skipped)";
const FAKE_SHA = "abc123fakesha";

function tempDir(): string {
  return mkdtempSync(join(tmpdir(), "main-health-"));
}

/** Write a fixture `repo-health`-standin script and return its path. */
function fakeBinary(behavior: "green" | "red" | "unknown" | "empty"): string {
  const dir = tempDir();
  const path = join(dir, "repo-health");
  const body =
    behavior === "green"
      ? "#!/bin/sh\nexit 0\n"
      : behavior === "red"
        ? `#!/bin/sh\necho ${FAKE_SHA}\nexit 0\n`
        : behavior === "empty"
          ? "#!/bin/sh\necho NO_ATTRIBUTABLE_CHECKS\nexit 3\n"
          : "#!/bin/sh\nexit 1\n";
  writeFileSync(path, body);
  chmodSync(path, 0o755);
  return path;
}

describe("readMainHealth", () => {
  it("reads the green literal on empty stdout, matching strategy-main-health's threshold", () => {
    const greenBin = fakeBinary("green");
    expect(readMainHealth(greenBin)).toBe(GREEN_READING);
    rmSync(join(greenBin, ".."), { recursive: true, force: true });

    // Assert equality against the strategy's own recorded threshold, not a
    // snapshot of the literal above — read straight from the source file.
    const repoRoot = join(import.meta.dirname, "..", "..", "..");
    const content = readFileSync(join(repoRoot, "intentions", "strategy-main-health.md"), "utf8");
    const lines = content.split("\n");
    const first = lines.indexOf("---");
    const second = lines.indexOf("---", first + 1);
    const frontmatter = lines.slice(first + 1, second).join("\n");
    const parsed = parse(frontmatter) as { success_signal: { threshold: string } };
    expect(parsed.success_signal.threshold).toBe(readMainHealth(fakeBinary("green")));
  });

  it("reads the red phrase with the failing sha on non-empty stdout", () => {
    const redBin = fakeBinary("red");
    expect(readMainHealth(redBin)).toBe(`red: ${FAKE_SHA} has one or more failing checks`);
    rmSync(join(redBin, ".."), { recursive: true, force: true });
  });

  it("reads unknown when the binary exits non-zero", () => {
    const failBin = fakeBinary("unknown");
    expect(readMainHealth(failBin)).toBe("unknown");
    rmSync(join(failBin, ".."), { recursive: true, force: true });
  });

  it("reads a distinct unknown phrase when no check is attributable to main's own workflow", () => {
    const emptyBin = fakeBinary("empty");
    const reading = readMainHealth(emptyBin);
    expect(reading).toBe(
      "unknown: no check on the current origin/main HEAD is attributable to main's own workflow (empty or misattributed check set) — cannot confirm green",
    );
    expect(reading).not.toBe(GREEN_READING);
    rmSync(join(emptyBin, ".."), { recursive: true, force: true });
  });
});

describe("buildDefaultRegistry", () => {
  it("registers the main-health sensor under the name strategies use", () => {
    const registry = buildDefaultRegistry();
    expect(registry.resolve("main-health").name).toBe("main-health");
  });
});
