// Named figures and generated tables — the reading side of model/model.mjs.
//
// Every number this project's documents state about the venture's economics is
// resolved here and written into the docs by `render.mjs`. Documents never hold
// a hand-computed figure: prose is authored, numbers are generated.
//
// Two shapes, matching the two ways a document uses a number:
//   FIGURES — one scalar, written into an inline `<!--m:name-->…<!--/m-->` span.
//   BLOCKS  — a whole table or list, written between `<!-- model:begin name -->`
//             and `<!-- model:end name -->`.
import * as M from "./model.mjs";

// ---- formatting ----------------------------------------------------------
const MINUS = "−"; // the docs' typographic minus, matching the artifact
const round = (v, d = 0) => {
  const p = Math.pow(10, d);
  return Math.round(v * p) / p;
};
// $K, signed only when negative — "$297K", "−$13K"
export function k(v, d = 0) {
  const r = round(v, d);
  return (r < 0 ? MINUS : "") + "$" + Math.abs(r).toFixed(d) + "K";
}
// $K, always signed — "+$18K", "−$13K"
export function sk(v, d = 0) {
  const r = round(v, d);
  return (r < 0 ? MINUS : "+") + "$" + Math.abs(r).toFixed(d) + "K";
}
const pct = (v, d = 0) => round(v, d).toFixed(d) + "%";
const num = (v, d = 0) => round(v, d).toFixed(d);

// ---- the marks the documents quote ---------------------------------------
// The plan's own base-case marks, read off model.mjs's PLAN block rather than
// restated. `atPlanMarks` holds labor at §6's published line (M.PLAN_LABOR_K)
// instead of the Wages rung, which is what makes the model reproduce §6 rather
// than re-price it — the one calibration the whole file rests on.
const P = M.PLAN;
function atPlanMarks(site, fin = "lease") {
  return M.withState(
    { site, fin, util: P.util, tx: M.SITES[site].mark, price: P.price, ticket: P.ticket,
      events: P.events, caClub: P.caClub, caEvent: P.caEvent, commons: P.commons },
    () => {
      const labourDelta = M.laborK() - M.PLAN_LABOR_K; // swap the rung back out for §6's line
      return {
        rooms: M.roomsK(P.util),
        cafe: M.cafeK(M.SITES[site].mark),
        catering: M.cateringK(P.util, P.caClub, P.caEvent, P.events),
        other: M.otherIncomeK(),
        revenue: M.revenueK(P.util, M.SITES[site].mark),
        varOps: M.varOpsK(P.util, M.SITES[site].mark),
        fixedOps: M.FIXED_OPS,
        occupancy: M.occupancyK(),
        labor: M.PLAN_LABOR_K,
        commons: P.commons,
        comp: M.comp(P.util, M.SITES[site].mark) + labourDelta,
      };
    },
  );
}
const LI = atPlanMarks("li");
const SN = atPlanMarks("sn");
const BUY = atPlanMarks("sn", "buy");

// Gross revenue per §5 stream at the plan's marks, so §5's table is generated
// from the same quantities §6's cost lines ride on.
const streamRevK = (site) =>
  M.withState({ site }, () => ({
    cafe: M.SITES[site].mark * M.txRevK(P.ticket),
    sessions: (P.util / 100) * M.CAPACITY * M.sessRevK(P.price),
    catering: M.caterRevK(P.util, P.caClub, P.caEvent, P.events),
    day: M.DAYROOM_K,
    prints: M.PRINT_K,
  }));
const RLI = streamRevK("li");
const RSN = streamRevK("sn");

// Cost of sale — §6's COGS line, rebuilt from the per-stream margins the model
// carries instead of asserted as a lump.
const cogsK = (r) =>
  r.cafe * (1 - M.CAFE_MARGIN_DEF / 100) +
  r.catering * (1 - M.CATER_MARGIN) +
  r.prints * (1 - M.PRINT_MARGIN);

// The owner's bars at the plan's default capital at risk.
const bars = M.withState({}, () => ({
  living: M.livingK(),
  bar: M.bandLoK(),
  band: M.bandHiK(),
  ownerRate: M.WAGES[M.S.wage].cash * (1 + M.FICA) + M.WAGES[M.S.wage].ben,
}));

