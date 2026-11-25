// Content for the handshake illustration: one entry per step.
// Kept apart from the component so the text is easy to review and edit.
//
// enc: null (plaintext) | 'hs' (handshake traffic keys, RFC notation {..})
//      | 'app' (application traffic keys, RFC notation [..])

export const HEX = {
  clientRandom: '9f3c 41d2 0b6a e7c5 ... 7a1e (32 bytes)',
  serverRandom: '5e88 c901 77ab 2f40 ... d3c2 (32 bytes)',
  clientShare: '358072d6365880d1aeea329adf9121383851ed21a28e3b75e965d0d2cd166254',
  serverShare: '9fd7ad6dcff4298dd3f96d5b1b2af910a0535b1488d7f8fabb349a982880b615',
};

const short = (h) => `${h.slice(0, 8)}...${h.slice(-6)}`;

export const STEPS = [
  {
    id: 'start',
    label: 'TCP connected',
    narration:
      'The client has opened a TCP connection to port 443. Nothing is protected yet: anyone on the path can read and modify bytes. The server already holds one long-term secret, the private key that matches its certificate.',
    fields: [],
  },
  {
    id: 'client-hello',
    label: 'ClientHello',
    from: 'client',
    enc: null,
    narration:
      'The client says hello in plaintext. It lists what it supports and, betting on the group the server will most likely pick (X25519), it generates a fresh key pair and sends the public half right away. Sending the key share in the first message is what lets TLS 1.3 finish in one round trip.',
    fields: [
      ['legacy_version', '0x0303', 'Frozen at the TLS 1.2 value so old middleboxes do not choke. The real version is negotiated in the supported_versions extension.'],
      ['random', HEX.clientRandom, '32 fresh random bytes. They make every handshake transcript unique, so keys and signatures can never be replayed from an old session.'],
      ['legacy_session_id', '32 bytes', 'Not used by TLS 1.3. Clients still send a random value ("middlebox compatibility mode") so the handshake looks like a TLS 1.2 session resumption to network devices that inspect it.'],
      ['cipher_suites', 'AES_128_GCM_SHA256, AES_256_GCM_SHA384, CHACHA20_POLY1305_SHA256', 'In TLS 1.3 a cipher suite only names the AEAD cipher and the hash for the key schedule. Key exchange and signatures are negotiated separately, in extensions.'],
      ['server_name (SNI)', 'example.com', 'The host name the client wants. One IP can serve many sites, so the server uses this to pick a certificate. It is visible to observers unless Encrypted Client Hello (ECH) is used.'],
      ['supported_versions', 'TLS 1.3, TLS 1.2', 'The real version negotiation. A server that understands this extension picks TLS 1.3 from it.'],
      ['supported_groups', 'x25519, secp256r1', 'Key exchange groups the client can do, in order of preference.'],
      ['key_share', `x25519: ${short(HEX.clientShare)}`, 'The client\'s ephemeral public key A = a·G for its guessed group. If the server prefers a group the client did not send a share for, it answers with HelloRetryRequest and the handshake costs one extra round trip.'],
      ['signature_algorithms', 'ecdsa_secp256r1_sha256, rsa_pss_rsae_sha256, ed25519', 'Signature schemes the client accepts in CertificateVerify and in certificates.'],
      ['alpn', 'h2, http/1.1', 'Application-Layer Protocol Negotiation: which protocol will run inside the tunnel, decided now so no extra round trip is needed later.'],
    ],
  },
  {
    id: 'server-hello',
    label: 'ServerHello',
    from: 'server',
    enc: null,
    narration:
      'The server picks a cipher suite and the group, generates its own fresh key pair and sends its public key. This is the last plaintext handshake message. Once it is sent, both sides have everything they need to compute the same secret.',
    fields: [
      ['legacy_version', '0x0303', 'Also frozen at the TLS 1.2 value. The chosen version is in supported_versions.'],
      ['random', HEX.serverRandom, '32 fresh bytes from the server. If a TLS 1.3 server is forced to negotiate an older version, it puts a fixed "DOWNGRD" marker in the last 8 bytes so a 1.3 client detects the downgrade attack.'],
      ['legacy_session_id_echo', '(echo)', 'The client\'s value echoed back, again only for middlebox compatibility.'],
      ['cipher_suite', 'TLS_AES_128_GCM_SHA256', 'The single suite chosen: AES-128 in GCM mode for records, SHA-256 for the key schedule.'],
      ['supported_versions', 'TLS 1.3', 'The negotiated version.'],
      ['key_share', `x25519: ${short(HEX.serverShare)}`, 'The server\'s ephemeral public key B = b·G. Like the client\'s, its private half b exists only for this one connection.'],
    ],
  },
  {
    id: 'derive',
    label: 'Both derive keys',
    narration:
      'No message is sent. Each side combines its own private key with the other side\'s public key: the client computes X25519(a, B), the server X25519(b, A). Both get the same 32-byte shared secret, which never crossed the wire. Feeding it, together with a hash of the two hellos, through HKDF gives the handshake traffic keys. Everything from here on is encrypted.',
    fields: [
      ['client computes', 'X25519(a, B)', 'Scalar multiplication of the server\'s public point by the client\'s private scalar.'],
      ['server computes', 'X25519(b, A)', 'The same operation from the other side. a·(b·G) = b·(a·G), so the results match.'],
      ['shared secret', '32 bytes, never sent', 'An observer sees A and B but cannot compute a·b·G without one of the private keys (the elliptic curve Diffie-Hellman problem).'],
      ['transcript hash', 'SHA-256(ClientHello || ServerHello)', 'Binds the keys to exactly these hello messages. If an attacker altered either hello, the two sides would derive different keys and the Finished check would fail.'],
      ['handshake secret', 'HKDF-Extract(salt, shared secret)', 'The middle stage of the key schedule. See "The key schedule" below.'],
      ['traffic keys', 'client_hs, server_hs', 'One secret per direction, each expanded into an AES key and an IV. Two directions never share a key.'],
    ],
  },
  {
    id: 'encrypted-extensions',
    label: 'EncryptedExtensions',
    from: 'server',
    enc: 'hs',
    narration:
      'The first encrypted message. It carries the rest of the server\'s choices that are not needed to set up keys. In TLS 1.2 these went in the clear; now an observer cannot see, for example, which application protocol was chosen.',
    fields: [
      ['alpn', 'h2', 'The protocol the server chose from the client\'s list.'],
      ['server_name', '(empty ack)', 'An empty extension acknowledging that SNI was used to pick the certificate.'],
      ['supported_groups', 'x25519, secp256r1', 'Optional: the server\'s preferences, which a client may use on its next connection.'],
    ],
  },
  {
    id: 'certificate',
    label: 'Certificate',
    from: 'server',
    enc: 'hs',
    narration:
      'The server sends its certificate chain: its own leaf certificate for example.com followed by the intermediate CA that signed it. The root is not sent; the client must already have it. Because this is encrypted in TLS 1.3, a passive observer no longer learns which certificate was presented.',
    fields: [
      ['certificate_request_context', '(empty)', 'Only used when the server asks the client for a certificate after the handshake.'],
      ['leaf', 'CN=example.com, issuer: Example Issuing CA', 'The server\'s own certificate. It binds the name example.com to a public key.'],
      ['intermediate', 'Example Issuing CA, issuer: Example Root CA', 'Links the leaf to a root the client trusts. See "Certificates and the chain of trust" below.'],
      ['extensions', 'status_request (OCSP), SCTs', 'Per-certificate extras: a stapled revocation status and Certificate Transparency timestamps.'],
    ],
  },
  {
    id: 'certificate-verify',
    label: 'CertificateVerify',
    from: 'server',
    enc: 'hs',
    narration:
      'A certificate is public, so anyone can send it. This message proves the server also holds the matching private key: it signs a hash of the entire handshake so far. The signature covers this exact conversation, so it cannot be reused anywhere else.',
    fields: [
      ['algorithm', 'ecdsa_secp256r1_sha256', 'One of the schemes the client offered in signature_algorithms.'],
      ['signed content', '64 spaces || "TLS 1.3, server CertificateVerify" || 0x00 || transcript hash', 'The fixed prefix stops the signature being confused with a signature from any other protocol or context.'],
      ['transcript', 'ClientHello .. Certificate', 'Everything sent so far, including both key shares. That is what ties the ephemeral key exchange to the server\'s long-term identity.'],
      ['signature', '71 bytes (DER ECDSA)', 'Made with the certificate private key, the server\'s only long-term secret.'],
    ],
  },
  {
    id: 'server-finished',
    label: 'Finished (server)',
    from: 'server',
    enc: 'hs',
    narration:
      'A MAC over the whole transcript, keyed from the server\'s handshake secret. It proves the server saw the same messages as the client and derived the same keys. After sending it, the server can already compute the application keys and may even start sending data (0.5-RTT).',
    fields: [
      ['verify_data', 'HMAC(finished_key, transcript hash)', 'finished_key = HKDF-Expand-Label(server_handshake_traffic_secret, "finished", "", 32).'],
      ['transcript', 'ClientHello .. CertificateVerify', 'Any tampering with any earlier message, including the plaintext hellos, makes this check fail.'],
    ],
  },
  {
    id: 'client-finished',
    label: 'Finished (client)',
    from: 'client',
    enc: 'hs',
    narration:
      'Before answering, the client checks three things: the certificate chain leads to a root it trusts and names example.com, the CertificateVerify signature is valid for the leaf key, and the server\'s Finished MAC is correct. Then it sends its own Finished. The handshake is complete after one round trip.',
    fields: [
      ['checks chain', 'leaf -> intermediate -> trusted root', 'Signatures, validity dates, host name and usage constraints. Any failure aborts with an alert.'],
      ['checks signature', 'CertificateVerify with leaf public key', 'Proves the peer owns the certificate.'],
      ['checks Finished', 'server verify_data', 'Proves the handshake was not tampered with.'],
      ['verify_data', 'HMAC(finished_key, transcript hash)', 'Keyed from client_handshake_traffic_secret, over ClientHello .. server Finished.'],
    ],
  },
  {
    id: 'application-data',
    label: 'Application data',
    from: 'both',
    enc: 'app',
    narration:
      'HTTP requests and responses now flow in both directions inside encrypted records. Each direction has its own application traffic key, and each record uses a fresh nonce built from a sequence number, so records cannot be reordered, replayed or dropped without detection.',
    fields: [
      ['record type', '0x17 (application_data)', 'Every encrypted record shows this outer type. The real type is hidden inside the ciphertext.'],
      ['keys', 'client_ap / server_ap traffic secrets', 'Derived from the master secret and the transcript through server Finished.'],
      ['cipher', 'AES-128-GCM', 'An AEAD: encrypts and authenticates in one step. See "Session encryption" below.'],
    ],
  },
];

