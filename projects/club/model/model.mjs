// The club model — the single source of truth for every number the project's
// documents and the benchmark explorer artifact state about the venture's
// economics.
//
// Nothing downstream re-derives these figures by hand. `render.mjs` splices this
// file verbatim into the artifact's <script> and regenerates the numbers in
// business-plan.md, claude/benchmark-matrix.md and the docs that cite them, so
// a change made here reaches the page and the prose in one step. See
// model/README.md for the loop, and run `node model/render.mjs --check` to
// prove the tree is in sync.
//
// The file is written in the artifact's own dialect (var, ES5 functions, no
// imports) because it is spliced into the published page as-is — the page's
// model bytes ARE this file's bytes. Keep it DOM-free.
// ---- calibration (business-plan v0.3.3 §5–6; benchmark-matrix Aug 28 2026) ----
export var CAPACITY = 25;                 // session-slots/wk (3 rooms — the matrix's fixed basis)
// Contribution margin per income stream — revenue less the cost of sale that stream alone incurs.
export var ROOM_MARGIN = 0.94;                     // room bookings: near-zero cost of sale
export var CATER_ORDER = 70, CATER_MARGIN = 0.6;   // $/pre-order, margin (≈$6K rev / $3.7K margin at plan marks)
export var PRINT_MARGIN = 0.4;                     // consignment takes 60% (§5)
export var CAFE_MARGIN_DEF = 68;                   // % — a lever; §6’s COGS line implies ~32% cost of sale
export var DAYROOM_K = 12, PRINT_K = 6;            // §5 revenue the tool does not lever: day-room complement (D13), consignment
export var PLAN_LABOR_K = 120;                     // §6’s labor line ($K/yr)
export var PLAN = {price:90, ticket:8.25, util:33, tx:{li:100,sn:80}, caClub:15, caEvent:50, events:5.5, commons:6, rate:23};
export var SITES = {
  li:{label:'Little Italy', base:-13, mark:100, occ:78, ops:65, hint:'~2,500 sf @ $22 NNN · occupancy $78K · operations $65K · café mark 100 walk-ins/day. Switching location re-anchors the café columns and walk-in default to this mark.'},
  sn:{label:'Station North / Highlandtown', base:-35, mark:80, occ:64, ops:62, hint:'~3,000 sf @ $16 · occupancy $64K · operations $62K · café mark 80 walk-ins/day — cheaper floor, weaker café column. Columns and walk-in default re-anchored to this mark.'}
};
export var CADENCE = {
  weekly:{label:'All weekly', avg:1.0, desc:'every club meets weekly (1.0 sessions/club/wk)'},
  mixed:{label:'Mixed', avg:0.6825, desc:'½ weekly · ¼ biweekly · ¼ monthly (≈0.68 sessions/club/wk) — the pilot-predicted shape'},
  slow:{label:'Slower', avg:0.49, desc:'¼ weekly · ¼ biweekly · ½ monthly (≈0.49 sessions/club/wk)'}
};
// wage rungs, priced bottom-up: cash wage + employer payroll load + employer-paid benefits.
// rate (= total comp/hr) is derived from the parts, so the breakdown shown in the rail is the model.
export var FICA = 0.0765;                       // Social Security + Medicare, employer half
export var UI_WC = 0.0270;                      // FUTA + MD unemployment (capped bases) ~0.7% + workers’ comp ~2.0%
export var PAYROLL_LOAD = FICA + UI_WC;         // 10.35% — the full employer load on a staff hour
export var FTE_HRS = 2080;                      // a full-time year — the basis for the per-worker annual column
export var WAGES = [
  {label:'Market', cash:15.00, ben:0,
   desc:'MD minimum $15.00/hr cash, tips economy, no employer benefits.'},
  {label:'Market+', cash:16.50, ben:0.85,
   desc:'$16.50/hr cash plus a ~$150/mo benefits stipend.'},
  {label:'MIT living', cash:21.03, ben:0,
   desc:'MIT’s living wage for one adult in Baltimore city — $21.03/hr earned — carried at full employer load. The default, and the rung every other one is read against.'},
  {label:'Living+', cash:21.03, ben:1.50,
   desc:'The living take-home made tips-independent, plus a ~$260/mo health and paid-time-off stipend. The plan’s D6 commitment: owner comp absorbs the cost.'}
];
WAGES.forEach(function(w){
  w.pay  = Math.round(w.cash*PAYROLL_LOAD*100)/100;
  w.rate = Math.round((w.cash + w.pay + w.ben)*100)/100;   // total comp/hr — what the labor line spends
});
export var MIT_RUNG = 2;            // the comparison baseline
export var FIN = {
  lease:'Own cash, everything under the <$150K cap (D7): fit-out ≤$85K, working capital $50–65K first.',
  buy:'SBLP-terms purchase (§6 models it for SN/HT only): occupancy ≈ +$2K vs the lease, but builds ~$10K/yr of equity — shown as a chip, not counted as draw. Requires SBLP + grants to exist at all (D8); the G2 cash math below no longer applies.'
};
export var UTILS = [25,33,40,45,50,55,60,65,70,75,80];
export var TXREL = [0.7,0.8,0.9,1.0,1.1,1.2,1.3];   // café columns as multiples of the site's mark
export var ROWBADGE = {33:'base', 45:'break-even', 55:'gate case', 75:'ceiling'};
export var RELBADGE = {'1':'site mark', '1.2':'≈ top decile'};
export var LEAN_STOP = 70;                 // absolute, both markets (risk 1) — a pre-signature evidence rule
// The plan's §9 partial-income floor — the owner draw the nonprofit trigger test
// is written against. The explorer does not draw it as a bar (it is a
// household-survival number, not a test of whether the business is worth the
// owner's labor and capital — see OWNER_HRS/RET_LO below), but §6 and the
// benchmark matrix quote it, so it lives here rather than in their prose.
export var PLAN_DRAW_FLOOR = 30;
export var WC_BAND = [50, 65];              // $K: §6's working-capital + Year-1 ramp reserve, as the plan states it
export var WC = Math.round((WC_BAND[0] + WC_BAND[1]) / 2);   // the band's midpoint — what the cash test carries
export var WC_FLOOR = 45;                  // abatement relief cannot take the reserve below this
export var OWNER_HRS = 40;                 // owner’s gridded week: ~30 on the floor + ~10 admin/sales
export var RET_LO = 0.10, RET_HI = 0.20;   // required return on capital at risk: opportunity cost → illiquid-smallco
export var EQUITY_RANGE = [180,300];       // plan’s grant-free cash-to-open range ($K); default is the midpoint
export var BUY_EQUITY = 10;                // $K/yr principal paydown on the SBLP path — counts toward the return side