// ---- scenarios -----------------------------------------------------------
// §6's sensitivity rows, defined as lever settings rather than as remembered
// answers. Each row's revenue and owner comp fall out of the same model the
// artifact runs; labor stays on the plan's §6 line so the rows compare with the
// base case rather than with a re-priced wage bill.
export const SCENARIOS = [
  { key: "lean", label: "Lean (70 walk-ins/day, evening at half)", tx: M.LEAN_STOP, util: P.util / 2 },
  { key: "base", label: "Base (the marks above)", tx: null, util: P.util },
  { key: "gate", label: "Gate-clearing (110 walk-ins/day, 55% evening utilization)", tx: 110, util: 55 },
  { key: "strong", label: "Strong (120 walk-ins/day, 75% utilization, catering attach growing)", tx: 120, util: 75, caClub: 25, caEvent: 60 },
];
function scenario(s, site = "li") {
  const tx = s.tx === null ? M.SITES[site].mark : s.tx;
  return M.withState(
    { site, util: s.util, tx, caClub: s.caClub ?? P.caClub, caEvent: s.caEvent ?? P.caEvent },
    () => ({
      revenue: M.revenueK(s.util, tx),
      comp: M.comp(s.util, tx) + (M.laborK() - M.PLAN_LABOR_K),
    }),
  );
}

// ---- the matrix ----------------------------------------------------------
// Rows are the utilization marks the plan names; columns are walk-ins/day
// relative to the site's own mark, exactly as the artifact draws them.
const ROWS = Object.keys(M.ROWBADGE).map(Number).sort((a, b) => a - b);
function matrixFor(site) {
  return M.withState({ site }, () => {
    const cols = M.txCols();
    return {
      cols,
      rows: ROWS.map((util) => ({
        util,
        badge: M.ROWBADGE[util],
        sessions: M.sessions(util),
        clubs: M.clubsFor(util),
        cells: cols.map((tx) => M.comp(util, tx) + (M.laborK() - M.PLAN_LABOR_K)),
      })),
    };
  });
}
// Club roster at a utilization mark, across the cadence mixes — the doc's
// "weekly-committed" and "mixed roster" columns.
function rosterFor(util) {
  const at = (cad) => M.withState({ cad }, () => M.clubsFor(util));
  return { weekly: at("weekly"), mixed: at("mixed"), slow: at("slow") };
}
// Where a target owner comp crosses the grid at each site.
function contour(site, target) {
  return M.withState({ site }, () =>
    ROWS.map((util) => {
      const tx = M.txForTarget(target, util) + (M.PLAN_LABOR_K - M.laborK()) / M.mtx(M.S.ticket);
      return { util, tx };
    }),
  );
}

