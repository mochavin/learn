<script>
  // Diffie-Hellman with numbers small enough to check by hand, plus the
  // eavesdropper's brute-force attack, which only works because p is tiny.
  import { fade, fly } from 'svelte/transition';
  import Figure from '$lib/components/Figure.svelte';
  import Stepper from '$lib/components/Stepper.svelte';
  import { info } from '$lib/info/info.svelte.js';
  import { Steps } from '$lib/steps.svelte.js';
  import { dur, DUR } from '$lib/motion.js';

  const LABELS = ['Public parameters', 'Private keys', 'Public keys', 'Exchange', 'Shared secret', "Eve's brute force"];
  const steps = new Steps(LABELS.length);
  const s = $derived(steps.index);

  function modpow(base, exp, mod) {
    let r = 1;
    let b = base % mod;
    let e = exp;
    while (e > 0) {
      if (e & 1) r = (r * b) % mod;
      b = (b * b) % mod;
      e >>= 1;
    }
    return r;
  }
  function primitiveRoot(p) {
    const phi = p - 1;
    const factors = [];
    let n = phi;
    for (let f = 2; f * f <= n; f++) {
      if (n % f === 0) {
        factors.push(f);
        while (n % f === 0) n /= f;
      }
    }
    if (n > 1) factors.push(n);
    for (let g = 2; g < p; g++) if (factors.every((f) => modpow(g, phi / f, p) !== 1)) return g;
    return 2;
  }

  const PRIMES = [23, 97, 467];
  let p = $state(23);
  const g = $derived(primitiveRoot(p));
  let a = $state(6);
  let b = $state(15);

  function setP(np) {
    p = np;
    a = Math.min(a, np - 2);
    b = Math.min(b, np - 2);
    resetAttack();
  }
  function randomize() {
    a = 2 + Math.floor(Math.random() * (p - 3));
    b = 2 + Math.floor(Math.random() * (p - 3));
    resetAttack();
  }

  const A = $derived(modpow(g, a, p));
  const B = $derived(modpow(g, b, p));
  const sClient = $derived(modpow(B, a, p));
  const sServer = $derived(modpow(A, b, p));

  // Brute force: Eve tries x = 1, 2, ... until g^x mod p = A.
  let tried = $state(0);
  let timer;
  const found = $derived(tried > 0 && modpow(g, tried, p) === A);
  function resetAttack() {
    clearInterval(timer);
    tried = 0;
  }
  function runAttack() {
    resetAttack();
    const speed = Math.max(8, Math.round(1400 / a));
    if (dur(1) === 0) {
      tried = a;
      return;
    }
    timer = setInterval(() => {
      tried++;
      if (modpow(g, tried, p) === A || tried >= p - 1) clearInterval(timer);
    }, speed);
  }
  $effect(() => {
    if (s === 5) runAttack();
    else resetAttack();
    return () => clearInterval(timer);
  });

  const pub = (title, body) => ({ kind: 'Public', title, body, note: 'Known to everyone, including Eve.' });
  const priv = (title, body) => ({ kind: 'Private', title, body, note: 'Never leaves this side.' });
</script>

