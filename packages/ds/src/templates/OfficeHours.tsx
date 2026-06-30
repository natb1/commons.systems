import { useEffect, useState } from "react";
import type { CSSProperties, HTMLAttributes, ReactNode } from "react";
import { Nav } from "../navigation/Nav.tsx";
import { Card } from "../core/Card.tsx";
import { Metric } from "../core/Metric.tsx";
import { Badge } from "../core/Badge.tsx";
import type { BadgeProps } from "../core/Badge.tsx";
import { Button } from "../core/Button.tsx";
import type { NavLink } from "../navigation/nav-link.ts";
import { SectionHeading, TemplateFooter } from "./chrome.tsx";
import { BudgetPaceChart } from "../charts/BudgetPaceChart.tsx";
import type { BudgetPaceSeries } from "../charts/budget-pace-chart-core.ts";

// A static, populated snapshot of the office-hours dashboard. One template with
// two pages — the same split the real app's nav header exposes: a "Status" page
// (budgets, backlog, intention tree) and an "Other" page (everything else —
// history, audit, reminders, queue, parked, project signals). Pick the page
// with the `page` prop; the design surface ships each as a story of this one
// template. Both pages are full-page layouts built from the same reusable DS
// components the Landing template uses — Nav (header, here carrying the
// Status/Other tabs), Card (every panel), Metric (the stat cards), Badge (status
// chips), Button (the auth control) — plus the shared page chrome
// (SectionHeading, TemplateFooter). The live dashboard composes the same
// primitives over Firestore data and Observable Plot charts; this template is
// the layout populated with boilerplate so the pages can be worked on in the
// design surface without a backend. The remaining chart panels (HISTORY /
// BACKLOG / AUDIT) are represented by a static chart-shaped placeholder, since
// the real charts are Observable Plot. The Status page's Budgets card is the one
// live chart: each budget row opens the reusable BudgetPaceChart in the context
// panel, mirroring the dashboard's pace view. Swap the placeholder copy and data
// for the real surface when adapting it.

export interface OfficeHoursProps extends HTMLAttributes<HTMLDivElement> {
  /** Which of the two nav-header pages to render. Defaults to "status". */
  page?: "status" | "other";
  /**
   * Optional budget `id` to preselect on the Status page, so a story can render
   * the context-panel pace chart for that budget without a click. Ignored on the
   * Other page. When omitted, no budget is selected and the panel shows its
   * placeholder.
   */
  defaultSelectedBudget?: string;
}

// The nav header's two pages. Each page renders the same links with its own one
// marked current, so the tabs read as a single two-page surface.
const NAV_LINKS: NavLink[] = [
  { href: "#status", label: "Status" },
  { href: "#other", label: "Other" },
];

const PANEL_GRID: CSSProperties = {
  display: "grid",
  // Mirrors the dashboard's panel-grid: as many ~22rem columns as fit, full
  // width when only one fits.
  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 22rem), 1fr))",
  gap: "var(--space-6)",
};

const FULL_WIDTH: CSSProperties = { gridColumn: "1 / -1" };

const MUTED_CAPTION: CSSProperties = {
  color: "var(--text-muted)",
  fontSize: "var(--text-xs)",
  margin: "var(--space-2) 0 0",
};

// --- The shared full-page shell both office-hours pages render: the sticky
// header (wordmark + Status/Other nav + auth control), the signed-out demo
// banner, and the responsive panel grid, plus the shared footer. Each page
// passes the href of its active nav link and its own set of panels.
//
// When `sidebar` is provided (the Status page), the shell also renders the
// canonical .sidebar context panel as a sibling of <main> inside .content-grid,
// and adds the mobile-only .panel-toggle button alongside "Sign in" in the Nav
// end slot — the same toggle/aside contract the Landing template uses. When
// `sidebar` is absent (the Other page), the shell renders exactly as before:
// Sign in only, no toggle, no aside.

const PANEL_ID = "cs-office-hours-panel";

