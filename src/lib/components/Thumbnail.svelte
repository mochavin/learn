<script>
  // A concept's thumbnail.svg (inlined, so currentColor and var(--accent)
  // follow the theme), or a generated default.
  import { defaultThumbnail } from '../thumbnail.js';
  let { concept } = $props();
  const svg = $derived(concept.thumbnail ?? defaultThumbnail(concept));
</script>

<div class="thumb" aria-hidden="true">{@html svg}</div>

<style>
  .thumb {
    aspect-ratio: 16 / 10;
    color: var(--fg);
    background:
      radial-gradient(circle at 1px 1px, var(--line) 1px, transparent 0) 0 0 / 16px 16px,
      var(--surface);
    display: grid;
    place-items: stretch;
  }
  .thumb :global(svg) {
    width: 100%;
    height: 100%;
    display: block;
  }
</style>
