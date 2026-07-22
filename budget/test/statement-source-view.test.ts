// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// --- Mocks for the data-source accessor and the FSA helper modules. ---
// Factories must be self-contained (vi.mock is hoisted above imports), so
// define the vi.fn()s inside each factory, then import the mocked modules to
// drive them from the tests.
vi.mock("../src/active-data-source.js", () => {
  const getStatements = vi.fn();
  return { getActiveDataSource: () => ({ getStatements }) };
});
vi.mock("../src/statements-dir.js", () => ({
  isDirectoryAccessSupported: vi.fn(),
  getStoredDirectoryHandle: vi.fn(),
  pickStatementsDirectory: vi.fn(),
  ensureReadPermission: vi.fn(),
}));
vi.mock("../src/statement-file-resolver.js", () => ({
  resolveSourceFile: vi.fn(),
}));

import { openStatementSource, isPdfName, pickSourceStatement } from "../src/pages/statement-source-view";
import type { Statement } from "../src/firestore.js";
import { getActiveDataSource } from "../src/active-data-source.js";
import * as statementsDir from "../src/statements-dir.js";
import * as resolver from "../src/statement-file-resolver.js";

// sid builds the branded StatementId from a plain string in test data.
const sid = (v: string): Statement["statementId"] =>
  v as unknown as Statement["statementId"]; // type-safety-ok: test-only branded StatementId construction

// Minimal Statement factory for pickSourceStatement tests — only the fields the
// picker reads (statementId, balanceDate, sourceFile) matter.
function srcStmt(overrides: Partial<Statement>): Statement {
  return {
    id: "id",
    statementId: sid("Bank-1234-2025-01"),
    institution: "Bank",
    account: "1234",
    balance: 0,
    period: "2025-01",
    balanceDate: null,
    lastTransactionDate: null,
    groupId: null,
    virtual: false,
    sourceFile: null,
    ...overrides,
  };
}

// Typed handles to the mocked functions.
const mockDataSource = getActiveDataSource() as unknown as {
  getStatements: ReturnType<typeof vi.fn>;
};
const mockStatementsDir = statementsDir as unknown as {
  isDirectoryAccessSupported: ReturnType<typeof vi.fn>;
  getStoredDirectoryHandle: ReturnType<typeof vi.fn>;
  pickStatementsDirectory: ReturnType<typeof vi.fn>;
  ensureReadPermission: ReturnType<typeof vi.fn>;
};
const mockResolver = resolver as unknown as {
  resolveSourceFile: ReturnType<typeof vi.fn>;
};

function dialogText(): string {
  const dialog = document.querySelector(".statement-source-dialog");
  return dialog?.textContent ?? "";
}

beforeEach(() => {
  vi.clearAllMocks();
  document.body.innerHTML = "";
  // Default to a supported environment; individual tests override.
  mockStatementsDir.isDirectoryAccessSupported.mockReturnValue(true);
});

afterEach(() => {
  document.body.innerHTML = "";
});

describe("isPdfName", () => {
  it("is true for .pdf in any case", () => {
    expect(isPdfName("x.pdf")).toBe(true);
    expect(isPdfName("X.PDF")).toBe(true);
    expect(isPdfName("a/b/c.Pdf")).toBe(true);
  });

  it("is false for non-pdf or malformed names", () => {
    expect(isPdfName("x.csv")).toBe(false);
    expect(isPdfName("x.qfx")).toBe(false);
    expect(isPdfName("x.ofx")).toBe(false);
    expect(isPdfName("pdf")).toBe(false);
    expect(isPdfName("x.pdf.csv")).toBe(false);
  });
});

