<script>
	import { inview } from '#lib/inview.js';
	/**
	 * Bar view for one column of survey_0.csv. Counts are computed from `rows` (the caller passes
	 * the subset filtered by every *other* view), so the view recomputes when filters change.
	 * Clicking a bar toggles a filter on this view's value.
	 * @type {{
	 *   view: { field: string, title: string, column: string, categories: (string|number)[], label?: (v: any) => string },
	 *   rows: Record<string, any>[],
	 *   total: number,
	 *   selected?: string | number | null,
	 *   colors?: string[],
	 *   onselect?: (value: string | number) => void
	 * }}
	 */
	let { view, rows, total, selected = null, colors = [], onselect } = $props();

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
</script>

<figure class="chart" use:inview={() => (ready = true)}>
	<figcaption>
		<h2>{view.title}</h2>
		<p class="col">Column: “{view.column}”</p>
	</figcaption>

	<ul class="bars">
		{#each counts as c, i (c.value)}
			<li style:--i={i}>
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
		height: 1.1rem;
		background: var(--track);
		border-radius: 4px;
		overflow: hidden;
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
