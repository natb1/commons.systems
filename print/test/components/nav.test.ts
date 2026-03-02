import { describe, it, expect } from "vitest";
import type { User } from "firebase/auth";
import { renderNav } from "../../src/components/nav";

const mockUser = {
  displayName: "Test User",
  email: "test@example.com",
  providerData: [],
} as unknown as User;

describe("renderNav", () => {
  it("always includes a Library link", () => {
    const html = renderNav(null);

    expect(html).toContain('href="#/"');
    expect(html).toContain("Library");
  });

  it("shows Login link when user is null", () => {
    const html = renderNav(null);

    expect(html).toContain('id="sign-in"');
    expect(html).toContain("Login");
    expect(html).not.toContain('id="sign-out"');
  });

  it("shows user display name and Logout when user is present", () => {
    const html = renderNav(mockUser);

    expect(html).toContain('id="sign-out"');
    expect(html).toContain('id="user-display"');
    expect(html).toContain("Test User");
    expect(html).toContain("Logout");
    expect(html).not.toContain('id="sign-in"');
  });

  it("falls back to email when displayName is null", () => {
    const emailOnlyUser = {
      displayName: null,
      email: "user@example.com",
      providerData: [],
    } as unknown as User;

    const html = renderNav(emailOnlyUser);

    expect(html).toContain("user@example.com");
  });

  it("falls back to 'User' when both displayName and email are null", () => {
    const noNameUser = {
      displayName: null,
      email: null,
      providerData: [],
    } as unknown as User;

    const html = renderNav(noNameUser);

    expect(html).toContain("User");
  });

  it("escapes special characters in user display name", () => {
    const xssUser = {
      displayName: "<script>alert(1)</script>",
      email: "xss@example.com",
      providerData: [],
    } as unknown as User;

    const html = renderNav(xssUser);

    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("escapes special characters in email fallback", () => {
    const xssUser = {
      displayName: null,
      email: "user+<tag>@example.com",
      providerData: [],
    } as unknown as User;

    const html = renderNav(xssUser);

    expect(html).not.toContain("<tag>");
    expect(html).toContain("&lt;tag&gt;");
  });
});
