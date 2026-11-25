<script>
  // Responsive SVG canvas in real pixels: the viewBox equals the rendered
  // size, so text is always drawn at its true size (12-13px) instead of being
  // scaled down on phones. Lay out from `width` and pick compact variants when
  // it is small (see "Diagrams" in DESIGN.md).
  //
  //   <Diagram bind:width height={h} label="TLS handshake">
  //     {#snippet children(w)} ... {/snippet}
  //   </Diagram>
  import { setContext } from 'svelte';

  let { width = $bindable(0), height, label, children } = $props();
  const id = $props.id();
  setContext('diagram', { arrowId: `arrow-${id}`, arrowAccentId: `arrow-accent-${id}`, arrowMutedId: `arrow-muted-${id}` });
</script>

<div class="diagram" bind:clientWidth={width}>
  {#if width > 0}
    <svg {width} {height} viewBox="0 0 {width} {height}" role="group" aria-label={label}>
      <defs>
        <marker id="arrow-{id}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M1 1.5L9 5 1 8.5" fill="none" stroke="var(--fg)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
        </marker>
        <marker id="arrow-accent-{id}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M1 1.5L9 5 1 8.5" fill="none" stroke="var(--accent)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
        </marker>
        <marker id="arrow-muted-{id}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M1 1.5L9 5 1 8.5" fill="none" stroke="var(--fg-subtle)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
        </marker>
      </defs>
      {@render children(width)}
    </svg>
  {/if}
</div>

<style>
  .diagram {
    width: 100%;
    min-width: 0;
  }
  svg {
    display: block;
    overflow: visible;
    font-size: 12.5px;
    -webkit-tap-highlight-color: transparent;
  }
  svg :global(text) {
    fill: var(--fg);
  }
  svg :global(.sub) {
    fill: var(--fg-muted);
    font-size: 11px;
  }
  svg :global(.mono) {
    font-family: var(--font-mono);
  }
</style>
