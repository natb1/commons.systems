import { describe, it, expect } from "vitest";
import type { User } from "firebase/auth";
import { renderNav } from "../../src/components/nav";

const mockUser = {
  displayName: "Test User",
  email: "test@example.com",
  providerData: [],
} as unknown as User;

describe("renderNav", () => {
  it("always includes a link to the home route", () => {
    const html = renderNav(null, "/");
    expect(html).toContain('href="#/"');
  });

  it("does not include a link to /about", () => {
    const html = renderNav(null, "/");
    expect(html).not.toContain('href="#/about"');
  });

  it("does not include a link to /notes", () => {
    const html = renderNav(null, "/");
    expect(html).not.toContain('href="#/notes"');
  });

  it("shows no auth elements when currentPath is / and user is null", () => {
    const html = renderNav(null, "/");
    expect(html).not.toContain('id="sign-in"');
    expect(html).not.toContain('id="sign-out"');
  });

  it("shows sign-in link when currentPath is /admin and user is null", () => {
    const html = renderNav(null, "/admin");
    expect(html).toContain('id="sign-in"');
    expect(html).not.toContain('id="sign-out"');
  });

  it("shows sign-out link and user display when currentPath is /admin and user is present", () => {
    const html = renderNav(mockUser, "/admin");
    expect(html).toContain('id="sign-out"');
    expect(html).toContain('id="user-display"');
    expect(html).toContain("Test User");
    expect(html).not.toContain('id="sign-in"');
  });

  it("shows no auth elements when currentPath is / and user is present", () => {
    const html = renderNav(mockUser, "/");
    expect(html).not.toContain('id="sign-in"');
    expect(html).not.toContain('id="sign-out"');
  });

  it("shows no auth elements when currentPath is /post/something and user is null", () => {
    const html = renderNav(null, "/post/hello-world");
    expect(html).not.toContain('id="sign-in"');
    expect(html).not.toContain('id="sign-out"');
  });

  it("escapes special characters in user display name", () => {
    const xssUser = {
      displayName: "<script>alert(1)</script>",
      email: "xss@example.com",
      providerData: [],
    } as unknown as User;
    const html = renderNav(xssUser, "/admin");
    expect(html).not.toContain("<script>");
  });

  it("always includes a panel toggle button", () => {
    const html = renderNav(null, "/");
    expect(html).toContain('id="panel-toggle"');
  });

  it("panel toggle has correct aria-label", () => {
    const html = renderNav(null, "/");
    expect(html).toContain('aria-label="Toggle info panel"');
  });

  it("panel toggle has aria-expanded false by default", () => {
    const html = renderNav(null, "/");
    expect(html).toContain('aria-expanded="false"');
  });
});