// ---- FIGURES -------------------------------------------------------------
export const FIGURES = {
  // capacity and the room engine (§5)
  capacitySlots: num(M.CAPACITY),
  capacityRevK: k((M.CAPACITY * M.sessRevK(P.price))),
  baseUtil: pct(P.util),
  gateUtil: "55%",
  ceilingUtil: "75%",
  avgSession: "$" + num(P.price),
  avgTicket: "$" + P.ticket.toFixed(2),
  eventsPerMonth: num(P.events, 1),
  eventsWeeklyEq: num(M.evEqOf(P.events), 1),
  baseSessions: num(M.withState({}, () => M.sessions(P.util)), 1),

  // §5 revenue lines
  cafeTxLi: num(M.SITES.li.mark),
  cafeTxSn: num(M.SITES.sn.mark),
  cafeRevLi: k(RLI.cafe),
  cafeRevSn: k(RSN.cafe),
  sessionRevK: k(RLI.sessions),
  cateringRevK: k(RLI.catering),
  eveningRevK: k(RLI.sessions + RLI.catering),
  dayRoomRevK: k(RLI.day),
  printRevK: k(RLI.prints),
  revenueLi: k(LI.revenue),
  revenueSn: k(SN.revenue),

  // §6 cost lines
  cogsLi: k(cogsK(RLI)),
  cogsSn: k(cogsK(RSN)),
  laborPlanK: k(M.PLAN_LABOR_K),
  opsLi: k(M.SITES.li.ops),
  opsSn: k(M.SITES.sn.ops),
  commonsK: k(P.commons),
  occLi: k(M.SITES.li.occ),
  occSn: k(M.SITES.sn.occ),
  occBuy: k(BUY.occupancy),
  fixedOpsK: k(M.FIXED_OPS, 1),
  varOpsPct: pct(M.VAR_OPS * 100, 1),
  cafeMarginPct: pct(M.CAFE_MARGIN_DEF),
  roomMarginPct: pct(M.ROOM_MARGIN * 100),

  // the headline
  compLi: k(LI.comp),
  compSn: k(SN.comp),
  compBuy: k(BUY.comp),
  equityBuildK: k(M.BUY_EQUITY),
  gapLi: k(M.PLAN_DRAW_FLOOR - LI.comp),
  gapSn: k(M.PLAN_DRAW_FLOOR - SN.comp),
  drawFloorK: k(M.PLAN_DRAW_FLOOR),

  // marginals — the two numbers every downstream doc quotes
  sessionContribK: k(M.sessRevK(P.price) * M.ROOM_MARGIN, 1),
  sessionMarginalK: k(M.withState({}, () => M.msess(P.price)), 1),
  txMarginalK: k(M.withState({}, () => M.mtx(P.ticket)), 2),

  // A filled weekly session brings its catering attach with it; the room line
  // alone is the plan's figure, the all-in number is what a club actually adds.
  sessionMarginalAllInK: k(M.withState({}, () => {
    const step = 100 / M.CAPACITY;
    return M.comp(P.util + step, M.SITES.li.mark) - M.comp(P.util, M.SITES.li.mark);
  }), 1),
  sessionMarginalSignedK: sk(M.withState({}, () => M.msess(P.price)), 1),
  txMarginalSignedK: sk(M.withState({}, () => M.mtx(P.ticket)), 2),

  // exact (one-decimal) statements of the two base cases, where the prose needs
  // to show that the model reproduces §6 rather than rounds to it
  compLiExact: k(LI.comp, 1),
  compSnExact: k(SN.comp, 1),
  compLiRung: k(M.withState({}, () => M.comp(P.util, M.SITES.li.mark))),
  wageSpreadK: k(M.withState({ wage: 3 }, () => M.laborK()) - M.withState({ wage: 0 }, () => M.laborK())),

  // exact (one-decimal) statements of the two base cases, where the prose shows
  // that the model reproduces §6 rather than merely rounds to it
  compLiExact: k(LI.comp, 1),
  compSnExact: k(SN.comp, 1),
  compLiRung: k(M.withState({}, () => M.comp(P.util, M.SITES.li.mark))),
  wageSpreadK: k(M.withState({ wage: 3 }, () => M.laborK()) - M.withState({ wage: 0 }, () => M.laborK())),

  // the owner's bars
  livingWageK: k(bars.living, 1),
  ownerBarK: k(bars.bar, 1),
  economicBandK: k(bars.band, 1),
  capitalAtRiskK: k(M.DEF.equity),
  ownerRatePerHr: "$" + bars.ownerRate.toFixed(2),
  staffRatePerHr: "$" + M.WAGES[M.DEF.wage].rate.toFixed(2),
  staffHrsPerYr: Math.round(M.STAFF_HRS).toLocaleString("en-US"),
  leanStop: num(M.LEAN_STOP),

  // what SN/HT's cheaper floor is worth at equal traffic
  snFloorAdvantageK: sk(M.SITES.li.occ - M.SITES.sn.occ),

  // club rosters at the marks the pilot docs compare themselves against
  baseRosterWeekly: num(rosterFor(P.util).weekly),
  baseRosterMixed: num(rosterFor(P.util).mixed),
  breakEvenUtil: "45%",
  breakEvenRosterWeekly: num(rosterFor(45).weekly),
  breakEvenRosterMixed: num(rosterFor(45).mixed),
  gateRosterWeekly: num(rosterFor(55).weekly),
  gateRosterMixed: num(rosterFor(55).mixed),

  cafeCogsPct: pct(100 - M.CAFE_MARGIN_DEF),
  laborRungK: k(M.withState({}, () => M.laborK())),

  // the catering attach (D15) and the cash constraint (D7)
  cateringMarginK: k(LI.catering, 1),
  cateringOrdersPerWk: num(M.withState({}, () => M.caterOrders(P.util, P.caClub, P.caEvent, P.events)), 1),
  wcBandK: `$${M.WC_BAND[0]}–${M.WC_BAND[1]}K`,
  wcReserveK: k(M.WC),
  buildCapK: k(M.DEF.build),
  ventureCashK: k(M.DEF.cash),
  runwayMonths: num(M.DEF.runway),
  bailLineK: k(M.withState({}, () => M.bailComp())),
  equityRangeK: `$${M.EQUITY_RANGE[0]}–${M.EQUITY_RANGE[1]}K`,

  // gate-clearing arithmetic quoted in §6 and the precedent memo
  gateTx: "110",
  gateTxGainK: sk(M.withState({}, () => M.mtx(P.ticket)) * (110 - M.SITES.li.mark)),
  gateUtilGainK: sk(M.withState({}, () => M.msess(P.price)) * (M.CAPACITY * (55 - P.util) / 100)),
  cafeAloneTx: num(M.withState({}, () => M.txForTarget(M.PLAN_DRAW_FLOOR, P.util) + (M.PLAN_LABOR_K - M.laborK()) / M.mtx(P.ticket))),
  roomsAloneUtil: pct(M.withState({}, () => M.utilForTarget(M.PLAN_DRAW_FLOOR - (M.PLAN_LABOR_K - M.laborK()), M.SITES.li.mark))),
};

