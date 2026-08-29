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
  li:{label:'Little Italy', base:-13, mark:100, occ:78, ops:65, sf:2500, psf:22, hint:'~2,500 sf @ $22 NNN · occupancy $78K · operations {ops} · café mark 100 walk-ins/day. Switching location re-anchors the café columns and walk-in default to this mark.'},
  sn:{label:'Station North / Highlandtown', base:-35, mark:80, occ:64, ops:62, sf:3000, psf:16, hint:'~3,000 sf @ $16 · occupancy $64K · operations {ops} · café mark 80 walk-ins/day — cheaper floor, weaker café column. Columns and walk-in default re-anchored to this mark.'}
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
  buy:'SBLP-terms purchase (§6 models it for SN/HT only): occupancy ≈ +$2K vs the lease, and the loan builds equity as it amortizes — shown as a chip, not counted as draw. Requires SBLP + grants to exist at all (D8); the cash gate applies here too, against a down payment, closing costs and the same derived working capital.'
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
export var WC = Math.round((WC_BAND[0] + WC_BAND[1]) / 2);   // the band's midpoint — what the stated basis carries
export var OWNER_HRS = 40;                 // owner’s gridded week: ~30 on the floor + ~10 admin/sales
export var RET_LO = 0.10, RET_HI = 0.20;   // required return on capital at risk: opportunity cost → illiquid-smallco
export var EQUITY_RANGE = [180,300];       // plan’s grant-free cash-to-open range ($K) — an assertion the capital layer can now check
export var BUY_EQUITY = 10;                // $K/yr principal paydown the plan states for the SBLP path; principalK() is the built figure

// ---- the capital layer: deal terms, the uses of cash, and the ramp ----------
// Required capital is a derived output, not a slider, and the chain that derives
// it is a directed acyclic graph. It has to stay one:
//
//   comp() → rampSeries() → peakDeficitK() → workingCapitalK()
//          → requiredCapitalK() → capitalAtRiskK() → bandLoK()/bandHiK()
//
// comp() reads occupancy, the operations aggregates, labor and the commons
// budget. It never reads the owner's bars, never reads USES, and never reads
// working capital — so the capital layer can depend on the operating model
// without the operating model depending back, and the ramp can call comp() at a
// month's marks without re-entering itself. Two changes would close the cycle
// and must not be written: putting the replacement-capex reserve inside comp()
// (it lives in drawK(), below the operating model, for exactly this reason), and
// deriving the depreciable base from requiredCapitalK() rather than from the
// hard-cost uses — required capital contains working capital, which contains
// comp(), so that base would run the reserve back into the number it is
// subtracted from.
//
// Deal terms, beside SITES: site geometry and the deal are the two things
// required capital is a function of. `tiPsf` and `abateMo` are the declared
// defaults for the two terms the explorer drags — they are carried live in
// S.ti ($/sf) and S.abate (months) so `withState` can move them; the rest are
// read from DEAL directly.
export var DEAL = {tiPsf:0, abateMo:0, depositMo:2, constructionMo:4, rampMo:18,
                   deliveryCondition:'as-is', escalationPct:3, termYrs:5};
