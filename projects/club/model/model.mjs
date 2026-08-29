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
  li:{label:'Little Italy', base:-13, mark:100, occ:78, ops:65, sf:2500, psf:22, hint:'~2,500 sf @ $22 NNN · occupancy $78K · operations $65K · café mark 100 walk-ins/day. Switching location re-anchors the café columns and walk-in default to this mark.'},
  sn:{label:'Station North / Highlandtown', base:-35, mark:80, occ:64, ops:62, sf:3000, psf:16, hint:'~3,000 sf @ $16 · occupancy $64K · operations $62K · café mark 80 walk-ins/day — cheaper floor, weaker café column. Columns and walk-in default re-anchored to this mark.'}
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
var FTE_HRS = 2080;                      // a full-time year — the basis for the per-worker annual column
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
var FIN = {
  lease:'Own cash, everything under the <$150K cap (D7): fit-out ≤$85K, working capital $50–65K first.',
  buy:'SBLP-terms purchase (§6 models it for SN/HT only): occupancy ≈ +$2K vs the lease, but builds ~$10K/yr of equity — shown as a chip, not counted as draw. Requires SBLP + grants to exist at all (D8); the G2 cash math below no longer applies.'
};
var UTILS = [25,33,40,45,50,55,60,65,70,75,80];
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
// ---- the cost registry: what the venture spends, declared once --------------
// Every cost carries four things beyond its amount: the income stream it serves,
// the driver it scales with, an evidence grade, and — where the number is an
// estimate rather than a quote — the band it is estimated within. The grades are
// what lets a reader rank what to go verify; the bands are what a sensitivity
// sweep moves. `amount(util, tx)` returns $K/yr as a positive magnitude.
export var EV = {A:'contracted', B:'observed', C:'benchmark', D:'assumed'};

// The banded inputs, each carried at one declared value — the band midpoint,
// except ROOM_SF. `withCost(id, value, fn)` pins one to a band endpoint for a
// sweep; nothing else writes them.
export var CARD_RATE = 0.030;      // card fees, share of the revenue that runs on a card
export var MKT_RATE = 0.025;       // marketing, share of gross revenue (review F15)
export var UTILITIES_K = 15;       // gas, electric, water
export var INSURANCE_K = 15;       // GL + property + liquor (open-questions #20)
export var SOFTWARE_K = 4.5;       // POS, booking, accounting, email
export var RM_MISC_K = 12.5;       // repairs, trash, pest, internet, accounting, licenses
export var ROOM_SF = 300;          // sf per bookable room — the sqft absorption basis
export var SESSION_HRS = 3.5;      // staffed hours a session occupies — the hours basis

var COST_OVER = {};                // input id → pinned value; written only by withCost
function pinned(id){ return Object.prototype.hasOwnProperty.call(COST_OVER, id); }
function inputOf(id, dflt){ return pinned(id) ? COST_OVER[id] : dflt; }
function cardRateRaw(){ return inputOf('card-fees', CARD_RATE); }
function mktRateRaw(){ return inputOf('marketing', MKT_RATE); }
function utilitiesRawK(){ return inputOf('utilities', UTILITIES_K); }
function insuranceRawK(){ return inputOf('insurance', INSURANCE_K); }
function softwareRawK(){ return inputOf('software', SOFTWARE_K); }
function rmMiscRawK(){ return inputOf('rm-misc', RM_MISC_K); }
export function roomSf(){ return inputOf('room-sf', ROOM_SF); }
export function sessionHrs(){ return inputOf('session-hrs', SESSION_HRS); }
// What the built basis publishes: the fixed operations base, and the rate the
// revenue-proportional part rides at.
function builtFixedK(){ return utilitiesRawK() + insuranceRawK() + softwareRawK() + rmMiscRawK(); }
function builtVarRate(){ return cardRateRaw() + mktRateRaw(); }
// On the stated basis §6's two per-site totals are authoritative, so the
// components are carried pro rata inside them — the parts still sum to the whole
// and the tree reconciles on either basis. On the built basis both scales are 1.
function fixedScale(){ return FIXED_OPS / builtFixedK(); }
function varScale(){ return VAR_OPS / builtVarRate(); }
export function cardRate(){ return cardRateRaw() * varScale(); }
export function mktRate(){ return mktRateRaw() * varScale(); }

