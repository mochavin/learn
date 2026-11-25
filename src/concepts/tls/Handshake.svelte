<script>
  // Hero illustration: the full TLS 1.3 handshake as a sequence diagram.
  // Keys appear along each lifeline at the moment that side learns them.
  import { fade } from 'svelte/transition';
  import Figure from '$lib/components/Figure.svelte';
  import Stepper from '$lib/components/Stepper.svelte';
  import { Diagram, Lifeline, Arrow, Packet, Glyph } from '$lib/diagram';
  import { info } from '$lib/info/info.svelte.js';
  import { Steps } from '$lib/steps.svelte.js';
  import { enter, dur } from '$lib/motion.js';
  import { STEPS, KEYS, ENC_INFO } from './handshake-data.js';

  const steps = new Steps(STEPS.length);
  const step = $derived(STEPS[steps.index]);

  let w = $state(0);
  const compact = $derived(w < 540);
  const L = $derived.by(() => {
    const headW = compact ? 72 : 112;
    const clientX = compact ? 40 : 162;
    const rowH = compact ? 40 : 42;
    const rowStart = 40 + 28;
    return {
      headW,
      clientX,
      serverX: w - clientX,
      rowH,
      rowStart,
      chipW: 128,
      height: rowStart + 10 * rowH + 8,
    };
  });
  const rowY = (r) => L.rowStart + r * L.rowH + L.rowH / 2;
  const rowOf = (i) => (i === 1 ? 0 : i === 2 ? 1 : i);

  const LABELS = {
    'encrypted-extensions': '{EncryptedExtensions}',
    certificate: '{Certificate}',
    'certificate-verify': '{CertificateVerify}',
    'server-finished': '{Finished}',
    'client-finished': '{Finished}',
    'application-data': '[Application Data]',
  };

  const messages = STEPS.map((s, i) => ({ ...s, i })).filter((s) => s.from);

  function geom(m) {
    const y = rowY(rowOf(m.i));
    const a = L.clientX + 2;
    const b = L.serverX - 2;
    if (m.from === 'server') return { x1: b, x2: a, y };
    return { x1: a, x2: b, y };
  }

  function summary(s) {
    const first = s.narration.split(/(?<=\.)\s/)[0];
    return first;
  }
  const arrowInfo = (m) => ({
    kind: ENC_INFO[m.enc].kind,
    title: m.label,
    body: summary(m),
    note: ENC_INFO[m.enc].body,
  });

  // Wide: left edge of a labelled chip. Compact: center of a round marker.
  const keyX = (k) =>
    compact ? (k.side === 'client' ? L.clientX - 20 : L.serverX + 20) : k.side === 'client' ? L.clientX - 20 - L.chipW : L.serverX + 20;

  const verified = [
    { row: 5, title: 'Certificate chain verified', body: 'The client walked leaf -> intermediate -> root, checked each signature, the validity dates and that the leaf names example.com.' },
    { row: 6, title: 'Signature verified', body: 'The CertificateVerify signature checks out against the public key in the leaf certificate, so the server holds the private key.' },
    { row: 7, title: 'Finished verified', body: 'The server\'s Finished MAC matches the client\'s own computation over the same transcript, so nothing was tampered with.' },
  ];

  const dirLabel = (s) => (s.from === 'client' ? 'Client to server' : s.from === 'server' ? 'Server to client' : s.from === 'both' ? 'Both directions' : 'Local');
  const encLabel = (s) => (s.from ? ENC_INFO[s.enc].kind : 'Nothing on the wire');
</script>

