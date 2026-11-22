<script>
	import { untrack } from 'svelte';
	import { reducedMotion } from '#lib/motion.js';

	/**
	 * A number that counts up to `value` when it first appears, and tweens when `value` changes.
	 * @type {{ value: number, duration?: number, decimals?: number }}
	 */
	let { value, duration = 1400, decimals = 0 } = $props();

	let shown = $state(0);

	$effect(() => {
		const from = untrack(() => shown);
		const to = value;
		if (reducedMotion() || from === to) {
			shown = to;
			return;
		}
		const t0 = performance.now();
		let id = 0;
		const tick = (/** @type {number} */ now) => {
			const t = Math.min(1, (now - t0) / duration);
			const eased = 1 - Math.pow(1 - t, 4);
			shown = from + (to - from) * eased;
			if (t < 1) id = requestAnimationFrame(tick);
		};
		id = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(id);
	});
</script>

<span class="num">{shown.toFixed(decimals)}</span>

<style>
	.num {
		font-variant-numeric: tabular-nums;
	}
</style>
