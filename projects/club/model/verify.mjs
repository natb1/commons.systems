#!/usr/bin/env node
// Invariants the club model must hold — run with `node model/verify.mjs`.
//
// These are the checks the explorer was verified against by hand when the model
// was rebuilt (the reconciliation with §6, the marginals, the levers that must
// not touch owner comp). They live here now so a change to model.mjs either
// keeps them or says which one it broke.
import * as M from "./model.mjs";
import { FIGURES, proFormaCogsK } from "./figures.mjs";

let failures = 0;
const near = (a, b, tol = 0.05) => Math.abs(a - b) <= tol;
function check(name, ok, detail = "") {
  if (ok) return;
  failures++;
  console.error(`FAIL  ${name}${detail ? " — " + detail : ""}`);
}
// Every node of a tree, parents included — M.eachLeaf only reaches the leaves.
const walk = (node, fn) => { fn(node); node.children.forEach((c) => walk(c, fn)); };
const isText = (v) => typeof v === "string" && v.length > 0;

// The lever grid the structural groups run over: both sites, both finance paths,
// four utilizations, three café marks, every wage rung — 192 points. Big enough
// that a cost attributed to the wrong stream shows up somewhere, small enough
// that the file still runs in CI on every PR.
const GRID = [];
for (const site of ["li", "sn"]) {
  for (const fin of ["lease", "buy"]) {
    for (const util of [0, 33, 55, 80]) {
      for (const tx of [0, 80, 130]) {
        for (const wage of [0, 1, 2, 3]) GRID.push({ site, fin, util, tx, wage });
      }
    }
  }
}
const at = (pt) => `${pt.site}/${pt.fin} util ${pt.util} tx ${pt.tx} wage ${pt.wage}`;

// 1 — the base case reproduces §6 on §6's own terms. It runs on the *stated*
// operations basis, where the ops line is solved from §6's two published totals:
// what it proves is that the rest of the model's arithmetic lands on §6 given
// §6's own operations figures. The built basis deliberately no longer reproduces
// them — how far it misses by is group 3's business, not this one's. Labor is
// held at §6's own $120K line; everything else is the model's own arithmetic.
for (const [site, published] of [["li", -13], ["sn", -36]]) {
  const comp = M.withOpsBasis("stated", () => M.withState({ site }, () =>
    M.comp(M.PLAN.util, M.SITES[site].mark) + (M.laborK() - M.PLAN_LABOR_K)));
  check(`§6 base case reproduces at ${site} on the stated basis`, Math.abs(comp - published) < 1.5,
    `model ${comp.toFixed(1)} vs published ${published}`);
}

// 2 — every line of the breakdown is accounted for: the parts sum to the whole.
M.withState({}, () => {
  const parts = M.roomsK(M.S.util) + M.cafeK(M.S.tx)
    + M.cateringK(M.S.util, M.S.caClub, M.S.caEvent, M.S.events) + M.otherIncomeK()
    - M.varOpsK(M.S.util, M.S.tx) - M.FIXED_OPS - M.occupancyK() - M.laborK() - M.S.commons;
  check("breakdown sums to owner comp", near(parts, M.comp(M.S.util, M.S.tx)));
});

// 3 — the operations line built from components reconciles with §6's stated
// totals. This replaces the old "the fixed base lands identically at both sites"
// check, which could not fail: VAR_OPS was *defined* as
// (ops_li − ops_sn)/(rev_li − rev_sn), so the residual was identically zero for
// any two (ops, revenue) pairs. The built total knows nothing about §6's figures
// — it is utilities + insurance + software + R&M plus card fees and marketing on
// revenue — so agreeing with them is a real result, and a component that drifts
// breaks it. 6% is the tolerance the current +2.7% (LI) / +2.4% (SN) sits inside.
for (const site of ["li", "sn"]) {
  const built = M.builtOpsK(site), stated = M.SITES[site].ops;
  check(`built operations reconciles with §6 at ${site}`, Math.abs(built - stated) <= 0.06 * stated,
    `built ${built.toFixed(2)} vs §6 ${stated} (${(100 * (built - stated) / stated).toFixed(1)}%)`);
  // The Location lever's tooltip quotes that same figure to the reader. It used
  // to quote it as a typed-in literal and went stale the moment the line was
  // rebuilt — the page said $65K while the breakdown beside it said $67K. It is
  // computed now, and this is what keeps it that way: a hardcoded number here
  // fails as soon as the built total moves off it.
  const hint = M.siteHint(site);
  check(`the ${site} tooltip quotes the built operations figure`,
    hint.includes(`operations $${Math.round(built)}K`),
    hint.slice(0, 90));
}

