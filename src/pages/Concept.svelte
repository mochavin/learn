<script>
  import { tick } from 'svelte';
  import Toc from '../lib/components/Toc.svelte';
  import { scrollToHash } from '../lib/router.svelte.js';

  /** @type {{ concept: import('../lib/concepts.js').Concept }} */
  let { concept } = $props();
  let content = $state();
  let Component = $state(null);
  let error = $state('');

  $effect(() => {
    const c = concept;
    document.title = `${c.title} - Learn`;
    document.querySelector('meta[name="description"]')?.setAttribute('content', c.description);
    Component = null;
    error = '';
    c.load()
      .then(async (m) => {
        if (c !== concept) return;
        Component = m.default;
        await tick();
        if (location.hash) scrollToHash(location.hash);
      })
      .catch((e) => {
        console.error(e);
        error = 'This page failed to load. Check your connection and reload.';
      });
  });

  const source = $derived(`https://github.com/mochavin/learn/tree/main/src/concepts/${concept.slug}`);
</script>

<article class="concept">
  <header class="head">
    <a class="eyebrow cat" href="/?c={encodeURIComponent(concept.category)}">{concept.category}</a>
    <h1>{concept.title}</h1>
    <p class="lead">{concept.description}</p>
  </header>

  {#if Component}
    <div class="toc-rail"><Toc root={content} /></div>
    <div class="prose" bind:this={content}>
      <Component />
    </div>
    <footer class="foot">
      <a href="/">All concepts</a>
      <a href={source} target="_blank" rel="noopener">Source on GitHub</a>
    </footer>
  {:else if error}
    <p class="status">{error}</p>
  {:else}
    <div class="skeleton" aria-busy="true" aria-label="Loading"></div>
  {/if}
</article>

<style>
  .concept {
    max-width: var(--w-wide);
    margin: 0 auto;
    padding: var(--s-7) var(--gutter) var(--s-9);
  }
  .head {
    max-width: var(--w-prose);
    margin: 0 auto var(--s-6);
  }
  .cat {
    text-decoration: none;
  }
  .cat:hover {
    color: var(--accent);
  }
  h1 {
    margin: var(--s-2) 0 0;
    font-size: clamp(2rem, 5vw, var(--text-2xl));
    font-weight: 650;
    letter-spacing: -0.03em;
    line-height: 1.1;
  }
  .lead {
    margin: var(--s-3) 0 0;
    font-size: 1.1875rem;
    line-height: 1.55;
    color: var(--fg-muted);
  }
  .toc-rail {
    display: none;
  }
  @media (min-width: 1520px) {
    .toc-rail {
      display: block;
      position: fixed;
      top: 104px;
      left: calc(50% - var(--w-wide) / 2 - 220px);
      width: 190px;
    }
  }
  .foot {
    display: flex;
    justify-content: space-between;
    max-width: var(--w-prose);
    margin: var(--s-8) auto 0;
    padding-top: var(--s-4);
    border-top: 1px solid var(--line);
    font-size: var(--text-sm);
    color: var(--fg-muted);
  }
  .skeleton {
    height: 420px;
    border: 1px solid var(--line);
    border-radius: var(--radius-lg);
    background: var(--surface);
  }
  .status {
    max-width: var(--w-prose);
    margin: 0 auto;
    color: var(--fg-muted);
  }
</style>
