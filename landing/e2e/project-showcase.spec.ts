import { test, expect } from "@commons-systems/config/playwright-test";

const PROJECT_HREFS = [
  "https://office-hours.commons.systems",
  "https://budget.commons.systems",
  "https://print.commons.systems",
];

test.describe("project showcase", () => {
  test("interstitial band shows headline and subline", async ({ page }) => {
    await page.goto("/");

    const headline = page.locator(".hero-band-section .hero-band-headline");
    await expect(headline).toHaveText("Build with commons.systems. Learn to run without.");

    const subline = page.locator(".hero-band-section .hero-band-subline");
    await expect(subline).toHaveText(
      "Code you understand. Data you control. A roadmap you set.",
    );
  });

  test("three project cards render in PROJECT_HREFS order with correct hrefs", async ({
    page,
  }) => {
    await page.goto("/");

    const cards = page.locator(".hero-band-section > .hero-band-grid a.project-card");
    await expect(cards).toHaveCount(3);

    for (let i = 0; i < PROJECT_HREFS.length; i++) {
      await expect(cards.nth(i)).toHaveAttribute("href", PROJECT_HREFS[i]);
    }
  });

  test("each card has a visible lazy-loaded image with non-empty alt", async ({
    page,
  }) => {
    await page.goto("/");

    const cards = page.locator(".hero-band-section > .hero-band-grid a.project-card");
    // Auto-wait for the client-mounted (React createRoot, deferred) cards
    // before the non-waiting .count() read — same reason as the focus test.
    await expect(cards).toHaveCount(3);
    const count = await cards.count();

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
    // The showcase mounts client-side via React createRoot (deferred), so the
    // cards are not in the DOM synchronously at load. Wait for them before the
    // synchronous focus check below — mirrors the auto-waiting locators the
    // sibling tests use, and keeps the test honest against the non-prerendered
    // dev server (on a prerendered build the cards are already present at load).
    await page.waitForSelector(".hero-band-section > .hero-band-grid a.project-card");

    for (let i = 0; i < 3; i++) {
      const isActive = await page.evaluate((idx) => {
        const cards = document.querySelectorAll<HTMLAnchorElement>(
          ".hero-band-section > .hero-band-grid a.project-card",
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
      // Wait for the client-mounted (React createRoot, deferred) showcase cards
      // before the synchronous geometry read below — same reason as the
      // keyboard-focus test above.
      await page.waitForSelector(".hero-band-section > .hero-band-grid a.project-card");

      const xs = await page.evaluate(() => {
        const cards = Array.from(
          document.querySelectorAll<HTMLAnchorElement>(
            ".hero-band-section > .hero-band-grid a.project-card",
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

    await expect(page.locator("a.project-card")).toHaveCount(4);

    const scripts = await page.locator('script[type="application/ld+json"]').allTextContents();
    const softwareAppCount = scripts.filter(t => JSON.parse(t)["@type"] === "SoftwareApplication").length;
    expect(softwareAppCount).toBe(4);
  });

  test("overflow card is collapsed by default and revealed on summary toggle", async ({
    page,
  }) => {
    await page.goto("/");

    await page.waitForSelector("details.hero-band-overflow");

    const details = page.locator("details.hero-band-overflow");
    await expect(details).not.toHaveAttribute("open", /.*/);

    const overflowCard = page.locator(
      '.hero-band-overflow a.project-card[href="https://audio.commons.systems"]',
    );
    await expect(overflowCard).toBeHidden();

    await page.locator(".hero-band-overflow summary").click();

    await expect(overflowCard).toBeVisible();

    await expect(page.locator(".hero-band-overflow summary")).toHaveText("more…");

    const overflowAfterGrid = await page.evaluate(() => {
      const grid = document.querySelector(".hero-band-section > .hero-band-grid");
      const overflow = document.querySelector("details.hero-band-overflow");
      if (!grid || !overflow) return false;
      return (
        grid.compareDocumentPosition(overflow) & Node.DOCUMENT_POSITION_FOLLOWING
      ) !== 0;
    });
    expect(overflowAfterGrid).toBe(true);
  });
});