function OfficeHoursShell({
  current,
  className,
  children,
  sidebar,
  panelOpen,
  onTogglePanel,
  ...rest
}: HTMLAttributes<HTMLDivElement> & {
  current: string;
  /** Context-panel content. When set, the toggle + aside are rendered. */
  sidebar?: ReactNode;
  panelOpen?: boolean;
  onTogglePanel?: () => void;
}) {
  return (
    <div
      {...rest}
      className={["page", "cs-office-hours", className].filter(Boolean).join(" ")}
    >
      {/* Sticky header — the office-hours wordmark over a Nav whose links are the
          Status/Other pages and whose end slot holds the auth control, matching
          the real app. On the Status page the end slot also carries the
          mobile-only context-panel toggle. */}
      <header>
        <h1 style={{ fontSize: "var(--text-display)", marginBlock: "0 var(--space-2)" }}>
          Office Hours
        </h1>
        <Nav
          links={NAV_LINKS}
          current={current}
          end={
            sidebar ? (
              <>
                <Button variant="secondary" size="sm">
                  Sign in
                </Button>
                <button
                  type="button"
                  className="panel-toggle"
                  aria-label="Toggle context panel"
                  aria-expanded={panelOpen}
                  aria-controls={PANEL_ID}
                  onClick={onTogglePanel}
                >
                  {"▸"}
                </button>
              </>
            ) : (
              <Button variant="secondary" size="sm">
                Sign in
              </Button>
            )
          }
        />
      </header>

      <div className="content-grid">
        <main>
          {/* Demo-tier banner — the dashboard's signed-out state. */}
          <p
            role="status"
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              color: "var(--text-muted)",
              padding: "var(--space-2) var(--space-3)",
              margin: "0 0 var(--space-6)",
              fontSize: "var(--text-sm)",
            }}
          >
            Demo data — sign in to see your queue.
          </p>

          <div style={PANEL_GRID}>{children}</div>
        </main>

        {/* Collapsible, sticky context panel — the canonical .sidebar contract
            from ds layout.css, shared with the Landing template. Sibling of
            <main> so the wide layout lays them out as the two grid columns. */}
        {sidebar && (
          <aside
            id={PANEL_ID}
            className={["sidebar", panelOpen ? "open" : ""].filter(Boolean).join(" ")}
            aria-label="Context"
          >
            {sidebar}
          </aside>
        )}
      </div>

      <TemplateFooter />
    </div>
  );
}

// --- A single dashboard panel: a bordered Card titled with the shared heading.

function Panel({
  title,
  full,
  children,
}: {
  title: string;
  full?: boolean;
  children: ReactNode;
}) {
  return (
    <Card style={full ? FULL_WIDTH : undefined}>
      <SectionHeading>{title}</SectionHeading>
      {children}
    </Card>
  );
}

// A row of Metric stat-cards, each sharing the row width — the dashboard's
// capacity-cards / queue-cards layout.
function MetricRow({ children }: { children: ReactNode }) {
  return (
    <div style={{ display: "flex", gap: "var(--space-4)", flexWrap: "wrap" }}>
      {children}
    </div>
  );
}

const metricFill: CSSProperties = { flex: "1 1 8rem" };

// --- Static chart-shaped placeholder for the Observable-Plot panels.

function areaPath(values: number[], w = 320, h = 96): string {
  const max = Math.max(...values, 1);
  const step = w / (values.length - 1);
  const line = values
    .map((v, i) => `${i === 0 ? "M" : "L"}${(i * step).toFixed(1)} ${(h - (v / max) * h).toFixed(1)}`)
    .join(" ");
  return `${line} L${w} ${h} L0 ${h} Z`;
}

function MiniChart({
  series,
  caption,
}: {
  series: { color: string; values: number[] }[];
  caption: string;
}) {
  return (
    <div>
      <svg
        viewBox="0 0 320 96"
        preserveAspectRatio="none"
        role="img"
        aria-label={caption}
        style={{ width: "100%", height: "96px", display: "block" }}
      >
        {series.map((s, i) => (
          <path key={i} d={areaPath(s.values)} fill={s.color} fillOpacity={0.55} />
        ))}
      </svg>
      <p style={MUTED_CAPTION}>{caption}</p>
    </div>
  );
}

// --- Boilerplate content. Representative of the real panels, not real data.

