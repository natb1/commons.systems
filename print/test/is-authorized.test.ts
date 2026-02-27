import { describe, it, expect } from "vitest";
import { isAuthorized } from "../src/is-authorized";
import { makeUser } from "./helpers/make-user";

describe("isAuthorized", () => {
  it("returns false for null user", () => {
    expect(isAuthorized(null)).toBe(false);
  });

  it("returns true when screenName is natb1", () => {
    const user = makeUser({ screenName: "natb1" });
    expect(isAuthorized(user)).toBe(true);
  });

  it("returns true when providerData displayName is natb1", () => {
    const user = makeUser({ providerDisplayName: "natb1" });
    expect(isAuthorized(user)).toBe(true);
  });

  it("returns false when neither screenName nor providerData match", () => {
    const user = makeUser({ screenName: "other", providerDisplayName: "other-name" });
    expect(isAuthorized(user)).toBe(false);
  });

  it("falls through to providerData when reloadUserInfo is missing", () => {
    const user = makeUser({ providerDisplayName: "natb1" });
    // Remove reloadUserInfo to test fallback
    delete (user as Record<string, unknown>).reloadUserInfo;
    expect(isAuthorized(user)).toBe(true);
  });
});