// Fit-out priced per square foot instead of as a flat budget. $34/sf is the rate
// today's flat $85K implies over Little Italy's 2,500 sf, so the LI defaults
// reproduce the published build-out figure exactly and SN/HT's extra 500 sf
// costs what it actually costs.
export var FITOUT_PSF = 34;
export var FFE_PSF = 5.6;            // $14K at LI's 2,500 sf — the [8,20] band's midpoint, per sf so it moves with the site
export var PREOPEN_WKS = 6;          // staffed weeks before the doors open: ~4 hiring, ~2 training
export var LICENSES_K = 14;          // licenses, architect, attorney — the [8,20] midpoint
export var INVENTORY_K = 5.5;        // opening inventory — the [3,8] midpoint
export var CONTINGENCY_RATE = 0.15;  // on hard cost (fit-out + FF&E) — the [10,20]% midpoint
export var CLOSING_RATE = 0.035;     // buy path: closing costs as a share of price — the [2,5]% midpoint
export var USEFUL_LIFE_YRS = 8;      // fit-out and FF&E replaced on a 7–10 year life
export var TAX_DIST_RATE = 0.25;     // member tax distribution on taxable income — blended federal + MD, net of QBI
export var RECOVERY = {deposit:1.0, ffe:0.30};   // what survives a wind-down: the deposit in full, FF&E at resale
// The ramp: how fast the two engines reach the stabilized marks comp() prices.
// The opening month is a fraction of stabilized — clubs recruit slower than the
// café fills — and the fractions close linearly over DEAL.rampMo months.
export var RAMP_OPEN = {util:0.35, tx:0.50};
export var RAMP_HORIZON_MO = 60;     // months carried past opening; a curve that has not turned by here has not turned
export var WC_BASIS = 'built';       // 'built' = the ramp's peak cash deficit | 'stated' = §6's $50–65K
// The buy path, priced. The plan carries no purchase price — §6 gives only "buy
// occupancy ≈ lease + $2K" — so pricePsf is graded D and banded, and the debt
// service it implies is reconciled against that stated figure rather than
// assumed to reproduce it.
export var LOAN = {pricePsf:105, ltv:0.90, ratePct:6.5, termYrs:20};
export var PROP_TAX_RATE = 0.02248;  // Baltimore City real property — $2.248 per $100 of assessed value
export var OWNER_INS_K = 4;          // property insurance the owner carries directly on the buy path
export var STRUCT_RESERVE_PSF = 1.0; // roof/HVAC/structure reserve, $/sf/yr — the landlord's job on the lease path

// `build` is D7's scope cap, not the fit-out budget: the derived scope is what
// the site costs to build out and the cap is what the plan committed to spend,
// so scopeOverrunK() can report the difference instead of hiding it. `ti` is in
// $/sf (#17's own units), not $K. `equity` is null meaning *derive it* —
// capital at risk comes from the uses registry; a number overrides, so
// withState({equity:300}, …) still answers a what-if.
export var DEF = {site:'li', fin:'lease', util:33, tx:100, price:90, ticket:8.25, cad:'mixed', cafeM:CAFE_MARGIN_DEF,
           events:5.5, caClub:15, caEvent:50, wage:MIT_RUNG, commons:6, churn:1.4,
           build:85, ti:DEAL.tiPsf, abate:DEAL.abateMo, grants:0, cash:150, runway:24, equity:null};
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
function equityBuildK(){ return principalK(); }
// The capital the return is charged on. Null equity means derive it from the
// uses registry — which is what makes the bar move when the deal moves: harder
// TI, a grant, or an abated month all land here. A number is an override.
export function equityK(){ return S.equity === null ? capitalAtRiskK() : S.equity; }
export function bandLoK(){ return livingK() + RET_LO*equityK(); }
export function bandHiK(){ return livingK() + RET_HI*equityK(); }
// Occupancy, built from its parts: base rent is floor area × the site's asking
// rate; NNN (CAM, taxes, insurance) is what §6's occupancy total leaves after it.
// NNN is still a residual — §6's total stays authoritative — but it is now a
// labeled one with a band, so it can be swept and it can be argued about. The
// per-site totals are unchanged: 55 + 23 = 78 (LI), 48 + 16 = 64 (SN).
// The Location lever's tooltip. The operations figure is the built total, not a
// typed-in literal — this string used to quote §6's stated $65K/$62K and went
// stale the moment the line was rebuilt from components.
export function siteHint(site){
  return SITES[site].hint.replace('{ops}', '$' + Math.round(builtOpsK(site)) + 'K');
}
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
// ---- site geometry and the deal terms the capital layer reads ---------------
export function sf(){ return SITES[S.site].sf; }
export function tiPsf(){ return S.ti; }                  // the live lever, in DEAL.tiPsf's units
export function tiK(){ return tiPsf() * sf() / 1000; }   // #17's $15–25/sf ask, stated in the plan's own units
export function fitoutScopeK(){ return useInput('fitout', FITOUT_PSF) * sf() / 1000; }
// What the site's geometry says the build-out costs, against what D7 said it
// would spend. The model reports the difference; it does not clip the scope to
// the cap, because clipping would hide the one number the cap exists to test.
export function scopeOverrunK(){ return Math.max(0, fitoutScopeK() - S.build); }
// Abatement is free rent from lease commencement, so the construction months
// consume it first and only what is left spills into the operating ramp.
// Counting it in both places would relieve the same months twice; splitting it
// this way leaves required capital the same wherever the relief lands.
export function abateMonths(){ return S.fin==='buy' ? 0 : S.abate; }
export function abatePreopenMo(){ return Math.min(abateMonths(), DEAL.constructionMo); }
export function abateOpenMo(){ return Math.max(0, abateMonths() - DEAL.constructionMo); }
export function pricePsf(){ return useInput('downpayment', LOAN.pricePsf); }
export function priceK(){ return pricePsf() * sf() / 1000; }

