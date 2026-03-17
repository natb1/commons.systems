import { describe, it, expect, vi, beforeEach } from "vitest";
import { DataIntegrityError } from "../src/errors";

// Mock all modules that main.ts imports at the top level
vi.mock("@commons-systems/router", () => ({
  createHistoryRouter: () => ({ navigate: vi.fn(), destroy: vi.fn(), showTerminalError: vi.fn() }),
  parsePath: () => ({ path: "/", params: new URLSearchParams() }),
}));
vi.mock("../src/pages/home.js", () => ({ renderHome: vi.fn().mockResolvedValue("<div>home</div>") }));
vi.mock("@commons-systems/style/components/nav", () => ({}));
vi.mock("@commons-systems/htmlutil", () => ({ escapeHtml: (s: string) => s }));
vi.mock("../src/pages/home-hydrate.js", () => ({ hydrateTransactionTable: vi.fn() }));
vi.mock("../src/pages/budgets.js", () => ({ renderBudgets: vi.fn().mockResolvedValue("<div>budgets</div>") }));
vi.mock("../src/pages/budgets-hydrate.js", () => ({ hydrateBudgetTable: vi.fn(), hydrateBudgetChart: vi.fn() }));
vi.mock("../src/pages/rules.js", () => ({ renderRules: vi.fn().mockResolvedValue("<div>rules</div>") }));
vi.mock("../src/pages/rules-hydrate.js", () => ({ hydrateRulesTable: vi.fn() }));
vi.mock("@commons-systems/style/components/autocomplete", () => ({
  showDropdown: vi.fn(),
  removeDropdown: vi.fn(),
  registerAutocompleteListeners: vi.fn(),
  _resetForTest: vi.fn(),
}));
vi.mock("@commons-systems/authutil/groups", () => ({
  getUserGroups: vi.fn(),
}));
vi.mock("../src/firebase.js", () => ({
  db: { type: "mock-firestore" },
  NAMESPACE: "app/test",
  trackPageView: vi.fn(),
}));
vi.mock("../src/auth.js", () => ({
  auth: {},
  signIn: vi.fn(),
  signOut: vi.fn().mockResolvedValue(undefined),
  onAuthStateChanged: vi.fn(),
}));

// Set up DOM elements that main.ts expects at module load, then dynamically import
document.body.innerHTML = '<div id="nav"></div><div id="app"></div>';

type User = import("firebase/auth").User;
type Group = import("@commons-systems/authutil/groups").Group;
type AppState = import("../src/main").AppState;
type AuthStateDeps = import("../src/main").AuthStateDeps;

const { createAuthStateHandler } = await import("../src/main");

const mockUser = { uid: "user-123" } as User;
const mockUser2 = { uid: "user-456" } as User;
const mockGroups: Group[] = [{ id: "household", name: "household" }];

interface TestContext {
  state: AppState;
  transitionCalls: AppState[];
  appHtml: string;
}

function createDeps(overrides: Partial<AuthStateDeps> = {}): {
  deps: AuthStateDeps;
  ctx: TestContext;
} {
  const ctx: TestContext = {
    state: { user: null, groups: [], groupError: false },
    transitionCalls: [],
    appHtml: "",
  };
  const deps: AuthStateDeps = {
    getUserGroups: vi.fn<(user: User) => Promise<Group[]>>().mockResolvedValue(mockGroups),
    transition: (next: AppState) => {
      ctx.state = next;
      ctx.transitionCalls.push(next);
    },
    showTerminalError: (html: string) => { ctx.appHtml = html; },
    getState: () => ctx.state,
    setState: (next: AppState) => { ctx.state = next; },
    ...overrides,
  };
  return { deps, ctx };
}

describe("createAuthStateHandler", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("transitions to unauthenticated state when user is null", async () => {
    const { deps, ctx } = createDeps();
    const handler = createAuthStateHandler(deps);

    await handler(null);

    expect(ctx.transitionCalls).toHaveLength(1);
    expect(ctx.transitionCalls[0]).toEqual({ user: null, groups: [], groupError: false });
  });

  it("transitions with fetched groups on sign-in", async () => {
    const { deps, ctx } = createDeps();
    const handler = createAuthStateHandler(deps);

    await handler(mockUser);

    expect(deps.getUserGroups).toHaveBeenCalledWith(mockUser);
    expect(ctx.transitionCalls).toHaveLength(1);
    expect(ctx.transitionCalls[0]).toEqual({ user: mockUser, groups: mockGroups, groupError: false });
  });

  it("skips transition when user changed during fetch (race guard)", async () => {
    const { deps, ctx } = createDeps({
      getUserGroups: vi.fn<(user: User) => Promise<Group[]>>().mockImplementation(async () => {
        // Simulate another auth callback changing the user mid-fetch
        deps.setState({ user: mockUser2, groups: [], groupError: false });
        return mockGroups;
      }),
    });
    const handler = createAuthStateHandler(deps);

    await handler(mockUser);

    expect(ctx.transitionCalls).toHaveLength(0);
  });

  it("shows terminal error on DataIntegrityError", async () => {
    const { deps, ctx } = createDeps({
      getUserGroups: vi.fn<(user: User) => Promise<Group[]>>().mockRejectedValue(
        new DataIntegrityError("bad data"),
      ),
    });
    const handler = createAuthStateHandler(deps);

    await handler(mockUser);

    expect(ctx.appHtml).toContain("data error");
    expect(ctx.transitionCalls).toHaveLength(0);
  });

  it("transitions with groupError on generic error", async () => {
    const { deps, ctx } = createDeps({
      getUserGroups: vi.fn<(user: User) => Promise<Group[]>>().mockRejectedValue(
        new Error("network failed"),
      ),
    });
    const handler = createAuthStateHandler(deps);

    await handler(mockUser);

    expect(ctx.transitionCalls).toHaveLength(1);
    expect(ctx.transitionCalls[0]).toEqual({ user: mockUser, groups: [], groupError: true });
  });

  it("re-throws TypeError as programmer error", async () => {
    const { deps, ctx } = createDeps({
      getUserGroups: vi.fn<(user: User) => Promise<Group[]>>().mockRejectedValue(
        new TypeError("cannot read property of undefined"),
      ),
    });
    const handler = createAuthStateHandler(deps);

    await expect(handler(mockUser)).rejects.toThrow(TypeError);
    expect(ctx.transitionCalls).toHaveLength(0);
  });

  it("re-throws ReferenceError as programmer error", async () => {
    const { deps, ctx } = createDeps({
      getUserGroups: vi.fn<(user: User) => Promise<Group[]>>().mockRejectedValue(
        new ReferenceError("x is not defined"),
      ),
    });
    const handler = createAuthStateHandler(deps);

    await expect(handler(mockUser)).rejects.toThrow(ReferenceError);
    expect(ctx.transitionCalls).toHaveLength(0);
  });
});
