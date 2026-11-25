# learn

In-depth, animated, interactive illustrations of tech concepts.
Live at **https://learn.avin.my.id**.

Each page explains the core idea with one step-by-step illustration, then goes
deep into the theory. Hover (or tap) anything in a diagram to see what it is.

Concepts so far: [TLS](https://learn.avin.my.id/tls).

## Develop

Requires Node 20.19+.

```sh
npm install
npm run dev              # http://localhost:5173
npm run build            # static site in dist/
npm run preview          # serve dist/ locally
npm run preview:tunnel   # dev server + public HTTPS URL for testing on any device
```

### Preview on a phone: `npm run preview:tunnel`

Starts the Vite dev server and exposes it through a
[Cloudflare quick tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/do-more-with-tunnels/trycloudflare/).
The random `https://<words>.trycloudflare.com` URL is printed in a box; open it
on any device. Hot reload works through the tunnel (`vite.config.js` allows
`*.trycloudflare.com` hosts and points the HMR websocket at port 443 when
`TUNNEL=1`). Needs [`cloudflared`](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/)
on your PATH; no Cloudflare account is required. The URL changes each run;
Ctrl+C stops both processes. Set `TUNNEL_DEBUG=1` to see cloudflared's logs.

## Add a concept

1. Read [DESIGN.md](DESIGN.md), especially the checklist at the end.
2. Create a folder `src/concepts/<slug>/` (the slug becomes the URL, `/<slug>`).
3. Add `index.svx`:

   ```svelte
   ---
   title: DNS
   description: How a name like example.com becomes an IP address.
   category: Networking
   tags: [dns, resolver]
   ---

   <script>
     import Resolution from './Resolution.svelte';
   </script>

   One or two sentences of intro.

   <Resolution />

   ## The core idea
   ...
   ```

4. Build the illustrations as Svelte components in the same folder, using
   `$lib/components/Figure.svelte`, `$lib/components/Stepper.svelte`,
   `$lib/steps.svelte.js`, the primitives in `$lib/diagram` and the `info` action
   from `$lib/info/info.svelte.js`. `src/concepts/tls/` is a full example.
5. Optionally add `thumbnail.svg` (320x200, `currentColor` and `var(--accent)`).
   Without one, a thumbnail is generated from the title and category.

That is all: the index, categories, search, routing and per-page HTML pick up
the folder automatically. Set `draft: true` to keep it out of production.

## How it works

- **Svelte 5 + Vite**, a single-page app. A tiny History API router
  (`src/lib/router.svelte.js`) gives clean URLs like `/tls` and intercepts
  same-origin links, including links inside Markdown.
- **mdsvex 1.0** compiles `.svx` (Markdown with Svelte components) into
  components. The registry (`src/lib/concepts.js`) uses `import.meta.glob` with
  mdsvex's `?metadata` query, so the index reads frontmatter without loading any
  page; pages and the full text used by search are lazy-loaded.
- **GitHub Pages** has no SPA rewrites, so the build
  (`scripts/pages-fallback.js`) copies `index.html` to `404.html` and also writes
  `<slug>.html` per concept. Pages serves `/tls` from `tls.html` with a 200 and
  correct title/description; any other path falls back to `404.html` and the
  router takes over.
- Deployed by `.github/workflows/deploy.yml` on every push to `main`.

## Libraries and why

| Library | Why |
|---|---|
| `svelte`, `vite`, `@sveltejs/vite-plugin-svelte` | Requested stack. Svelte's compiled reactivity makes "derive the whole drawing from the current step" cheap and simple, and it ships little runtime. |
| `mdsvex` | Theory written in Markdown with illustration components embedded. Its `?metadata` and `?text` queries power the registry and full-text search without extra tooling. |
| `gsap` | Choreographed, imperative motion (packets travelling, timelines) with reliable easing, SVG transform handling and easy cleanup. Svelte's built-in transitions and `Tween` cover simple enter/exit and tweened values, so GSAP is used only where it is clearly better. Free for all uses since 3.13. |
| `@fontsource-variable/inter`, `@fontsource-variable/jetbrains-mono` | Self-hosted fonts: no third-party requests, consistent rendering. |

Not used, on purpose: D3 (the diagrams are hand-laid-out, not data-driven, so
plain Svelte + SVG is simpler), a router library (the router is tiny), a CSS
framework (tokens plus scoped styles are enough).

## Project layout

```
src/
  App.svelte, main.js
  pages/                Home (index, search, categories), Concept, NotFound
  lib/
    concepts.js         registry (auto-discovery)
    router.svelte.js    client-side routing
    theme.svelte.js     light/dark, follows system, with toggle
    steps.svelte.js     step state for illustrations
    motion.js           durations, easing, reduced motion
    thumbnail.js        generated default thumbnails
    info/               hover/tap info action + the card layer
    components/         Figure, Stepper, Header, ThemeToggle, Toc, cards
    diagram/            SVG primitives: Diagram, Node, Arrow, Lifeline, Packet, Glyph, Chip, Bytes
    styles/             tokens.css, global.css, prose.css
  concepts/
    tls/                index.svx, illustrations, thumbnail.svg
scripts/
  pages-fallback.js     build step for GitHub Pages
  tunnel.js             npm run preview:tunnel
```
