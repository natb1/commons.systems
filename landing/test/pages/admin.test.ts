import { describe, it, expect } from "vitest";
import { renderAdmin } from "../../src/pages/admin";
import { makeUser } from "../helpers/make-user";

describe("renderAdmin", () => {
  it("returns sign-in prompt when user is null", () => {
    const html = renderAdmin(null);
    expect(html).toContain("Sign in with your GitHub account");
  });

  it("returns not-authorized message for non-natb1 user", () => {
    const user = makeUser({ screenName: "other", providerDisplayName: "other-name" });
    const html = renderAdmin(user);
    expect(html).toContain("not authorized");
    expect(html).toContain('id="not-authorized"');
  });

  it("returns admin content when authorized via screenName", () => {
    const user = makeUser({ screenName: "natb1", displayName: "Nat B" });
    const html = renderAdmin(user);
    expect(html).toContain("Signed in as");
    expect(html).toContain("Nat B");
  });

  it("returns admin content when authorized via providerData displayName", () => {
    const user = makeUser({ providerDisplayName: "natb1", displayName: "Nat" });
    const html = renderAdmin(user);
    expect(html).toContain("Signed in as");
  });

  it("escapes displayName containing HTML", () => {
    const user = makeUser({
      screenName: "natb1",
      displayName: '<script>alert("xss")</script>',
    });
    const html = renderAdmin(user);
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("falls back to 'natb1' when displayName is null", () => {
    const user = makeUser({ screenName: "natb1", displayName: null });
    const html = renderAdmin(user);
    expect(html).toContain("natb1");
  });
});
