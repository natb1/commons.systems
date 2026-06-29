import type { User } from "firebase/auth";
import { Admin } from "./Admin.tsx";

export interface AdminRegionProps {
  user: User | null;
  isAdmin: boolean;
  skippedCount?: number;
}

/**
 * The /admin body, the React replacement for the legacy renderAdmin bridge. A
 * thin pass-through over the frozen presentational <Admin>, created for symmetry
 * with the other Region components so Unit 3's driver mounts <AdminRegion .../>
 * rather than the bare <Admin/>.
 *
 * PURE and fully prop-driven — no effect, no async. The `isInGroup` admin check
 * stays in the driver (a later unit) and arrives via the `isAdmin` prop; the
 * `id="not-authorized"` marker comes from <Admin> for free.
 */
export function AdminRegion({ user, isAdmin, skippedCount }: AdminRegionProps) {
  return <Admin user={user} isAdmin={isAdmin} skippedCount={skippedCount} />;
}
