import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("node:child_process", () => ({ execFileSync: vi.fn() }));

import { execFileSync } from "node:child_process";
import { paginateGhApi } from "../scripts/gh-utils.js";

const mockExec = vi.mocked(execFileSync);

beforeEach(() => {
  mockExec.mockReset();
});

describe("paginateGhApi", () => {
  it("flattens multi-page slurped payload to a single array", () => {
    mockExec.mockReturnValueOnce(JSON.stringify([[{ n: 1 }], [{ n: 2 }]]));

    const result = paginateGhApi<{ n: number }>(["/x"]);

    expect(result).toEqual([{ n: 1 }, { n: 2 }]);
    expect(result).toHaveLength(2);
  });

  it("default runner builds the right argv", () => {
    mockExec.mockReturnValueOnce(JSON.stringify([[]]));

    paginateGhApi(["/x"]);

    expect(mockExec).toHaveBeenCalledTimes(1);
    expect(mockExec).toHaveBeenCalledWith(
      "gh",
      ["api", "--paginate", "--slurp", "/x"],
      expect.anything(),
    );
  });

  it("custom runner passthrough bypasses execFileSync and receives prepended args", () => {
    const runner = vi.fn().mockReturnValue(JSON.stringify([[{ id: 1 }]]));

    const result = paginateGhApi<{ id: number }>(["/y"], runner);

    expect(runner).toHaveBeenCalledTimes(1);
    expect(runner).toHaveBeenCalledWith(["api", "--paginate", "--slurp", "/y"]);
    expect(mockExec).not.toHaveBeenCalled();
    expect(result).toEqual([{ id: 1 }]);
  });
});
