import { logError } from "@commons-systems/errorutil/log";

export interface TopicUsageBucket {
  priceProxyUsd: number;
  input: number;
  cacheRead: number;
  cacheCreation: number;
  output: number;
}

export interface TopicUsageDoc {
  date: string;
  byTopic: Record<string, TopicUsageBucket>;
  byType: Record<string, TopicUsageBucket>;
}

// Copied exactly from .claude/skills/dispatch-token-audit/scripts/topic-usage-writer.mjs
export const TOPIC_BUCKETS = [
  "security",
  "dispatch",
  "testing infrastructure",
  "landing",
  "fellspiral",
  "budget",
  "print",
  "audio",
  "other",
] as const;

export const TYPE_BUCKETS = ["bug", "enhancement", "none"] as const;

function isTopicUsageBucket(v: unknown): v is TopicUsageBucket {
  if (!v || typeof v !== "object" || Array.isArray(v)) return false;
  const b = v as Record<string, unknown>; // type-safety-ok: narrowing unknown to Record after object-type guard checks
  return (
    typeof b.priceProxyUsd === "number" &&
    typeof b.input === "number" &&
    typeof b.cacheRead === "number" &&
    typeof b.cacheCreation === "number" &&
    typeof b.output === "number"
  );
}

function isStringKeyedBucketMap(
  v: unknown,
): v is Record<string, TopicUsageBucket> {
  if (!v || typeof v !== "object" || Array.isArray(v)) return false;
  return Object.values(v as Record<string, unknown>).every(isTopicUsageBucket); // type-safety-ok: narrowing unknown to Record after object-type guard checks
}

export function toTopicUsage(raw: unknown): TopicUsageDoc | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    logError(new Error("topic-usage document is not an object"), {
      operation: "topic-usage-validation",
    });
    return null;
  }

  const data = raw as Record<string, unknown>; // type-safety-ok: narrowing unknown to Record after object-type guard checks

  const date = typeof data.date === "string" ? data.date : null;
  const byTopic = isStringKeyedBucketMap(data.byTopic) ? data.byTopic : null;
  const byType = isStringKeyedBucketMap(data.byType) ? data.byType : null;

  if (date === null || byTopic === null || byType === null) {
    logError(new Error("topic-usage document missing required fields"), {
      operation: "topic-usage-validation",
    });
    return null;
  }

  return { date, byTopic, byType };
}