// 4 — every cost carries its provenance. A cost with no stream cannot be placed
// in the tree, one with no grade cannot be ranked against the others, and an
// assumed (D) number with no band cannot be swept or argued about. A `derived`
// entry is a residual — its amount is whatever is left after the rest, so the
// band is the only thing that makes it falsifiable and is therefore required.
// This is the check a newly added cost has to get past.
for (const c of M.COSTS) {
  check(`cost ${c.id} declares a stream`, isText(c.stream), String(c.stream));
  check(`cost ${c.id} carries a known evidence grade`,
    Object.prototype.hasOwnProperty.call(M.EV, c.ev), String(c.ev));
  check(`cost ${c.id} carries an amount`, typeof c.amount === "function");
  if (c.ev === "D" || c.derived === true) {
    const b = c.band;
    check(`cost ${c.id} is banded (${c.derived === true ? "derived" : "grade D"})`,
      Array.isArray(b) && b.length === 2 && b[0] < b[1] && isText(c.unit),
      `band ${JSON.stringify(b)} unit ${String(c.unit)}`);
  }
}

// 5 — occupancy is built from its parts, and the part that is a residual is
// bounded. The identity (base rent + NNN = §6's occupancy total, plus $2K on the
// buy path) holds the split to the published total and catches base rent being
// stated one way and subtracted another — nnnK() computes the rent it takes out
// itself rather than calling baseRentK(), so the two can drift apart. What the
// identity cannot do is say the split is right: NNN is defined as the remainder,
// so nothing about its size is tested by it. The check that earns its keep is
// the plausibility one — the NNN the split implies, per square foot, has to land
// inside the benchmark band the registry declares. LI is $9.20/sf, SN $5.33/sf
// against $5–12/sf, so SN sits close enough to the floor that a rent or area
// change pushes it out, which is exactly when someone should be told.
const nnn = M.costById("nnn");
const nnnBand = nnn === null ? null : nnn.band;
check("the registry carries an NNN entry banded in $/sf",
  nnn !== null && nnn.unit === "psf" && Array.isArray(nnnBand));
for (const site of ["li", "sn"]) {
  M.withState({ site }, () => {
    check(`occupancy is base rent plus NNN at ${site}`,
      near(M.baseRentK() + M.nnnK(), M.SITES[site].occ, 1e-9),
      `${M.baseRentK()} + ${M.nnnK()} vs ${M.SITES[site].occ}`);
    check(`lease-path occupancy equals §6's total at ${site}`,
      near(M.occupancyK(), M.SITES[site].occ, 1e-9), `${M.occupancyK()}`);
    check(`implied NNN at ${site} is inside its benchmark band`,
      Array.isArray(nnnBand) && M.nnnPsf() >= nnnBand[0] && M.nnnPsf() <= nnnBand[1],
      `$${M.nnnPsf().toFixed(2)}/sf vs ${Array.isArray(nnnBand) ? `$${nnnBand[0]}–${nnnBand[1]}/sf` : "no band"}`);
  });
  M.withState({ site, fin: "buy" }, () => {
    check(`buy-path occupancy is the lease total plus the premium at ${site}`,
      near(M.occupancyK(), M.SITES[site].occ + 2, 1e-9), `${M.occupancyK()}`);
  });
}

// 6 — marketing is a real cost, not a word. The adversarial review's Finding 15
// fix ("2–3% of revenue, $8–13K") was unenforceable while marketing existed only
// as a share of a solved operations rate: nothing could tell whether the venture
// had budgeted acquisition spend or zero. Now it is a registry entry, so it can
// be asserted to exist and to cost something.
const mkt = M.costById("marketing");
check("the registry carries a marketing cost", mkt !== null);
M.withState({}, () => {
  const spend = mkt === null ? 0 : mkt.amount(M.S.util, M.S.tx);
  check("marketing is a nonzero cost", spend > 0, `$${spend.toFixed(1)}K`);
});