// Gross revenue by stream — §5's five lines grouped the way costs are attributed
// to them. The three revenue-bearing streams sum to revenueK(); shared carries
// none, which is the point of showing it as its own row.
export function streamRevenueK(util, tx){
  return {
    cafe: tx*txRevK(S.ticket) + caterRevK(util, S.caClub, S.caEvent, S.events),
    rooms: (util/100)*CAPACITY*sessRevK(S.price) + DAYROOM_K,
    books: PRINT_K,
    shared: 0
  };
}

// The registry. `stream` is the income stream the cost serves ('shared' where no
// evidence splits it, 'all' where the same rule applies to each stream on its own
// revenue). `driver` is what the amount scales with. `band` is in `unit`: 'K' is
// $K/yr, 'rate' a share of revenue, 'psf' dollars per square foot. `derived`
// marks a residual — a number that is what is left after the others, honestly
// labeled and bounded rather than independently sourced.
export var COSTS = [
  {id:'cafe-cogs', label:'Cost of sale — café', stream:'cafe', driver:'streamRev', ev:'B',
   band:null, unit:null, src:'§6 COGS line, carried as the café-margin lever',
   amount:function(util, tx){ return tx*txRevK(S.ticket)*(1 - S.cafeM/100); }},
  {id:'cater-cogs', label:'Cost of sale — catering', stream:'cafe', driver:'streamRev', ev:'C',
   band:null, unit:null, src:'§5 catering margin',
   amount:function(util, tx){ return caterRevK(util, S.caClub, S.caEvent, S.events)*(1 - CATER_MARGIN); }},
  {id:'room-cos', label:'Cost of sale — rooms', stream:'rooms', driver:'streamRev', ev:'C',
   band:null, unit:null, src:'§5 room margin — near-zero cost of sale',
   amount:function(util, tx){ return ((util/100)*CAPACITY*sessRevK(S.price) + DAYROOM_K)*(1 - ROOM_MARGIN); }},
  {id:'print-consign', label:'Consignment share', stream:'books', driver:'streamRev', ev:'B',
   band:null, unit:null, src:'§5: consignment takes 60%',
   amount:function(util, tx){ return PRINT_K*(1 - PRINT_MARGIN); }},
  {id:'commons', label:'Commons budget', stream:'books', driver:'fixed', ev:'A',
   band:null, unit:null, src:'the budgeted philanthropy — a decision, not an estimate',
   amount:function(util, tx){ return S.commons; }},
  {id:'card-fees', label:'Card fees', stream:'all', driver:'streamRev', ev:'B', perStream:true,
   band:[0.027, 0.033], unit:'rate', src:'adversarial review F1 blended ~2.7%; §6 prose ~3%',
   amount:function(util, tx){ return cardRate()*revenueK(util, tx); }},
  {id:'marketing', label:'Marketing', stream:'shared', driver:'revenue', ev:'D',
   band:[0.020, 0.030], unit:'rate', src:'review F15: 2–3% of revenue ($8–13K)',
   amount:function(util, tx){ return mktRate()*revenueK(util, tx); }},
  {id:'utilities', label:'Utilities', stream:'shared', driver:'hours', ev:'C',
   band:[12, 18], unit:'K', src:'review F1',
   amount:function(util, tx){ return utilitiesRawK()*fixedScale(); }},
  {id:'insurance', label:'Insurance', stream:'shared', driver:'payroll', ev:'D',
   band:[10, 20], unit:'K', src:'review F1; open-questions #20',
   amount:function(util, tx){ return insuranceRawK()*fixedScale(); }},
  {id:'software', label:'Software & subscriptions', stream:'shared', driver:'fixed', ev:'C',
   band:[3, 6], unit:'K', src:'review F1',
   amount:function(util, tx){ return softwareRawK()*fixedScale(); }},
  {id:'rm-misc', label:'Repairs & misc', stream:'shared', driver:'fixed', ev:'C',
   band:[10, 15], unit:'K', src:'review F1 — repairs, trash, pest, internet, accounting, licenses',
   amount:function(util, tx){ return rmMiscRawK()*fixedScale(); }},
  {id:'base-rent', label:'Base rent', stream:'shared', driver:'sqft', ev:'C',
   band:null, unit:null, src:'§6 site line: sf × $/sf',
   amount:function(util, tx){ return baseRentK(); }},
  {id:'nnn', label:'NNN — CAM, taxes, insurance', stream:'shared', driver:'sqft', ev:'D', derived:true,
   band:[5, 12], unit:'psf', src:'the remainder of §6 occupancy after base rent; band is the market range',
   amount:function(util, tx){ return nnnK(); }},
  {id:'buy-premium', label:'Purchase premium', stream:'shared', driver:'sqft', ev:'C',
   band:null, unit:null, src:'§6: the buy path runs ≈$2K dearer than the lease',
   amount:function(util, tx){ return S.fin==='buy' ? 2 : 0; }},
  {id:'labor', label:'Labor', stream:'shared', driver:'hours', ev:'B',
   band:null, unit:null, src:'§6 $120K line, repriced as the rung’s rate over the plan’s own staffed grid',
   amount:function(util, tx){ return laborK(); }}
];
export function costById(id){
  for (var ci=0; ci<COSTS.length; ci++){ if (COSTS[ci].id === id) return COSTS[ci]; }
  return null;
}
// Every input that carries a band — the banded costs plus the two geometry
// constants the absorption bases stand on. This is the list a sensitivity sweep
// walks, and the id in each row is the one `withCost` takes.
export var INPUTS = [];
COSTS.forEach(function(c){
  if (c.band) INPUTS.push({id:c.id, label:c.label, ev:c.ev, band:c.band, unit:c.unit});
});
INPUTS.push({id:'room-sf', label:'Bookable room area', ev:'D', band:[250, 400], unit:'sf'});
INPUTS.push({id:'session-hrs', label:'Staffed hours per session', ev:'D', band:[2, 5], unit:'hrs'});
export function inputById(id){
  for (var ii=0; ii<INPUTS.length; ii++){ if (INPUTS[ii].id === id) return INPUTS[ii]; }
  return null;
}
// A cost's band restated in $K at the current point, so a bar can carry a whisker
// in the units it is drawn in. Always a positive magnitude, like a bar's width.
// Null where the cost has no band.
export function bandK(id, util, tx){
  var c = costById(id);
  if (c === null || c.band === null) return null;
  if (c.unit === 'K') return [c.band[0], c.band[1]];
  if (c.unit === 'rate'){
    var base = revenueK(util, tx);
    return [c.band[0]*base, c.band[1]*base];
  }
  if (c.unit === 'psf'){
    var ksf = SITES[S.site].sf/1000;
    return [c.band[0]*ksf, c.band[1]*ksf];
  }
  return null;
}

