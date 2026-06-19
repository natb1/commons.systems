import { describe, it, expect } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { BlogNav, type BlogNavProps } from "../../src/components/BlogNav";
import type { NavLink } from "@commons-systems/ds";

const NAV_LINKS: NavLink[] = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About", align: "end" },
];

function render(overrides: Partial<BlogNavProps> = {}): string {
  const props: BlogNavProps = {
    links: NAV_LINKS,
    showHomeLink: true,
    showAuth: false,
    user: null,
    onSignIn: () => {},
    onSignOut: () => {},
    ...overrides,
  };
  return renderToStaticMarkup(createElement(BlogNav, props));
}

describe("BlogNav", () => {
  it("renders the nav links via the ds Nav", () => {
    const html = render();
    expect(html).toContain("cs-nav");
    expect(html).toContain('href="/"');
    expect(html).toContain("Home");
    expect(html).toContain('href="/about"');
    expect(html).toContain("About");
  });

  it("renders the home link when showHomeLink is true", () => {
    const html = render({ showHomeLink: true });
    expect(html).toContain('href="https://commons.systems/"');
    expect(html).toContain("commons.systems");
  });

  it("omits the home link when showHomeLink is false", () => {
    const html = render({ showHomeLink: false });
    expect(html).not.toContain("https://commons.systems/");
  });

  it("shows the sign-in control when showAuth is true and no user", () => {
    const html = render({ showAuth: true, user: null });
    expect(html).toContain('id="sign-in"');
    expect(html).toContain("Login");
    expect(html).not.toContain('id="sign-out"');
    expect(html).not.toContain('id="user-display"');
  });

  it("shows the user display and sign-out control when showAuth is true and a user is present", () => {
    const html = render({
      showAuth: true,
      user: { displayName: "Ada Lovelace", email: "ada@example.com" },
    });
    expect(html).toContain('id="user-display"');
    expect(html).toContain("Ada Lovelace");
    expect(html).toContain('id="sign-out"');
    expect(html).toContain("Logout");
    expect(html).not.toContain('id="sign-in"');
  });

  it("falls back to email then 'User' for the display label", () => {
    const emailOnly = render({
      showAuth: true,
      user: { displayName: null, email: "ada@example.com" },
    });
    expect(emailOnly).toContain("ada@example.com");

    const neither = render({
      showAuth: true,
      user: { displayName: null, email: null },
    });
    expect(neither).toContain(">User<");
  });

  it("renders no auth controls when showAuth is false (anonymous prerender shape)", () => {
    const html = render({ showAuth: false, user: null });
    expect(html).not.toContain("Login");
    expect(html).not.toContain('id="sign-in"');
    expect(html).not.toContain('id="sign-out"');
    expect(html).not.toContain('id="user-display"');
    // home link still present in the anonymous shape
    expect(html).toContain("commons.systems");
  });
});