// ---- the uses-of-cash registry ----------------------------------------------
// The same shape and the same four obligations as COSTS: an id, the driver the
// amount scales with, an evidence grade, an amount, and — where the number is an
// estimate rather than a commitment — the band it is estimated within. `unit` is
// the band's unit: 'K' is $K, 'psf' dollars per square foot, 'mo' months of
// occupancy, 'wk' staffed weeks, 'rate' a share. `derived` marks a use that is
// the output of another part of the model rather than an independently sourced
// number — working capital is the ramp's trough, which is the whole point of
// building the ramp. `amount()` returns $K as a positive magnitude at the
// current state; a use that does not apply on the current finance path returns
// zero, the way the purchase premium does in COSTS.
export var USES = [
  {id:'fitout', label:'Fit-out (net of TI and grants)', driver:'sqft', ev:'D',
   band:[25,45], unit:'psf', src:'D7’s $85K over LI’s 2,500 sf is $34/sf; the band is the as-is to vanilla-box range',
   amount:function(){ return Math.max(0, fitoutScopeK() - (S.fin==='buy' ? 0 : tiK()) - S.grants); }},
  {id:'ffe', label:'FF&E', driver:'sqft', ev:'D',
   band:[8,20], unit:'K', src:'§6 names FF&E in the cash paragraph and carries no line for it',
   amount:function(){ return useInput('ffe', FFE_PSF * sf() / 1000); }},
  {id:'deposit', label:'Security deposit', driver:'months', ev:'C',
   band:[2,3], unit:'mo', src:'2–3 months of occupancy is the market term; the plan names deposits and carries no line',
   amount:function(){ return S.fin==='buy' ? 0 : useInput('deposit', DEAL.depositMo) * occupancyK() / 12; }},
  {id:'downpayment', label:'Down payment', driver:'price', ev:'D',
   band:[60,150], unit:'psf', src:'no price in the plan — the band is the SN/HT small-commercial range; closing and property tax read the same price',
   amount:function(){ return S.fin==='buy' ? (1 - LOAN.ltv) * priceK() : 0; }},
  {id:'closing', label:'Closing costs', driver:'price', ev:'C',
   band:[0.02,0.05], unit:'rate', src:'title, transfer and recordation, appraisal, legal — 2–5% of price',
   amount:function(){ return S.fin==='buy' ? useInput('closing', CLOSING_RATE) * priceK() : 0; }},
  {id:'preopen-occ', label:'Occupancy before opening', driver:'months', ev:'C',
   band:null, unit:null, src:'construction months less the abatement they consume, at the site’s own occupancy',
   amount:function(){ return Math.max(0, DEAL.constructionMo - abatePreopenMo()) * occupancyK() / 12; }},
  {id:'preopen-pay', label:'Hiring & training', driver:'hours', ev:'D',
   band:[4,10], unit:'wk', src:'staffed weeks off the plan’s own grid before revenue starts',
   amount:function(){ return useInput('preopen-pay', PREOPEN_WKS) * laborK() / 52; }},
  {id:'licenses', label:'Licenses, architect, attorney', driver:'fixed', ev:'C',
   band:[8,20], unit:'K', src:'liquor and food licensing, permit drawings, lease and entity counsel',
   amount:function(){ return useInput('licenses', LICENSES_K); }},
  {id:'inventory', label:'Opening inventory', driver:'fixed', ev:'C',
   band:[3,8], unit:'K', src:'first fill of café, catering and consignment stock',
   amount:function(){ return useInput('inventory', INVENTORY_K); }},
  {id:'contingency', label:'Contingency', driver:'hardCost', ev:'D',
   band:[0.10,0.20], unit:'rate', src:'a rate on hard cost (fit-out + FF&E) — the line a first build-out always needs',
   amount:function(){ return useInput('contingency', CONTINGENCY_RATE) * hardCostK(); }},
  {id:'working-cap', label:'Working capital', driver:'ramp', ev:'D', derived:true,
   band:WC_BAND, unit:'K', src:'the ramp’s peak cash deficit; the band is §6’s stated $50–65K, which it is reconciled against',
   amount:function(){ return workingCapitalK(); }}
];
export function useById(id){
  for (var ui=0; ui<USES.length; ui++){ if (USES[ui].id === id) return USES[ui]; }
  return null;
}
export function useAmountK(id){
  var u = useById(id);
  if (u === null) throw new Error('unknown use id: ' + id);
  return u.amount();
}
// The hard cost the contingency rides on and the replacement reserve is
// depreciated over: the two uses that buy a physical thing. Deliberately not
// requiredCapitalK() — see the acyclicity note above.
export function hardCostK(){ return useAmountK('fitout') + useAmountK('ffe'); }
// Every use that carries a band — the list a capital sensitivity sweep walks,
// and the id each row's `withUse` takes. The derived one is excluded: pinning an
// output is not a sweep of an input.
export var CAP_INPUTS = [];
USES.forEach(function(u){
  if (u.band && u.derived !== true) CAP_INPUTS.push({id:u.id, label:u.label, ev:u.ev, band:u.band, unit:u.unit});
});
export function capInputById(id){
  for (var ki=0; ki<CAP_INPUTS.length; ki++){ if (CAP_INPUTS[ki].id === id) return CAP_INPUTS[ki]; }
  return null;
}
var USE_OVER = {};                 // use id → pinned input value; written only by withUse
function usePinned(id){ return Object.prototype.hasOwnProperty.call(USE_OVER, id); }
function useInput(id, dflt){ return usePinned(id) ? USE_OVER[id] : dflt; }
// Pin one banded use to a value — a band endpoint, for a capital sweep — and
// evaluate `fn` with it, the same shape as withCost. The value is in the band's
// own unit, so 'fitout' takes $/sf and 'contingency' takes a rate.
export function withUse(id, value, fn){
  if (capInputById(id) === null) throw new Error("withUse: '" + id + "' is not a banded use");
  var po = USE_OVER;
  USE_OVER = Object.assign({}, USE_OVER);
  USE_OVER[id] = value;
  try { return fn(); } finally { USE_OVER = po; }
}
// The same idea for the deal terms and the loan, which are module objects rather
// than lever state — so a generator can ask what four more construction months
// or a point of interest cost without disturbing anything else.
export function withDeal(over, fn){
  var pd = DEAL;
  DEAL = Object.assign({}, DEAL, over);
  try { return fn(); } finally { DEAL = pd; }
}
export function withLoan(over, fn){
  var pl = LOAN;
  LOAN = Object.assign({}, LOAN, over);
  try { return fn(); } finally { LOAN = pl; }
}
// What it costs to open, and what is left of D7's cap after it. This is the G2
// test computed rather than asserted.
export function requiredCapitalK(){
  var t = 0;
  USES.forEach(function(u){ t += u.amount(); });
  return t;
}
export function headroomK(){ return S.cash - requiredCapitalK(); }

