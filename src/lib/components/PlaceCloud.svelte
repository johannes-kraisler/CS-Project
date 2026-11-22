<script>
	import { hierarchy, pack } from 'd3';
	import { inview } from '#lib/inview.js';

	/**
	 * Bubble "word cloud" of favourite-place categories (column "What type of place is this? (1)").
	 * Bubble area is proportional to the number of students who named that category.
	 * Recomputes over whatever rows it is given (the story passes the filtered subset).
	 * @type {{
	 *   rows: import('#lib/survey0.js').Response[],
	 *   total: number,
	 *   column: string
	 * }}
	 */
	let { rows, total, column } = $props();
	let popped = $state(false); // bubbles pop in, largest first, the first time the cloud is seen

	const W = 640;
	const H = 460;

	/** Display names and colours for each category. */
	const STYLE = {
		// Okabe-Ito colours. There are more categories than colours, so a few share one;
		// every bubble is labelled, so colour is never the only cue.
		'Campus space (lounge, study space)': { name: 'Campus space', color: 'var(--oi-blue)' },
		'Gym or recreation centre': { name: 'Gym or rec centre', color: 'var(--oi-green)' },
		'Park or outdoor space': { name: 'Park or outdoors', color: 'var(--oi-sky)' },
		'Club, cultural or community group': { name: 'Club or community group', color: 'var(--oi-orange)' },
		Library: { name: 'Library', color: 'var(--oi-purple)' },
		'Religious or spiritual space': { name: 'Religious space', color: 'var(--oi-yellow)' },
		'Café or restaurant': { name: 'Café or restaurant', color: 'var(--oi-vermillion)' },
		'Pub or bar': { name: 'Pub or bar', color: 'var(--oi-vermillion)' },
		"Home or friend's home": { name: "Home or friend's home", color: 'var(--oi-black)' },
		'Online gaming': { name: 'Online gaming', color: 'var(--oi-purple)' },
		Other: { name: 'Other', color: 'var(--muted)' }
	};
	const styleOf = (/** @type {string} */ c) =>
		STYLE[/** @type {keyof typeof STYLE} */ (c)] ?? { name: c, color: 'var(--accent)' };

	let categories = $derived.by(() => {
		/** @type {Map<string, string[]>} */
		const m = new Map();
		for (const r of rows) {
			if (!r.placeType) continue;
			if (!m.has(r.placeType)) m.set(r.placeType, []);
			m.get(r.placeType)?.push(r.placeName);
		}
		return [...m].map(([category, names]) => ({ category, count: names.length, names }));
	});

	let bubbles = $derived.by(() => {
		if (!categories.length) return [];
		/** @type {any} */
		const root = hierarchy({ children: categories }).sum((/** @type {any} */ d) => d.count ?? 0);
		return pack()
			.size([W, H])
			.padding(8)(root)
			.leaves()
			.map((/** @type {any} */ n) => ({ ...n.data, x: n.x, y: n.y, r: n.r, ...styleOf(n.data.category) }));
	});

	/** Split a label into one to three lines of roughly equal length. @param {string} s */
	const lines = (s) => {
		const words = s.split(' ');
		if (words.length < 3 && s.length < 14) return [s];
		const n = s.length > 18 && words.length >= 3 ? 3 : 2;
		const target = s.length / n;
		/** @type {string[]} */
		const out = [];
		let cur = '';
		for (const w of words) {
			if (cur && (cur + ' ' + w).length > target + 2 && out.length < n - 1) {
				out.push(cur);
				cur = w;
			} else {
				cur = cur ? cur + ' ' + w : w;
			}
		}
		out.push(cur);
		return out;
	};

	/** @type {string | null} */
	let selected = $state(null);
	let selectedData = $derived(categories.find((c) => c.category === selected) ?? null);
	let counted = $derived(categories.reduce((s, c) => s + c.count, 0));
</script>

