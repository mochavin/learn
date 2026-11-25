<script>
  // A straight connector with an optional label and arrowheads.
  // tone: 'default' | 'accent' | 'muted'. `draw` animates the line in.
  // A wide invisible hit line makes thin arrows easy to hover and tap.
  import { getContext } from 'svelte';
  import { draw as drawIn } from 'svelte/transition';
  import { cubicInOut } from 'svelte/easing';
  import { info as infoAction } from '../info/info.svelte.js';
  import { DUR, dur } from '../motion.js';

  let {
    x1,
    y1,
    x2,
    y2,
    label = '',
    labelSide = 'above',
    head = 'end',
    tone = 'default',
    dashed = false,
    draw = false,
    info = null,
    children,
  } = $props();

  const ctx = getContext('diagram');
  const marker = $derived(
    `url(#${tone === 'accent' ? ctx.arrowAccentId : tone === 'muted' ? ctx.arrowMutedId : ctx.arrowId})`,
  );
  const mx = $derived((x1 + x2) / 2);
  const my = $derived((y1 + y2) / 2);
  const angle = $derived((Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI);
  const flat = $derived(Math.abs(angle) < 1 || Math.abs(Math.abs(angle) - 180) < 1);
  const ly = $derived(labelSide === 'above' ? my - 7 : my + 15);
</script>

<g class="arrow {tone}" use:infoAction={info}>
  {#if info}<line class="hit" {x1} {y1} {x2} {y2} />{/if}
  {#if draw}
    <line
      class="frame"
      class:dashed
      {x1}
      {y1}
      {x2}
      {y2}
      marker-end={head === 'end' || head === 'both' ? marker : undefined}
      marker-start={head === 'start' || head === 'both' ? marker : undefined}
      in:drawIn={{ duration: dur(DUR.travel), easing: cubicInOut }}
    />
  {:else}
    <line
      class="frame"
      class:dashed
      {x1}
      {y1}
      {x2}
      {y2}
      marker-end={head === 'end' || head === 'both' ? marker : undefined}
      marker-start={head === 'start' || head === 'both' ? marker : undefined}
    />
  {/if}
  {#if label}
    <text class="ink" x={mx} y={flat ? ly : my - 6} text-anchor="middle">{label}</text>
  {/if}
  {@render children?.({ mx, my })}
</g>

<style>
  .frame {
    stroke: var(--fg);
    stroke-width: 1.25;
    fill: none;
  }
  .dashed {
    stroke-dasharray: 4 4;
  }
  .hit {
    stroke: transparent;
    stroke-width: 18;
  }
  text {
    font-weight: 550;
  }
  .accent .frame {
    stroke: var(--accent);
    stroke-width: 1.6;
  }
  .accent text {
    fill: var(--accent);
  }
  .muted .frame {
    stroke: var(--fg-subtle);
  }
  .muted text {
    fill: var(--fg-muted);
    font-weight: 500;
  }
</style>
