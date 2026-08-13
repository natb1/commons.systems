import { describe, expect, it } from "vitest";
import { attributeSpend, spendBucketsFrom, workflowOfSkill } from "../src/spend.js";

describe("workflowOfSkill / attributeSpend", () => {
  it("maps each workflow's skills, and unknown skills to other", () => {
    expect(workflowOfSkill("qa-fix")).toBe("dispatch");
    expect(workflowOfSkill("office-hours")).toBe("office-hours");
    expect(workflowOfSkill("rsi-audit")).toBe("rsi");
    // The per-phase ladder evaluator scales with dispatch volume, so it is
    // attributed to dispatch despite being named `rsi`.
    expect(workflowOfSkill("rsi")).toBe("dispatch");
    expect(workflowOfSkill("some-future-skill")).toBe("other");
  });

  it("folds per-skill buckets into shares over the four workflows", () => {
    const spend = attributeSpend({
      "qa-fix": { price_proxy_usd: 60, cost_usd: 20, turns: 6 },
      implement: { price_proxy_usd: 20, cost_usd: 10, turns: 2 },
      "office-hours": { price_proxy_usd: 10, cost_usd: 5, turns: 1 },
      "rsi-audit": { price_proxy_usd: 10, cost_usd: 5, turns: 1 },
    });
    expect(spend.map((s) => s.workflow)).toEqual(["dispatch", "office-hours", "rsi", "other"]);
    expect(spend[0]).toMatchObject({ priceProxyUsd: 80, costUsd: 30, turns: 8, share: 0.8 });
    expect(spend[1].share).toBeCloseTo(0.1);
    expect(spend[3]).toMatchObject({ priceProxyUsd: 0, share: 0 });
  });

  it("does not divide by zero on an empty window", () => {
    expect(attributeSpend({}).every((s) => s.share === 0)).toBe(true);
  });
});

describe("spendBucketsFrom", () => {
  it("extracts by_phase buckets, coercing each field to a finite number", () => {
    expect(
      spendBucketsFrom({
        by_phase: { "qa-fix": { price_proxy_usd: 5, cost_usd: 1, turns: 2 } },
      }),
    ).toEqual({ "qa-fix": { price_proxy_usd: 5, cost_usd: 1, turns: 2 } });
  });

  it("zeroes a missing or non-finite field rather than propagating NaN", () => {
    expect(
      spendBucketsFrom({ by_phase: { "qa-fix": { price_proxy_usd: "5", turns: null } } }),
    ).toEqual({ "qa-fix": { price_proxy_usd: 0, cost_usd: 0, turns: 0 } });
  });

  it("skips an unreadable bucket instead of inventing a zero-spend row for it", () => {
    expect(spendBucketsFrom({ by_phase: { "qa-fix": "not-a-bucket" } })).toEqual({});
  });

  it("returns null — not an empty map — for a document that is not an aggregate", () => {
    expect(spendBucketsFrom(null)).toBeNull();
    expect(spendBucketsFrom("[]")).toBeNull();
    expect(spendBucketsFrom({ totals: {} })).toBeNull();
  });
});
