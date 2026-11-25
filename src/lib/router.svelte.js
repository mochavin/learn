// Tiny History API router. Same-origin <a href> clicks are intercepted, so
// plain links work everywhere (including inside .svx content).
import { tick } from 'svelte';

const normalize = (p) => (p.length > 1 ? p.replace(/\/+$/, '') || '/' : p);

class Router {
  path = $state(normalize(location.pathname));
  search = $state(location.search);
  hash = $state(location.hash);

  constructor() {
    if (location.pathname !== this.path) {
      history.replaceState(history.state, '', this.path + location.search + location.hash);
    }
    addEventListener('popstate', () => this.#sync());
    document.addEventListener('click', (e) => this.#onClick(e));
  }

  get params() {
    return new URLSearchParams(this.search);
  }

  #sync() {
    this.path = normalize(location.pathname);
    this.search = location.search;
    this.hash = location.hash;
  }

  async navigate(href, { replace = false, scroll = true } = {}) {
    const url = new URL(href, location.href);
    const samePage = normalize(url.pathname) === this.path;
    history[replace ? 'replaceState' : 'pushState']({}, '', normalize(url.pathname) + url.search + url.hash);
    this.#sync();
    if (!scroll) return;
    await tick();
    if (url.hash) scrollToHash(url.hash);
    else if (!samePage) window.scrollTo({ top: 0 });
  }

  /** Update query params in place (replaceState), e.g. search filters. */
  setParams(values) {
    const p = new URLSearchParams(this.search);
    for (const [k, v] of Object.entries(values)) {
      if (v === null || v === undefined || v === '') p.delete(k);
      else p.set(k, v);
    }
    const s = p.toString();
    this.navigate(this.path + (s ? `?${s}` : '') + location.hash, { replace: true, scroll: false });
  }

  #onClick(e) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = e.target instanceof Element ? e.target.closest('a[href]') : null;
    if (!a || (a.target && a.target !== '_self') || a.hasAttribute('download')) return;
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin) return;
    // In-page anchors: let the browser scroll, just keep state in sync.
    if (normalize(url.pathname) === this.path && url.hash && url.search === location.search) {
      queueMicrotask(() => this.#sync());
      return;
    }
    e.preventDefault();
    this.navigate(url.href);
  }
}

export function scrollToHash(hash) {
  const id = decodeURIComponent(hash.slice(1));
  const el = id && document.getElementById(id);
  if (el) el.scrollIntoView({ block: 'start' });
}

export const router = new Router();
