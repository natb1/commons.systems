// React port of the vanilla app render pipeline: the ViewState tier dispatch
// (app-view.ts), the responsive panel grid + full-width registry (app-view.ts),
// the five-collection parallel Firestore load with auth-change race guard
// (main.ts), and the single 60s tick that recomputes only the time-sensitive
// panels (app-controller.ts + AppView.tick).
//
// Auth seam for Unit 5: Dashboard takes the current `user` as a prop — exactly
// as audio's Home page does. The `onAuthStateChanged` subscription + entry
// wiring stay in Unit 5's App shell; this component never subscribes itself.
import { useEffect, useMemo, useRef, useState } from "react";
import type { User } from "firebase/auth";

import { deferProgrammerError } from "@commons-systems/errorutil/defer";
import { logError } from "@commons-systems/errorutil/log";

import { db, NAMESPACE } from "./firebase.js";
import { getOwnerReminders, getOwnerQueueMetrics, getDemoReminders, getDemoQueueMetrics } from "./data.js";
import { getDemoIntentionTree } from "./intention-tree.js";
import { getOwnerSamples, getDemoSamples } from "./usage-data.js";
import { getOwnerIssueSamples, getDemoIssueSamples } from "./issue-data.js";
import { getOwnerTopicUsage, getDemoTopicUsage } from "./topic-usage-data.js";
import { getDemoProjectSignals, getOwnerProjectSignals } from "./project-signals-data.js";

import { selectLatestSample } from "./usage-samples.js";
import { capacityBandKey } from "./capacity-band.js";
import { remindersPanelKey } from "./reminders.js";
import { parkedPanelKey } from "./queue-metrics.js";

import { CapacityBand } from "./components/CapacityBand.js";
import { PacePanel } from "./components/PacePanel.js";
import { HistoryBand } from "./components/HistoryBand.js";
import { BacklogPanel } from "./components/BacklogPanel.js";
import { TopicUsagePanel } from "./components/TopicUsagePanel.js";
import { RemindersPanel } from "./components/RemindersPanel.js";
import { QueueMetricsPanel } from "./components/QueueMetricsPanel.js";
import { ParkedIssuesPanel } from "./components/ParkedIssuesPanel.js";
import { IntentionTreePanel } from "./components/IntentionTreePanel.js";
import { ProjectSignalsPanel } from "./components/ProjectSignalsPanel.js";

import { mergePanelData, type PanelData } from "./panel-equality.js";

import { isEncrypted } from "./crypto.js";
import { loadSnapshotPanelData, decodeSnapshot } from "./snapshot.js";
import { promptPassword } from "./prompt-password.js";
import {
  isSnapshotSupported,
  getSnapshotState,
  pickSnapshotFile,
  restoreSnapshotHandle,
  regrantSnapshot,
  readSnapshotBytes,
  hasExternallyChanged,
  getCurrentSnapshotHandle,
  type SnapshotSourceState,
} from "./local-snapshot-source.js";

// Read-only LOCAL snapshot tier, gated entirely behind a build-time flag.
// Vite statically replaces `import.meta.env.VITE_OFFICE_HOURS_LOCAL`, so when it
// is unset this constant folds to `false` and every `if (!LOCAL_ENABLED) return`
// / `{LOCAL_ENABLED && …}` site dead-code-eliminates — prod ships zero local
// surface and the owner/demo tiers are byte-for-byte unchanged (AC#5).
const LOCAL_ENABLED = import.meta.env.VITE_OFFICE_HOURS_LOCAL === "1";

type ViewState =
  | { tier: "demo" } // unauthenticated → labeled demo
  | { tier: "owner"; data: PanelData } // authenticated → real (possibly empty)
  | { tier: "local"; data: PanelData; computedAt: Date } // read-only on-disk snapshot
  | { tier: "error" }; // authenticated load failed

export interface DashboardProps {
  /**
   * The current Firebase user, or null when signed out. Unit 5's App shell owns
   * the onAuthStateChanged subscription and threads its result in here.
   */
  user: User | null;
}

