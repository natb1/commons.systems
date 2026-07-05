// React port of the vanilla app render pipeline: the ViewState tier dispatch
// (app-view.ts), the responsive panel grid + full-width registry (app-view.ts),
// the read-only local-snapshot load (owner data now comes from an on-disk
// snapshot, not Firestore), and the single 60s tick that recomputes only the
// time-sensitive panels (app-controller.ts + AppView.tick).
//
// Auth no longer drives this component: the demo tier is the unauthenticated
// default, and the owner sees their real queue by loading a local snapshot. The
// `onAuthStateChanged` subscription + sign-in control stay in the App shell /
// NavControls; Dashboard takes no `user` prop.
import { useEffect, useMemo, useRef, useState } from "react";

import { deferProgrammerError } from "@commons-systems/errorutil/defer";
import { logError } from "@commons-systems/errorutil/log";

import { getDemoReminders, getDemoQueueMetrics } from "./data.js";
import { getDemoIntentionTree } from "./intention-tree.js";
import { getDemoSamples } from "./usage-data.js";
import { getDemoIssueSamples } from "./issue-data.js";
import { getDemoTopicUsage } from "./topic-usage-data.js";
import { getDemoProjectSignals } from "./project-signals-data.js";

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

type ViewState =
  | { tier: "demo" } // unauthenticated default → labeled demo
  | { tier: "local"; data: PanelData; computedAt: Date } // read-only on-disk snapshot
  | { tier: "error" }; // snapshot decode/load failed

export function Dashboard() {
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

  // ---- LOCAL snapshot tier ------------------------------------------------
  // ALL local orchestration lives here in Dashboard: it owns the `local`
  // ViewState tier, the startup restore, and the focus-reload merge lifecycle.
  // Dashboard renders its own picker / re-grant controls, so App.tsx and
  // NavControls.tsx (and their e2e auth DOM) are untouched.
  //
  // `localActiveRef` is set imperatively alongside `setState({tier:"local"})`.
  // The focus-reload effect below reads it synchronously to skip firing before a
  // snapshot has been activated.
  const localActiveRef = useRef(false);
  // Session-held passphrase for focus-reload decryption. NEVER persisted — held
  // only in this ref for the lifetime of the tab, cleared on a fresh load.
  const passphraseRef = useRef<string | null>(null);
  const [localState, setLocalState] = useState<SnapshotSourceState>(() =>
    getSnapshotState(),
  );

  // Decode already-read snapshot bytes into PanelData + computedAt, prompting for
  // a passphrase only when the file is encrypted (snapshots are expected
  // encrypted; the unencrypted branch is a guard). On success, binds the tier and
  // remembers the passphrase for focus-reload. Returns false when the user
  // cancels the passphrase prompt (so a restore can fall through untouched). On a
  // decode/load THROW, flips to the error tier (so a failed load surfaces the
  // picker / re-grant controls) and re-throws so the caller still logs it.
  async function activateLocal(handle: FileSystemFileHandle): Promise<boolean> {
    let result: { data: PanelData; computedAt: Date };
    try {
      const bytes = await readSnapshotBytes(handle);
      if (isEncrypted(bytes)) {
        const pw = await promptPassword("Enter the snapshot passphrase to decrypt.");
        if (pw === null) return false; // cancelled — leave existing tier in place
        result = await loadSnapshotPanelData(bytes, pw);
        passphraseRef.current = pw;
      } else {
        result = decodeSnapshot(new TextDecoder().decode(bytes));
        passphraseRef.current = null;
      }
    } catch (error) {
      // Only surface the error tier on a first-time/startup failure. When a local
      // view is already active, a failed re-pick/re-grant retains the last-good
      // snapshot in place (matching the focus-reload retain-last-good catch above),
      // so a transient re-load error does not wipe an already-rendered dashboard.
      if (!localActiveRef.current) setState({ tier: "error" });
      throw error;
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
  // and checks localActiveRef at fire-time; it reuses the session passphrase and
  // never persists it.
  useEffect(() => {
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

  // Resolve the active panel data for demo / local. (The error tier returns
  // early below; these hooks still run unconditionally to satisfy rules-of-hooks.)
  const data = state.tier === "local" ? state.data : demoData;
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
  // viewer, build-time data with no data tier and no time dependence — so it is
  // built once here, never threaded through PanelData. Rendered full-width like
  // history/backlog/topic-usage.
  const intentionTreeEl = useMemo(
    () => <IntentionTreePanel view={getDemoIntentionTree()} className="panel-grid-full" />,
    [],
  );

  // Local-snapshot controls. Rendered here (not in the Nav) so App.tsx /
  // NavControls.tsx and their e2e auth DOM stay untouched. Surfaced in BOTH the
  // error-tier return and the main return so that after a failed load the user
  // can still re-pick or re-grant a local snapshot.
  const localControlsEl = isSnapshotSupported() && (
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

  if (state.tier !== "demo" && state.tier !== "local") {
    // Exhaustiveness guard (mirrors app-view.ts's `never` check).
    const _exhaustive: never = state;
    throw new Error("unhandled ViewState tier: " + String(_exhaustive));
  }

  return (
    <>
      {localControlsEl}
      {state.tier === "local" && (
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
