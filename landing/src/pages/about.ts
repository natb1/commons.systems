export function renderAboutHtml(): string {
  return `
    <h2>About</h2>
    <p>Nathan Buesgens is an independent contractor. One person is responsible for contracting, project management and execution. The person you give requirements to is the person who implements them.</p>
    <p>All deliverables are coupled with the necessary documentation to modify the solution to meet your future requirements, and host the solution using your own data (Nathan never has access to your private data). Deliverables will not require business transformation or platform migration to manage. Third-party dependencies are kept to a minimum. You will recieve a solution and also a capability that stays with the business when the engagement ends.</p>
    <p>Contracts are written as a simple retainer. Work will be scoped to the size of the retainer with no long term commitments.</p>
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
