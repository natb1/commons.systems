import type { BlogRollStrategy, LatestPost } from "./types.js";

export class HtmlScrapingStrategy implements BlogRollStrategy {
  constructor(
    private pageUrl: string,
    private linkPattern: RegExp,
  ) {}

  async fetchLatestPost(): Promise<LatestPost | null> {
    try {
      const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(this.pageUrl)}`;
      const response = await fetch(proxyUrl);
      if (!response.ok) return null;
      const html = await response.text();
      const doc = new DOMParser().parseFromString(html, "text/html");
      for (const link of doc.querySelectorAll("a[href]")) {
        const href = link.getAttribute("href")!;
        if (!this.linkPattern.test(href)) continue;
        const title = link.textContent?.trim();
        if (!title) continue;
        return { title, url: new URL(href, this.pageUrl).href };
      }
      return null;
    } catch {
      return null;
    }
  }
}
