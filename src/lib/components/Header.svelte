<script>
  import ThemeToggle from './ThemeToggle.svelte';
  import { router } from '../router.svelte.js';
</script>

<header class="site">
  <div class="inner">
    <a class="brand" href="/" aria-current={router.path === '/' ? 'page' : undefined}>
      <svg viewBox="0 0 32 32" width="20" height="20" aria-hidden="true">
        <rect x="2" y="2" width="28" height="28" rx="7" fill="none" stroke="currentColor" stroke-width="2.5" />
        <circle cx="11" cy="16" r="3" fill="currentColor" />
        <circle cx="21" cy="16" r="3" fill="var(--accent)" />
        <path d="M14 16h4" stroke="currentColor" stroke-width="2" />
      </svg>
      <span>learn</span>
    </a>
    <nav>
      <a href="/" class="nav-link">Concepts</a>
      <ThemeToggle />
    </nav>
  </div>
</header>

<style>
  .site {
    position: sticky;
    top: 0;
    z-index: 50;
    background: color-mix(in srgb, var(--bg) 85%, transparent);
    backdrop-filter: saturate(1.2) blur(10px);
    -webkit-backdrop-filter: saturate(1.2) blur(10px);
    border-bottom: 1px solid var(--line);
  }
  .inner {
    max-width: var(--w-page);
    margin: 0 auto;
    padding: 0 var(--gutter);
    height: 56px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .brand {
    display: inline-flex;
    align-items: center;
    gap: var(--s-2);
    font-weight: 650;
    letter-spacing: -0.01em;
    text-decoration: none;
  }
  nav {
    display: flex;
    align-items: center;
    gap: var(--s-4);
  }
  .nav-link {
    font-size: var(--text-sm);
    color: var(--fg-muted);
    text-decoration: none;
  }
  .nav-link:hover {
    color: var(--fg);
  }
</style>
