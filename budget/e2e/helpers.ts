import path from "path";
import fs from "node:fs";
import crypto from "node:crypto";
import { fileURLToPath } from "url";
import type { Download, Page } from "@playwright/test";
import { SALT_LEN, IV_LEN, PBKDF2_ITERATIONS, KEY_LEN } from "../src/crypto-core.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const fixturePath = path.join(__dirname, "fixtures", "test-budget.json");

/**
 * Reads the static fixture and rewrites transaction/budget-period timestamps
 * to fall within the most recent 12-week window so they appear in the
 * initial home page render.
 */
function rewriteFixtureDates(): Buffer {
  const raw = JSON.parse(fs.readFileSync(fixturePath, "utf-8"));
  const recentDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 1 week ago
  const isoRecent = recentDate.toISOString();
  for (const txn of raw.transactions) {
    txn.timestamp = isoRecent;
  }
  for (const bp of raw.budgetPeriods ?? []) {
    const start = new Date(recentDate);
    start.setDate(start.getDate() - 7);
    bp.periodStart = start.toISOString();
    bp.periodEnd = isoRecent;
  }
  return Buffer.from(JSON.stringify(raw));
}

export async function uploadFixture(page: Page): Promise<void> {
  const fileInput = page.locator(".upload-input");
  await fileInput.setInputFiles({
    name: "test-budget.json",
    mimeType: "application/json",
    buffer: rewriteFixtureDates(),
  });
}

// Encrypts using the same BENC format as budget-etl (Go) and src/crypto-core.ts (Web Crypto).
// Uses Node.js crypto for Playwright e2e.
export function encryptBuffer(plaintext: Buffer, password: string): Buffer {
  const salt = crypto.randomBytes(SALT_LEN);
  const iv = crypto.randomBytes(IV_LEN);
  const key = crypto.pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, KEY_LEN, "sha256");
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([Buffer.from("BENC"), salt, iv, encrypted, tag]);
}

// Clicks Export and returns the resulting Download. Export reuses the import
// password automatically (encrypted if imported encrypted, plaintext otherwise).
export async function triggerExportDownload(page: Page): Promise<Download> {
  const downloadPromise = page.waitForEvent("download");
  await page.locator(".export-data").click();
  return downloadPromise;
}

export async function uploadEncryptedFixture(page: Page, password: string): Promise<void> {
  const plaintext = rewriteFixtureDates();
  const encrypted = encryptBuffer(plaintext, password);
  const fileInput = page.locator(".upload-input");
  await fileInput.setInputFiles({
    name: "encrypted-budget.json",
    mimeType: "application/octet-stream",
    buffer: encrypted,
  });
}

/**
 * Builds a synthetic fixture whose transactions span three months: the
 * most-recent-complete month (current), the month before that (prior), and
 * the same current month one year earlier (YoY). This lets the income
 * statement + cash flow summary renderers exercise all three periods.
 *
 * Placing transactions in the calendar month immediately preceding
 * `Date.now()` guarantees that month is the latest-with-data month selected
 * by `mostRecentMonthWithData` in `src/income-statement.ts` (which scans
 * for the most recent includable transaction strictly before the current
 * calendar month).
 */
