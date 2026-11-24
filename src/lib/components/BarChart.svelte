<script>
	import { inview } from '#lib/inview.js';
	/**
	 * Horizontal bar chart for one survey question.
	 * @type {{
	 *   question: { title: string, question: string, base: Record<string, number>,
	 *     unweightedBase: Record<string, number>, noAnswer: Record<string, number>,
	 *     answers: { label: string, counts: Record<string, number> }[] },
	 *   age: string,
	 *   ageLabel: string,
	 *   colors: string[],
	 *   caption?: string[]
	 * }}
	 */
	let { question, age, ageLabel, colors, caption = [] } = $props();

	/** @param {number} count @param {string} group */
	const pct = (count, group) => (count / question.base[group]) * 100;

	let rows = $derived(
		question.answers.map((a, i) => ({
			label: a.label,
			value: pct(a.counts[age], age),
			overall: pct(a.counts.all, 'all'),
			color: colors[i % colors.length]
		}))
	);

	// Shared axis max, rounded up to the next 10%, so bars stay comparable between age groups.
	let max = $derived(
		Math.ceil(
			Math.max(...question.answers.flatMap((a) => Object.keys(a.counts).map((g) => pct(a.counts[g], g)))) / 10
		) * 10
	);

	let noAnswer = $derived(pct(question.noAnswer[age], age));
	let comparing = $derived(age !== 'all');
	let ready = $state(false); // bars grow in from 0 the first time the chart is seen
</script>

<figure class="chart" use:inview={() => (ready = true)}>
	<figcaption>
		<h2>{question.title}</h2>
		<p class="q">{question.question.replace(/^Q\d+\.\s*/, '')}</p>
	</figcaption>

	<ul class="bars" aria-label="{question.title}, {ageLabel}">
		{#each rows as row, i (row.label)}
			<li style:--i={i}>
				<span class="label">{row.label}</span>
				<span class="track">
					<span class="bar" style:width="{ready ? (row.value / max) * 100 : 0}%" style:background-color={row.color}></span>
					{#if comparing}
						<span
							class="marker"
							style:left="{(row.overall / max) * 100}%"
							title="All ages: {row.overall.toFixed(0)}%"
						></span>
					{/if}
				</span>
				<span class="value">{row.value.toFixed(0)}%</span>
			</li>
		{/each}
	</ul>

	{#if caption.length}
		<div class="caption">
			<p class="caption-head">Key findings</p>
			<ul>
				{#each caption as line}
					<li>{line}</li>
				{/each}
			</ul>
		</div>
	{/if}

	<footer>
		<span>Don't know / no answer: {noAnswer.toFixed(0)}%</span>
		{#if comparing}
			<span class="legend"><span class="marker-key"></span>All ages</span>
		{/if}
	</footer>
</figure>

<style>
	.chart {
		margin: 0;
		display: grid;
		align-content: start;
		gap: 1rem;
		padding: 1.25rem 1.25rem 1rem;
		background: var(--surface);
		border: 1px solid var(--line);
		border-radius: 10px;
		min-width: 0;
	}
	h2 {
		margin: 0;
		font: 600 1.15rem/1.2 var(--font-display);
		text-wrap: balance;
	}
	.q {
		margin: 0.35rem 0 0;
		color: var(--muted);
		font-size: 0.85rem;
		line-height: 1.4;
	}
	.bars {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: 0.6rem;
	}
	.bars li {
		display: grid;
		grid-template-columns: minmax(7rem, 9.5rem) 1fr 3rem;
		align-items: center;
		gap: 0.75rem;
	}
	.label {
		font-size: 0.875rem;
	}
	.track {
		position: relative;
		height: 1.4rem;
		background: var(--track);
		border-radius: 4px;
	}
	.bar {
		position: absolute;
		inset: 0 auto 0 0;
		border-radius: 4px;
		transition: width 900ms var(--ease-out) calc(var(--i) * 70ms);
	}
	.marker {
		position: absolute;
		top: -3px;
		bottom: -3px;
		width: 2px;
		margin-left: -1px;
		background: var(--fg);
		transition: left 900ms var(--ease-out);
	}
	.value {
		text-align: right;
		font-variant-numeric: tabular-nums;
		font-weight: 600;
	}
	.caption {
		padding: 0.75rem 0.9rem;
		background: var(--track);
		border-radius: 6px;
		font-size: 0.85rem;
		line-height: 1.45;
	}
	.caption-head {
		margin: 0 0 0.35rem;
		font-size: 0.7rem;
		font-weight: 600;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--muted);
	}
	.caption ul {
		margin: 0;
		padding-left: 1.1rem;
		display: grid;
		gap: 0.3rem;
	}
	.caption li {
		display: list-item;
	}
	footer {
		display: flex;
		flex-wrap: wrap;
		gap: 0.35rem 1.25rem;
		font-size: 0.75rem;
		color: var(--muted);
		font-variant-numeric: tabular-nums;
	}
	.legend {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
	}
	.marker-key {
		width: 2px;
		height: 0.9rem;
		background: var(--fg);
	}
	@media (max-width: 480px) {
		.bars li {
			grid-template-columns: 1fr 2.75rem;
			gap: 0.25rem 0.5rem;
		}
		.label {
			grid-column: 1 / -1;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.bar,
		.marker {
			transition: none;
		}
	}
</style>
