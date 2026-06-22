export function About() {
  return (
    <>
      <h2>About</h2>
      <p>I'm Nathan Buesgens, an independent contractor. Most business software comes with a standing dependency — on the vendor that licenses it, the platform that hosts it, or the consultants who keep it running. When I build software I deliver it with the capability for your team to keep building.</p>
      <p>One person handles contracting, project management, and the build. The person you give requirements to is the person who writes the code — no middlemen, no team to onboard. Scope is set with honesty based on what I can build and hand off well, rather than an open-ended platform or service commitment.</p>
      <h3>What an engagement delivers</h3>
      <ul className="about-deliverables">
        <li><strong>A capability, not a dependency.</strong> When the engagement ends, your team can maintain and extend the work without me.</li>
        <li><strong>Your data stays yours.</strong> Your team manages your environment; I give them the software and the skills to run it. There is no account, server, or data on my side.</li>
        <li><strong>No transformation, no migration.</strong> A business transformation or a platform migration is never a prerequisite to deliver incremental value. We make a plan that prioritizes pragmatism over platforms and open-ended roadmaps.</li>
        <li><strong>Deliberate third-party dependencies.</strong> I give an honest, unbiased evaluation of third-party technology so you stay in control of your stack — including when to adopt new platforms or keep the technology you already know.</li>
      </ul>
      <p>This project's software is open source. Working with me directly, your business can request custom software and gain the in-house skills to adopt and adapt it.</p>
      <p>Contracts are written as a simple retainer. Work is scoped to the size of the retainer, with no long-term commitment.</p>
    </>
  );
}

export function AboutPanel() {
  return (
    <section className="panel-section profile-card">
      <img className="profile-photo" src="/nathan.jpg" alt="Nathan Buesgens" width={240} height={240} />
      <p className="profile-name">Nathan Buesgens</p>
      <p className="profile-location">Baltimore, MD</p>
      <div className="profile-cta">
        <p className="profile-cta-prompt">Email me directly — you'll reach the person who will build your software.</p>
        <a className="profile-cta-link" href="mailto:nathan@natb1.com">nathan@natb1.com</a>
      </div>
    </section>
  );
}
