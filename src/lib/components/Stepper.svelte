<script>
  // Step controls for a Steps instance: restart, previous, play/pause, next,
  // a clickable progress track and the current step's label.
  // Arrow keys and Space work while any control has focus.
  // Autoplay pauses when the illustration scrolls out of view.
  import { onMount } from 'svelte';

  /** @type {{ steps: import('../steps.svelte.js').Steps, labels: string[] }} */
  let { steps, labels } = $props();
  let root = $state();

  onMount(() => {
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting && steps.playing) steps.pause();
    });
    io.observe(root);
    return () => {
      io.disconnect();
      steps.destroy();
    };
  });

  function onKey(e) {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      steps.next();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      steps.prev();
    } else if (e.key === ' ' && e.target.tagName !== 'BUTTON') {
      e.preventDefault();
      steps.toggle();
    }
  }
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="stepper" bind:this={root} onkeydown={onKey}>
  <div class="controls">
    <button class="btn icon" aria-label="Restart" title="Restart" disabled={steps.atStart} onclick={() => steps.reset()}>
      <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 3v10M13 3.5L6.5 8 13 12.5z" /></svg>
    </button>
    <button class="btn icon" aria-label="Previous step" title="Previous (Left arrow)" disabled={steps.atStart} onclick={() => steps.prev()}>
      <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M10 3.5L5 8l5 4.5" class="line" /></svg>
    </button>
    <button
      class="btn play"
      aria-label={steps.playing ? 'Pause' : 'Play'}
      title={steps.playing ? 'Pause' : 'Play'}
      aria-pressed={steps.playing}
      onclick={() => steps.toggle()}
    >
      {#if steps.playing}
        <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M5 3.5h2v9H5zM9 3.5h2v9H9z" /></svg>
        <span>Pause</span>
      {:else}
        <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M5 3l8 5-8 5z" /></svg>
        <span>{steps.atEnd ? 'Replay' : 'Play'}</span>
      {/if}
    </button>
    <button class="btn icon" aria-label="Next step" title="Next (Right arrow)" disabled={steps.atEnd} onclick={() => steps.next()}>
      <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M6 3.5L11 8l-5 4.5" class="line" /></svg>
    </button>
    <div class="label" aria-live="polite">
      <span class="count mono">{steps.index + 1}/{steps.count}</span>
      <span class="name">{labels[steps.index] ?? ''}</span>
    </div>
  </div>
  <div class="track" role="group" aria-label="Steps">
    {#each { length: steps.count } as _, i}
      <button
        class="seg"
        class:done={i < steps.index}
        class:now={i === steps.index}
        aria-label="Step {i + 1}: {labels[i] ?? ''}"
        aria-current={i === steps.index ? 'step' : undefined}
        title={labels[i]}
        onclick={() => steps.go(i)}
      ><span></span></button>
    {/each}
  </div>
</div>

<style>
  .stepper {
    display: flex;
    flex-direction: column;
    gap: var(--s-2);
  }
  .controls {
    display: flex;
    align-items: center;
    gap: var(--s-1);
  }
  svg {
    width: 14px;
    height: 14px;
    fill: currentColor;
  }
  svg .line {
    fill: none;
    stroke: currentColor;
    stroke-width: 1.6;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  .play {
    min-width: 88px;
  }
  .label {
    display: flex;
    align-items: baseline;
    gap: var(--s-2);
    margin-left: var(--s-2);
    min-width: 0;
    font-size: var(--text-sm);
  }
  .count {
    color: var(--fg-subtle);
    font-size: var(--text-xs);
  }
  .name {
    font-weight: 560;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .track {
    display: flex;
    gap: 3px;
  }
  .seg {
    flex: 1;
    padding: 6px 0;
    border: 0;
    background: none;
  }
  .seg span {
    display: block;
    height: 3px;
    border-radius: 2px;
    background: var(--line);
    transition: background-color var(--dur-ui) var(--ease);
  }
  .seg:hover span {
    background: var(--line-strong);
  }
  .seg.done span {
    background: var(--fg-subtle);
  }
  .seg.now span {
    background: var(--accent);
  }
  @media (max-width: 480px) {
    .play span {
      display: none;
    }
    .play {
      min-width: 32px;
      padding: 0;
    }
  }
</style>
