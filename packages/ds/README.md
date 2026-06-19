# @commons-systems/ds

The shared design system: the design tokens, eight `cs-*` React components, and
the square-corner reset. Three layers, each with one job. The tokens
(`tokens/*.css`) hold the values — palette, type, spacing, effects — as plain CSS
custom properties. The eight components are the contract: small, dependency-free
React that renders stable `cs-*` class names. `base.css` is the global reset and
element defaults, including the rule that makes every corner square unless a
component opts out.

## Where the system lives

Everything is under `packages/ds/`. These paths are the source of truth for
consumers.

| What | Path |
|---|---|
| Color tokens | `tokens/colors.css` |
| Typography tokens | `tokens/typography.css` |
| Spacing and shape tokens | `tokens/spacing.css` |
| Effects tokens | `tokens/effects.css` |
| Reset, element defaults, `cs-*` interaction states | `base.css` |
| Aggregator (`@import` manifest) | `styles.css` |
| Fonts (`@font-face` blocks) | `fonts.css` |
| Component exports | `src/index.ts` |
| Core components | `src/core/` |
| Form components | `src/forms/` |
| Navigation components | `src/navigation/` |
| Test contract | `test/components.test.tsx` |

`styles.css` is the manifest non-React consumers link to. It imports in this
order: `fonts.css`, then `tokens/colors.css`, `tokens/typography.css`,
`tokens/spacing.css`, `tokens/effects.css`, then `base.css`. The order matters —
tokens must be defined before `base.css` references them.

The package `exports` map (in `package.json`) names the entry points:

| Import | Resolves to |
|---|---|
| `.` | `src/index.ts` (the components) |
| `./styles.css` | the full aggregator |
| `./fonts.css` | font faces only |
| `./base.css` | reset and element defaults only |
| `./tokens/colors.css` | color tokens only |
| `./tokens/typography.css` | typography tokens only |
| `./tokens/spacing.css` | spacing tokens only |
| `./tokens/effects.css` | effects tokens only |

A non-React consumer can link the whole sheet (`@commons-systems/ds/styles.css`)
or pull a single token group.

The tokens started as `style/default.css` at the repo root, before they were
extracted into this package. That file is the pre-extraction origin; the
`packages/ds/` paths above are now canonical for consumers.

## Content and voice fundamentals

The visual language is cassette-futurism: monospace type, a warm paper palette,
a single accent, square corners, structure drawn with borders rather than
shadows. The reference is the personal computer before platforms — a tool, not a
storefront. Every element is functional, not decorative. The system honors the
reader's light/dark setting rather than imposing one.

Terminology in any copy rendered through this system: `artifact`, not "product";
`gift`, not "free tier". Keep text short and descriptive.

What the system rejects: emoji, gradients, soft drop-shadows, rounded corners,
and SaaS gloss. That polish signals a brand team and capital — the platform
sheen the project rejects.

## Visual foundations

### Color (`tokens/colors.css`)

One saturated hue carries the whole system: amber. The base palette is warm
paper, no cool grays or blues in the chrome. Amber does the work of links,
focus, primary actions, and the faint glow on headings.

The base tokens are defined with `light-dark()` so a single declaration covers
both schemes:

- `--fg: light-dark(#1a1a1a, #e0d8c8)` — ink on light, oat on dark
- `--bg: light-dark(#f5f0e8, #1a1714)` — paper, espresso
- `--surface: light-dark(#ece5d8, #252017)` — panels, cards, header
- `--accent: light-dark(#b8600a, #e8943a)` — amber, the one hue
- `--muted` and `--border` round out the base set.

Semantic aliases point back at the base tokens: `--text-primary` (= `--fg`),
`--text-muted` (= `--muted`), `--text-on-accent` (= `--bg`), `--link`
(= `--accent`), and `--focus-ring` (= `--accent`). Use the semantic name so a
later retune of the base palette flows through.

Status tokens: `--success:#4caf50`, `--error:#e45858`, and `--warning` (which
aliases `--accent`, so warnings read as amber). `--favorable` and `--unfavorable`
mirror success and error for metric deltas.

Charts use a warm, desaturated categorical palette, `--chart-1` through
`--chart-6` (the budget Sankey order).

### Typography (`tokens/typography.css`)

- `--font-mono: "IBM Plex Mono", ...` — the body and heading face.
- `--font-serif` / `--font-prose: "IBM Plex Serif", ...` — serif is for
  long-form prose only.
- `--font-body` and `--font-heading` both resolve to `--font-mono`.

Two weights, and only two: `--weight-normal: 400` and `--weight-bold: 700`.
There is no medium weight in the system.

Sizes run from `--text-micro` (`.65rem`) through `--text-xs`, `--text-sm`,
`--text-base` (`1rem`), `--text-lg`, `--text-xl`, `--text-2xl`, up to
`--text-display` (`clamp(1.75rem,7vw,2.75rem)`). Tracking tokens include
`--tracking-heading` (`.05em`) and `--tracking-label` (`.1em`). Headings are
uppercase mono with tracking and a faint amber glow (see `base.css`).
`--measure-prose` is `70ch`.

### Spacing and shape (`tokens/spacing.css`)

The space scale is `--space-0` (`0`) through `--space-16` (`4rem`):
`--space-1` `.25rem`, `--space-2` `.5rem`, `--space-3` `.75rem`, `--space-4`
`1rem`, `--space-5` `1.25rem`, `--space-6` `1.5rem`, `--space-8` `2rem`,
`--space-12` `3rem`, `--space-16` `4rem`.

