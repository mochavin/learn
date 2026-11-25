# Design system

The single reference for how pages on learn.avin.my.id look, move and behave.
Read it before creating or editing a concept. When code and this file disagree,
fix one of them in the same change.

## Principles

1. **The illustration comes first, the text supports it.** A page opens with one
   hero illustration that explains the whole concept by itself, followed by a
   short "core idea". After that it goes deep, one section per sub-topic, each
   with its own illustration where a picture helps.
2. **Everything in a drawing explains itself.** Every component of an
   illustration (box, arrow, key, byte group, field, legend item) shows info
   about itself on hover, on tap on touch devices, and on keyboard focus. If
   something is drawn, it has an `info`.
3. **Simple and elegant.** Mostly black and white, one subtle accent color, no
   emoji, no gradients, no decorative illustration. Lines are thin (1.25px), corners
   are slightly rounded, there is generous whitespace.
4. **Honest and precise.** Field names, labels and values match the real
   specification (cite the RFC or source in "Further reading"). Use real
   computations when the browser can do them (for example WebCrypto in the TLS
   record layer).
5. **Works everywhere.** Light and dark theme, phones down to 320px wide, mouse,
   touch and keyboard, and `prefers-reduced-motion`.

## Typography

| Token | Size | Use |
|---|---|---|
| `--text-xs` | 12px | diagram labels, field rows, meta |
| `--text-sm` | 14px | UI, captions, info cards, figure body |
| `--text-md` | 16px | UI body |
| `--text-prose` | 17px | long-form prose, line height 1.7 |
| `--text-lg` | 20px | h3, card titles |
| `--text-xl` | 26px | h2 |
| `--text-2xl` | 40px | page title |

- Sans: **Inter Variable** (`--font-sans`). Weights: 400 body, 550 to 560 labels,
  620 headings, 650 page titles. Headings use slight negative letter spacing.
- Mono: **JetBrains Mono Variable** (`--font-mono`) for bytes, field names,
  values, code and anything a machine would print.
- Small uppercase labels use the `.eyebrow` class (categories, "kind" labels).
- Copy style: plain English, short sentences, no em dashes (use a period, a colon
  or " - "), no emoji. Sentence case for headings and step labels.

## Color

Defined in `src/lib/styles/tokens.css`. Never hard-code a color in a component.

| Token | Light | Dark | Use |
|---|---|---|---|
| `--bg` | `#fbfbfa` | `#0f0f10` | page background |
| `--surface` | `#f3f3f1` | `#17171a` | subtle fills, figure background (dark) |
| `--surface-raised` | `#ffffff` | `#1c1c20` | cards, figures (light), boxes |
| `--fg` | `#141414` | `#ececea` | text, primary lines |
| `--fg-muted` | `#5a5a58` | `#a3a3a0` | secondary text |
| `--fg-subtle` | `#8c8c88` | `#6e6e6b` | tertiary text, ticks |
| `--line` | `#e3e3df` | `#262629` | dividers, quiet borders |
| `--line-strong` | `#c9c9c4` | `#3a3a3e` | diagram outlines |
| `--accent` | `#2f63c8` | `#7ea2ef` | the one accent |
| `--accent-soft` | 10% accent | 13% accent | accent fills |
| `--accent-line` | 45% accent | 50% accent | accent borders |

**What the accent means.** In an illustration the accent marks *what is happening
now*: the current step's message, the value just derived, the hovered element.
Past state is drawn in `--fg`, inactive or future state in `--fg-subtle`, dashed,
or hidden. Do not use the accent for decoration.

**Failure states** do not get a new color (no red). Show them with an "x" glyph,
strike-through, a `--fg` left border and words.

Themes: `<html data-theme="light|dark">`. The inline script in `index.html` sets
it before first paint from `localStorage.theme` or the system setting. The toggle
(`src/lib/theme.svelte.js`) stores a choice only when it differs from the system,
so choosing the system theme again goes back to following the system.

## Spacing and shape

- 4px base scale: `--s-1` 4, `--s-2` 8, `--s-3` 12, `--s-4` 16, `--s-5` 24,
  `--s-6` 32, `--s-7` 48, `--s-8` 64, `--s-9` 96.
- Page gutter `--gutter`: 16px on phones, 32px from 720px.
- Radius: `--radius-sm` 4 (chips, byte groups), `--radius` 8 (boxes, buttons),
  `--radius-lg` 12 (figures, cards).
- Borders 1px. Diagram strokes 1.25px, accent strokes 1.6px.

## Layout of a concept page

