<script>
  // TLS 1.2 vs TLS 1.3 on the same clock. Time runs down; a one-way trip
  // takes half a round trip, so arrows slope. A shared cursor sweeps both.
  import { Tween } from 'svelte/motion';
  import { cubicInOut } from 'svelte/easing';
  import Figure from '$lib/components/Figure.svelte';
  import Stepper from '$lib/components/Stepper.svelte';
  import { Diagram, Lifeline, Arrow } from '$lib/diagram';
  import { info } from '$lib/info/info.svelte.js';
  import { Steps } from '$lib/steps.svelte.js';
  import { dur } from '$lib/motion.js';

  const TIMES = [0, 0.5, 1, 1.5, 2, 2.5, 3];
  const steps = new Steps(TIMES.length, { interval: 2200 });
  const time = new Tween(0, { easing: cubicInOut });
  $effect(() => {
    time.set(TIMES[steps.index], { duration: dur(900) });
  });

  let mode = $state('full');

  // t: send time in RTTs. dir: 'cs' client to server, 'sc' back.
  const TLS12 = [
    { t: 0, dir: 'cs', lines: ['ClientHello'], info: { title: 'ClientHello (1.2)', body: 'Offers versions and cipher suites. In TLS 1.2 a cipher suite fixes key exchange, signature, cipher and hash together, for example ECDHE_RSA_WITH_AES_128_GCM_SHA256. No key share yet.' } },
    { t: 0.5, dir: 'sc', lines: ['ServerHello, Certificate,', 'ServerKeyExchange,', 'ServerHelloDone'], info: { title: 'Server flight (1.2)', body: 'All in plaintext, certificate included. ServerKeyExchange carries the server\'s ECDHE public key, signed with the certificate key. With the old RSA key exchange this message did not exist at all.' } },
    { t: 1, dir: 'cs', lines: ['ClientKeyExchange,', 'ChangeCipherSpec, Finished'], info: { title: 'Client flight (1.2)', body: 'Only now does the client send its key share. ChangeCipherSpec switches to the new keys, then an encrypted Finished. With False Start the client may send data here, but that is an optional optimisation.' } },
    { t: 1.5, dir: 'sc', lines: ['ChangeCipherSpec, Finished'], info: { title: 'Server Finished (1.2)', body: 'The server switches to encryption and proves the handshake was intact. Two round trips have passed.' } },
    { t: 2, dir: 'cs', lines: ['[HTTP request]'], data: true, info: { title: 'First request (1.2)', body: 'Application data can flow after two full round trips.' } },
    { t: 2.5, dir: 'sc', lines: ['[HTTP response]'], data: true, info: { title: 'Response (1.2)', body: 'Arrives three round trips after the client started.' } },
  ];
  const TLS13 = {
    full: [
      { t: 0, dir: 'cs', lines: ['ClientHello + key_share'], info: { title: 'ClientHello (1.3)', body: 'Carries the ephemeral public key immediately. That guess is the whole trick that saves a round trip.' } },
      { t: 0.5, dir: 'sc', lines: ['ServerHello + key_share,', '{EncryptedExtensions, Certificate,', 'CertificateVerify, Finished}'], info: { title: 'Server flight (1.3)', body: 'One flight: the server\'s key share, then everything else already encrypted. The server is authenticated and done.' } },
      { t: 1, dir: 'cs', lines: ['{Finished} + [HTTP request]'], data: true, info: { title: 'Client Finished + request (1.3)', body: 'The client finishes and sends its request in the same flight, one round trip in.' } },
      { t: 1.5, dir: 'sc', lines: ['[HTTP response]'], data: true, info: { title: 'Response (1.3)', body: 'Arrives two round trips after ClientHello: one for the handshake, one for the request itself. TLS 1.2 needed three.' } },
    ],
    resume: [
      { t: 0, dir: 'cs', lines: ['ClientHello + PSK + key_share,', '(early data: HTTP request)'], data: true, info: { title: 'ClientHello with 0-RTT (1.3)', body: 'Resuming with a pre-shared key from an earlier session ticket, the client encrypts its request with the early traffic key and sends it with the very first message. That data can be replayed by an attacker, so servers only accept it for idempotent requests like a plain GET.' } },
      { t: 0.5, dir: 'sc', lines: ['ServerHello, {EE, Finished},', '[HTTP response]'], data: true, info: { title: 'Server flight with response (1.3)', body: 'No certificate needed: the PSK already authenticates the server. The response comes back in the first flight.' } },
      { t: 1, dir: 'cs', lines: ['{EndOfEarlyData, Finished}'], info: { title: 'Client Finished (1.3)', body: 'Closes the early data stream and completes the handshake.' } },
    ],
  };

  const MILESTONES = {
    tls12: [
      { t: 2, label: 'request sent' },
      { t: 3, label: 'response' },
    ],
    full: [
      { t: 1, label: 'request sent' },
      { t: 2, label: 'response' },
    ],
    resume: [
      { t: 0, label: 'request sent' },
      { t: 1, label: 'response' },
    ],
  };

  const TOP = 56;
  const PER = 120; // px per RTT
  const H = TOP + 3 * PER + 24;
  let w12 = $state(0);
  let w13 = $state(0);

  const yOf = (t) => TOP + t * PER;
