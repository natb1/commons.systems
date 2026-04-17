import { test, expect } from "@playwright/test";

const SITE_URL = "https://commons.systems";

async function getJsonLd(page: import("@playwright/test").Page, type: string) {
  const scripts = await page.locator('script[type="application/ld+json"]').all();
  for (const s of scripts) {
    const text = await s.textContent();
    if (!text) continue;
    const json = JSON.parse(text);
    if (json["@type"] === type) return json;
  }
  return null;
}

test.describe("SEO: canonical, JSON-LD, rel=me", () => {
  test("homepage has canonical link to site root @smoke", async ({ page }) => {
    await page.goto("/");
    const canonical = page.locator('link[rel="canonical"]');
    await expect(canonical).toHaveAttribute("href", `${SITE_URL}/`);
  });

  test("homepage has Organization JSON-LD @smoke", async ({ page }) => {
    await page.goto("/");
    const org = await getJsonLd(page, "Organization");
    expect(org).not.toBeNull();
    expect(org["@context"]).toBe("https://schema.org");
    expect(org.name).toBeTruthy();
    expect(org.url).toBe(SITE_URL);
    expect(org.logo).toBeTruthy();
    expect(Array.isArray(org.sameAs)).toBe(true);
    expect(org.sameAs).toContain("https://github.com/natb1");
  });

  test("homepage has rel=me link to GitHub profile @smoke", async ({ page }) => {
    await page.goto("/");
    const relMe = page.locator('link[rel="me"]');
    await expect(relMe).toHaveAttribute("href", "https://github.com/natb1");
  });

  test("post page has canonical link to post URL", async ({ page }) => {
    await page.route("https://raw.githubusercontent.com/**", (route) =>
      route.fulfill({ body: "# Test\nContent." }),
    );
    await page.goto("/post/recovering-autonomy-with-coding-agents");
    const canonical = page.locator('link[rel="canonical"]');
    await expect(canonical).toHaveAttribute(
      "href",
      `${SITE_URL}/post/recovering-autonomy-with-coding-agents`,
    );
  });

  test("post page has BlogPosting JSON-LD with required fields", async ({ page }) => {
    await page.route("https://raw.githubusercontent.com/**", (route) =>
      route.fulfill({ body: "# Test\nContent." }),
    );
    await page.goto("/post/recovering-autonomy-with-coding-agents");
    const posting = await getJsonLd(page, "BlogPosting");
    expect(posting).not.toBeNull();
    expect(posting.headline).toBeTruthy();
    expect(posting.datePublished).toBeTruthy();
    expect(posting.author).toBeTruthy();
    expect(posting.author.name).toBeTruthy();
    expect(posting.url).toBe(
      `${SITE_URL}/post/recovering-autonomy-with-coding-agents`,
    );
    expect(posting.mainEntityOfPage).toBeTruthy();
    expect(posting.mainEntityOfPage["@id"]).toBe(
      `${SITE_URL}/post/recovering-autonomy-with-coding-agents`,
    );
  });

  test("canonical updates on SPA navigation from home to post", async ({ page }) => {
    await page.route("https://raw.githubusercontent.com/**", (route) =>
      route.fulfill({ body: "# Test\nContent." }),
    );
    await page.goto("/");
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", `${SITE_URL}/`);
    await page
      .locator('#post-recovering-autonomy-with-coding-agents a.post-link')
      .click();
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      `${SITE_URL}/post/recovering-autonomy-with-coding-agents`,
    );
  });
});

test.describe("sitemap.xml", () => {
  test("GET /sitemap.xml returns valid XML with urlset @smoke", async ({ page }) => {
    const response = await page.goto("/sitemap.xml");
    expect(response).not.toBeNull();
    expect(response!.status()).toBe(200);
    const contentType = response!.headers()["content-type"] ?? "";
    expect(contentType).toMatch(/xml/);

    const body = await response!.text();
    expect(body).toContain("<?xml");
    expect(body).toContain("<urlset");
    expect(body).toContain("<url>");
    expect(body).toContain("<loc>");
  });

  test("sitemap includes homepage and all published posts", async ({ page }) => {
    const response = await page.goto("/sitemap.xml");
    const body = await response!.text();
    expect(body).toContain(`<loc>${SITE_URL}/</loc>`);
    expect(body).toContain(
      `<loc>${SITE_URL}/post/recovering-autonomy-with-coding-agents</loc>`,
    );
  });

  test("sitemap excludes unpublished posts", async ({ page }) => {
    const response = await page.goto("/sitemap.xml");
    const body = await response!.text();
    expect(body).not.toContain("draft-ideas");
  });
});
