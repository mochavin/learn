#!/usr/bin/env node
// npm run preview:tunnel
//
// Starts the Vite dev server and exposes it through a Cloudflare quick tunnel
// (https://<random>.trycloudflare.com), so the site can be opened from any
// device, with hot reload. No Cloudflare account or config is needed.
// Needs `cloudflared` on PATH: https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/
import { spawn } from 'node:child_process';
import { createServer } from 'vite';

// vite.config.js reads this to point the HMR websocket at port 443 (wss).
process.env.TUNNEL = '1';

const server = await createServer({ server: { host: '127.0.0.1' } });
await server.listen();
const port = server.config.server.port;
const local = `http://localhost:${port}`;
console.log(`\n  Vite dev server: ${local}\n  Starting Cloudflare quick tunnel...\n`);

const cf = spawn('cloudflared', ['tunnel', '--no-autoupdate', '--url', local], { stdio: ['ignore', 'pipe', 'pipe'] });

let printed = false;
let log = '';
function onData(chunk) {
  const text = chunk.toString();
  log += text;
  if (process.env.TUNNEL_DEBUG) process.stderr.write(text);
  const m = !printed && log.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/);
  if (m) {
    printed = true;
    const url = m[0];
    const line = '─'.repeat(url.length + 6);
    console.log(`  ┌${line}┐`);
    console.log(`  │   ${url}   │`);
    console.log(`  └${line}┘`);
    console.log(`\n  Open it on any device. Deep links work too: ${url}/tls`);
    console.log('  The URL changes every run. Press Ctrl+C to stop.\n');
  }
}
cf.stdout.on('data', onData);
cf.stderr.on('data', onData);

cf.on('error', (err) => {
  if (err.code === 'ENOENT') {
    console.error('  cloudflared was not found on PATH. Install it, then run this again:');
    console.error('  https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/');
  } else {
    console.error(err);
  }
  shutdown(1);
});
cf.on('exit', (code) => {
  if (!stopping) {
    console.error(`\n  cloudflared exited (code ${code}). Last output:\n${log.split('\n').slice(-10).join('\n')}`);
    shutdown(code ?? 1);
  }
});

let stopping = false;
async function shutdown(code = 0) {
  if (stopping) return;
  stopping = true;
  cf.kill('SIGTERM');
  await server.close();
  process.exit(code);
}
process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));
