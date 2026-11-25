<script>
  // A labelled box: a participant, a value, a step in a flow.
  // tone: 'default' | 'accent' (focus of the current step) | 'muted' (past or
  //       inactive) | 'ghost' (dashed placeholder, not yet known)
  import { info as infoAction } from '../info/info.svelte.js';

  let {
    x,
    y,
    w,
    h = 36,
    label,
    sub = '',
    info = null,
    tone = 'default',
    mono = false,
    rx = 6,
    align = 'middle',
    children,
  } = $props();

  const tx = $derived(align === 'start' ? x + 10 : x + w / 2);
</script>

<g class="node {tone}" use:infoAction={info}>
  <rect class="frame" {x} {y} width={w} height={h} {rx} />
  {#if label}
    <text class="ink" class:mono x={tx} y={sub ? y + h / 2 - 3 : y + h / 2 + 4.5} text-anchor={align}>{label}</text>
  {/if}
  {#if sub}
    <text class="sub" x={tx} y={y + h / 2 + 11} text-anchor={align}>{sub}</text>
  {/if}
  {@render children?.()}
</g>

<style>
  .frame {
    fill: var(--surface-raised);
    stroke: var(--line-strong);
    stroke-width: 1.25;
  }
  :global([data-theme='dark']) .frame {
    fill: var(--surface);
  }
  text {
    font-weight: 550;
  }
  .accent .frame {
    stroke: var(--accent);
    fill: var(--accent-soft);
  }
  .accent .ink {
    fill: var(--accent);
  }
  .muted .frame {
    stroke: var(--line);
  }
  .muted .ink {
    fill: var(--fg-muted);
  }
  .ghost .frame {
    fill: none;
    stroke: var(--line-strong);
    stroke-dasharray: 3 3;
  }
  .ghost .ink {
    fill: var(--fg-subtle);
  }
</style>