// ---- BLOCKS --------------------------------------------------------------
const GEN = () => "*Generated from `model/model.mjs` — edit the model, then `node model/render.mjs`.*";

function proForma() {
  const row = (label, li, sn, buy) => `| ${label} | ${li} | ${sn} | ${buy} |`;
  return [
    GEN(),
    "",
    "| | **Little Italy lease** (~2,500 sf @ $22 NNN) | **SN/HT lease** (~3,000 sf @ $16) | **SN/HT buy** (SBLP-terms acceleration case) |",
    "|---|---|---|---|",
    row("Revenue (§5 streams)", k(LI.revenue), k(SN.revenue), k(BUY.revenue)),
    row("Cost of sale", k(cogsK(RLI)), k(cogsK(RSN)), k(cogsK(RSN))),
    row("Labor (living wage)", k(M.PLAN_LABOR_K), k(M.PLAN_LABOR_K), k(M.PLAN_LABOR_K)),
    row("Operations", k(M.SITES.li.ops), k(M.SITES.sn.ops), k(M.SITES.sn.ops)),
    row("Commons/books", k(P.commons), k(P.commons), k(P.commons)),
    row("Occupancy", k(LI.occupancy), k(SN.occupancy), k(BUY.occupancy) + " (verify terms)"),
    row("**Owner compensation**", `**${k(LI.comp)}**`, `**${k(SN.comp)}**`, `**${k(BUY.comp)} + ~${k(M.BUY_EQUITY)} equity**`),
    "",
    `Operations is one figure per site in the plan; the model splits it where §6's own bottom-up lines do — ${pct(M.VAR_OPS * 100, 1)} of gross revenue (card fees + marketing) plus a ${k(M.FIXED_OPS, 1)} fixed base — and the split is solved from the two sites' published totals, so this row reproduces them. Cost of sale is rebuilt from the per-stream margins (café ${pct(M.CAFE_MARGIN_DEF)} contribution, catering ${pct(M.CATER_MARGIN * 100)}, consignment ${pct(M.PRINT_MARGIN * 100)}) rather than carried as a lump.`,
  ].join("\n");
}

function sensitivity() {
  const rows = SCENARIOS.map((s) => {
    const r = scenario(s);
    return `| ${s.label} | ~${k(r.revenue)} | ~${k(r.comp)} |`;
  });
  return [GEN(), "", "| Scenario | LI revenue | LI owner comp |", "|---|---|---|", ...rows].join("\n");
}

