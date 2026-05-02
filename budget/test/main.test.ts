import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@commons-systems/router", () => ({
  createHistoryRouter: () => ({ navigate: vi.fn(), destroy: vi.fn(), showTerminalError: vi.fn() }),
  parsePath: () => ({ path: "/", params: new URLSearchParams() }),
}));
vi.mock("../src/pages/home.js", () => ({ renderHome: vi.fn().mockResolvedValue("<div>home</div>") }));
vi.mock("@commons-systems/components/nav", () => ({}));
vi.mock("@commons-systems/htmlutil", () => ({ escapeHtml: (s: string) => s }));
vi.mock("../src/pages/home-hydrate.js", () => ({ hydrateTransactionTable: vi.fn() }));
vi.mock("../src/pages/home-chart.js", () => ({ hydrateCategorySankey: vi.fn() }));
vi.mock("../src/pages/budgets.js", () => ({ renderBudgets: vi.fn().mockResolvedValue("<div>budgets</div>") }));
vi.mock("../src/pages/budgets-hydrate.js", () => ({ hydrateBudgetTable: vi.fn(), hydrateBudgetChart: vi.fn() }));
vi.mock("../src/pages/rules.js", () => ({ renderRules: vi.fn().mockResolvedValue("<div>rules</div>") }));
vi.mock("../src/pages/rules-hydrate.js", () => ({ hydrateRulesTable: vi.fn() }));
vi.mock("../src/pages/hero.js", () => ({ renderHero: vi.fn().mockReturnValue("<div>hero</div>") }));
vi.mock("@commons-systems/components/hero", () => ({ hydrateHero: vi.fn(), mountHero: vi.fn() }));
vi.mock("@commons-systems/components/autocomplete", () => ({
  showDropdown: vi.fn(),
  removeDropdown: vi.fn(),
  registerAutocompleteListeners: vi.fn(),
  _resetForTest: vi.fn(),
}));
vi.mock("../src/firebase.js", () => ({
  db: { type: "mock-firestore" },
  NAMESPACE: "app/test",
  trackPageView: vi.fn(),
  initAppCheck: vi.fn().mockResolvedValue(undefined),
}));

const mockGetMeta = vi.fn();
const mockStoreParsedData = vi.fn();
const mockClearAll = vi.fn();

vi.mock("../src/idb.js", () => ({
  getMeta: mockGetMeta,
  storeParsedData: mockStoreParsedData,
  clearAll: mockClearAll,
}));

vi.mock("../src/upload.js", () => ({
  parseUploadedJson: vi.fn(),
  toParsedData: vi.fn(),
  UploadValidationError: class extends Error {
    constructor(msg: string) { super(msg); this.name = "UploadValidationError"; }
  },
}));

vi.mock("../src/data-source.js", () => ({
  SeedDataSource: class { getTransactions() { return []; } },
  IdbDataSource: class { getTransactions() { return []; } },
}));

vi.mock("../src/active-data-source.js", () => ({
  setActiveDataSource: vi.fn(),
}));

