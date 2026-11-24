import { cubicIn, cubicOut } from 'svelte/easing';
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

/**
 * Chart swap, exit half: the old chart drifts up and fades out first...
 * @param {Element} node
 */
export const swapOut = (node) =>
	fly(node, { y: -24, duration: reducedMotion() ? 0 : 320, easing: cubicIn });

/**
 * ...then the new chart rises in once the old one has gone, so the two never overlap.
 * @param {Element} node
 */
export const swapIn = (node) =>
	fly(node, { y: 28, duration: reducedMotion() ? 0 : 650, delay: reducedMotion() ? 0 : 300, easing: cubicOut });
