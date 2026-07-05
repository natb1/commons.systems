import { describe, it, expect, afterEach, beforeEach, vi } from "vitest";
import { render, cleanup, act, waitFor } from "@testing-library/react";

import type { PanelData } from "../src/panel-equality.js";
import type { Reminder } from "../src/reminders.js";

// Owner data now comes from a read-only on-disk snapshot re-read on window
// focus, not a 5-min Firestore refresh. This file covers the focus-reload path:
// a changed on-disk snapshot propagates to the panels; an unchanged file does
// not re-read. Mock the local-snapshot source + snapshot decoder + isEncrypted
// guard so the load is controllable (mirrors Dashboard.test.tsx).
vi.mock("../src/firebase.js", () => ({
  db: {},
  NAMESPACE: { project: "office-hours", env: "test" },
}));

// The shared helper mocks the local-snapshot source + snapshot decoder +
// isEncrypted guard (importing it registers the vi.mock factories) so the load
// is controllable per test via `mocks`.
import { mocks, fakeHandle } from "./helpers/local-snapshot-mocks.js";

import { Dashboard } from "../src/Dashboard.js";

// The history-band chart modules read --fg via getThemeFg; happy-dom has no
// stylesheet, so set it on the document root for the duration of each test.
beforeEach(() => {
  document.documentElement.style.setProperty("--fg", "#e8eaed");
  mocks.isSnapshotSupported.mockReturnValue(true);
  mocks.getSnapshotState.mockReturnValue("granted");
  mocks.restoreSnapshotHandle.mockResolvedValue("granted");
  mocks.getCurrentSnapshotHandle.mockReturnValue(fakeHandle);
  mocks.readSnapshotBytes.mockResolvedValue(new TextEncoder().encode("{}").buffer);
  mocks.isEncrypted.mockReturnValue(false);
});
afterEach(() => {
  document.documentElement.style.removeProperty("--fg");
  cleanup();
  vi.clearAllMocks();
});

const makeReminder = (title: string): Reminder => ({
  jitKey: `jit-${title}`,
  title,
  repo: "natb1/office-hours-test",
  issueNumber: 1,
  dueAt: new Date("2026-07-20T09:00:00Z"),
});

const panelWith = (reminders: Reminder[]): PanelData => ({
  samples: [],
  reminders,
  queueMetrics: null,
  issueSamples: [],
  topicUsage: [],
  projectSignals: null,
});

const COMPUTED_AT = new Date("2026-06-30T10:00:00Z");

const reminderTitles = (container: HTMLElement): string[] =>
  Array.from(container.querySelectorAll(".reminder-title")).map((el) => el.textContent ?? "");

describe("Dashboard focus-reload: changed snapshot propagates to the panels", () => {
  it("re-reads the file on window focus and updates the Reminders panel when the snapshot changed", async () => {
    // Mount load decodes the first snapshot.
    mocks.decodeSnapshot.mockReturnValueOnce({ data: panelWith([makeReminder("first-title")]), computedAt: COMPUTED_AT });

    const { container } = render(<Dashboard />);
    await waitFor(() => expect(reminderTitles(container)).toContain("first-title"));

    // The on-disk file changed → focus re-reads + decodes the new snapshot.
    mocks.hasExternallyChanged.mockResolvedValueOnce(true);
    mocks.decodeSnapshot.mockReturnValueOnce({
      data: panelWith([makeReminder("second-title")]),
      computedAt: new Date("2026-06-30T11:00:00Z"),
    });

    act(() => {
      window.dispatchEvent(new Event("focus"));
    });

    await waitFor(() => expect(reminderTitles(container)).toContain("second-title"));
    expect(reminderTitles(container)).not.toContain("first-title");
  });
});

describe("Dashboard focus-reload: unchanged file triggers no re-read", () => {
  it("does not re-read or re-decode when the on-disk file is unchanged on focus", async () => {
    mocks.decodeSnapshot.mockReturnValueOnce({ data: panelWith([makeReminder("stable-title")]), computedAt: COMPUTED_AT });

    const { container } = render(<Dashboard />);
    await waitFor(() => expect(reminderTitles(container)).toContain("stable-title"));

    const decodeCallsAfterMount = mocks.decodeSnapshot.mock.calls.length;
    const readCallsAfterMount = mocks.readSnapshotBytes.mock.calls.length;

    // File is unchanged → the focus handler bails after hasExternallyChanged.
    mocks.hasExternallyChanged.mockResolvedValue(false);
    await act(async () => {
      window.dispatchEvent(new Event("focus"));
      await Promise.resolve();
      await Promise.resolve();
    });

    // No second read/decode, and the panel is untouched.
    expect(mocks.decodeSnapshot.mock.calls.length).toBe(decodeCallsAfterMount);
    expect(mocks.readSnapshotBytes.mock.calls.length).toBe(readCallsAfterMount);
    expect(reminderTitles(container)).toEqual(["stable-title"]);
  });
});
