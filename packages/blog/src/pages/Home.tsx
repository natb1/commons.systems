import { Fragment } from "react";
import { Card } from "@commons-systems/ds";
import { formatUtcDate } from "../date.ts";
import type { PostContent } from "../marked-config.ts";
import type { PostMeta } from "../post-types.ts";

export interface PostArticleProps {
  post: PostMeta;
  postLinkPrefix: string;
  content?: PostContent;
}

/**
 * Extract a human-readable label for a syndication link. The visible text is
 * cosmetic (the u-syndication microformat carries meaning via the href), so a
 * malformed URL falls back to the raw string rather than crashing the render.
 */
function syndicationLabel(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

/**
 * One post in the home feed. The wrapper is a ds Card rendered as <article> so
 * it keeps the hydrator-queried id="post-{id}". The inner structure (post-link
 * anchor, post-title span, time, post-content div) stays as raw elements so the
 * exact selectors hydrateHome relies on survive verbatim.
 *
 * IndieWeb h-entry microformats are layered on additively — h-entry on the
 * Card, u-url on the permalink anchor, p-name on the title span, dt-published
 * on the <time>, e-content on the content div — never renaming or removing the
 * hydrator's selectors (post-link, post-title, #post-{id}, #post-content-{id}).
 * When a post carries syndication URLs, an "Also posted at" block of
 * u-syndication links renders as a sibling inside the Card, after the content
 * div, so the #post-content-{id} div's identity is untouched.
 *
 * React auto-escapes text children, so titles are passed raw — never pre-escaped
 * (double-escaping would corrupt them). The only raw-HTML path is content.html,
 * inlined via dangerouslySetInnerHTML.
 */
export function PostArticle({ post, postLinkPrefix, content }: PostArticleProps) {
  const displayTitle = content?.title ?? post.title;
  return (
    <Card as="article" id={`post-${post.id}`} className="h-entry">
      <h2>
        <a href={`${postLinkPrefix}${post.id}`} className="post-link u-url">
          <span className="post-title p-name">{displayTitle}</span>
        </a>
        {!post.published && (
          <>
            {" "}
            <span className="draft-badge">[draft]</span>
          </>
        )}
      </h2>
      {post.publishedAt && (
        <time className="dt-published" dateTime={post.publishedAt}>
          {formatUtcDate(post.publishedAt)}
        </time>
      )}
      {content ? (
        <div
          id={`post-content-${post.id}`}
          className="e-content"
          data-hydrated=""
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: content.html }}
        />
      ) : (
        <div id={`post-content-${post.id}`} className="e-content" suppressHydrationWarning>
          <p>Loading...</p>
        </div>
      )}
      {post.syndication && post.syndication.length > 0 && (
        <p className="post-syndication">
          Also posted at{" "}
          {post.syndication.map((url, i) => (
            <Fragment key={url}>
              {i > 0 && ", "}
              <a rel="syndication" className="u-syndication" href={url}>
                {syndicationLabel(url)}
              </a>
            </Fragment>
          ))}
        </p>
      )}
    </Card>
  );
}

export interface PostFeedProps {
  posts: PostMeta[];
  postLinkPrefix: string;
  contentMap?: Record<string, PostContent>;
}

/**
 * The home feed: the #posts container the hydrator queries, mapping over posts
 * with an <hr> separator between successive articles (matching the live feed's
 * prior visible output).
 */
export function PostFeed({ posts, postLinkPrefix, contentMap }: PostFeedProps) {
  return (
    <div id="posts">
      {posts.map((post, i) => (
        <Fragment key={post.id}>
          {i > 0 && <hr />}
          <PostArticle
            post={post}
            postLinkPrefix={postLinkPrefix}
            content={contentMap?.[post.id]}
          />
        </Fragment>
      ))}
    </div>
  );
}

/** Empty-feed state. */
export function EmptyFeed() {
  return (
    <>
      <h2>Home</h2>
      <p>No posts yet.</p>
    </>
  );
}