```
header (sticky)
  eyebrow: category (links to /?c=Category)
  h1: title
  lead: description from frontmatter
  intro paragraph (1-3 sentences)
  HERO FIGURE (wide)          <- the whole concept, step by step
  ## The core idea            <- short; a list of the key ideas
  ## Sub-topic                <- deep dive; text, then a FIGURE (wide), then text
  ## ...
  ## Further reading          <- primary sources first
  footer: All concepts / Source on GitHub
```

- Prose sits in a 680px column (`--w-prose`). Every `<Figure>` breaks out to
  the wide column (up to `--w-wide`, 1080px). The `.prose` grid in
  `src/lib/styles/prose.css` does this: give any block `class="wide"` to break out.
- h2 sections get a top rule and appear in the table of contents automatically
  (a fixed rail at 1520px and wider). Heading ids are generated from the text.
- Tables scroll inside themselves on narrow screens, never the page.

## Illustrations

Every illustration is a Svelte component in the concept's folder, wrapped in
`<Figure>`:

```svelte
<Figure title="The TLS 1.3 handshake, step by step">
  {#snippet controls()}<Stepper {steps} labels={LABELS} />{/snippet}
  ...drawing...
  {#snippet footer()}...legend or narration...{/snippet}
</Figure>
```

### Drawing with SVG

Use `<Diagram>` from `$lib/diagram`. Its viewBox equals its rendered pixel size,
so 12px text stays 12px on a phone instead of shrinking. Bind its width and
compute the layout from it:

```svelte
let w = $state(0);
const compact = $derived(w < 540);   // switch to short labels, glyph-only chips
<Diagram bind:width={w} height={h} label="What this diagram shows">
  {#snippet children()} ... {/snippet}
</Diagram>
```

- Design the compact layout (about 300px wide) first, then the wide one.
- Prefer short real names over abbreviations; when you must shorten, the full
  name goes in the `info`.
- Text with lines running behind it gets a halo:
  `paint-order: stroke; stroke: var(--surface-raised); stroke-width: 4px`.
- HTML is fine too (grids of cards, byte strips, field lists). Use whichever
  lays out more clearly; mixing is fine (the hero uses SVG plus an HTML inspector).

### Shared primitives (`src/lib/diagram`)

| Component | What it is |
|---|---|
| `Diagram` | responsive SVG canvas with arrowhead markers |
| `Node` | labelled box; `tone`: default, accent, muted, ghost |
| `Arrow` | straight connector with label, heads, `draw` animation, wide hit area |
| `Lifeline` | sequence diagram participant (box plus dashed line) |
| `Packet` | envelope that travels from A to B once (GSAP); `locked` for encrypted |
| `Glyph` | 14px line icons: key, lock, unlock, check, cross, cert, eye, dot |
| `Chip` | HTML pill for values |
| `Bytes` | HTML hex byte strip in hoverable groups |

Primitives mark their outline with `.frame` and their text with `.ink`, which is
how the global hover style turns them accent. Follow that in custom SVG.

### Other shared components (`src/lib/components`)

`Figure`, `Stepper`, `ThemeToggle`, `Header`, `Toc`, `ConceptCard`, `Thumbnail`.

## Step-by-step animation

- State lives in a `Steps` instance (`src/lib/steps.svelte.js`):
  `const steps = new Steps(LABELS.length)`. Pair it with `<Stepper>`, which gives
  restart, previous, play/pause, next, a clickable progress track, the step
  label, arrow keys and Space.
- **Derive everything from `steps.index`.** The drawing must be correct for
  any index, so jumping to step 7 or going back works. Never build state up
  imperatively step by step.
- Elements appear with `{#if steps.index >= n}`. The current step's elements use
  the accent; earlier ones settle to `--fg`.
- To replay a motion on every step change, wrap it in `{#key steps.version}`.
- Autoplay never starts by itself. It pauses when the figure scrolls out of view.
- One step = one idea. Each step needs a label (2-4 words) and, ideally, a
  narration paragraph shown next to or under the drawing.

## Motion

- Settings live in `src/lib/motion.js`: `DUR.ui` 160ms, `DUR.enter` 420ms,
  `DUR.travel` 900ms (a message crossing the diagram), `DUR.step` 3200ms
  (autoplay per step). Easing: `--ease` / `power3.out`, travel `power2.inOut`.
- Always wrap durations in `dur(ms)`, which returns 0 under
  `prefers-reduced-motion`.
- **Svelte transitions** (`fade`, `fly`, `draw`) for elements entering or leaving.
  Use `enter(delay)` from `motion.js` for a consistent fade.
