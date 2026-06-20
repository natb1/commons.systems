import { test, expect } from "@commons-systems/config/playwright-test";

const APP_HREFS = [
  "https://office-hours.commons.systems",
  "https://budget.commons.systems",
  "https://print.commons.systems",
];

test.describe("app showcase", () => {
  test("interstitial band shows headline and subline", async ({ page }) => {
    await page.goto("/");

    const headline = page.locator(".landing-hero-band .landing-hero-band-headline");
    await expect(headline).toHaveText("Build with commons.systems. Learn to run without.");

    const subline = page.locator(".landing-hero-band .landing-hero-band-subline");
    await expect(subline).toHaveText(
      "Code you understand. Data you control. A roadmap you set.",
    );
  });

  test("three app cards render in APPS order with correct hrefs", async ({
    page,
  }) => {
    await page.goto("/");

    const cards = page.locator(".landing-hero-grid a.app-card");
    await expect(cards).toHaveCount(3);

    for (let i = 0; i < APP_HREFS.length; i++) {
      await expect(cards.nth(i)).toHaveAttribute("href", APP_HREFS[i]);
    }
  });

  test("each card has a visible lazy-loaded image with non-empty alt", async ({
    page,
  }) => {
    await page.goto("/");

    const cards = page.locator(".landing-hero-grid a.app-card");
    const count = await cards.count();
    expect(count).toBe(3);

    for (let i = 0; i < count; i++) {
      const img = cards.nth(i).locator("img");
      await expect(img).toBeVisible();
      await expect(img).toHaveAttribute("loading", "lazy");
      const alt = await img.getAttribute("alt");
      expect(alt).toBeTruthy();
    }
  });

  test("each card is keyboard-focusable via .focus()", async ({ page }) => {
    await page.goto("/");

    for (let i = 0; i < 3; i++) {
      const isActive = await page.evaluate((idx) => {
        const cards = document.querySelectorAll<HTMLAnchorElement>(
          ".landing-hero-grid a.app-card",
        );
        const target = cards[idx];
        if (!target) return false;
        target.focus();
        return document.activeElement === target;
      }, i);
      expect(isActive).toBe(true);
    }
  });

  test.describe("mobile viewport", () => {
    test.use({ viewport: { width: 375, height: 800 } });

    test(".landing-hero-grid collapses to a single column", async ({ page }) => {
      await page.goto("/");

      const xs = await page.evaluate(() => {
        const cards = Array.from(
          document.querySelectorAll<HTMLAnchorElement>(
            ".landing-hero-grid a.app-card",
          ),
        );
        return cards.map((c) => Math.round(c.getBoundingClientRect().x));
      });

      expect(xs).toHaveLength(3);
      expect(xs[1]).toBe(xs[0]);
      expect(xs[2]).toBe(xs[0]);
    });
  });

  test("showcase and SoftwareApplication JSON-LD are live @smoke @build", async ({
    page,
  }) => {
    await page.goto("/");

    await expect(page.locator("a.app-card")).toHaveCount(4);

    const scripts = await page.locator('script[type="application/ld+json"]').allTextContents();
    const softwareAppCount = scripts.filter(t => JSON.parse(t)["@type"] === "SoftwareApplication").length;
    expect(softwareAppCount).toBe(4);
  });

  test("overflow card is collapsed by default and revealed on summary toggle", async ({
    page,
  }) => {
    await page.goto("/");

    const details = page.locator("details.app-showcase-overflow");
    await expect(details).not.toHaveAttribute("open", /.*/);

    const overflowCard = page.locator(
      '.app-showcase-overflow a.app-card[href="https://audio.commons.systems"]',
    );
    await expect(overflowCard).toBeHidden();

    await page.locator(".app-showcase-overflow summary").click();

    await expect(overflowCard).toBeVisible();
  });
});