function matrixAssumptions() {
  const roster = rosterFor(P.util);
  return [
    GEN(),
    "",
    `- **Capacity:** 3 bookable rooms × ~6 usable evenings + weekend-afternoon slots ≈ **${num(M.CAPACITY)} session-slots/week**. Full utilization ≈ ${k(M.CAPACITY * M.sessRevK(P.price))}/yr at a $${num(P.price)} average session.`,
    `- **Marginal values:** each filled weekly session ≈ **${sk(M.withState({}, () => M.msess(P.price)), 1)}/yr owner comp** on the room line, **${FIGURES.sessionMarginalAllInK}** once the catering that attaches to it is counted; each café walk-in/day ≈ **${sk(M.withState({}, () => M.mtx(P.ticket)), 2)}/yr**. All are net of the ${pct(M.VAR_OPS * 100, 1)} of gross revenue that card fees and marketing take; the plan's §5 quotes the session gross of that, at ${k(M.sessRevK(P.price) * M.ROOM_MARGIN, 1)}.`,
    `- **One-off private events** (parties/showers, D11 base ${num(P.events, 1)}/mo) contribute ~${num(M.evEqOf(P.events), 1)} weekly-equivalent sessions at every tier; the club roster figures below are net of them.`,
    `- **Club cadence mapping:** a weekly club = 1 session/wk; biweekly = 0.5; monthly ≈ 0.23. "Mixed roster" assumes ${M.CADENCE.mixed.desc.replace(/ — .*/, "")} — the realistic shape the pilot's "monthly or better" retention floor predicts. At the base row that is ~${num(roster.weekly, 0)} weekly-committed clubs or ~${num(roster.mixed, 0)} mixed-cadence ones.`,
    `- **Program-for vs maintain:** the roster numbers are *active clubs to maintain*. Programming must run above them — clubs churn (rate unknown; a pilot deliverable), so the recruiting pipeline needs to be perhaps ${num(M.DEF.churn, 1)}× the maintained roster. Validate the churn rate during Phase 0.5.`,
    `- **Cost basis:** each site is priced on its own §6 lines — occupancy ${k(M.SITES.li.occ)} (LI) vs ${k(M.SITES.sn.occ)} (SN/HT), operations ${k(M.SITES.li.ops)} vs ${k(M.SITES.sn.ops)} — and its own café mark (${num(M.SITES.li.mark)} vs ${num(M.SITES.sn.mark)} walk-ins/day). The two sites therefore get two matrices below rather than one matrix and a per-cell offset: the cheaper SN/HT floor is worth ${sk(M.SITES.li.occ - M.SITES.sn.occ)} at equal traffic, and its weaker café mark costs it the rest.`,
  ].join("\n");
}

function rosterTable() {
  const week = { 33: "Each room booked 2–3 nights", 45: "Each room 3–4 nights; weekends full + ~1 midweek club night per room", 55: "Each room 4–5 nights; midweek is where this tier is won", 75: "Each room ~6 of 7 nights — near-sellout of prime time" };
  const rows = ROWS.map((u) => {
    const r = rosterFor(u);
    const badge = M.ROWBADGE[u] ? ` (${M.ROWBADGE[u]})` : "";
    return `| **${pct(u)}**${badge} | ~${num(M.withState({}, () => M.sessions(u)), 1)} | **~${num(r.weekly)}** | **~${num(r.mixed)}** | **~${num(r.slow)}** | ${week[u] ?? ""} |`;
  });
  return [
    GEN(), "",
    "| Evening utilization (3 rooms) | Weekly-eq sessions | All-weekly roster | Mixed-cadence roster | Slower-cadence roster | What a week looks like |",
    "|---|---|---|---|---|---|",
    ...rows, "",
    `*(All rows assume the ${num(P.events, 1)} one-off events/month continue on top of the club roster; the club counts are net of them.)*`,
  ].join("\n");
}

function matrixTables() {
  const out = [GEN(), ""];
  for (const site of ["li", "sn"]) {
    const m = matrixFor(site);
    out.push(`**${M.SITES[site].label}** — occupancy ${k(M.SITES[site].occ)}, operations ${k(M.SITES[site].ops)}, café mark ${num(M.SITES[site].mark)} walk-ins/day.`, "");
    out.push("| Rooms ↓ / Café → | " + m.cols.map((c) => {
      const rel = c / M.SITES[site].mark;
      const badge = M.RELBADGE[String(round(rel, 1))];
      return `**${c} tx/day**${badge ? ` (${badge})` : ""}`;
    }).join(" | ") + " |");
    out.push("|---|" + m.cols.map(() => "---").join("|") + "|");
    for (const r of m.rows) {
      out.push(`| **${pct(r.util)} · ~${num(r.clubs)} clubs**${r.badge ? ` (${r.badge})` : ""} | ` + r.cells.map((v) => k(v)).join(" | ") + " |");
    }
    out.push("");
  }
  out.push(`*Rows are evening utilization with the mixed-cadence club roster it implies; columns are walk-ins/day at 70–130% of the site's own mark. Cells are owner comp with labor held at §6's ${k(M.PLAN_LABOR_K)} line.*`);
  return out.join("\n");
}