// Bounded staleness ceiling for owner panel data. Producers write at most
// ~hourly (sampleDispatchQueueMetrics) up to per-dispatch-tick (usage-samples).
// Each refresh re-reads the FULL matching collection — the getters have no
// limit/orderBy and the history charts render the entire accumulated history, so
// the read set is the display set. At single-operator scale the steady-state
// re-read cost is negligible; the interval is the only cost/staleness lever.
// 5 min bounds worst-case staleness well under a work session while capping
// whole-collection re-reads to 12/hour/collection. Kept separate from the 60s
// `now` display tick — that tick is a zero-network setNow; coupling a
// whole-collection re-read to it would 5x reads for no staleness benefit.
const REFRESH_INTERVAL_MS = 5 * 60_000;

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

  // ---- LOCAL snapshot tier (flag-gated) -----------------------------------
  // Wiring choice: ALL local orchestration lives here in Dashboard, which
  // already owns the owner load + refresh + mergePanelData lifecycle — the
  // local tier is the same kind of data lifecycle, so co-locating it (rather
  // than lifting state into App) keeps it cohesive and lets Dashboard own the
  // `local` ViewState tier directly. Dashboard renders its own picker / re-grant
  // controls, so App.tsx and NavControls.tsx (and their e2e auth DOM) are
  // untouched. When LOCAL_ENABLED is false the controls, effects, and refs below
  // all dead-code-eliminate (AC#5).
  //
  // `localActiveRef` is set imperatively alongside `setState({tier:"local"})` so
  // the `[user]` effects below read it synchronously and never clobber an active
  // local tier with demo/owner on a later auth change.
  const localActiveRef = useRef(false);
  // Session-held passphrase for focus-reload decryption. NEVER persisted — held
  // only in this ref for the lifetime of the tab, cleared on a fresh load.
  const passphraseRef = useRef<string | null>(null);
  const [localState, setLocalState] = useState<SnapshotSourceState>(() =>
    LOCAL_ENABLED ? getSnapshotState() : "unsupported",
  );

  // Decode already-read snapshot bytes into PanelData + computedAt, prompting for
  // a passphrase only when the file is encrypted (snapshots are expected
  // encrypted; the unencrypted branch is a guard). On success, binds the tier and
  // remembers the passphrase for focus-reload. Returns false when the user
  // cancels the passphrase prompt (so a restore can fall through untouched).
  async function activateLocal(handle: FileSystemFileHandle): Promise<boolean> {
    const bytes = await readSnapshotBytes(handle);
    let result: { data: PanelData; computedAt: Date };
    if (isEncrypted(bytes)) {
      const pw = await promptPassword("Enter the snapshot passphrase to decrypt.");
      if (pw === null) return false; // cancelled — leave existing tier in place
      result = await loadSnapshotPanelData(bytes, pw);
      passphraseRef.current = pw;
    } else {
      result = decodeSnapshot(new TextDecoder().decode(bytes));
      passphraseRef.current = null;
    }
    localActiveRef.current = true;
    setState({ tier: "local", data: result.data, computedAt: result.computedAt });
    return true;
  }

  // Picker entry (user gesture): pick a .benc file, then load it. The first async
  // op inside pickSnapshotFile is showOpenFilePicker, called synchronously within
  // this click handler, so the gesture requirement holds.
  function onPickLocal(): void {
    void (async () => {
      try {
        const handle = await pickSnapshotFile();
        if (handle === null) return; // picker cancelled
        await activateLocal(handle);
      } catch (error) {
        if (!deferProgrammerError(error)) logError(error, { operation: "load-local-snapshot" });
      } finally {
        setLocalState(getSnapshotState());
      }
    })();
  }

  // One-click re-grant (user gesture): re-request read permission on the persisted
  // handle, then load. requestPermission runs synchronously inside regrantSnapshot
  // within this click, preserving the gesture.
  function onRegrantLocal(): void {
    void (async () => {
      try {
        const ok = await regrantSnapshot();
        if (!ok) return;
        const handle = getCurrentSnapshotHandle();
        if (handle) await activateLocal(handle);
      } catch (error) {
        if (!deferProgrammerError(error)) logError(error, { operation: "regrant-local-snapshot" });
      } finally {
        setLocalState(getSnapshotState());
      }
    })();
  }

  // Startup restore: once per mount, restore the persisted handle picker-free.
  // `granted` → load immediately (still prompts for the passphrase if encrypted,
  // since the passphrase is never persisted). `prompt` → surface the re-grant
  // affordance (no auto-prompt; permission needs a gesture). Otherwise fall
  // through to the auth/demo tiers untouched.
  useEffect(() => {
    if (!LOCAL_ENABLED) return;
    let cancelled = false;
    void (async () => {
      try {
        const s = await restoreSnapshotHandle();
        if (cancelled) return;
        setLocalState(s);
        if (s === "granted") {
          const handle = getCurrentSnapshotHandle();
          if (handle) await activateLocal(handle);
        }
      } catch (error) {
        if (!deferProgrammerError(error)) logError(error, { operation: "restore-local-snapshot" });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Focus reload: when the local tier is active, a window focus re-checks the
  // on-disk file and, if it changed externally, re-reads + merges so unchanged
  // panels keep identity. Read-only — no write-back. The listener is added once
  // (gated by the flag) and checks localActiveRef at fire-time; it reuses the
  // session passphrase and never persists it.
  useEffect(() => {
    if (!LOCAL_ENABLED) return;
    const onFocus = (): void => {
      if (!localActiveRef.current) return;
      const handle = getCurrentSnapshotHandle();
      if (handle === null) return;
      void (async () => {
        try {
          const changed = await hasExternallyChanged(handle); // in-flight guarded
          if (!changed) return;
          const bytes = await readSnapshotBytes(handle);
          let next: { data: PanelData; computedAt: Date };
          if (isEncrypted(bytes)) {
            const pw = passphraseRef.current;
            if (pw === null) return; // no session passphrase to reuse — skip silently
            next = await loadSnapshotPanelData(bytes, pw);
          } else {
            next = decodeSnapshot(new TextDecoder().decode(bytes));
          }
          setState((prev) => {
            if (prev.tier !== "local") return prev;
            const merged = mergePanelData(prev.data, next.data);
            if (merged === prev.data && prev.computedAt.getTime() === next.computedAt.getTime()) {
              return prev; // nothing changed — preserve identity for the bailout
            }
            return { tier: "local", data: merged, computedAt: next.computedAt };
          });
        } catch (error) {
          if (!deferProgrammerError(error)) logError(error, { operation: "focus-reload-local" });
        }
      })();
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  // Shared owner-tier fetch: the five-collection parallel Firestore read. Closes
  // over the module-import `db`/`NAMESPACE`; re-created each render, but only ever
  // referenced inside effects below, so the identity churn is harmless.
  async function loadPanelData(currentUser: User): Promise<PanelData> {
    const [samples, reminders, queueMetrics, issueSamples, topicUsage, projectSignals] = await Promise.all([
      getOwnerSamples(db, NAMESPACE, currentUser),
      getOwnerReminders(db, NAMESPACE, currentUser),
      getOwnerQueueMetrics(db, NAMESPACE, currentUser),
      getOwnerIssueSamples(db, NAMESPACE, currentUser),
      getOwnerTopicUsage(db, NAMESPACE, currentUser),
      getOwnerProjectSignals(db, NAMESPACE, currentUser),
    ]);
    return { samples, reminders, queueMetrics, issueSamples, topicUsage, projectSignals };
  }

  // Five-collection parallel Firestore load for the owner tier, with the
  // auth-change race guard (ports main.ts's refresh()). A null user paints demo;
  // an `ignore` flag set by cleanup keeps a stale in-flight load (success OR
  // error) from clobbering newer state after the user changes.
  useEffect(() => {
    // An active local tier owns the view — never let an auth change (including a
    // null user) overwrite it with demo/owner. Read the ref synchronously.
    if (LOCAL_ENABLED && localActiveRef.current) return;
    if (user === null) {
      setState({ tier: "demo" });
      return;
    }
    let ignore = false;
    void (async () => {
      try {
        const data = await loadPanelData(user);
        // Auth may have changed while the calls were in flight — skip so the
        // in-flight result does not clobber the already-updated view.
        if (ignore) return;
        // The local tier may have activated while this owner load was in flight
        // (returning user with cached auth + a granted handle). `ignore` only
        // covers auth-change/unmount, so guard the active local tier here too.
        if (LOCAL_ENABLED && localActiveRef.current) return;
        setState({ tier: "owner", data });
      } catch (error) {
        // Same race guard on the error path.
        if (ignore) return;
        if (LOCAL_ENABLED && localActiveRef.current) return;
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

  // Periodic owner-tier refresh. Re-reads the five collections every
  // REFRESH_INTERVAL_MS and merges via mergePanelData (which preserves stable
  // references for unchanged collections, so the memoized panels above only
  // rebuild when their data actually changed). Separate from the mount load and
  // the 60s `now` tick. Refresh error policy DIVERGES from mount: a transient
  // failure must not blow away last-good data or flip to the error tier.
  useEffect(() => {
    if (LOCAL_ENABLED && localActiveRef.current) return;
    if (user === null) return;
    let cancelled = false;
    let inFlight = false;
    const id = setInterval(() => {
      if (inFlight) return; // skip a tick while the prior fetch is unresolved
      inFlight = true;
      void (async () => {
        try {
          const next = await loadPanelData(user);
          if (cancelled) return; // unmount or user change happened mid-fetch
          setState((prev) => {
            if (prev.tier !== "owner") return prev; // don't resurrect owner over demo/error
            const merged = mergePanelData(prev.data, next);
            return merged === prev.data ? prev : { tier: "owner", data: merged };
          });
        } catch (error) {
          // Log and leave existing state in place — retain last-good.
          if (cancelled) return;
          if (!deferProgrammerError(error)) {
            logError(error, { operation: "refresh-owner-data" });
          }
        } finally {
          inFlight = false;
        }
      })();
    }, REFRESH_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
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
      // Demo tier is unauthenticated; the topic-usage list rule requires auth, so
      // there is no demo source — the panel renders empty.
      topicUsage: getDemoTopicUsage(),
      projectSignals: getDemoProjectSignals(),
    }),
    [],
  );

  // Resolve the active panel data for demo / owner. (The error tier returns
  // early below; these hooks still run unconditionally to satisfy rules-of-hooks.)
  const data = state.tier === "owner" || state.tier === "local" ? state.data : demoData;
  const { samples, reminders, queueMetrics, issueSamples, topicUsage, projectSignals } = data;

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
  // topic-usage) carry "panel-grid-full" on their own root — exactly as the vanilla
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
  const topicUsageEl = useMemo(
    () => <TopicUsagePanel docs={topicUsage} className="panel-grid-full" />,
    [topicUsage],
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

  // The intention tree is the project's single hierarchy — identical for every
  // viewer, build-time data with no Firestore/owner tier and no time dependence —
  // so it is built once here, never threaded through the owner Promise.all or
  // PanelData. Rendered full-width like history/backlog/topic-usage.
  const intentionTreeEl = useMemo(
    () => <IntentionTreePanel view={getDemoIntentionTree()} className="panel-grid-full" />,
    [],
  );

  // Local-snapshot controls. Rendered here (not in the Nav) so App.tsx /
  // NavControls.tsx and their e2e auth DOM stay untouched. Surfaced in BOTH the
  // error-tier return and the main return so a signed-in non-owner (who lands in
  // the error tier) can still load a local snapshot — the local tier bypasses the
  // auth requirement entirely. The whole block folds away when LOCAL_ENABLED is
  // false (AC#5).
  const localControlsEl = LOCAL_ENABLED && isSnapshotSupported() && (
    <div className="local-snapshot-controls">
      <button type="button" id="load-local-snapshot" onClick={onPickLocal}>
        Load local snapshot
      </button>
      {localState === "prompt" && (
        <button type="button" id="regrant-local-snapshot" onClick={onRegrantLocal}>
          Re-grant access
        </button>
      )}
    </div>
  );

  if (state.tier === "error") {
    return (
      <>
        {localControlsEl}
        <p className="error" role="alert">
          Couldn&apos;t load your queue. Please try again.
        </p>
      </>
    );
  }

  if (state.tier !== "demo" && state.tier !== "owner" && state.tier !== "local") {
    // Exhaustiveness guard (mirrors app-view.ts's `never` check).
    const _exhaustive: never = state;
    throw new Error("unhandled ViewState tier: " + String(_exhaustive));
  }

  return (
    <>
      {localControlsEl}
      {LOCAL_ENABLED && state.tier === "local" && (
        <p className="local-snapshot-banner" role="status">
          Read-only snapshot — computed {state.computedAt.toLocaleString()}.
        </p>
      )}
      {state.tier === "demo" && (
        <p className="demo-banner" role="status">
          Demo data — sign in to see your queue.
        </p>
      )}
      {/* Panel order matches the vanilla PANELS registry:
          capacity, pace, history, backlog, topic-usage, reminders, queue-metrics,
          parked; plus the build-time intention tree (full-width, appended last). */}
      <div className="panel-grid">
        {capacityEl}
        {paceEl}
        {historyEl}
        {backlogEl}
        {topicUsageEl}
        {remindersEl}
        {queueEl}
        {parkedEl}
        {intentionTreeEl}
        {projectSignalsEl}
      </div>
    </>
  );
}
