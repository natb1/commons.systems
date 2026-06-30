import { describe, it, expect } from "vitest";
import {
  renderTopicUsageChart,
  topicUsageSeries,
} from "../src/topic-usage-chart.js";
import {
  type TopicUsageBucket,
  type TopicUsageDoc,
} from "../src/topic-usage.js";

/** A fully-zeroed bucket; spread an override on top to set the fields you care about. */
function bucket(o: Partial<TopicUsageBucket> = {}): TopicUsageBucket {
  return { priceProxyUsd: 0, input: 0, cacheRead: 0, cacheCreation: 0, output: 0, ...o };
}

/** A topic-usage doc on `date` with the given per-topic price-proxy spend. */
function topicDoc(date: string, byTopic: Record<string, number>): TopicUsageDoc {
  const map: Record<string, TopicUsageBucket> = {};
  for (const [k, priceProxyUsd] of Object.entries(byTopic)) {
    map[k] = bucket({ priceProxyUsd });
  }
  return { date, byTopic: map, byType: {} };
}

function withFg(): HTMLElement {
  // happy-dom has no stylesheet, so missing.css's --fg is absent — set it on
  // the container so getThemeFg reads it live (mirrors the sibling test host).
  const container = document.createElement("div");
  container.style.setProperty("--fg", "#ddd");
  document.body.appendChild(container);
  return container;
}

describe("topicUsageSeries", () => {
  it("averages priceProxyUsd over the trailing 7-calendar-day window, omitting out-of-range days", () => {
    // 06-01 is 9 days before 06-10, so it falls OUTSIDE the [06-04, 06-10]
    // window of the last day — proving the 7-calendar-day bound. The series is
    // ascending (Unit 1's reader order).
    const docs = [
      topicDoc("2026-06-01", { security: 10 }),
      topicDoc("2026-06-05", { security: 20 }),
      topicDoc("2026-06-10", { security: 30 }),
    ];

    const series = topicUsageSeries(docs, "security", "topic");

    expect(series.map((p) => p.mean)).toEqual([
      10, // 06-01: window [05-26, 06-01] → {10}
      15, // 06-05: window [05-30, 06-05] → {10, 20}
      25, // 06-10: window [06-04, 06-10] → {20, 30} (06-01 excluded)
    ]);
    // x values are the parsed doc dates.
    expect(series.map((p) => p.date.toISOString())).toEqual([
      "2026-06-01T00:00:00.000Z",
      "2026-06-05T00:00:00.000Z",
      "2026-06-10T00:00:00.000Z",
    ]);
  });

  it("treats a doc lacking the bucket as a 0 contribution for its own day", () => {
    const docs = [
      topicDoc("2026-06-01", { security: 10 }),
      topicDoc("2026-06-02", { dispatch: 99 }), // no security key
    ];
    const series = topicUsageSeries(docs, "security", "topic");
    // 06-02 window [05-27, 06-02] → {10, 0} → mean 5.
    expect(series.map((p) => p.mean)).toEqual([10, 5]);
  });
});

describe("renderTopicUsageChart", () => {
  it("shows the empty-state message for an empty array", () => {
    const el = renderTopicUsageChart([], "topic");
    const empty = el.querySelector(".empty");
    expect(empty).not.toBeNull();
    expect(empty?.textContent).toBe("No topic usage to chart.");
    expect(el.querySelector("svg")).toBeNull();
  });

  it("draws one line per non-empty bucket and labels each in the legend", () => {
    withFg();
    const docs = [
      topicDoc("2026-06-01", { security: 1, dispatch: 2 }),
      topicDoc("2026-06-02", { security: 3, dispatch: 4 }),
    ];
    const el = renderTopicUsageChart(docs, "topic");

    const legend = el.querySelector(".trend-legend");
    expect(legend).not.toBeNull();
    const labels = Array.from(legend?.querySelectorAll(".trend-legend-item") ?? []).map(
      (i) => i.textContent ?? "",
    );
    expect(labels).toEqual(["security", "dispatch"]);

    // One Plot.lineY mark (rendered as an aria-labelled "line" group) per bucket.
    const lines = el.querySelectorAll(".chart-scroll-wrapper svg g[aria-label='line']");
    expect(lines.length).toBe(2);
  });

  it("renders 'other' as a visible line when it has data", () => {
    withFg();
    const docs = [
      topicDoc("2026-06-01", { other: 5 }),
      topicDoc("2026-06-02", { other: 7 }),
    ];
    const el = renderTopicUsageChart(docs, "topic");

    const labels = Array.from(el.querySelectorAll(".trend-legend-item")).map(
      (i) => i.textContent ?? "",
    );
    expect(labels).toContain("other");
    expect(el.querySelectorAll(".chart-scroll-wrapper svg g[aria-label='line']").length).toBe(1);
  });

  it("draws no line for an all-zero bucket", () => {
    withFg();
    // security has data; landing is present but all-zero → omitted.
    const docs = [
      topicDoc("2026-06-01", { security: 1, landing: 0 }),
      topicDoc("2026-06-02", { security: 2, landing: 0 }),
    ];
    const el = renderTopicUsageChart(docs, "topic");

    const labels = Array.from(el.querySelectorAll(".trend-legend-item")).map(
      (i) => i.textContent ?? "",
    );
    expect(labels).toEqual(["security"]);
    expect(labels).not.toContain("landing");
    expect(el.querySelectorAll(".chart-scroll-wrapper svg g[aria-label='line']").length).toBe(1);
  });

  it("renders a fixed axis and a scroll wrapper", () => {
    withFg();
    const docs = [
      topicDoc("2026-06-01", { security: 1 }),
      topicDoc("2026-06-02", { security: 2 }),
    ];
    const el = renderTopicUsageChart(docs, "topic");

    expect(el.querySelectorAll(".chart-layout").length).toBe(1);
    expect(el.querySelectorAll(".chart-y-axis svg").length).toBe(1);
    expect(el.querySelectorAll(".chart-scroll-wrapper svg").length).toBe(1);
  });

  it("does not mutate the input array order", () => {
    withFg();
    const a = topicDoc("2026-06-02", { security: 2 });
    const b = topicDoc("2026-06-01", { security: 1 });
    const docs = [a, b];
    renderTopicUsageChart(docs, "topic");
    expect(docs[0]).toBe(a);
    expect(docs[1]).toBe(b);
  });
});