// ---- the monthly ramp: the model's one time dimension -----------------------
// The minimum time dimension that makes working capital derivable. The series
// starts at opening — the construction months are already carried as
// `preopen-occ`, so starting at signature would double-count them — and runs to
// RAMP_HORIZON_MO. Each month reprices comp() at that month's marks and divides
// by twelve; nothing about the stabilized model is restated here, which is what
// keeps the ramp and the Year-2 snapshot from drifting apart. Occupancy is
// waived in the abated months that survived construction.
export function rampFrac(m, open){
  if (DEAL.rampMo <= 1) return 1;
  return open + (1 - open) * Math.min(1, (m - 1) / (DEAL.rampMo - 1));
}
export function rampSeries(){
  var out = [], cum = 0, free = abateOpenMo(), relief = occupancyK() / 12;
  for (var m=1; m<=RAMP_HORIZON_MO; m++){
    var u = S.util * rampFrac(m, RAMP_OPEN.util);
    var t = S.tx * rampFrac(m, RAMP_OPEN.tx);
    var margin = comp(u, t) / 12 + (m <= free ? relief : 0);
    cum += margin;
    out.push({m:m, util:u, tx:t, margin:margin, cumulative:cum});
  }
  return out;
}
// The trough, as a positive magnitude, floored at zero. Each of these takes an
// already-computed series so a caller that needs several does not rebuild it.
export function peakDeficitK(series){
  if (series === undefined) series = rampSeries();
  var lo = 0;
  for (var i=0; i<series.length; i++){ if (series[i].cumulative < lo) lo = series[i].cumulative; }
  return -lo;
}
// Null, not a large number, where the ramp never turns inside the horizon: the
// difference between "month 16" and "not within five years" is the answer, and
// rendering the second as a number would bury it.
export function monthsToPositive(series){
  if (series === undefined) series = rampSeries();
  for (var i=0; i<series.length; i++){ if (series[i].margin >= 0) return series[i].m; }
  return null;
}
export function monthsToRecover(series){
  if (series === undefined) series = rampSeries();
  for (var i=0; i<series.length; i++){ if (series[i].cumulative >= 0) return series[i].m; }
  return null;
}
// The stabilized burn, and the reserve that funds S.runway months of it — the
// existing bailComp() relation inverted. This is the fallback when the ramp
// never turns: there is no trough to measure, so the requirement is however long
// the operator has decided to fund the verdict, which is what `runway` always
// was. Where the ramp does turn, `runway` becomes a readout instead.
export function stabilizedBurnK(){ return Math.max(0, -comp(S.util, S.tx)); }
export function runwayReserveK(){ return stabilizedBurnK() * S.runway / 12; }
export function rampTurns(){ return monthsToPositive() !== null; }
// Working capital, on one of two bases — the same arrangement, and the same
// reason for it, as OPS_BASIS. Under 'built' it is what the ramp requires; under
// 'stated' it is §6's own $50–65K midpoint. The stated basis survives because
// reproducing what §6 asserted is still worth asserting; the built basis is the
// one that can be wrong, and reconciling the two is the real check.
export function workingCapitalK(){
  if (WC_BASIS === 'stated') return WC;
  var s = rampSeries();
  return monthsToPositive(s) === null ? runwayReserveK() : peakDeficitK(s);
}
export function withWcBasis(basis, fn){
  var pw = WC_BASIS;
  WC_BASIS = basis;
  try { return fn(); } finally { WC_BASIS = pw; }
}

