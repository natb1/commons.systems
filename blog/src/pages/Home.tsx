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
 * One post in the home feed. The wrapper is a ds Card rendered as <article> so
 * it keeps the hydrator-queried id="post-{id}". The inner structure (post-link
 * anchor, post-title span, time, post-content div) stays as raw elements so the
 * exact selectors hydrateHome relies on survive verbatim.
 *
 * React auto-escapes text children, so titles are passed raw — never pre-escaped
 * (double-escaping would corrupt them). The only raw-HTML path is content.html,
 * inlined via dangerouslySetInnerHTML.
 */
export function PostArticle({ post, postLinkPrefix, content }: PostArticleProps) {
  const displayTitle = content?.title ?? post.title;
  return (
    <Card as="article" id={`post-${post.id}`}>
      <h2>
        <a href={`${postLinkPrefix}${post.id}`} className="post-link">
          <span className="post-title">{displayTitle}</span>
        </a>
        {!post.published && (
          <>
            {" "}
            <span className="draft-badge">[draft]</span>
          </>
        )}
      </h2>
      {post.publishedAt && (
        <time dateTime={post.publishedAt}>{formatUtcDate(post.publishedAt)}</time>
      )}
      {content ? (
        <div
          id={`post-content-${post.id}`}
          data-hydrated=""
          dangerouslySetInnerHTML={{ __html: content.html }}
        />
      ) : (
        <div id={`post-content-${post.id}`}>
          <p>Loading...</p>
        </div>
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