// 7 — the stated marginals are the actual marginals.
M.withState({}, () => {
  // One more filled weekly session brings its catering attach with it, so the
  // room line alone is not the whole marginal — the two together are.
  const step = 100 / M.CAPACITY;
  const actual = M.comp(M.S.util + step, M.S.tx) - M.comp(M.S.util, M.S.tx);
  const cater = M.cateringK(M.S.util + step, M.S.caClub, M.S.caEvent, M.S.events)
    - M.cateringK(M.S.util, M.S.caClub, M.S.caEvent, M.S.events);
  const caterRev = M.caterRevK(M.S.util + step, M.S.caClub, M.S.caEvent, M.S.events)
    - M.caterRevK(M.S.util, M.S.caClub, M.S.caEvent, M.S.events);
  check("session marginal is the room line plus its catering attach",
    near(actual, M.msess(M.S.price) + cater - M.VAR_OPS * caterRev, 0.01));
  check("walk-in marginal is the actual marginal",
    near(M.comp(M.S.util, M.S.tx + 1) - M.comp(M.S.util, M.S.tx), M.mtx(M.S.ticket), 0.01));
});

// 8 — catering can never attach to more sessions than exist.
for (const util of [0, 10, 33, 55, 80, 100]) {
  M.withState({ util }, () => {
    const orders = M.caterOrders(util, 100, 100, M.S.events);
    check(`catering attach is capped by sessions at ${util}%`, orders <= M.sessions(util) + 1e-9);
  });
}

// 9 — the levers that must not touch stabilized owner comp do not. `equity` is
// excluded here and checked in its own group (19) below: DEF.equity is now
// null, and null + 10 === 10 in JS, so leaving it in this loop would pass for
// the wrong reason — it would exercise `withState({equity: 10}, ...)`, an
// override, not "equity moved by 10 off its default".
const baseComp = M.withState({}, () => M.comp(M.S.util, M.S.tx));
for (const lever of ["churn", "build", "ti", "abate", "grants", "cash", "runway"]) {
  const moved = M.withState({ [lever]: M.DEF[lever] + 10 }, () => M.comp(M.DEF.util, M.DEF.tx));
  check(`${lever} does not move owner comp`, near(moved, baseComp, 1e-9));
}

// 10 — a matrix cell equals the readout at the same point.
M.withState({ site: "sn", util: 55, tx: 88 }, () => {
  check("matrix cell equals the readout at the same point", near(M.comp(55, 88), M.comp(M.S.util, M.S.tx)));
});

// 11 — the wage rungs are priced from their parts, and the labor line is the
// rung's rate over the plan's own staffed grid.
M.WAGES.forEach((w, i) => {
  check(`wage rung ${i} totals its parts`, near(w.rate, w.cash + w.pay + w.ben, 0.011));
  check(`wage rung ${i} labor is rate × grid`,
    near(M.withState({ wage: i }, () => M.laborK()), w.rate * M.STAFF_HRS / 1000, 0.01));
});

