import { describe, it, expect } from "vitest";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { readBlogRollFeedsArtifact } from "../scripts/blog-roll-feeds-artifact.js";

function withArtifact(
  contents: string,
  run: (path: string) => void,
): void {
  const dir = mkdtempSync(join(tmpdir(), "feeds-artifact-"));
  const path = join(dir, "blog-roll-feeds.json");
  writeFileSync(path, contents, "utf8");
  try {
    run(path);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

describe("readBlogRollFeedsArtifact", () => {
  it("returns the parsed feed map when artifact ids match the expected ids", () => {
    const feeds = {
      a: { title: "A", url: "https://a.example/1", publishedAt: "2026-01-01T00:00:00Z" },
      b: null,
    };
    withArtifact(JSON.stringify(feeds), (path) => {
      expect(readBlogRollFeedsArtifact(["a", "b"], path)).toEqual(feeds);
      // Id-set equality is order-insensitive.
      expect(readBlogRollFeedsArtifact(["b", "a"], path)).toEqual(feeds);
    });
  });

  it("throws a parity error when the artifact omits an expected id", () => {
    withArtifact(JSON.stringify({ a: null }), (path) => {
      expect(() => readBlogRollFeedsArtifact(["a", "b"], path)).toThrow(
        /parity check failed/,
      );
    });
  });

  it("throws a parity error when the artifact carries an unexpected id", () => {
    withArtifact(JSON.stringify({ a: null, extra: null }), (path) => {
      expect(() => readBlogRollFeedsArtifact(["a"], path)).toThrow(
        /parity check failed/,
      );
    });
  });

  it("throws a clear error when the artifact file is missing", () => {
    expect(() =>
      readBlogRollFeedsArtifact(["a"], join(tmpdir(), "does-not-exist-xyz.json")),
    ).toThrow(/feed artifact not found/);
  });
});
