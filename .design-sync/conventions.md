# Building with @commons-systems/ds

A small React design system with a deliberately spare, monospace, "engineering
terminal" aesthetic (IBM Plex Mono/Serif, square corners, an accent amber, a
faint grid texture). All components are on `window.CommonsDS`.

## Setup — no provider needed

There is **no ThemeProvider or context wrapper**. Components are styled entirely
by the design system's own stylesheet, which is already loaded for you — just
render the components. Theming is automatic light/dark via CSS `light-dark()`
keyed off `color-scheme`; you do not pass a theme prop. If you want to pin a
mode, set `style={{ colorScheme: 'light' }}` (or `'dark'`) on a wrapping element.

```jsx
const { Button, Card, Metric, Nav, Badge, Input, Select, Checkbox } = window.CommonsDS;
<Button variant="primary">Save</Button>
```

There is also a `Landing` **template** — a full-page shell (sticky nav, hero,
two-column main + sticky/collapsible context panel, footer) that composes the
primitives. Render it on its own for a populated page scaffold:
`<CommonsDS.Landing />`.

`OfficeHours` is a second **template** — a populated snapshot of the office-hours
operator dashboard, with two pages selected by the `page` prop, the way the app's
nav header splits them. `page="status"` (the default) is the at-a-glance view
(capacity, pace, backlog, intention tree); `page="other"` holds everything else
(history, audit, reminders, queue, parked, project signals). Both pages are
populated snapshots built from the same reusable primitives (sticky nav header
carrying the Status/Other tabs, a responsive grid of `Card` panels holding
`Metric` stat-cards, `Badge` status chips, and chart-shaped placeholders, shared
footer). Render either for a dashboard page scaffold:
`<CommonsDS.OfficeHours />` or `<CommonsDS.OfficeHours page="other" />`.

## Styling idiom — semantic props + CSS variables (NOT utility classes)

This system has **no utility-class vocabulary** (no Tailwind, no `bg-*`/`p-*`).
Style in two ways:

1. **For the components themselves: pass semantic props**, never className. Each
   component owns its look:
   - `Button` — `variant: "primary" | "secondary" | "ghost"`, `size: "sm" | "md" | "lg"`, `icon`
   - `Badge` — `variant: "neutral" | "accent" | "success" | "error"`
   - `Metric` — `label`, `value`, `delta`, `deltaTone: "favorable" | "unfavorable"`
   - `Card` — `as` (any element, e.g. `"a"`), `interactive`
   - `Input` / `Select` — `label`, `helper`, `error` (plus native input/select attrs)
   - `Checkbox` — native checkbox/radio attrs (`type="radio"`, `checked`, `disabled`)
   - `Nav` — `links: {href, label}[]`, `current` (href of active link), `end`
   (`cs-btn`, `cs-card`, `cs-input`, … classes exist but are internal — don't author against them.)

2. **For your own layout glue around components: use the `var(--*)` design
   tokens** so it stays on-brand. Real token families (see `_ds_bundle.css`):
   - Color: `--fg`, `--bg`, `--surface`, `--accent`, `--muted`, `--border`,
     `--link`, `--text-primary`, `--text-muted`, `--text-on-accent`,
     `--focus-ring`; status `--success`, `--error`, `--favorable`, `--unfavorable`; `--chart-1`…`--chart-6`
   - Spacing: `--space-0`…`--space-16` (gap/padding/margin)
   - Type: `--font-mono`, `--font-serif`; `--text-micro`…`--text-display`; `--weight-normal`/`--weight-bold`; `--tracking-heading`/`--tracking-label`
   - Shape: `--radius-none` (the house default — square), `--radius-sm/md/lg`; `--border-width`; `--max-width-prose/content/wide`
   - Effects: `--glow-accent`, `--grid-texture`, `--focus-outline`, `--transition-color`

```jsx
<div style={{ display: 'grid', gap: 'var(--space-4)', padding: 'var(--space-6)',
              background: 'var(--surface)', border: '1px solid var(--border)' }}>
  <Metric label="Issues open" value={42} delta="+12 this week" deltaTone="favorable" />
  <Button variant="primary">Open backlog</Button>
</div>
```

## Where the truth lives

Read these before styling: the bound `styles.css` and its closure
(`_ds_bundle.css` — every `--*` token in `:root` plus base element styling — and
`fonts/fonts.css`), and each component's `<Name>.d.ts` (prop contract) and
`<Name>.prompt.md` (usage). The compiled stylesheet is authoritative for the
exact token values and names.
