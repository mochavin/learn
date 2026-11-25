// Concept registry. Every folder in src/concepts/ with an index.svx is a
// concept; its folder name is its URL slug. Nothing else needs editing to add
// one. Metadata comes from the frontmatter via mdsvex's ?metadata query, which
// compiles nothing, so the index page never loads concept content.

const metas = import.meta.glob('/src/concepts/*/index.svx', { query: '?metadata', import: 'default', eager: true });
const pages = import.meta.glob('/src/concepts/*/index.svx');
const texts = import.meta.glob('/src/concepts/*/index.svx', { query: '?text', import: 'default' });
const thumbs = import.meta.glob('/src/concepts/*/thumbnail.svg', { query: '?raw', import: 'default', eager: true });

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const slugOf = (path) => path.split('/').at(-2);

/**
 * @typedef {object} Concept
 * @property {string} slug
 * @property {string} title
 * @property {string} description
 * @property {string} category
 * @property {string[]} tags
 * @property {number} order
 * @property {string | undefined} updated
 * @property {string | null} thumbnail  raw SVG markup of thumbnail.svg, or null
 * @property {() => Promise<{ default: any }>} load
 * @property {() => Promise<{ title: string, text: string }>} loadText
 */

/** @type {Concept[]} */
export const concepts = Object.entries(metas)
  .map(([path, meta = {}]) => {
    const slug = slugOf(path);
    const problems = [];
    if (!SLUG.test(slug)) problems.push(`folder name "${slug}" must be lowercase-kebab-case`);
    for (const key of ['title', 'description', 'category']) {
      if (typeof meta[key] !== 'string' || !meta[key].trim()) problems.push(`missing "${key}"`);
    }
    if (problems.length) {
      console.error(`[concepts] ${path}: ${problems.join(', ')}`);
      if (import.meta.env.DEV) return null;
    }
    if (meta.draft && import.meta.env.PROD) return null;
    return {
      slug,
      title: meta.title ?? slug,
      description: meta.description ?? '',
      category: meta.category ?? 'Uncategorized',
      tags: Array.isArray(meta.tags) ? meta.tags.map(String) : [],
      order: typeof meta.order === 'number' ? meta.order : 100,
      updated: meta.updated ? String(meta.updated) : undefined,
      thumbnail: thumbs[path.replace('index.svx', 'thumbnail.svg')] ?? null,
      load: pages[path],
      loadText: texts[path],
    };
  })
  .filter(Boolean)
  .sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));

export const bySlug = new Map(concepts.map((c) => [c.slug, c]));

/** Categories in first-seen order (concepts are already sorted), with counts. */
export const categories = [...new Set(concepts.map((c) => c.category))].map((name) => ({
  name,
  count: concepts.filter((c) => c.category === name).length,
}));
