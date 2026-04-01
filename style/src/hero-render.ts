export interface HeroChip {
  panelId: string;
  badge: "easy" | "medium" | "hard";
  label: string;
  panelContent: string;
}

export interface HeroFaq {
  question: string;
  answer: string;
}

export interface HeroConfig {
  chips: [HeroChip, HeroChip, HeroChip];
  faq: [HeroFaq, HeroFaq];
}

export function renderHeroShell(config: HeroConfig): string {
  const chipButtons = config.chips
    .map(
      (chip) =>
        `<button type="button" class="hero-chip" data-panel="${chip.panelId}" aria-expanded="false">
        <span class="chip-badge chip-badge--${chip.badge}">${chip.badge.charAt(0).toUpperCase() + chip.badge.slice(1)}</span>
        ${chip.label}
      </button>`,
    )
    .join("\n      ");

  const chipPanels = config.chips
    .map(
      (chip) =>
        `<div class="hero-chip-panel" id="${chip.panelId}" hidden>
      ${chip.panelContent}
    </div>`,
    )
    .join("\n\n    ");

  const faqEntries = config.faq
    .map((faq) => `<dt>${faq.question}</dt>\n        <dd>${faq.answer}</dd>`)
    .join("\n        ");

  return `<section id="hero" class="hero">
  <div class="hero-content">
  <h2>This is Not an App.</h2>
  <p class="hero-subtext">No signup. No subscription. No data sharing.</p>
  <p class="hero-body">This tool was built using <a href="https://commons.systems">agentic coding</a>. You can use agentic coding to make it your own.</p>

  <div class="hero-chips" id="hero-chips">
    <div class="hero-chip-row">
      ${chipButtons}
    </div>

    ${chipPanels}
  </div>

  <details class="hero-faq">
    <summary>FAQ</summary>
    <div class="hero-faq-body">
      <dl>
        ${faqEntries}
      </dl>
    </div>
  </details>
  </div>
</section>`;
}
