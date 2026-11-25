<script>
  // How a client validates the server's certificate chain, check by check.
  // A failure selector shows where validation stops and which alert is sent.
  import { fade } from 'svelte/transition';
  import Figure from '$lib/components/Figure.svelte';
  import Stepper from '$lib/components/Stepper.svelte';
  import { info } from '$lib/info/info.svelte.js';
  import { Steps } from '$lib/steps.svelte.js';
  import { dur } from '$lib/motion.js';

  const CHECKS = [
    { label: 'Server sends the chain', rows: [], ok: 'The Certificate message carries the leaf and the intermediate. The root is not sent: the client must already have it.' },
    { label: 'Name matches', rows: ['leaf.san'], ok: 'example.com appears in the leaf\'s Subject Alternative Names. (The old Common Name field is ignored by modern clients.)' },
    { label: 'Within validity dates', rows: ['leaf.validity', 'int.validity'], ok: 'Today is between Not Before and Not After for every certificate in the chain.' },
    { label: 'Leaf signature', rows: ['leaf.sig', 'int.key'], ok: 'The intermediate\'s public key verifies the signature on the leaf, so the intermediate CA really issued it.' },
    { label: 'Intermediate signature', rows: ['int.sig', 'root.key', 'int.ca'], ok: 'The root\'s public key verifies the intermediate, and the intermediate is marked as a CA allowed to issue certificates.' },
    { label: 'Root is trusted', rows: ['root.store'], ok: 'The root is in the client\'s trust store, which ships with the OS or browser. This is the only step that is policy, not math.' },
    { label: 'Not revoked', rows: ['leaf.ocsp'], ok: 'A stapled OCSP response, signed by the CA and recent, says the leaf is still good. SCTs show it was logged in Certificate Transparency.' },
    { label: 'Proof of possession', rows: ['leaf.key'], ok: 'The CertificateVerify signature over the handshake checks out with the leaf\'s public key. The server holds the private key, not just a copy of a public certificate.' },
  ];

  const SCENARIOS = {
    none: { label: 'All good' },
    host: { label: 'Wrong host', step: 1, row: 'leaf.san', alert: 'bad_certificate', why: 'The certificate is valid, but for a different name. Browsers show a "certificate name invalid" error.' },
    expired: { label: 'Expired', step: 2, row: 'leaf.validity', alert: 'certificate_expired', why: 'The leaf\'s Not After date is in the past.' },
    forged: { label: 'Forged', step: 3, row: 'leaf.sig', alert: 'bad_certificate', why: 'The leaf\'s signature does not verify with the intermediate\'s key: someone edited or forged the certificate.' },
    unknown: { label: 'Unknown root', step: 5, row: 'root.store', alert: 'unknown_ca', why: 'The chain is internally consistent, but it ends at a root the client does not trust. Anyone can make a self-signed root.' },
  };

  const steps = new Steps(CHECKS.length);
  let scenario = $state('none');
  const sc = $derived(SCENARIOS[scenario]);
  const failAt = $derived(sc.step ?? Infinity);

  function rowState(id) {
    const i = steps.index;
    for (let k = 0; k < CHECKS.length; k++) {
      if (!CHECKS[k].rows.includes(id)) continue;
      if (k > i) return '';
      if (k > failAt) return 'skipped';
      if (k === failAt && sc.row === id) return 'fail';
      if (k === failAt) return k === i ? 'now' : 'ok';
      return k === i ? 'now' : 'ok';
    }
    return '';
  }

  const leafName = $derived(scenario === 'host' ? 'login.example.org' : 'example.com');
  const leafAfter = $derived(scenario === 'expired' ? '2025-03-01' : '2027-01-12');
  const rootName = $derived(scenario === 'unknown' ? 'Shady Root CA' : 'Example Root CA');

  const certs = $derived([
    {
      id: 'leaf',
      kind: 'Leaf certificate',
      sent: true,
      title: leafName,
      info: { kind: 'Certificate', title: 'Leaf (end-entity) certificate', body: 'Issued to the server. Binds its host names to its public key. Short-lived: 90 days or less is now common.' },
      rows: [
        ['leaf.subject', 'Subject', `CN=${leafName}`, 'Who the certificate is about. For TLS servers the names that matter are in the SAN extension.'],
        ['leaf.san', 'Subject Alt Names', scenario === 'host' ? 'login.example.org' : 'example.com, www.example.com', 'The host names this certificate is valid for. The client compares them with the name it connected to (the SNI).'],
        ['leaf.issuer', 'Issuer', 'Example Issuing CA', 'The CA that signed this certificate. The client looks for a certificate whose Subject matches this.'],
        ['leaf.validity', 'Validity', `2026-10-14 to ${leafAfter}`, 'Not Before and Not After. Outside this window the certificate is rejected.'],
        ['leaf.key', 'Public key', 'EC P-256, 04:8a:1f..', 'The key the server proves it owns in CertificateVerify.'],
        ['leaf.ocsp', 'Extensions', 'OCSP stapled, 2 SCTs', 'Revocation status stapled by the server and Certificate Transparency timestamps.'],
        ['leaf.sig', 'Signature', scenario === 'forged' ? 'ecdsa-with-SHA256 9e:00:13.. (tampered)' : 'ecdsa-with-SHA256 30:45:02..', 'Made by the issuer over all the fields above, with the issuer\'s private key.'],
      ],
    },
    {
      id: 'int',
      kind: 'Intermediate CA',
      sent: true,
      title: 'Example Issuing CA',
      info: { kind: 'Certificate', title: 'Intermediate CA certificate', body: 'Lets the root\'s private key stay offline. The intermediate does the day-to-day signing, and can be revoked and replaced without touching every client\'s trust store.' },
      rows: [
        ['int.subject', 'Subject', 'CN=Example Issuing CA', 'Must match the Issuer field of the leaf.'],
        ['int.issuer', 'Issuer', rootName, 'The root that signed this intermediate.'],
        ['int.validity', 'Validity', '2024-03-13 to 2027-03-12', 'Intermediates live for a few years.'],
        ['int.key', 'Public key', 'EC P-384, 04:c3:77..', 'Used to verify signatures on certificates this CA issued, such as the leaf.'],
        ['int.ca', 'Basic constraints', 'CA:TRUE, pathlen:0', 'Marks this as a CA that may sign end-entity certificates but no further CAs. Without CA:TRUE, a leaf could pretend to be a CA.'],
        ['int.sig', 'Signature', 'ecdsa-with-SHA384 30:65:02..', 'Made by the root\'s private key.'],
      ],
    },
    {
      id: 'root',
      kind: 'Root CA',
      sent: false,
      title: rootName,
      info: { kind: 'Certificate', title: 'Root CA certificate', body: 'Self-signed: its Issuer is itself, so its own signature proves nothing. It is trusted only because it is in the client\'s trust store.' },
      rows: [
        ['root.subject', 'Subject', `CN=${rootName}`, 'Must match the Issuer field of the intermediate.'],
        ['root.issuer', 'Issuer', `${rootName} (self)`, 'A root signs itself.'],
        ['root.validity', 'Validity', '2015-06-04 to 2035-06-04', 'Roots are long-lived, often 20 to 25 years.'],
        ['root.key', 'Public key', 'RSA 4096, 00:ad:e8..', 'The anchor key. It verifies the intermediate\'s signature.'],
        ['root.store', 'In trust store', scenario === 'unknown' ? 'no' : 'yes', 'Shipped with the operating system or browser, curated by root programs with strict audit requirements.'],
      ],
    },
  ]);

  const i = $derived(steps.index);
  const failed = $derived(i >= failAt);
  const verdict = $derived.by(() => {
    if (failed) return { fail: true, text: `Check failed: ${CHECKS[failAt].label.toLowerCase()}. ${sc.why}`, alert: sc.alert };
    return { fail: false, text: CHECKS[i].ok };
  });
