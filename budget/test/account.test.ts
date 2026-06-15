import { describe, it, expect } from "vitest";
import { accountDocId } from "../src/entities/account";

describe("accountDocId", () => {
  it("is backwards-compatible: space-containing components are unchanged", () => {
    expect(accountDocId("Example Bank", "Checking")).toBe("Example Bank_Checking");
  });

  it("is injective: underscore in institution vs account does not collide", () => {
    expect(accountDocId("Bank_A", "Savings")).not.toBe(accountDocId("Bank", "A_Savings"));
  });

  it("escapes the escape: percent signs in components do not collide", () => {
    expect(accountDocId("A_B", "x")).not.toBe(accountDocId("A%5FB", "x"));
    expect(accountDocId("A%B", "x")).not.toBe(accountDocId("A%25B", "x"));
  });
});
