import type { BlogRollStrategy, LatestPost } from "./types.js";

export class RssStrategy implements BlogRollStrategy {
  private feedUrl: string;

  constructor(feedUrl: string) {
    this.feedUrl = feedUrl;
  }

  async fetchLatestPost(): Promise<LatestPost | null> {
    try {
      const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(this.feedUrl)}`;
      const response = await fetch(proxyUrl);
      if (!response.ok) return null;

      const text = await response.text();
      const doc = new DOMParser().parseFromString(text, "text/xml");

      if (doc.querySelector("parsererror")) return null;

      const item = doc.querySelector("item") ?? doc.querySelector("entry");
      if (!item) return null;

      const title =
        item.querySelector("title")?.textContent?.trim() ?? null;
      const url =
        item.querySelector("link")?.textContent?.trim() ??
        item.querySelector("link")?.getAttribute("href") ??
        null;

      if (!title || !url) return null;
      return { title, url };
    } catch {
      return null;
    }
  }
}
