/**
 * A single navigation link. Framework-agnostic — this module imports nothing
 * (no React), so both React consumers (the `Nav` component, blog) and vanilla
 * web-component consumers (`@commons-systems/components/nav`) can share one
 * `NavLink` definition without dragging React/JSX into a non-JSX build.
 */
export interface NavLink {
  href: string;
  label: string;
  align?: "end";
}
