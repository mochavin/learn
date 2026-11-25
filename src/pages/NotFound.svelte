<script>
  import { router } from '../lib/router.svelte.js';
  $effect(() => {
    document.title = 'Not found - Learn';
  });
</script>

<div class="nf">
  <div class="eyebrow">404</div>
  <h1>Nothing at {router.path}</h1>
  <p>That concept does not exist (yet). <a href="/">See all concepts</a>.</p>
</div>

<style>
  .nf {
    max-width: var(--w-prose);
    margin: 0 auto;
    padding: var(--s-9) var(--gutter);
  }
  h1 {
    margin: var(--s-2) 0;
    font-size: var(--text-xl);
    font-weight: 620;
    word-break: break-word;
  }
  p {
    color: var(--fg-muted);
  }
</style>