{#snippet pow(base, exp)}<span class="pow">{base}<sup>{exp}</sup></span>{/snippet}

<Figure title="Diffie-Hellman with small numbers">
  {#snippet controls()}
    <Stepper {steps} labels={LABELS} />
  {/snippet}

  <div class="params">
    <div class="segmented" role="group" aria-label="Prime modulus">
      {#each PRIMES as np}
        <button aria-pressed={p === np} onclick={() => setP(np)}>p = {np}</button>
      {/each}
    </div>
    <label>
      <span>client secret a</span>
      <input type="range" min="2" max={p - 2} bind:value={a} oninput={resetAttack} />
      <span class="mono val">{a}</span>
    </label>
    <label>
      <span>server secret b</span>
      <input type="range" min="2" max={p - 2} bind:value={b} oninput={resetAttack} />
      <span class="mono val">{b}</span>
    </label>
    <button class="btn" onclick={randomize}>Random secrets</button>
  </div>

  <div class="cols">
    <div class="col">
      <div class="head" use:info={{ kind: 'Participant', title: 'Client', body: 'Knows its own secret a and everything public.' }}>Client</div>
      <div class="cell" use:info={pub(`p = ${p}, g = ${g}`, `The prime modulus p and generator g. In TLS these are fixed by the named group, here x25519, so nothing about them is negotiated beyond the group name.`)}>
        <span class="mono">p = {p}, g = {g}</span>
      </div>
      {#if s >= 1}
        <div class="cell private" in:fade={{ duration: dur(DUR.enter) }} use:info={priv(`a = ${a}`, 'A random number picked by the client for this connection only.')}>
          <span class="tag">private</span><span class="mono">a = {a}</span>
        </div>
      {/if}
      {#if s >= 2}
        <div class="cell" class:now={s === 2} in:fade={{ duration: dur(DUR.enter) }} use:info={pub(`A = ${A}`, `g to the power a, reduced mod p: ${g}^${a} mod ${p} = ${A}. Easy to compute, but going back from A to a (the discrete logarithm) is hard when p is large.`)}>
          <span class="mono">A = {@render pow(g, a)} mod {p} = <b>{A}</b></span>
        </div>
      {/if}
      {#if s >= 3}
        <div class="cell recv" class:now={s === 3} in:fly={{ x: 60, duration: dur(DUR.travel) }} use:info={pub(`B = ${B} (received)`, 'The server\'s public value, received over the network.')}>
          <span class="tag">received</span><span class="mono">B = {B}</span>
        </div>
      {/if}
      {#if s >= 4}
        <div class="cell secret" in:fade={{ duration: dur(DUR.enter) }} use:info={{ kind: 'Shared secret', title: `s = ${sClient}`, body: `B to the power a: ${B}^${a} mod ${p} = ${sClient}. Because B^a = (g^b)^a = g^(ab), this equals what the server computes.` }}>
          <span class="mono">s = {@render pow(B, a)} mod {p} = <b>{sClient}</b></span>
        </div>
      {/if}
    </div>

    <div class="col wire">
      <div class="head" use:info={{ kind: 'Attacker', title: 'Eve, on the wire', body: 'A passive eavesdropper who can read every byte sent between the two sides. She cannot see their private numbers.' }}>
        Eve sees
      </div>
      <div class="cell" use:info={pub(`p = ${p}, g = ${g}`, 'Public parameters, known to Eve.')}><span class="mono">p = {p}, g = {g}</span></div>
      {#if s >= 1}
        <div class="cell ghost" in:fade={{ duration: dur(DUR.enter) }} use:info={{ kind: 'Unknown to Eve', title: 'a and b', body: 'The private numbers never go on the wire.' }}>
          <span class="mono">a = ?, b = ?</span>
        </div>
      {/if}
      {#if s >= 3}
        <div class="cell" class:now={s === 3} in:fade={{ duration: dur(DUR.travel) }} use:info={pub(`A = ${A}`, 'Copied off the wire as it passed.')}><span class="mono">A = {A}</span></div>
        <div class="cell" class:now={s === 3} in:fade={{ duration: dur(DUR.travel), delay: dur(150) }} use:info={pub(`B = ${B}`, 'Copied off the wire as it passed.')}><span class="mono">B = {B}</span></div>
      {/if}
      {#if s >= 4}
        <div class="cell ghost" in:fade={{ duration: dur(DUR.enter) }} use:info={{ kind: 'Unknown to Eve', title: 's = ?', body: 'To get s, Eve needs a or b. Multiplying A by B gives g^(a+b), not g^(ab). Her only route is solving the discrete logarithm.' }}>
          <span class="mono">s = ?</span>
        </div>
      {/if}
    </div>

    <div class="col">
      <div class="head" use:info={{ kind: 'Participant', title: 'Server', body: 'Knows its own secret b and everything public.' }}>Server</div>
      <div class="cell" use:info={pub(`p = ${p}, g = ${g}`, 'The same public parameters.')}><span class="mono">p = {p}, g = {g}</span></div>
      {#if s >= 1}
        <div class="cell private" in:fade={{ duration: dur(DUR.enter) }} use:info={priv(`b = ${b}`, 'A random number picked by the server for this connection only.')}>
          <span class="tag">private</span><span class="mono">b = {b}</span>
        </div>
      {/if}
      {#if s >= 2}
        <div class="cell" class:now={s === 2} in:fade={{ duration: dur(DUR.enter) }} use:info={pub(`B = ${B}`, `${g}^${b} mod ${p} = ${B}.`)}>
          <span class="mono">B = {@render pow(g, b)} mod {p} = <b>{B}</b></span>
        </div>
      {/if}
      {#if s >= 3}
        <div class="cell recv" class:now={s === 3} in:fly={{ x: -60, duration: dur(DUR.travel) }} use:info={pub(`A = ${A} (received)`, 'The client\'s public value, received over the network.')}>
          <span class="tag">received</span><span class="mono">A = {A}</span>
        </div>
      {/if}
      {#if s >= 4}
        <div class="cell secret" in:fade={{ duration: dur(DUR.enter) }} use:info={{ kind: 'Shared secret', title: `s = ${sServer}`, body: `A to the power b: ${A}^${b} mod ${p} = ${sServer}. Same number as the client, and it was never sent.` }}>
          <span class="mono">s = {@render pow(A, b)} mod {p} = <b>{sServer}</b></span>
        </div>
      {/if}
    </div>
  </div>

  {#if s >= 4}
    <p class="result" in:fade={{ duration: dur(DUR.enter) }}>
      {#if sClient === sServer}
        Both sides computed <b class="mono">s = {sClient}</b>. In TLS, this value feeds the key schedule.
      {/if}
    </p>
  {/if}

  {#if s === 5}
    <div class="attack" in:fade={{ duration: dur(DUR.enter) }}>
      <div class="attack-head">
        <span>
          Eve tries every exponent x until <span class="mono">{g}<sup>x</sup> mod {p} = {A}</span>:
          <b>{found ? `found a = ${tried} after ${tried} tries` : `${tried} tried`}</b>
        </span>
        <button class="btn" onclick={runAttack}>Run again</button>
      </div>
      <div class="grid" class:big={p > 100}>
        {#each { length: p - 1 } as _, i}
          {@const x = i + 1}
          {@const v = modpow(g, x, p)}
          <span
            class="c"
            class:tried={x <= tried}
            class:hit={found && x === tried}
            use:info={{ kind: 'Guess', title: `x = ${x}`, body: `${g}^${x} mod ${p} = ${v}${v === A ? ', which matches A' : ''}.` }}
          >{p <= 100 ? v : ''}</span>
        {/each}
      </div>
      <p class="scale">
        With p = {p} there are only {p - 1} exponents to try. X25519 has about 2<sup>252</sup> possible private keys: at
        a billion guesses per second, trying them all would take about 10<sup>59</sup> years. Better algorithms than
        brute force exist, but for well-chosen groups they are still far out of reach.
      </p>
    </div>
  {/if}
</Figure>

<style>
  .params {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--s-3) var(--s-5);
    margin-bottom: var(--s-5);
  }
  label {
    display: inline-flex;
    align-items: center;
    gap: var(--s-2);
    font-size: var(--text-xs);
    color: var(--fg-muted);
  }
  input[type='range'] {
    width: 110px;
    accent-color: var(--accent);
  }
  .val {
    min-width: 2.5ch;
    color: var(--fg);
  }
  .cols {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: var(--s-3);
  }
  .col {
    display: flex;
    flex-direction: column;
    gap: var(--s-2);
    min-width: 0;
  }
  .wire {
    padding: 0 var(--s-2);
    border-left: 1px dashed var(--line-strong);
    border-right: 1px dashed var(--line-strong);
  }
  .head {
    font-weight: 620;
    padding: 2px 4px;
    margin-bottom: var(--s-1);
  }
  .cell {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 2px 6px;
    padding: 7px 10px;
    border: 1px solid var(--line-strong);
    border-radius: var(--radius);
    font-size: var(--text-xs);
    min-width: 0;
    overflow-wrap: anywhere;
  }
  .cell.private {
    border-style: dashed;
  }
  .cell.ghost {
    border-style: dashed;
    border-color: var(--line);
    color: var(--fg-subtle);
  }
  .cell.now {
    border-color: var(--accent-line);
  }
  .cell.secret {
    border-color: var(--accent);
    color: var(--accent);
    background: var(--accent-soft);
  }
  .tag {
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--fg-subtle);
  }
  .pow sup,
  sup {
    font-size: 0.7em;
  }
  .result {
    margin: var(--s-4) 0 0;
    color: var(--fg-muted);
  }
  .attack {
    margin-top: var(--s-5);
    padding-top: var(--s-4);
    border-top: 1px solid var(--line);
  }
  .attack-head {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: center;
    gap: var(--s-2) var(--s-4);
    margin-bottom: var(--s-3);
  }
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(26px, 1fr));
    gap: 3px;
  }
  .grid.big {
    grid-template-columns: repeat(auto-fill, minmax(10px, 1fr));
    gap: 2px;
  }
  .c {
    display: grid;
    place-items: center;
    aspect-ratio: 1;
    border: 1px solid var(--line);
    font-family: var(--font-mono);
    font-size: 10px;
    color: var(--fg-subtle);
    border-radius: 3px;
  }
  .c.tried {
    background: var(--surface);
    border-color: var(--line-strong);
    color: var(--fg-muted);
  }
  .c.hit {
    background: var(--accent);
    border-color: var(--accent);
    color: var(--accent-fg);
  }
  .scale {
    margin: var(--s-4) 0 0;
    font-size: var(--text-xs);
    color: var(--fg-muted);
  }
  @media (max-width: 520px) {
    .cols {
      gap: var(--s-2);
    }
    .cell {
      padding: 6px 7px;
    }
    .wire {
      padding: 0 var(--s-1);
    }
  }
</style>
