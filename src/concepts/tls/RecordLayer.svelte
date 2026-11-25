<script>
  // A real TLS 1.3 record, built in the browser with WebCrypto AES-128-GCM.
  // The key and IV stand in for the ones HKDF would derive from a traffic secret.
  import { fade } from 'svelte/transition';
  import Figure from '$lib/components/Figure.svelte';
  import Stepper from '$lib/components/Stepper.svelte';
  import { Bytes } from '$lib/diagram';
  import { info } from '$lib/info/info.svelte.js';
  import { Steps } from '$lib/steps.svelte.js';
  import { dur } from '$lib/motion.js';

  const LABELS = ['Plaintext', 'Inner plaintext', 'Per-record nonce', 'Record header', 'Encrypt', 'On the wire'];
  const steps = new Steps(LABELS.length);
  const at = $derived(steps.index);

  let text = $state('GET / HTTP/1.1\\r\\nHost: example.com');
  let padding = $state(0);
  let seq = $state(0);
  let tamper = $state(false);
  let keyBytes = $state(rand(16));
  let iv = $state(rand(12));

  function rand(n) {
    return crypto.getRandomValues(new Uint8Array(n));
  }
  function newKey() {
    keyBytes = rand(16);
    iv = rand(12);
    seq = 0;
  }
  const enc = new TextEncoder();
  const dec = new TextDecoder();

  const plain = $derived(enc.encode(text.replace(/\\r\\n/g, '\r\n')));
  const inner = $derived.by(() => {
    const out = new Uint8Array(plain.length + 1 + padding);
    out.set(plain);
    out[plain.length] = 0x17; // real content type: application_data
    return out;
  });
  const seqBytes = $derived.by(() => {
    const out = new Uint8Array(12);
    let n = BigInt(seq);
    for (let i = 11; i >= 4; i--) {
      out[i] = Number(n & 0xffn);
      n >>= 8n;
    }
    return out;
  });
  const nonce = $derived(iv.map((b, i) => b ^ seqBytes[i]));
  const header = $derived.by(() => {
    const len = inner.length + 16;
    return new Uint8Array([0x17, 0x03, 0x03, len >> 8, len & 0xff]);
  });

  let result = $state(null); // { ct, tag, wire, ok, decrypted }
  let run = 0;
  $effect(() => {
    const args = { keyBytes, nonce, header, inner, tamper };
    const id = ++run;
    (async () => {
      const key = await crypto.subtle.importKey('raw', args.keyBytes, 'AES-GCM', false, ['encrypt', 'decrypt']);
      const sealed = new Uint8Array(
        await crypto.subtle.encrypt({ name: 'AES-GCM', iv: args.nonce, additionalData: args.header, tagLength: 128 }, key, args.inner),
      );
      const ct = sealed.slice(0, sealed.length - 16);
      const tag = sealed.slice(sealed.length - 16);
      const received = sealed.slice();
      if (args.tamper) received[0] ^= 0x01;
      let ok = true;
      let decrypted = '';
      try {
        const opened = new Uint8Array(
          await crypto.subtle.decrypt({ name: 'AES-GCM', iv: args.nonce, additionalData: args.header, tagLength: 128 }, key, received),
        );
        // Strip padding zeros and the content type byte from the end.
        let end = opened.length;
        while (end > 0 && opened[end - 1] === 0) end--;
        decrypted = dec.decode(opened.slice(0, end - 1));
      } catch {
        ok = false;
      }
      if (id === run) result = { ct, tag, ok, decrypted, flipped: args.tamper ? received.slice(0, ct.length) : null };
    })();
  });

  const show = (s) => s.replace(/\r/g, '\\r').replace(/\n/g, '\\n');
</script>

