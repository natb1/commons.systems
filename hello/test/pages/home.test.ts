import { describe, it, expect, vi } from "vitest";

vi.mock("../../src/firestore.js", () => ({
  getMessages: vi.fn(),
}));

import { renderHome } from "../../src/pages/home";
import { getMessages } from "../../src/firestore";

const mockGetMessages = vi.mocked(getMessages);

describe("renderHome", () => {
  it("returns HTML containing a Home heading", async () => {
    mockGetMessages.mockResolvedValue([]);
    const html = await renderHome();
    expect(html).toContain("<h2>Home</h2>");
  });

  it("returns HTML containing welcome text", async () => {
    mockGetMessages.mockResolvedValue([]);
    const html = await renderHome();
    expect(html).toContain("Welcome to the commons.systems hello app.");
  });

  it("renders messages with timestamps from Firestore", async () => {
    mockGetMessages.mockResolvedValue([
      { id: "1", text: "Hello world", author: "system", createdAt: "2026-01-01T00:00:00Z" },
      { id: "2", text: "Second message", author: "system", createdAt: "2026-01-02T00:00:00Z" },
    ]);
    const html = await renderHome();
    expect(html).toContain('<ul id="messages">');
    expect(html).toContain("Hello world");
    expect(html).toContain("Second message");
    expect(html).toContain('<time datetime="2026-01-01T00:00:00Z">');
    expect(html).toContain('<time datetime="2026-01-02T00:00:00Z">');
  });

  it("renders error fallback when Firestore fails", async () => {
    mockGetMessages.mockRejectedValue(new Error("connection failed"));
    const html = await renderHome();
    expect(html).toContain("Could not load messages");
    expect(html).toContain('id="messages-error"');
  });

  it("renders empty state when no messages", async () => {
    mockGetMessages.mockResolvedValue([]);
    const html = await renderHome();
    expect(html).toContain("No messages yet.");
  });
});