- **GSAP** for choreographed or imperative motion (a packet travelling along a
  path, multi-part timelines). Kill tweens on destroy.
- **`Tween` from `svelte/motion`** for a continuously animated number that drives
  a layout (the clock cursor in the TLS 1.2 vs 1.3 figure).
- Motion explains something (a message travels, a value is derived). No motion
  for decoration, no looping animations, nothing that moves while idle.

## Hover and tap info

Attach info to any element with the `info` action:

```svelte
<g use:info={{ kind: 'Message', title: 'ClientHello', body: 'Text with `code`.', fields: [['size', '512 B']], note: 'Secondary.' }}>
```

- `title` is required. `kind` is the small label above it (Message, Field,
  Key, Secret, Participant, Legend...). `body` is one to three sentences;
  backticks render as code. `fields` are key/value rows in mono.
- Mouse: hover shows a floating card; click pins it (click elsewhere or Esc
  closes). Touch: tap opens a bottom sheet with a close button; tap again or
  outside closes. Keyboard: elements become focusable, focus shows the card,
  Enter pins, Esc closes.
- One `<InfoLayer>` in `App.svelte` renders all cards. Do not build tooltips per
  component.
- Primitives accept an `info` prop and pass it on. Pass `null` to disable.
- Write info that adds something: what the thing is, why it exists, what would
  go wrong without it. Not just the label again.

## Concepts and the index

- A concept is a folder `src/concepts/<slug>/` with `index.svx`. The folder name
  is the URL: `/tls`. Lowercase kebab-case.
- Registry: `src/lib/concepts.js` discovers folders with `import.meta.glob`.
  Metadata is read with mdsvex's `?metadata` query (frontmatter only, no
  compile), content is lazy-loaded per page, and full text (`?text`) loads only
  when someone searches.
- Thumbnail: optional `thumbnail.svg` in the folder, 320x200 viewBox, drawn with
  `currentColor` and `var(--accent)`, no fills of `--bg`, no text. It is inlined,
  so it follows the theme. Without one, `src/lib/thumbnail.js` generates a
  default: the category picks the motif, the title seeds the arrangement.
- The build writes `dist/<slug>.html` with the page's title and description and a
  `404.html` fallback (see `scripts/pages-fallback.js`).

### Frontmatter

```yaml
---
title: TLS                      # required, short
description: One or two sentences. Shown on the card, as the lead, and in meta tags.  # required, one line
category: Networking            # required; categories are created by use
tags: [security, https]         # optional, used by search
order: 1                        # optional, lower first (default 100)
updated: 2026-11-25             # optional
draft: true                     # optional, hidden in production builds
---
```

Keep `title` and `description` on one line each (the build reads them with a
simple parser for the per-page HTML).

### Markdown flavor (mdsvex 1.0)

- `*bold*` and `_italic_` (single characters; `**x**` nests strong twice).
- `{` starts a Svelte expression in prose. Write a literal brace as `\{` or keep
  it inside backticks.
- Import components in a `<script>` block at the top and place them on their own
  line with blank lines around them.
- Footnotes `[^1]`, tables and fenced code are supported. Code is highlighted
  in monochrome with accent keywords.

## Accessibility

- Every `Diagram` has a `label`. Info targets get `role="button"`, `tabindex` and
  an `aria-label` automatically.
- Text contrast: body text uses `--fg`/`--fg-muted` only; `--fg-subtle` is for
  non-essential labels.
- Narration and stepper labels are `aria-live="polite"`.
- Everything works without hover: tap and keyboard reach the same info.

## Checklist: adding a new concept

1. Create `src/concepts/<slug>/index.svx` with the frontmatter above.
2. Write a hero illustration component in the same folder, using `Figure`,
   `Stepper`/`Steps` and the diagram primitives. Put long text (step narration,
   field descriptions) in a separate `*-data.js` file if it is large.
3. Page structure: intro (1-3 sentences), hero, `## The core idea`, deep-dive
   sections with their own figures, `## Further reading` with primary sources.
4. Every drawn element has an `info`. Every step has a label.
5. Optional: add `thumbnail.svg`.
6. Check with `npm run dev` (or `npm run preview:tunnel` on a phone):
   - light and dark theme
   - 375px wide: no horizontal page scroll, labels readable (compact layout)
   - hover, tap and keyboard focus show info
   - stepper: next, previous, jump, play, and going backwards all render correctly
   - reduced motion (DevTools > Rendering > Emulate prefers-reduced-motion)
   - `npm run build` has no warnings
7. Nothing else needs editing: the index, search, categories, routing and
   per-page HTML pick up the folder automatically.
