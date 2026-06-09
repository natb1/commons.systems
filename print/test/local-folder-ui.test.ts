import { describe, it, expect } from "vitest";

// Importing local-folder-ui.ts transitively imports library.ts and
// pages/home.ts, both of which touch print/src/firebase.ts (initializeApp at
// module load). Mock the firebase-touching modules so the module under test
// imports cleanly with no real firebase init. createFsaHandleStore is
// side-effect-free at construction (it only stores config and lazily opens
// IndexedDB), so it needs no mock.
import { vi } from "vitest";
vi.mock("../src/firebase.js", () => ({ storage: {}, STORAGE_NAMESPACE: "media" }));
vi.mock("../src/media-cache.js", () => ({ blobCache: {} }));
vi.mock("../src/firestore.js", () => ({
  getPublicMedia: () => Promise.resolve([]),
  getAllAccessibleMedia: () => Promise.resolve([]),
  getMediaItem: () => Promise.resolve(null),
}));
vi.mock("../src/storage.js", () => ({
  getMediaDownloadUrl: () => Promise.resolve(""),
}));

import { decideFolderUiState } from "../src/local-folder-ui.js";

describe("decideFolderUiState", () => {
  it("returns 'open' when no handle is persisted (null)", () => {
    expect(decideFolderUiState(null, "granted")).toBe("open");
  });

  it("returns 'open' when no handle is persisted (undefined)", () => {
    expect(decideFolderUiState(undefined, "granted")).toBe("open");
  });

  it("returns 'list' for a handle with granted permission", () => {
    expect(decideFolderUiState({}, "granted")).toBe("list");
  });

  it("returns 'grant' for a handle in the prompt state", () => {
    expect(decideFolderUiState({}, "prompt")).toBe("grant");
  });

  it("returns 'open' for a handle with denied permission", () => {
    expect(decideFolderUiState({}, "denied")).toBe("open");
  });

  it("returns 'open' for an unknown permission string", () => {
    expect(decideFolderUiState({}, "something-else")).toBe("open");
  });
});
