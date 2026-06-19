import { describe, it, expect, afterEach, vi } from "vitest";
import { render, cleanup } from "@testing-library/react";

// Dashboard.tsx imports db/NAMESPACE from firebase.js, whose createAppContext
// requires VITE_FIREBASE_* env at module load. The demo tier (user=null) never
// touches them, so a trivial stub keeps the render unit isolated from Firebase
// config (mirrors audio's home test mocking the firebase-pulling module).
vi.mock("../src/firebase.js", () => ({
  db: {},
  NAMESPACE: { project: "office-hours", env: "test" },
}));

import { Dashboard } from "../src/Dashboard.js";

afterEach(() => cleanup());

// The demo tier renders with no Firebase user, so it needs no Firestore mock:
// it reads from the synchronous getDemo* seed getters.
describe("Dashboard demo tier (user=null)", () => {
  it("renders the demo banner with the exact copy", () => {
    const { container } = render(<Dashboard user={null} />);
    const banner = container.querySelector(".demo-banner");
    expect(banner).not.toBeNull();
    expect(banner!.getAttribute("role")).toBe("status");
    expect(banner!.textContent).toBe("Demo data — sign in to see your queue.");
  });

  it("renders the panel grid with all seven panels", () => {
    const { container } = render(<Dashboard user={null} />);
    const grid = container.querySelector(".panel-grid");
    expect(grid).not.toBeNull();
    // capacity, pace, history, backlog, audit, reminders, queue-metrics
    expect(grid!.children).toHaveLength(7);
  });

  it("marks the three full-width panels (history, backlog, audit) as panel-grid-full", () => {
    const { container } = render(<Dashboard user={null} />);
    const full = container.querySelectorAll(".panel-grid > .panel-grid-full");
    expect(full).toHaveLength(3);
  });

  it("does not render the error state", () => {
    const { container } = render(<Dashboard user={null} />);
    expect(container.querySelector(".error")).toBeNull();
  });
});