// 12 — the stream tree is complete and internally consistent. Every parent is
// worth exactly its children, the leaves come to owner comp, the per-stream
// margins reconcile with the whole, and no cost floats without a stream. Run
// across the lever grid, because a cost attributed to the wrong stream still
// sums correctly at the default point, and on *both* operations bases, because a
// discrepancy that shows up on only one means a component was mis-attributed
// between the fixed and revenue-proportional halves.
for (const basis of ["built", "stated"]) {
  let parent = null, leaves = null, margins = null, orphan = null;
  M.withOpsBasis(basis, () => {
    for (const pt of GRID) {
      M.withState(pt, () => {
        const nodes = M.tree(pt.util, pt.tx);
        let total = 0;
        for (const n of nodes) {
          walk(n, (node) => {
            if (node.children.length === 0) { total += node.value; return; }
            const kids = node.children.reduce((a, c) => a + c.value, 0);
            if (parent === null && near(node.value, kids, 1e-9) === false)
              parent = `${at(pt)}: ${node.id} ${node.value.toFixed(3)} vs children ${kids.toFixed(3)}`;
          });
          walk(n, (node) => {
            if (orphan === null && node.kind === "cost" && isText(node.stream) === false)
              orphan = `${at(pt)}: ${node.id} has no stream`;
          });
        }
        const comp = M.comp(pt.util, pt.tx);
        if (leaves === null && near(total, comp, 0.01) === false)
          leaves = `${at(pt)}: leaves ${total.toFixed(3)} vs comp ${comp.toFixed(3)}`;
        const m = M.streamMargins(pt.util, pt.tx);
        const byStream = m.cafe.margin + m.rooms.margin + m.books.margin - m.shared.cost;
        if (margins === null && near(byStream, comp, 0.01) === false)
          margins = `${at(pt)}: stream margins ${byStream.toFixed(3)} vs comp ${comp.toFixed(3)}`;
      });
    }
  });
  check(`every tree parent equals its children on the ${basis} basis`, parent === null, parent ?? "");
  check(`tree leaves sum to owner comp on the ${basis} basis`, leaves === null, leaves ?? "");
  check(`stream margins less cross-cutting equal owner comp on the ${basis} basis`,
    margins === null, margins ?? "");
  check(`every cost node carries a stream on the ${basis} basis`, orphan === null, orphan ?? "");
}

// 13 — the two groupings are the same P&L. Group 2's cost-nature parts and the
// stream tree slice the identical arithmetic two ways, so they have to agree
// everywhere, not just at the default point — if the stream view could disagree
// with the waterfall the explorer already draws, one of the two is lying.
for (const basis of ["built", "stated"]) {
  let disagree = null;
  M.withOpsBasis(basis, () => {
    for (const pt of GRID) {
      M.withState(pt, () => {
        const parts = M.roomsK(pt.util) + M.cafeK(pt.tx)
          + M.cateringK(pt.util, M.S.caClub, M.S.caEvent, M.S.events) + M.otherIncomeK()
          - M.varOpsK(pt.util, pt.tx) - M.FIXED_OPS - M.occupancyK() - M.laborK() - M.S.commons;
        let byTree = 0;
        for (const n of M.tree(pt.util, pt.tx)) M.eachLeaf(n, (l) => { byTree += l.value; });
        if (disagree === null && near(parts, byTree, 0.01) === false)
          disagree = `${at(pt)}: by nature ${parts.toFixed(3)} vs by stream ${byTree.toFixed(3)}`;
      });
    }
  });
  check(`the cost-nature and stream groupings agree on the ${basis} basis`,
    disagree === null, disagree ?? "");
}

// 14 — absorbing the cross-cutting row is a presentation choice, not an
// accounting one. Pushing marketing, labor and occupancy onto the three revenue
// streams changes which stream looks profitable — that is the whole reason the
// explorer makes the basis a visible control — but it must not change the
// bottom line. Whatever basis a reader picks, the absorbed stream margins have
// to add back up to owner comp, and the weights have to be a full distribution:
// a basis that quietly dropped part of the shared row would make every stream
// look better than it is.
for (const basis of ["revenue", "sqft", "hours"]) {
  let broke = null, lost = null;
  for (const pt of GRID) {
    M.withState(pt, () => {
      const w = M.absorbWeights(basis, pt.util, pt.tx);
      const wsum = Object.keys(w).reduce((a, key) => a + w[key], 0);
      if (lost === null && near(wsum, 1, 1e-9) === false)
        lost = `${at(pt)}: weights sum to ${wsum.toFixed(6)}`;
      const abs = M.absorb(basis, pt.util, pt.tx);
      const total = Object.keys(abs).reduce((a, key) => a + abs[key].margin, 0);
      if (broke === null && near(total, M.comp(pt.util, pt.tx), 0.01) === false)
        broke = `${at(pt)}: absorbed ${total.toFixed(3)} vs comp ${M.comp(pt.util, pt.tx).toFixed(3)}`;
    });
  }
  check(`absorbing by ${basis} distributes the whole cross-cutting row`, lost === null, lost ?? "");
  check(`absorbing by ${basis} leaves owner comp unchanged`, broke === null, broke ?? "");
}

