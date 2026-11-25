// Build step for GitHub Pages, which has no SPA rewrites.
//
// 1. dist/404.html is a copy of index.html. GitHub Pages serves it for any
//    unknown path, and the client-side router then renders the right page.
// 2. dist/<slug>.html is written for every concept, with that concept's title
//    and description in the <head>. GitHub Pages serves /tls from tls.html with
//    a 200 status, so known pages get proper status codes and link previews.
//    The 404 fallback still covers everything else.
import fs from 'node:fs';
import path from 'node:path';

const CONCEPTS_DIR = 'src/concepts';

function readFrontmatter(file) {
  const src = fs.readFileSync(file, 'utf8');
  const m = src.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  const out = {};
  if (!m) return out;
  for (const line of m[1].split(/\r?\n/)) {
    const kv = line.match(/^([a-zA-Z_]+):\s*(.*)$/);
    if (kv) out[kv[1]] = kv[2].replace(/^(['"])(.*)\1$/, '$2').trim();
  }
  return out;
}

const escape = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function pagesFallback() {
  let outDir = 'dist';
  let root = process.cwd();
  return {
    name: 'pages-fallback',
    apply: 'build',
    configResolved(config) {
      root = config.root;
      outDir = path.resolve(config.root, config.build.outDir);
    },
    closeBundle() {
      const indexPath = path.join(outDir, 'index.html');
      if (!fs.existsSync(indexPath)) return;
      const html = fs.readFileSync(indexPath, 'utf8');
      fs.writeFileSync(path.join(outDir, '404.html'), html);

      const dir = path.join(root, CONCEPTS_DIR);
      for (const slug of fs.readdirSync(dir)) {
        const file = path.join(dir, slug, 'index.svx');
        if (!fs.existsSync(file)) continue;
        const meta = readFrontmatter(file);
        if (meta.draft === 'true') continue;
        const title = `${meta.title ?? slug} - Learn`;
        const description = meta.description ?? '';
        const page = html
          .replace(/<title>[\s\S]*?<\/title>/, `<title>${escape(title)}</title>`)
          .replace(
            /<meta name="description" content="[^"]*"\s*\/?>/,
            `<meta name="description" content="${escape(description)}" />`,
          )
          .replace(/<meta property="og:title" content="[^"]*"\s*\/?>/, `<meta property="og:title" content="${escape(title)}" />`)
          .replace(
            /<meta property="og:description" content="[^"]*"\s*\/?>/,
            `<meta property="og:description" content="${escape(description)}" />`,
          );
        fs.writeFileSync(path.join(outDir, `${slug}.html`), page);
      }
    },
  };
}
