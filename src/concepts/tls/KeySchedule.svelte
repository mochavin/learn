<script>
  // The TLS 1.3 key schedule (RFC 8446, section 7.1) as a spine of three
  // secrets. Inputs enter from the left, derived secrets leave to the right.
  // Future parts are drawn as ghosts so the whole shape is always visible.
  import { fade } from 'svelte/transition';
  import Figure from '$lib/components/Figure.svelte';
  import Stepper from '$lib/components/Stepper.svelte';
  import { Diagram, Node, Arrow } from '$lib/diagram';
  import { info } from '$lib/info/info.svelte.js';
  import { Steps } from '$lib/steps.svelte.js';
  import { dur } from '$lib/motion.js';

  const STEPS = [
    {
      label: 'Early Secret',
      text: 'The schedule starts by running HKDF-Extract over a pre-shared key. On a first connection there is none, so a string of zeros is used and the Early Secret is a fixed, public value. It only matters when resuming a session with a PSK, where it protects 0-RTT data.',
    },
    {
      label: 'Handshake Secret',
      text: 'Derive-Secret(Early Secret, "derived") becomes the salt for a second HKDF-Extract, this time over the ECDHE shared secret. This is where the real secrecy enters: the Handshake Secret is unknown to anyone who did not take part in the key exchange.',
    },
    {
      label: 'Handshake traffic secrets',
      text: 'Two secrets are derived from the Handshake Secret, one per direction. Each mixes in the transcript hash of ClientHello and ServerHello, so the keys are bound to exactly the parameters that were negotiated. They encrypt EncryptedExtensions through Finished.',
    },
    {
      label: 'Master Secret',
      text: 'Another "derived" step, then HKDF-Extract with zeros as input. No new secret is added; the extra stage gives a clean separation between handshake keys and application keys.',
    },
    {
      label: 'Application traffic secrets',
      text: 'The keys for application data, again one per direction, bound to the transcript up to the server\'s Finished. They can be rotated later with KeyUpdate: the next secret is HKDF-Expand-Label(current, "traffic upd", "", 32), and the old one is deleted.',
    },
    {
      label: 'Exporter and resumption',
      text: 'The exporter secret lets protocols on top of TLS derive their own keys bound to this session. The resumption secret, bound to the transcript through the client\'s Finished, seeds the PSK in session tickets for the next connection.',
    },
    {
      label: 'Keys and IVs',
      text: 'A traffic secret is not used directly. Each one is expanded into the actual AEAD key and a 12-byte IV with HKDF-Expand-Label(secret, "key", "", 16) and HKDF-Expand-Label(secret, "iv", "", 12). The record layer then builds each record\'s nonce from that IV.',
    },
  ];
  const steps = new Steps(STEPS.length);
  const at = $derived(steps.index);

  const T_HELLO = 'transcript: ClientHello..ServerHello';
  const T_SFIN = 'transcript: ClientHello..server Finished';
  const T_CFIN = 'transcript: ClientHello..client Finished';

  // row, step, labels, info
  const MAIN = [
    { row: 0, step: 0, label: 'Early Secret', sub: 'HKDF-Extract(0, PSK)', info: { kind: 'Secret', title: 'Early Secret', body: 'HKDF-Extract(salt = 0, IKM = PSK or zeros). Without a PSK this is a constant anyone can compute.' } },
    { row: 3, step: 1, label: 'Handshake Secret', sub: 'HKDF-Extract(derived, ECDHE)', info: { kind: 'Secret', title: 'Handshake Secret', body: 'HKDF-Extract(salt = Derive-Secret(Early Secret, "derived", ""), IKM = ECDHE shared secret). The first truly secret value.' } },
    { row: 7, step: 3, label: 'Master Secret', sub: 'HKDF-Extract(derived, 0)', info: { kind: 'Secret', title: 'Master Secret', body: 'HKDF-Extract(salt = Derive-Secret(Handshake Secret, "derived", ""), IKM = zeros).' } },
  ];
  const DERIVED = [
    { row: 2, step: 1 },
    { row: 6, step: 3 },
  ];
  const INPUTS = [
    { row: 0, step: 0, label: 'PSK or 0', short: 'PSK/0', info: { kind: 'Input', title: 'Pre-shared key', body: 'From a session ticket when resuming, otherwise 32 zero bytes.' } },
    { row: 3, step: 1, label: 'ECDHE', info: { kind: 'Input', title: 'ECDHE shared secret', body: 'The 32-byte X25519 output both sides computed from the key shares.' }, accent: true },
    { row: 7, step: 3, label: '0', info: { kind: 'Input', title: 'Zeros', body: 'No new secret here, just another extraction stage.' } },
  ];
  const OUTS = [
    { row: 1, step: 0, label: 'binder, early traffic', short: 'e traffic', sub: 'only with a PSK', psk: true, info: { kind: 'Derived secret', title: 'Early secrets', body: 'binder_key authenticates the PSK offer; client_early_traffic_secret encrypts 0-RTT data. Both exist only when resuming with a PSK.' } },
    { row: 4, step: 2, label: 'client hs traffic', short: 'c hs traffic', sub: T_HELLO, traffic: true, info: { kind: 'Traffic secret', title: 'client_handshake_traffic_secret', body: 'Derive-Secret(Handshake Secret, "c hs traffic", ClientHello..ServerHello). Encrypts the client\'s Finished.' } },
    { row: 5, step: 2, label: 'server hs traffic', short: 's hs traffic', sub: T_HELLO, traffic: true, info: { kind: 'Traffic secret', title: 'server_handshake_traffic_secret', body: 'Derive-Secret(Handshake Secret, "s hs traffic", ClientHello..ServerHello). Encrypts EncryptedExtensions, Certificate, CertificateVerify and the server\'s Finished.' } },
    { row: 8, step: 4, label: 'client app traffic', short: 'c ap traffic', sub: T_SFIN, traffic: true, info: { kind: 'Traffic secret', title: 'client_application_traffic_secret_0', body: 'Derive-Secret(Master Secret, "c ap traffic", ClientHello..server Finished). Encrypts everything the client sends after the handshake.' } },
    { row: 9, step: 4, label: 'server app traffic', short: 's ap traffic', sub: T_SFIN, traffic: true, info: { kind: 'Traffic secret', title: 'server_application_traffic_secret_0', body: 'Derive-Secret(Master Secret, "s ap traffic", ClientHello..server Finished). Encrypts everything the server sends after its Finished.' } },
    { row: 10, step: 5, label: 'exporter master', short: 'exp master', sub: T_SFIN, info: { kind: 'Derived secret', title: 'exporter_master_secret', body: 'Input to the TLS exporter (RFC 5705 style) for keying material used outside TLS.' } },
    { row: 11, step: 5, label: 'resumption master', short: 'res master', sub: T_CFIN, info: { kind: 'Derived secret', title: 'resumption_master_secret', body: 'Combined with a ticket nonce to make the PSK for resuming this session later.' } },
  ];

  let w = $state(0);
  const compact = $derived(w < 600);
  const G = $derived.by(() => {
    const inW = compact ? 52 : 120;
    const mainW = compact ? 114 : 200;
    const gap = compact ? 12 : 40;
    const outW = compact ? Math.max(90, w - inW - mainW - 2 * gap) : Math.min(280, w - inW - mainW - 2 * gap);
    const total = inW + gap + mainW + gap + outW;
    const x0 = Math.max(0, (w - total) / 2);
    const rowH = compact ? 36 : 42;
    return {
      inX: x0,
      inW,
      mainX: x0 + inW + gap,
      mainW,
      outX: x0 + inW + gap + mainW + gap,
      outW,
      rowH,
      nodeH: compact ? 28 : 34,
      height: 12 * rowH + 4,
    };
  });
  const cy = (r) => r * G.rowH + G.rowH / 2;
  const spineX = $derived(G.mainX + G.mainW / 2);

  const tone = (step, extra = false) => (at === step || extra ? 'accent' : at > step ? 'default' : 'ghost');