// A budget the Status page tracks: a spend window with a pacing target and the
// pre-computed pace series the context panel draws via BudgetPaceChart. The
// token budgets fold in the old Capacity/reset copy; the monthly ones are new.
interface Budget {
  /** Stable id used as the selection key and the `defaultSelectedBudget` value. */
  id: string;
  /** Human label, e.g. "weekly tokens". */
  label: string;
  /** Percent of the window's allowance spent so far. */
  spentPct: number;
  /** The pace target at "now" — what an on-pace spend would read. */
  targetPct: number;
  /** When this window resets, e.g. "Mon 9:00 AM". */
  resetClock: string;
  /** Time until reset, e.g. "in 3d 6h". */
  timeRemaining: string;
  /** Pre-computed pace series (backdrop, current window, prior windows). */
  series: BudgetPaceSeries;
}

// The ideal-pace backdrop every budget shares: a straight ramp 0% -> 100% across
// the window. Drawn dotted behind the spend windows.
const PACE_BACKDROP = [
  { x: 0, y: 0 },
  { x: 0.25, y: 25 },
  { x: 0.5, y: 50 },
  { x: 0.75, y: 75 },
  { x: 1, y: 100 },
];

const BUDGETS: Budget[] = [
  {
    // ~63% spent at ~54% through the week — ahead of (over) pace. Folds in the
    // old Capacity "weekly" reset copy. Four prior weeks exercise the ≤3 clamp.
    id: "weekly-tokens",
    label: "weekly tokens",
    spentPct: 63,
    targetPct: 54,
    resetClock: "Mon 9:00 AM",
    timeRemaining: "in 3d 6h",
    series: {
      pace: PACE_BACKDROP,
      current: [
        { x: 0, y: 0 },
        { x: 0.18, y: 18 },
        { x: 0.36, y: 38 },
        { x: 0.54, y: 63 },
      ],
      previous: [
        [
          { x: 0, y: 0 },
          { x: 0.5, y: 30 },
          { x: 1, y: 58 },
        ],
        [
          { x: 0, y: 0 },
          { x: 0.5, y: 38 },
          { x: 1, y: 71 },
        ],
        [
          { x: 0, y: 0 },
          { x: 0.5, y: 24 },
          { x: 1, y: 49 },
        ],
        [
          { x: 0, y: 0 },
          { x: 0.5, y: 34 },
          { x: 1, y: 66 },
        ],
      ],
    },
  },
  {
    // ~47% spent at ~55% through the 5-hour window — behind (under) pace. Folds
    // in the old Capacity "5-hour" reset copy.
    id: "five-hour-tokens",
    label: "five-hour tokens",
    spentPct: 47,
    targetPct: 55,
    resetClock: "3:00 PM",
    timeRemaining: "in 2h 14m",
    series: {
      pace: PACE_BACKDROP,
      current: [
        { x: 0, y: 0 },
        { x: 0.2, y: 16 },
        { x: 0.4, y: 33 },
        { x: 0.55, y: 47 },
      ],
      previous: [
        [
          { x: 0, y: 0 },
          { x: 0.5, y: 27 },
          { x: 1, y: 52 },
        ],
        [
          { x: 0, y: 0 },
          { x: 0.5, y: 31 },
          { x: 1, y: 60 },
        ],
      ],
    },
  },
  {
    // ~38% spent at ~63% through the month — comfortably under pace.
    id: "monthly-infra",
    label: "monthly infrastructure",
    spentPct: 38,
    targetPct: 63,
    resetClock: "1st 12:00 AM",
    timeRemaining: "in 11d",
    series: {
      pace: PACE_BACKDROP,
      current: [
        { x: 0, y: 0 },
        { x: 0.21, y: 14 },
        { x: 0.42, y: 27 },
        { x: 0.63, y: 38 },
      ],
      previous: [
        [
          { x: 0, y: 0 },
          { x: 0.5, y: 41 },
          { x: 1, y: 80 },
        ],
        [
          { x: 0, y: 0 },
          { x: 0.5, y: 47 },
          { x: 1, y: 92 },
        ],
        [
          { x: 0, y: 0 },
          { x: 0.5, y: 39 },
          { x: 1, y: 75 },
        ],
      ],
    },
  },
  {
    // ~72% spent at ~63% through the month — over pace.
    id: "monthly-service",
    label: "monthly service",
    spentPct: 72,
    targetPct: 63,
    resetClock: "1st 12:00 AM",
    timeRemaining: "in 11d",
    series: {
      pace: PACE_BACKDROP,
      current: [
        { x: 0, y: 0 },
        { x: 0.21, y: 26 },
        { x: 0.42, y: 50 },
        { x: 0.63, y: 72 },
      ],
      previous: [
        [
          { x: 0, y: 0 },
          { x: 0.5, y: 45 },
          { x: 1, y: 88 },
        ],
      ],
    },
  },
];

