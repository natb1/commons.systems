import type { BlogRollStrategy, LatestPost } from "./types.ts";
import { classifyError } from "@commons-systems/errorutil/classify";
import { logError } from "@commons-systems/errorutil/log";
import { parseXml } from "./parse-feed.ts";

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
      if (this.fetchHeaders && (!headers || !Object.keys(headers).length)) {
        return null;
      }
      const response = await fetch(proxyUrl, headers ? { headers } : undefined);
      if (!response.ok) {
        logError(new Error(`Feed proxy failed for ${this.feedUrl}: ${response.status}`), {
          operation: "atom-strategy-fetch",
        });
        return null;
      }
      const result = parseXml(await response.text());
      if (!result) {
        logError(new Error(`Feed parse returned no data for ${this.feedUrl}`), {
          operation: "atom-strategy-fetch",
        });
      }
      return result;
    } catch (err) {
      if (classifyError(err) === "programmer") throw err;
      logError(err, { operation: "atom-strategy-fetch" });
      return null;
    }
  }
}
