<script>
  import Header from './lib/components/Header.svelte';
  import InfoLayer from './lib/info/InfoLayer.svelte';
  import Home from './pages/Home.svelte';
  import Concept from './pages/Concept.svelte';
  import NotFound from './pages/NotFound.svelte';
  import { router } from './lib/router.svelte.js';
  import { bySlug } from './lib/concepts.js';

  const route = $derived.by(() => {
    if (router.path === '/') return { page: 'home' };
    const slug = router.path.slice(1);
    const concept = bySlug.get(slug);
    return concept ? { page: 'concept', concept } : { page: 'notfound' };
  });
</script>

<Header />
<main>
  {#if route.page === 'home'}
    <Home />
  {:else if route.page === 'concept'}
    {#key route.concept.slug}
      <Concept concept={route.concept} />
    {/key}
  {:else}
    <NotFound />
  {/if}
</main>
<footer class="site-foot">
  <div class="inner">
    <span>learn.avin.my.id</span>
    <a href="https://github.com/mochavin/learn" target="_blank" rel="noopener">GitHub</a>
  </div>
</footer>
<InfoLayer />

<style>
  main {
    min-height: calc(100vh - 56px - 64px);
  }
  .site-foot {
    border-top: 1px solid var(--line);
    font-size: var(--text-sm);
    color: var(--fg-subtle);
  }
  .inner {
    max-width: var(--w-page);
    margin: 0 auto;
    padding: var(--s-5) var(--gutter);
    display: flex;
    justify-content: space-between;
  }
  a {
    color: var(--fg-muted);
  }
</style>
