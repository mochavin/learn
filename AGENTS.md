# Instructions for agents

Read [DESIGN.md](DESIGN.md) in full before creating or editing any page,
illustration or shared component. It defines typography, colors, layout,
illustration and animation conventions, hover/tap info behavior and the
checklist for adding a concept.

Key rules, in short:

- A new concept is one folder, `src/concepts/<slug>/`, with `index.svx` and its
  components. Do not edit any registry, route table or list; discovery is
  automatic.
- Use the shared primitives in `src/lib/diagram` and components in
  `src/lib/components`. Use the design tokens; never hard-code colors.
- Every element in an illustration gets an `info` (hover, tap, focus).
- Derive illustration state from `steps.index`; wrap durations in `dur()`.
- Copy: plain English, no emoji, no em dashes.
- Before finishing: `npm run build` must succeed without warnings, and check
  light/dark and a 375px-wide viewport.
- Deploys happen automatically from `main` via GitHub Actions. Commit directly
  to `main`.