const REMINDERS: { title: string; due: string; overdue?: boolean }[] = [
  { title: "Review the weekly digest", due: "2h overdue", overdue: true },
  { title: "Triage the office-hours queue", due: "in 4h" },
  { title: "Sync the design system", due: "tomorrow" },
];

const PARKED: { title: string; age: string; phase: string }[] = [
  { title: "dispatch: re-dispatch stalled workers", age: "3d", phase: "office-hours" },
  { title: "print: surface the local folder picker", age: "1d", phase: "qa" },
  { title: "budget: parser for a new statement format", age: "6h", phase: "plan" },
];

type TreeNode = {
  statement: string;
  owner: string;
  status: BadgeProps["variant"];
  statusLabel: string;
  frontier?: boolean;
  tracker?: ReactNode;
  children?: TreeNode[];
};

const INTENTION_TREE: TreeNode[] = [
  {
    statement: "Make the commons self-sustaining",
    owner: "owner",
    status: "success",
    statusLabel: "codified",
    children: [
      {
        statement: "Keep the dispatch chain healthy",
        owner: "owner",
        status: "accent",
        statusLabel: "delegated",
        frontier: true,
        tracker: (
          <>
            <Badge variant="accent">issue #2511 open</Badge>
            <Badge variant="success">PR #2466 merged</Badge>
          </>
        ),
      },
      {
        statement: "Surface project signals to the operator",
        owner: "owner",
        status: "neutral",
        statusLabel: "refining",
        frontier: true,
        tracker: <span style={{ fontStyle: "italic" }}>not yet tracked</span>,
      },
    ],
  },
];

// --- One template, two pages. The `page` prop selects which set of panels (and
// which active nav tab) to render inside the shared shell. The Status page is
// stateful (budget selection + context panel), so it is its own component; the
// Other page is a plain render with no sidebar.
export function OfficeHours(props: OfficeHoursProps) {
  const { page = "status", defaultSelectedBudget, ...rest } = props;
  if (page === "other") {
    return (
      <OfficeHoursShell current="#other" {...rest}>
        <OtherPanels />
      </OfficeHoursShell>
    );
  }
  return <StatusPage defaultSelectedBudget={defaultSelectedBudget} {...rest} />;
}

// --- The "Status" page: budgets, backlog, and the intention tree. It owns the
// selection state shared by the Budgets card (in <main>) and the context panel
// (the <aside> sidebar): which budget is selected, and whether the panel is open
// on the narrow layout. Selecting a budget row updates both at once.
function StatusPage({
  defaultSelectedBudget,
  ...rest
}: HTMLAttributes<HTMLDivElement> & { defaultSelectedBudget?: string }) {
  const [selectedBudget, setSelectedBudget] = useState<string | undefined>(
    defaultSelectedBudget,
  );
  const [panelOpen, setPanelOpen] = useState(false);

  // Auto-expand the context panel when a budget is selected on a narrow
  // viewport, where the panel is a collapsed overlay. Guarded so the node
  // environment (renderToStaticMarkup, ds vitest) — which has no `window` /
  // `matchMedia` — never throws.
  useEffect(() => {
    if (
      selectedBudget &&
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(max-width: 767px)").matches
    ) {
      setPanelOpen(true);
    }
  }, [selectedBudget]);

  const selected = BUDGETS.find((b) => b.id === selectedBudget);

  return (
    <OfficeHoursShell
      current="#status"
      panelOpen={panelOpen}
      onTogglePanel={() => setPanelOpen((open) => !open)}
      sidebar={<BudgetContext budget={selected} />}
      {...rest}
    >
      <StatusPanels selectedBudget={selectedBudget} onSelectBudget={setSelectedBudget} />
    </OfficeHoursShell>
  );
}

