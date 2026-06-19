import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { User } from "firebase/auth";
import { Admin } from "./Admin.tsx";

// String-returning bridge over the React Admin component. The driver
// (create-blog-app.ts) consumes renderAdmin's signature unchanged; this file
// stays a .ts module (its importers reference `./pages/admin`) so the component
// is instantiated via createElement rather than JSX, which TypeScript only
// parses in .tsx files.
export function renderAdmin(user: User | null, isAdmin: boolean, skippedCount = 0): string {
  return renderToStaticMarkup(createElement(Admin, { user, isAdmin, skippedCount }));
}