<figure class="chart" class:popped use:inview={() => (popped = true)}>
	<figcaption>
		<h2>Where students like to socialize</h2>
		<p class="col">Column: “{column}”. Bubble size = number of students who named that type of place.</p>
	</figcaption>

	<div class="cloud">
		<svg viewBox="0 0 {W} {H}" role="img" aria-label="Bubble chart of favourite place types: {bubbles.map((b) => `${b.name} ${b.count}`).join(', ')}">
			{#each bubbles as b, bi (b.category)}
				{@const longest = Math.max(...lines(b.name).map((l) => l.length))}
				<!-- Font size: grows with the bubble, but never wider than ~80% of its diameter (≈0.58em per character). -->
				{@const fs = Math.max(8, Math.min(22, b.r / 3.6, (b.r * 1.6) / (longest * 0.58)))}
				<g
					style:--i={bi}
					class="bubble"
					class:sel={b.category === selected}
					transform="translate({b.x},{b.y})"
					role="button"
					tabindex="0"
					aria-label="{b.name}: {b.count} {b.count === 1 ? 'student' : 'students'}"
					onclick={() => (selected = b.category === selected ? null : b.category)}
					onkeydown={(e) => {
						if (e.key === 'Enter' || e.key === ' ') {
							e.preventDefault();
							selected = b.category === selected ? null : b.category;
						}
					}}
				>
					<circle r={b.r} style:--c={b.color} />
					{#each lines(b.name) as line, li (li)}
						<text
							class="word"
							y={(li - (lines(b.name).length - 1) / 2) * fs * 1.1 - fs * 0.35}
							font-size={fs}
							text-anchor="middle"
							dominant-baseline="middle">{line}</text
						>
					{/each}
					<text class="n" y={(lines(b.name).length / 2) * fs * 1.1 + 4} font-size={Math.max(10, fs * 0.75)} text-anchor="middle" dominant-baseline="middle">
						{b.count} {b.count === 1 ? 'student' : 'students'}
					</text>
					<title>{b.name}: {b.count}</title>
				</g>
			{/each}
		</svg>
	</div>

	<p class="count">{counted} of {total} students{counted !== total ? ' (filtered)' : ''} · click a bubble to see the places named</p>

	<div class="detail" aria-live="polite">
		{#if selectedData}
			<p><b>{styleOf(selectedData.category).name}</b> ({selectedData.count}): {selectedData.names.filter(Boolean).join(' · ')}</p>
		{:else}
			<p class="muted">Click a bubble to see which places students named.</p>
		{/if}
	</div>
</figure>

<style>
	.chart {
		margin: 0;
		display: grid;
		align-content: start;
		gap: 0.6rem;
		padding: 1.1rem 1.25rem 1rem;
		background: var(--surface);
		border: 1px solid var(--line);
		border-radius: 10px;
		min-width: 0;
	}
	h2 {
		margin: 0;
		font: 600 1.15rem/1.2 var(--font-display);
	}
	.col {
		margin: 0.3rem 0 0;
		font-size: 0.75rem;
		color: var(--muted);
		line-height: 1.4;
	}
	.cloud svg {
		display: block;
		width: 100%;
		height: auto;
		max-height: 56vh;
		overflow: visible;
	}
	.bubble {
		cursor: pointer;
		outline: none;
	}
	/* Entrance: each bubble scales up from its centre, one after another */
	.bubble > * {
		transform: scale(0);
		transform-origin: 0 0;
		opacity: 0;
		transition:
			transform 700ms cubic-bezier(0.34, 1.56, 0.64, 1) calc(var(--i) * 70ms),
			opacity 300ms ease calc(var(--i) * 70ms),
			fill 200ms ease;
	}
	.popped .bubble > * {
		transform: none;
		opacity: 1;
	}
	.bubble circle {
		fill: color-mix(in srgb, var(--c) 30%, var(--surface));
		stroke: var(--ink);
		stroke-width: 2;
		filter: url(#sketch);
		transition: fill 200ms ease;
	}
	.bubble:hover circle,
	.bubble.sel circle {
		fill: color-mix(in srgb, var(--c) 40%, var(--surface));
	}
	.bubble.sel circle,
	.bubble:focus-visible circle {
		stroke: var(--fg);
		stroke-width: 3;
	}
	.word {
		fill: var(--fg);
		font-family: var(--font-display);
		font-weight: 600;
		pointer-events: none;
	}
	.n {
		fill: var(--muted);
		font-variant-numeric: tabular-nums;
		pointer-events: none;
	}
	.count {
		margin: 0;
		font-size: 0.78rem;
		color: var(--muted);
	}
	.detail {
		min-height: 2.6rem;
		padding: 0.6rem 0.8rem;
		background: var(--track);
		border-radius: 6px;
		font-size: 0.85rem;
		line-height: 1.45;
	}
	.detail p {
		margin: 0;
	}
	.muted {
		color: var(--muted);
	}
	@media (prefers-reduced-motion: reduce) {
		.bubble circle {
			transition: none;
		}
	}
</style>
