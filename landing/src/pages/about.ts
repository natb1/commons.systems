export function renderAboutHtml(): string {
  return `
    <h2>About</h2>
    <p>I'm Nathan Buesgens, an independent contractor. Most business software comes with a standing dependency — on the vendor that licenses it, the platform that hosts it, or the consultants who keep it configured. I build software your business owns and runs on its own, and I train your team to extend it after the engagement ends.</p>
    <p>One person handles contracting, project management, and the build. The person you give requirements to is the person who writes the code — no account manager in between, and no team to bring up to speed on how your business works.</p>
    <h3>What an engagement delivers</h3>
    <ul class="about-deliverables">
      <li><strong>Documented for handoff.</strong> Every deliverable includes the documentation your team needs to change the software as your requirements change.</li>
      <li><strong>Your data stays yours.</strong> The software runs on infrastructure you control. I never have access to your private data.</li>
      <li><strong>No migration to adopt it.</strong> Putting it in place is not a business transformation or a move onto a new platform — and neither is keeping it running.</li>
      <li><strong>Minimal third-party dependencies.</strong> Fewer outside services means fewer vendors who can change pricing or terms on you later.</li>
      <li><strong>A capability, not a dependency.</strong> When the engagement ends, your team can maintain and extend the work without me.</li>
    </ul>
    <p>This project's software is open source. A business with the right skills in-house can adopt and adapt it directly, at no cost — that path is always open. A contract is the faster route: I build for your specific requirements and hand the result to your team, so you reach that independence in weeks rather than standing up the capability from scratch.</p>
    <p>Contracts are written as a simple retainer. Work is scoped to the size of the retainer, with no long-term commitment on either side.</p>
  `;
}

export function renderAboutPanelHtml(): string {
  return `
    <section class="panel-section profile-card">
      <img class="profile-photo" src="/nathan.jpg" alt="Nathan Buesgens" width="240" height="240">
      <p class="profile-name">Nathan Buesgens</p>
      <p class="profile-location">Baltimore, MD</p>
      <div class="profile-cta">
        <p class="profile-cta-prompt">Considering a project? Email me directly — you'll reach the person who would build it.</p>
        <a class="profile-cta-link" href="mailto:nathan@natb1.com">nathan@natb1.com</a>
      </div>
    </section>
  `;
}

export function mountAboutPanel(panel: HTMLElement): void {
  const fragment = document.createRange().createContextualFragment(renderAboutPanelHtml());
  panel.replaceChildren(fragment);
}
