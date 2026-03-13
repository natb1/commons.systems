import type { BlogRollStrategy, LatestPost } from "./types.js";
import { parseXml } from "./parse-feed.js";

export class AtomStrategy implements BlogRollStrategy {
  constructor(
    private feedUrl: string,
    private proxyPath: string = "/api/feed-proxy",
  ) {}

  async fetchLatestPost(): Promise<LatestPost | null> {
    try {
      const proxyUrl = `${this.proxyPath}?url=${encodeURIComponent(this.feedUrl)}`;
      const response = await fetch(proxyUrl);
      if (!response.ok) {
        console.warn(`Feed proxy failed for ${this.feedUrl}: ${response.status}`);
        return null;
      }
      const result = parseXml(await response.text());
      if (!result) {
        console.warn(`Feed parse returned no data for ${this.feedUrl}`);
      }
      return result;
    } catch (err) {
      if (err instanceof ReferenceError) throw err;
      console.warn(`Feed proxy error for ${this.feedUrl}:`, err);
      return null;
    }
  }
}
