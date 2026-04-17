import { test, expect } from "@playwright/test";

const APPS = [
  {
    name: "Budget",
    url: "https://budget.commons.systems",
    applicationCategory: "FinanceApplication",
    operatingSystem: "Web",
  },
  {
    name: "Audio",
    url: "https://audio.commons.systems",
    applicationCategory: "MultimediaApplication",
    operatingSystem: "Web",
  },
  {
    name: "Print",
    url: "https://print.commons.systems",
    applicationCategory: "BookApplication",
    operatingSystem: "Web",
  },
];

async function getSoftwareApplicationJsonLd(
  page: import("@playwright/test").Page,
) {
  const scripts = await page
    .locator('script[type="application/ld+json"]')
    .all();
  const out: Array<Record<string, unknown>> = [];
  for (const s of scripts) {
    const text = await s.textContent();
    if (!text) continue;
    const json = JSON.parse(text);
    if (json["@type"] === "SoftwareApplication") out.push(json);
  }
  return out;
}

test.describe("SEO: SoftwareApplication JSON-LD", () => {
  test("homepage has exactly 3 SoftwareApplication JSON-LD scripts", async ({
    page,
  }) => {
    await page.goto("/");
    const apps = await getSoftwareApplicationJsonLd(page);
    expect(apps).toHaveLength(3);
  });

  test("each SoftwareApplication has correct url, category, os, and name", async ({
    page,
  }) => {
    await page.goto("/");
    const apps = await getSoftwareApplicationJsonLd(page);
    expect(apps).toHaveLength(APPS.length);

    for (const expected of APPS) {
      const match = apps.find((a) => a.url === expected.url);
      expect(match, `JSON-LD for ${expected.url}`).toBeTruthy();
      expect(match!.name).toBe(expected.name);
      expect(match!.applicationCategory).toBe(expected.applicationCategory);
      expect(match!.operatingSystem).toBe(expected.operatingSystem);
    }
  });

  test("post page has zero SoftwareApplication JSON-LD scripts", async ({
    page,
  }) => {
    await page.route("https://raw.githubusercontent.com/**", (route) =>
      route.fulfill({ body: "# Test\nContent." }),
    );
    await page.goto("/post/recovering-autonomy-with-coding-agents");
    const apps = await getSoftwareApplicationJsonLd(page);
    expect(apps).toHaveLength(0);
  });
});
