# Benchmark performance matrix — club roster × café traffic
**What the two gated engines must jointly deliver, expressed in the units the operator actually manages: concurrent active clubs on the calendar, and café transactions per day.**
*Every number below is generated from `model/model.mjs` — the same model the [benchmark explorer](benchmark-explorer.md) runs. Re-derive with `node model/render.mjs`; never edit a figure here by hand. Recorded Aug 28, 2026; regenerated against the single-source model Aug 29, 2026. Companion to `../pilot/phase-0.5-spec.md`, `../pilot/interim-phase-options.md`.*

---

## 1. Conversion assumptions (stated so they can be challenged)

<!-- model:begin matrix-assumptions -->
*Generated from `model/model.mjs` — edit the model, then `node model/render.mjs`.*

- **Capacity:** 3 bookable rooms × ~6 usable evenings + weekend-afternoon slots ≈ **25 session-slots/week**. Full utilization ≈ $117K/yr at a $90 average session.
- **Marginal values:** each filled weekly session ≈ **+$4.2K/yr owner comp** on the room line, **$4.5K** once the catering that attaches to it is counted; each café walk-in/day ≈ **+$1.87K/yr**. All are net of the 5.1% of gross revenue that card fees and marketing take; the plan's §5 quotes the session gross of that, at $4.4K.
- **One-off private events** (parties/showers, D11 base 5.5/mo) contribute ~1.3 weekly-equivalent sessions at every tier; the club roster figures below are net of them.
- **Club cadence mapping:** a weekly club = 1 session/wk; biweekly = 0.5; monthly ≈ 0.23. "Mixed roster" assumes ½ weekly · ¼ biweekly · ¼ monthly (≈0.68 sessions/club/wk) — the realistic shape the pilot's "monthly or better" retention floor predicts. At the base row that is ~7 weekly-committed clubs or ~10 mixed-cadence ones.
- **Program-for vs maintain:** the roster numbers are *active clubs to maintain*. Programming must run above them — clubs churn (rate unknown; a pilot deliverable), so the recruiting pipeline needs to be perhaps 1.4× the maintained roster. Validate the churn rate during Phase 0.5.
- **Cost basis:** each site is priced on its own §6 lines — occupancy $78K (LI) vs $64K (SN/HT), operations $65K vs $62K — and its own café mark (100 vs 80 walk-ins/day). The two sites therefore get two matrices below rather than one matrix and a per-cell offset: the cheaper SN/HT floor is worth +$14K at equal traffic, and its weaker café mark costs it the rest.
<!-- model:end matrix-assumptions -->

## 2. Rooms benchmarks as club rosters

<!-- model:begin roster-table -->
*Generated from `model/model.mjs` — edit the model, then `node model/render.mjs`.*

| Evening utilization (3 rooms) | Weekly-eq sessions | All-weekly roster | Mixed-cadence roster | Slower-cadence roster | What a week looks like |
|---|---|---|---|---|---|
| **33%** (base) | ~8.3 | **~7** | **~10** | **~14** | Each room booked 2–3 nights |
| **45%** (break-even) | ~11.3 | **~10** | **~15** | **~20** | Each room 3–4 nights; weekends full + ~1 midweek club night per room |
| **55%** (gate case) | ~13.8 | **~12** | **~18** | **~25** | Each room 4–5 nights; midweek is where this tier is won |
| **75%** (ceiling) | ~18.8 | **~17** | **~26** | **~36** | Each room ~6 of 7 nights — near-sellout of prime time |

*(All rows assume the 5.5 one-off events/month continue on top of the club roster; the club counts are net of them.)*
<!-- model:end roster-table -->

## 3. The matrix — owner comp ($K/yr)

