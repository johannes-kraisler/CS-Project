<script>
	/**
	 * Text that gets "highlighted with a marker" word by word as `progress` goes from 0 to 1 (scroll-linked).
	 * Unlit words are faint pencil; lit words turn to ink with a yellow highlighter stroke sweeping behind them.
	 * The full sentence is always in the DOM, so screen readers and search read it normally.
	 * @type {{ text: string, progress: number, start?: number, end?: number }}
	 */
	let { text, progress, start = 0.05, end = 0.55 } = $props();

	let words = $derived(text.split(/\s+/));
	let t = $derived(Math.min(1, Math.max(0, (progress - start) / (end - start))));
	let lit = $derived(t * words.length);
</script>

<span class="reveal">
	{#each words as w, i (i)}
		<!-- The trailing space sits inside the span so the highlight reads as one continuous stroke -->
		<span class="w" class:on={i < lit}>{w}{i < words.length - 1 ? ' ' : ''}</span>
	{/each}
</span>

<style>
	.w {
		color: color-mix(in srgb, var(--fg) 30%, transparent);
		background-image: linear-gradient(
			100deg,
			transparent 0.2em,
			var(--highlight) 0.25em,
			var(--highlight) calc(100% - 0.1em),
			transparent calc(100% - 0.05em)
		);
		background-repeat: no-repeat;
		background-position: 0 85%;
		background-size: 0% 55%;
		box-decoration-break: clone;
		-webkit-box-decoration-break: clone;
		transition:
			color 250ms ease,
			background-size 300ms ease-out;
	}
	.w.on {
		color: var(--fg);
		background-size: 100% 55%;
	}
</style>
