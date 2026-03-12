import type { BlogRollStrategy, LatestPost } from "./types.js";
import { parseXml } from "./parse-feed.js";

export class AtomStrategy implements BlogRollStrategy {
  constructor(
    private feedUrl: string,
    private proxyPath: string = "/api/feed-proxy",
  ) {}

  async fetchLatestPost(): Promise<LatestPost | null> {
    try {
      const response = await fetch(this.feedUrl);
      if (response.ok) {
        return parseXml(await response.text());
      }
      console.warn(`Feed fetch failed for ${this.feedUrl}: ${response.status}`);
    } catch (err) {
      if (err instanceof ReferenceError) throw err;
      console.warn(`Feed fetch error for ${this.feedUrl}:`, err);
    }

    try {
      const proxyUrl = `${this.proxyPath}?url=${encodeURIComponent(this.feedUrl)}`;
      const proxyResponse = await fetch(proxyUrl);
      if (!proxyResponse.ok) {
        console.warn(`Proxy fetch failed for ${this.feedUrl}: ${proxyResponse.status}`);
        return null;
      }
      return parseXml(await proxyResponse.text());
    } catch (err) {
      if (err instanceof ReferenceError) throw err;
      console.warn(`Proxy fetch error for ${this.feedUrl}:`, err);
      return null;
    }
  }
}