// The Status page's panels: a single Budgets card (clickable rows), the backlog
// chart, and the intention tree. The Budgets card replaces the old Capacity and
// Pace panels — each row drives the context panel's pace chart.
function StatusPanels({
  selectedBudget,
  onSelectBudget,
}: {
  selectedBudget?: string;
  onSelectBudget: (id: string) => void;
}) {
  return (
    <>
      <Panel title="Budgets">
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
          {BUDGETS.map((b) => (
            <BudgetRow
              key={b.id}
              budget={b}
              selected={b.id === selectedBudget}
              onSelect={onSelectBudget}
            />
          ))}
        </div>
      </Panel>

      <Panel title="Backlog" full>
        <MiniChart
          caption="open issues by type · runway ≈ 18 days"
          series={[
            { color: "var(--chart-4)", values: [8, 8, 9, 7, 10, 9, 11, 10, 12, 11, 13, 12] },
            { color: "var(--chart-5)", values: [4, 5, 4, 6, 5, 7, 6, 6, 7, 8, 7, 9] },
            { color: "var(--chart-6)", values: [2, 2, 3, 2, 3, 4, 3, 4, 4, 5, 4, 5] },
          ]}
        />
      </Panel>

      {/* Intention tree — the project's single hierarchy, frontier nodes
          emphasised with an accent rule and a tracker overlay. */}
      <Panel title="Intention Tree" full>
        <IntentionTree nodes={INTENTION_TREE} />
      </Panel>
    </>
  );
}

// One clickable budget row: an interactive Card that selects the budget. Shows
// the label, %spent / %target, and the reset clock with time remaining. The
// selected row carries an accent left rule and aria-pressed.
function BudgetRow({
  budget,
  selected,
  onSelect,
}: {
  budget: Budget;
  selected: boolean;
  onSelect: (id: string) => void;
}) {
  const overPace = budget.spentPct > budget.targetPct;
  return (
    <Card
      interactive
      aria-pressed={selected}
      onClick={() => onSelect(budget.id)}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-1)",
        padding: "var(--space-3)",
        ...(selected
          ? { borderLeftWidth: "3px", borderLeftColor: "var(--accent)" }
          : {}),
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          gap: "var(--space-3)",
        }}
      >
        <span style={{ fontWeight: "var(--weight-bold)" }}>{budget.label}</span>
        <Badge variant={overPace ? "accent" : "success"}>
          {budget.spentPct}% / {budget.targetPct}%
        </Badge>
      </div>
      <p style={MUTED_CAPTION}>
        resets {budget.resetClock} · {budget.timeRemaining}
      </p>
    </Card>
  );
}

// The context-panel content for the Status page: a placeholder until a budget is
// selected, then that budget's heading and pace chart.
function BudgetContext({ budget }: { budget?: Budget }) {
  if (!budget) {
    return (
      <p style={{ color: "var(--text-muted)", fontSize: "var(--text-sm)", margin: 0 }}>
        Select a budget to see its pace.
      </p>
    );
  }
  return (
    <div>
      <SectionHeading>{budget.label}</SectionHeading>
      <p style={{ ...MUTED_CAPTION, marginTop: 0 }}>
        {budget.spentPct}% spent · {budget.targetPct}% target
      </p>
      <BudgetPaceChart {...budget.series} />
    </div>
  );
}

