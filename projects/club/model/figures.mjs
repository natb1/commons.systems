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
// %, signed only when negative, on the docs' typographic minus — "5.5%", "−63.0%"
const pct = (v, d = 0) => {
  const r = round(v, d);
  return (r < 0 ? MINUS : "") + Math.abs(r).toFixed(d) + "%";
};
// %, always signed — "+2.7%", "−1.4%"
const spct = (v, d = 0) => {
  const r = round(v, d);
  return (r < 0 ? MINUS : "+") + Math.abs(r).toFixed(d) + "%";
};
const num = (v, d = 0) => round(v, d).toFixed(d);

// ---- the marks the documents quote ---------------------------------------
// The plan's own base-case marks, read off model.mjs's PLAN block rather than
// restated. `atPlanMarks` holds labor at §6's published line (M.PLAN_LABOR_K)
// instead of the Wages rung, which is what makes the model reproduce §6 rather
// than re-price it — the one calibration the whole file rests on.
const P = M.PLAN;
// The lever settings §5/§6 are written at, as a state object — so the pro forma,
// the evidence tables and the sensitivity sweep all read the model at the same
// point rather than each restating it.
const planState = (site, fin = "lease") => ({
  site, fin, util: P.util, tx: M.SITES[site].mark, price: P.price, ticket: P.ticket,
  events: P.events, caClub: P.caClub, caEvent: P.caEvent, commons: P.commons,
});
function atPlanMarks(site, fin = "lease") {
  return M.withState(
    planState(site, fin),
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

// ---- operations, built and stated ----------------------------------------
// §6 states one operations figure per site with nothing behind it. The registry
// builds the same line out of named components — utilities, insurance, software
// and repairs/misc, plus card fees and marketing on revenue — and every figure
// below rides on that built total. Both are carried here because the pair *is*
// the argument: a built line that reconciles with a stated one is evidence, a
// line solved back out of it is only arithmetic.
const OPS = {};
for (const site of ["li", "sn"]) {
  const built = M.builtOpsK(site), stated = M.SITES[site].ops;
  OPS[site] = { built, stated, delta: built - stated, pctDelta: (100 * (built - stated)) / stated };
}

// ---- reading the registry -------------------------------------------------
const STREAM_LABEL = { cafe: "Café", rooms: "Rooms", books: "Books", shared: "Cross-cutting", all: "Every stream" };
const DRIVER_LABEL = {
  streamRev: "that stream's revenue", revenue: "gross revenue", sqft: "floor area",
  hours: "staffed hours", payroll: "payroll", fixed: "nothing — it is a flat annual cost",
};
const label = (map, key, what) => {
  if (!(key in map)) throw new Error(`figures: no ${what} label for '${key}'`);
  return map[key];
};
const grade = (ev) => `${ev} — ${label(M.EV, ev, "evidence-grade")}`;
const dec = (v) => (v % 1 === 0 ? 0 : 1); // print $4.5K as $4.5K and $12K as $12K
// A band in the units it is declared in. `unit` is the registry's own field, so
// a new unit fails loudly here rather than printing an unlabelled pair.
function bandText(entry) {
  if (entry.band === null || entry.band === undefined) return "—";
  const [lo, hi] = entry.band;
  const both = Math.max(dec(lo), dec(hi));
  if (entry.unit === "K") return `$${num(lo, both)}–${num(hi, both)}K`;
  if (entry.unit === "rate") return `${num(lo * 100, 1)}–${pct(hi * 100, 1)}`;
  if (entry.unit === "psf") return `$${num(lo, both)}–${num(hi, both)}/sf`;
  if (entry.unit === "sf") return `${num(lo, both)}–${num(hi, both)} sf`;
  if (entry.unit === "hrs") return `${num(lo, both)}–${num(hi, both)} hr`;
  throw new Error(`figures: no band format for unit '${entry.unit}'`);
}

// ---- the tornado ----------------------------------------------------------
// What the model does not know, ranked by what it would cost to be wrong. Each
// banded input is swept from one end of its band to the other with every other
// input held at its declared value, and the ranking is by the swing in owner
// comp at Little Italy's plan marks — the figure §6 prints.
//
// This lives on the reading side rather than in model.mjs on purpose: the model
// is spliced verbatim into the published page, and a derivation only the
// documents read would be dead weight there.
//
// The operating levers are deliberately absent. Café margin, wage rung,
// utilization and walk-ins all move owner comp further than anything below, and
// the explorer already exposes every one of them. This ranks what is *not* under
// the operator's control — the numbers the venture has to go verify.
const compAtLiMarks = () =>
  M.withState(planState("li"), () => M.comp(P.util, M.SITES.li.mark) + (M.laborK() - M.PLAN_LABOR_K));

function tornado() {
  return M.INPUTS
    .map((i) => {
      const lo = M.withCost(i.id, i.band[0], compAtLiMarks);
      const hi = M.withCost(i.id, i.band[1], compAtLiMarks);
      return { ...i, lo, hi, swing: Math.abs(hi - lo) };
    })
    .sort((a, b) => b.swing - a.swing);
}
const TORNADO = tornado();
// Two of the nine banded inputs are absorption geometry, not costs: ROOM_SF and
// SESSION_HRS say how the cross-cutting row is *divided*, so they move no total
// and swing owner comp by exactly zero. Ranking them alongside the costs would
// print them as the two safest numbers in the model, which inverts what they
// are. They are split out structurally — a registry entry is a cost, anything
// else is geometry — and ranked below on the quantity they do move.
const SWEPT = TORNADO.filter((i) => M.costById(i.id) !== null);
const GEOMETRY = TORNADO.filter((i) => M.costById(i.id) === null);
const GEOM_BASIS = { "room-sf": "sqft", "session-hrs": "hours" };
const GEOM_BASIS_LABEL = { sqft: "floor area", hours: "staffed hours" };
const TOP = SWEPT[0];

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
  opsLi: k(OPS.li.built),
  opsSn: k(OPS.sn.built),
  commonsK: k(P.commons),
  occLi: k(M.SITES.li.occ),
  occSn: k(M.SITES.sn.occ),
  occBuy: k(BUY.occupancy),
  fixedOpsK: k(M.FIXED_OPS, 1),
  varOpsPct: pct(M.VAR_OPS * 100, 1),

  // operations built from components, against §6's stated figure for the same
  // line — the reconciliation that replaced the solved residual
  opsBuiltLi: k(OPS.li.built, 1),
  opsBuiltSn: k(OPS.sn.built, 1),
  opsStatedLi: k(OPS.li.stated),
  opsStatedSn: k(OPS.sn.stated),
  opsDeltaLi: sk(OPS.li.delta, 1),
  opsDeltaSn: sk(OPS.sn.delta, 1),
  opsDeltaPctLi: pct(OPS.li.pctDelta, 1),
  opsDeltaPctSn: pct(OPS.sn.pctDelta, 1),

  // how much of the cost base is an estimate, and what the worst one is worth
  costCount: num(M.COSTS.length),
  bandedInputCount: num(M.INPUTS.length),
  assumedInputCount: num(M.INPUTS.filter((i) => i.ev === "D").length),
  topSwingLabel: TOP.label,
  topSwingBand: bandText(TOP),
  topSwingK: k(TOP.swing, 1),

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
    row("Operations", k(OPS.li.built), k(OPS.sn.built), k(OPS.sn.built)),
    row("Commons/books", k(P.commons), k(P.commons), k(P.commons)),
    row("Occupancy", k(LI.occupancy), k(SN.occupancy), k(BUY.occupancy) + " (verify terms)"),
    row("**Owner compensation**", `**${k(LI.comp)}**`, `**${k(SN.comp)}**`, `**${k(BUY.comp)} + ~${k(M.BUY_EQUITY)} equity**`),
    "",
    `Operations is one figure per site in the plan. This row does not use it: the line is built from named components — a ${k(M.FIXED_OPS, 1)} fixed base (utilities, insurance, software, repairs & misc, each carrying an evidence grade and a band) plus ${pct(M.VAR_OPS * 100, 1)} of gross revenue for card fees and marketing. Built that way it comes to ${k(OPS.li.built, 1)} at Little Italy against §6's stated ${k(OPS.li.stated)} (${sk(OPS.li.delta, 1)}, ${spct(OPS.li.pctDelta, 1)}) and ${k(OPS.sn.built, 1)} at SN/HT against ${k(OPS.sn.stated)} (${sk(OPS.sn.delta, 1)}, ${spct(OPS.sn.pctDelta, 1)}) — close enough to say the two agree, far enough apart that a component drifting would show. \`model/evidence.md\` carries the grades, the bands, and what each one is worth if it is wrong. Cost of sale is rebuilt from the per-stream margins (café ${pct(M.CAFE_MARGIN_DEF)} contribution, catering ${pct(M.CATER_MARGIN * 100)}, consignment ${pct(M.PRINT_MARGIN * 100)}) rather than carried as a lump.`,
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
    `- **Cost basis:** each site is priced on its own §6 lines — occupancy ${k(M.SITES.li.occ)} (LI) vs ${k(M.SITES.sn.occ)} (SN/HT), operations ${k(OPS.li.built)} vs ${k(OPS.sn.built)}, both built from named components and reconciled against §6's stated ${k(OPS.li.stated)} / ${k(OPS.sn.stated)} within ${pct(Math.max(OPS.li.pctDelta, OPS.sn.pctDelta), 1)} — and its own café mark (${num(M.SITES.li.mark)} vs ${num(M.SITES.sn.mark)} walk-ins/day). The two sites therefore get two matrices below rather than one matrix and a per-cell offset: the cheaper SN/HT floor is worth ${sk(M.SITES.li.occ - M.SITES.sn.occ)} at equal traffic, and its weaker café mark costs it the rest.`,
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
    out.push(`**${M.SITES[site].label}** — occupancy ${k(M.SITES[site].occ)}, operations ${k(OPS[site].built)} (built from components; §6 states ${k(OPS[site].stated)}), café mark ${num(M.SITES[site].mark)} walk-ins/day.`, "");
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

// The same P&L the pro forma prints, grouped by income stream instead of by
// cost nature — the grouping that can answer "what does the café earn?".
function streamRows() {
  return M.withState(planState("li"), () => {
    const m = M.streamMargins(P.util, M.SITES.li.mark);
    return {
      rows: M.tree(P.util, M.SITES.li.mark).map((n) => ({ label: n.label, ...m[n.id] })),
      comp: M.comp(P.util, M.SITES.li.mark),
      labor: M.laborK(),
      laborDelta: M.laborK() - M.PLAN_LABOR_K,
    };
  });
}

function streamMargins() {
  const d = streamRows();
  const row = (r) =>
    `| ${r.label} | ${r.revenue > 0 ? k(r.revenue) : "—"} | ${k(r.cost)} | ${sk(r.margin)} | ${r.revenue > 0 ? pct((r.margin / r.revenue) * 100, 1) : "—"} |`;
  return [
    GEN(), "",
    `| ${M.SITES.li.label} at plan marks | Revenue | Cost the stream incurs | Margin | Margin % |`,
    "|---|---|---|---|---|",
    ...d.rows.map(row),
    `| **Owner compensation** | | | **${k(d.comp)}** | |`,
    "",
    `*A cost is charged to a stream only where the evidence puts it there: each stream's own cost of sale, its own card fees at ${pct(M.withState(planState("li"), () => M.cardRate()) * 100, 1)} of its own revenue, and the ${k(P.commons)} commons budget the books wall exists to fund. The cross-cutting row is deliberately left whole. The three defensible ways to divide it — revenue share, floor area, staffed hours — give three different answers, so the explorer makes the basis a visible control instead of the model picking one. Labor here is the default Wages rung (${k(d.labor)}) rather than §6's ${k(M.PLAN_LABOR_K)} line, which is why this table's owner comp sits ${k(d.laborDelta, 1)} below the pro forma's.*`,
  ].join("\n");
}

// Every cost the venture carries, with what is known about it. This is the table
// the evidence grades exist for: a reader can see in one pass which numbers are
// quoted, which are observed, which are benchmarks and which are guesses.
function evidenceTable() {
  const amounts = M.withState(planState("li"), () => M.COSTS.map((c) => c.amount(P.util, M.SITES.li.mark)));
  const rows = M.COSTS.map((c, i) =>
    `| ${c.label}${c.derived === true ? " *(residual)*" : ""} | ${label(STREAM_LABEL, c.stream, "stream")} | ${label(DRIVER_LABEL, c.driver, "driver")} | ${k(amounts[i], 1)} | ${grade(c.ev)} | ${bandText(c)} | ${c.src} |`);
  return [
    GEN(), "",
    "| Cost | Stream | Scales with | Amount | Evidence | Band | Where the number comes from |",
    "|---|---|---|---|---|---|---|",
    ...rows, "",
    `*Amounts are at ${M.SITES.li.label}'s plan marks on the lease path, which is why the purchase premium reads ${k(0, 1)} — it applies only to the SN/HT buy case. ${num(M.COSTS.filter((c) => c.band).length)} of these ${num(M.COSTS.length)} costs carry a band and ${num(M.COSTS.filter((c) => c.ev === "D").length)} are graded D; two further banded inputs are not costs at all — the absorption geometry — and are ranked separately in the sweep. A cost marked as a residual is what is left after the others rather than an independently sourced figure, which is exactly why its band matters.*`,
  ].join("\n");
}

// The check that replaced the tautology: the components add up to something §6
// never told them to add up to, and the two agree anyway.
function opsReconciliation() {
  const parts = M.withState(planState("li"), () => {
    const shared = M.tree(P.util, M.SITES.li.mark).find((n) => n.id === "shared");
    return shared.children.find((n) => n.id === "operations").children;
  });
  const varAt = (site) => M.withState(planState(site), () => M.varOpsK(P.util, M.SITES[site].mark));
  const rates = M.withState(planState("li"), () => ({ card: M.cardRate(), mkt: M.mktRate() }));
  const row = (site) =>
    `| ${M.SITES[site].label} | ${k(OPS[site].built, 1)} | ${k(OPS[site].stated)} | ${sk(OPS[site].delta, 1)} (${spct(OPS[site].pctDelta, 1)}) |`;
  return [
    GEN(), "",
    "| Site | Built from components | §6 states | Delta |",
    "|---|---|---|---|",
    row("li"), row("sn"), "",
    `The built figure is a ${k(M.FIXED_OPS, 1)} fixed base — ${parts.map((p) => `${p.label.toLowerCase()} ${k(-p.value, 1)}`).join(", ")} — plus ${pct(M.VAR_OPS * 100, 1)} of gross revenue for card fees (${pct(rates.card * 100, 1)}) and marketing (${pct(rates.mkt * 100, 1)}), which comes to ${k(varAt("li"), 1)} at ${M.SITES.li.label} and ${k(varAt("sn"), 1)} at ${M.SITES.sn.label}.`,
    "",
    `§6's figure is a single number per site with nothing behind it. Neither total is derived from the other, so the agreement above is a result and not an identity — the old split was solved *out of* §6's two totals, which meant it reproduced them no matter what the components were. \`model/verify.mjs\` now asserts the two agree within 6%, and a component drifting far enough breaks it.`,
  ].join("\n");
}

// What the model does not know, ranked by what being wrong about it would cost.
function tornadoBlock() {
  const rows = SWEPT.map((i) =>
    `| ${i.label} | ${grade(i.ev)} | ${bandText(i)} | ${k(i.lo, 1)} | ${k(i.hi, 1)} | **${k(i.swing, 1)}** |`);
  const geomRow = (i) => {
    const basis = label(GEOM_BASIS, i.id, "absorption-basis");
    const at = (v) => M.withCost(i.id, v, () => M.withState(planState("li"), () => M.absorb(basis, P.util, M.SITES.li.mark)));
    const lo = at(i.band[0]), hi = at(i.band[1]);
    return `| ${i.label} | ${grade(i.ev)} | ${bandText(i)} | ${label(GEOM_BASIS_LABEL, basis, "absorption basis")} | ${k(lo.cafe.absorbed, 1)} → ${k(hi.cafe.absorbed, 1)} | ${k(lo.rooms.absorbed, 1)} → ${k(hi.rooms.absorbed, 1)} | unmoved |`;
  };
  return [
    GEN(), "",
    "| Input | Evidence | Band | Owner comp at the low end | at the high end | Swing |",
    "|---|---|---|---|---|---|",
    ...rows, "",
    `*Owner comp at ${M.SITES.li.label}'s plan marks with labor held at §6's ${k(M.PLAN_LABOR_K)} line — the ${k(compAtLiMarks())} the pro forma prints — with one input swept end to end and every other held at its declared value. Operating levers are absent on purpose: café margin, wage rung, utilization and walk-ins all move owner comp further than anything here, and the explorer already exposes every one of them. This ranks what is **not** under the operator's control.*`,
    "",
    `**The two absorption constants are ranked separately, because they move nothing here.**`,
    "",
    "| Input | Evidence | Band | Basis it drives | Café's share of the cross-cutting row | Rooms' share | Owner comp |",
    "|---|---|---|---|---|---|---|",
    ...GEOMETRY.map(geomRow), "",
    `*These two say how the ${k(streamRows().rows.find((r) => r.label === "Cross-cutting").cost)} cross-cutting row is **divided** between streams, not how large it is, so sweeping either one moves owner comp by exactly ${k(Math.max(...GEOMETRY.map((i) => i.swing)), 1)}. Listed with the costs above they would print as the two best-known numbers in the model, which is the reverse of the truth — both are grade D, and between them they move the café's attributed cost further than any single cost line above moves owner comp. What they put at risk is the answer to "what does the café earn?", not the answer to "what does the owner earn?".*`,
  ].join("\n");
}

export const BLOCKS = {
  "pro-forma": proForma,
  "stream-margins": streamMargins,
  "evidence-table": evidenceTable,
  "ops-reconciliation": opsReconciliation,
  tornado: tornadoBlock,
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

// The same P&L the table above groups by cost nature, grouped by income stream —
// the two sitting together is the point. Cross-cutting stays whole: allocating it
// is the explorer's own control, not a default the notes card should assume.
function streamMarginsHtml() {
  const d = streamRows();
  const row = (r) =>
    `          <tr><th>${r.label}</th><td>${r.revenue > 0 ? k(r.revenue) : "—"}</td><td>${k(r.cost)}</td><td>${sk(r.margin)}</td><td>${r.revenue > 0 ? pct((r.margin / r.revenue) * 100, 1) : "—"}</td></tr>`;
  return [
    GEN_HTML(),
    `        <table class="mini">`,
    `          <tr><th>${M.SITES.li.label} at plan marks</th><th class="hr">Revenue</th><th class="hr">Cost</th><th class="hr">Margin</th><th class="hr">Margin %</th></tr>`,
    ...d.rows.map(row),
    `          <tr><th><b>Owner compensation</b></th><td>—</td><td>—</td><td><b>${k(d.comp)}</b></td><td>—</td></tr>`,
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
  "stream-margins-html": streamMarginsHtml,
  "site-decomposition-html": siteDecompositionHtml,
  "wage-rungs-html": wageRungsHtml,
});
