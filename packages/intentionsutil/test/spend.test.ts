import { describe, expect, it } from "vitest";
import { attributeSpend, spendBucketsFrom, workflowOfSkill } from "../src/spend.js";
import { renderSpendFold, spendDeviation } from "../scripts/attribute-spend.js";

describe("workflowOfSkill / attributeSpend", () => {
  it("maps each workflow's skills, and unknown skills to other", () => {
    expect(workflowOfSkill("qa-fix")).toBe("dispatch");
    expect(workflowOfSkill("office-hours")).toBe("office-hours");
    expect(workflowOfSkill("rsi-audit")).toBe("rsi");
    // The per-phase ladder evaluator scales with dispatch volume, so it is
    // attributed to dispatch despite being named `rsi`.
    expect(workflowOfSkill("rsi")).toBe("dispatch");
    // The ladder driver that spawns that evaluator buckets with it.
    expect(workflowOfSkill("dispatch-ladder")).toBe("dispatch");
    // `other` is a rendered remainder, not a dumping ground: author tooling
    // belongs to none of the three workflows and must stay unmapped.
    expect(workflowOfSkill("dataviz")).toBe("other");
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

// The dominance check the strategy states its fitness function in. These two
// cases were previously carried by `renderRsiPlan`'s `spend-deviation` flag; the
// `rsi-plan.md` render was retired 2026-08-12 and the rule moved to
// `scripts/attribute-spend.ts`, so they are re-expressed against that carrier —
// the predicate directly, and the CLI's own rendered report, which is the text
// `/rsi-audit` reads.
describe("spendDeviation / renderSpendFold", () => {
  it("flags a window where dispatch does not outpace the other workflows", () => {
    const spend = attributeSpend({
      "qa-fix": { price_proxy_usd: 10, cost_usd: 1, turns: 1 },
      "rsi-audit": { price_proxy_usd: 90, cost_usd: 9, turns: 9 },
    });
    expect(spendDeviation(spend)?.detail).toContain("rsi");
    expect(renderSpendFold(spend, "fixture.json")).toContain("SPEND-DEVIATION FLAG");
  });

  it("does not flag a window where dispatch dominates", () => {
    const spend = attributeSpend({
      "qa-fix": { price_proxy_usd: 90, cost_usd: 9, turns: 9 },
      "rsi-audit": { price_proxy_usd: 10, cost_usd: 1, turns: 1 },
    });
    expect(spendDeviation(spend)).toBeNull();
    expect(renderSpendFold(spend, "fixture.json")).not.toContain("SPEND-DEVIATION FLAG");
  });

  it("flags a rival that has merely caught dispatch — the threshold is >=, not >", () => {
    const spend = attributeSpend({
      "qa-fix": { price_proxy_usd: 50, cost_usd: 5, turns: 5 },
      "office-hours": { price_proxy_usd: 50, cost_usd: 5, turns: 5 },
    });
    expect(spendDeviation(spend)?.rivals.map((r) => r.workflow)).toEqual(["office-hours"]);
  });

  it("does not treat the unattributed `other` remainder as a rival workflow", () => {
    // A big `other` means WORKFLOW_SKILLS needs extending, not that some
    // workflow is outspending dispatch.
    const spend = attributeSpend({
      "qa-fix": { price_proxy_usd: 10, cost_usd: 1, turns: 1 },
      "some-future-skill": { price_proxy_usd: 90, cost_usd: 9, turns: 9 },
    });
    expect(spendDeviation(spend)).toBeNull();
  });

  it("does not flag an all-zero window, where every rival ties dispatch at 0", () => {
    expect(spendDeviation(attributeSpend({}))).toBeNull();
  });

  it("does not flag a window whose whole spend is unattributed `other`", () => {
    // Every attributed row is 0, so the rivals only TIE dispatch at 0 — the
    // same all-zero case above, reached through a window of unmapped skills.
    // Counting `other` as "something was measured" would fire the flag naming
    // office-hours and rsi, neither of which spent anything.
    const spend = attributeSpend({
      "some-future-skill": { price_proxy_usd: 90, cost_usd: 9, turns: 9 },
    });
    expect(spendDeviation(spend)).toBeNull();
    expect(renderSpendFold(spend, "fixture.json")).not.toContain("SPEND-DEVIATION FLAG");
  });

  it("prints one row per workflow plus a TOTAL that carries the window's whole spend", () => {
    const spend = attributeSpend({
      "qa-fix": { price_proxy_usd: 60, cost_usd: 20, turns: 6 },
      "office-hours": { price_proxy_usd: 20, cost_usd: 8, turns: 2 },
      "rsi-audit": { price_proxy_usd: 10, cost_usd: 4, turns: 1 },
      "some-future-skill": { price_proxy_usd: 10, cost_usd: 4, turns: 1 },
    });
    const out = renderSpendFold(spend, "fixture.json");
    for (const workflow of ["dispatch", "office-hours", "rsi", "other"]) {
      expect(out).toContain(workflow);
    }
    expect(out).toMatch(/TOTAL\s+100\.00\s+36\.00\s+10\s+100%/);
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
