<script>
  import { theme } from '../theme.svelte.js';
  const label = $derived(
    `Switch to ${theme.current === 'dark' ? 'light' : 'dark'} theme` + (theme.override ? '' : ' (currently following system)'),
  );
</script>

<button class="btn icon" onclick={() => theme.toggle()} aria-label={label} title={label}>
  <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
    <circle cx="8" cy="8" r="6.25" fill="none" stroke="currentColor" stroke-width="1.5" />
    <path d="M8 1.75a6.25 6.25 0 0 1 0 12.5z" fill="currentColor" />
  </svg>
</button>
