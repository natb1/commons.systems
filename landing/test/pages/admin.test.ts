import { describe, it, expect } from "vitest";
import { renderAdmin } from "../../src/pages/admin";
import type { User } from "firebase/auth";

function makeUser(overrides?: { displayName?: string | null }): User {
  return {
    displayName: overrides?.displayName ?? null,
    uid: "test-uid",
  } as unknown as User;
}

describe("renderAdmin", () => {
  it("returns sign-in prompt when user is null", () => {
    const html = renderAdmin(null, false);
    expect(html).toContain("Sign in with your GitHub account");
  });

  it("returns not-authorized message for non-admin user", () => {
    const user = makeUser();
    const html = renderAdmin(user, false);
    expect(html).toContain("not authorized");
    expect(html).toContain('id="not-authorized"');
  });

  it("returns admin content when isAdmin is true", () => {
    const user = makeUser({ displayName: "Nat B" });
    const html = renderAdmin(user, true);
    expect(html).toContain("Signed in as");
    expect(html).toContain("Nat B");
  });

  it("escapes displayName containing HTML", () => {
    const user = makeUser({ displayName: '<script>alert("xss")</script>' });
    const html = renderAdmin(user, true);
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("falls back to 'natb1' when displayName is null", () => {
    const user = makeUser({ displayName: null });
    const html = renderAdmin(user, true);
    expect(html).toContain("natb1");
  });
});