function contours() {
  const fmt = (site, target) =>
    contour(site, target)
      .filter((p) => p.tx > 0)
      .map((p) => `(${pct(p.util)}, ~${num(p.tx)} tx)`)
      .join(" → ");
  return [
    GEN(), "",
    `- **The $0 line (not losing money, no draw):** Little Italy ${fmt("li", 0)}; SN/HT ${fmt("sn", 0)}. Every cell above/left of it is a business burning cash.`,
    `- **The ${k(M.PLAN_DRAW_FLOOR)} line (the plan's §9 partial-income floor):** Little Italy ${fmt("li", M.PLAN_DRAW_FLOOR)}; SN/HT ${fmt("sn", M.PLAN_DRAW_FLOOR)}. No single-engine cell clears it: café-alone needs ~${num(FIGURES.cafeAloneTx)} walk-ins/day (top-decile), rooms-alone ~${FIGURES.roomsAloneUtil} utilization.`,
    `- **The owner's bar (a living wage at zero opportunity cost, ${k(bars.bar, 1)} at ${k(M.DEF.equity)} of capital at risk):** off the grid at both sites — the explorer's derived-gates strip shows how far. That gap, not the ${k(M.PLAN_DRAW_FLOOR)} line, is what the venture has to close to be worth the owner's labor and capital.`,
    `- **Evidence limits (mark before believing any cell):** columns right of ${num(Math.round(1.1 * M.SITES.li.mark))} walk-ins/day at Little Italy are top-decile café territory; rows below ${FIGURES.gateUtil} utilization are unsupported by any current evidence at the $15–35/hr band (the D&J analog hits ~100% peak at $5–10/hr — a ceiling test, not a forecast). The credible planning region is the middle of the matrix, which is exactly why the dual gate demands proof on both axes before a lease.`,
  ].join("\n");
}

function wageRungs() {
  const rows = M.WAGES.map((w, i) => {
    const labor = M.withState({ wage: i }, () => M.laborK());
    return `| ${w.label}${i === M.MIT_RUNG ? " *(default)*" : ""} | $${w.cash.toFixed(2)} | $${w.pay.toFixed(2)} | ${w.ben ? "$" + w.ben.toFixed(2) : "—"} | $${w.rate.toFixed(2)} | ~${k(labor)} |`;
  });
  return [
    GEN(), "",
    "| Rung | Take-home | Payroll | Benefits | Total comp | Labor |",
    "| --- | --- | --- | --- | --- | --- |",
    ...rows, "",
    `*Payroll is the employer load at ${pct(M.PAYROLL_LOAD * 100, 2)} (FICA ${pct(M.FICA * 100, 2)} + FUTA/MD unemployment and workers' comp ${pct(M.UI_WC * 100, 2)}). Labor is that rate over the plan's own staffed grid — ${FIGURES.staffHrsPerYr} hr/yr, §6's ${k(M.PLAN_LABOR_K)} line at the $${P.rate}/hr it assumed.*`,
  ].join("\n");
}

export const BLOCKS = {
  "pro-forma": proForma,
  sensitivity,
  "matrix-assumptions": matrixAssumptions,
  "roster-table": rosterTable,
  "matrix-tables": matrixTables,
  contours,
  "wage-rungs": wageRungs,
};

// ---- HTML blocks -----------------------------------------------------------
// The artifact's notes card states the model in prose and in two small tables.
// They are generated for the same reason the documents' tables are: the page
// must not be able to describe a model other than the one it runs.
const GEN_HTML = () =>
  "        <!-- generated from model/model.mjs — edit the model, then `node model/render.mjs` -->";

