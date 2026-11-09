<script>
	/**
	 * Sense of belonging in neighbourhoods grouped by how many City community centres they have.
	 * @type {{
	 *   data: { totalCentres: number,
	 *     neighbourhoods: { name: string, centres: number, base: number, unweighted: number,
	 *       strong: number, weak: number }[] },
	 *   caption?: string[]
	 * }}
	 */
	let { data, caption = [] } = $props();

	const bins = [
		{ label: 'No community centre', test: (/** @type {number} */ n) => n === 0 },
		{ label: '1 community centre', test: (/** @type {number} */ n) => n === 1 },
		{ label: '2 community centres', test: (/** @type {number} */ n) => n === 2 },
		{ label: '3 or more', test: (/** @type {number} */ n) => n >= 3 }
	];

	// Pool respondents across neighbourhoods in each group (weighted by each neighbourhood's base).
	const groups = bins.map((b) => {
		const hoods = data.neighbourhoods.filter((h) => b.test(h.centres));
		const base = hoods.reduce((s, h) => s + h.base, 0);
		return {
			label: b.label,
			hoods: hoods.length,
			respondents: hoods.reduce((s, h) => s + h.unweighted, 0),
			strong: hoods.reduce((s, h) => s + h.strong * h.base, 0) / base,
			weak: hoods.reduce((s, h) => s + h.weak * h.base, 0) / base
		};
	});

	const max = Math.ceil(Math.max(...groups.flatMap((g) => [g.strong, g.weak])) / 10) * 10;
	const measures = [
		{ key: 'strong', label: 'Strong belonging', color: 'var(--good-2)' },
		{ key: 'weak', label: 'Weak belonging', color: 'var(--bad-2)' }
	];
</script>

<figure class="chart">
	<figcaption>
		<h2>Community centres and belonging</h2>
		<p class="q">
			Sense of belonging in Toronto's 158 neighbourhoods, grouped by how many City-run community
			centres each neighbourhood has ({data.totalCentres} centres in total).
		</p>
	</figcaption>

	<ul class="legend" aria-hidden="true">
		{#each measures as m (m.key)}
			<li><span class="swatch" style:background={m.color}></span>{m.label}</li>
		{/each}
	</ul>

	<div class="rows">
		{#each groups as g (g.label)}
			<div class="row">
				<div class="group">
					<span>{g.label}</span>
					<small>{g.hoods} neighbourhoods · {g.respondents.toLocaleString()} respondents</small>
				</div>
				<div class="pair">
					{#each measures as m (m.key)}
						{@const v = m.key === 'strong' ? g.strong : g.weak}
						<div class="line">
							<span class="track">
								<span class="bar" style:width="{(v / max) * 100}%" style:background={m.color}></span>
							</span>
							<span class="value" style:color={m.color}>{v.toFixed(0)}%</span>
						</div>
					{/each}
				</div>
			</div>
		{/each}
	</div>

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
		All ages. Community centres: City of Toronto Open Data, Parks and Recreation Facilities (type
		"Community Centre"), matched to neighbourhood boundaries by location. Belonging: survey Tables
		3–6. Each neighbourhood has only 24–79 respondents, so the groups are compared rather than single
		neighbourhoods.
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
		max-width: 70ch;
	}
	.legend {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem 1.25rem;
		font-size: 0.8rem;
		color: var(--muted);
	}
	.legend li {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
	}
	.swatch {
		width: 0.8rem;
		height: 0.8rem;
		border-radius: 3px;
	}
	.rows {
		display: grid;
		gap: 1rem;
	}
	.row {
		display: grid;
		grid-template-columns: minmax(10rem, 14rem) 1fr;
		gap: 0.75rem;
		align-items: center;
	}
	.group {
		display: grid;
		font-size: 0.9rem;
		font-weight: 600;
	}
	.group small {
		font-size: 0.72rem;
		font-weight: 400;
		color: var(--muted);
		font-variant-numeric: tabular-nums;
	}
	.pair {
		display: grid;
		gap: 0.3rem;
	}
	.line {
		display: grid;
		grid-template-columns: 1fr 3rem;
		gap: 0.75rem;
		align-items: center;
	}
	.track {
		position: relative;
		height: 1.1rem;
		background: var(--track);
		border-radius: 4px;
	}
	.bar {
		position: absolute;
		inset: 0 auto 0 0;
		border-radius: 4px;
	}
	.value {
		text-align: right;
		font-weight: 600;
		font-variant-numeric: tabular-nums;
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
	footer {
		font-size: 0.75rem;
		color: var(--muted);
		line-height: 1.45;
	}
	@media (max-width: 520px) {
		.row {
			grid-template-columns: 1fr;
			gap: 0.4rem;
		}
	}
</style>
