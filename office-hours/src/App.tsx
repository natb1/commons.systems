import { useEffect, useState } from "react";
import type { User } from "firebase/auth";
import { PageShell } from "@commons-systems/ds";

import { deferProgrammerError } from "@commons-systems/errorutil/defer";
import { logError } from "@commons-systems/errorutil/log";
import { deferAppCheckInit } from "@commons-systems/firebaseutil/defer-appcheck";

import { onAuthStateChanged, initAppCheck, trackPageView } from "./firebase.js";
import { NavControls } from "./components/NavControls.js";
import { Dashboard } from "./Dashboard.js";

export function App() {
  // App owns the single onAuthStateChanged subscription and threads `user` to
  // NavControls (the auth control) — one source of truth for auth state.
  // Dashboard no longer takes `user`: it loads a read-only local snapshot rather
  // than owner data, so Auth no longer drives its data dispatch. office-hours has
  // no in-app nav links, so the Nav gets links={[]} and the header needs no
  // click-interception (unlike audio).
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // office-hours' onAuthStateChanged (from createAppContext) is async — it
    // returns a Promise, NOT a sync unsubscribe (cf. audio's createAppAuth). The
    // vanilla main.ts subscribed for the app lifetime with no unsubscribe, so we
    // mirror that: no cleanup, and .catch the init Promise. The uid dedup ports
    // main.ts's `if (user?.uid === currentUser?.uid) return` — it keeps a
    // same-uid token refresh from needlessly re-setting `user` (NavControls only).
    onAuthStateChanged((next) => {
      setUser((prev) => (prev?.uid === next?.uid ? prev : next));
    }).catch((err) => {
      if (deferProgrammerError(err)) return;
      logError(err, { operation: "auth-init" });
    });

    deferAppCheckInit(initAppCheck);
    trackPageView("/");
  }, []);

  return (
    <PageShell
      wordmark="Office Hours"
      navLinks={[]}
      navEnd={<NavControls user={user} />}
    >
      <main id="app">
        <Dashboard />
      </main>
    </PageShell>
  );
}
