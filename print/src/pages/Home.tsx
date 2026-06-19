import type { User } from "../auth.js";

export interface HomeProps {
  mediaHtml: string;
  user: User | null;
}

export function Home({ mediaHtml, user }: HomeProps) {
  return (
    <>
      <h2>Library</h2>
      {!user && (
        <p id="public-notice">
          Showing public domain items. Sign in to see your full library.
        </p>
      )}
      <div dangerouslySetInnerHTML={{ __html: mediaHtml }} />
    </>
  );
}
