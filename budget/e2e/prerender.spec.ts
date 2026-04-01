import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { test, expect } from "@playwright/test";
import { uploadFixture } from "./helpers";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distIndex = path.join(__dirname, "..", "dist", "index.html");

test.describe("prerender", () => {
  test.describe("static HTML output", () => {
    let html: string;

    test.beforeAll(() => {
      html = fs.readFileSync(distIndex, "utf-8");
    });

    test("nav links pre-rendered into app-nav", () => {
      expect(html).toContain('<span class="nav-links">');
      expect(html).toContain('href="/"');
      expect(html).toContain("budgets</a>");
      expect(html).toContain('href="/transactions"');
      expect(html).toContain("transactions</a>");
      expect(html).toContain('href="/accounts"');
      expect(html).toContain("accounts</a>");
      expect(html).toContain('href="/rules"');
      expect(html).toContain("rules</a>");
    });

    test("budgets page content pre-rendered into main", () => {
      expect(html).toContain("<h2>Budgets</h2>");
      expect(html).toContain('id="budgets-table"');
      expect(html).toContain('id="seed-data-notice"');
      expect(html).toMatch(/<main id="app">[\s\S]*<h2>Budgets<\/h2>/);
    });
  });

  test.describe("runtime behavior", () => {
    test("seed view renders without Firestore network requests", async ({ page }) => {
      const firestoreRequests: string[] = [];
      page.on("request", (req) => {
        if (req.url().includes("firestore.googleapis.com")) {
          firestoreRequests.push(req.url());
        }
      });

      await page.goto("/");
      await expect(page.locator("main h2")).toHaveText("Budgets");
      await expect(page.locator("#budgets-table")).toBeVisible();
      await expect(page.locator("#seed-data-notice")).toBeVisible();

      expect(firestoreRequests).toHaveLength(0);
    });

    test("hydrated nav links are functional", async ({ page }) => {
      await page.goto("/");
      await expect(page.locator("app-nav .nav-links")).toBeVisible();

      await page.click('app-nav a[href="/transactions"]');
      await expect(page.locator("main h2")).toHaveText("Transactions");

      await page.click('app-nav a[href="/"]');
      await expect(page.locator("main h2")).toHaveText("Budgets");
      await expect(page.locator("#budgets-table")).toBeVisible();
    });

    test("upload transitions from seed to IDB source", async ({ page }) => {
      await page.goto("/transactions");
      await expect(page.locator("#seed-data-notice")).toBeVisible({ timeout: 15000 });

      await uploadFixture(page);
      await expect(page.locator("#transactions-table")).toBeVisible({ timeout: 10000 });
      await expect(page.locator("#seed-data-notice")).toHaveCount(0);

      await page.click('app-nav a[href="/"]');
      await expect(page.locator("main h2")).toHaveText("Budgets");
      await expect(page.locator("#budgets-table")).toBeVisible();
      await expect(page.locator("#seed-data-notice")).toHaveCount(0);
    });
  });
});
