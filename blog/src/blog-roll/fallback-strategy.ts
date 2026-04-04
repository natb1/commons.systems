import type { BlogRollStrategy, LatestPost } from "./types.ts";
import { classifyError } from "@commons-systems/errorutil";
import { logError } from "@commons-systems/errorutil/log";

export class FallbackStrategy implements BlogRollStrategy {
  constructor(
    private primary: BlogRollStrategy,
    private fallbackData: LatestPost | null,
  ) {}

  async fetchLatestPost(): Promise<LatestPost | null> {
    let result: LatestPost | null;
    try {
      result = await this.primary.fetchLatestPost();
    } catch (err) {
      if (classifyError(err) === "programmer") throw err;
      if (this.fallbackData) {
        logError(err, { operation: "fallback-strategy-primary" });
        return this.fallbackData;
      }
      throw err;
    }
    if (result) return result;
    if (this.fallbackData) {
      logError(new Error("FallbackStrategy: primary returned null, using build-time data"), {
        operation: "fallback-strategy-null-primary",
      });
    }
    return this.fallbackData;
  }
}
