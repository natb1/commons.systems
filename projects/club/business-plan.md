# Business Plan — Albemarle Tea & Odd Prints
**Third Space: bookable rooms & a café-shaped front door · commons as budgeted philanthropy**
*Working draft — v0.3.4 (post-adversarial-review reframe + interview clarifications + free-hosting pilot re-sequencing, Aug 27–28 2026; §5/§6 figures moved onto the single-source model, Aug 29 2026)*

---

## 0. Why v0.3 exists

v0.2.1 went through an adversarial review (`strategy/adversarial-review.md`) the same day it was written, and the operator resolved every flagged tension by interview. v0.3 is the plan rebuilt around those decisions. The two biggest changes:

1. **The thesis is inverted.** v0.2.1 said "the higher-margin café subsidizes the lower-margin community services." The review showed the margins run the other way: **this is a rooms-and-building business with a café-shaped front door.** The café is the amenity and the draw; the rooms (and eventually the building) are the engine; the commons layer is explicit, budgeted philanthropy the business chooses to fund — not a business line.
2. **The pro forma is rebuilt honestly** — corrected operations costs, living-wage labor, working capital and Year-1 ramp funded, revenue lines that survived review only where they earned it. The honest result (v0.3.1, after the co-working demotion): **the conservative base case is negative — roughly <!--m:compLi-->−$15K<!--/m--> (LI) to <!--m:compSn-->−$38K<!--/m--> (SN/HT) owner comp** — which is why the G1/G2 gates carry hard, precommitted bars (§7, `plan/schedule.md`) and why the recreational-rooms hypothesis (§1a) is the load-bearing claim. The plan's job is no longer to look viable; it is to find out whether it is.

**v0.3.1 (same day, evening):** interview clarifications recovered — the motivating market hypothesis recorded as §1a (D14), co-working demoted to a utilization complement (D13), catering add-on rules set (D15), and the pro forma recomposed accordingly.

**v0.3.2 (same day, late):** D16 adopted — Phase 0.5 residence pilot (paid form).

