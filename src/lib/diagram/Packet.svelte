<script>
  // A message in flight: a small envelope that travels from (x1,y1) to
  // (x2,y2) once when mounted. Wrap it in {#key steps.version} to replay it.
  // `locked` draws a padlock on it (encrypted payload).
  import { onMount } from 'svelte';
  import gsap from 'gsap';
  import { DUR, dur, EASE_TRAVEL } from '../motion.js';

  let { x1, y1, x2, y2, locked = false, tone = 'accent', delay = 0, duration = DUR.travel, onarrive } = $props();
  let el = $state();

  onMount(() => {
    const tween = gsap.fromTo(
      el,
      { x: x1, y: y1, opacity: 0 },
      {
        keyframes: [
          { opacity: 1, duration: 0.12 },
          { x: x2, y: y2, duration: dur(duration) / 1000, ease: EASE_TRAVEL },
          { opacity: 0, duration: 0.25 },
        ],
        delay: dur(delay) / 1000,
        onComplete: () => onarrive?.(),
      },
    );
    return () => tween.kill();
  });
</script>

<g bind:this={el} class="packet {tone}" aria-hidden="true" style="opacity:0">
  <rect x="-13" y="-9" width="26" height="18" rx="3" />
  {#if locked}
    <path class="glyph" d="M-3.5 -1v-2.2a3.5 3.5 0 0 1 7 0V-1" />
    <rect class="glyph-fill" x="-5" y="-1.5" width="10" height="7" rx="1.2" />
  {:else}
    <path class="glyph" d="M-8 -4.5L0 1.5 8 -4.5" />
  {/if}
</g>

<style>
  rect:first-child {
    fill: var(--bg);
    stroke: var(--fg);
    stroke-width: 1.25;
  }
  .accent rect:first-child {
    stroke: var(--accent);
    fill: var(--surface-raised);
  }
  .glyph {
    fill: none;
    stroke: var(--fg);
    stroke-width: 1.3;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  .accent .glyph {
    stroke: var(--accent);
  }
  .glyph-fill {
    fill: var(--fg);
  }
  .accent .glyph-fill {
    fill: var(--accent);
  }
</style>
