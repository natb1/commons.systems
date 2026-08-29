# Validation data — §1a public-data mining (append-only)
*Results log for `validation/runbook.md`. Each run appends a dated section; never edit or delete prior sections. Distinguish observation from inference; record negative/null results with equal care.*

---

## Run 2026-08-27 (T1, T2, T3, T4, T5, T6 — initial run, all tasks)

### T1 — Analog utilization sampling: Dungeons & Javas

- **Method actually used:** two-stage. (1) WebFetch of dungeonsandjavas.com (home, /pages/custom-scheduling-page, /pages/faq, /pages/calendar, /products.json, sitemaps, agents.md) — **the booking widget does not render via plain fetch** (client-side JS; no iframe/feed URL; rooms not Shopify products; direct curl blocked by sandbox proxy). (2) **Claude-in-Chrome browser session on the operator's machine — SUCCEEDED**: the widget is a react-calendar ("Schedule Appointment") on /pages/custom-scheduling-page behind the "Book Your Private Room Rental" anchor; sampled all 5 room calendars × 4 dates plus far-out baseline dates. Secondary analog (Mox) also fetched.
- **Timezone note:** the widget displays slots in the viewer's timezone (America/New_York shown); the shop is Mountain time (ET−2). All times below are **ET as displayed**. Shop hours: M–Th 9–22, F–Sa 9–24, Su 9–18 MT.
- **Baseline full grids (far-out dates, The Workshop, observed):** Fri Oct 2: 12:00–01:30 ET = **27 slots**. Sun Oct 4: 12:00–20:00 ET = **16 slots**. Tue (inferred from an ambiguous October reading + hours): 12:00–24:00 ET ≈ **24 slots** — labeled inference. **Sat baseline could not be established: even Sat Oct 3 (5 weeks out) showed only 4 open slots (22:30–01:00)** — Saturdays appear either structurally blocked by the operator or booked extraordinarily far ahead; indistinguishable from outside.
- **Raw observations (open slots per room, ET; everything not listed within the day's grid is booked-or-blocked):**
  - **Fri Aug 28 (1 day ahead; grid 27):** Dungeon open 12:00–20:00 (16); Galley 12:00–19:30 (15); Crypt 12:00–20:00 (16); Wizards Tower 12:00–20:00 (16); Workshop 16:30–19:30 only (6). → booked-or-blocked: 41%/44%/41%/41%/78% by room; **evening slots (≥20:00 ET = 6 PM MT): 100% gone in all 5 rooms.**
  - **Sat Aug 29 (2 days ahead; grid unknown, ≥27 if like Fri):** Dungeon open 3 late-night fragments (23:00–23:30, 00:00–01:00); Galley 2 (00:00–01:00); Crypt 2 (00:00–01:00); Wizards 10 (20:00–01:00); Workshop 4 (22:30–23:30, 00:00–01:00). **Nearly everything before 8–10 PM ET gone in all rooms** — but see Sat-baseline caveat: cannot attribute to demand vs operator blocking.
  - **Sun Aug 30 (3 days ahead; grid 16):** Dungeon open 18:00–20:00 (4/16 → 75% gone); Galley 16:00–20:00 (8 → 50%); Crypt 16:00–20:00 (8 → 50%); Wizards all 16 open (0%); Workshop 12:00–13:00 only (2 → 88%). Pattern: Sunday early/midday is what fills; the day averages ~53% gone across rooms.
  - **Tue Sep 1 (5 days ahead; grid ≈24, inferred):** Dungeon open 12:00–18:30 (13 → ~46% gone); Galley 12:00–14:00 only (4 → ~83%); Crypt 12:00–20:00 (16 → ~33%); Wizards 12:00–19:30 (15 → ~38%); Workshop 12:00–20:30 (17 → ~29%). **Late-evening slots (≥20:30 ET) gone in every room; a weekday 5 days out already averages ~46% gone.**
  - Static facts: room prices — Dungeon (VIP) $10/hr or $30/4hr; Workshop $5/hr or $15/4hr; Crypt $10/session; Galley $10/session; Wizard Tower $5/session. 30-min increments, bookable 1 year out, 24-hr cancellation; "$5 off room fee per $25 spent" F&B attach. Site banner: "Due to software issues, our online inventory is temporarily suspended" (appears to concern shop products, not bookings — bookings calendar was live).
  - **Secondary analog (Mox Seattle, WebFetch):** Red Room (seats 10) and Green Room (seats 8) **"$30/hour at peak times (Mon–Fri 5pm–close; all day Sat/Sun)"**; combined 18-seat room $60/hr peak. Availability calendar JS-walled ("Book Now" placeholders).
- **Read: supports §1a — strongly, with caveats.** Observation: at $5–10/hr in a comparable metro, **prime-time slots (evenings, and all of Saturday) are essentially sold out 1–5 days ahead in every room, while middays sit largely open.** Inference (labeled): peak utilization at the analog runs near 100%, versus the plan's <!--m:baseUtil-->33%<!--/m--> base / <!--m:gateUtil-->55%<!--/m--> gate-case evening-utilization marks — while also confirming the precedent memo's §3.4 concern that demand piles into peak windows and midweek daytime is soft. Caveats: single snapshot; booked vs operator-blocked indistinguishable (Saturday especially suspect); short-lead sampling (1–5 days) — repetition and longer-lead samples are what the recurring runs are for; and this is demand at $5–10/hr — a ceiling test for $15–35/hr pricing, per the runbook.
- **Gaps:** Sat full-grid baseline unobtainable; booked-vs-blocked unresolvable from public data (operator could ask the shop directly); Google-review corpus unreachable; Mox availability unobservable. Chrome extension is now connected on the operator's Mac — future runs need the Mac awake with Chrome running.
- **Method notes for repeat runs (browser):** open https://www.dungeonsandjavas.com/pages/custom-scheduling-page, click "Book Your Private Room Rental" anchor; room dropdown lists 5 calendars (Dungeon VIP, Galley, Crypt, Wizards Tower, Workshop); react-calendar month nav arrows need real coordinate clicks (programmatic .click() fails on the arrows; day buttons and dropdown options accept clicks; slot times extractable from leaf-node text matching /\d\d?:\d\d - \d\d?:\d\d/). Record day-of-week + days-in-advance per sample; compare against the baseline grids above.

### T2 — Baltimore recurring-group demand census

- **Method actually used:** Meetup search/topic pages are robots-blocked, so discovery ran web-search → individual public Meetup group pages (fetchable), plus marylandwriters.org, bsfs.org, Pratt event calendar, baltimorewriters.com.
- **Raw observations — 34 active groups/recurring programs found:** board games **6**, TTRPG/D&D **6**, book clubs **8**, writing groups **14**. Highlights (name — members — frequency — venue):
  - Boardgames Baltimore! — 2,974 — Sun & Tue 7 PM — Saunter Corner Bar/Meander Art Bar (bar). "Space is limited and confirmed RSVPs are mandatory"; 3 no-shows = banned.
  - Commonplace Book Club — 4,074 — multiple/mo — Red Emma's, breweries.
  - Games Club of Maryland — 1,419 — weekly (Laurel Thu 6–9 PM) — community center; runs EuroQuest con.
  - Glen Burnie Board/Card Game — 1,382 — weekly Sat — **"in the very back of Panera"**; RSVPs stressed to keep good standing with the venue; can't use outside space in winter.
  - Pathfinder & Starfinder Society of Baltimore — 1,057 — multiple sessions/wk — rotating game stores; Games & Stuff **requires $10 bracelet or equivalent purchase**.
  - Baltimore Silent Book Club — 1,032 — ~weekly 6:30 PM — Old Major (bar); organizers warn **"this will not be a silent environment"** (a silent-reading club advising earplugs).
  - Shut Up & Write! Baltimore — 1,120 — weekly — recently all-online (was in-person).
  - Agile Storytellers — 753 — 2×/wk — R. House food hall. Books and Brews — 708 — monthly — rotating breweries, **runs a standing public form for venue suggestions**. True Crime Book Club — 860 — monthly — rotating restaurants. MWA Downtown — 495 — monthly — back room of Little Havana bar. Creatures of Victory — 656 — biweekly Tue — **Whole Foods seating area**.
  - Multiple MWA critique groups meet in members' homes and are **"Closed to new members" / "Full with waitlist"** — home-based groups cap at living-room size.
  - Forming: "Baltimore D and D 5e" Meetup explicitly seeking an in-person setup, no venue.
- **Venue-type tally (the point of the census):** bars/breweries/restaurants ~10 groups (incl. the 3 largest board-game/book clubs); homes ~4; makeshift retail (Panera, Whole Foods, food hall) ~3; game shops ~3; library 1; own clubhouse (BSFS) 1; online ~5; unknown/mixed rest.
- **Read: supports §1a.** The pipeline is real, large (several groups with 1,000–4,000 members), and overwhelmingly meets in borrowed space with documented capacity rationing, noise problems, purchase minimums, and host-tolerance dependence. At least 13 named groups are direct prospects.
- **Gaps:** Meetup search pages robots-blocked (small/poor-SEO groups undercounted); one large group's details member-gated; **Discord and Facebook confirmed login-walled — operator task, placeholder table below.** Member counts are lifetime joins, not active attendance.

| Operator census (fill by hand) | Platform | Groups found | Active est. | Venues | Notes |
|---|---|---|---|---|---|
| Baltimore Discord servers (city, TTRPG, board game) | Discord | | | | |
| Facebook groups (neighborhood book clubs etc.) | Facebook | | | | |
| r/baltimore search ("D&D", "board game", "book club meet") | Reddit | | | | |

### T3 — Unmet-demand text search

- **Method actually used:** WebSearch + thread fetches. **reddit.com is entirely unreachable from this environment** (proxy 403 + search index exclusion) — the single largest gap; D&D Beyond's LFG forum proved the fetchable substitute. BGG/EN World thread bodies unfetchable (titles only).
- **Raw observations — headline: 5 distinct verified "looking for in-person play in/near Baltimore" posts 2023–2026** (all D&D Beyond LFG; 3 in 2023, 2 in 2024), plus a venue-explicit 2022 post, plus 4+ older threads (2005–2017) showing the ask recurs for a decade:
  - "Maryland Players?" (Apr 2023) — Baltimore locals trying to find each other; replies from Essex/White Marsh/Towson; **no venue ever named**. https://www.dndbeyond.com/forums/d-d-beyond-general/looking-for-players-groups/169973-maryland-players
  - "Face to Face in Baltimore MD anyone???" (Aug 2023) — organizer's venue plan: "I may have a local restaurant or library that could host." No Baltimore venue materialized in-thread. …/178967
  - "Experienced (30+ years) player LFG… DC/Baltimore" (Oct 2023) — all answers were DC-side (Discord, Arlington/DC bars); nothing offered Baltimore-side. …/182042
  - "Baltimore / Towson Maryland Groups?" (Aug 2024, returning 51-year-old player) — one reply, 4.5 months later. …/203286
  - "Looking for in person game in Maryland/DMV" (Aug 2024) — answers again clustered DC/NoVa. …/203677
  - "Looking for places to play… Middle River" (Jun 2022) — usual store "has been too chaotic lately"; answers: two other stores or a home game. …/143659
  - What the answers reveal about alternatives: **Games & Stuff (Glen Burnie) is the only rentable private game room found in the metro** — seats 6 (max 12 at +$5/head), **$50 weekday / $75 Fri–Sat evening, non-refundable** — and it is suburban, not city. Peerspace Baltimore avg **$64/hr** (range $25–$400, multi-hour minimums), corporate-flavored.
- **Important honest distinction:** the observed asks are "where can I find people/a place to play" — **zero fetchable 2023–2026 posts explicitly asking to *rent a private room***. The demand shows up as large groups improvising in bars, groceries, and pay-to-play stores, not as articulated demand for the product. (Consistent with a market that doesn't know the product exists — but that is inference, not observation.)
- **Read: supports, with the caveat above.** Persistent decade-long LFG asks with no good Baltimore venue answer; the "answers" column is a map of incumbent weakness.
- **Gaps:** Reddit (r/baltimore) unreachable — **operator task: search it by hand from a normal browser**; BGG/EN World bodies unfetchable; archive/mirror routes all blocked.

### T4 — Pratt evening hours at candidate branches

- **Method actually used:** prattlibrary.org /locations + per-branch pages (Central, Southeast Anchor, Pennsylvania Ave, Open Works).
- **Raw observations:**
  - Central (400 Cathedral St — serves Little Italy/Jonestown, Station North, and is the closest full-service location to Bromo): Mon–Thu 10–8, Fri–Sat 10–5, **Sun closed**.
  - Southeast Anchor (3601 Eastern Ave, Highlandtown): identical — Mon–Thu 10–8, Fri–Sat 10–5, Sun closed.
  - Pennsylvania Ave branch: identical hours. No Pratt branch inside Bromo itself.
  - **Latest branch close citywide: 8:00 PM** (Mon–Thu, ~20 branches; none later; several close earlier or are closed). No branch open past 8 PM on any day; no branch open Sunday. (Latest of any Pratt *location*: 9 PM at two technology labs — no meeting rooms.)
  - Prime-time (7–11 PM) overlap: **1 of 4 hours Mon–Thu, 0 of 4 Fri/Sat/Sun** at every branch checked.
- **Read: supports §1a — closes the loop on §5.1.** Even setting aside the recurring-booking denial policy ("most are denied"), the buildings cover at most the first hour of club prime time four nights a week and none of it Fri–Sun. The free competitor is structurally absent from the product's core hours.
- **Gaps:** full weekly grids individually confirmed for 3 branches; the other ~20 inferred from the Thursday-evening system snapshot (all showed ≤8 PM closes that day).

### T5 — Organized-play and paid-GM supply scan

- **Method actually used:** StartPlaying (JS-walled search; profile pages via site-search), Warhorn (login-walled schedules; public shells + Meetup cross-check), store calendars (cantongames.com, nolandbaltimore.com — note domain, gamesandstuffonline.com).
- **Raw observations:**
  - **StartPlaying in-person Baltimore GM count: could not be established** (SPA search; treat as unverified, not zero). One local profile surfaced: Jim Ritter "charmcityteach" — Baltimore, D&D 5e/Fate/MotW, **$20/session**, 5.0★ (10 reviews), online-only listings currently.
  - **Canton Games: paid D&D 3 nights/wk (Mon/Tue/Thu 6 PM) at $15/seat ($5 back in credit) with a waitlist mechanism; Daggerheart one-shot Aug 29 SOLD OUT; "Queer D&D Night #12" (12th monthly iteration) Sep 9.** ~3-hr sessions.
  - **Games & Stuff: "Scenic Miniatures RPG — The Fall of Night" Sep 12, 6-hr session, $75/seat — SOLD OUT** (3rd installment). Private room rentals run as a product line; Epic RPG Weekend in October; $10 open-gaming bracelet model.
  - No Land Beyond: dense weekly card/board calendar ($10–26 entries); TTRPG side is **free** drop-in D&D ("Flagons & Dragons," monthly, volunteer GMs) — runs as bar traffic-driver, not paid content.
  - Pathfinder/Starfinder Society of Baltimore: 1,057 members, 4.8★ over **3,167 event reviews**, multiple sessions/wk across 4 rotating venues; ran Balticon 60's RPG room. GAD-CON 2026 (Aberdeen, Feb–Mar) active.
  - GM-partner shortlist: Jim Ritter ($20/seat); PFS Baltimore venue coordinators (volunteer GM network actively adding venues); Canton Games (legenddan@cantongames.com — sells out $15 one-shots); Scenic Miniatures RPG (premium $75 traveling format that sells out); No Land Beyond's volunteer GM pool.
- **Read: supports the content-attach thesis (precedent memo §7.3).** Paid TTRPG seats clear locally at **both $15 and $75** with sell-outs and waitlists at each; an organized-play network exists that actively seeks venues. The runbook's proposed ticketed-night economics ($15–20/seat) sit at the proven low end.
- **Gaps:** StartPlaying search and Warhorn schedules need login/JS — in-person GM count and table counts unverified; Games & Stuff weekly calendar is an embedded widget (didn't render); TridentCon 2026 status unknown (Facebook-walled).

### T6 — Review mining: space-scarcity language

- **Method actually used:** WebSearch + fetches. Accessible: TripAdvisor (best source this run), Baltimore Banner, JHU News-Letter, venues' own pages. **Not accessible: Yelp (robots-blocked), Google Maps review corpora, restaurantguru; wheree.com loads but contains only AI-generated summaries — excluded as evidence.**
- **Raw observations:**
  - No Land Beyond — TripAdvisor (Aug 2024): "**Place was full** and you could still hear your conversation." Own reservations page: "Reservations guarantee 2.5 hours" and are "highly recommended… **for all parties hoping to secure a table on weekends**" — a 2.5-hr table cap + weekend-reservation advisory is structural peak-scarcity evidence. JHU News-Letter (2023): "groups of friends were crowded around booths."
  - Canton Games — Baltimore Banner (Mar 2024): only "**several tables in the back of the store**." Same article: Games & Stuff's 120-seat game room + new rentable private rooms are in suburban Glen Burnie. Zero accessible customer reviews for Canton Games (Yelp's 29 unreadable).
  - **No verbatim customer complaint of being turned away was recoverable** — the scarcity evidence is structural (few tables, reservation caps, purchase minimums), not complaint-based. Recorded honestly as such.
  - Escape rooms (willingness-to-pay): Charm City Clue Room reviews — "**$29 per person**… expensive for the area but understandable" (2017), "a bit pricey" but fun (2019); **the venue now appears CLOSED** (Yelp title; unverified further) — demand exists but downtown economics are hard, a two-sided datum. Breakout Games (Timonium), 4.9★/203 reviews: "**Worth the money**" (May 2025); operator states $28–38/person, $120–280 per room-group.
- **Read: mildly supports.** Per-person session-priced group recreation clears at $28–38 locally with positive sentiment; city game venues show structural, not anecdotal, space limits. Thin corpus — treat as corroboration, not proof.
- **Gaps:** Yelp/Google review corpora unreachable (the bulk of the evidence base); No Land Beyond crowding rests on 3 thin sources; no current city-proper escape-room price confirmed from a booking page.

### So far (rollup after run 1)

Every task moved in §1a's direction, and the biggest one moved hardest: **the analog's prime time is essentially sold out.** T1's browser observation shows D&J's evening slots 100% gone across all 5 rooms 1–5 days ahead, Saturdays gone even 5 weeks out (with a booked-vs-blocked caveat), and middays soft — a utilization curve far above the plan's <!--m:baseUtil-->33%<!--/m-->/<!--m:gateUtil-->55%<!--/m--> evening marks at peak, while confirming that off-peak daytime is where slack lives. Demand side: a 34-group, multi-thousand-member Baltimore pipeline meets in bars, Paneras, and grocery seating with documented capacity rationing and noise failure (T2); decade-persistent LFG asks get no good Baltimore venue answer (T3); the free competitor is closed for 75–100% of prime time on top of its recurring-booking denial (T4); paid seats clear at $15–75 with sell-outs (T5). Pricing comps bracket the band from both ends: D&J $5–10/hr, Mox $30/hr peak, Games & Stuff $50–75/evening flat, Peerspace avg $64/hr. **Honest caveats that stand:** one snapshot is not a fill *rate* (repetition is the point of the schedule); booked vs operator-blocked is unresolved at D&J (Saturday especially); nobody was observed explicitly asking to rent a room (T3) — demand is revealed, not articulated; and D&J fills at $5–10/hr, a price floor test, not proof of the $15–35 band. Watch next: whether the evening-sellout pattern repeats at longer leads, and whether local sell-out signals (Canton $15 nights, G&S premium events) persist.

**Method notes for future runs:** observable via browser (needs operator's Mac awake, Chrome + Claude extension): D&J room calendars (method under T1). Observable via plain fetch: Canton Games event pages (sold-out tags), Games & Stuff featured event products, No Land Beyond events, Meetup group pages, Pratt hours. Unobservable from this environment: Mox calendar, StartPlaying search, Warhorn schedules, Reddit, Yelp/Google reviews, Discord, Facebook.
