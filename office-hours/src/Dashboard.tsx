// React port of the vanilla app render pipeline: the ViewState tier dispatch
// (app-view.ts), the responsive panel grid + full-width registry (app-view.ts),
// the five-collection parallel Firestore load with auth-change race guard
// (main.ts), and the single 60s tick that recomputes only the time-sensitive
// panels (app-controller.ts + AppView.tick).
//
// Auth seam for Unit 5: Dashboard takes the current `user` as a prop — exactly
// as audio's Home page does. The `onAuthStateChanged` subscription + entry
// wiring stay in Unit 5's App shell; this component never subscribes itself.
import { useEffect, useMemo, useState } from "react";
import type { User } from "firebase/auth";

import { deferProgrammerError } from "@commons-systems/errorutil/defer";
import { logError } from "@commons-systems/errorutil/log";

import { db, NAMESPACE } from "./firebase.js";
import { getOwnerReminders, getOwnerQueueMetrics, getDemoReminders, getDemoQueueMetrics } from "./data.js";
import { getOwnerSamples, getDemoSamples } from "./usage-data.js";
import { getOwnerIssueSamples, getDemoIssueSamples } from "./issue-data.js";
import { getOwnerAuditAggregates, getDemoAuditAggregates } from "./audit-data.js";
import { getDemoProjectSignals, getOwnerProjectSignals } from "./project-signals-data.js";

import { selectLatestSample, type UsageSample } from "./usage-samples.js";
import { capacityBandKey } from "./capacity-band.js";
import { remindersPanelKey } from "./reminders.js";
import type { Reminder } from "./reminders.js";
import { parkedPanelKey } from "./queue-metrics.js";
import type { QueueMetricsSnapshot } from "./queue-metrics.js";
import type { IssueSample } from "./issue-samples.js";
import type { AuditAggregate } from "./audit-aggregates.js";
import type { ProjectSignalsSnapshot } from "./project-signals.js";

import { CapacityBand } from "./components/CapacityBand.js";
import { PacePanel } from "./components/PacePanel.js";
import { HistoryBand } from "./components/HistoryBand.js";
import { BacklogPanel } from "./components/BacklogPanel.js";
import { AuditPanel } from "./components/AuditPanel.js";
import { RemindersPanel } from "./components/RemindersPanel.js";
import { QueueMetricsPanel } from "./components/QueueMetricsPanel.js";
import { ParkedIssuesPanel } from "./components/ParkedIssuesPanel.js";
import { ProjectSignalsPanel } from "./components/ProjectSignalsPanel.js";

// The tier-resolved data the panels render. Mirrors the vanilla ViewState's
// owner payload (and the demo payload built by buildContext).
interface PanelData {
  samples: UsageSample[];
  reminders: Reminder[];
  queueMetrics: QueueMetricsSnapshot | null;
  issueSamples: IssueSample[];
  auditAggregates: AuditAggregate[];
  projectSignals: ProjectSignalsSnapshot | null;
}

type ViewState =
  | { tier: "demo" } // unauthenticated → labeled demo
  | { tier: "owner"; data: PanelData } // authenticated → real (possibly empty)
  | { tier: "error" }; // authenticated load failed

export interface DashboardProps {
  /**
   * The current Firebase user, or null when signed out. Unit 5's App shell owns
   * the onAuthStateChanged subscription and threads its result in here.
   */
  user: User | null;
}

