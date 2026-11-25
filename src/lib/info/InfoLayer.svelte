<script>
  // Renders the single info card for whatever element is active in infoState.
  // Hover: a floating card next to the element. Touch taps (and pinned cards on
  // narrow screens): a bottom sheet with a close button, so it never covers
  // what was tapped.
  import { infoState } from './info.svelte.js';
  import { fade, fly } from 'svelte/transition';
  import { dur } from '../motion.js';

  let card = $state();
  let pos = $state({ top: 0, left: 0, placement: 'below' });
  let vw = $state(typeof innerWidth === 'number' ? innerWidth : 1024);

  const cur = $derived(infoState.current);
  const sheet = $derived(!!cur && (cur.touch || (cur.pinned && vw < 640)));

  function escapeHtml(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  const rich = (s) => escapeHtml(s).replace(/`([^`]+)`/g, '<code>$1</code>');

  function place() {
    if (!cur || sheet || !card) return;
    const r = cur.el.getBoundingClientRect();
    const c = card.getBoundingClientRect();
    const gap = 10;
    const margin = 12;
    let placement = 'below';
    let top = r.bottom + gap;
    if (top + c.height > innerHeight - margin && r.top - gap - c.height > margin) {
      placement = 'above';
      top = r.top - gap - c.height;
    }
    top = Math.max(margin, Math.min(top, innerHeight - c.height - margin));
    let left = r.left + r.width / 2 - c.width / 2;
    left = Math.max(margin, Math.min(left, innerWidth - c.width - margin));
    pos = { top, left, placement };
  }

  $effect(() => {
    // Re-place whenever the target or its content changes.
    cur;
    card;
    if (!cur) return;
    requestAnimationFrame(place);
  });

  // Mark the active element so CSS can highlight it.
  $effect(() => {
    const el = cur?.el;
    if (!el) return;
    el.classList.add('info-active');
    return () => el.classList.remove('info-active');
  });

  function onDocPointerDown(e) {
    if (!cur) return;
    const t = e.target;
    if (!(t instanceof Element)) return;
    if (card?.contains(t) || t.closest('[data-info]')) return;
    infoState.clear();
  }
  function onKey(e) {
    if (e.key === 'Escape' && cur) infoState.clear();
  }
  function onScroll() {
    if (!cur) return;
    // A hover card stays attached; a detached element (re-rendered) closes it.
    if (!cur.el.isConnected) return infoState.clear();
    place();
  }
</script>

<svelte:window
  bind:innerWidth={vw}
  onscroll={onScroll}
  onresize={onScroll}
  onkeydown={onKey}
/>
<svelte:document onpointerdown={onDocPointerDown} />

{#if cur}
  {#key cur.el}
    {#if sheet}
      <div
        class="card sheet"
        role="dialog"
        aria-label={cur.data.title}
        bind:this={card}
        transition:fly={{ y: 24, duration: dur(180) }}
      >
        <button class="close btn icon" aria-label="Close details" onclick={() => infoState.clear()}>
          <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"
            ><path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" /></svg
          >
        </button>
        {@render content(cur.data)}
      </div>
    {:else}
      <div
        class="card float"
        class:pinned={cur.pinned}
        role="tooltip"
        bind:this={card}
        style:top="{pos.top}px"
        style:left="{pos.left}px"
        transition:fade={{ duration: dur(120) }}
      >
        {@render content(cur.data)}
        {#if cur.pinned}<div class="hint">Pinned. Click elsewhere or press Esc to close.</div>{/if}
      </div>
    {/if}
  {/key}
{/if}

{#snippet content(d)}
  {#if d.kind}<div class="eyebrow">{d.kind}</div>{/if}
  <div class="title">{d.title}</div>
  {#if d.body}<p class="body">{@html rich(d.body)}</p>{/if}
  {#if d.fields?.length}
    <dl class="fields">
      {#each d.fields as [k, v]}
        <dt>{k}</dt>
        <dd>{v}</dd>
      {/each}
    </dl>
  {/if}
  {#if d.note}<p class="note">{@html rich(d.note)}</p>{/if}
{/snippet}

<style>
  .card {
    position: fixed;
    z-index: 100;
    background: var(--surface-raised);
    color: var(--fg);
    border: 1px solid var(--line-strong);
    box-shadow: var(--shadow);
    font-size: var(--text-sm);
    line-height: 1.5;
  }
  .float {
    width: max-content;
    max-width: min(340px, calc(100vw - 24px));
    padding: var(--s-3) var(--s-4);
    border-radius: var(--radius);
    pointer-events: none;
  }
  .float.pinned {
    pointer-events: auto;
    border-color: var(--accent-line);
  }
  .sheet {
    left: 8px;
    right: 8px;
    bottom: calc(8px + env(safe-area-inset-bottom));
    max-height: 55vh;
    overflow-y: auto;
    padding: var(--s-4) var(--s-5) var(--s-5);
    border-radius: var(--radius-lg);
  }
  .close {
    position: absolute;
    top: 10px;
    right: 10px;
  }
  .eyebrow {
    margin-bottom: 2px;
  }
  .title {
    font-weight: 620;
    font-size: var(--text-md);
    padding-right: 32px;
  }
  .float .title {
    padding-right: 0;
  }
  .body {
    margin: var(--s-1) 0 0;
    color: var(--fg-muted);
  }
  .body :global(code),
  .note :global(code) {
    font-size: 0.86em;
    color: var(--fg);
  }
  .fields {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 2px var(--s-3);
    margin: var(--s-2) 0 0;
    padding-top: var(--s-2);
    border-top: 1px solid var(--line);
    font-size: var(--text-xs);
  }
  .fields dt {
    color: var(--fg-subtle);
  }
  .fields dd {
    margin: 0;
    font-family: var(--font-mono);
    word-break: break-all;
  }
  .note {
    margin: var(--s-2) 0 0;
    font-size: var(--text-xs);
    color: var(--fg-subtle);
  }
  .hint {
    margin-top: var(--s-2);
    font-size: var(--text-xs);
    color: var(--fg-subtle);
  }
</style>