Borders: `--border-width: 1px`, `--border-width-strong: 2px`.

Radii: `--radius-none: 0`, `--radius-sm: 4px`, `--radius-md: 6px`,
`--radius-lg: 8px`. The file's own comment puts it plainly — radii are the
exception, not the rule. The default is `--radius-none`.

Layout tokens: `--sidebar-width: 16rem`, `--texture-pitch: 24px`, plus the
`--max-width-*` set.

### Effects (`tokens/effects.css`)

The system is flat. Structure comes from 1px hairline borders and surface-tone
steps, not drop shadows.

- `--glow-accent: 0 0 0.4em var(--accent)` — the faint amber glow on headings.
- `--grid-line` / `--grid-texture` — the repeating-gradient background grid.
- `--shadow-overflow-top` / `--shadow-overflow-bottom` — inset shadows that
  signal scroll overflow. These are the only "shadows" in the system, and they
  are inset, not drop shadows.
- `--focus-outline: 2px solid var(--focus-ring)`, with `--focus-offset: 2px`.
- Motion: `--duration-fast: .15s`, `--duration-base: .2s`, `--ease: ease`. The
  composed `--transition-color` animates color, border, background, and outline
  only — short transitions, nothing decorative.

### The square-corner reset

`base.css` zeroes every corner. The rule is at `base.css:56-60`:

```css
*,
*::before,
*::after {
  border-radius: var(--radius-none);
}
```

There are exactly three opt-outs in the whole component set — the only elements
that carry a non-zero radius:

| Component | Path | Radius token |
|---|---|---|
| Metric | `src/core/Metric.tsx:21` | `--radius-lg` (8px) |
| Input | `src/forms/Input.tsx:36` | `--radius-sm` (4px) |
| Select | `src/forms/Select.tsx:43` | `--radius-sm` (4px) |

Everything else — Badge, Button, Card — sets `--radius-none` explicitly. A
`grep -rn borderRadius src` confirms only these three set a non-none radius.

## Iconography

No emoji in chrome or UI. File types and statuses are bordered text badges, not
icons. Where a glyph is genuinely useful, it is a Unicode glyph or one of a few
monochrome SVGs — never a purchased icon set, never a mascot. Amber is the only
accent in the chrome.

## The eight components

Every component renders a stable `cs-*` base class plus, where it has variants, a
`cs-*--{variant}` modifier. The exports come from `src/index.ts`; the class and
ARIA contract is pinned by `test/components.test.tsx`.

| Component | Path | Base class | Key props / variants | Defaults |
|---|---|---|---|---|
| Badge | `src/core/Badge.tsx` | `cs-badge` (+ `cs-badge--{variant}`) | `variant?: "neutral" \| "accent" \| "success" \| "error"` | `neutral` |
| Button | `src/core/Button.tsx` | `cs-btn` (+ `cs-btn--{variant}`) | `variant?: "primary" \| "secondary" \| "ghost"`; `size?: "sm" \| "md" \| "lg"`; `icon?: ReactNode` | `secondary`, `md` |
| Card | `src/core/Card.tsx` | `cs-card` (+ `cs-card--interactive`) | `as?: ElementType`; `interactive?: boolean` (also auto-detected for `as="a"` or an `onClick`) | `div` |
| Metric | `src/core/Metric.tsx` | `cs-metric` | `label`, `value` (required); `delta?`; `deltaTone?: "favorable" \| "unfavorable"` | — |
| Nav | `src/navigation/Nav.tsx` | `cs-nav`, links `cs-nav__link` | `links: NavLink[]` (required; `{ href, label, align? }`); `current?`; `end?` | — |
| Input | `src/forms/Input.tsx` | `cs-input` | `label?`, `helper?`, `error?`; `wrapStyle?` | — |
| Select | `src/forms/Select.tsx` | `cs-select` | `label?`, `helper?`, `error?`; `options: Option[]` (required); `wrapStyle?` | — |
| Checkbox | `src/forms/Checkbox.tsx` | `cs-checkbox` (on the `<label>`) | `label` (required); `type?: "checkbox" \| "radio"` | `checkbox` |

Accessibility contract:

- Input and Select wrap their control in a `cs-field` element **only when** a
  `label`, `helper`, or `error` is passed; with none of those they render the
  bare control and no wrapper.
- In the error state, Input and Select set `aria-invalid="true"` and color the
  border and message with `--error`.
- Nav marks the current link with `aria-current="page"`.

## Maintenance rules

The `cs-*` class names, the token names, the component props, and the variant
strings are the external contract — consumers depend on them. So they move in
lockstep with this guide: any change to a token value, a component prop, a
variant, or a `cs-*` class name updates this README in the **same PR**. The names
are not an implementation detail; they are the interface.

The sync-contract invariants this package holds to:

- Tokens are plain CSS custom properties — no preprocessor, no build step.
- The React components are dependency-free (React is a peer dependency; nothing
  else).
- Resting styles are inline in the components; only the interaction states
  (hover, focus, active) live in `base.css` (lines 68-84). The resting /
  interaction split is the architecture, not an accident.
- The `cs-*` class names are stable.

## License

<a href="https://creativecommons.org/licenses/by-sa/4.0/"><img src="https://mirrors.creativecommons.org/presskit/buttons/88x31/png/by-sa.png" alt="CC-BY-SA" width="117" height="41"></a>

For using and/or extending the artifacts in this repo: forking is encouraged.