// The default view, line by line: each stream at its own margin, then the costs.
// Labor here is the Wages rung (what the tool spends), not §6's published line —
// which is why this table's bottom row sits ~$1K below the pro forma's.
function contributionHtml() {
  const d = M.withState({}, () => ({
    cafe: M.cafeK(M.S.tx), cafeRev: M.S.tx * M.txRevK(M.S.ticket),
    catering: M.cateringK(M.S.util, M.S.caClub, M.S.caEvent, M.S.events),
    rooms: M.roomsK(M.S.util), other: M.otherIncomeK(),
    revenue: M.revenueK(M.S.util, M.S.tx), varOps: M.varOpsK(M.S.util, M.S.tx),
    occ: M.occupancyK(), labor: M.laborK(), comp: M.comp(M.S.util, M.S.tx),
  }));
  const row = (label, contrib, cost) =>
    `          <tr><th>${label}</th><td>${contrib ?? "—"}</td><td>${cost ?? "—"}</td></tr>`;
  return [
    GEN_HTML(),
    `        <table class="mini">`,
    `          <tr><th>${M.SITES[M.DEF.site].label} at plan marks</th><th class="hr">Contribution</th><th class="hr">Cost</th></tr>`,
    row(`Café — walk-ins (${k(d.cafeRev)} × ${pct(M.CAFE_MARGIN_DEF)})`, sk(d.cafe), null),
    row(`Café — catering attach (${pct(M.CATER_MARGIN * 100)})`, sk(d.catering), null),
    row(`Rooms — evenings (${pct(M.ROOM_MARGIN * 100)})`, sk(d.rooms), null),
    row(`Rooms — day (${pct(M.ROOM_MARGIN * 100)}) + prints (${pct(M.PRINT_MARGIN * 100)})`, sk(d.other), null),
    row(`Card fees &amp; marketing (${pct(M.VAR_OPS * 100, 1)} of ${k(d.revenue)})`, null, sk(-d.varOps)),
    row("Operations — fixed", null, sk(-M.FIXED_OPS)),
    row("Occupancy", null, sk(-d.occ)),
    row("Labor (the Wages rung)", null, sk(-d.labor)),
    row("Commons / books", null, sk(-M.DEF.commons)),
    row("<b>Owner compensation</b>", null, sk(d.comp)),
    `        </table>`,
  ].join("\n");
}

// Each site's base case decomposed into the two things "SN/HT: subtract ~$22K"
// bundled — the cheaper floor, and the weaker expected café column.
function siteDecompositionHtml() {
  const liComp = LI.comp;
  const snAtLiTraffic = M.withState({ site: "sn", tx: M.SITES.li.mark }, () =>
    M.comp(P.util, M.SITES.li.mark) + (M.laborK() - M.PLAN_LABOR_K));
  const row = (label, v) => `          <tr><th>${label}</th><td>${v}</td></tr>`;
  // Stated to a decimal so the three steps visibly sum to the fourth.
  return [
    GEN_HTML(),
    `        <table class="mini">`,
    row(`${M.SITES.li.label} at its ${num(M.SITES.li.mark)} walk-ins/day mark`, k(liComp, 1)),
    row(`SN/HT cost basis at equal traffic (occupancy ${k(M.SITES.sn.occ)} vs ${k(M.SITES.li.occ)})`, sk(snAtLiTraffic - liComp, 1)),
    row(`SN/HT expected traffic: ${num(M.SITES.li.mark - M.SITES.sn.mark)} fewer walk-ins/day (×${k(M.withState({ site: "sn" }, () => M.mtx(P.ticket)), 2)})`, sk(SN.comp - snAtLiTraffic, 1)),
    row(`SN/HT at its own ${num(M.SITES.sn.mark)} walk-ins/day mark`, k(SN.comp, 1)),
    `        </table>`,
  ].join("\n");
}

function wageRungsHtml() {
  const row = (w, i) => {
    const labor = M.withState({ wage: i }, () => M.laborK());
    const label = w.label + (i === M.DEF.wage ? " <i>(default)</i>" : "");
    return `          <tr><th>${label}</th><td>$${w.cash.toFixed(2)}</td><td>$${w.pay.toFixed(2)}</td><td>${w.ben ? "$" + w.ben.toFixed(2) : "—"}</td><td>$${w.rate.toFixed(2)}</td><td>~${k(labor)}</td></tr>`;
  };
  return [
    GEN_HTML(),
    `        <table class="mini">`,
    `          <tr><th></th><th class="hr">Take-home</th><th class="hr">Payroll</th><th class="hr">Benefits</th><th class="hr">Total comp</th><th class="hr">Labor</th></tr>`,
    ...M.WAGES.map(row),
    `        </table>`,
  ].join("\n");
}

Object.assign(BLOCKS, {
  "contribution-html": contributionHtml,
  "site-decomposition-html": siteDecompositionHtml,
  "wage-rungs-html": wageRungsHtml,
});
