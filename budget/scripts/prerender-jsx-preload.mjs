// tsx (v4) executes .tsx via esbuild's classic JSX runtime and does not apply
// the tsconfig `jsx: "react-jsx"` automatic runtime for this build, so every
// JSX module (this script, AppShell, the ds Nav) compiles to bare
// React.createElement calls that need `React` in scope. Rather than add an
// otherwise-unused `import React` to each shared module (which the app's
// react-jsx tsc build would flag as unused), expose React globally for the
// prerender process only.
import React from "react";
globalThis.React = React;