// --- The "Other" page: everything the Status page leaves out — the historical
// charts, the audit spend, and the operational lists (reminders, queue, parked),
// plus the external project signals.
function OtherPanels() {
  return (
    <>
      <Panel title="History" full>
        <MiniChart
          caption="usage & worker count over the last 14 days"
          series={[
            { color: "var(--chart-1)", values: [2, 4, 3, 5, 6, 5, 7, 6, 8, 7, 9, 8, 9, 10] },
            { color: "var(--chart-3)", values: [1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 6, 7, 7] },
          ]}
        />
        <p style={{ margin: "var(--space-3) 0 0" }}>
          6 active / 8 target{" "}
          <span style={{ color: "var(--accent)" }}>spawning</span>
        </p>
      </Panel>

      <Panel title="Audit" full>
        <MiniChart
          caption="per-phase spend · cache hit-rate 71%"
          series={[{ color: "var(--chart-1)", values: [5, 7, 6, 8, 7, 9, 8, 10, 9, 11] }]}
        />
      </Panel>

      <Panel title="Reminders">
        <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
          {REMINDERS.map((r) => (
            <li
              key={r.title}
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: "var(--space-3)",
                padding: "var(--space-2) 0",
                borderBottom: "1px solid var(--border)",
              }}
            >
              <span>{r.title}</span>
              <span
                style={{
                  whiteSpace: "nowrap",
                  color: r.overdue ? "var(--error)" : "var(--text-muted)",
                  fontWeight: r.overdue ? "var(--weight-bold)" : undefined,
                }}
              >
                {r.due}
              </span>
            </li>
          ))}
        </ul>
      </Panel>

      <Panel title="Queue">
        <MetricRow>
          <Metric style={metricFill} label="queue depth" value="24" />
          <Metric
            style={metricFill}
            label="net drain"
            value="1.3/day"
            delta="draining"
            deltaTone="favorable"
          />
          <Metric style={metricFill} label="runway" value="18 days" />
        </MetricRow>
      </Panel>

      <Panel title="Parked">
        <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
          {PARKED.map((p) => (
            <li
              key={p.title}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                gap: "var(--space-3)",
                padding: "var(--space-2) 0",
                borderBottom: "1px solid var(--border)",
              }}
            >
              <span
                style={{
                  overflow: "hidden",
                  whiteSpace: "nowrap",
                  textOverflow: "ellipsis",
                  minWidth: 0,
                  flex: 1,
                }}
              >
                {p.title}
              </span>
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--space-2)",
                  flexShrink: 0,
                }}
              >
                <span style={{ color: "var(--text-muted)" }}>{p.age}</span>
                <Badge variant="neutral">{p.phase}</Badge>
              </span>
            </li>
          ))}
        </ul>
      </Panel>

      {/* Project signals — GitHub, analytics, search console, Lighthouse. */}
      <Panel title="Project Signals" full>
        <Source heading="GitHub">
          <MetricRow>
            <Metric style={metricFill} label="stars" value="128" />
            <Metric style={metricFill} label="forks" value="14" />
            <Metric style={metricFill} label="watchers" value="9" />
            <Metric style={metricFill} label="views (14d)" value="1,204" />
          </MetricRow>
        </Source>
        <Source heading="Analytics (GA4) — landing">
          <MetricRow>
            <Metric style={metricFill} label="page views" value="3,410" />
            <Metric style={metricFill} label="sessions" value="2,180" />
            <Metric style={metricFill} label="bounce rate" value="38%" />
          </MetricRow>
        </Source>
        <Source heading="Lighthouse (PSI) — commons.systems (mobile)">
          <MetricRow>
            <Metric style={metricFill} label="performance" value="98" />
            <Metric style={metricFill} label="SEO" value="100" />
            <Metric style={metricFill} label="accessibility" value="100" />
            <Metric style={metricFill} label="best practices" value="96" />
          </MetricRow>
        </Source>
      </Panel>
    </>
  );
}

function Source({ heading, children }: { heading: string; children: ReactNode }) {
  return (
    <div style={{ marginTop: "var(--space-4)" }}>
      <h3
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "var(--text-sm)",
          margin: "0 0 var(--space-2)",
        }}
      >
        {heading}
      </h3>
      {children}
    </div>
  );
}

function IntentionTree({ nodes }: { nodes: TreeNode[] }) {
  const renderNode = (node: TreeNode, key: number) => (
    <li
      key={key}
      style={{
        padding: "var(--space-2) 0",
        borderBottom: "1px solid var(--border)",
        ...(node.frontier
          ? { borderLeft: "2px solid var(--accent)", paddingLeft: "var(--space-2)" }
          : {}),
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          gap: "var(--space-3)",
        }}
      >
        <span style={{ flex: 1, minWidth: 0 }}>{node.statement}</span>
        <span style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", flexShrink: 0 }}>
          <Badge variant="neutral">{node.owner}</Badge>
          <Badge variant={node.status}>{node.statusLabel}</Badge>
          {node.frontier && <Badge variant="accent">frontier</Badge>}
        </span>
      </div>
      {node.tracker && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--space-2)",
            margin: "var(--space-2) 0",
            fontSize: "var(--text-xs)",
            color: "var(--text-muted)",
          }}
        >
          {node.tracker}
        </div>
      )}
      {node.children && node.children.length > 0 && (
        <ul
          style={{
            listStyle: "none",
            padding: 0,
            margin: "var(--space-2) 0 0",
            marginLeft: "var(--space-3)",
            paddingLeft: "var(--space-4)",
            borderLeft: "1px solid var(--border)",
          }}
        >
          {node.children.map(renderNode)}
        </ul>
      )}
    </li>
  );

  return (
    <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
      {nodes.map(renderNode)}
    </ul>
  );
}