function buildIncomeStatementFixtureBuffer(): Buffer {
  const now = new Date(Date.now());
  const nowYear = now.getUTCFullYear();
  const nowMonth0 = now.getUTCMonth();

  // Month immediately preceding the current calendar month (UTC).
  const currentYear = nowMonth0 === 0 ? nowYear - 1 : nowYear;
  const currentMonth0 = nowMonth0 === 0 ? 11 : nowMonth0 - 1;

  // priorMonth: month before currentMonth.
  const priorYear = currentMonth0 === 0 ? currentYear - 1 : currentYear;
  const priorMonth0 = currentMonth0 === 0 ? 11 : currentMonth0 - 1;

  // yoYMonth: currentMonth one year earlier.
  const yoYYear = currentYear - 1;
  const yoYMonth0 = currentMonth0;

  const currentMonthDate = new Date(Date.UTC(currentYear, currentMonth0, 15));
  const priorMonthDate = new Date(Date.UTC(priorYear, priorMonth0, 15));
  const yearAgoDate = new Date(Date.UTC(yoYYear, yoYMonth0, 15));

  const periodString = (year: number, month0: number): string => {
    const mm = String(month0 + 1).padStart(2, "0");
    return `${year}-${mm}`;
  };

  // Three periods: current, prior, yoY. For each: 1 income (negative amount),
  // 2 expense, 1 transfer. Transfer rows must be filtered out of the income
  // and expense tables by the renderer.
  const makeTxns = (dateIso: string, period: "current" | "prior" | "yoy") => {
    const incomeAmount = period === "yoy" ? -4800 : -5000;
    const groceriesAmount = period === "current" ? 400 : period === "prior" ? 500 : 350;
    return [
      {
        id: `txn-income-${period}`,
        institution: "bankone",
        account: "1234",
        description: "EMPLOYER DIRECT DEP",
        amount: incomeAmount,
        timestamp: dateIso,
        statementId: `bankone-1234-${period}`,
        category: "Income:Salary",
        budget: null,
        note: "",
        reimbursement: 0,
        normalizedId: null,
        normalizedPrimary: true,
        normalizedDescription: null,
      },
      {
        id: `txn-groceries-${period}`,
        institution: "bankone",
        account: "1234",
        description: "KROGER #1234",
        amount: groceriesAmount,
        timestamp: dateIso,
        statementId: `bankone-1234-${period}`,
        category: "Food:Groceries",
        budget: null,
        note: "",
        reimbursement: 0,
        normalizedId: null,
        normalizedPrimary: true,
        normalizedDescription: null,
      },
      {
        id: `txn-rent-${period}`,
        institution: "bankone",
        account: "1234",
        description: "RENT PAYMENT",
        amount: 1500,
        timestamp: dateIso,
        statementId: `bankone-1234-${period}`,
        category: "Housing:Rent",
        budget: null,
        note: "",
        reimbursement: 0,
        normalizedId: null,
        normalizedPrimary: true,
        normalizedDescription: null,
      },
      {
        id: `txn-transfer-${period}`,
        institution: "banktwo",
        account: "4444",
        description: "CARD PAYMENT",
        amount: 200,
        timestamp: dateIso,
        statementId: `banktwo-4444-${period}`,
        category: "Transfer:CardPayment",
        budget: null,
        note: "",
        reimbursement: 0,
        normalizedId: null,
        normalizedPrimary: true,
        normalizedDescription: null,
      },
    ];
  };

  const transactions = [
    ...makeTxns(currentMonthDate.toISOString(), "current"),
    ...makeTxns(priorMonthDate.toISOString(), "prior"),
    ...makeTxns(yearAgoDate.toISOString(), "yoy"),
  ];

  // Two statements per account spanning the fixture range so
  // computeDerivedBalances has data to work with.
  const statements = [
    {
      id: "stmt-bankone-1234-yoy",
      statementId: `bankone-1234-${periodString(yoYYear, yoYMonth0)}`,
      institution: "bankone",
      account: "1234",
      balance: 1000,
      period: periodString(yoYYear, yoYMonth0),
    },
    {
      id: "stmt-bankone-1234-current",
      statementId: `bankone-1234-${periodString(currentYear, currentMonth0)}`,
      institution: "bankone",
      account: "1234",
      balance: 1500,
      period: periodString(currentYear, currentMonth0),
    },
    {
      id: "stmt-banktwo-4444-yoy",
      statementId: `banktwo-4444-${periodString(yoYYear, yoYMonth0)}`,
      institution: "banktwo",
      account: "4444",
      balance: -100,
      period: periodString(yoYYear, yoYMonth0),
    },
    {
      id: "stmt-banktwo-4444-current",
      statementId: `banktwo-4444-${periodString(currentYear, currentMonth0)}`,
      institution: "banktwo",
      account: "4444",
      balance: -200,
      period: periodString(currentYear, currentMonth0),
    },
  ];

  const fixture = {
    version: 1,
    exportedAt: new Date(Date.now()).toISOString(),
    groupId: "test-group",
    groupName: "Test Household",
    transactions,
    statements,
    budgets: [],
    budgetPeriods: [],
    rules: [],
    normalizationRules: [],
    weeklyAggregates: [],
  };

  return Buffer.from(JSON.stringify(fixture));
}

/**
 * Uploads a synthetic fixture with transactions spanning the most-recent
 * complete month, the prior month, and the same month one year earlier.
 * Use this instead of `uploadFixture` when exercising features that render
 * multi-period comparisons (e.g. the income statement and cash flow
 * summary on /accounts).
 */
export async function uploadIncomeStatementFixture(page: Page): Promise<void> {
  const fileInput = page.locator(".upload-input");
  await fileInput.setInputFiles({
    name: "income-statement-fixture.json",
    mimeType: "application/json",
    buffer: buildIncomeStatementFixtureBuffer(),
  });
}
