<script>
	import { inview } from '#lib/inview.js';
	/**
	 * Bar view for one column of survey_0.csv. Counts are computed from `rows` (the caller passes
	 * the subset filtered by every *other* view), so the view recomputes when filters change.
	 * Clicking a bar toggles a filter on this view's value.
	 * @type {{
	 *   view: { field: string, title: string, column: string, question?: string, categories: (string|number)[], label?: (v: any) => string },
	 *   rows: Record<string, any>[],
	 *   total: number,
	 *   selected?: string | number | null,
	 *   colors?: string[],
	 *   onselect?: (value: string | number) => void,
	 *   youPlacement?: 'left' | 'below'
	 * }}
	 */
	// Where the "you are here" tag goes: in the gap left of the bar, or under it with a diagonal arrow
	let { view, rows, total, selected = null, colors = [], onselect, youPlacement = 'below' } = $props();

	let counts = $derived(
		view.categories.map((c, i) => ({
			value: c,
			label: view.label ? view.label(c) : String(c),
			count: rows.filter((r) => r[view.field] === c).length,
			color: colors[i] ?? 'var(--accent)'
		}))
	);
	let n = $derived(rows.filter((r) => r[view.field] != null).length);
	let max = $derived(Math.max(1, ...counts.map((c) => c.count)));
	let filtered = $derived(rows.length !== total);
	let ready = $state(false); // bars grow in from 0 the first time the chart is seen
	// The reader's own answer (added from the quiz as the row with id -1), marked "you are here".
	let youValue = $derived(rows.find((r) => r.id === -1)?.[view.field] ?? null);
</script>

<figure class="chart" use:inview={() => (ready = true)}>
	<figcaption>
		<h2>{view.title}</h2>
		<!-- The survey question: custom wording if given, else the CSV column without its "(1)" suffix -->
		<p class="col">{view.question ?? view.column.replace(/\s*\(\d\)\s*$/, '')}</p>
	</figcaption>

	<ul class="bars">
		{#each counts as c, i (c.value)}
			<li style:--i={i} class:is-you={youValue === c.value && youPlacement === 'below'}>
				<button
					type="button"
					class:active={selected === c.value}
					class:dim={selected != null && selected !== c.value}
					aria-pressed={selected === c.value}
					onclick={() => onselect?.(c.value)}
					title={selected === c.value ? 'Click to remove this filter' : `Filter to “${c.label}”`}
				>
					<span class="label">{c.label}</span>
					<span class="track">
						<span class="bar" style:width="{ready ? (c.count / max) * 100 : 0}%" style:background-color={c.color}></span>
						{#if youValue === c.value}
							{#if youPlacement === 'left'}
								<!-- In the gap between the label and the bar, pointing right at the bar -->
								<span class="you left">
									you are here
									<svg viewBox="0 0 30 16" aria-hidden="true">
										<path d="M2 10 C 9 4, 17 12, 27 7 M27 7 L 19 2 M27 7 L 21 14" />
									</svg>
								</span>
							{:else}
								<!-- Under the bar, a little to the left, with a diagonal arrow up to the bar -->
								<span class="you below">
									you are here
									<svg viewBox="0 0 26 20" aria-hidden="true">
										<path d="M2 18 C 8 16, 16 10, 23 3 M23 3 L 13 4 M23 3 L 21 12" />
									</svg>
								</span>
							{/if}
						{/if}
					</span>
					<span class="value">
						{c.count}
						<small>{n ? Math.round((c.count / n) * 100) : 0}%</small>
					</span>
				</button>
			</li>
		{/each}
	</ul>

	<footer>
		{n} of {total} students{filtered ? ' (filtered)' : ''} · click a bar to filter the other charts
	</footer>
</figure>

<style>
	.chart {
		margin: 0;
		display: grid;
		align-content: start;
		gap: 0.75rem;
		padding: 1.25rem 1.25rem 1rem;
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
	.bars {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: 0.3rem;
	}
	button {
		width: 100%;
		display: grid;
		grid-template-columns: minmax(7rem, 11rem) 1fr 4.25rem;
		align-items: center;
		gap: 0.75rem;
		padding: 0.25rem 0.4rem;
		border: 1px solid transparent;
		border-radius: 6px;
		background: none;
		color: var(--fg);
		font: inherit;
		text-align: left;
		cursor: pointer;
	}
	button:hover {
		border-color: var(--line);
		background: var(--track);
	}
	button:focus-visible {
		outline: 2px solid var(--accent);
		outline-offset: 1px;
	}
	button.active {
		border-color: var(--accent);
		background: color-mix(in srgb, var(--accent) 10%, transparent);
	}
	button.dim {
		opacity: 0.45;
	}
	.label {
		font-size: 0.85rem;
	}
	.track {
		position: relative;
		height: 1.1rem;
		background: var(--track);
		border-radius: 4px;
	}
	/* "You are here" tag in the theme red, on a paper chip so it reads over a bar too */
	/* The reader's row gets extra room underneath for the tag */
	.is-you button {
		padding-bottom: 1.45rem;
	}
	.you {
		position: absolute;
		/* Theme accent purple (the site's annotation colour), a touch deeper so it reads as text */
		color: color-mix(in srgb, var(--accent) 80%, var(--ink));
		font: 700 0.9rem / 1.2 var(--font-display);
		white-space: nowrap;
		pointer-events: none;
		animation: you-in 500ms var(--ease-out) 300ms backwards;
	}
	.you.left {
		right: calc(100% + 0.3rem);
		top: 50%;
		translate: 0 -50%;
		display: flex;
		align-items: center;
		gap: 0.15rem;
	}
	.you.left svg {
		width: 1.7rem;
		height: 0.95rem;
		overflow: visible;
	}
	/* The arrow tip lands just inside the start of the bar */
	.you.below {
		right: calc(100% - 0.7rem);
		top: calc(100% - 2px);
		display: flex;
		align-items: flex-start;
		gap: 0.1rem;
		padding-top: 0.55rem;
	}
	.you.below svg {
		width: 1.5rem;
		height: 1.15rem;
		margin-top: -0.55rem;
		overflow: visible;
	}
	.you svg path {
		fill: none;
		stroke: currentColor;
		stroke-width: 2.4;
		stroke-linecap: round;
		stroke-linejoin: round;
	}
	@keyframes you-in {
		from {
			opacity: 0;
		}
	}
	.bar {
		display: block;
		height: 100%;
		border-radius: 4px;
		transition: width 800ms var(--ease-out) calc(var(--i) * 60ms);
	}
	.value {
		text-align: right;
		font-weight: 600;
		font-variant-numeric: tabular-nums;
	}
	.value small {
		font-weight: 400;
		color: var(--muted);
		margin-left: 0.2rem;
	}
	footer {
		font-size: 0.75rem;
		color: var(--muted);
	}
	@media (max-width: 480px) {
		button {
			grid-template-columns: 1fr 3.75rem;
			gap: 0.2rem 0.5rem;
		}
		.label {
			grid-column: 1 / -1;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.bar {
			transition: none;
		}
	}
</style>
