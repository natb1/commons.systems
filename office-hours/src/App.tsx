import { useEffect, useState } from "react";
import type { User } from "firebase/auth";
import { Nav } from "@commons-systems/ds";
import { FOOTER_HTML } from "@commons-systems/components/footer";

import { deferProgrammerError } from "@commons-systems/errorutil/defer";
import { logError } from "@commons-systems/errorutil/log";
import { deferAppCheckInit } from "@commons-systems/firebaseutil/defer-appcheck";

import { onAuthStateChanged, initAppCheck, trackPageView } from "./firebase.js";
import { NavControls } from "./components/NavControls.js";
import { Dashboard } from "./Dashboard.js";

export function App() {
  // App owns the single onAuthStateChanged subscription and threads `user` to
  // both NavControls (auth control) and Dashboard (tier dispatch) — one source
  // of truth for auth state. office-hours has no in-app nav links, so the Nav
  // gets links={[]} and the header needs no click-interception (unlike audio).
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // office-hours' onAuthStateChanged (from createAppContext) is async — it
    // returns a Promise, NOT a sync unsubscribe (cf. audio's createAppAuth). The
    // vanilla main.ts subscribed for the app lifetime with no unsubscribe, so we
    // mirror that: no cleanup, and .catch the init Promise. The uid dedup ports
    // main.ts's `if (user?.uid === currentUser?.uid) return` — without it a
    // same-uid token refresh would re-run Dashboard's five-collection load.
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
    <div className="page">
      <header>
        <h1>Office Hours</h1>
        <Nav links={[]} end={<NavControls user={user} />} />
      </header>
      <div className="content-grid">
        <main id="app">
          <Dashboard user={user} />
        </main>
      </div>
      <footer dangerouslySetInnerHTML={{ __html: FOOTER_HTML }} />
    </div>
  );
}
