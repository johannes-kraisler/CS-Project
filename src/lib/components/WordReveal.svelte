<script>
	/**
	 * Text that gets "highlighted with a marker" word by word as `progress` goes from 0 to 1 (scroll-linked).
	 * Unlit words are faint pencil; lit words turn to ink with a yellow highlighter stroke sweeping behind them.
	 * The full sentence is always in the DOM, so screen readers and search read it normally.
	 * A newline (\n) in `text` forces a line break there.
	 * `highlight="none"` just turns words to ink with no highlighter.
	 * `highlight="last-line"` keeps the yellow highlighter for the last line only (the rest just turns to ink).
	 * @type {{ text: string, progress: number, start?: number, end?: number, highlight?: 'all' | 'last-line' | 'none' }}
	 */
	let { text, progress, start = 0.05, end = 0.55, highlight = 'all' } = $props();

	// Each word remembers whether a forced line break (\n) comes right after it.
	let words = $derived(
		text
			.split(/\n/)
			.flatMap((line, li, lines) =>
				line
					.trim()
					.split(/\s+/)
					.map((w, wi, ws) => ({
						w,
						br: wi === ws.length - 1 && li < lines.length - 1,
						hl: highlight === 'all' || (highlight === 'last-line' && li === lines.length - 1)
					}))
			)
	);
	let t = $derived(Math.min(1, Math.max(0, (progress - start) / (end - start))));
	let lit = $derived(t * words.length);
</script>

<span class="reveal">
	{#each words as w, i (i)}
		<!-- The trailing space sits inside the span so the highlight reads as one continuous stroke -->
		<span class="w" class:on={i < lit} class:plain={!w.hl}>{w.w}{i < words.length - 1 && !w.br ? ' ' : ''}</span>{#if w.br}<br />{/if}
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
	.w.plain {
		background-image: none;
	}
</style>
