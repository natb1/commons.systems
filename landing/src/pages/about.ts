export function renderAboutHtml(): string {
  return `
    <h2>About</h2>
    <p>Nathan Buesgens is an independent contractor. The apps on this site are the demonstration; this page is the offer.</p>
    <p>The contracting model is one person on both sides of the work. The person you give requirements to is the person who implements them — no handoff between an account manager and an engineering team, no translation layer between intent and code.</p>
    <p>This matters when the requirements are still moving. Requirements clarify as the system takes shape, and the round trip from "I noticed something" to "it's running" is short when one person carries both ends.</p>
    <p>The work is focused on training the AI skills a business needs to decouple itself from professional services and platform vendors — not migrating it onto a different set of platform dependencies. The goal is capability that stays with the business when the engagement ends.</p>
    <p>Contact: <a href="mailto:nathan@natb1.com">nathan@natb1.com</a>.</p>
    <p><a href="https://github.com/natb1/commons.systems/blob/main/CHARTER.md">Read the charter</a> for the full framing, or head <a href="/">back to the homepage</a>.</p>
  `;
}

export function renderAboutPanelHtml(): string {
  return `
    <section class="panel-section profile-card">
      <img class="profile-photo" src="/nathan.jpg" alt="Nathan Buesgens" width="240" height="240">
      <p class="profile-name">Nathan Buesgens</p>
      <p class="profile-location">Baltimore, MD</p>
      <p class="profile-email"><a href="mailto:nathan@natb1.com">nathan@natb1.com</a></p>
    </section>
  `;
}

export function mountAboutPanel(panel: HTMLElement): void {
  const fragment = document.createRange().createContextualFragment(renderAboutPanelHtml());
  panel.replaceChildren(fragment);
}
