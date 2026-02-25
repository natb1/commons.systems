import { describe, it, expect } from "vitest";
import { nsCollectionPath } from "../src/namespace.js";

describe("nsCollectionPath", () => {
  it("returns {namespace}/{collectionName}", () => {
    expect(nsCollectionPath("app/emulator", "messages")).toBe(
      "app/emulator/messages",
    );
  });

  it("works with prod namespace", () => {
    expect(nsCollectionPath("app/prod", "messages")).toBe("app/prod/messages");
  });

  it("works with preview namespace", () => {
    expect(nsCollectionPath("app/preview-pr-42", "users")).toBe(
      "app/preview-pr-42/users",
    );
  });

  it("throws on empty namespace", () => {
    expect(() => nsCollectionPath("", "messages")).toThrow(
      "namespace must not be empty",
    );
  });

  it("throws on empty collectionName", () => {
    expect(() => nsCollectionPath("emulator", "")).toThrow(
      "collectionName must not be empty",
    );
  });
});
