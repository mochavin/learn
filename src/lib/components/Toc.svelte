<script>
  // Table of contents built from the h2 elements in the rendered content.
  // Highlights the section currently in view.
  let { root } = $props();
  let items = $state([]);
  let activeId = $state('');

  $effect(() => {
    if (!root) return;
    const hs = [...root.querySelectorAll('h2[id]')];
    items = hs.map((h) => ({ id: h.id, text: h.textContent ?? '' }));
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) activeId = e.target.id;
      },
      { rootMargin: '-80px 0px -70% 0px' },
    );
    hs.forEach((h) => io.observe(h));
    return () => io.disconnect();
  });
</script>

{#if items.length}
  <nav class="toc" aria-label="On this page">
    <div class="eyebrow">On this page</div>
    <ol>
      {#each items as it}
        <li><a href="#{it.id}" class:active={it.id === activeId}>{it.text}</a></li>
      {/each}
    </ol>
  </nav>
{/if}

<style>
  .toc {
    font-size: var(--text-sm);
  }
  ol {
    list-style: none;
    margin: var(--s-2) 0 0;
    padding: 0;
    border-left: 1px solid var(--line);
  }
  li {
    margin: 0;
  }
  a {
    display: block;
    padding: 4px 0 4px var(--s-3);
    margin-left: -1px;
    border-left: 1px solid transparent;
    color: var(--fg-muted);
    text-decoration: none;
    line-height: 1.35;
  }
  a:hover {
    color: var(--fg);
  }
  a.active {
    color: var(--fg);
    border-left-color: var(--accent);
  }
</style>
