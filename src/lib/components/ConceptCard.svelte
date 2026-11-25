<script>
  import Thumbnail from './Thumbnail.svelte';
  /** @type {{ concept: import('../concepts.js').Concept, snippet?: string }} */
  let { concept, snippet = '' } = $props();
</script>

<a class="card" href="/{concept.slug}">
  <Thumbnail {concept} />
  <div class="text">
    <div class="eyebrow">{concept.category}</div>
    <h3>{concept.title}</h3>
    <p>{concept.description}</p>
    {#if snippet}<p class="snippet">{snippet}</p>{/if}
  </div>
</a>

<style>
  .card {
    display: flex;
    flex-direction: column;
    border: 1px solid var(--line);
    border-radius: var(--radius-lg);
    overflow: hidden;
    text-decoration: none;
    background: var(--surface-raised);
    transition: border-color var(--dur-ui) var(--ease), transform var(--dur-ui) var(--ease);
  }
  .card:hover {
    border-color: var(--line-strong);
  }
  .card:hover :global(.thumb) {
    color: var(--fg);
  }
  .card :global(.thumb) {
    border-bottom: 1px solid var(--line);
  }
  .text {
    padding: var(--s-4);
  }
  h3 {
    margin: var(--s-1) 0 var(--s-1);
    font-size: var(--text-lg);
    font-weight: 620;
    letter-spacing: -0.01em;
  }
  p {
    margin: 0;
    color: var(--fg-muted);
    font-size: var(--text-sm);
  }
  .snippet {
    margin-top: var(--s-2);
    font-size: var(--text-xs);
    color: var(--fg-subtle);
  }
</style>
