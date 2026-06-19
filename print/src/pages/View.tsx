import type { ViewFrame } from "./view.js";

function BackLink() {
  return (
    <a href="/" className="viewer-back">
      &larr; Back to Library
    </a>
  );
}

export function ViewPage({ frame }: { frame: ViewFrame }) {
  switch (frame.kind) {
    case "shell":
      return <div dangerouslySetInnerHTML={{ __html: frame.shellHtml }} />;
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
