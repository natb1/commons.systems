import "missing.css";
import "@commons-systems/ds/tokens/colors.css";
import "@commons-systems/ds/tokens/typography.css";
import "@commons-systems/ds/tokens/spacing.css";
import "@commons-systems/ds/tokens/effects.css";
// Side-effect import: initializes the Firebase app, Firestore client,
// analytics, and the error-log sink before the app renders. No UI reads
// its bindings yet — the notes board (a later tactic) is the first
// consumer.
import "./firebase.js";
import { createRoot } from "react-dom/client";
import { App } from "./App.js";

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("#root element not found");
}
createRoot(rootElement).render(<App />);
