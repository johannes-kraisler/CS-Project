import { cubicOut } from 'svelte/easing';
import { fade, fly } from 'svelte/transition';

/** True when the viewer asked the OS for reduced motion (always false during SSR). */
export const reducedMotion = () =>
	typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Scene enter: rise + fade in (skipped with reduced motion).
 * @param {Element} node
 */
export const sceneIn = (node) =>
	fly(node, { y: 36, duration: reducedMotion() ? 0 : 700, delay: reducedMotion() ? 0 : 120, easing: cubicOut });

/**
 * Scene exit: quick fade.
 * @param {Element} node
 */
export const sceneOut = (node) => fade(node, { duration: reducedMotion() ? 0 : 250 });
