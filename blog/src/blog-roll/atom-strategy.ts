import type { BlogRollStrategy, LatestPost } from "./types.js";
import { parseXml } from "./parse-feed.js";

export class AtomStrategy implements BlogRollStrategy {
  constructor(
    private feedUrl: string,
    private proxyPath: string = "/api/feed-proxy",
    private fetchHeaders?: () => Promise<Record<string, string>>,
  ) {}

  async fetchLatestPost(): Promise<LatestPost | null> {
    try {
      const proxyUrl = `${this.proxyPath}?url=${encodeURIComponent(this.feedUrl)}`;
      const headers = await this.fetchHeaders?.();
      const response = await fetch(proxyUrl, headers ? { headers } : undefined);
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
      // ReferenceError (undefined variable) and TypeError (null property access) indicate bugs, not recoverable feed failures
      if (err instanceof ReferenceError || err instanceof TypeError) throw err;
      console.warn(`Feed proxy error for ${this.feedUrl}:`, err);
      return null;
    }
  }
}