describe("pickSourceStatement", () => {
  it("returns an exact statementId match (legacy month-keyed or virtual)", () => {
    const stmts = [
      srcStmt({ statementId: sid("Bank-1234-2025-01"), sourceFile: "legacy.qfx" }),
      srcStmt({ statementId: sid("Bank-1234-2025-01-31"), sourceFile: "date-keyed.qfx" }),
    ];
    expect(pickSourceStatement(stmts, "Bank-1234-2025-01")?.sourceFile).toBe("legacy.qfx");
  });

  it("resolves a month-keyed transaction id to a date-keyed anchor by prefix", () => {
    const stmts = [
      srcStmt({ statementId: sid("Bank-1234-2025-01-15"), balanceDate: "2025-01-15", sourceFile: "mid.qfx" }),
    ];
    expect(pickSourceStatement(stmts, "Bank-1234-2025-01")?.sourceFile).toBe("mid.qfx");
  });

  it("prefers the anchor with a sourceFile over one without", () => {
    const stmts = [
      srcStmt({ statementId: sid("Bank-1234-2025-01-31"), balanceDate: "2025-01-31", sourceFile: null }),
      srcStmt({ statementId: sid("Bank-1234-2025-01-15"), balanceDate: "2025-01-15", sourceFile: "mid.qfx" }),
    ];
    expect(pickSourceStatement(stmts, "Bank-1234-2025-01")?.sourceFile).toBe("mid.qfx");
  });

  it("among sourced anchors, prefers the latest balanceDate", () => {
    const stmts = [
      srcStmt({ statementId: sid("Bank-1234-2025-01-15"), balanceDate: "2025-01-15", sourceFile: "mid.qfx" }),
      srcStmt({ statementId: sid("Bank-1234-2025-01-28"), balanceDate: "2025-01-28", sourceFile: "late.qfx" }),
    ];
    expect(pickSourceStatement(stmts, "Bank-1234-2025-01")?.sourceFile).toBe("late.qfx");
  });

  it("does not match a different account's anchors sharing a numeric prefix boundary", () => {
    // "Bank-1234-2025-01" must not prefix-match "Bank-1234-2025-010" style ids;
    // the "-" separator guards the boundary. A different month is excluded.
    const stmts = [
      srcStmt({ statementId: sid("Bank-1234-2025-02-15"), sourceFile: "feb.qfx" }),
    ];
    expect(pickSourceStatement(stmts, "Bank-1234-2025-01")).toBeUndefined();
  });
});

describe("openStatementSource — message states", () => {
  it("shows an unsupported-browser message when directory access is unsupported", async () => {
    mockStatementsDir.isDirectoryAccessSupported.mockReturnValue(false);

    await openStatementSource("stmt-1");

    const message = document.querySelector(".statement-source-message");
    expect(message).not.toBeNull();
    expect(dialogText()).toContain("not supported in this browser");
    expect(mockDataSource.getStatements).not.toHaveBeenCalled();
  });

  it("shows the no-source-file message when the statement is not found", async () => {
    mockDataSource.getStatements.mockResolvedValue([]);

    await openStatementSource("missing");

    expect(document.querySelector(".statement-source-message")).not.toBeNull();
    expect(dialogText()).toContain("No source file is recorded for this statement");
  });

  it("shows the no-source-file message when the statement lacks a sourceFile", async () => {
    mockDataSource.getStatements.mockResolvedValue([
      { statementId: "stmt-1", sourceFile: null },
    ]);

    await openStatementSource("stmt-1");

    expect(dialogText()).toContain("No source file is recorded for this statement");
  });

  it("shows the file-not-found message when resolveSourceFile returns null", async () => {
    mockDataSource.getStatements.mockResolvedValue([
      { statementId: "stmt-1", sourceFile: "2024/chase.qfx" },
    ]);
    mockStatementsDir.getStoredDirectoryHandle.mockResolvedValue({ name: "dir" });
    mockStatementsDir.ensureReadPermission.mockResolvedValue(true);
    mockResolver.resolveSourceFile.mockResolvedValue(null);

    await openStatementSource("stmt-1");

    expect(dialogText()).toContain("Source file not found in the linked folder");
    // Only the basename is shown — not the full path (which encodes PII).
    expect(dialogText()).toContain("chase.qfx");
    expect(dialogText()).not.toContain("2024/chase.qfx");
  });

  it("shows the permission message when read permission is not granted", async () => {
    mockDataSource.getStatements.mockResolvedValue([
      { statementId: "stmt-1", sourceFile: "x.qfx" },
    ]);
    mockStatementsDir.getStoredDirectoryHandle.mockResolvedValue({ name: "dir" });
    mockStatementsDir.ensureReadPermission.mockResolvedValue(false);

    await openStatementSource("stmt-1");

    expect(dialogText()).toContain("Read permission is needed");
    expect(mockResolver.resolveSourceFile).not.toHaveBeenCalled();
  });

  it("offers a Link statements folder button when no handle is stored", async () => {
    mockDataSource.getStatements.mockResolvedValue([
      { statementId: "stmt-1", sourceFile: "x.qfx" },
    ]);
    mockStatementsDir.getStoredDirectoryHandle.mockResolvedValue(undefined);

    await openStatementSource("stmt-1");

    const button = document.querySelector(".statement-source-link-folder");
    expect(button).not.toBeNull();
    expect(button?.textContent).toContain("Link statements folder");
  });
});