export function Dashboard({ user }: DashboardProps) {
  // "demo" is the initial state so the view is meaningful before auth resolves
  // (mirrors main.ts's immediate demo paint).
  const [state, setState] = useState<ViewState>({ tier: "demo" });

  // `now` drives the time-sensitive panels (capacity, reminders). The single
  // mount-once interval bumps it every 60s; one component instance reads current
  // state at render, so — unlike the vanilla per-paint timer restart — the
  // countdown is not reset on every auth/data change. Ports app-controller.ts.
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  // Five-collection parallel Firestore load for the owner tier, with the
  // auth-change race guard (ports main.ts's refresh()). A null user paints demo;
  // an `ignore` flag set by cleanup keeps a stale in-flight load (success OR
  // error) from clobbering newer state after the user changes.
  useEffect(() => {
    if (user === null) {
      setState({ tier: "demo" });
      return;
    }
    let ignore = false;
    void (async () => {
      try {
        const [samples, reminders, queueMetrics, issueSamples, auditAggregates, projectSignals] = await Promise.all([
          getOwnerSamples(db, NAMESPACE, user),
          getOwnerReminders(db, NAMESPACE, user),
          getOwnerQueueMetrics(db, NAMESPACE, user),
          getOwnerIssueSamples(db, NAMESPACE, user),
          getOwnerAuditAggregates(db, NAMESPACE, user),
          getOwnerProjectSignals(db, NAMESPACE, user),
        ]);
        // Auth may have changed while the calls were in flight — skip so the
        // in-flight result does not clobber the already-updated view.
        if (ignore) return;
        setState({
          tier: "owner",
          data: { samples, reminders, queueMetrics, issueSamples, auditAggregates, projectSignals },
        });
      } catch (error) {
        // Same race guard on the error path.
        if (ignore) return;
        // Load failed — render an explicit error state rather than masking it as
        // demo data. A non-owner's read is "permission-denied"; logError classifies it.
        if (!deferProgrammerError(error)) {
          logError(error, { operation: "load-owner-data" });
        }
        setState({ tier: "error" });
      }
    })();
    return () => {
      ignore = true;
    };
  }, [user]);

  // Demo data getters return fresh arrays per call. Build them once so the
  // memoized panels below see stable references across ticks (otherwise every
  // 60s tick would rebuild the charts — the flicker/re-scroll the vanilla
  // tick() was written to avoid).
  const demoData = useMemo<PanelData>(
    () => ({
      samples: getDemoSamples(),
      reminders: getDemoReminders(),
      queueMetrics: getDemoQueueMetrics(),
      issueSamples: getDemoIssueSamples(),
      auditAggregates: getDemoAuditAggregates(),
      projectSignals: getDemoProjectSignals(),
    }),
    [],
  );

  // Resolve the active panel data for demo / owner. (The error tier returns
  // early below; these hooks still run unconditionally to satisfy rules-of-hooks.)
  const data = state.tier === "owner" ? state.data : demoData;
  const { samples, reminders, queueMetrics, issueSamples, auditAggregates, projectSignals } = data;

  // The two time-sensitive panels (capacity, reminders) are memoized as elements
  // keyed on a content signature: each panel's now-derived output (clocks,
  // countdowns, due labels) is captured by its *Key helper, so a 60s tick that
  // does not change any displayed string reuses the same element and the panel
  // does not re-render (React element-identity bailout). A tick that does change
  // the output bumps the key and rebuilds. The non-now fields are covered by the
  // data-reference deps. latestSample stays memoized on `[samples]`.
  const latestSample = useMemo(() => selectLatestSample(samples), [samples]);

  // The non-time-sensitive panels are memoized on their data only, so a `now`
  // tick does not rebuild them — matching the vanilla "re-render only the
  // time-sensitive panels" behavior. Full-width panels (history, backlog,
  // audit) carry "panel-grid-full" on their own root — exactly as the vanilla
  // buildPanelElement did with `el.classList.add` — so each stays a direct
  // grid child and the grid's margin-zeroing selectors keep matching.
  const paceEl = useMemo(() => <PacePanel samples={samples} />, [samples]);
  const historyEl = useMemo(
    () => <HistoryBand samples={samples} className="panel-grid-full" />,
    [samples],
  );
  const backlogEl = useMemo(
    () => <BacklogPanel samples={issueSamples} className="panel-grid-full" />,
    [issueSamples],
  );
  const auditEl = useMemo(
    () => <AuditPanel aggregates={auditAggregates} className="panel-grid-full" />,
    [auditAggregates],
  );
  const queueEl = useMemo(() => <QueueMetricsPanel metrics={queueMetrics} />, [queueMetrics]);
  const projectSignalsEl = useMemo(
    () => <ProjectSignalsPanel snapshot={projectSignals} />,
    [projectSignals],
  );

  // `now` is intentionally omitted from these dep arrays: the *Key helper
  // captures every now-derived change to the panel's output, so a tick that
  // does not change a clock/countdown/due-label reuses the same element and
  // the panel does not re-render (React element-identity bailout). A tick
  // that does change the output bumps the key and rebuilds.
  const capacityEl = useMemo(
    () => <CapacityBand sample={latestSample} now={now} />,
    [latestSample, capacityBandKey(latestSample, now)],
  );
  const remindersEl = useMemo(
    () => <RemindersPanel reminders={reminders} now={now} />,
    [reminders, remindersPanelKey(reminders, now)],
  );
  const parked = queueMetrics?.parked ?? [];
  // ParkedIssuesPanel age labels are now-derived; key on parked-reference + the
  // per-row age strings (in sorted order). The key changes only when a displayed
  // age label crosses a humanize bucket boundary, so a tick that changes no
  // visible label reuses the same element (matching capacityEl/remindersEl).
  const parkedEl = useMemo(
    () => <ParkedIssuesPanel parked={parked} now={now} />,
    [parked, parkedPanelKey(parked, now)],
  );

  if (state.tier === "error") {
    return (
      <p className="error" role="alert">
        Couldn&apos;t load your queue. Please try again.
      </p>
    );
  }

  if (state.tier !== "demo" && state.tier !== "owner") {
    // Exhaustiveness guard (mirrors app-view.ts's `never` check).
    const _exhaustive: never = state;
    throw new Error("unhandled ViewState tier: " + String(_exhaustive));
  }

  return (
    <>
      {state.tier === "demo" && (
        <p className="demo-banner" role="status">
          Demo data — sign in to see your queue.
        </p>
      )}
      {/* Panel order matches the vanilla PANELS registry:
          capacity, pace, history, backlog, audit, reminders, queue-metrics. */}
      <div className="panel-grid">
        {capacityEl}
        {paceEl}
        {historyEl}
        {backlogEl}
        {auditEl}
        {remindersEl}
        {queueEl}
        {parkedEl}
        {projectSignalsEl}
      </div>
    </>
  );
}
