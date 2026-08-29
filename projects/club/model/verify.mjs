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

// 1 — the base case reproduces §6 without being told the answer. Labor is held
// at §6's own $120K line; everything else is the model's own arithmetic.
for (const [site, published] of [["li", -13], ["sn", -36]]) {
  const comp = M.withState({ site }, () =>
    M.comp(M.PLAN.util, M.SITES[site].mark) + (M.laborK() - M.PLAN_LABOR_K));
  check(`§6 base case reproduces at ${site}`, Math.abs(comp - published) < 1.5,
    `model ${comp.toFixed(1)} vs published ${published}`);
}

// 2 — every line of the breakdown is accounted for: the parts sum to the whole.
M.withState({}, () => {
  const parts = M.roomsK(M.S.util) + M.cafeK(M.S.tx)
    + M.cateringK(M.S.util, M.S.caClub, M.S.caEvent, M.S.events) + M.otherIncomeK()
    - M.varOpsK(M.S.util, M.S.tx) - M.FIXED_OPS - M.occupancyK() - M.laborK() - M.S.commons;
  check("breakdown sums to owner comp", near(parts, M.comp(M.S.util, M.S.tx)));
});

// 3 — the operations split is solved, not fitted: the fixed base falls out the
// same at both sites, which is the only evidence that the split is real.
const fixedFrom = (site) => M.withState({ site }, () => {
  const rev = M.revenueK(M.PLAN.util, M.SITES[site].mark);
  return M.SITES[site].ops - M.VAR_OPS * rev;
});
check("operations split lands identically at both sites", near(fixedFrom("li"), fixedFrom("sn"), 0.01),
  `${fixedFrom("li").toFixed(3)} vs ${fixedFrom("sn").toFixed(3)}`);

// 4 — the stated marginals are the actual marginals.
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

// 5 — catering can never attach to more sessions than exist.
for (const util of [0, 10, 33, 55, 80, 100]) {
  M.withState({ util }, () => {
    const orders = M.caterOrders(util, 100, 100, M.S.events);
    check(`catering attach is capped by sessions at ${util}%`, orders <= M.sessions(util) + 1e-9);
  });
}

// 6 — the levers that must not touch stabilized owner comp do not.
const baseComp = M.withState({}, () => M.comp(M.S.util, M.S.tx));
for (const lever of ["churn", "build", "ti", "abate", "grants", "cash", "runway", "equity"]) {
  const moved = M.withState({ [lever]: M.DEF[lever] + 10 }, () => M.comp(M.DEF.util, M.DEF.tx));
  check(`${lever} does not move owner comp`, near(moved, baseComp, 1e-9));
}

// 7 — a matrix cell equals the readout at the same point.
M.withState({ site: "sn", util: 55, tx: 88 }, () => {
  check("matrix cell equals the readout at the same point", near(M.comp(55, 88), M.comp(M.S.util, M.S.tx)));
});

// 8 — the wage rungs are priced from their parts, and the labor line is the
// rung's rate over the plan's own staffed grid.
M.WAGES.forEach((w, i) => {
  check(`wage rung ${i} totals its parts`, near(w.rate, w.cash + w.pay + w.ben, 0.011));
  check(`wage rung ${i} labor is rate × grid`,
    near(M.withState({ wage: i }, () => M.laborK()), w.rate * M.STAFF_HRS / 1000, 0.01));
});

// 9 — every figure the documents quote resolves to a number, not a NaN or an
// empty string. A renamed model constant fails here rather than in the docs.
for (const [name, value] of Object.entries(FIGURES)) {
  check(`figure ${name} resolves`, typeof value === "string" && value.length > 0 && !value.includes("NaN"), value);
}

console.log(failures ? `\n${failures} invariant(s) failed` : `model: ${Object.keys(FIGURES).length} figures and 9 invariant groups pass`);
process.exit(failures ? 1 : 0);
