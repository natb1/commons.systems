import type { User } from "firebase/auth";

export interface AdminProps {
  user: User | null;
  isAdmin: boolean;
  skippedCount?: number;
}

/**
 * Admin page rendering for all three states: signed-out, signed-in-not-admin,
 * and admin. React auto-escapes text children — displayName/email are passed
 * raw (no pre-escaping), so user-supplied content is safely rendered without
 * double-escaping.
 */
export function Admin({ user, isAdmin, skippedCount = 0 }: AdminProps) {
  if (!user) {
    return (
      <>
        <h2>Admin</h2>
        <p>Sign in with your GitHub account to access admin features.</p>
      </>
    );
  }
  if (!isAdmin) {
    return (
      <>
        <h2>Admin</h2>
        <p id="not-authorized">You are not authorized to access admin features.</p>
      </>
    );
  }
  return (
    <>
      <h2>Admin</h2>
      {skippedCount > 0 && (
        <p className="warning">Warning: {skippedCount} post(s) have missing required fields.</p>
      )}
      <p>Signed in as <strong>{user.displayName ?? user.email ?? "Unknown"}</strong>.</p>
    </>
  );
}
