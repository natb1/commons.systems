import { describe, it, expect } from "vitest";
import {
  resolveSourceFile,
  type DirHandleLike,
  type FileHandleLike,
} from "../src/statement-file-resolver";

function notFound(): DOMException {
  return new DOMException("not found", "NotFoundError");
}

function makeFileHandle(name: string): FileHandleLike {
  return {
    async getFile() {
      return new File(["contents of " + name], name);
    },
  };
}

/**
 * Build an in-memory mock directory tree. `tree` maps a name to either a nested
 * tree (a subdirectory) or a string (a file). Missing names throw NotFoundError.
 */
type Tree = { [name: string]: Tree | string };

function makeDir(tree: Tree): DirHandleLike {
  return {
    async getDirectoryHandle(name: string) {
      const child = tree[name];
      if (child === undefined || typeof child === "string") {
        throw notFound();
      }
      return makeDir(child);
    },
    async getFileHandle(name: string) {
      const child = tree[name];
      if (typeof child !== "string") {
        throw notFound();
      }
      return makeFileHandle(name);
    },
  };
}

describe("resolveSourceFile", () => {
  it("resolves a nested path to the expected file handle", async () => {
    const dir = makeDir({
      bankone: { "1234": { "2025-07": { "file.csv": "data" } } },
    });
    const handle = await resolveSourceFile(dir, "bankone/1234/2025-07/file.csv");
    expect(handle).not.toBeNull();
    const file = await handle!.getFile();
    expect(file.name).toBe("file.csv");
  });

  it("returns null when an intermediate directory is missing", async () => {
    const dir = makeDir({
      bankone: { "1234": { "2025-07": { "file.csv": "data" } } },
    });
    const handle = await resolveSourceFile(dir, "bankone/9999/2025-07/file.csv");
    expect(handle).toBeNull();
  });

  it("returns null when the final file segment is missing", async () => {
    const dir = makeDir({
      bankone: { "1234": { "2025-07": { "file.csv": "data" } } },
    });
    const handle = await resolveSourceFile(dir, "bankone/1234/2025-07/missing.csv");
    expect(handle).toBeNull();
  });

  it("returns null for an empty path", async () => {
    const dir = makeDir({ "file.csv": "data" });
    expect(await resolveSourceFile(dir, "")).toBeNull();
    expect(await resolveSourceFile(dir, "///")).toBeNull();
  });

  it("propagates non-NotFoundError errors", async () => {
    const boom: DirHandleLike = {
      async getDirectoryHandle() {
        throw new DOMException("nope", "SecurityError");
      },
      async getFileHandle() {
        throw new DOMException("nope", "SecurityError");
      },
    };
    await expect(resolveSourceFile(boom, "a/b/file.csv")).rejects.toThrow("nope");
  });
});
