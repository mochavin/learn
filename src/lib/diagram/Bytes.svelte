<script>
  // A byte strip: groups of hex bytes, each group hoverable.
  //   <Bytes groups={[{ label: 'type', bytes: Uint8Array, tone: 'muted', info }]} />
  // tone: 'default' | 'accent' | 'muted'. `max` truncates long groups.
  import { info as infoAction } from '../info/info.svelte.js';
  let { groups, max = 24 } = $props();
  const hex = (b) => b.toString(16).padStart(2, '0');
  function show(bytes) {
    const arr = Array.from(bytes, hex);
    if (arr.length <= max) return arr.join(' ');
    const keep = Math.floor((max - 2) / 2);
    return [...arr.slice(0, keep), '..', ...arr.slice(-keep)].join(' ');
  }
</script>

<div class="bytes mono">
  {#each groups as g}
    <span class="group {g.tone ?? 'default'}" use:infoAction={g.info ?? { title: g.label, body: `${g.bytes.length} bytes` }}>
      <span class="hex">{show(g.bytes)}</span>
      <span class="cap">{g.label} <span class="n">{g.bytes.length}B</span></span>
    </span>
  {/each}
</div>

<style>
  .bytes {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    font-size: 12px;
    line-height: 1.5;
  }
  .group {
    display: inline-flex;
    flex-direction: column;
    gap: 2px;
    padding: 6px 8px;
    border: 1px solid var(--line-strong);
    border-radius: var(--radius-sm);
    max-width: 100%;
  }
  .hex {
    word-break: break-all;
  }
  .cap {
    font-family: var(--font-sans);
    font-size: 11px;
    color: var(--fg-subtle);
  }
  .n {
    font-family: var(--font-mono);
  }
  .muted {
    border-color: var(--line);
    color: var(--fg-muted);
  }
  .accent {
    border-color: var(--accent-line);
    background: var(--accent-soft);
    color: var(--accent);
  }
  .accent .cap {
    color: var(--accent);
  }
</style>
