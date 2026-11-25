<script>
  // Small line icons for diagrams, centered on (x, y), ~14px.
  // name: 'key' | 'lock' | 'unlock' | 'check' | 'cross' | 'cert' | 'eye' | 'dot'
  let { name, x, y, size = 14, tone = 'default' } = $props();
  const s = $derived(size / 14);
</script>

<g class="glyph {tone}" transform="translate({x} {y}) scale({s})" aria-hidden="true">
  {#if name === 'key'}
    <circle cx="-3.5" cy="0" r="3.2" />
    <path d="M-0.3 0H6.5M4.2 0v2.6M6.5 0v2.2" />
  {:else if name === 'lock'}
    <path d="M-3.5 -1.5v-2a3.5 3.5 0 0 1 7 0v2" />
    <rect x="-5.2" y="-1.5" width="10.4" height="7.5" rx="1.5" class="solid" />
  {:else if name === 'unlock'}
    <path d="M-3.5 -1.5v-2a3.5 3.5 0 0 1 6.6-1.6" />
    <rect x="-5.2" y="-1.5" width="10.4" height="7.5" rx="1.5" />
  {:else if name === 'check'}
    <path d="M-5 0.5L-1.5 4 5.5 -3.5" />
  {:else if name === 'cross'}
    <path d="M-4.5 -4.5L4.5 4.5M4.5 -4.5L-4.5 4.5" />
  {:else if name === 'cert'}
    <rect x="-6" y="-5" width="12" height="9" rx="1.5" />
    <path d="M-3.5 -2H3.5M-3.5 0.5H1" />
    <circle cx="3" cy="4.5" r="2" class="solid" />
  {:else if name === 'eye'}
    <path d="M-6.5 0C-4.5 -4 4.5 -4 6.5 0 4.5 4 -4.5 4 -6.5 0Z" />
    <circle cx="0" cy="0" r="1.8" class="solid" />
  {:else}
    <circle cx="0" cy="0" r="3" class="solid" />
  {/if}
</g>

<style>
  .glyph :global(*) {
    fill: none;
    stroke: var(--fg);
    stroke-width: 1.4;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  .glyph .solid {
    fill: var(--fg);
    stroke: none;
  }
  .accent :global(*) {
    stroke: var(--accent);
  }
  .accent .solid {
    fill: var(--accent);
  }
  .muted :global(*) {
    stroke: var(--fg-subtle);
  }
  .muted .solid {
    fill: var(--fg-subtle);
  }
</style>
