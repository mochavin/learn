// Default thumbnails for concepts without a thumbnail.svg.
//
// Deterministic: the category picks the motif (so a category looks related),
// the title seeds the arrangement (so every concept looks different). Output
// is SVG markup in a 320x200 viewBox, drawn with currentColor and
// var(--accent) exactly like a hand-made thumbnail, so it follows the theme.

function hash(str) {
  // FNV-1a, 32 bit
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

function rng(seed) {
  // mulberry32
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const W = 320;
const H = 200;
const f = (n) => Math.round(n * 10) / 10;

function graph(r) {
  // Grid of nodes, some connected; one node is the accent.
  const cols = 6;
  const rows = 4;
  const pts = [];
  for (let y = 0; y < rows; y++)
    for (let x = 0; x < cols; x++)
      pts.push([50 + x * 44 + (r() - 0.5) * 16, 38 + y * 41 + (r() - 0.5) * 14]);
  const live = pts.map(() => r() > 0.28);
  let out = '';
  for (let i = 0; i < pts.length; i++) {
    if (!live[i]) continue;
    const right = i % cols < cols - 1 ? i + 1 : -1;
    const down = i + cols < pts.length ? i + cols : -1;
    for (const j of [right, down]) {
      if (j >= 0 && live[j] && r() > 0.35)
        out += `<line x1="${f(pts[i][0])}" y1="${f(pts[i][1])}" x2="${f(pts[j][0])}" y2="${f(pts[j][1])}" stroke="currentColor" stroke-opacity=".35" stroke-width="1.25"/>`;
    }
  }
  const accent = pts.findIndex((_, i) => live[i] && r() > 0.6);
  pts.forEach(([x, y], i) => {
    if (!live[i]) return;
    out +=
      i === accent
        ? `<circle cx="${f(x)}" cy="${f(y)}" r="6" fill="var(--accent)"/>`
        : `<circle cx="${f(x)}" cy="${f(y)}" r="3.5" fill="currentColor" fill-opacity=".85"/>`;
  });
  return out;
}

function orbits(r) {
  // Concentric rings around an off-center point, with dots riding them.
  const cx = 120 + r() * 80;
  const cy = 80 + r() * 40;
  let out = '';
  const rings = 4 + Math.floor(r() * 2);
  for (let i = 1; i <= rings; i++) {
    const rad = i * 26;
    out += `<circle cx="${f(cx)}" cy="${f(cy)}" r="${rad}" fill="none" stroke="currentColor" stroke-opacity="${f(0.45 - i * 0.06)}" stroke-width="1.25"/>`;
    const a = r() * Math.PI * 2;
    const accent = i === 2;
    out += `<circle cx="${f(cx + Math.cos(a) * rad)}" cy="${f(cy + Math.sin(a) * rad)}" r="${accent ? 6 : 3.5}" fill="${accent ? 'var(--accent)' : 'currentColor'}"/>`;
  }
  out += `<circle cx="${f(cx)}" cy="${f(cy)}" r="4" fill="currentColor"/>`;
  return out;
}

function layers(r) {
  // Stacked bars, like a protocol stack or a pipeline.
  let out = '';
  const n = 5;
  const accent = Math.floor(r() * n);
  for (let i = 0; i < n; i++) {
    const w = 120 + r() * 120;
    const x = 40 + r() * (240 - w);
    const y = 34 + i * 28;
    out += `<rect x="${f(x)}" y="${y}" width="${f(w)}" height="16" rx="3" fill="${i === accent ? 'var(--accent)' : 'none'}" stroke="${i === accent ? 'none' : 'currentColor'}" stroke-opacity=".55" stroke-width="1.25"/>`;
  }
  return out;
}

function wave(r) {
  // A sampled signal: dots on a sine, one highlighted.
  const amp = 30 + r() * 25;
  const freq = 1.5 + r() * 2;
  const phase = r() * Math.PI * 2;
  let d = '';
  let dots = '';
  const accent = 4 + Math.floor(r() * 10);
  for (let i = 0; i <= 18; i++) {
    const x = 30 + i * 14.5;
    const y = H / 2 + Math.sin(phase + (i / 18) * Math.PI * 2 * freq) * amp;
    d += `${i ? 'L' : 'M'}${f(x)} ${f(y)}`;
    dots +=
      i === accent
        ? `<circle cx="${f(x)}" cy="${f(y)}" r="6" fill="var(--accent)"/>`
        : `<line x1="${f(x)}" y1="${H / 2}" x2="${f(x)}" y2="${f(y)}" stroke="currentColor" stroke-opacity=".25"/><circle cx="${f(x)}" cy="${f(y)}" r="2.5" fill="currentColor"/>`;
  }
  return `<line x1="24" y1="${H / 2}" x2="296" y2="${H / 2}" stroke="currentColor" stroke-opacity=".3"/><path d="${d}" fill="none" stroke="currentColor" stroke-opacity=".5" stroke-width="1.25"/>${dots}`;
}

const MOTIFS = [graph, orbits, layers, wave];

/** @param {{ title: string, category: string }} c */
export function defaultThumbnail({ title, category }) {
  const motif = MOTIFS[hash(category.toLowerCase()) % MOTIFS.length];
  const body = motif(rng(hash(`${category}/${title}`)));
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" aria-hidden="true">${body}</svg>`;
}
