// Shared motion settings for illustrations. Use these instead of ad-hoc
// numbers so every page moves the same way. See "Animation" in DESIGN.md.
import { cubicOut } from 'svelte/easing';

const mq = typeof matchMedia === 'function' ? matchMedia('(prefers-reduced-motion: reduce)') : null;

/** True when the user asked for reduced motion. Read it at animation time. */
export const reducedMotion = () => !!mq?.matches;

/** Durations in ms. Scaled to 0 under reduced motion via dur(). */
export const DUR = {
  ui: 160,
  enter: 420,
  travel: 900, // a message/packet crossing a diagram
  step: 3200, // autoplay time per step
};

export const dur = (ms) => (reducedMotion() ? 0 : ms);

/** GSAP ease matching --ease. */
export const EASE = 'power3.out';
export const EASE_TRAVEL = 'power2.inOut';

/** Svelte transition options for elements appearing in a diagram. */
export const enter = (delay = 0) => ({ duration: dur(DUR.enter), delay: dur(delay), easing: cubicOut });
