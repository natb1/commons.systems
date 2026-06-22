import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { ParkedIssuesPanel } from "../src/components/ParkedIssuesPanel.js";
import type { ParkedIssue } from "../src/queue-metrics.js";

const now = new Date("2026-06-05T12:00:00Z");
const DAY = 86_400_000;

function parkedIssue(
  number: number,
  title: string,
  ageMs: number,
  phase?: string,
): ParkedIssue {
  return {
    number,
    title,
    url: `https://github.com/natb1/commons.systems/issues/${number}`,
    createdAt: new Date(now.getTime() - ageMs),
    repo: "natb1/commons.systems",
    ...(phase !== undefined ? { phase } : {}),
  };
}

afterEach(() => cleanup());

describe("ParkedIssuesPanel", () => {
  it("renders the empty state when parked is empty", () => {
    const { container } = render(<ParkedIssuesPanel parked={[]} now={now} />);

    const empty = container.querySelector(".empty");
    expect(empty).not.toBeNull();
    expect(empty?.textContent).toBe("Nothing parked.");

    const list = container.querySelector(".parked-issue-list");
    expect(list?.querySelectorAll("li").length).toBe(0);
  });

  it("renders one li.parked-issue per item with a linked title and age", () => {
    const parked = [
      parkedIssue(101, "Fix the flaky test", 3 * DAY),
      parkedIssue(202, "Update docs", 1 * DAY),
    ];

    const { container } = render(<ParkedIssuesPanel parked={parked} now={now} />);

    const items = Array.from(container.querySelectorAll("li.parked-issue"));
    expect(items.length).toBe(2);

    // No empty state when non-empty.
    expect(container.querySelector(".empty")).toBeNull();

    for (const li of items) {
      const link = li.querySelector(".parked-issue-title");
      expect(link).not.toBeNull();
      expect(link?.tagName).toBe("A");
      expect((link as HTMLAnchorElement).href).toMatch(/github\.com/);
      expect(link?.textContent).not.toBe("");

      const age = li.querySelector(".parked-issue-age");
      expect(age).not.toBeNull();
      expect(age?.textContent).not.toBe("");
    }
  });

  it("sorts oldest-first so the most-stale item appears first", () => {
    const parked = [
      parkedIssue(1, "newer", 1 * DAY),
      parkedIssue(2, "oldest", 10 * DAY),
      parkedIssue(3, "middle", 5 * DAY),
    ];

    const { container } = render(<ParkedIssuesPanel parked={parked} now={now} />);

    const items = Array.from(container.querySelectorAll("li.parked-issue"));
    const titles = items.map((li) => li.querySelector(".parked-issue-title")?.textContent ?? "");
    expect(titles).toEqual(["oldest", "middle", "newer"]);
  });

  it("renders the age label in humanized form", () => {
    const parked = [parkedIssue(42, "Some issue", 3 * DAY)];

    const { container } = render(<ParkedIssuesPanel parked={parked} now={now} />);

    const age = container.querySelector(".parked-issue-age");
    expect(age?.textContent).toBe("3d");
  });

  it("renders a phase chip when phase is set", () => {
    const parked = [parkedIssue(55, "Review needed", 2 * DAY, "dispatch:review")];

    const { container } = render(<ParkedIssuesPanel parked={parked} now={now} />);

    const phase = container.querySelector(".parked-issue-phase");
    expect(phase).not.toBeNull();
    expect(phase?.textContent).toBe("dispatch:review");
  });

  it("renders no phase chip when phase is absent", () => {
    const parked = [parkedIssue(66, "No phase", 1 * DAY)];

    const { container } = render(<ParkedIssuesPanel parked={parked} now={now} />);

    const phase = container.querySelector(".parked-issue-phase");
    expect(phase).toBeNull();
  });

  it("renders the PARKED heading", () => {
    const { container } = render(<ParkedIssuesPanel parked={[]} now={now} />);

    const heading = container.querySelector(".parked-issues-heading");
    expect(heading).not.toBeNull();
    expect(heading?.textContent).toBe("PARKED");
  });
});
