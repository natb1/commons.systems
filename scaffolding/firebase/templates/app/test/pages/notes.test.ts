import { describe, it, expect, vi } from "vitest";

vi.mock("../../src/auth.js", () => ({
  auth: { currentUser: null },
}));

vi.mock("../../src/firestore.js", () => ({
  getNotes: vi.fn(),
}));

import { renderNotes } from "../../src/pages/notes";
import { auth } from "../../src/auth";
import { getNotes } from "../../src/firestore";

const mockGetNotes = vi.mocked(getNotes);

describe("renderNotes", () => {
  it("returns auth-required message when user is not signed in", async () => {
    auth.currentUser = null;
    const html = await renderNotes();
    expect(html).toContain('id="notes-auth-required"');
    expect(html).not.toContain('id="notes-list"');
  });

  it("renders notes list when user is signed in", async () => {
    // Cast to allow setting currentUser on the mock
    (auth as { currentUser: unknown }).currentUser = {
      uid: "user-1",
      displayName: "Test User",
    };
    mockGetNotes.mockResolvedValue([
      { id: "n1", text: "First note", createdAt: "2026-01-01" },
      { id: "n2", text: "Second note", createdAt: "2026-01-02" },
    ]);

    const html = await renderNotes();

    expect(html).toContain('id="notes-list"');
    expect(html).toContain("<li>First note</li>");
    expect(html).toContain("<li>Second note</li>");
    expect(html).not.toContain('id="notes-auth-required"');
  });

  it("renders error message when getNotes throws", async () => {
    (auth as { currentUser: unknown }).currentUser = {
      uid: "user-1",
      displayName: "Test User",
    };
    mockGetNotes.mockRejectedValue(new Error("permission denied"));

    const html = await renderNotes();

    expect(html).toContain('id="notes-error"');
    expect(html).not.toContain('id="notes-list"');
  });
});
