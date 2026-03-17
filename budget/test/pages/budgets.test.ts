import { describe, it, expect, vi, beforeEach } from "vitest";
import { DataIntegrityError } from "@commons-systems/firestoreutil/errors";

vi.mock("firebase/firestore", () => ({
  Timestamp: class Timestamp {
    _date: Date;
    constructor(d: Date) { this._date = d; }
    toDate() { return this._date; }
    toMillis() { return this._date.getTime(); }
    static fromDate(d: Date) { return new Timestamp(d); }
  },
}));

vi.mock("../../src/firestore.js", () => ({
  getBudgets: vi.fn(),
  getBudgetPeriods: vi.fn(),
}));

import { renderBudgets } from "../../src/pages/budgets";
import { getBudgets, getBudgetPeriods, type Budget } from "../../src/firestore";

const mockGetBudgets = vi.mocked(getBudgets);
const mockGetBudgetPeriods = vi.mocked(getBudgetPeriods);

const mockUser = { uid: "user-123" } as import("firebase/auth").User;
const mockGroup = { id: "household", name: "household" };

function budget(overrides: Partial<Budget> = {}): Budget {
  return {
    id: "food",
    name: "Food",
    weeklyAllowance: 150,
    rollover: "none",
    groupId: null,
    ...overrides,
  };
}

function mockDefaults(): void {
  mockGetBudgets.mockResolvedValue([]);
  mockGetBudgetPeriods.mockResolvedValue([]);
}