export var DEF = {site:'li', fin:'lease', util:33, tx:100, price:90, ticket:8.25, cad:'mixed', cafeM:CAFE_MARGIN_DEF,
           events:5.5, caClub:15, caEvent:50, wage:MIT_RUNG, commons:6, churn:1.4,
           build:85, ti:0, abate:0, grants:0, cash:150, runway:24, equity:240};
export let S = Object.assign({}, DEF);

export function evEqOf(ev){ return ev*12/52; }
export function sessRevK(p){ return p*52/1000; }        // one filled weekly session, per year
export function txRevK(t){ return t*360/1000; }         // one walk-in/day, per year
export function caterOrders(util, caClub, caEvent, events){
  var sess = (util/100)*CAPACITY, evEq = evEqOf(events);
  return Math.max(0, sess - evEq)*(caClub/100) + Math.min(evEq, sess)*(caEvent/100);
}
export function caterRevK(util, caClub, caEvent, events){
  return caterOrders(util, caClub, caEvent, events) * CATER_ORDER * 52 / 1000;
}
export function cateringK(util, caClub, caEvent, events){
  return caterRevK(util, caClub, caEvent, events) * CATER_MARGIN;
}
// Gross revenue across all five §5 streams — the base the revenue-proportional operating costs ride on.
export function revenueK(util, tx){
  return (util/100)*CAPACITY*sessRevK(S.price) + tx*txRevK(S.ticket)
    + caterRevK(util, S.caClub, S.caEvent, S.events) + DAYROOM_K + PRINT_K;
}
// Contribution: each stream's revenue at its own margin. Day rooms carry the room margin; prints
// are consignment. Neither is a lever — §5 holds both flat across sites and calls them opportunistic.
export function otherIncomeK(){ return DAYROOM_K*ROOM_MARGIN + PRINT_K*PRINT_MARGIN; }
export function cafeK(tx){ return tx*txRevK(S.ticket)*(S.cafeM/100); }
export function roomsK(util){ return (util/100)*CAPACITY*sessRevK(S.price)*ROOM_MARGIN; }
// Marginals: what one more unit actually leaves in owner comp, net of the ops that ride on revenue.
export function msess(p){ return sessRevK(p)*(ROOM_MARGIN - VAR_OPS); }
export function mtx(t){ return txRevK(t)*(S.cafeM/100 - VAR_OPS); }
// §6 states one operations figure per site — $65K (LI), $62K (SN). Those two differ in revenue
// and in nothing else about operations, so the pair solves for a revenue-proportional part (card
// fees ~3% + marketing ~2.5%) and a fixed base (utilities, insurance, software, R&M/misc). The
// fixed base falls out the SAME at both sites — $46.8K — which is the check that the split is
// real rather than fitted. Solved once, at load, from §6’s own two numbers.
export var VAR_OPS = 0, FIXED_OPS = 0;
(function solveOps(){
  function planRev(site){
    return (PLAN.util/100)*CAPACITY*PLAN.price*52/1000 + SITES[site].mark*PLAN.ticket*360/1000
      + caterOrders(PLAN.util, PLAN.caClub, PLAN.caEvent, PLAN.events)*CATER_ORDER*52/1000
      + DAYROOM_K + PRINT_K;
  }
  var rLi = planRev('li'), rSn = planRev('sn');
  VAR_OPS = (SITES.li.ops - SITES.sn.ops) / (rLi - rSn);
  FIXED_OPS = SITES.li.ops - VAR_OPS*rLi;
})();
// Labor is hours × rate. The hours are the plan’s own: its $120K line at its $23/hr is
// ~5,217 staffed hr/yr (~100/wk), already net of the owner’s ~30 floor hours (D5/D6), so
// the owner’s bar below double-counts nothing. The rung sets the rate; the grid is fixed.
export var STAFF_HRS = PLAN_LABOR_K * 1000 / PLAN.rate;
export function laborK(){ return STAFF_HRS * WAGES[S.wage].rate / 1000; }
// ---- the owner’s bar: living wage, then a return on the capital at risk ----
// The owner’s hour is not a staff hour. An owner-operator drawing from the LLC carries the
// SE tax — 15.3% on 92.35% of the draw, which makes a draw of cash × 1.0755 the equal of a
// wage of cash, so the employer FICA half is the right uplift — but unemployment insurance
// and workers’ comp cover employees, not the member-owner. Benefits stay in: the owner buys
// their own. Pricing the owner’s year at the full staff rate would overstate the bar.
export function ownerRate(){ var w = WAGES[S.wage]; return w.cash*(1+FICA) + w.ben; }
export function livingK(){ return OWNER_HRS * 52 * ownerRate() / 1000; }
export function equityBuildK(){ return S.fin==='buy' ? BUY_EQUITY : 0; }
export function bandLoK(){ return livingK() + RET_LO*S.equity; }
export function bandHiK(){ return livingK() + RET_HI*S.equity; }
export function occupancyK(){ return SITES[S.site].occ + (S.fin==='buy' ? 2 : 0); }   // §6: the buy path runs ≈$2K dearer
export function varOpsK(util, tx){ return VAR_OPS * revenueK(util, tx); }
export function comp(util, tx){
  return roomsK(util) + cafeK(tx) + cateringK(util, S.caClub, S.caEvent, S.events) + otherIncomeK()
    - varOpsK(util, tx) - FIXED_OPS - occupancyK()
    - laborK() - S.commons;
}
export function sessions(util){ return (util/100)*CAPACITY; }
export function clubsFor(util){
  return Math.max(0, sessions(util) - evEqOf(S.events)) / CADENCE[S.cad].avg;
}
export function txCols(){ return TXREL.map(function(r){ return Math.round(r*SITES[S.site].mark); }); }
export function cashK(){ // G2 cash at risk (lease path): net build-out + WC reserve less abatement relief
  if (S.fin==='buy') return null;
  var netBuild = Math.max(0, S.build - S.ti - S.grants);
  var relief = S.abate * SITES[S.site].occ/12;
  return netBuild + Math.max(WC_FLOOR, WC - relief);
}
export function reserveK(){ // cash left to absorb operating losses after capital spend (lease path)
  if (S.fin==='buy') return null;
  var netBuild = Math.max(0, S.build - S.ti - S.grants);
  var relief = S.abate * SITES[S.site].occ/12;
  return S.cash - netBuild + relief;
}
export function bailComp(){ // deepest sustainable annual loss: reserve spread over the runway
  var r = reserveK();
  return r===null ? null : -Math.max(0,r)*12/S.runway;
}
export function utilForTarget(target, tx){ // smallest util% with comp >= target (piecewise-linear; bisect)
  if (comp(140, tx) < target) return null;
  var lo=0, hi=140;
  for (var i=0;i<40;i++){ var mid=(lo+hi)/2; if (comp(mid,tx)>=target) hi=mid; else lo=mid; }
  return hi;
}
export function txForTarget(target, util){ // walk-ins/day needed at a given util (linear in tx)
  return (target - comp(util, 0)) / mtx(S.ticket);
}

// Evaluate `fn` against a one-off settings object without disturbing the live
// state — how the document generators read the model at marks other than the
// current view's. `over` is applied on top of DEF, so every generator states
// only the levers it means to move.
export function withState(over, fn){
  var prev = S;
  S = Object.assign({}, DEF, over);
  try { return fn(); } finally { S = prev; }
}
