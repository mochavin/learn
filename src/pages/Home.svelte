<script>
  import { concepts, categories } from '../lib/concepts.js';
  import { router } from '../lib/router.svelte.js';
  import ConceptCard from '../lib/components/ConceptCard.svelte';

  let input = $state();
  const q = $derived(router.params.get('q') ?? '');
  const cat = $derived(router.params.get('c') ?? '');

  // Full text is loaded lazily, the first time someone searches.
  let texts = $state(null);
  let loadingTexts = false;
  async function ensureTexts() {
    if (texts || loadingTexts) return;
    loadingTexts = true;
    const entries = await Promise.all(concepts.map(async (c) => [c.slug, (await c.loadText()).text ?? '']));
    texts = Object.fromEntries(entries);
  }
  $effect(() => {
    if (q) ensureTexts();
  });

  const norm = (s) => s.toLowerCase().normalize('NFKD');

  function snippetFor(text, term) {
    const i = norm(text).indexOf(term);
    if (i < 0) return '';
    const start = Math.max(0, i - 50);
    const end = Math.min(text.length, i + term.length + 70);
    return (start > 0 ? '...' : '') + text.slice(start, end).replace(/\s+/g, ' ').trim() + (end < text.length ? '...' : '');
  }

  const results = $derived.by(() => {
    const terms = norm(q).split(/\s+/).filter(Boolean);
    const out = [];
    for (const c of concepts) {
      if (cat && c.category !== cat) continue;
      if (!terms.length) {
        out.push({ c, score: 0, snippet: '' });
        continue;
      }
      const meta = norm([c.title, c.description, c.category, ...c.tags].join(' '));
      const body = texts ? norm(texts[c.slug] ?? '') : '';
      let score = 0;
      let ok = true;
      let snippet = '';
      for (const t of terms) {
        if (norm(c.title).includes(t)) score += 10;
        else if (meta.includes(t)) score += 5;
        else if (body.includes(t)) {
          score += 1;
          snippet ||= snippetFor(texts[c.slug], t);
        } else ok = false;
      }
      if (ok) out.push({ c, score, snippet });
    }
    return terms.length ? out.sort((a, b) => b.score - a.score) : out;
  });

  function onInput(e) {
    router.setParams({ q: e.currentTarget.value });
  }
  function setCat(name) {
    router.setParams({ c: name === cat ? '' : name });
  }
  function onKey(e) {
    if (e.key === '/' && document.activeElement?.tagName !== 'INPUT') {
      e.preventDefault();
      input?.focus();
    }
  }

  $effect(() => {
    document.title = 'Learn - interactive illustrations of how technology works';
  });
</script>

<svelte:window onkeydown={onKey} />

<div class="page">
  <section class="hero">
    <h1>How things work, drawn.</h1>
    <p>
      Animated, interactive illustrations of tech concepts. Each page starts with the core idea and goes all the way
      down to the theory. Hover or tap anything in a diagram to see what it is.
    </p>
  </section>

  <section class="filters" aria-label="Find a concept">
    <div class="search">
      <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"
        ><circle cx="7" cy="7" r="4.75" fill="none" stroke="currentColor" stroke-width="1.5" /><path
          d="M10.5 10.5L14 14"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
        /></svg
      >
      <input
        bind:this={input}
        type="search"
        placeholder="Search concepts"
        aria-label="Search concepts"
        value={q}
        oninput={onInput}
        autocomplete="off"
        spellcheck="false"
      />
      <kbd aria-hidden="true">/</kbd>
    </div>
    <div class="segmented" role="group" aria-label="Category">
      <button aria-pressed={!cat} onclick={() => setCat('')}>All <span class="n">{concepts.length}</span></button>
      {#each categories as c}
        <button aria-pressed={cat === c.name} onclick={() => setCat(c.name)}>{c.name} <span class="n">{c.count}</span></button>
      {/each}
    </div>
  </section>

  {#if results.length}
    <ul class="grid">
      {#each results as r (r.c.slug)}
        <li><ConceptCard concept={r.c} snippet={r.snippet} /></li>
      {/each}
    </ul>
  {:else}
    <p class="empty">
      Nothing matches{q ? ` "${q}"` : ''}{cat ? ` in ${cat}` : ''}.
      <button class="link" onclick={() => router.setParams({ q: '', c: '' })}>Clear filters</button>
    </p>
  {/if}
</div>

<style>
  .page {
    max-width: var(--w-page);
    margin: 0 auto;
    padding: var(--s-8) var(--gutter) var(--s-9);
  }
  .hero h1 {
    margin: 0;
    font-size: clamp(2rem, 5vw, 3rem);
    font-weight: 650;
    letter-spacing: -0.03em;
    line-height: 1.05;
  }
  .hero p {
    max-width: 600px;
    margin: var(--s-4) 0 0;
    color: var(--fg-muted);
    font-size: var(--text-prose);
    line-height: 1.6;
  }
  .filters {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--s-3) var(--s-4);
    margin: var(--s-7) 0 var(--s-5);
  }
  .search {
    position: relative;
    flex: 1 1 260px;
    max-width: 380px;
    color: var(--fg-subtle);
  }
  .search svg {
    position: absolute;
    left: 11px;
    top: 50%;
    transform: translateY(-50%);
  }
  .search input {
    width: 100%;
    height: 38px;
    padding: 0 36px 0 36px;
    border: 1px solid var(--line);
    border-radius: var(--radius);
    background: var(--surface-raised);
    color: var(--fg);
    font-size: var(--text-md);
    outline: none;
  }
  .search input:focus {
    border-color: var(--accent-line);
    box-shadow: 0 0 0 3px var(--accent-soft);
  }
  .search input::-webkit-search-cancel-button {
    display: none;
  }
  kbd {
    position: absolute;
    right: 10px;
    top: 50%;
    transform: translateY(-50%);
    padding: 0 6px;
    border: 1px solid var(--line);
    border-radius: var(--radius-sm);
    font-size: 11px;
    line-height: 18px;
  }
  .n {
    margin-left: 2px;
    font-size: var(--text-xs);
    color: var(--fg-subtle);
  }
  .grid {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(min(100%, 290px), 1fr));
    gap: var(--s-5);
  }
  .grid li {
    display: flex;
  }
  .grid li > :global(*) {
    flex: 1;
  }
  .empty {
    color: var(--fg-muted);
  }
  .link {
    border: 0;
    background: none;
    padding: 0;
    color: var(--accent);
    text-decoration: underline;
    text-underline-offset: 3px;
  }
  @media (max-width: 480px) {
    .page {
      padding-top: var(--s-7);
    }
    .search {
      max-width: none;
    }
    kbd {
      display: none;
    }
  }
</style>
