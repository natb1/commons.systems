# Published Claude Artifacts

Applies to any page deployed to claude.ai by the Artifact tool. The full
practice is recorded on `strategy-owned-web-platform` (the "what does managing
one as a production deliverable actually require" clarification); this rule is
the working loop. Each artifact's live URL is recorded on the intention node or
doc that owns the surface — republishing without passing that `url` mints a
second artifact and orphans the live one.

## The committed source is the baseline, never the live page

Start every change from the version-controlled source. Never `Artifact read` the
live page and edit that as the starting point: the published page is an output,
and a change made only there is lost work.

Before deploying, `Artifact read` the live URL as a **drift check** — the tool
requires the read anyway, and content that differs from the committed source
means someone published out-of-band. Reconcile that into the repo as its own
commit before deploying; do not silently overwrite it and do not fold it into an
unrelated change.

## Preview from a second artifact, never from the live one

Publish in-progress work to a separate preview artifact, so the live page never
shows unreviewed work and several changes can be staged before one deploy. Build
the preview from the branch's source; pass the preview's own `url` so it updates
in place.

## Deploy after merge, so the deployed page reflects main

CI cannot publish — the Artifact tool exists only inside a Claude session — so
deploying is a session action, and it is part of the work, not a follow-up.
After the PR merges: check out main, `Artifact read` the live URL (drift check
above), publish the merged source passing the live `url`, and confirm the
returned URL is unchanged. A merged PR whose artifact is not deployed leaves the
deployed page behind main.

Omit `favicon` and `contract` on a redeploy — both carry forward, and moving the
contract pin is a deliberate gesture, never a side effect of editing.
