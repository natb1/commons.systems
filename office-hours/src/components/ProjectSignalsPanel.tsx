import { Metric } from "@commons-systems/ds";
import { type ProjectSignalsSnapshot } from "../project-signals.js";

export interface ProjectSignalsPanelProps {
  snapshot: ProjectSignalsSnapshot | null;
}

function scoreText(score: number | null): string {
  return score === null ? "n/a" : String(score);
}

/**
 * Dashboard panel for the project-signals snapshot: GitHub repo stats, GA4
 * analytics per app, Google Search Console headline metrics, and PSI Lighthouse
 * scores per URL.
 *
 * Each source section renders an empty state when its sub-object is absent —
 * a snapshot may carry any subset. Queue dispatch metrics (open issues, drain
 * rate, runway) live in the QUEUE panel; this panel does not duplicate them.
 */
export function ProjectSignalsPanel(props: ProjectSignalsPanelProps) {
  const { snapshot } = props;

  if (snapshot === null) {
    return (
      <section className="project-signals-section panel-grid-full">
        <h2 className="project-signals-heading">PROJECT SIGNALS</h2>
        <p className="empty">No project signals yet.</p>
      </section>
    );
  }

  const { github, ga4, gsc, psi } = snapshot;

  return (
    <section className="project-signals-section panel-grid-full">
      <h2 className="project-signals-heading">PROJECT SIGNALS</h2>
      <p className="project-signals-note">
        Dispatch queue metrics (open issues, drain rate, runway) are in the QUEUE panel above.
      </p>

      {/* GitHub */}
      <div className="project-signals-source">
        <h3 className="project-signals-source-heading">GitHub</h3>
        {github === undefined ? (
          <p className="empty">No GitHub data.</p>
        ) : (
          <div className="project-signals-cards">
            <Metric
              className="project-signals-card"
              label="stars"
              value={String(github.stars)}
            />
            <Metric
              className="project-signals-card"
              label="forks"
              value={String(github.forks)}
            />
            <Metric
              className="project-signals-card"
              label="watchers"
              value={String(github.watchers)}
            />
            {github.traffic !== undefined && (
              <>
                <Metric
                  className="project-signals-card"
                  label="clones (14d)"
                  value={String(github.traffic.clonesCount)}
                />
                <Metric
                  className="project-signals-card"
                  label="unique cloners (14d)"
                  value={String(github.traffic.clonesUniques)}
                />
                <Metric
                  className="project-signals-card"
                  label="views (14d)"
                  value={String(github.traffic.viewsCount)}
                />
                <Metric
                  className="project-signals-card"
                  label="unique viewers (14d)"
                  value={String(github.traffic.viewsUniques)}
                />
              </>
            )}
          </div>
        )}
        {/* Forks & derivatives — per-fork identity + activity for the review.
            An "active" marker (pushedAt > createdAt) is the drive-by-vs-active
            discriminator the fork-and-derivative review needs. */}
        {github !== undefined && github.forksDetail !== undefined && github.forksDetail.length > 0 && (
          <div className="project-signals-forks">
            <h4 className="project-signals-forks-heading">Forks &amp; derivatives</h4>
            <ul className="project-signals-forks-list">
              {github.forksDetail.map((fork) => {
                const active = fork.pushedAt > fork.createdAt;
                return (
                  <li key={fork.repoUrl} className="project-signals-fork">
                    <a href={fork.repoUrl} target="_blank" rel="noreferrer" className="project-signals-fork-owner">
                      {fork.owner}
                    </a>
                    <span className="project-signals-fork-dates">
                      created {fork.createdAt} · pushed {fork.pushedAt}
                    </span>
                    <span className={`project-signals-fork-activity ${active ? "is-active" : "is-drive-by"}`}>
                      {active ? "active" : "drive-by"}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>

      {/* GA4 */}
      <div className="project-signals-source">
        <h3 className="project-signals-source-heading">Analytics (GA4)</h3>
        {ga4 === undefined || ga4.length === 0 ? (
          <p className="empty">No GA4 data.</p>
        ) : (
          ga4.map((app) => (
            <div key={app.app} className="project-signals-app">
              <h4 className="project-signals-app-heading">{app.app}</h4>
              <div className="project-signals-cards">
                <Metric
                  className="project-signals-card"
                  label="page views"
                  value={String(app.pageViews)}
                />
                <Metric
                  className="project-signals-card"
                  label="sessions"
                  value={String(app.sessions)}
                />
                <Metric
                  className="project-signals-card"
                  label="bounce rate"
                  value={`${(app.bounceRate * 100).toFixed(0)}%`}
                />
              </div>
            </div>
          ))
        )}
      </div>

      {/* GSC */}
      <div className="project-signals-source">
        <h3 className="project-signals-source-heading">Search Console (GSC)</h3>
        {gsc === undefined ? (
          <p className="empty">No Search Console data.</p>
        ) : (
          <div className="project-signals-cards">
            {gsc.topQueries.length > 0 && (
              <>
                <Metric
                  className="project-signals-card"
                  label="top query"
                  value={gsc.topQueries[0].query}
                />
                <Metric
                  className="project-signals-card"
                  label="top query clicks"
                  value={String(gsc.topQueries[0].clicks)}
                />
                <Metric
                  className="project-signals-card"
                  label="top query impressions"
                  value={String(gsc.topQueries[0].impressions)}
                />
              </>
            )}
            {gsc.topPages.length > 0 && (
              <>
                <Metric
                  className="project-signals-card"
                  label="top-pages clicks (est.)"
                  value={String(gsc.topPages.reduce((s, p) => s + p.clicks, 0))}
                />
                <Metric
                  className="project-signals-card"
                  label="top-pages impressions (est.)"
                  value={String(gsc.topPages.reduce((s, p) => s + p.impressions, 0))}
                />
              </>
            )}
            {gsc.topQueries.length === 0 && gsc.topPages.length === 0 && (
              <p className="empty">No Search Console data.</p>
            )}
          </div>
        )}
      </div>

      {/* PSI */}
      <div className="project-signals-source">
        <h3 className="project-signals-source-heading">Lighthouse (PSI)</h3>
        {psi === undefined || psi.length === 0 ? (
          <p className="empty">No PSI data.</p>
        ) : (
          psi.map((entry) => (
            <div key={`${entry.url}-${entry.strategy}`} className="project-signals-url">
              <h4 className="project-signals-url-heading">
                {entry.url} ({entry.strategy})
              </h4>
              <div className="project-signals-cards">
                <Metric
                  className="project-signals-card"
                  label="performance"
                  value={scoreText(entry.performance)}
                />
                <Metric
                  className="project-signals-card"
                  label="SEO"
                  value={scoreText(entry.seo)}
                />
                <Metric
                  className="project-signals-card"
                  label="accessibility"
                  value={scoreText(entry.accessibility)}
                />
                <Metric
                  className="project-signals-card"
                  label="best practices"
                  value={scoreText(entry.bestPractices)}
                />
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
