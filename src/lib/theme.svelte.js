// Theme follows the system by default. The toggle flips light/dark; a choice
// is only stored when it differs from the system, so picking the system's own
// theme again returns to "follow system". index.html applies the stored value
// before first paint.
const KEY = 'theme';
const mq = matchMedia('(prefers-color-scheme: dark)');

function read() {
  try {
    const v = localStorage.getItem(KEY);
    return v === 'light' || v === 'dark' ? v : null;
  } catch {
    return null;
  }
}

class Theme {
  system = $state(mq.matches ? 'dark' : 'light');
  override = $state(read());
  current = $derived(this.override ?? this.system);

  constructor() {
    mq.addEventListener('change', (e) => (this.system = e.matches ? 'dark' : 'light'));
    $effect.root(() => {
      $effect(() => {
        const t = this.current;
        document.documentElement.dataset.theme = t;
        document.querySelector('meta[name="theme-color"]')?.setAttribute('content', t === 'dark' ? '#0f0f10' : '#fbfbfa');
      });
    });
  }

  toggle() {
    const next = this.current === 'dark' ? 'light' : 'dark';
    this.override = next === this.system ? null : next;
    try {
      if (this.override) localStorage.setItem(KEY, this.override);
      else localStorage.removeItem(KEY);
    } catch {}
  }
}

export const theme = new Theme();