// ---- closing the loop to the owner's bar ------------------------------------
// What survives a wind-down: the deposit comes back on a surrender in good
// standing, FF&E resells at a haircut. Fit-out is a leasehold improvement and
// stays with the building; the down payment on a 90%-LTV purchase is not
// counted, because a forced sale at that leverage rarely returns it.
export function recoverableK(){
  return RECOVERY.deposit*useAmountK('deposit') + RECOVERY.ffe*useAmountK('ffe');
}
export function capitalAtRiskK(){ return requiredCapitalK() - recoverableK(); }

// ---- draw, distinguished from comp ------------------------------------------
// comp() is the operating residual and is not touched by any of this. A draw is
// the cash the owner can actually take: comp less the reserve against the
// capital the year consumed, less the tax the pass-through income triggers, less
// principal on the buy path. The reserve is depreciation the model never carried
// — a stabilized year that never reserves against the fit-out it is wearing out
// overstates what the owner takes home.
export function depreciableBaseK(){ return hardCostK(); }
export function replacementReserveK(){ return depreciableBaseK() / USEFUL_LIFE_YRS; }
export function taxDistK(util, tx){
  if (util === undefined) util = S.util;
  if (tx === undefined) tx = S.tx;
  return TAX_DIST_RATE * Math.max(0, comp(util, tx) - replacementReserveK());
}
export function drawK(util, tx){
  if (util === undefined) util = S.util;
  if (tx === undefined) tx = S.tx;
  return comp(util, tx) - replacementReserveK() - taxDistK(util, tx) - principalK();
}

