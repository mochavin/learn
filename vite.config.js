import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { mdsvex } from 'mdsvex';
import { pagesFallback } from './scripts/pages-fallback.js';

// `npm run preview:tunnel` sets TUNNEL=1 (see scripts/tunnel.js). The page is
// then served over https://<random>.trycloudflare.com on port 443, so the HMR
// websocket must connect back on 443 (wss) instead of the local dev port.
const tunnel = process.env.TUNNEL === '1';

export default defineConfig({
  resolve: {
    alias: { $lib: fileURLToPath(new URL('./src/lib', import.meta.url)) },
  },
  plugins: [
    mdsvex({ extensions: ['.svx'], heading_ids: true }),
    svelte({ extensions: ['.svelte', '.svx'] }),
    pagesFallback(),
  ],
  server: {
    port: 5173,
    strictPort: true,
    allowedHosts: ['.trycloudflare.com'],
    hmr: tunnel ? { clientPort: 443, protocol: 'wss' } : undefined,
  },
  build: {
    target: 'es2022',
  },
});