</script>

<Figure title="Validating the certificate chain">
  {#snippet controls()}
    <Stepper {steps} labels={CHECKS.map((c) => c.label)} />
  {/snippet}

  <div class="scenario">
    <span class="eyebrow">Break something</span>
    <div class="segmented" role="group" aria-label="Failure scenario">
      {#each Object.entries(SCENARIOS) as [k, v]}
        <button aria-pressed={scenario === k} onclick={() => (scenario = k)}>{v.label}</button>
      {/each}
    </div>
  </div>

  <div class="chain">
    {#each certs as c, ci}
      <div class="cert" class:root={c.id === 'root'} class:sent={c.sent && i === 0} class:unsent={!c.sent}>
        <div class="cert-head" use:info={c.info}>
          <div class="eyebrow">{c.kind}</div>
          <div class="cert-title">{c.title}</div>
          <div class="where">{c.sent ? 'sent by server' : 'already on the client'}</div>
        </div>
        <ul>
          {#each c.rows as [id, k, v, d]}
            {@const st = rowState(id)}
            <li class={st} use:info={{ kind: c.kind, title: k, body: d, fields: [['value', v]] }}>
              <span class="k">{k}</span>
              <span class="v mono">{v}</span>
              <span class="mark" aria-hidden="true">
                {#if st === 'ok' || st === 'now'}<svg viewBox="-7 -7 14 14"><path d="M-5 0.5L-1.5 4 5.5 -3.5" /></svg>
                {:else if st === 'fail'}<svg viewBox="-7 -7 14 14"><path d="M-4.5 -4.5L4.5 4.5M4.5 -4.5L-4.5 4.5" /></svg>
                {/if}
              </span>
            </li>
          {/each}
        </ul>
      </div>
      {#if ci < certs.length - 1}
        <div class="link" use:info={{ kind: 'Relationship', title: 'Issued by', body: `The ${c.kind.toLowerCase()} names the next certificate as its issuer, and carries that CA's signature. Validation walks this link and verifies the signature with the issuer's public key.` }}>
          <svg viewBox="0 0 40 16" aria-hidden="true"><path d="M2 8h34M30 3l6 5-6 5" /></svg>
          <span>issued by</span>
        </div>
      {/if}
    {/each}
  </div>

  {#key `${i}-${scenario}`}
    <div class="verdict" class:fail={verdict.fail} in:fade={{ duration: dur(200) }} aria-live="polite">
      {#if verdict.fail}
        <strong>Handshake aborted.</strong> {verdict.text} The client sends the alert <code>{verdict.alert}</code> and closes the connection.
      {:else}
        {verdict.text}
      {/if}
    </div>
  {/key}
</Figure>

<style>
  .scenario {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--s-2) var(--s-3);
    margin-bottom: var(--s-5);
  }
  .chain {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: var(--s-2);
    container-type: inline-size;
  }
  @media (min-width: 900px) {
    .chain {
      grid-template-columns: minmax(0, 1fr) 56px minmax(0, 1fr) 56px minmax(0, 1fr);
      align-items: start;
    }
  }
  .cert {
    border: 1px solid var(--line-strong);
    border-radius: var(--radius);
    background: var(--surface-raised);
    transition: border-color var(--dur-ui) var(--ease), box-shadow var(--dur-ui) var(--ease);
  }
  :global([data-theme='dark']) .cert {
    background: var(--surface-raised);
  }
  .cert.sent {
    border-color: var(--accent);
    box-shadow: 0 0 0 3px var(--accent-soft);
  }
  .cert.unsent {
    border-style: dashed;
  }
  .cert-head {
    padding: var(--s-3);
    border-bottom: 1px solid var(--line);
    border-radius: var(--radius) var(--radius) 0 0;
  }
  .cert-title {
    font-weight: 620;
    font-size: var(--text-md);
    margin-top: 2px;
    overflow-wrap: anywhere;
  }
  .where {
    font-size: var(--text-xs);
    color: var(--fg-subtle);
  }
  ul {
    list-style: none;
    margin: 0;
    padding: var(--s-1);
  }
  li {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 16px;
    grid-template-areas: 'k mark' 'v mark';
    gap: 0 var(--s-2);
    padding: 5px 8px;
    font-size: var(--text-xs);
  }
  .k {
    grid-area: k;
    color: var(--fg-subtle);
  }
  .v {
    grid-area: v;
    overflow-wrap: anywhere;
  }
  .mark {
    grid-area: mark;
    align-self: center;
  }
  .mark svg {
    width: 14px;
    height: 14px;
    fill: none;
    stroke: currentColor;
    stroke-width: 1.6;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  li.now {
    background: var(--accent-soft);
    color: var(--accent);
  }
  li.now .k {
    color: var(--accent);
  }
  li.ok .mark {
    color: var(--fg-muted);
  }
  li.fail {
    background: var(--surface);
    box-shadow: inset 2px 0 0 var(--fg);
  }
  li.fail .v {
    text-decoration: line-through;
    text-decoration-thickness: 1px;
  }
  li.skipped {
    opacity: 0.45;
  }
  .link {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--s-2);
    padding: var(--s-1) 0;
    color: var(--fg-subtle);
    font-size: var(--text-xs);
  }
  .link svg {
    width: 40px;
    height: 16px;
    fill: none;
    stroke: currentColor;
    stroke-width: 1.3;
    stroke-linecap: round;
    stroke-linejoin: round;
    transform: rotate(90deg);
  }
  @media (min-width: 900px) {
    .link {
      flex-direction: column;
      margin-top: 40px;
      gap: 2px;
    }
    .link svg {
      transform: none;
    }
  }
  .verdict {
    margin-top: var(--s-5);
    padding: var(--s-3) var(--s-4);
    border-left: 2px solid var(--accent);
    background: var(--surface);
    border-radius: 0 var(--radius) var(--radius) 0;
    color: var(--fg-muted);
  }
  .verdict.fail {
    border-left-color: var(--fg);
    color: var(--fg);
  }
  .verdict code {
    font-size: 0.9em;
  }
</style>
