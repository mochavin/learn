<script>
  // A participant in a sequence diagram: a header box and a dashed line down.
  import Node from './Node.svelte';
  let { x, y = 0, w = 120, h = 40, length, label, sub = '', info = null, tone = 'default' } = $props();
</script>

<g class="lifeline">
  <line x1={x} y1={y + h} x2={x} y2={y + h + length} />
  <Node x={x - w / 2} {y} {w} {h} {label} {sub} {info} {tone} />
</g>

<style>
  line {
    stroke: var(--line-strong);
    stroke-width: 1.25;
    stroke-dasharray: 2 4;
  }
</style>