</script>

<Figure title="The key schedule">
  {#snippet controls()}
    <Stepper {steps} labels={STEPS.map((s) => s.label)} />
  {/snippet}

  <Diagram bind:width={w} height={G.height} label="TLS 1.3 key schedule: early, handshake and master secrets and the secrets derived from each">
    {#snippet children()}
      <!-- spine -->
      <line class="spine" x1={spineX} y1={cy(0)} x2={spineX} y2={cy(11)} />
      <line class="spine live" x1={spineX} y1={cy(0)} x2={spineX} y2={cy([0, 3, 5, 7, 9, 11, 11][at])} />

      {#each DERIVED as d}
        <g use:info={{ kind: 'Step', title: 'Derive-Secret(., "derived", "")', body: 'Turns the previous stage\'s secret into the salt for the next HKDF-Extract, so each stage depends on all the ones before it.' }}>
          <rect class="pill {tone(d.step)}" x={spineX - (compact ? 40 : 52)} y={cy(d.row) - 11} width={compact ? 80 : 104} height="22" rx="11" />
          <text class="pill-text {tone(d.step)}" x={spineX} y={cy(d.row) + 4} text-anchor="middle">"derived"</text>
        </g>
      {/each}

      {#each INPUTS as n}
        <Arrow x1={G.inX + G.inW} y1={cy(n.row)} x2={G.mainX - 2} y2={cy(n.row)} tone={at === n.step ? 'accent' : at > n.step ? 'default' : 'muted'} />
        <Node x={G.inX} y={cy(n.row) - G.nodeH / 2} w={G.inW} h={G.nodeH} label={compact ? (n.short ?? n.label) : n.label} tone={tone(n.step)} info={n.info} />
      {/each}

      {#each MAIN as n}
        <Node
          x={G.mainX}
          y={cy(n.row) - G.nodeH / 2 - (compact ? 0 : 2)}
          w={G.mainW}
          h={G.nodeH + (compact ? 0 : 4)}
          label={n.label}
          sub={compact ? '' : n.sub}
          tone={tone(n.step)}
          info={n.info}
        />
      {/each}

      {#each OUTS as n}
        <path class="branch {tone(n.step, at === 6 && n.traffic)}" d="M{spineX} {cy(n.row - 0.5)} V{cy(n.row)} H{G.outX - 4}" />
        <Node
          x={G.outX}
          y={cy(n.row) - G.nodeH / 2}
          w={G.outW}
          h={G.nodeH}
          label={compact ? n.short : n.label}
          sub={compact ? '' : n.sub}
          align="start"
          mono={compact}
          tone={n.psk && at > 0 ? 'ghost' : tone(n.step, at === 6 && n.traffic)}
          info={n.info}
        />
        {#if at === 6 && n.traffic && w - (G.outX + G.outW) > 64}
          <text class="kv" x={G.outX + G.outW + 10} y={cy(n.row) + 4} transition:fade={{ duration: dur(250) }}>key, iv</text>
        {/if}
      {/each}
    {/snippet}
  </Diagram>

  {#snippet footer()}
    {#key at}
      <p class="narr" in:fade={{ duration: dur(220) }}>{STEPS[at].text}</p>
    {/key}
  {/snippet}
</Figure>

<style>
  .spine {
    stroke: var(--line-strong);
    stroke-width: 1.25;
    stroke-dasharray: 3 3;
  }
  .spine.live {
    stroke: var(--fg);
    stroke-dasharray: none;
    transition: all var(--dur-diagram) var(--ease);
  }
  .branch {
    fill: none;
    stroke: var(--fg);
    stroke-width: 1.25;
  }
  .branch.ghost {
    stroke: var(--line-strong);
    stroke-dasharray: 3 3;
  }
  .branch.accent {
    stroke: var(--accent);
    stroke-width: 1.6;
  }
  .pill {
    fill: var(--bg);
    stroke: var(--line-strong);
    stroke-width: 1.25;
  }
  .pill.accent {
    stroke: var(--accent);
  }
  .pill.ghost {
    stroke-dasharray: 3 3;
  }
  .pill-text {
    font-family: var(--font-mono);
    font-size: 11px;
    fill: var(--fg-muted);
  }
  .pill-text.accent {
    fill: var(--accent);
  }
  .pill-text.ghost {
    fill: var(--fg-subtle);
  }
  .kv {
    font-family: var(--font-mono);
    font-size: 11px;
    fill: var(--accent);
  }
  .narr {
    margin: 0;
    padding-top: var(--s-3);
    border-top: 1px solid var(--line);
    color: var(--fg-muted);
    min-height: 4.5em;
  }
</style>
