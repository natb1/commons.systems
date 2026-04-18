# App showcase screenshots

These screenshots are captured ad-hoc from the production apps and committed as
static assets. The landing page references them via `APPS` in
`landing/src/site-config.ts`.

## Regenerating

A helper script uses Playwright (already installed at the workspace root) to
capture all three at a consistent 1200×800 (3:2) viewport:

```bash
npx tsx landing/scripts/capture-screenshots.ts
```

The script navigates each production URL, waits for `domcontentloaded` plus a 2.5 s timeout, scrolls 540 px past the app's own hero band to frame the actual UI — adjust `scrollY` in `capture-screenshots.ts` if an app's hero height changes — waits 500 ms for the scroll to settle, and writes each file into
this directory.

## Sources and framing

| File          | URL                                         | Scroll offset |
| ------------- | ------------------------------------------- | ------------- |
| `budget.png`  | `https://budget.commons.systems/transactions` | 540           |
| `audio.png`   | `https://audio.commons.systems/`            | 540           |
| `print.png`   | `https://print.commons.systems/`            | 540           |

The CSS in `landing/src/style/theme.css` crops to 3:2 at render time via
`aspect-ratio: 3/2` with `object-fit: cover` / `object-position: top left`, so the
top of each capture is what visitors see.

## When to regenerate

- The target app's visible UI has changed in a way the current card no longer
  represents (new nav, renamed sections, layout overhaul).
- Seed data shown in the capture has drifted from what production serves.

A routine UI refresh (typography tweaks, color adjustments) is not a reason on
its own — only regenerate when the old image would mislead a visitor.