Rows: rooms performance (utilization / club roster). Columns: café performance (walk-ins/day, relative to each site's own mark).

<!-- model:begin matrix-tables -->
*Generated from `model/model.mjs` — edit the model, then `node model/render.mjs`.*

**Little Italy** — occupancy $78K, operations $65K, café mark 100 walk-ins/day.

| Rooms ↓ / Café → | **70 tx/day** | **80 tx/day** | **90 tx/day** | **100 tx/day** (site mark) | **110 tx/day** | **120 tx/day** (≈ top decile) | **130 tx/day** |
|---|---|---|---|---|---|---|---|
| **33% · ~10 clubs** (base) | −$69K | −$51K | −$32K | −$13K | $5K | $24K | $43K |
| **45% · ~15 clubs** (break-even) | −$56K | −$37K | −$19K | $0K | $19K | $37K | $56K |
| **55% · ~18 clubs** (gate case) | −$45K | −$26K | −$8K | $11K | $30K | $49K | $67K |
| **75% · ~26 clubs** (ceiling) | −$23K | −$4K | $15K | $33K | $52K | $71K | $90K |

**Station North / Highlandtown** — occupancy $64K, operations $62K, café mark 80 walk-ins/day.

| Rooms ↓ / Café → | **56 tx/day** | **64 tx/day** | **72 tx/day** | **80 tx/day** (site mark) | **88 tx/day** | **96 tx/day** (≈ top decile) | **104 tx/day** |
|---|---|---|---|---|---|---|---|
| **33% · ~10 clubs** (base) | −$82K | −$67K | −$52K | −$37K | −$22K | −$7K | $8K |
| **45% · ~15 clubs** (break-even) | −$68K | −$53K | −$38K | −$23K | −$8K | $7K | $21K |
| **55% · ~18 clubs** (gate case) | −$57K | −$42K | −$27K | −$12K | $3K | $18K | $33K |
| **75% · ~26 clubs** (ceiling) | −$35K | −$20K | −$5K | $10K | $25K | $40K | $55K |

*Rows are evening utilization with the mixed-cadence club roster it implies; columns are walk-ins/day at 70–130% of the site's own mark. Cells are owner comp with labor held at §6's $120K line.*
<!-- model:end matrix-tables -->

**Contours to read off:**

<!-- model:begin contours -->
*Generated from `model/model.mjs` — edit the model, then `node model/render.mjs`.*

- **The $0 line (not losing money, no draw):** Little Italy (33%, ~107 tx) → (45%, ~100 tx) → (55%, ~94 tx) → (75%, ~82 tx); SN/HT (33%, ~100 tx) → (45%, ~93 tx) → (55%, ~87 tx) → (75%, ~75 tx). Every cell above/left of it is a business burning cash.
- **The $30K line (the plan's §9 partial-income floor):** Little Italy (33%, ~123 tx) → (45%, ~116 tx) → (55%, ~110 tx) → (75%, ~98 tx); SN/HT (33%, ~116 tx) → (45%, ~109 tx) → (55%, ~103 tx) → (75%, ~91 tx). No single-engine cell clears it: café-alone needs ~123 walk-ins/day (top-decile), rooms-alone ~74% utilization.
- **The owner's bar (a living wage at zero opportunity cost, $71.1K at $240K of capital at risk):** off the grid at both sites — the explorer's derived-gates strip shows how far. That gap, not the $30K line, is what the venture has to close to be worth the owner's labor and capital.
- **Evidence limits (mark before believing any cell):** columns right of 110 walk-ins/day at Little Italy are top-decile café territory; rows below 55% utilization are unsupported by any current evidence at the $15–35/hr band (the D&J analog hits ~100% peak at $5–10/hr — a ceiling test, not a forecast). The credible planning region is the middle of the matrix, which is exactly why the dual gate demands proof on both axes before a lease.
<!-- model:end contours -->

### Why there are two matrices and no "subtract $22K" shortcut

An earlier revision of this doc carried one Little Italy matrix plus the instruction *"SN/HT lease: subtract ~$22K from every cell."* That bundles two separate site differences into one number: SN/HT's cheaper floor (worth <!--m:snFloorAdvantageK-->+$14K<!--/m--> at equal traffic) and its weaker expected café column (20 fewer walk-ins/day). The −$22K is the *net* of the two, valid only when each site is read at its own expected column — applied literally to a matrix whose columns are absolute walk-ins/day it double-counts the traffic difference. Each site now gets its own matrix on its own cost basis, so the two effects can no longer be conflated. SN/HT's real story is *cheaper floor, weaker expected café column*, which is why it still only works toward the bottom-right.

## 4. How the pilot and interim options map onto this

- **Phase 0.5 at full tilt** (7 hosted slots/wk, one room) with a 50% graduation conversion seeds **~3–4 weekly-committed clubs** — roughly half the base row's <!--m:baseRosterWeekly-->7<!--/m-->-club roster, a third of the break-even row's <!--m:breakEvenRosterWeekly-->10<!--/m-->. The pilot's pipeline aspiration (10–14 hosted groups) is the right order of magnitude for the *base* row only if conversion runs high and cadences hold weekly.
- **The gap the site must close on its own:** from ~3–4 seeded clubs to the <!--m:breakEvenRosterWeekly-->10<!--/m-->–<!--m:gateRosterWeekly-->12<!--/m--> weekly-committed clubs the break-even and gate rows need — via the walk-in funnel, new group formation, house programs graduating into clubs, and (if adopted) an interim phase growing the roster before signature (`../pilot/interim-phase-options.md`).
- **T2 census context:** 34 known groups, 13 with documented venue pain. The break-even roster (~<!--m:breakEvenRosterWeekly-->10<!--/m--> weekly, ~<!--m:breakEvenRosterMixed-->15<!--/m--> mixed) means signing a third to half of the currently known census — the quantitative case that the model depends on demand *formation*, not just capture.
- **Midweek is the whole game above <!--m:breakEvenUtil-->45%<!--/m-->:** analog data shows weekends fill first and sell out; every step down the matrix's rows is won on Tue–Thu club nights. Recurring clubs are the only instrument that books midweek reliably — which is what this matrix is for: the club roster, not raw utilization, is the operational target to program against.