<Figure title="Sealing one record with AES-128-GCM">
  {#snippet controls()}
    <Stepper {steps} labels={LABELS} />
  {/snippet}

  <div class="inputs">
    <label class="msg">
      <span class="eyebrow">Application data</span>
      <input type="text" bind:value={text} spellcheck="false" maxlength="120" />
    </label>
    <label>
      <span class="eyebrow">Padding</span>
      <span class="row"><input type="range" min="0" max="16" bind:value={padding} /> <span class="mono">{padding}</span></span>
    </label>
    <div class="buttons">
      <button class="btn" onclick={() => (seq += 1)} use:info={{ kind: 'Control', title: 'Send the next record', body: 'Increments the sequence number. The nonce changes, so the same plaintext encrypts to completely different bytes.' }}>Next record (seq {seq})</button>
      <button class="btn" onclick={newKey}>New key</button>
      <button class="btn" aria-pressed={tamper} onclick={() => (tamper = !tamper)} use:info={{ kind: 'Control', title: 'Tamper in transit', body: 'Flips one bit of the ciphertext before the receiver gets it, like an active attacker on the path would.' }}>Flip a bit in transit</button>
    </div>
  </div>

  <ol class="stages">
    <li class:now={at === 0} class:later={at < 0}>
      <div class="stage-head"><span class="n mono">1</span>Plaintext from the application</div>
      <Bytes groups={[{ label: 'content', bytes: plain, info: { kind: 'Bytes', title: 'Application data', body: 'What the HTTP layer handed to TLS. One record carries at most 16 KiB of it.', fields: [['text', show(text)], ['length', `${plain.length} bytes`]] } }]} />
    </li>

    <li class:now={at === 1} class:later={at < 1}>
      <div class="stage-head"><span class="n mono">2</span>TLSInnerPlaintext = content || type || zeros</div>
      <Bytes
        groups={[
          { label: 'content', bytes: plain, tone: 'muted' },
          { label: 'type', bytes: new Uint8Array([0x17]), tone: 'accent', info: { kind: 'Field', title: 'Real content type', body: '0x17 is application_data. In TLS 1.3 the true type (handshake, alert or data) is inside the encryption, so observers cannot tell what kind of record this is.' } },
          ...(padding ? [{ label: 'padding', bytes: new Uint8Array(padding), info: { kind: 'Field', title: 'Padding', body: 'Optional zeros that hide the true length of the content. The receiver strips trailing zeros; the last non-zero byte is the content type.' } }] : []),
        ]}
      />
    </li>

    <li class:now={at === 2} class:later={at < 2}>
      <div class="stage-head"><span class="n mono">3</span>nonce = write_iv XOR sequence number</div>
      <div class="xor">
        <Bytes groups={[{ label: 'write_iv (from HKDF)', bytes: iv, tone: 'muted', info: { kind: 'Secret', title: 'write_iv', body: '12 bytes from HKDF-Expand-Label(traffic secret, "iv", "", 12). Fixed for the life of the traffic secret.' } }]} />
        <span class="op mono" aria-hidden="true">XOR</span>
        <Bytes groups={[{ label: `sequence number ${seq}, padded to 12 bytes`, bytes: seqBytes, tone: 'muted', info: { kind: 'Counter', title: `Sequence number ${seq}`, body: 'A 64-bit counter per direction, starting at 0 and incremented for every record. It is never sent: both sides count. Dropping, replaying or reordering a record makes the receiver use the wrong nonce, so decryption fails.' } }]} />
        <span class="op mono" aria-hidden="true">=</span>
        <Bytes groups={[{ label: 'nonce', bytes: nonce, tone: 'accent', info: { kind: 'Derived', title: 'Per-record nonce', body: 'Unique for every record under this key, which AES-GCM requires: reusing a nonce with the same key breaks both confidentiality and integrity.' } }]} />
      </div>
    </li>

    <li class:now={at === 3} class:later={at < 3}>
      <div class="stage-head"><span class="n mono">4</span>Record header, also the additional data</div>
      <Bytes
        groups={[
          { label: 'type', bytes: header.slice(0, 1), info: { kind: 'Field', title: 'Outer content type: 0x17', body: 'Always application_data for encrypted records, whatever is inside.' } },
          { label: 'version', bytes: header.slice(1, 3), info: { kind: 'Field', title: 'legacy_record_version: 0x0303', body: 'Fixed at the TLS 1.2 value for compatibility with middleboxes.' } },
          { label: 'length', bytes: header.slice(3, 5), tone: 'accent', info: { kind: 'Field', title: `Length: ${inner.length + 16}`, body: 'Length of the encrypted payload: inner plaintext plus the 16-byte tag. The header is sent in the clear but authenticated as additional data, so it cannot be altered.' } },
        ]}
      />
    </li>

    <li class:now={at === 4} class:later={at < 4}>
      <div class="stage-head"><span class="n mono">5</span>AES-128-GCM(key, nonce, plaintext, additional data)</div>
      {#if result}
        <Bytes
          groups={[
            { label: 'ciphertext', bytes: result.ct, info: { kind: 'Output', title: 'Ciphertext', body: 'Same length as the inner plaintext. Change the text, the sequence number or the key and every byte changes.' } },
            { label: 'auth tag', bytes: result.tag, tone: 'accent', info: { kind: 'Output', title: 'Authentication tag', body: 'A 16-byte MAC over the ciphertext and the header. Without the key nobody can produce a valid tag for modified data.' } },
          ]}
        />
      {/if}
    </li>

    <li class:now={at === 5} class:later={at < 5}>
      <div class="stage-head"><span class="n mono">6</span>On the wire, and at the receiver</div>
      {#if result}
        <Bytes
          groups={[
            { label: 'header', bytes: header, tone: 'muted' },
            { label: tamper ? 'ciphertext (1 bit flipped)' : 'ciphertext', bytes: result.flipped ?? result.ct },
            { label: 'tag', bytes: result.tag, tone: 'accent' },
          ]}
        />
        {#key `${result.ok}-${result.decrypted}`}
          <div class="receiver" class:fail={!result.ok} in:fade={{ duration: dur(200) }}>
            {#if result.ok}
              Receiver decrypts with the same key and nonce, the tag checks out: <span class="mono">"{show(result.decrypted)}"</span>
            {:else}
              Tag check failed. The receiver discards the record, sends a <code>bad_record_mac</code> alert and closes the connection. Not a single byte of the modified data reaches the application.
            {/if}
          </div>
        {/key}
      {/if}
    </li>
  </ol>
</Figure>

<style>
  .inputs {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    gap: var(--s-3) var(--s-5);
    margin-bottom: var(--s-5);
  }
  label {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .msg {
    flex: 1 1 240px;
  }
  .msg input {
    height: 32px;
    padding: 0 10px;
    border: 1px solid var(--line);
    border-radius: var(--radius);
    background: var(--bg);
    font-family: var(--font-mono);
    font-size: var(--text-xs);
  }
  .msg input:focus {
    outline: none;
    border-color: var(--accent-line);
  }
  .row {
    display: inline-flex;
    align-items: center;
    gap: var(--s-2);
    height: 32px;
    font-size: var(--text-xs);
  }
  input[type='range'] {
    width: 100px;
    accent-color: var(--accent);
  }
  .buttons {
    display: flex;
    flex-wrap: wrap;
    gap: var(--s-2);
  }
  .stages {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: var(--s-2);
  }
  .stages > li {
    padding: var(--s-3);
    border: 1px solid transparent;
    border-radius: var(--radius);
    transition: opacity var(--dur-ui) var(--ease), border-color var(--dur-ui) var(--ease);
  }
  .stages > li.now {
    border-color: var(--accent-line);
  }
  .stages > li.later {
    opacity: 0.3;
  }
  .stage-head {
    display: flex;
    align-items: baseline;
    gap: var(--s-2);
    margin-bottom: var(--s-2);
    font-weight: 560;
    font-size: var(--text-sm);
  }
  .n {
    display: inline-grid;
    place-items: center;
    width: 18px;
    height: 18px;
    border: 1px solid var(--line-strong);
    border-radius: 50%;
    font-size: 10px;
    color: var(--fg-muted);
    flex: none;
  }
  .now .n {
    border-color: var(--accent);
    color: var(--accent);
  }
  .xor {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--s-2);
  }
  .op {
    font-size: var(--text-xs);
    color: var(--fg-subtle);
  }
  .receiver {
    margin-top: var(--s-3);
    padding: var(--s-2) var(--s-3);
    border-left: 2px solid var(--accent);
    background: var(--surface);
    color: var(--fg-muted);
    overflow-wrap: anywhere;
  }
  .receiver.fail {
    border-left-color: var(--fg);
    color: var(--fg);
  }
</style>