// ---- the buy path, priced ---------------------------------------------------
// The most speculative part of the layer: §6 gives no purchase price, only "buy
// occupancy ≈ lease + $2K". So the price is banded and graded D, and what the
// loan implies is *reconciled* against §6's figure rather than fitted to it —
// occupancyK() stays on §6's stated basis, so comp() is unmoved on either path.
export function loanK(){ return LOAN.ltv * priceK(); }
export function pmtFactor(){        // annual debt service per $1 of loan
  var r = LOAN.ratePct/100/12, n = LOAN.termYrs*12;
  if (r === 0) return 12/n;
  return 12 * r / (1 - Math.pow(1 + r, -n));
}
export function debtServiceK(){ return loanK() * pmtFactor(); }
// Principal repaid in loan year `yr` — the amortization the flat BUY_EQUITY = 10
// stood in for, and the number that actually moves as the loan seasons.
export function loanPrincipalK(yr){
  var r = LOAN.ratePct/100/12, n = LOAN.termYrs*12;
  var pay = debtServiceK()/12, bal = loanK(), paid = 0;
  for (var m=1; m<=n; m++){
    var pr = pay - bal*r;
    bal -= pr;
    if (Math.ceil(m/12) === yr) paid += pr;
  }
  return paid;
}
export function principalK(){ return S.fin==='buy' ? loanPrincipalK(2) : 0; }
export function propertyTaxK(){ return PROP_TAX_RATE * priceK(); }
export function structReserveK(){ return STRUCT_RESERVE_PSF * sf() / 1000; }
// The two sides of the buy-occupancy reconciliation: what the loan and the
// building imply, against what §6 states.
export function builtBuyOccupancyK(){
  return debtServiceK() + propertyTaxK() + OWNER_INS_K + structReserveK();
}
export function statedBuyOccupancyK(){ return SITES[S.site].occ + 2; }
// The price per square foot at which the two would agree. Built occupancy is
// linear in the price, so this is solved rather than searched — and reporting it
// beside the band is what says whether §6's figure is reachable at all.
export function buyPricePsfForStated(){
  var ksf = sf()/1000;
  var slope = LOAN.ltv*ksf*pmtFactor() + PROP_TAX_RATE*ksf;
  return (statedBuyOccupancyK() - OWNER_INS_K - structReserveK()) / slope;
}

// ---- the cash gate, on both paths -------------------------------------------
// The old cashK() lived here. It meant "venture cash at risk on the lease path"
// and returned an input echo; requiredCapitalK() now derives that number and is
// the honest name for it, so keeping a second name for the same quantity only
// invites reading the old meaning into the new figure.
export function reserveK(){ // cash left to absorb operating losses after the capital spend
  return S.cash - (requiredCapitalK() - workingCapitalK());
}
export function bailComp(){ // deepest sustainable annual loss: reserve spread over the runway
  return -Math.max(0, reserveK())*12/S.runway;
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
