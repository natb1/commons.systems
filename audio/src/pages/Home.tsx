import type { User } from "../auth.js";

export interface HomeProps {
  user: User | null;
}

/**
 * Library page — STUB for Unit 2. The full body (anon notice, library regions,
 * rows, cache section) lands in Unit 3. The `<h2>Library</h2>` is required now so
 * navigation / responsive e2e specs pass.
 */
export function Home(props: HomeProps) {
  void props.user;
  return <h2>Library</h2>;
}