</script>

{#snippet timeline(w, msgs, milestones, version)}
  {@const cx = w < 420 ? 40 : 56}
  {@const sx = w - cx}
  {@const t = time.current}
  <Lifeline x={cx} w={w < 420 ? 72 : 96} h={36} length={H - 36} label="Client" info={{ kind: 'Participant', title: 'Client', body: `TLS ${version} client.` }} />
  <Lifeline x={sx} w={w < 420 ? 72 : 96} h={36} length={H - 36} label="Server" info={{ kind: 'Participant', title: 'Server', body: `TLS ${version} server.` }} />

  {#each [0, 1, 2, 3] as r}
    <g class="tick">
      <line x1={cx - 6} x2={cx} y1={yOf(r)} y2={yOf(r)} />
      <text x={cx - 9} y={yOf(r) + 4} text-anchor="end">{r}</text>
    </g>
  {/each}

  {#each msgs as m}
    {@const p = Math.max(0, Math.min(1, (t - m.t) / 0.5))}
    {#if p > 0}
      {@const x1 = m.dir === 'cs' ? cx : sx}
      {@const x2 = m.dir === 'cs' ? sx : cx}
      {@const y1 = yOf(m.t)}
      {@const y2 = yOf(m.t + 0.5)}
      {@const ex = x1 + (x2 - x1) * p}
      {@const ey = y1 + (y2 - y1) * p}
      {@const live = t - m.t < 0.5 + 1e-6 && t > m.t}
      <g use:info={{ kind: `TLS ${version}`, ...m.info }}>
        <line class="hit" {x1} {y1} x2={ex} y2={ey} />
        <Arrow {x1} {y1} x2={ex} y2={ey} head={p >= 1 ? 'end' : 'none'} tone={m.data ? 'accent' : 'default'} />
        {#if p < 1}<circle class="tip" class:data={m.data} cx={ex} cy={ey} r="3.5" />{/if}
        <text class="msg" class:data={m.data} class:live x={(cx + sx) / 2} y={(y1 + y2) / 2 - 6 - (m.lines.length - 1) * 13 + (m.dir === 'cs' ? -4 : -4)} text-anchor="middle" opacity={Math.min(1, p * 2)}>
          {#each m.lines as line, li}<tspan x={(cx + sx) / 2} dy={li ? 13 : 0}>{line}</tspan>{/each}
        </text>
      </g>
    {/if}
  {/each}

  {#each milestones as ms}
    {#if t >= ms.t - 1e-6}
      <g class="milestone" use:info={{ kind: 'Milestone', title: `${ms.label} at ${ms.t} RTT`, body: ms.label === 'response' ? 'When the first byte of the answer reaches the client (TCP setup not counted).' : 'When the first HTTP request leaves the client.' }}>
        <circle cx={cx} cy={yOf(ms.t)} r="5" />
        <text x={cx + 10} y={yOf(ms.t) + (ms.label === 'response' ? 16 : -8)}>{ms.label}</text>
      </g>
    {/if}
  {/each}

  <line class="cursor" x1={0} x2={w} y1={yOf(t)} y2={yOf(t)} />
{/snippet}

<Figure title="TLS 1.2 vs TLS 1.3, on the same clock">
  {#snippet controls()}
    <Stepper {steps} labels={TIMES.map((t) => `t = ${t} RTT`)} />
  {/snippet}

  <div class="mode">
    <span class="eyebrow">TLS 1.3 handshake</span>
    <div class="segmented" role="group" aria-label="TLS 1.3 handshake type">
      <button aria-pressed={mode === 'full'} onclick={() => (mode = 'full')}>Full (1-RTT)</button>
      <button aria-pressed={mode === 'resume'} onclick={() => (mode = 'resume')}>Resumption (0-RTT)</button>
    </div>
  </div>

  <div class="pair">
    <div class="col">
      <div class="col-head" use:info={{ kind: 'Version', title: 'TLS 1.2 (2008)', body: 'Full handshake with ECDHE, the most common 1.2 configuration. Two round trips before application data.' }}>TLS 1.2</div>
      <Diagram bind:width={w12} height={H} label="TLS 1.2 handshake timeline">
        {#snippet children(w)}{@render timeline(w, TLS12, MILESTONES.tls12, '1.2')}{/snippet}
      </Diagram>
    </div>
    <div class="col">
      <div class="col-head" use:info={{ kind: 'Version', title: 'TLS 1.3 (2018)', body: 'One round trip for a full handshake, zero for resumption with early data.' }}>
        TLS 1.3 {mode === 'resume' ? '(resumption, 0-RTT)' : ''}
      </div>
      <Diagram bind:width={w13} height={H} label="TLS 1.3 handshake timeline">
        {#snippet children(w)}{@render timeline(w, TLS13[mode], MILESTONES[mode], '1.3')}{/snippet}
      </Diagram>
    </div>
  </div>
  <p class="axis">Time runs down, in round trips (RTT). A one-way trip takes half an RTT. On a 100 ms RTT link, each row is 100 ms of waiting.</p>
</Figure>

<style>
  .mode {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--s-2) var(--s-3);
    margin-bottom: var(--s-4);
  }
  .pair {
    display: grid;
    gap: var(--s-6);
  }
  @media (min-width: 900px) {
    .pair {
      grid-template-columns: 1fr 1fr;
      gap: var(--s-6);
    }
  }
  .col {
    min-width: 0;
  }
  .col-head {
    font-weight: 620;
    margin-bottom: var(--s-3);
    padding: 2px 4px;
    display: inline-block;
  }
  .tick line {
    stroke: var(--fg-subtle);
  }
  .tick text {
    font-size: 10px;
    fill: var(--fg-subtle);
    font-family: var(--font-mono);
  }
  .hit {
    stroke: transparent;
    stroke-width: 22;
  }
  .tip {
    fill: var(--fg);
  }
  .tip.data {
    fill: var(--accent);
  }
  /* A halo in the figure's background color keeps labels readable where arrows cross them. */
  .msg,
  .milestone text {
    paint-order: stroke;
    stroke: var(--surface-raised);
    stroke-width: 4px;
    stroke-linejoin: round;
  }
  :global([data-theme='dark']) .msg,
  :global([data-theme='dark']) .milestone text {
    stroke: var(--surface);
  }
  .msg {
    font-size: 11.5px;
    fill: var(--fg-muted);
  }
  .msg.live {
    fill: var(--fg);
    font-weight: 550;
  }
  .msg.data {
    fill: var(--accent);
  }
  .milestone circle {
    fill: var(--accent);
  }
  .milestone text {
    font-size: 11px;
    font-weight: 600;
    fill: var(--accent);
  }
  .cursor {
    stroke: var(--accent-line);
    stroke-width: 1;
    stroke-dasharray: 2 3;
  }
  .axis {
    margin: var(--s-4) 0 0;
    font-size: var(--text-xs);
    color: var(--fg-subtle);
  }
</style>
