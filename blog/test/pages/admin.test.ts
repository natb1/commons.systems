import { describe, it, expect } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { User } from "firebase/auth";
import { Admin } from "../../src/pages/Admin.tsx";

// Local static-markup helper reproducing the former renderAdmin bridge
// (deleted with src/pages/admin.ts). It renders the frozen Admin component to a
// string so every assertion body below stays identical and its coverage of
// Admin's rendered output is preserved.
function renderAdmin(user: User | null, isAdmin: boolean, skippedCount = 0): string {
  return renderToStaticMarkup(createElement(Admin, { user, isAdmin, skippedCount }));
}

function makeUser(overrides?: { displayName?: string | null; email?: string | null }): User {
  return {
    displayName: overrides?.displayName ?? null,
    email: overrides?.email ?? "test@example.com",
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

  it("escapes displayName containing HTML (React single-escaping)", () => {
    const user = makeUser({ displayName: '<script>alert("xss")</script>' });
    const html = renderAdmin(user, true);
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("single-escapes displayName containing & (no double-escaping)", () => {
    const user = makeUser({ displayName: "Alice & Bob" });
    const html = renderAdmin(user, true);
    // React escapes & to &amp; exactly once; double-escaping would produce &amp;amp;
    expect(html).toContain("&amp;");
    expect(html).not.toContain("&amp;amp;");
  });

  it("falls back to email when displayName is null", () => {
    const user = makeUser({ displayName: null });
    const html = renderAdmin(user, true);
    expect(html).toContain("test@example.com");
  });

  it("shows warning when skippedCount > 0", () => {
    const user = makeUser({ displayName: "Admin User" });
    const html = renderAdmin(user, true, 3);
    expect(html).toContain('class="warning"');
    expect(html).toContain("Warning: 3 post(s) have missing required fields.");
  });

  it("omits warning when skippedCount is 0", () => {
    const user = makeUser({ displayName: "Admin User" });
    const html = renderAdmin(user, true, 0);
    expect(html).not.toContain("warning");
  });
});