// 15 — §6's pro forma column adds up to the owner-comp row printed at the
// bottom of it. This is the one thing a reader does by hand, and it was wrong:
// the Cost of sale row rebuilt café, catering and prints but not the room
// line's 6%, so the column came out ~$3K above the row it was supposed to
// explain. Nothing caught it, because every individual row was right and only
// their sum was not.
for (const site of ["li", "sn"]) {
  M.withState({ site }, () => {
    const rev = M.revenueK(M.PLAN.util, M.SITES[site].mark);
    const column = rev - proFormaCogsK(site) - M.PLAN_LABOR_K - M.builtOpsK(site)
      - M.S.commons - M.occupancyK();
    const printed = M.comp(M.PLAN.util, M.SITES[site].mark) + (M.laborK() - M.PLAN_LABOR_K);
    check(`§6's pro forma column sums to its owner-comp row at ${site}`,
      near(column, printed, 0.01), `column ${column.toFixed(2)} vs row ${printed.toFixed(2)}`);
  });
}

// 16 — every figure the documents quote resolves to a number, not a NaN or an
// empty string. A renamed model constant fails here rather than in the docs.
for (const [name, value] of Object.entries(FIGURES)) {
  check(`figure ${name} resolves`, typeof value === "string" && value.length > 0 && !value.includes("NaN"), value);
}

// ---- the capital layer -------------------------------------------------------

// 17 — `ti`, `grants` and `abate` move the owner's bar; `build` does not. `build`
// stopped being the fit-out budget and became the scope cap D7 describes: it is
// *checked* against the derived scope, never spent, so it cannot reach
// capitalAtRiskK() or bandLoK() at all. `ti`, `grants` and `abate` are still uses
// (or reduce a use), so moving them moves requiredCapitalK() and, through it,
// the bar. This is the positive half of the plan's claim that was wrong about
// `build` — asserted directly rather than left to the comp-invariance loop in 9,
// which only proves `build` does not touch a *different* number.
const baseBar = M.withState({}, () => M.bandLoK());
for (const lever of ["ti", "grants", "abate"]) {
  const moved = M.withState({ [lever]: M.DEF[lever] + 10 }, () => M.bandLoK());
  check(`${lever} moves the owner's bar`, Math.abs(moved - baseBar) > 0.5,
    `base ${baseBar.toFixed(3)} vs moved ${moved.toFixed(3)}`);
}
{
  const moved = M.withState({ build: M.DEF.build + 10 }, () => M.bandLoK());
  check("build does not move the owner's bar", near(moved, baseBar, 1e-9),
    `base ${baseBar.toFixed(3)} vs moved ${moved.toFixed(3)}`);
}
// `build` is supposed to bite through scopeOverrunK() instead: a cap set below
// the derived scope reports the shortfall, and one set at or above it reports
// zero — the check the cap actually gates.
M.withState({}, () => {
  const scope = M.fitoutScopeK();
  check("build at or above the derived scope has no overrun",
    M.withState({ build: scope }, () => M.scopeOverrunK()) === 0);
  check("build below the derived scope raises scopeOverrunK by the shortfall",
    near(M.withState({ build: scope - 20 }, () => M.scopeOverrunK()), 20, 1e-9),
    `scope ${scope}`);
});

// 18 — `runway` newly moves the owner's bar. At LI defaults the ramp never
// turns inside the horizon (group 24 below), so workingCapitalK() falls back to
// runwayReserveK() — the reserve that funds S.runway months of the stabilized
// burn — and a longer runway means more required capital, which is a real,
// intended change in the bar. This is deliberately not folded into group 9's
// "does not move" list; asserting the movement here keeps the two lists honest
// about which levers do what.
{
  const moved = M.withState({ runway: M.DEF.runway + 10 }, () => M.bandLoK());
  check("runway moves the owner's bar (via the working-capital fallback)",
    moved > baseBar + 0.5, `base ${baseBar.toFixed(3)} vs moved ${moved.toFixed(3)}`);
}

