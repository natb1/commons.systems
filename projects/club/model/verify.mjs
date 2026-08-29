#!/usr/bin/env node
// Invariants the club model must hold — run with `node model/verify.mjs`.
//
// These are the checks the explorer was verified against by hand when the model
// was rebuilt (the reconciliation with §6, the marginals, the levers that must
// not touch owner comp). They live here now so a change to model.mjs either
// keeps them or says which one it broke.
import * as M from "./model.mjs";
import { FIGURES } from "./figures.mjs";

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

// 9 — the levers that must not touch stabilized owner comp do not.
const baseComp = M.withState({}, () => M.comp(M.S.util, M.S.tx));
for (const lever of ["churn", "build", "ti", "abate", "grants", "cash", "runway", "equity"]) {
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

// 15 — every figure the documents quote resolves to a number, not a NaN or an
// empty string. A renamed model constant fails here rather than in the docs.
for (const [name, value] of Object.entries(FIGURES)) {
  check(`figure ${name} resolves`, typeof value === "string" && value.length > 0 && !value.includes("NaN"), value);
}

console.log(failures ? `\n${failures} invariant(s) failed` : `model: ${Object.keys(FIGURES).length} figures and 15 invariant groups pass`);
process.exit(failures ? 1 : 0);