// The operations line runs on one of two bases. On 'built' it is the registry's own
// components: a fixed base (utilities, insurance, software, R&M/misc at their band
// midpoints) plus a revenue-proportional part (card fees + marketing). On 'stated'
// it is §6's two published totals — $65K (LI), $62K (SN) — which differ in revenue
// and in nothing else about operations, so the pair solves for one rate and one
// fixed base. The stated basis is kept because reproducing §6 is still worth
// asserting, but note what it cannot prove: the solved fixed base lands identically
// at both sites by construction, for any two (ops, revenue) pairs. The built basis
// is the one that can be wrong, and reconciling it against §6 is the real check.
export var OPS_BASIS = 'built';   // 'built' = the registry's components | 'stated' = §6's per-site totals
export var VAR_OPS = 0, FIXED_OPS = 0;
function statedOps(){
  function planRev(site){
    return (PLAN.util/100)*CAPACITY*PLAN.price*52/1000 + SITES[site].mark*PLAN.ticket*360/1000
      + caterOrders(PLAN.util, PLAN.caClub, PLAN.caEvent, PLAN.events)*CATER_ORDER*52/1000
      + DAYROOM_K + PRINT_K;
  }
  var rLi = planRev('li'), rSn = planRev('sn');
  var v = (SITES.li.ops - SITES.sn.ops) / (rLi - rSn);
  return {vr:v, fx:SITES.li.ops - v*rLi};
}
function applyOpsBasis(){
  if (OPS_BASIS === 'stated'){
    var s = statedOps();
    VAR_OPS = s.vr; FIXED_OPS = s.fx;
  } else {
    VAR_OPS = builtVarRate(); FIXED_OPS = builtFixedK();
  }
}
applyOpsBasis();
// What the built components come to as one operations figure at a site's plan
// marks — the number that has to reconcile with §6's stated total.
export function builtOpsK(site){
  return withOpsBasis('built', function(){
    return withState({site:site}, function(){
      return FIXED_OPS + VAR_OPS*revenueK(PLAN.util, SITES[site].mark);
    });
  });
}
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
function equityBuildK(){ return S.fin==='buy' ? BUY_EQUITY : 0; }
export function bandLoK(){ return livingK() + RET_LO*S.equity; }
export function bandHiK(){ return livingK() + RET_HI*S.equity; }
// Occupancy, built from its parts: base rent is floor area × the site's asking
// rate; NNN (CAM, taxes, insurance) is what §6's occupancy total leaves after it.
// NNN is still a residual — §6's total stays authoritative — but it is now a
// labeled one with a band, so it can be swept and it can be argued about. The
// per-site totals are unchanged: 55 + 23 = 78 (LI), 48 + 16 = 64 (SN).
export function baseRentK(){ return SITES[S.site].sf * SITES[S.site].psf / 1000; }
export function nnnK(){
  var st = SITES[S.site];
  return pinned('nnn') ? inputOf('nnn', 0)*st.sf/1000 : st.occ - st.sf*st.psf/1000;
}
export function nnnPsf(){ return nnnK() / (SITES[S.site].sf/1000); }   // $9.20/sf LI, $5.33/sf SN
export function occupancyK(){ return baseRentK() + nnnK() + (S.fin==='buy' ? 2 : 0); }   // §6: the buy path runs ≈$2K dearer
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
function cashK(){ // G2 cash at risk (lease path): net build-out + WC reserve less abatement relief
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

// ---- the P&L as a tree -------------------------------------------------------
// The same arithmetic comp() runs, grouped by income stream instead of by cost
// nature — the grouping that can answer "what does the café earn?".
//
// Sign convention: revenue nodes are positive and cost nodes are negative, so
// summing every leaf across all four depth-0 nodes gives comp() with no per-node
// sign flips. A parent's `value` is the sum of its children's. `band`, in
// contrast, is always a positive magnitude in $K — a bar's width, not its sign.
// `atomic` marks a leaf with no finer breakdown to show (café cost of sale is
// one: §6 gives a margin, not a bill of materials) as opposed to one not yet
// built. Depth-0 nodes carry kind 'stream' — they hold both revenue and cost.
function revNode(id, label, stream, value){
  return {id:id, label:label, kind:'revenue', stream:stream, value:value,
          ev:null, band:null, atomic:true, children:[]};
}
function costNode(id, label, stream, magnitude, ev, band){
  return {id:id, label:label, kind:'cost', stream:stream, value:-magnitude,
          ev:ev, band:band, atomic:true, children:[]};
}
function sumNodes(children){
  var v = 0;
  children.forEach(function(c){ v += c.value; });
  return v;
}
function groupNode(id, label, stream, children){
  return {id:id, label:label, kind:'cost', stream:stream, value:sumNodes(children),
          ev:null, band:null, atomic:false, children:children};
}
function streamNode(id, label, children){
  return {id:id, label:label, kind:'stream', stream:id, value:sumNodes(children),
          ev:null, band:null, atomic:false, children:children};
}
// A leaf straight off the registry — the registry is the only place a cost's
// stream, grade and band are declared, and the tree reads them from there.
function entryNode(id, util, tx){
  var c = costById(id);
  if (c === null) throw new Error('unknown cost id in the tree: ' + id);
  return costNode(c.id, c.label, c.stream, c.amount(util, tx), c.ev, bandK(id, util, tx));
}
// Card fees are a per-stream rule, not one line: each revenue stream pays the same
// rate on its own revenue, so each carries its own line and its own band.
function cardNode(stream, base){
  var c = costById('card-fees');
  return costNode('card-fees-' + stream, c.label, stream, cardRate()*base, c.ev,
                  [c.band[0]*base, c.band[1]*base]);
}
// Labor drills into the rung's own three parts — the same parts WAGES prices the
// rate from, so the breakdown shown is the model rather than a gloss on it.
function laborNodes(){
  var w = WAGES[S.wage], h = STAFF_HRS/1000;
  return [
    costNode('labor-cash', 'Cash wages', 'shared', h*w.cash, 'B', null),
    costNode('labor-load', 'Employer payroll load', 'shared', h*w.pay, 'B', null),
    costNode('labor-ben', 'Employer-paid benefits', 'shared', h*w.ben, 'B', null)
  ];
}
export function tree(util, tx){
  if (util === undefined) util = S.util;
  if (tx === undefined) tx = S.tx;
  var rev = streamRevenueK(util, tx);
  var occKids = [entryNode('base-rent', util, tx), entryNode('nnn', util, tx)];
  if (S.fin === 'buy') occKids.push(entryNode('buy-premium', util, tx));
  return [
    streamNode('cafe', 'Café', [
      revNode('cafe-walkin', 'Walk-in café', 'cafe', tx*txRevK(S.ticket)),
      revNode('cafe-catering', 'Catering pre-orders', 'cafe', caterRevK(util, S.caClub, S.caEvent, S.events)),
      entryNode('cafe-cogs', util, tx),
      entryNode('cater-cogs', util, tx),
      cardNode('cafe', rev.cafe)
    ]),
    streamNode('rooms', 'Rooms', [
      revNode('rooms-sessions', 'Club sessions', 'rooms', (util/100)*CAPACITY*sessRevK(S.price)),
      revNode('rooms-dayroom', 'Day rooms', 'rooms', DAYROOM_K),
      entryNode('room-cos', util, tx),
      cardNode('rooms', rev.rooms)
    ]),
    streamNode('books', 'Books', [
      revNode('books-prints', 'Print sales', 'books', PRINT_K),
      entryNode('print-consign', util, tx),
      entryNode('commons', util, tx),
      cardNode('books', rev.books)
    ]),
    streamNode('shared', 'Cross-cutting', [
      entryNode('marketing', util, tx),
      groupNode('operations', 'Operations — fixed', 'shared', [
        entryNode('utilities', util, tx),
        entryNode('insurance', util, tx),
        entryNode('software', util, tx),
        entryNode('rm-misc', util, tx)
      ]),
      groupNode('occupancy', 'Occupancy', 'shared', occKids),
      groupNode('labor', 'Labor', 'shared', laborNodes())
    ])
  ];
}
export function eachLeaf(node, fn){
  if (node.children.length === 0){ fn(node); return; }
  node.children.forEach(function(c){ eachLeaf(c, fn); });
}
// Revenue, attributed cost and margin per stream. `cost` is a positive magnitude;
// `margin` is revenue less cost, which is the depth-0 node's own value. The three
// revenue streams plus cross-cutting sum to comp().
export function streamMargins(util, tx){
  var out = {};
  tree(util, tx).forEach(function(n){
    var r = 0, c = 0;
    eachLeaf(n, function(l){ if (l.kind === 'revenue') r += l.value; else c -= l.value; });
    out[n.id] = {revenue:r, cost:c, margin:r - c};
  });
  return out;
}
// The share of the cross-cutting row each stream carries, on one of three bases.
// None of the three is a hand-picked weight: revenue is derived outright, floor
// area stands on ROOM_SF and hours on SESSION_HRS — both declared, graded D and
// banded, so the sweep can move them. Rooms are the only stream with a footprint
// and a staffed hour of their own; books are a wall and a draw, so they take none
// of either and carry only their revenue share.
export function absorbWeights(basis, util, tx){
  var w;
  if (basis === 'revenue'){
    var rev = streamRevenueK(util, tx);
    w = {cafe:rev.cafe, rooms:rev.rooms, books:rev.books};
  } else if (basis === 'sqft'){
    var roomArea = 3*roomSf();
    w = {cafe:Math.max(0, SITES[S.site].sf - roomArea), rooms:roomArea, books:0};
  } else if (basis === 'hours'){
    var roomHrs = sessions(util)*sessionHrs()*52;
    w = {cafe:Math.max(0, STAFF_HRS - roomHrs), rooms:roomHrs, books:0};
  } else {
    throw new Error("absorbWeights: unknown basis '" + basis + "'");
  }
  var tot = w.cafe + w.rooms + w.books;
  return {cafe:w.cafe/tot, rooms:w.rooms/tot, books:w.books/tot};
}
// The fully-absorbed view: the cross-cutting row pushed onto the three revenue
// streams. The three margins it returns sum to comp() — absorption moves cost
// between streams, it never creates or destroys any.
export function absorb(basis, util, tx){
  if (util === undefined) util = S.util;
  if (tx === undefined) tx = S.tx;
  var m = streamMargins(util, tx), w = absorbWeights(basis, util, tx), out = {};
  ['cafe', 'rooms', 'books'].forEach(function(id){
    var share = m.shared.cost * w[id];
    out[id] = {revenue:m[id].revenue, cost:m[id].cost, absorbed:share,
               weight:w[id], margin:m[id].margin - share};
  });
  return out;
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

// The same idea for the operations basis. FIXED_OPS and VAR_OPS are module vars
// comp() reads, so they are saved and restored alongside the switch itself.
export function withOpsBasis(basis, fn){
  var pb = OPS_BASIS, pv = VAR_OPS, pf = FIXED_OPS;
  OPS_BASIS = basis;
  applyOpsBasis();
  try { return fn(); } finally { OPS_BASIS = pb; VAR_OPS = pv; FIXED_OPS = pf; }
}
// Pin one banded input to a value — a band endpoint, for a sensitivity sweep —
// and evaluate `fn` with it. The operations aggregates are recomputed under the
// pin and restored after, so comp() moves with the input the way it should. The
// ids are the ones INPUTS lists; an unknown one is an error, not a silent no-op.
export function withCost(id, value, fn){
  if (inputById(id) === null) throw new Error("withCost: '" + id + "' is not a banded input");
  var po = COST_OVER, pv = VAR_OPS, pf = FIXED_OPS;
  COST_OVER = Object.assign({}, COST_OVER);
  COST_OVER[id] = value;
  applyOpsBasis();
  try { return fn(); } finally { COST_OVER = po; VAR_OPS = pv; FIXED_OPS = pf; }
}