// 19 — `equity`, both halves explicit. DEF.equity is null, meaning "derive it
// from the uses registry" — so moving it by DEF.equity + 10 is meaningless
// (null + 10 === 10) and group 9 excludes it for exactly that reason. Here:
// the null default still does not move owner comp (comp() never reads S.equity
// at all), and a numeric override *does* move the bar, because bandLoK() charges
// its return on equityK() and equityK() returns the override verbatim.
M.withState({}, () => {
  check("equity's null default does not move owner comp",
    near(M.comp(M.S.util, M.S.tx), baseComp, 1e-9));
});
{
  const moved = M.withState({ equity: M.DEF.equity === null ? 400 : M.DEF.equity + 10 }, () => M.bandLoK());
  check("an equity override moves the owner's bar", Math.abs(moved - baseBar) > 0.5,
    `base ${baseBar.toFixed(3)} vs override ${moved.toFixed(3)}`);
  const compMoved = M.withState({ equity: 400 }, () => M.comp(M.DEF.util, M.DEF.tx));
  check("an equity override still does not move owner comp", near(compMoved, baseComp, 1e-9));
}

// 20 — required capital is the sum of the USES registry, on both finance paths
// and both sites. On the buy path the registry swaps `deposit` for
// `downpayment` + `closing` (`deposit` reads zero there); everything else in
// USES is unchanged. This replaces the plan's original buy-path invariant
// ("down payment + closing + FF&E + working capital equals required capital"),
// which measures 142.1 against a required capital of 317.4 — a purchased
// building still needs fit-out, licenses, staffing and stock, so the true
// identity is the whole registry, not four of its eleven lines.
for (const site of ["li", "sn"]) {
  for (const fin of ["lease", "buy"]) {
    M.withState({ site, fin }, () => {
      let sum = 0;
      M.USES.forEach((u) => { sum += u.amount(); });
      check(`required capital equals the sum of USES at ${site}/${fin}`,
        near(sum, M.requiredCapitalK(), 1e-9), `sum ${sum.toFixed(3)} vs requiredCapitalK ${M.requiredCapitalK().toFixed(3)}`);
      if (fin === "buy") {
        check(`${site}/buy carries downpayment and closing in place of deposit`,
          M.useAmountK("deposit") === 0 && M.useAmountK("downpayment") > 0 && M.useAmountK("closing") > 0,
          `deposit ${M.useAmountK("deposit")} downpayment ${M.useAmountK("downpayment")} closing ${M.useAmountK("closing")}`);
      } else {
        check(`${site}/lease carries a deposit and no downpayment or closing`,
          M.useAmountK("deposit") > 0 && M.useAmountK("downpayment") === 0 && M.useAmountK("closing") === 0,
          `deposit ${M.useAmountK("deposit")} downpayment ${M.useAmountK("downpayment")} closing ${M.useAmountK("closing")}`);
      }
    });
  }
}
check("headroomK is cash less required capital",
  near(M.withState({}, () => M.headroomK()), M.withState({}, () => M.S.cash - M.requiredCapitalK())), 1e-9);

// 21 — the registry gate, applied to uses. The same four provenance
// obligations group 4 requires of COSTS: a driver, a known evidence grade, an
// amount function, and — for a grade-D or a derived entry — a band with a unit.
// An under-declared use should be refused the same way an under-declared cost
// already is.
for (const u of M.USES) {
  check(`use ${u.id} declares a driver`, isText(u.driver), String(u.driver));
  check(`use ${u.id} carries a known evidence grade`,
    Object.prototype.hasOwnProperty.call(M.EV, u.ev), String(u.ev));
  check(`use ${u.id} carries an amount`, typeof u.amount === "function");
  if (u.ev === "D" || u.derived === true) {
    const b = u.band;
    check(`use ${u.id} is banded (${u.derived === true ? "derived" : "grade D"})`,
      Array.isArray(b) && b.length === 2 && b[0] < b[1] && isText(u.unit),
      `band ${JSON.stringify(b)} unit ${String(u.unit)}`);
  }
}