describe("openStatementSource — success states", () => {
  it("renders escaped text for a non-pdf source file", async () => {
    mockDataSource.getStatements.mockResolvedValue([
      { statementId: "stmt-1", sourceFile: "x.qfx" },
    ]);
    mockStatementsDir.getStoredDirectoryHandle.mockResolvedValue({ name: "dir" });
    mockStatementsDir.ensureReadPermission.mockResolvedValue(true);
    const file = {
      name: "x.qfx",
      text: () => Promise.resolve("<OFX>raw & content</OFX>"),
    };
    mockResolver.resolveSourceFile.mockResolvedValue({
      getFile: () => Promise.resolve(file),
    });

    await openStatementSource("stmt-1");

    const pre = document.querySelector(".statement-source-text");
    expect(pre).not.toBeNull();
    // textContent reflects the raw text; escaping is handled by setting
    // textContent (no raw HTML injection).
    expect(pre?.textContent).toBe("<OFX>raw & content</OFX>");
    expect(pre?.querySelector("ofx")).toBeNull();
  });

  it("renders a sandboxed iframe for a PDF source file", async () => {
    mockDataSource.getStatements.mockResolvedValue([
      { statementId: "stmt-1", sourceFile: "stmt.pdf" },
    ]);
    mockStatementsDir.getStoredDirectoryHandle.mockResolvedValue({ name: "dir" });
    mockStatementsDir.ensureReadPermission.mockResolvedValue(true);
    const file = { name: "stmt.pdf" };
    // happy-dom does not implement URL.createObjectURL; stub it.
    const originalCreate = URL.createObjectURL;
    const originalRevoke = URL.revokeObjectURL;
    URL.createObjectURL = vi.fn(() => "blob:fake-url");
    URL.revokeObjectURL = vi.fn();
    mockResolver.resolveSourceFile.mockResolvedValue({
      getFile: () => Promise.resolve(file),
    });

    await openStatementSource("stmt-1");

    const frame = document.querySelector(".statement-source-frame") as HTMLIFrameElement | null;
    expect(frame).not.toBeNull();
    expect(frame?.getAttribute("sandbox")).toBe("allow-same-origin");

    URL.createObjectURL = originalCreate;
    URL.revokeObjectURL = originalRevoke;
  });
});

describe("openStatementSource — accessibility", () => {
  it("gives the dialog an aria-label", async () => {
    mockDataSource.getStatements.mockResolvedValue([]);

    await openStatementSource("any");

    const dialog = document.querySelector(".statement-source-dialog");
    expect(dialog?.getAttribute("aria-label")).toBe("Source statement viewer");
  });
});
