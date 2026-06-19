// The React shell. Composes the ds Nav (with AuthControls in its `end` slot),
// the hero island, the per-route body, and the footer. The client router lives
// in use-router.ts; the data/crypto/file-sync orchestration lives in
// use-app-state.ts. "/" (Budgets) and /transactions are real React pages; the
// remaining routes are still legacy string renderers wrapped in <LegacyRoute>.
import { AppShell } from "./AppShell.js";
import { AuthControls } from "./AuthControls.js";
import { Hero } from "./Hero.js";
import { LegacyRoute } from "./LegacyRoute.js";
import { useAppState } from "./use-app-state.js";
import { useRouter } from "./use-router.js";
import type { HydrationSpec } from "./legacy-hydrate.js";
import type { RenderPageOptions } from "./pages/render-options.js";
import { Budgets } from "./pages/Budgets.js";
import { Transactions } from "./pages/Transactions.js";
import { renderAccounts } from "./pages/accounts.js";
import { renderAccountsReconcile } from "./pages/accounts-reconcile.js";
import { renderRules } from "./pages/rules.js";
import { hydrateRulesTable } from "./pages/rules-hydrate.js";
import { hydrateAccountsCharts } from "./pages/accounts-hydrate.js";
import { hydrateAccountsReconcile } from "./pages/accounts-reconcile-hydrate.js";

interface RouteDef {
  path: string;
  render: (o: RenderPageOptions) => Promise<string | null>;
  specs: HydrationSpec[];
}

// "/" (budgets) and /transactions are real React pages (Units 2-4 / Unit 3),
// not <LegacyRoute>s; they live outside ROUTES but are still known paths for
// routing + Nav `current`. Budgets is also the unknown-path fallback (it was
// ROUTES[0] in the legacy router's `?? ROUTES[0]` fall-through).
const BUDGETS_PATH = "/";
const TRANSACTIONS_PATH = "/transactions";

// LegacyRoute-backed routes mirror main.ts:132-136 (minus "/" and
// /transactions, now React pages), with per-route hydration specs from
// main.ts:182-191.
const ROUTES: RouteDef[] = [
  {
    path: "/accounts",
    render: renderAccounts,
    specs: [
      { selector: "#accounts-trend-chart", hydrate: hydrateAccountsCharts, errorLabel: "Chart rendering" },
    ],
  },
  {
    path: "/accounts/reconcile",
    render: renderAccountsReconcile,
    specs: [
      { selector: "#reconcile-container", hydrate: hydrateAccountsReconcile },
    ],
  },
  {
    path: "/rules",
    render: renderRules,
    specs: [
      { selector: "#rules-table", hydrate: hydrateRulesTable },
    ],
  },
];

// Known paths preserve the legacy nav ordering from main.ts:132-136:
// budgets ("/"), then /transactions, then the LegacyRoute paths.
const KNOWN_PATHS = [BUDGETS_PATH, TRANSACTIONS_PATH, ...ROUTES.map((r) => r.path)];

export function App() {
  const app = useAppState();
  const path = useRouter(KNOWN_PATHS);

  const isTransactions = path === TRANSACTIONS_PATH;
  const legacyRoute = ROUTES.find((r) => r.path === path);
  // The legacy router fell back to ROUTES[0] (budgets) for an unknown path. Now
  // budgets is a React page, so "/" AND any unknown path (not /transactions, not
  // a LegacyRoute) render the React Budgets page — it is the JSX fallback below.
  const currentPath = isTransactions ? TRANSACTIONS_PATH : (legacyRoute?.path ?? BUDGETS_PATH);

  return (
    <AppShell
      current={currentPath}
      navEnd={<AuthControls {...app} />}
      hero={<Hero hidden={app.state.source === "local"} />}
    >
      {/* Keyed by path AND navEpoch: a fresh instance per link navigation
          (path change) AND per data transition (navEpoch bump), so the body
          re-resolves against the current data source — exactly what legacy's
          trailing router.navigate() did. Each instance still renders once, so
          the render-once invariant holds.

          "/" (Budgets, Unit 4) and /transactions (Transactions, Unit 3) are real
          React pages — same keying so a same-path data transition re-mounts them
          and re-resolves; renderOptions() is read at mount and also calls
          setActiveDataSource for the route, matching how LegacyRoute is fed. The
          remaining three routes stay legacy.

          Gated on app.initialized: initialize() always ends with a transition()
          that bumps navEpoch 0→1, which would unmount-then-remount a body
          rendered eagerly at navEpoch=0 and wipe its just-hydrated chart/table.
          Holding the body until initialize settles mounts it exactly once at
          navEpoch=1 — matching legacy's single post-initialize router.navigate().
          The AppShell/nav/header/footer/hero still render immediately. */}
      {!app.initialized ? null : isTransactions ? (
        <Transactions
          key={`${TRANSACTIONS_PATH}:${app.navEpoch}`}
          options={app.renderOptions()}
        />
      ) : legacyRoute ? (
        <LegacyRoute
          key={`${legacyRoute.path}:${app.navEpoch}`}
          render={() => legacyRoute.render(app.renderOptions())}
          specs={legacyRoute.specs}
        />
      ) : (
        <Budgets
          key={`${BUDGETS_PATH}:${app.navEpoch}`}
          options={app.renderOptions()}
        />
      )}
    </AppShell>
  );
}
