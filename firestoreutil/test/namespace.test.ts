import { describe, it, expect } from "vitest";
import { nsCollectionPath, validateNamespace } from "../src/namespace.js";

describe("validateNamespace", () => {
  it("accepts valid namespace and returns it", () => {
    expect(validateNamespace("app/prod")).toBe("app/prod");
  });

  it("throws on empty namespace", () => {
    expect(() => validateNamespace("")).toThrow("namespace must not be empty");
  });

  it("throws on namespace without slash", () => {
    expect(() => validateNamespace("emulator")).toThrow(
      'namespace must be in "{app}/{env}" format',
    );
  });

  it("throws on multi-slash namespace", () => {
    expect(() => validateNamespace("a/b/c")).toThrow(
      'namespace must be in "{app}/{env}" format',
    );
  });
});

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

  it("throws on namespace without slash", () => {
    expect(() => nsCollectionPath("emulator", "messages")).toThrow(
      'namespace must be in "{app}/{env}" format',
    );
  });

  it("throws on multi-slash namespace", () => {
    expect(() => nsCollectionPath("a/b/c", "messages")).toThrow(
      'namespace must be in "{app}/{env}" format',
    );
  });

  it("throws on empty collectionName", () => {
    expect(() => nsCollectionPath("app/emulator", "")).toThrow(
      "collectionName must not be empty",
    );
  });
});
