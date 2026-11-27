<script>
	import { hierarchy, pack } from 'd3';
	import { inview } from '#lib/inview.js';
	import { NOT_THIRD, placeStyle } from '#lib/survey0.js';

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
	const MARGIN = 34;

	// Display names and colours come from the shared list, so the map uses the same ones
	const styleOf = placeStyle;

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
		/** @type {any} */
		// A free margin around the bubbles leaves room for the "you are here" label at the edges
		const layout = pack().size([W - 2 * MARGIN, H - 2 * MARGIN]);
		return layout
			.padding(8)(root)
			.leaves()
			.map((/** @type {any} */ n) => ({ ...n.data, x: n.x + MARGIN, y: n.y + MARGIN, r: n.r, ...styleOf(n.data.category) }));
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
	// The reader's own answer from the quiz (row id -1): its bubble gets a "you are here" arrow.
	// Try directions around the bubble and use the first where the label stays inside the chart
	// and clear of every other bubble, so it never covers text.
	const LABEL_W = 112;
	const LABEL_H = 24;
	let youMark = $derived.by(() => {
		const t = rows.find((r) => r.id === -1)?.placeType;
		const b = t ? bubbles.find((/** @type {any} */ x) => x.category === t) : null;
		if (!b) return null;
		const others = bubbles.filter((/** @type {any} */ o) => o !== b);
		/** Distance from point to the nearest other bubble's edge (negative = inside it) */
		const gap = (/** @type {number} */ px, /** @type {number} */ py) =>
			Math.min(Infinity, ...others.map((/** @type {any} */ o) => Math.hypot(o.x - px, o.y - py) - o.r));
		// Directions every 22.5°, preferring up-right, at a few arrow lengths
		const angles = Array.from({ length: 16 }, (_, k) => -45 + k * 22.5);
		/** @param {number} deg @param {number} len */
		const place = (deg, len) => {
			const a = (deg * Math.PI) / 180;
			const dx = Math.cos(a);
			const dy = Math.sin(a);
			const tip = { x: b.x + dx * (b.r + 3), y: b.y + dy * (b.r + 3) };
			const tail = { x: b.x + dx * (b.r + len), y: b.y + dy * (b.r + len) };
			// Label box sits beyond the tail, on the side the arrow comes from
			const left = dx > 0.3 ? tail.x + 4 : dx < -0.3 ? tail.x - 4 - LABEL_W : tail.x - LABEL_W / 2;
			const top = dy > 0.3 ? tail.y + 2 : dy < -0.3 ? tail.y - 2 - LABEL_H : tail.y - LABEL_H / 2;
			const box = { left, top, right: left + LABEL_W, bottom: top + LABEL_H };
			const inside = box.left >= 2 && box.right <= W - 2 && box.top >= 2 && box.bottom <= H - 2;
			const boxClear = others.every((/** @type {any} */ o) => {
				const nx = Math.max(box.left, Math.min(o.x, box.right));
				const ny = Math.max(box.top, Math.min(o.y, box.bottom));
				return Math.hypot(o.x - nx, o.y - ny) > o.r + 3;
			});
			let lineClear = true;
			for (let t = 0; t <= 1; t += 0.1) {
				if (gap(tip.x + (tail.x - tip.x) * t, tip.y + (tail.y - tip.y) * t) < 3) lineClear = false;
			}
			return { tip, tail, box, ok: inside && boxClear && lineClear, inside, dx, dy };
		};
		const options = [40, 60, 85, 115, 150].flatMap((len) => angles.map((deg) => place(deg, len)));
		const m = options.find((o) => o.ok) ?? options.find((o) => o.inside) ?? options[0];
		// Arrowhead: two short strokes back from the tip
		const ang = Math.atan2(m.tip.y - m.tail.y, m.tip.x - m.tail.x);
		const head = [-0.5, 0.5]
			.map((s) => `M${m.tip.x},${m.tip.y} l${-11 * Math.cos(ang + s)},${-11 * Math.sin(ang + s)}`)
			.join(' ');
		const midX = (m.tip.x + m.tail.x) / 2 - m.dy * 8;
		const midY = (m.tip.y + m.tail.y) / 2 + m.dx * 8;
		return {
			d: `M${m.tail.x},${m.tail.y} Q${midX},${midY} ${m.tip.x},${m.tip.y} ${head}`,
			tx: m.box.left + LABEL_W / 2,
			ty: m.box.top + LABEL_H / 2
		};
	});
</script>

<figure class="chart" class:popped use:inview={() => (popped = true)}>
	<figcaption>
		<h2>Where students like to socialize</h2>
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
					<circle r={b.r} style:--c={b.color} class:not-third={b.category === NOT_THIRD} />
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
			{#if youMark}
				<!-- Arrow from the label to the edge of the reader's bubble -->
				<g class="you" aria-hidden="true">
					<path d={youMark.d} />
					<text x={youMark.tx} y={youMark.ty} text-anchor="middle" dominant-baseline="middle">you are here</text>
				</g>
			{/if}
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
	.you path {
		fill: none;
		stroke: color-mix(in srgb, var(--accent) 80%, var(--ink));
		stroke-width: 3;
		stroke-linecap: round;
		stroke-linejoin: round;
	}
	.you text {
		fill: color-mix(in srgb, var(--accent) 80%, var(--ink));
		paint-order: stroke;
		stroke: var(--surface);
		stroke-width: 5px;
		font: 700 20px var(--font-display);
	}
	.you {
		pointer-events: none;
		/* Theme accent purple (the site's annotation colour), a touch deeper so it reads as text */
		animation: you-pop 500ms var(--ease-out) 600ms backwards;
	}
	@keyframes you-pop {
		from {
			opacity: 0;
		}
	}
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
	/* Places that aren't third spaces: grey with a dashed outline, so they read as "the rest" */
	.bubble circle.not-third {
		stroke-dasharray: 7 5;
		stroke-width: 1.5;
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
