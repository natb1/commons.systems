import { test, expect } from "@playwright/test";

const APP_HREFS = [
  "https://budget.commons.systems",
  "https://audio.commons.systems",
  "https://print.commons.systems",
];

test.describe("app showcase", () => {
  test("interstitial band shows headline and subline", async ({ page }) => {
    await page.goto("/");

    const headline = page.locator(".landing-hero-band .landing-hero-band-headline");
    await expect(headline).toHaveText("Build with commons.systems. Run without.");

    const subline = page.locator(".landing-hero-band .landing-hero-band-subline");
    await expect(subline).toHaveText(
      "Code you understand. Data you control. A roadmap you set.",
    );
  });

  test("three app cards render in APPS order with correct hrefs", async ({
    page,
  }) => {
    await page.goto("/");

    const cards = page.locator("a.app-card");
    await expect(cards).toHaveCount(3);

    for (let i = 0; i < APP_HREFS.length; i++) {
      await expect(cards.nth(i)).toHaveAttribute("href", APP_HREFS[i]);
    }
  });

  test("each card has a visible lazy-loaded image with non-empty alt", async ({
    page,
  }) => {
    await page.goto("/");

    const cards = page.locator("a.app-card");
    const count = await cards.count();
    expect(count).toBe(3);

    for (let i = 0; i < count; i++) {
      const img = cards.nth(i).locator("img");
      await expect(img).toBeVisible();
      await expect(img).toHaveAttribute("loading", "lazy");
      const alt = await img.getAttribute("alt");
      expect(alt).toBeTruthy();
      expect((alt ?? "").length).toBeGreaterThan(0);
    }
  });

  test("each card is keyboard-focusable via .focus()", async ({ page }) => {
    await page.goto("/");

    for (let i = 0; i < 3; i++) {
      const isActive = await page.evaluate((idx) => {
        const cards = document.querySelectorAll<HTMLAnchorElement>("a.app-card");
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

  test("showcase and SoftwareApplication JSON-LD are live @smoke", async ({
    page,
  }) => {
    await page.goto("/");

    await expect(page.locator("a.app-card")).toHaveCount(3);

    const softwareAppCount = await page.evaluate(() => {
      const scripts = Array.from(
        document.querySelectorAll<HTMLScriptElement>(
          'script[type="application/ld+json"]',
        ),
      );
      let n = 0;
      for (const s of scripts) {
        const text = s.textContent;
        if (!text) continue;
        try {
          const json = JSON.parse(text);
          if (json["@type"] === "SoftwareApplication") n++;
        } catch {
          /* ignore malformed */
        }
      }
      return n;
    });

    expect(softwareAppCount).toBe(3);
  });
});
