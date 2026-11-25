<script>
  // Frame for every illustration. Always "wide" (breaks out of the prose
  // column). Shows a title, the hover hint, optional controls, the drawing and
  // an optional caption.
  //
  //   <Figure title="..." caption="...">
  //     {#snippet controls()}<Stepper .../>{/snippet}
  //     ...drawing...
  //   </Figure>
  let { title, caption = '', hint = true, controls, children, footer } = $props();
</script>

<figure class="figure wide">
  {#if title || hint}
    <header>
      {#if title}<div class="title">{title}</div>{/if}
      {#if hint}<div class="hint">Hover or tap any element for details</div>{/if}
    </header>
  {/if}
  {#if controls}<div class="controls">{@render controls()}</div>{/if}
  <div class="body">{@render children()}</div>
  {#if footer}<div class="footer">{@render footer()}</div>{/if}
  {#if caption}<figcaption>{caption}</figcaption>{/if}
</figure>

<style>
  .figure {
    margin: 0;
    border: 1px solid var(--line);
    border-radius: var(--radius-lg);
    background: var(--surface-raised);
    font-size: var(--text-sm);
    line-height: var(--leading-ui);
    min-width: 0;
  }
  :global([data-theme='dark']) .figure {
    background: var(--surface);
  }
  header {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    justify-content: space-between;
    gap: var(--s-1) var(--s-4);
    padding: var(--s-4) var(--s-4) 0;
  }
  .title {
    font-weight: 620;
    font-size: var(--text-md);
  }
  .hint {
    font-size: var(--text-xs);
    color: var(--fg-subtle);
  }
  .controls {
    padding: var(--s-3) var(--s-4) 0;
  }
  .body {
    padding: var(--s-4);
    min-width: 0;
  }
  .footer {
    padding: 0 var(--s-4) var(--s-4);
  }
  figcaption {
    padding: var(--s-3) var(--s-4);
    border-top: 1px solid var(--line);
    color: var(--fg-muted);
    font-size: var(--text-sm);
  }
  @media (min-width: 720px) {
    header,
    .controls {
      padding-left: var(--s-5);
      padding-right: var(--s-5);
    }
    .body {
      padding: var(--s-5);
    }
    .footer {
      padding: 0 var(--s-5) var(--s-5);
    }
    figcaption {
      padding: var(--s-3) var(--s-5);
    }
  }
</style>
