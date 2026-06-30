import { describe, it, expect } from "vitest";
import { parseRawTransaction } from "../src/entities/transaction";

describe("parseRawTransaction", () => {
  it("defaults a missing reimbursement to 0", () => {
    const t = parseRawTransaction({ id: "txn-1" } as any, 0);
    expect(t.reimbursement).toBe(0);
  });
  it("rejects an out-of-range reimbursement with RangeError", () => {
    expect(() =>
      parseRawTransaction({ id: "txn-1", reimbursement: 150 } as any, 0),
    ).toThrow(RangeError);
  });
});
