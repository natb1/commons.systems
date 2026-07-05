import seedSamples from "virtual:office-hours-issue-seed-data";
import { type IssueSample } from "./issue-samples.js";

export function getDemoIssueSamples(): IssueSample[] {
  return seedSamples.map((s) => ({
    sampledAt: s.sampledAt,
    openSecurity: s.openSecurity,
    openBug: s.openBug,
    openEnhancement: s.openEnhancement,
    openOther: s.openOther,
    groupId: s.groupId,
  }));
}
