<script>
  // Inline HTML pill for values, keys and fields next to a diagram.
  // tone: 'default' | 'accent' | 'muted' | 'ghost'
  import { info as infoAction } from '../info/info.svelte.js';
  let { label, value = '', info = null, tone = 'default', mono = false, children } = $props();
</script>

<span class="chip {tone}" class:mono use:infoAction={info}>
  {@render children?.()}
  <span class="label">{label}</span>
  {#if value}<span class="value mono">{value}</span>{/if}
</span>

<style>
  .chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    max-width: 100%;
    padding: 3px 8px;
    border: 1px solid var(--line-strong);
    border-radius: 999px;
    background: var(--surface-raised);
    font-size: var(--text-xs);
    line-height: 1.4;
    white-space: nowrap;
  }
  .label {
    font-weight: 560;
  }
  .value {
    color: var(--fg-muted);
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .accent {
    border-color: var(--accent-line);
    background: var(--accent-soft);
    color: var(--accent);
  }
  .muted {
    border-color: var(--line);
    color: var(--fg-muted);
  }
  .ghost {
    border-style: dashed;
    background: transparent;
    color: var(--fg-subtle);
  }
</style>
