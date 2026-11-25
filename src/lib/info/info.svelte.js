// Hover/tap info. Attach to any element (HTML or SVG) with the `info` action:
//
//   <g use:info={{ title: 'ClientHello', kind: 'Message', body: '...' }}>
//
// Mouse/pen: hover shows the card, leaving hides it, click pins it.
// Touch: tap shows a pinned card, tap again or tap outside closes it.
// Keyboard: the element becomes focusable; focus shows, Enter pins, Esc closes.
// One <InfoLayer> (mounted in App.svelte) renders the card.

/**
 * @typedef {object} InfoData
 * @property {string} title
 * @property {string} [kind]    small label above the title, e.g. "Message", "Field", "Key"
 * @property {string} [body]    plain text; `backticks` render as code
 * @property {Array<[string, string]>} [fields]  key/value rows, rendered mono
 * @property {string} [note]    secondary line in muted text
 */

class InfoState {
  /** @type {{ el: Element, data: InfoData, pinned: boolean, touch: boolean } | null} */
  current = $state.raw(null);

  show(el, data, { pinned = false, touch = false } = {}) {
    this.current = { el, data, pinned, touch };
  }
  hide(el) {
    if (this.current && this.current.el === el && !this.current.pinned) this.current = null;
  }
  clear() {
    this.current = null;
  }
  update(el, data) {
    if (this.current?.el === el) this.current = { ...this.current, data };
  }
}

export const infoState = new InfoState();

/**
 * Svelte action.
 * @param {Element} node
 * @param {InfoData | null | undefined} data  null disables info on this element
 */
export function info(node, data) {
  let d = data;
  let lastPointer = 'mouse';

  function setAttrs() {
    if (!d) {
      delete node.dataset.info;
      node.removeAttribute('tabindex');
      return;
    }
    node.dataset.info = '';
    if (!node.hasAttribute('tabindex')) node.setAttribute('tabindex', '0');
    if (!node.hasAttribute('role') && !(node instanceof HTMLButtonElement)) node.setAttribute('role', 'button');
    node.setAttribute('aria-label', d.kind ? `${d.title} (${d.kind}), show details` : `${d.title}, show details`);
  }

  // The innermost [data-info] under the pointer wins, so nested targets work.
  const owns = (target) => target instanceof Element && target.closest('[data-info]') === node;

  function onOver(e) {
    lastPointer = e.pointerType;
    if (!d || e.pointerType === 'touch' || !owns(e.target)) return;
    const c = infoState.current;
    if (c?.el === node) return;
    infoState.show(node, d);
  }
  function onOut(e) {
    if (e.pointerType === 'touch') return;
    if (e.relatedTarget instanceof Node && node.contains(e.relatedTarget) && owns(e.relatedTarget)) return;
    infoState.hide(node);
  }
  function onDown(e) {
    lastPointer = e.pointerType;
  }
  function onClick(e) {
    if (!d || !owns(e.target)) return;
    e.stopPropagation();
    const c = infoState.current;
    const touch = lastPointer === 'touch';
    if (c?.el === node && (c.pinned || touch)) infoState.clear();
    else infoState.show(node, d, { pinned: true, touch });
  }
  function onFocus(e) {
    if (!d || e.target !== node) return;
    // Focus caused by a click is handled by onClick.
    if (node.matches(':focus-visible')) infoState.show(node, d);
  }
  function onBlur() {
    infoState.hide(node);
  }
  function onKey(e) {
    if (!d || e.target !== node) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      const c = infoState.current;
      if (c?.el === node && c.pinned) infoState.clear();
      else infoState.show(node, d, { pinned: true });
    } else if (e.key === 'Escape') {
      infoState.clear();
    }
  }

  setAttrs();
  node.addEventListener('pointerover', onOver);
  node.addEventListener('pointerout', onOut);
  node.addEventListener('pointerdown', onDown);
  node.addEventListener('click', onClick);
  node.addEventListener('focus', onFocus);
  node.addEventListener('blur', onBlur);
  node.addEventListener('keydown', onKey);

  return {
    update(next) {
      d = next;
      setAttrs();
      if (d) infoState.update(node, d);
      else if (infoState.current?.el === node) infoState.clear();
    },
    destroy() {
      node.removeEventListener('pointerover', onOver);
      node.removeEventListener('pointerout', onOut);
      node.removeEventListener('pointerdown', onDown);
      node.removeEventListener('click', onClick);
      node.removeEventListener('focus', onFocus);
      node.removeEventListener('blur', onBlur);
      node.removeEventListener('keydown', onKey);
      if (infoState.current?.el === node) infoState.clear();
    },
  };
}
