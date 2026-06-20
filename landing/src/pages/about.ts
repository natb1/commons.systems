export function renderAboutHtml(): string {
  return `
    <h2>About</h2>
    <p>I'm Nathan Buesgens, an independent contractor. Most business software comes with a standing dependency — on the vendor that licenses it, the platform that hosts it, or the consultants who keep it running. I build software your business owns and runs on its own, and I train your team to maintain and extend it. When the engagement ends, the capability stays with you: your team can keep building, with or without me.</p>
    <p>One person handles contracting, project management, and the build. The person you give requirements to is the person who writes the code — no account manager in between, and no team to onboard. That sets the scope honestly: the work fits what one person can build and hand off well, not an open-ended platform you would come to depend on.</p>
    <h3>What an engagement delivers</h3>
    <ul class="about-deliverables">
      <li><strong>A capability, not a dependency.</strong> When the engagement ends, your team can maintain and extend the work without me. You finish able to run it yourselves.</li>
      <li><strong>Your data stays yours.</strong> Your team manages your environment; I give them the software and the skills to run it. There is no account, server, or data on my side — the engagement leaves nothing of yours with me.</li>
      <li><strong>No transformation, no migration.</strong> A business transformation or a platform migration is never a prerequisite. We make a plan that prioritizes pragmatism over platforms.</li>
      <li><strong>Deliberate third-party dependencies.</strong> I give an honest, unbiased evaluation of third-party technology so you stay in control of your stack — including where the honest answer is to keep a dependency you already have.</li>
    </ul>
    <p>This project's software is open source. Working with me directly, your business can request custom software and gain the in-house skills to adopt and adapt it.</p>
    <p>Contracts are written as a simple retainer. Work is scoped to the size of the retainer, with no long-term commitment.</p>
  `;
}

export function renderAboutPanelHtml(): string {
  return `
    <section class="panel-section profile-card">
      <img class="profile-photo" src="/nathan.jpg" alt="Nathan Buesgens" width="240" height="240">
      <p class="profile-name">Nathan Buesgens</p>
      <p class="profile-location">Baltimore, MD</p>
      <div class="profile-cta">
        <p class="profile-cta-prompt">Email me directly — you'll reach the person who will build your software.</p>
        <a class="profile-cta-link" href="mailto:nathan@natb1.com">nathan@natb1.com</a>
      </div>
    </section>
  `;
}