// 22 — the peak deficit is the minimum of the cumulative series, negated and
// floored at zero, and monthsToPositive/monthsToRecover agree with that same
// series (rather than silently rebuilding their own). Checked at a case that
// turns (the gate case) and one that does not (LI base), so both branches of
// the min-search and the null fallback are exercised.
{
  const s = M.withState({ util: 55, tx: 110 }, () => M.rampSeries());
  const lo = s.reduce((m, r) => Math.min(m, r.cumulative), 0);
  check("peakDeficitK is the negated floored minimum of the cumulative series (gate case)",
    near(M.peakDeficitK(s), Math.max(0, -lo), 1e-9), `${M.peakDeficitK(s)} vs ${Math.max(0, -lo)}`);
  const wantPositive = s.find((r) => r.margin >= 0);
  const wantRecover = s.find((r) => r.cumulative >= 0);
  check("monthsToPositive agrees with the series (gate case)",
    M.monthsToPositive(s) === (wantPositive ? wantPositive.m : null));
  check("monthsToRecover agrees with the series (gate case)",
    M.monthsToRecover(s) === (wantRecover ? wantRecover.m : null));
}
{
  const s = M.withState({}, () => M.rampSeries());
  const lo = s.reduce((m, r) => Math.min(m, r.cumulative), 0);
  check("peakDeficitK is the negated floored minimum of the cumulative series (LI base)",
    near(M.peakDeficitK(s), Math.max(0, -lo), 1e-9));
  check("monthsToPositive is null when the series never turns positive (LI base)",
    M.monthsToPositive(s) === null, `${M.monthsToPositive(s)}`);
  check("monthsToRecover is null when the series never recovers (LI base)",
    M.monthsToRecover(s) === null, `${M.monthsToRecover(s)}`);
}

// 23 — month 24 of the ramp annualizes to comp() at that month's own marks.
// This is the invariant that keeps the ramp — the model's one time dimension —
// from drifting away from the stabilized Year-2 snapshot every other figure in
// the file is built against: by month 24 the linear ramp (rampMo = 18) has long
// since closed, so the month's util/tx sit at their stabilized marks and the
// month's margin has to equal comp() at those marks, divided by twelve, exactly
// — not approximately. Checked at LI base, the LI gate case, and SN base.
for (const [label, over] of [["LI base", {}], ["LI gate", { util: 55, tx: 110 }], ["SN base", { site: "sn" }]]) {
  M.withState(over, () => {
    const m24 = M.rampSeries().find((r) => r.m === 24);
    const expected = M.comp(m24.util, m24.tx) / 12;
    check(`month 24 of the ramp annualizes to comp() at ${label}`,
      Math.abs(m24.margin - expected) < 1e-6,
      `margin ${m24.margin} vs comp()/12 ${expected}`);
  });
}

// 24 — workingCapitalK() takes the peak deficit when the ramp turns cash-flow
// positive within the horizon, and falls back to the runway reserve when it
// does not — both branches asserted explicitly, not inferred from one case.
// LI base never turns inside RAMP_HORIZON_MO; the LI gate case (55% util, 110
// tx/day) turns at month 15.
M.withState({}, () => {
  check("LI base does not turn within the horizon", M.rampTurns() === false);
  check("workingCapitalK falls back to the runway reserve when the ramp never turns",
    near(M.workingCapitalK(), M.runwayReserveK(), 1e-9),
    `${M.workingCapitalK()} vs runway reserve ${M.runwayReserveK()}`);
});
M.withState({ util: 55, tx: 110 }, () => {
  check("the LI gate case turns cash-flow positive within the horizon", M.rampTurns() === true);
  check("the LI gate case turns at month 15", M.monthsToPositive() === 15, `${M.monthsToPositive()}`);
  check("workingCapitalK takes the peak deficit once the ramp turns",
    near(M.workingCapitalK(), M.peakDeficitK(), 1e-9),
    `${M.workingCapitalK()} vs peak deficit ${M.peakDeficitK()}`);
});