describe("renderBudgets", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns HTML containing a Budgets heading", async () => {
    mockDefaults();
    const html = await renderBudgets({ user: null, group: null, groupError: false });
    expect(html).toContain("<h2>Budgets</h2>");
  });

  it("shows seed data notice for unauthorized users", async () => {
    mockDefaults();
    const html = await renderBudgets({ user: null, group: null, groupError: false });
    expect(html).toContain('id="seed-data-notice"');
    expect(html).toContain("Sign in to see your budgets");
  });

  it("does not show seed data notice for authorized users", async () => {
    mockDefaults();
    const html = await renderBudgets({ user: mockUser, group: mockGroup, groupError: false });
    expect(html).not.toContain('id="seed-data-notice"');
  });

  it("shows 'not a member' notice for signed-in user without groups", async () => {
    mockDefaults();
    const html = await renderBudgets({ user: mockUser, group: null, groupError: false });
    expect(html).toContain("not a member of any groups");
  });

  it("renders budget table with data", async () => {
    mockGetBudgets.mockResolvedValue([budget()]);
    mockGetBudgetPeriods.mockResolvedValue([]);
    const html = await renderBudgets({ user: null, group: null, groupError: false });
    expect(html).toContain('id="budgets-table"');
    expect(html).toContain("Food");
    expect(html).toContain("150");
  });

  it("renders error fallback when Firestore fails", async () => {
    mockGetBudgets.mockRejectedValue(new Error("connection failed"));
    mockGetBudgetPeriods.mockResolvedValue([]);
    const html = await renderBudgets({ user: null, group: null, groupError: false });
    expect(html).toContain("Could not load data");
    expect(html).toContain('id="budgets-error"');
  });

  it("re-throws RangeError instead of showing fallback", async () => {
    mockGetBudgets.mockRejectedValue(new RangeError("out of range"));
    mockGetBudgetPeriods.mockResolvedValue([]);
    await expect(renderBudgets({ user: null, group: null, groupError: false })).rejects.toThrow(RangeError);
  });

  it("re-throws DataIntegrityError instead of showing fallback", async () => {
    mockGetBudgets.mockRejectedValue(new DataIntegrityError("bad data"));
    mockGetBudgetPeriods.mockResolvedValue([]);
    await expect(renderBudgets({ user: null, group: null, groupError: false })).rejects.toThrow(DataIntegrityError);
  });

  it("shows group error when groupError is true for signed-in user", async () => {
    mockDefaults();
    const html = await renderBudgets({ user: mockUser, group: null, groupError: true });
    expect(html).toContain('id="group-error"');
    expect(html).toContain("Could not load group data");
  });

  it("renders empty state when no budgets", async () => {
    mockDefaults();
    const html = await renderBudgets({ user: null, group: null, groupError: false });
    expect(html).toContain("No budgets found.");
  });

  it("renders edit controls for authorized users", async () => {
    mockGetBudgets.mockResolvedValue([budget({ groupId: "household" })]);
    mockGetBudgetPeriods.mockResolvedValue([]);
    const html = await renderBudgets({ user: mockUser, group: mockGroup, groupError: false });
    expect(html).toContain('class="edit-name"');
    expect(html).toContain('class="edit-allowance"');
    expect(html).toContain('class="edit-rollover"');
    expect(html).toContain('data-budget-id="food"');
    expect(html).toContain('aria-label="Name"');
    expect(html).toContain('aria-label="Weekly allowance"');
    expect(html).toContain('aria-label="Rollover"');
  });

  it("renders disabled inputs for unauthorized users", async () => {
    mockGetBudgets.mockResolvedValue([budget()]);
    mockGetBudgetPeriods.mockResolvedValue([]);
    const html = await renderBudgets({ user: null, group: null, groupError: false });
    expect(html).toContain('class="edit-name"');
    expect(html).toContain("disabled");
    expect(html).not.toContain('data-budget-id=');
    expect(html).toContain("Food");
    expect(html).toContain("150");
    expect(html).toContain("None");
  });

  it("sorts budgets alphabetically by name", async () => {
    mockGetBudgets.mockResolvedValue([
      budget({ id: "vacation", name: "Vacation", weeklyAllowance: 100, rollover: "balance" }),
      budget({ id: "food", name: "Food", weeklyAllowance: 150, rollover: "none" }),
    ]);
    mockGetBudgetPeriods.mockResolvedValue([]);
    const html = await renderBudgets({ user: null, group: null, groupError: false });
    // Check order within the budgets-table section (after chart container)
    const tableStart = html.indexOf('id="budgets-table"');
    const tableHtml = html.slice(tableStart);
    const foodIdx = tableHtml.indexOf("Food");
    const vacationIdx = tableHtml.indexOf("Vacation");
    expect(foodIdx).toBeLessThan(vacationIdx);
  });

  it("renders rollover select with correct selected state", async () => {
    mockGetBudgets.mockResolvedValue([budget({ rollover: "debt", groupId: "household" })]);
    mockGetBudgetPeriods.mockResolvedValue([]);
    const html = await renderBudgets({ user: mockUser, group: mockGroup, groupError: false });
    expect(html).toContain('<option value="debt" selected>');
    expect(html).not.toContain('<option value="none" selected>');
  });

  it("renders rollover labels for unauthorized users", async () => {
    mockGetBudgets.mockResolvedValue([
      budget({ id: "a", name: "A", rollover: "none" }),
      budget({ id: "b", name: "B", rollover: "debt" }),
      budget({ id: "c", name: "C", rollover: "balance" }),
    ]);
    mockGetBudgetPeriods.mockResolvedValue([]);
    const html = await renderBudgets({ user: null, group: null, groupError: false });
    expect(html).toContain("None");
    expect(html).toContain("Debt only");
    expect(html).toContain("Full balance");
  });

  it("shows access denied message for permission-denied error", async () => {
    const error = new Error("permission denied");
    (error as any).code = "permission-denied";
    mockGetBudgets.mockRejectedValue(error);
    mockGetBudgetPeriods.mockResolvedValue([]);
    const html = await renderBudgets({ user: mockUser, group: mockGroup, groupError: false });
    expect(html).toContain("Access denied");
  });

  it("renders chart container with data attributes", async () => {
    mockGetBudgets.mockResolvedValue([budget()]);
    mockGetBudgetPeriods.mockResolvedValue([]);
    const html = await renderBudgets({ user: null, group: null, groupError: false });
    expect(html).toContain('id="budgets-chart"');
    expect(html).toContain('data-budgets="');
    expect(html).toContain('data-periods="');
  });

  it("renders date picker for chart navigation", async () => {
    mockGetBudgets.mockResolvedValue([budget()]);
    mockGetBudgetPeriods.mockResolvedValue([]);
    const html = await renderBudgets({ user: null, group: null, groupError: false });
    expect(html).toContain('id="chart-date-picker"');
    expect(html).toContain('type="date"');
    expect(html).not.toContain('id="chart-window"');
  });

  it("data attributes contain valid JSON", async () => {
    mockGetBudgets.mockResolvedValue([budget()]);
    mockGetBudgetPeriods.mockResolvedValue([]);
    const html = await renderBudgets({ user: null, group: null, groupError: false });
    // Extract data-budgets attribute value (HTML-escaped)
    const budgetsMatch = html.match(/data-budgets="([^"]*)"/);
    expect(budgetsMatch).not.toBeNull();
    // Unescape HTML entities for JSON parsing
    const unescaped = budgetsMatch![1].replace(/&quot;/g, '"').replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
    const budgetsJson = JSON.parse(unescaped);
    expect(budgetsJson).toHaveLength(1);
    expect(budgetsJson[0].name).toBe("Food");
  });
});
