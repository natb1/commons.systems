import { type TopicUsageDoc } from "./topic-usage.js";

// The demo tier is unauthenticated and the topic-usage list rule requires
// request.auth != null, so there is no demo data source and the panel renders empty.
export function getDemoTopicUsage(): TopicUsageDoc[] {
  return [];
}