// 25 — WC_BASIS, mirroring OPS_BASIS (group 3). The stated basis reproduces
// §6's band exactly, because it just returns WC — the band's own midpoint. The
// built basis does not reconcile with it at the base case: this is a finding
// to report (§6's $50–65K is a gate-case figure, not a base-case one — see
// group 24, where the base case never even turns), not a tolerance to relax
// until it passes. So this asserts the *structural* relation — built and
// stated disagree at the base case — never a reconciliation.
M.withState({}, () => {
  check("the stated working-capital basis reproduces §6's band",
    M.withWcBasis("stated", () => M.workingCapitalK()) === M.WC,
    `${M.withWcBasis("stated", () => M.workingCapitalK())} vs ${M.WC}`);
  const built = M.workingCapitalK(), stated = M.withWcBasis("stated", () => M.workingCapitalK());
  check("the built working-capital basis does not reconcile with the stated basis at LI base — a finding, not a bug",
    Math.abs(built - stated) > 5, `built ${built.toFixed(1)} vs stated ${stated}`);
});

// 26 — the buy path's Year-2 principal is the loan amortization, not the flat
// BUY_EQUITY constant it replaces. principalK() hardcodes loan year 2 (the
// figure the bar's equityBuildK() chip reads); loanPrincipalK(yr) is the
// general amortization schedule it is built from, and successive years season
// (more principal, less interest) rather than repeating a flat number.
M.withState({ site: "sn", fin: "buy" }, () => {
  const yr1 = M.loanPrincipalK(1), yr2 = M.loanPrincipalK(2), yr3 = M.loanPrincipalK(3);
  check("principalK() equals loanPrincipalK(2)", near(M.principalK(), yr2, 1e-9), `${M.principalK()} vs ${yr2}`);
  check("principalK() is not the flat BUY_EQUITY constant",
    Math.abs(M.principalK() - M.BUY_EQUITY) > 1, `${M.principalK()} vs BUY_EQUITY ${M.BUY_EQUITY}`);
  check("the amortization schedule seasons: yr1 < yr2 < yr3",
    yr1 < yr2 && yr2 < yr3, `${yr1.toFixed(3)} < ${yr2.toFixed(3)} < ${yr3.toFixed(3)}`);
});
M.withState({ site: "li", fin: "lease" }, () => {
  check("principalK() is zero on the lease path", M.principalK() === 0);
});

// 27 — the acyclicity claim, asserted rather than merely commented. comp() is
// untouched by the whole capital layer: drawK() is comp() less the
// replacement reserve, the tax distribution and principal — nothing more,
// nothing less — and replacementReserveK()'s depreciable base is hardCostK()
// (fit-out + FF&E), never requiredCapitalK(), which would run working capital
// (and so comp()) back into the reserve it is subtracted from. Pinning working
// capital to a different value and finding replacementReserveK() unmoved is
// the check that would catch the cycle if it were ever wired in.
M.withState({}, () => {
  const expectedDraw = M.comp(M.S.util, M.S.tx) - M.replacementReserveK() - M.taxDistK() - M.principalK();
  check("drawK() equals comp() less reserve, tax distribution and principal",
    near(M.drawK(), expectedDraw, 1e-9), `${M.drawK()} vs ${expectedDraw}`);
  check("replacementReserveK()'s depreciable base is hardCostK()",
    near(M.depreciableBaseK(), M.hardCostK(), 1e-9), `${M.depreciableBaseK()} vs ${M.hardCostK()}`);
  const before = M.replacementReserveK();
  const after = M.withWcBasis("stated", () => M.replacementReserveK());
  check("replacementReserveK() is unmoved by a different working-capital basis (acyclicity)",
    near(before, after, 1e-9), `${before} vs ${after}`);
});

// 28 — equityK(): a null default derives from capitalAtRiskK(); a number
// overrides it verbatim, the same override contract every other DEF lever
// uses. (comp() itself never reads S.equity at all — see group 19.)
M.withState({}, () => {
  check("equityK() with the null default equals capitalAtRiskK()",
    near(M.equityK(), M.capitalAtRiskK(), 1e-9), `${M.equityK()} vs ${M.capitalAtRiskK()}`);
});
check("equityK() with a numeric override returns the override verbatim",
  M.withState({ equity: 123 }, () => M.equityK()) === 123);

const groupCount = 28;
console.log(failures ? `\n${failures} invariant(s) failed` : `model: ${Object.keys(FIGURES).length} figures and ${groupCount} invariant groups pass`);
process.exit(failures ? 1 : 0);