**v0.3.4 (Aug 29):** **the plan's economics moved onto one model.** Every §5/§6 figure — and the benchmark matrix, the explorer artifact, and the figures the pilot and validation docs quote — is now generated from `model/model.mjs` by `node model/render.mjs`, so the documents and the interactive tool can no longer state different numbers. No assumption changed; three published figures did, as consequences of the model reproducing the plan's own lines (§6's reconciliation note has the arithmetic): SN/HT owner comp −$35K → −$37K (a slip in the published column), SN/HT revenue $301K → $300K, and cost of sale $104K → $101K. The marginals are now stated both gross and net of the card fees and marketing that ride on revenue.

**v0.3.3 (Aug 28):** **D16 revised to the free-hosting form, and the venture re-sequenced around it** (`pilot/phase-0.5-spec.md`): ≥6 months of free event hosting at the Little Italy residence — no money changing hands — before any significant capital commitment. The pilot builds coordination experience, format knowledge, and an anchor-group list; the price test moves to a **graduation ask** (deposits/agreements at §1a prices for the future site). **Capital gates (LOI/lease) now sit after the pilot verdict; target opening moves to ~2028** (`plan/schedule.md`). **Amendment A (Aug 28, later same day):** the pilot's operating goal raised to **near-full utilization** (~7 evenings/week at steady state) with two spaces finished for purpose — companion docs `pilot/space-finishing-plan.md` and `pilot/marketing-plan.md`; pilot floors and graduation bars unchanged. **Phase 0.75 interim commercial options recorded (NOT decided)** — `pilot/interim-phase-options.md` — a possible paid bridge between pilot and site, opened for decision at the pilot's month-4 checkpoint at the earliest. *(Same day: project docs reorganized into `plan/`, `pilot/`, `validation/`, `strategy/`, `reference/` folders.)*

### Decision log (operator interview, Aug 27 2026; D16 revised Aug 28)

| # | Tension (review ref) | Decision |
|---|---|---|
| D1 | Core thesis (C2, C5, F4) | **Full reframe**: rooms-led; café = amenity/front door; commons = budgeted philanthropy |
| D2 | Free/paid boundary (F5) | **Commons free *and limited***; it funnels to paid rooms — "want to break out a laptop? get a room." Day-pass line deleted; membership = room access |
| D3 | Service status (C3) | **Rooms provisional as a revenue service** — if not self-sustaining, they become the first-priority *budgeted commons service*. **Books are not a revenue line** — they create the vibe that brings café/room business |
| D4 | Beverage program (C4) | **Full coffee program + tea identity** — coffee does the volume work; tea is the brand and depth |
| D5 | Operator time (F3, F17) | **Full-time, ~40 hrs/wk**; no perpetual evenings-and-weekends assumption; other income does not consume working hours |
| D6 | Wages (F3) | **Living wage** (~$23/hr loaded); the "fair wages" claim becomes true; owner comp absorbs the cost |
| D7 | Albemarle house (F2, F9) | **Keep the house; fund from savings.** Venture-available cash: **under $150K** — a binding constraint (§6) |
| D8 | Financing posture (F8) | **Size the plan to the lease path** (with purchase option/ROFR); SBLP/buy is acceleration, exactly like grants |
| D9 | Operating day (F1, F3) | **Café day (~7 AM–6 PM) + hosted, bookings-only evenings** — single host/keyholder on event nights, no standing evening hours; **cold food service from the café as a catering add-on to rentals** |
| D10 | G1 gate metric | **Dual gate, equal weight**: room-demand bar AND café-count bar — failing either kills that market |
| D11 | Events base case (F6) | **5–6 events/mo** in base (+ recurring groups + catering add-on); 10/mo is the Strong case |
| D12 | G1 timing (F16) | ~~Keep ~Sep 21~~ **(superseded by D16-r re-sequencing — see `plan/schedule.md`)**; 20–25% seasonal haircut on all counts stands; winter validation now banked in-stride during the pilot window |
| D13 | Co-working (clarified) | **Demoted to a utilization complement.** Expected usage minimal; day rooms exist mostly to direct the laptop/digital-nomad crowd out of the commons (vibe management) and to soak spotty daytime capacity. Private offices are opportunistic upside, not base revenue |
| D14 | Market hypothesis (recorded) | **The motivating bet: unmet demand for affordable recreational private meeting space** — 2–5 hr private sessions in a comfortable café/bookstore vibe, for activities with little consumer component that benefit from privacy (see §1a for the full hypothesis and named competitive gap) |
| D15 | Catering add-on (clarified) | **Optional, pre-ordered, never a minimum**; BYO snacks stay allowed for recreational bookings (their affordability is the hypothesis). Licensed-premises scope to be confirmed (#22/#23) |
| D16 | Phase 0.5 pilot (adopted Aug 27 paid; **revised Aug 28 to free-hosting form**) | **≥6 months of free event hosting at the Little Italy residence — no money changing hands — before any significant capital commitment.** Goals: event-coordination experience, format knowledge, anchor-group list. Strictly free (no fees, no donations, no platform listings); founding-groups framing from day 1; **price test = the graduation ask** (deposits/signed agreements at §1a prices for the future site — free attendance never counts toward gates). Legal/insurance risk collapses with commerce removed; D7 firewall effectively intact; neighbor relations become an asset (#25). **Capital gates deferred past pilot verdict; opening ~2028.** **Amendment A (Aug 28, later): max-utilization goal (~7 evenings/wk steady state); two-space DIY finish-out (start ~$5–6K, $20K ceiling); marketing plan + operator-built website; floors/graduation bars unchanged.** Full spec: `pilot/phase-0.5-spec.md` (#5b) |

**What carries over from v0.2:** site-alternatives strategy (Little Italy vs Station North/Highlandtown/Bromo), by-right-first zoning posture, cold-service food licensing, phased alcohol/entertainment approvals, community-relations-first posture, benefit-LLC entity (§9), and the SBLP/incentive stack (§4).

---

## 1. Concept (reframed)

A neighborhood third space whose **engine is 3–5 bookable rooms and 2 private offices**, wrapped in a **coffee-led café with a tea identity** and a book-lined commons that makes the whole thing worth walking into.

- **The rooms (the business — evening-led, per D13/D14):** the engine is **recreational private meeting space, sold by the session** — recurring gaming/arts/book/writing clubs and private gatherings, evenings and weekends, **bookings-only**, hosted by a single keyholder, with **optional cold catering from the café** (D15). Daytime room usage is a *utilization complement*, not a business: spotty bookings, plus the standing answer for the laptop crowd ("want to break out a laptop? get a room") that keeps the commons a commons. Private offices are opportunistic upside if the floor plan allows, not base revenue. No standing evening hours; the building earns its nights or sleeps.
- **The café (the amenity and front door):** full espresso/drip program doing the volume work, tea as the signature and depth offering, cold-service food. ~7 AM–6 PM. It funds nothing by itself — it makes the rooms findable, humane, and worth renting.
- **The commons (the philanthropy):** a free, browsable, book-lined floor — *free and deliberately limited*. Sit, read, browse prints, talk. It is not a free workspace: **want to break out a laptop? get a room.** The commons funnels business to the paid rooms; its costs (the lending shelf, free programming) are a budgeted line the LLC chooses to fund, and the natural first program of the Phase 2 nonprofit arm (§9).
- **Books & prints:** not a revenue stream. The bookshop wall and lending shelf exist to create the room people want to be in; incidental sales are welcome and unmodeled beyond a small consignment line.
- **Still evaluated (Phase 2 go/no-go):** small-batch printing; healthy-food market (SBLP scoring priority, §4).

**Service status, honestly labeled (D3):** the room program is *provisional as a revenue service* — the G1/G2 demand tests decide whether it self-sustains. If it does not, rooms convert to the first-priority **budgeted commons service** and the commercial concept is re-evaluated at the §9 trigger (a café-and-offices business alone probably fails it; see §8, risk 1).

The aspiration is unchanged — a library-like civic room — but the causality is now stated correctly: **a solvent rooms business pays for a commons; a commons does not pay for itself.**

## 1a. The market hypothesis (D14) — stated so it can be falsified

**The bet:** despite game shops, game bars, Peerspace/Giggster, the library, and a co-working glut, there is **unmet demand for affordable recreational private meeting space** in Baltimore.

**The customer:** a small recurring group (3–10 people) that needs a **private room with a comfortable café/bookstore vibe for a 2–5 hour session**, doing something that has **little or no consumer component and benefits from privacy** — pen-and-paper RPGs, book/writing/cultural clubs, a movie brought from home. They meet weekly or monthly, they are price-sensitive (this is recreation, not business), and nothing currently built serves them:

| Incumbent | Why it fails this customer |
|---|---|
| Game shops (Canton Games, No Land Beyond) | Tight on space; must prioritize activities with a consumer component — card-game collectibles, board/war-game product. A no-purchase RPG table for 5 hours is their worst tenant |
| Game bars | Built for turnover and throughput; the bar vibe is wrong for private or cultural activities |
| Enoch Pratt / library rooms | Overbooked, and not available in the evening — exactly when recreational groups meet |
| Peerspace / Giggster | Rarely under $100/hr — outside a recreational group's budget — and the inventory is industry studios (music/film) or residential dining rooms with an uncomfortable vibe |
| Co-working venues | Daytime-configured, business-vibed, membership-gated; the glut is in desks, not in evening rooms |

**Why this reframes the plan's economics:** this customer books the exact hours the building would otherwise sleep (evenings/weekends), at near-100% contribution margin, in rooms the café makes pleasant. The gap in the market is *price + vibe + evening availability* — three things this concept produces as a byproduct of existing.

**Falsifiable claims to verify during Phase 0** (fold into #6/#5): that Pratt rooms are in fact overbooked and evening-unavailable at the candidate neighborhoods' branches; that Peerspace/Giggster's sub-$100/hr inventory is as thin and ill-fitting as believed; that Canton Games / No Land Beyond do turn away or under-serve this demand; and — the only proof that matters — that real groups **commit money** (G1 rooms bar: deposits or signed recurring-booking agreements; per D16-r, the Phase 0.5 **graduation-ask conversions** are the pilot's contribution to this evidence — free attendance never counts).

**Pricing implication:** session pricing must sit where recreation lives — roughly **$15–35/hr per room** ($60–150 per 2–5 hr session), recurring-club rates at the low end. The v0.2.1-era $350 private-event price point is a different, smaller segment (parties/showers/meetups), kept but haircut (D11).

---

## 2. Site requirements

| Requirement | Spec | Why |
|---|---|---|
| Size | **~2,200–3,200 sq ft usable** (down from 2,500–4,500) | Deleting the open co-working floor shrinks the program: café + 3–5 bookable rooms + 2 offices + commons/book wall. Smaller footprint is now a first-class occupancy lever under the <$150K cash constraint |
| Accessibility | Ground-floor/single-level public program, or elevator-served; accessible entrance & restroom | Buy/lease compliance, don't build it (the v0.1 lesson) |
| Configuration | Storefront presence; divisible interior; **separate or controllable after-hours access to the room zone** | Hosted bookings-only evenings need a lockable café |
| Zoning | C-1/C-2 or equivalent by-right for restaurant + office + gallery; confirm accessory-event posture | By-right-first |
| Prior use | Continuously permitted commercial, ideally former restaurant/retail | Carries use rights & infrastructure |
| Upper floor (optional) | Apartment above = ~$1,200–1,500/mo rental income | Only where it strengthens the deal; operator housing stays decoupled (D7) |

## 3. Location alternatives

*Unchanged from v0.2.1 in substance — Little Italy/Jonestown (preferred on café demand), Station North (incentive stack, arts fit), Highlandtown (Main Street + cheapest viable), Bromo (cheapest buildings, pioneering risk), Fells/Fed Hill/Canton screened out. See v0.2.1 §3 for the live-listing detail; the smaller footprint (§2) widens usable inventory in every market.* **The reframe changes the comparison, not the list:** evening-corridor viability and room demand now carry equal weight with café counts (D10), which cuts against Station North/Bromo's known evening weakness and partially offsets Little Italy's café advantage being its only advantage. **D16-r note:** specific live listings will turn over during the pilot window — accepted; the list above is a market map, not a building shortlist, and tours continue informationally.

## 4. Public funding & incentive stack

*Unchanged from v0.2.1 (SBLP/NBW, Business Boost, A&E credits, Enterprise Zone, façade grants, district programs, nonprofit adjacency) with two postural changes:*

1. **The plan is sized to the lease path (D8).** SBLP debt is treated exactly like grants: **acceleration, never assumption.** An SBLP award (or comparable ≤5% community-development debt) converts the lease path to the buy path via the purchase option; nothing in the base plan depends on it.
2. **Tax credits carry $0 in the base pro forma.** The A&E/EZ credits run on renovation-driven and incremental assessment, likely small in the early years; computed per-building figures appear only as a sensitivity line (review F11).

## 5. Revenue model (Base case, rebuilt)

Conservative pre-validation marks — the G1/G2 demand tests replace them with evidence. Day passes are deleted (D2); books carry no revenue (D3); events are haircut (D11); catering add-on is new (D9).

| Stream | Assumption (Base) | Little Italy | Station North / Highlandtown |
|---|---|---|---|
| Café (coffee-led + tea) | <!--m:avgTicket-->$8.25<!--/m--> avg ticket, 360 days | <!--m:cafeTxLi-->100<!--/m--> tx/day → **<!--m:cafeRevLi-->$297K<!--/m-->** | <!--m:cafeTxSn-->80<!--/m--> tx/day → **<!--m:cafeRevSn-->$238K<!--/m-->** |
| Rooms — evening/weekend recreational *(the hypothesis, provisional)* | ~5–6 recurring club sessions/wk at recreational rates + one-off sessions + 2–3 larger private events/mo ≈ <!--m:sessionRevK-->$39K<!--/m-->, + ~<!--m:cateringRevK-->$6K<!--/m--> optional catering attach (D15) | **<!--m:eveningRevK-->$45K<!--/m-->** | **<!--m:eveningRevK-->$45K<!--/m-->** |
| Rooms — day *(utilization complement, D13)* | spotty bookings + laptop-crowd day-room usage; offices opportunistic, unmodeled | **<!--m:dayRoomRevK-->$12K<!--/m-->** | **<!--m:dayRoomRevK-->$12K<!--/m-->** |
| Prints/art consignment | small, curated | **<!--m:printRevK-->$6K<!--/m-->** | **<!--m:printRevK-->$6K<!--/m-->** |
| Books | draw, not revenue | $0 | $0 |
| **Total** | | **~<!--m:revenueLi-->$360K<!--/m-->** | **~<!--m:revenueSn-->$300K<!--/m-->** |

*(v0.2.1 base was $429K/$370K; v0.3 was $394K/$335K. The v0.3.1 delta is the co-working demotion (D13): memberships and offices leave the base. The evening line is unchanged in size but recomposed around the recreational session market (§1a) — more club sessions at $60–150, fewer $350 party-scale events. This is the defensible floor, not the hope.)*

**Evening capacity & elasticity (why this stream carries the upside):** 3 bookable rooms × ~6 usable evenings + weekend afternoon slots ≈ **~<!--m:capacitySlots-->25<!--/m--> session-slots/week**. At an <!--m:avgSession-->$90<!--/m--> average session, full utilization is **~<!--m:capacityRevK-->$117K<!--/m-->/yr**; the <!--m:sessionRevK-->$39K<!--/m--> base is **~<!--m:baseUtil-->33%<!--/m--> utilization**. No other stream has that headroom at that margin — each additional filled weekly session contributes ~<!--m:sessionContribK-->$4.4K<!--/m-->/yr, **~<!--m:sessionMarginalK-->$4.1K<!--/m--> of it reaching owner comp** after the card fees and marketing that ride on revenue, versus ~<!--m:txMarginalK-->$1.86K<!--/m--> for an additional café transaction/day.

## 6. Pro forma (stabilized Year 2, rebuilt) — and the honest headline

Common cost base: café cost of sale <!--m:cafeCogsPct-->32%<!--/m--> (a <!--m:cafeMarginPct-->68%<!--/m--> contribution margin), catering 40%, consignment 60%; **labor at a living wage: <!--m:laborPlanK-->$120K<!--/m--> at the ~$23/hr this table assumed**, covering café day + hosted event nights, net of the owner's ~30 floor hours/wk (D5, D6) — priced bottom-up, the same <!--m:staffHrsPerYr-->5,217<!--/m-->-hour grid costs <!--m:laborRungK-->$121K<!--/m--> at a properly loaded MIT living wage (see the rungs below); **operations <!--m:opsSn-->$64K<!--/m-->–<!--m:opsLi-->$67K<!--/m-->**, which the model splits into a <!--m:fixedOpsK-->$47.0K<!--/m--> fixed base (utilities, insurance, software, R&M) and <!--m:varOpsPct-->5.5%<!--/m--> of gross revenue (card fees ~3% + marketing ~2.5%) — replaces v0.2.1's $38K, per review F1; **commons/books line <!--m:commonsK-->$6K<!--/m-->** (D1/D3 — the budgeted philanthropy).

The wage rungs the labor line can be priced at, and what each costs:

<!-- model:begin wage-rungs -->
*Generated from `model/model.mjs` — edit the model, then `node model/render.mjs`.*

| Rung | Take-home | Payroll | Benefits | Total comp | Labor |
| --- | --- | --- | --- | --- | --- |
| Market | $15.00 | $1.55 | — | $16.55 | ~$86K |
| Market+ | $16.50 | $1.71 | $0.85 | $19.06 | ~$99K |
| MIT living *(default)* | $21.03 | $2.18 | — | $23.21 | ~$121K |
| Living+ | $21.03 | $2.18 | $1.50 | $24.71 | ~$129K |

*Payroll is the employer load at 10.35% (FICA 7.65% + FUTA/MD unemployment and workers' comp 2.70%). Labor is that rate over the plan's own staffed grid — 5,217 hr/yr, §6's $120K line at the $23/hr it assumed.*
<!-- model:end wage-rungs -->

<!-- model:begin pro-forma -->
*Generated from `model/model.mjs` — edit the model, then `node model/render.mjs`.*

| | **Little Italy lease** (~2,500 sf @ $22 NNN) | **SN/HT lease** (~3,000 sf @ $16) | **SN/HT buy** (SBLP-terms acceleration case) |
|---|---|---|---|
| Revenue (§5 streams) | $360K | $300K | $300K |
| Cost of sale | $101K | $82K | $82K |
| Labor (living wage) | $120K | $120K | $120K |
| Operations | $67K | $64K | $64K |
| Commons/books | $6K | $6K | $6K |
| Occupancy | $78K | $64K | $66K (verify terms) |
| **Owner compensation** | **−$15K** | **−$38K** | **−$40K + ~$10K equity** |

Operations is one figure per site in the plan. This row does not use it: the line is built from named components — a $47.0K fixed base (utilities, insurance, software, repairs & misc, each carrying an evidence grade and a band) plus 5.5% of gross revenue for card fees and marketing. Built that way it comes to $66.8K at Little Italy against §6's stated $65K (+$1.8K, +2.7%) and $63.5K at SN/HT against $62K (+$1.5K, +2.4%) — close enough to say the two agree, far enough apart that a component drifting would show. `model/evidence.md` carries the grades, the bands, and what each one is worth if it is wrong. Cost of sale is rebuilt from the per-stream margins (café 68% contribution, catering 60%, consignment 40%) rather than carried as a lump.
<!-- model:end pro-forma -->

*Reconciliation with the figures this table carried through v0.3.3, all of them consequences of the model rather than new assumptions: **SN/HT revenue** reads <!--m:revenueSn-->$300K<!--/m--> against a printed $301K — its five streams summed, with the rounding gone. **Cost of sale** reads <!--m:cogsLi-->$101K<!--/m--> (LI) against a printed $104K, because it is now built per stream at each stream's own margin instead of quoted as a 33–40% band. **SN/HT owner comp** reads <!--m:compSn-->−$38K<!--/m--> against a printed −$35K: the printed figure was a slip — that column's own arithmetic (301 − 85 − 120 − 62 − 6 − 64) is −$36K, and the last ~$1K is the rounding above. Little Italy ties exactly.*

**The honest headline, sharpened by D13: at conservative marks, nothing clears the floor — the venture is carried or killed by the two gated engines outperforming those marks.** The gap to a <!--m:drawFloorK-->$30K<!--/m--> owner draw (§9's partial-income floor) is **~<!--m:gapLi-->$45K<!--/m--> in Little Italy** and **~<!--m:gapSn-->$68K<!--/m--> in SN/HT**. What closes it, in incremental owner-comp terms: each additional café tx/day ≈ **<!--m:txMarginalSignedK-->+$1.86K<!--/m-->/yr**; each additional filled weekly evening session ≈ **<!--m:sessionMarginalSignedK-->+$4.1K<!--/m-->/yr** on the room line, ~<!--m:sessionMarginalAllInK-->$4.4K<!--/m--> once the catering that attaches to it is counted. So plausible gate-clearing paths are *combinations* — e.g., Little Italy at ~<!--m:gateTx-->110<!--/m--> tx/day (<!--m:gateTxGainK-->+$19K<!--/m-->) plus ~<!--m:gateUtil-->55%<!--/m--> evening utilization (<!--m:gateUtilGainK-->+$23K<!--/m-->); no single stream plausibly does it alone (café alone needs ~<!--m:cafeAloneTx-->124<!--/m--> tx/day — top-decile; evening alone needs ~<!--m:roomsAloneUtil-->76%<!--/m--> utilization — near-full). **SN/HT clears only if the arts-district evening culture delivers utilization near capacity AND the café beats its 80 tx/day mark** — the mission-fit markets now carry an explicitly heavier burden of proof.

### Sensitivity

<!-- model:begin sensitivity -->
*Generated from `model/model.mjs` — edit the model, then `node model/render.mjs`.*

| Scenario | LI revenue | LI owner comp |
|---|---|---|
| Lean (70 walk-ins/day, evening at half) | ~$249K | ~−$89K |
| Base (the marks above) | ~$360K | ~−$15K |
| Gate-clearing (110 walk-ins/day, 55% evening utilization) | ~$418K | ~$28K |
| Strong (120 walk-ins/day, 75% utilization, catering attach growing) | ~$481K | ~$72K |
<!-- model:end sensitivity -->

The Lean row is **not survivable** — it triggers the stop rule, and it sits far below the bail line the funded venture can absorb (<!--m:bailLineK-->−$32K<!--/m-->/yr at <!--m:ventureCashK-->$150K<!--/m--> of venture cash over a <!--m:runwayMonths-->24<!--/m-->-month runway). The base case, by contrast, is a slow bleed the reserve can carry past an honest verdict.

### The catering add-on, evaluated (D15)

**What it solves:** a 2–5 hour session needs food — the add-on answers that in-house at ~60% margin on cold prep the café already does; it monetizes idle daytime prep capacity and the host's otherwise-underused evening hours; it differentiates against every incumbent in §1a (game bars sell you *their* vibe, Peerspace sells you an empty room); and pre-ordering (48h lead, made against a booking) kills the spoilage risk.

**What it creates:** (a) a **licensing-boundary question** — cold catering from the café into the room zone must be confirmed within the cold-service license and the licensed-premises geometry (#22/#23) before it's sold; (b) a **pricing-culture risk** — the §1a customer is price-sensitive by definition, so any catering *minimum* or outside-food ban would break the very affordability the hypothesis rests on. Hence D15: **optional, pre-ordered, never a minimum; BYO snacks always allowed for recreational bookings.** Expect low attach from clubs (~10–20%) and higher attach from private events and daytime business bookings.

**Verdict:** modest but real — **~<!--m:cateringRevK-->$6K<!--/m--> base revenue, ~<!--m:cateringMarginK-->$3.7K<!--/m--> margin** at ~<!--m:cateringOrdersPerWk-->1.7<!--/m--> pre-orders/week, low risk under the D15 rules, with upside tracking event mix rather than club mix. It earns its place as an attach line, not a stream.

### Why the dual gate weighs both engines — and why the rooms bar is the existential one

Both engines gate G1 at equal weight (D10), because neither alone closes the gap above. But the *stakes* of each bar differ, and the plan should be read that way:

- **The café bar is a market test.** Café economics are well-understood; comparable counters exist in every candidate market; counts validate the assumption cheaply. If the café bar fails, the conclusion is *this block is wrong* (or the co-anchor is wrong-sized) — a site problem.
- **The rooms bar is a concept test.** The recreational-space hypothesis (§1a) is the novel claim nobody has validated, and it is also the stream with the only real upside headroom (~<!--m:capacityRevK-->$117K<!--/m--> capacity at a ~<!--m:roomMarginPct-->94%<!--/m--> contribution margin, vs ~<!--m:txMarginalK-->$1.86K<!--/m--> per café tx/day). If the rooms bar fails everywhere, no site fixes it — the §9 trigger's second arm fires, because a café-plus-offices remainder was adversarially reviewed and does not stand alone.
- **They are not interchangeable, and they are mutually dependent.** The café cannot rescue failed rooms (it would need top-decile traffic on thin margins), and the rooms cannot exist without the café — it is the vibe, the front door, and the reason a $75 session feels underpriced. The gate is dual because the business is a compound: *rooms carry the margin, the café carries the meaning.*

### Cash (D7 — the binding constraint)

Venture-available cash is **under <!--m:ventureCashK-->$150K<!--/m-->**, grant-free, covering **everything**: fit-out, deposits, FF&E, working capital, and Year-1 ramp. Consequences, stated plainly:

- **Lease path only** from own cash. Build-out budget hard cap **~<!--m:buildCapK-->$85K<!--/m-->** (phased fit-out, used FF&E, landlord TI negotiated hard — #17); working capital + Year-1 ramp reserve **~<!--m:wcBandK-->$50–65K<!--/m-->** is non-negotiable and comes first.
- The **buy path requires SBLP + grants/TI to exist at all** (10% contribution + closing + FF&E exceeds available cash alone). That is consistent with D8: buy is the acceleration case.
- Grants (Business Boost, façade, Operation Storefront) buy back fit-out scope or reserve depth — never counted on in advance.
- A **failure-cost paragraph** (guarantee exposure, what is pledged, what is not — the house is not) goes in every financing file. The Albemarle house stays out of the venture's balance sheet entirely.
- **D16-r addition: none of this cash is at stake until the pilot verdict** — pre-verdict spending is capped at diligence scale (counts, consults) plus the residence finish-out per Amendment A (start ~$5–6K within a $20K ceiling — home-improvement + validation spend on the house side of the D7 firewall; furnishings buy-for-migration; spec: `pilot/space-finishing-plan.md`).

## 7. Phasing

**Phase 0 — Diligence & money (now → pilot verdict, mid-2027).** Per `plan/schedule.md` (Revision 6). All zero/low-capital work proceeds on the original rhythm: counts (with seasonal haircuts, D12 — winter validation now banked in-stride), tours (informational), entity execution (benefit LLC), DHCD/SBLP consultation, architect and attorney relationships, T1/T2 validation cycles. The G1 **dual gate (D10)** structure is unchanged — **its timing moves to the pilot's graduation (~mid-2027)**, with an interim market-shortlist memo in Q4 2026. **No LOI, lease, or significant capital before the pilot verdict.**

**Phase 0.5 — Free hosting pilot (D16-r + Amendment A, ~Sep 2026 → ~May 2027).** Finish the two pilot spaces (1st-floor receiving + 3rd-floor club space; DIY, start ~$5–6K under a $20K ceiling — `pilot/space-finishing-plan.md`), then host free recurring-group events at the Little Italy residence for **at least 6 months**: ramping from 2/week toward **a session most evenings (~7/week at steady state — the max-utilization goal)**, ≤8–10 people, strictly no money changing hands, founding-groups framing from day 1. Demand side per `pilot/marketing-plan.md`: hosted clubs + operator-run house programs, precommitted outreach volume, operator-built website. Goals: event-coordination experience, format knowledge (what events work and what each needs from a room), residential-scale space-design practice, and a retained-group list that de-risks opening. **The graduation ask (~May 2027) is the price test:** retained groups are offered standing slots at the future site at §1a prices, evidenced by the deposits/signed agreements the G1 rooms bar requires. Free attendance never counts toward gates. Full spec: `pilot/phase-0.5-spec.md`.

**Phase 0.75 — Interim commercial options (recorded, NOT decided).** A possible paid, commercial-scale bridge between pilot and site — partner-venue hosting residency, licensed evenings in an existing café, graduated real-estate entry, prepaid founding memberships — catalogued in `pilot/interim-phase-options.md`. The decision opens at the pilot's month-4 checkpoint at the earliest, only if retention and fill warrant it; the residence stays strictly free regardless, and any change to the G1 rooms-bar instrument is made in writing at adoption.

**Phase 1 — By-right opening (lease; target ~2028).** Café day (~7 AM–6 PM, cold-service) + bookable rooms/offices + hosted bookings-only evenings with cold catering add-on + book-lined commons (free and limited) + consignment prints. No standing evening hours — the calendar earns them (D9). Health-department scope now explicitly includes **catering from the café into the room zone** (#23). Opening converts the pilot list: founding members + pilot-retained recurring groups signed before doors open.

**Phase 2 — Program deepening.** A&E certification if in district; ticketed programming; **rooms go/no-go as a revenue service (D3)** — self-sustaining → grow; not → convert to budgeted commons service and re-run the §9 trigger. Nonprofit programming arm decision (lending collection first). Evaluated services (printing, food market) go/no-go on Phase 1 data.

**Phase 3 — Beer/wine (optional).** Unchanged; BYO/caterer models tested first.

## 8. Principal risks (rebuilt)

1. **The base case is negative by design (v0.3.1).** ~<!--m:compLi-->−$15K<!--/m--> LI / <!--m:compSn-->−$38K<!--/m--> SN/HT owner comp at conservative marks — the venture proceeds only on gate evidence that closes the ~<!--m:gapLi-->$45K<!--/m-->/~<!--m:gapSn-->$68K<!--/m--> gap (§6). The Lean stop rule (counts <<!--m:leanStop-->70<!--/m--> tx/day post-haircut in both markets, or rooms bar failed in both) halts before any LOI. If the recreational-rooms hypothesis (§1a) fails everywhere, no site fixes it: the §9 trigger's second arm fires — that is the trigger working, not a surprise.
2. **Café traffic assumptions** still carry the inter-market gap. Counts with 20–25% seasonal haircut; winter validation now banked during the pilot window (D12/D16-r).
3. **Financing**: plan sized to lease; SBLP is acceleration only (D8). No purchase closes without executed community-development terms in hand.
4. **Cash constraint**: <$150K covers everything. Overruns come out of fit-out scope, never out of the working-capital reserve. If lease-path all-in costs can't fit ~$150K after TI negotiation, that is a G2 stop, not a stretch. None of it is at stake before the pilot verdict (D16-r).
5. **Transitional-corridor evening risk** (SN/Bromo): now weighs directly on the room-demand half of the dual gate — repeated night visits during the pilot window, per schedule.
6. **Assembly occupancy / sprinkler risk** (review F12): recurring evening gatherings can flip rooms to A-2/A-3; architect walkthrough must include occupancy-classification read and sprinkler status per candidate; the hosted-evening model (D9) — never unstaffed — is also the insurance posture (#20). Walk-away threshold: compliance work quoted above **~$120K** on both leads → widen the search.
7. **Owner capacity**: 40 hrs/wk, honestly gridded (~30 floor + ~10 admin/sales); a named-keyholder plan covers absence. The staffing grid, not an FTE count, is the planning unit. The pilot doubles as a founder-fit test: an operator who hates hosting by month 4 is a finding (pilot spec §8) — and Amendment A's every-evening cadence plus the build hours raise the load this test carries.
8. **Owner burnout**: predefined revenue threshold and review date within 30 days of opening, unchanged. During the pilot, the spec §8 burnout stop-rule governs.
9. **Phase 0.5 pilot risks — collapsed by the free-hosting form (D16-r).** No commercial use → no home-occupation/zoning question, no business-activity insurance exclusion, no D7 breach; residual = ordinary social-host liability (confirm homeowner coverage; consider umbrella — one call, #5b) and neighbor relations (caps + stop rules, pilot spec §8 — load-bearing at every-evening cadence). The paid-form legal analysis is preserved in the spec for the record.
10. **Cost of the 6-month rule (D16-r, accepted Aug 28):** opening slips to ~2028; candidate buildings will turn over during the window (accepted — the smaller footprint widens inventory; no building is chased pre-verdict); operator momentum must survive a long runway — the pilot's own cadence and the standing weekly rhythm are the mitigation. Amendment A adds finish-out cash ahead of validation (accepted — fixed finishes stay with the house; furnishings migrate). Offsetting gains: winter evidence on both engines before any signature; SBLP cadence pressure relaxed; multiple seasons of validation data.

## 9. Entity structure & governance path

*Unchanged: Maryland benefit LLC now (decided Aug 27); Phase 2 hybrid — LLC owns building/engine, companion 501(c)(3) or fiscal sponsor carries the free layer (lending collection first). See `strategy/entity-structure.md`.* Two updates from the reframe:

- The **trigger test gains a second arm (D3):** (a) as before — if the base case can't cover debt service + ~<!--m:drawFloorK-->$30K<!--/m--> owner comp without permanent grant/donation revenue, restructure nonprofit-first; (b) **if the room program fails as a revenue service at G1/G2**, the commercial remainder (café + offices) must be re-tested against arm (a) before proceeding — a café-led version of this venture was reviewed and does not stand on its own.
- The **commons/books budget line** (§6) is the natural first transfer to the Phase 2 nonprofit arm — it is already accounted as philanthropy. **D16-r note:** if the free pilot proves easy to fill but the graduation ask fails broadly, that pattern — real community value, no willingness to pay — is direct §9-trigger evidence pointing nonprofit-first; the pilot is designed to surface exactly this honestly (pilot spec §8).

---

*Sources: carried from v0.2.1 (MD DHCD SBLP; COMAR 05.13; BDC; Live Baltimore; Southeast CDC; Downtown Partnership; CBP; BGE; CommercialCafe/LoopNet; CoworkingCafe; Peerspace/Giggster; MD People's Law Library) plus `strategy/adversarial-review.md` (Aug 27, 2026) and its external benchmarks (independent-café net margins 2.5–7%; coworking churn/profitability benchmarks; CBRE/Bisnow Baltimore office vacancy), and the D16 legal findings (Baltimore City Code §48-1, §48-7, §15-507; Peerspace host-insurance/fee terms — links in `pilot/phase-0.5-spec.md`). Figures are planning-grade — verify per parcel before contract.*
