import { vi } from "vitest";

// Shared local-snapshot mock surface for the Dashboard test files
// (Dashboard.test.tsx, Dashboard.refresh.test.tsx, Dashboard.rerender.test.tsx).
// Owner data comes from a read-only on-disk snapshot: the startup restore
// decodes it into PanelData, and a window focus re-reads + merges it. These
// mocks make the local-snapshot source + snapshot decoder + isEncrypted guard
// controllable. Importing this module registers the vi.mock factories as a side
// effect, so import it before "../src/Dashboard.js" in each test file.
export const mocks = {
  isSnapshotSupported: vi.fn(),
  getSnapshotState: vi.fn(),
  pickSnapshotFile: vi.fn(),
  restoreSnapshotHandle: vi.fn(),
  regrantSnapshot: vi.fn(),
  readSnapshotBytes: vi.fn(),
  hasExternallyChanged: vi.fn(),
  getCurrentSnapshotHandle: vi.fn(),
  decodeSnapshot: vi.fn(),
  loadSnapshotPanelData: vi.fn(),
  isEncrypted: vi.fn(),
};

vi.mock("../../src/local-snapshot-source.js", () => ({
  isSnapshotSupported: mocks.isSnapshotSupported,
  getSnapshotState: mocks.getSnapshotState,
  pickSnapshotFile: mocks.pickSnapshotFile,
  restoreSnapshotHandle: mocks.restoreSnapshotHandle,
  regrantSnapshot: mocks.regrantSnapshot,
  readSnapshotBytes: mocks.readSnapshotBytes,
  hasExternallyChanged: mocks.hasExternallyChanged,
  getCurrentSnapshotHandle: mocks.getCurrentSnapshotHandle,
}));
vi.mock("../../src/snapshot.js", () => ({
  decodeSnapshot: mocks.decodeSnapshot,
  loadSnapshotPanelData: mocks.loadSnapshotPanelData,
}));
vi.mock("../../src/crypto.js", () => ({
  isEncrypted: mocks.isEncrypted,
}));

export const fakeHandle = {} as FileSystemFileHandle; // type-safety-ok: readSnapshotBytes/hasExternallyChanged are mocked, so the handle is never dereferenced
