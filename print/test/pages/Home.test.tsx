import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { Home } from "../../src/pages/Home.tsx";
import type { User } from "../../src/auth.js";

const mockUser = {
  displayName: "Test User",
  email: "t@e.com",
} as unknown as User;

describe("Home", () => {
  it("always renders Library heading", () => {
    const html = renderToStaticMarkup(<Home mediaHtml="" user={null} />);
    expect(html).toContain("<h2>Library</h2>");
  });

  it("shows public-notice when user is null", () => {
    const html = renderToStaticMarkup(<Home mediaHtml="" user={null} />);
    expect(html).toContain('id="public-notice"');
    expect(html).toContain(
      "Showing public domain items. Sign in to see your full library.",
    );
  });

  it("does not show public-notice when user is set", () => {
    const html = renderToStaticMarkup(<Home mediaHtml="" user={mockUser} />);
    expect(html).not.toContain('id="public-notice"');
  });

  it("renders mediaHtml into the output", () => {
    const html = renderToStaticMarkup(
      <Home mediaHtml='<ul id="media-list"></ul>' user={null} />,
    );
    expect(html).toContain('<ul id="media-list"></ul>');
  });
});