function resetAndMockAll(): void {
  vi.resetModules();
  document.body.innerHTML = '<div id="nav"><span class="nav-auth"></span></div><div id="hero-container"></div><div id="app"></div>';

  vi.mock("@commons-systems/router", () => ({
    createHistoryRouter: () => ({ navigate: vi.fn(), destroy: vi.fn(), showTerminalError: vi.fn() }),
    parsePath: () => ({ path: "/", params: new URLSearchParams() }),
  }));
  vi.mock("../src/pages/home.js", () => ({ renderHome: vi.fn().mockResolvedValue("<div>home</div>") }));
  vi.mock("@commons-systems/components/nav", () => ({}));
  vi.mock("@commons-systems/htmlutil", () => ({ escapeHtml: (s: string) => s }));
  vi.mock("../src/pages/home-hydrate.js", () => ({ hydrateTransactionTable: vi.fn() }));
  vi.mock("../src/pages/budgets.js", () => ({ renderBudgets: vi.fn().mockResolvedValue("<div>budgets</div>") }));
  vi.mock("../src/pages/budgets-hydrate.js", () => ({ hydrateBudgetTable: vi.fn(), hydrateBudgetChart: vi.fn() }));
  vi.mock("../src/pages/rules.js", () => ({ renderRules: vi.fn().mockResolvedValue("<div>rules</div>") }));
  vi.mock("../src/pages/rules-hydrate.js", () => ({ hydrateRulesTable: vi.fn() }));
  vi.mock("@commons-systems/components/autocomplete", () => ({
    showDropdown: vi.fn(), removeDropdown: vi.fn(), registerAutocompleteListeners: vi.fn(), _resetForTest: vi.fn(),
  }));
  vi.mock("../src/firebase.js", () => ({
    db: { type: "mock-firestore" }, NAMESPACE: "app/test", trackPageView: vi.fn(),
    initAppCheck: vi.fn().mockResolvedValue(undefined),
  }));
  vi.mock("../src/idb.js", () => ({
    getMeta: mockGetMeta, storeParsedData: mockStoreParsedData, clearAll: mockClearAll,
  }));
  vi.mock("../src/upload.js", () => ({
    parseUploadedJson: vi.fn(), toParsedData: vi.fn(),
    UploadValidationError: class extends Error { constructor(msg: string) { super(msg); this.name = "UploadValidationError"; } },
  }));
  vi.mock("../src/data-source.js", () => ({
    FirestoreSeedDataSource: class {}, IdbDataSource: class {},
  }));
  vi.mock("../src/active-data-source.js", () => ({
    setActiveDataSource: vi.fn(),
  }));
}

// Set up DOM elements before dynamic import
document.body.innerHTML = '<div id="nav"><span class="nav-auth"></span></div><div id="hero-container"></div><div id="app"></div>';

type AppState = import("../src/main").AppState;

describe("main module", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("exports AppState type (compile-time check)", () => {
    // TypeScript compile-time: verify AppState type can be used
    const seedState: AppState = { source: "seed" };
    const localState: AppState = { source: "local", groupName: "household" };
    expect(seedState.source).toBe("seed");
    expect(localState.source).toBe("local");
  });

  it("transitions to seed state when no local data exists — hero visible", async () => {
    mockGetMeta.mockResolvedValue(undefined);

    resetAndMockAll();

    await import("../src/main");

    // Wait for initialization to complete
    await new Promise(r => setTimeout(r, 0));

    expect(mockGetMeta).toHaveBeenCalled();
    const heroContainer = document.getElementById("hero-container")!;
    expect(heroContainer.hidden).toBe(false);
  });

  it("does not call initAppCheck before user interaction", async () => {
    mockGetMeta.mockResolvedValue(undefined);
    resetAndMockAll();

    await import("../src/main");
    await new Promise(r => setTimeout(r, 0));

    const { initAppCheck } = await import("../src/firebase.js");
    expect(initAppCheck).not.toHaveBeenCalled();
  });

  it("calls initAppCheck on first user interaction", async () => {
    mockGetMeta.mockResolvedValue(undefined);
    resetAndMockAll();

    await import("../src/main");
    await new Promise(r => setTimeout(r, 0));

    const { initAppCheck } = await import("../src/firebase.js");
    const mock = initAppCheck as ReturnType<typeof vi.fn>;
    const callsBefore = mock.mock.calls.length;

    window.dispatchEvent(new Event("click"));
    await new Promise(r => setTimeout(r, 0));
    const callsAfterFirst = mock.mock.calls.length;
    expect(callsAfterFirst).toBeGreaterThan(callsBefore);

    // Second interaction should not add more calls (listener removed)
    window.dispatchEvent(new Event("click"));
    await new Promise(r => setTimeout(r, 0));
    expect(mock.mock.calls.length).toBe(callsAfterFirst);
  });

  it("transitions to local state when meta exists — hero hidden", async () => {
    mockGetMeta.mockResolvedValue({
      key: "upload",
      groupName: "household",
      version: 1,
      exportedAt: "2025-06-15T10:30:00Z",
    });

    resetAndMockAll();

    await import("../src/main");

    // Wait for initialization to complete
    await new Promise(r => setTimeout(r, 0));

    expect(mockGetMeta).toHaveBeenCalled();
    const heroContainer = document.getElementById("hero-container")!;
    expect(heroContainer.hidden).toBe(true);
  });
});