/** Key chips drawn along each lifeline. row = vertical slot, step = when it appears. */
export const KEYS = [
  {
    side: 'server',
    row: 0,
    step: 0,
    label: 'Certificate key',
    short: 'cert',
    long: true,
    info: {
      kind: 'Long-term key',
      title: 'Certificate private key',
      body: 'The private half of the key in the server\'s certificate. It never leaves the server and is used only to sign (CertificateVerify), never to encrypt traffic. It lives for months.',
    },
  },
  {
    side: 'client',
    row: 0,
    step: 1,
    label: 'Key pair a, A',
    short: 'a, A',
    info: {
      kind: 'Ephemeral key',
      title: 'Client key pair (a, A)',
      body: 'A fresh X25519 key pair made for this connection only. The private scalar a stays on the client; the public point A = a·G is sent in key_share. It is thrown away after the handshake, which is what gives forward secrecy.',
      fields: [['A', HEX.clientShare.slice(0, 24) + '...']],
    },
  },
  {
    side: 'server',
    row: 1,
    step: 2,
    label: 'Key pair b, B',
    short: 'b, B',
    info: {
      kind: 'Ephemeral key',
      title: 'Server key pair (b, B)',
      body: 'The server\'s fresh X25519 key pair for this connection. B = b·G goes into ServerHello. Like the client\'s, it is discarded after use.',
      fields: [['B', HEX.serverShare.slice(0, 24) + '...']],
    },
  },
  ...['client', 'server'].flatMap((side) => [
    {
      side,
      row: 2,
      step: 3,
      label: 'Shared secret',
      short: 'secret',
      info: {
        kind: 'Derived',
        title: 'ECDHE shared secret',
        body:
          side === 'client'
            ? 'X25519(a, B): the client\'s private key times the server\'s public key. Equal to the server\'s result, never transmitted.'
            : 'X25519(b, A): the server\'s private key times the client\'s public key. Equal to the client\'s result, never transmitted.',
      },
    },
    {
      side,
      row: 3,
      step: 3,
      delay: 300,
      label: 'Handshake keys',
      short: 'HS',
      info: {
        kind: 'Derived',
        title: 'Handshake traffic keys',
        body: 'Two secrets, one per direction, from HKDF over the shared secret and the hash of ClientHello and ServerHello. They encrypt the rest of the handshake, written {like this}.',
      },
    },
  ]),
  {
    side: 'server',
    row: 7,
    step: 7,
    label: 'App keys',
    short: 'app',
    info: {
      kind: 'Derived',
      title: 'Application traffic keys (server)',
      body: 'Derived from the master secret and the transcript up to server Finished. The server can compute them as soon as it sends Finished.',
    },
  },
  {
    side: 'client',
    row: 8,
    step: 8,
    label: 'App keys',
    short: 'app',
    info: {
      kind: 'Derived',
      title: 'Application traffic keys (client)',
      body: 'The same derivation on the client, done once the server\'s Finished has been verified. Records written [like this] use these keys.',
    },
  },
];

export const ENC_INFO = {
  null: { kind: 'Plaintext', body: 'Sent in the clear. Anyone on the network path can read it.' },
  hs: { kind: 'Encrypted, handshake keys', body: 'Encrypted with a handshake traffic key. RFC 8446 writes these messages in {braces}.' },
  app: { kind: 'Encrypted, application keys', body: 'Encrypted with an application traffic key. RFC 8446 writes these in [brackets].' },
};
