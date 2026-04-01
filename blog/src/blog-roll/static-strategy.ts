import type { BlogRollStrategy, LatestPost } from "./types.ts";

export class StaticStrategy implements BlogRollStrategy {
  constructor(private post: LatestPost | null) {}

  async fetchLatestPost(): Promise<LatestPost | null> {
    return this.post;
  }
}
