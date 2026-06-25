import type { ViewFrame } from "./view.js";
import { Viewer } from "../viewer/Viewer.js";

function BackLink() {
  return (
    <a href="/" className="viewer-back">
      &larr; Back to Library
    </a>
  );
}

export function ViewPage({ frame }: { frame: ViewFrame }) {
  switch (frame.kind) {
    case "ready":
      return <Viewer {...frame.props} />;
    case "error":
      return (
        <>
          <h2>Error</h2>
          <p id="view-error">Could not load this media item. Try refreshing the page.</p>
          <BackLink />
        </>
      );
    case "noId":
      return (
        <>
          <h2>Not Found</h2>
          <p id="view-not-found">No media item specified.</p>
          <BackLink />
        </>
      );
    case "notFound":
      return (
        <>
          <h2>Not Found</h2>
          <p id="view-not-found">Media item not found.</p>
          <BackLink />
        </>
      );
  }
}
