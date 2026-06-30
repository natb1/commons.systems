// @vitest-environment happy-dom
//
// The <TopicUsagePanel> chart-panel component (Unit 3). It wraps the imperative
// renderTopicUsageChart core as a chart island and adds the axis toggle the core
// can't carry: a two-button group (Topic / Type) reflected via aria-pressed.
// Asserts the default axis is "topic", that clicking "Type" swaps the chart to
// the type axis (the legend re-renders with the type buckets), and the delegated
// empty-state copy. Mocks --fg + the DS --chart-1..6 palette on the document root.
import { describe, it, expect, afterEach, beforeEach } from "vitest";
import { render, cleanup, fireEvent } from "@testing-library/react";
import { TopicUsagePanel } from "../src/components/TopicUsagePanel.js";
import {
  type TopicUsageBucket,
  type TopicUsageDoc,
} from "../src/topic-usage.js";

/** A fully-zeroed bucket; spread an override on top to set the fields you care about. */
function bucket(o: Partial<TopicUsageBucket> = {}): TopicUsageBucket {
  return { priceProxyUsd: 0, input: 0, cacheRead: 0, cacheCreation: 0, output: 0, ...o };
}

function mapOf(spend: Record<string, number>): Record<string, TopicUsageBucket> {
  const map: Record<string, TopicUsageBucket> = {};
  for (const [k, priceProxyUsd] of Object.entries(spend)) {
    map[k] = bucket({ priceProxyUsd });
  }
  return map;
}

/** A doc carrying distinct topic and type spend so the two axes render different legends. */
function doc(
  date: string,
  byTopic: Record<string, number>,
  byType: Record<string, number>,
): TopicUsageDoc {
  return { date, byTopic: mapOf(byTopic), byType: mapOf(byType) };
}

function twoDocs(): TopicUsageDoc[] {
  return [
    doc("2026-06-01", { security: 1, dispatch: 2 }, { bug: 1, enhancement: 2 }),
    doc("2026-06-02", { security: 3, dispatch: 4 }, { bug: 3, enhancement: 4 }),
  ];
}

const legendLabels = (root: ParentNode): string[] =>
  Array.from(root.querySelectorAll(".trend-legend-item")).map((i) => i.textContent ?? "");

beforeEach(() => {
  const root = document.documentElement.style;
  root.setProperty("--fg", "#e8eaed");
  root.setProperty("--chart-1", "#4d6f8f");
  root.setProperty("--chart-2", "#c98a3c");
  root.setProperty("--chart-3", "#a35d5d");
  root.setProperty("--chart-4", "#7a8c5a");
  root.setProperty("--chart-5", "#b08a4f");
  root.setProperty("--chart-6", "#5f8a8a");
});
afterEach(() => {
  cleanup();
  const root = document.documentElement.style;
  for (const v of ["--fg", "--chart-1", "--chart-2", "--chart-3", "--chart-4", "--chart-5", "--chart-6"]) {
    root.removeProperty(v);
  }
});

describe("TopicUsagePanel", () => {
  it("defaults to the topic axis: Topic toggle pressed, legend shows topic buckets", () => {
    const { container, getByRole } = render(<TopicUsagePanel docs={twoDocs()} />);

    const topicBtn = getByRole("button", { name: "Topic" });
    const typeBtn = getByRole("button", { name: "Type" });
    expect(topicBtn.getAttribute("aria-pressed")).toBe("true");
    expect(typeBtn.getAttribute("aria-pressed")).toBe("false");

    // The chart rendered with the topic bucket set.
    expect(legendLabels(container)).toEqual(["security", "dispatch"]);
    expect(container.querySelector(".chart-scroll-wrapper svg")).not.toBeNull();
  });

  it("clicking Type re-renders with the type axis: Type pressed, legend swaps to type buckets", () => {
    const { container, getByRole } = render(<TopicUsagePanel docs={twoDocs()} />);

    fireEvent.click(getByRole("button", { name: "Type" }));

    expect(getByRole("button", { name: "Type" }).getAttribute("aria-pressed")).toBe("true");
    expect(getByRole("button", { name: "Topic" }).getAttribute("aria-pressed")).toBe("false");

    // The chart swapped to the type bucket set — single chart, type legend.
    expect(legendLabels(container)).toEqual(["bug", "enhancement"]);
    expect(container.querySelectorAll(".chart-scroll-wrapper svg").length).toBe(1);
  });

  it("delegates the empty-state to the core for an empty array", () => {
    const { container } = render(<TopicUsagePanel docs={[]} />);
    const empty = container.querySelector(".empty");
    expect(empty).not.toBeNull();
    expect(empty?.textContent).toBe("No topic usage to chart.");
    expect(container.querySelector("svg")).toBeNull();
  });
});