<Figure title="The TLS 1.3 handshake, step by step">
  {#snippet controls()}
    <Stepper {steps} labels={STEPS.map((s) => s.label)} />
  {/snippet}

  <div class="hs">
    <div class="drawing">
      <Diagram bind:width={w} height={L.height} label="Sequence diagram of the TLS 1.3 handshake between a client and a server">
        {#snippet children()}
          <Lifeline
            x={L.clientX}
            w={L.headW}
            length={L.height - 40}
            label="Client"
            sub={compact ? '' : 'browser'}
            tone={step.from === 'client' || step.from === 'both' || step.id === 'derive' ? 'accent' : 'default'}
            info={{ kind: 'Participant', title: 'Client', body: 'Usually a browser or an HTTP library. It starts the handshake and must authenticate the server before trusting anything it says.' }}
          />
          <Lifeline
            x={L.serverX}
            w={L.headW}
            length={L.height - 40}
            label="Server"
            sub={compact ? '' : 'example.com'}
            tone={step.from === 'server' || step.from === 'both' || step.id === 'derive' ? 'accent' : 'default'}
            info={{ kind: 'Participant', title: 'Server (example.com)', body: 'Holds a certificate for example.com and its private key. In TLS 1.3 server authentication is mandatory; client certificates are optional.' }}
          />

          <!-- Round trip marker -->
          {#if steps.index >= 8 && !compact}
            <g transition:fade={{ duration: dur(300) }} use:info={{ kind: 'Timing', title: 'One round trip', body: 'From ClientHello leaving to the client sending Finished (and its first request) is one network round trip. TLS 1.2 needed two.' }}>
              <path class="rtt" d="M{L.clientX + 8} {rowY(0)} h-4 V{rowY(8)} h4" />
              <text class="rtt-label" x={L.clientX + 14} y={(rowY(0) + rowY(8)) / 2 - 8}>1 RTT</text>
            </g>
          {/if}

          {#each messages as m (m.id)}
            {#if steps.index >= m.i}
              {@const g = geom(m)}
              {@const current = steps.index === m.i}
              <Arrow
                x1={g.x1}
                y1={g.y}
                x2={g.x2}
                y2={g.y}
                head={m.from === 'both' ? 'both' : 'end'}
                label={LABELS[m.id] ?? m.label}
                tone={current ? 'accent' : 'default'}
                draw
                info={arrowInfo(m)}
              />
              {#if m.enc}
                <Glyph name="lock" x={g.x1 + (g.x2 > g.x1 ? 14 : -14)} y={g.y - 11} size={12} tone={current ? 'accent' : 'muted'} />
              {/if}
              {#if current}
                {#key steps.version}
                  <Packet x1={g.x1} y1={g.y} x2={g.x2} y2={g.y} locked={!!m.enc} />
                  {#if m.from === 'both'}
                    <Packet x1={g.x2} y1={g.y} x2={g.x1} y2={g.y} locked delay={250} />
                  {/if}
                {/key}
              {/if}
            {/if}
          {/each}

          {#each KEYS as k}
            {#if steps.index >= k.step}
              {@const y = rowY(k.row)}
              {@const x = keyX(k)}
              {@const tone = steps.index === k.step ? 'accent' : 'default'}
              <g class="key {tone}" use:info={k.info} in:fade={enter(k.delay ?? 0)}>
                {#if compact}
                  <circle class="frame" cx={x} cy={y} r="11" />
                  <Glyph name="key" x={x} y={y} size={13} tone={tone === 'accent' ? 'accent' : 'default'} />
                {:else}
                  <rect class="frame" x={x} y={y - 12} width={L.chipW} height="24" rx="12" />
                  <Glyph name="key" x={x + 16} y={y} size={13} tone={tone === 'accent' ? 'accent' : 'default'} />
                  <text class="ink" x={x + 30} y={y + 4.5}>{k.label}</text>
                {/if}
              </g>
            {/if}
          {/each}

          {#if steps.index >= 8}
            {#each verified as v, i}
              {@const y = rowY(v.row)}
              <g class="check" use:info={{ kind: 'Client check', title: v.title, body: v.body }} in:fade={enter(i * 150)}>
                <circle class="frame" cx={L.clientX - (compact ? 20 : 26)} cy={y} r="10" />
                <Glyph name="check" x={L.clientX - (compact ? 20 : 26)} y={y} size={11} tone={steps.index === 8 ? 'accent' : 'default'} />
              </g>
            {/each}
          {/if}
        {/snippet}
      </Diagram>
    </div>

    <div class="inspector" aria-live="polite">
      {#key steps.index}
        <div in:fade={{ duration: dur(220) }}>
          <div class="eyebrow">{dirLabel(step)} · {encLabel(step)}</div>
          <h4>{step.label}</h4>
          <p class="narration">{step.narration}</p>
          {#if step.fields.length}
            <ul class="fields">
              {#each step.fields as [k, v, d]}
                <li use:info={{ kind: step.id === 'derive' || step.id === 'client-finished' ? 'Computation' : 'Field', title: k, body: d, fields: [['value', v]] }}>
                  <span class="k mono">{k}</span>
                  <span class="v mono">{v}</span>
                </li>
              {/each}
            </ul>
          {/if}
        </div>
      {/key}
    </div>
  </div>

  {#snippet footer()}
    <div class="legend">
      <span use:info={{ kind: 'Legend', title: 'Plaintext message', body: 'Readable by anyone on the path. In TLS 1.3 only ClientHello and ServerHello are sent this way.' }}>
        <svg width="28" height="10" aria-hidden="true"><line x1="0" y1="5" x2="28" y2="5" class="lg-line" /></svg>
        plaintext
      </span>
      <span use:info={{ kind: 'Legend', title: '{ } Handshake keys', body: ENC_INFO.hs.body }}>
        <svg width="14" height="14" aria-hidden="true" viewBox="-7 -7 14 14"><Glyph name="lock" x={0} y={0} size={12} /></svg>
        {'{ }'} handshake keys
      </span>
      <span use:info={{ kind: 'Legend', title: '[ ] Application keys', body: ENC_INFO.app.body }}>
        <svg width="14" height="14" aria-hidden="true" viewBox="-7 -7 14 14"><Glyph name="lock" x={0} y={0} size={12} /></svg>
        [ ] application keys
      </span>
      <span use:info={{ kind: 'Legend', title: 'Key', body: 'A secret one side holds. It appears on the timeline at the moment that side learns or derives it, and is never sent.' }}>
        <svg width="14" height="14" aria-hidden="true" viewBox="-7 -7 14 14"><Glyph name="key" x={0} y={0} size={13} /></svg>
        key known to that side
      </span>
    </div>
  {/snippet}
</Figure>

<style>
  .hs {
    display: grid;
    gap: var(--s-5);
    container-type: inline-size;
  }
  .drawing {
    min-width: 0;
  }
  @media (min-width: 1120px) {
    .hs {
      grid-template-columns: minmax(0, 1.5fr) minmax(0, 1fr);
      align-items: start;
    }
    .inspector {
      position: sticky;
      top: 80px;
    }
  }
  .key .frame,
  .check .frame {
    fill: var(--surface-raised);
    stroke: var(--line-strong);
    stroke-width: 1.25;
  }
  :global([data-theme='dark']) .key .frame,
  :global([data-theme='dark']) .check .frame {
    fill: var(--surface);
  }
  .key.accent .frame {
    stroke: var(--accent);
    fill: var(--accent-soft);
  }
  .key text {
    font-size: 12px;
    font-weight: 550;
  }
  .key.accent text {
    fill: var(--accent);
  }
  .rtt {
    fill: none;
    stroke: var(--fg-subtle);
    stroke-width: 1;
  }
  .rtt-label {
    font-size: 11px;
    fill: var(--fg-subtle);
  }

  .inspector {
    min-height: 200px;
  }
  .inspector h4 {
    margin: var(--s-1) 0 var(--s-2);
    font-size: var(--text-lg);
    font-weight: 620;
    letter-spacing: -0.01em;
  }
  .narration {
    margin: 0 0 var(--s-4);
    color: var(--fg-muted);
    font-size: var(--text-sm);
    line-height: 1.6;
  }
  .fields {
    list-style: none;
    margin: 0;
    padding: 0;
    border-top: 1px solid var(--line);
  }
  .fields li {
    display: grid;
    grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr);
    gap: var(--s-3);
    padding: 7px 6px;
    border-bottom: 1px solid var(--line);
    font-size: var(--text-xs);
    border-radius: 0;
  }
  .fields .k {
    font-weight: 550;
    overflow-wrap: anywhere;
  }
  .fields .v {
    color: var(--fg-muted);
    overflow-wrap: anywhere;
  }
  .legend {
    display: flex;
    flex-wrap: wrap;
    gap: var(--s-2) var(--s-5);
    padding-top: var(--s-3);
    border-top: 1px solid var(--line);
    font-size: var(--text-xs);
    color: var(--fg-muted);
  }
  .legend span {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 2px 4px;
  }
  .legend svg {
    overflow: visible;
  }
  .lg-line {
    stroke: var(--fg);
    stroke-width: 1.25;
  }
</style>
