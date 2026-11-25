// Step state for a step-by-step illustration. Pair it with <Stepper>.
//
//   const steps = new Steps(STEPS.length);
//   {#if steps.index >= 2} ... {/if}
//
// The illustration derives everything it draws from `steps.index`, so going
// backwards or jumping to a step always renders a correct state.
import { DUR, reducedMotion } from './motion.js';

export class Steps {
  index = $state(0);
  playing = $state(false);
  /** Bumped on every change; use as a {#key} to replay an animation. */
  version = $state(0);
  #timer = null;

  /**
   * @param {number} count
   * @param {{ interval?: number, start?: number }} [opts]
   */
  constructor(count, { interval = DUR.step, start = 0 } = {}) {
    this.count = count;
    this.interval = interval;
    this.index = start;
  }

  get atStart() {
    return this.index === 0;
  }
  get atEnd() {
    return this.index === this.count - 1;
  }

  go(i) {
    const next = Math.max(0, Math.min(this.count - 1, i));
    if (next !== this.index) {
      this.index = next;
      this.version++;
    }
    if (this.playing) this.#schedule();
  }
  next() {
    if (this.atEnd) return this.pause();
    this.go(this.index + 1);
  }
  prev() {
    this.go(this.index - 1);
  }
  reset() {
    this.pause();
    this.go(0);
  }

  play() {
    if (this.atEnd) this.go(0);
    this.playing = true;
    this.#schedule();
  }
  pause() {
    this.playing = false;
    clearTimeout(this.#timer);
  }
  toggle() {
    this.playing ? this.pause() : this.play();
  }

  #schedule() {
    clearTimeout(this.#timer);
    // Reduced motion still allows autoplay when asked; it just never starts by itself.
    this.#timer = setTimeout(() => {
      if (!this.playing) return;
      if (this.atEnd) this.pause();
      else this.next();
    }, this.interval);
  }

  destroy() {
    this.pause();
  }
}

export { reducedMotion };
