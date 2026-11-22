<script>
	/**
	 * Two lines across the categories of one question: % with a strong and % with a weak sense
	 * of belonging in each category. The viewer picks a category (buttons or clicking the chart)
	 * to highlight it and see a plain-language summary.
	 * @type {{
	 *   id: string,
	 *   title: string,
	 *   intro: string,
	 *   pickerLegend: string,
	 *   points: { label: string, n: number, strong: number, weak: number }[],
	 *   heading: (label: string) => string,
	 *   initial?: string,
	 *   selected?: string,
	 *   compact?: boolean,
	 *   caption?: string[],
	 *   footer?: string,
	 *   yMax?: number,
	 *   yTicks?: number[],
	 *   nouns?: [string, string],
	 *   lineLabels?: [string, string],
	 *   phrases?: [string, string]
	 * }}
	 */
	let {
		id,
		title,
		intro,
		pickerLegend,
		points,
		heading,
		initial,
		selected = $bindable(initial ?? points[points.length - 1].label),
		compact = false,
		caption = [],
		footer = '',
		yMax = 90,
		yTicks = [0, 20, 40, 60, 80],
		nouns = ['person', 'people'],
		lineLabels = ['Strong belonging', 'Weak belonging'],
		// Used in the summary sentence after "feel" (strong first, weak second).
		phrases = ['a strong sense of belonging', 'a weak sense of belonging']
	} = $props();

	/** @param {number} n */
	const count = (n) => `${n.toLocaleString()} ${n === 1 ? nouns[0] : nouns[1]}`;

	const W = 760;
	const H = 380;
	const pad = { top: 60, right: 130, bottom: 52, left: 48 };
	const innerW = W - pad.left - pad.right;
	const innerH = H - pad.top - pad.bottom;

	let step = $derived(innerW / points.length);
	/** @param {number} i */
	const cx = (i) => pad.left + step * (i + 0.5);
	/** @param {number} v */
	const y = (v) => pad.top + innerH - (v / yMax) * innerH;
	/** @param {number[]} vs */
	const pathOf = (vs) => vs.map((v, i) => `${i ? 'L' : 'M'}${cx(i)},${y(v)}`).join(' ');

	const STRONG = 'var(--good-2)';
	const WEAK = 'var(--bad-2)';
	let lines = $derived([
		{ key: 'strong', label: lineLabels[0], values: points.map((p) => p.strong), color: STRONG },
		{ key: 'weak', label: lineLabels[1], values: points.map((p) => p.weak), color: WEAK }
	]);
	// Label a point below it only when the other line sits just above it (avoids overlap).
	/** @param {number} v @param {number} other */
	const labelAbove = (v, other) => !(other > v && other - v < 8);

	let last = $derived(points.length - 1);

	let sel = $derived(points.find((p) => p.label === selected) ?? points[last]);
	let selIndex = $derived(points.indexOf(sel));

	/** @param {{ strong: number, weak: number }} p */
	const comparison = (p) => {
		const weakMore = p.weak > p.strong;
		const hi = Math.max(p.strong, p.weak);
		const lo = Math.min(p.strong, p.weak);
		const more = weakMore ? 'weak' : 'strong';
		const less = weakMore ? 'strong' : 'weak';
		if (hi === 0) {
			return { kind: 'neither', big: 'In between', small: 'none feel strong or weak', weakMore, more, less, hi, ratio: 1 };
		}
		if (lo > 0 && hi / lo < 1.15) {
			return { kind: 'even', big: 'About even', small: 'strong and weak are close', weakMore, more, less, hi, ratio: 1 };
		}
		if (lo === 0) {
			return { kind: 'zero', big: `${hi.toFixed(0)}% vs 0%`, small: `feel ${more}; none feel ${less}`, weakMore, more, less, hi, ratio: Infinity };
		}
		const ratio = hi / lo;
		const r = ratio.toFixed(1).replace(/\.0$/, '');
		return { kind: 'ratio', big: `${r}× more`, small: `feel ${more} than ${less}`, weakMore, more, less, hi, ratio };
	};
	let cmp = $derived(comparison(sel));
</script>

<figure class="chart" class:compact>
	<figcaption>
		<h2>{title}</h2>
		<p class="q">{intro}</p>
	</figcaption>

	{#if !compact}
	<fieldset class="picker">
		<legend>{pickerLegend}</legend>
		<div class="options">
			{#each points as p (p.label)}
				<label class:active={selected === p.label}>
					<input type="radio" name="{id}-pick" value={p.label} bind:group={selected} />
					{p.label}
				</label>
			{/each}
		</div>
	</fieldset>
	{/if}

	<div class="plot">
		<svg
			viewBox="0 0 {W} {H}"
			role="img"
			aria-label="{title}. {points
				.map((p) => `${heading(p.label)}: ${p.strong.toFixed(0)}% strong belonging, ${p.weak.toFixed(0)}% weak belonging`)
				.join('. ')}"
		>
			<!-- Selected rating -->
			<g class="band-g" class:strong={!cmp.weakMore} style:transform="translateX({(selIndex - last) * step}px)">
				<rect class="band" x={cx(last) - step / 2 + 4} y={pad.top - 52} width={step - 8} height={innerH + 52 + 50} rx="10" />
				<text class="band-title" x={cx(last)} y={pad.top - 30} text-anchor="middle">{cmp.big}</text>
				<text class="band-sub" x={cx(last)} y={pad.top - 12} text-anchor="middle">{cmp.small}</text>
			</g>

			{#each yTicks as t (t)}
				<line class="grid" x1={pad.left} x2={pad.left + innerW} y1={y(t)} y2={y(t)} />
				<text class="tick" x={pad.left - 10} y={y(t)} text-anchor="end" dominant-baseline="middle">{t}%</text>
			{/each}

			{#each points as p, i (p.label)}
				<text class="xl" class:hl={p.label === selected} x={cx(i)} y={H - pad.bottom + 22} text-anchor="middle">{p.label}</text>
				<text class="tick" x={cx(i)} y={H - pad.bottom + 40} text-anchor="middle">{count(p.n)}</text>
			{/each}

			{#each lines as l (l.key)}
				{@const other = l.key === 'strong' ? lines[1].values : lines[0].values}
				<path class="pen" d={pathOf(l.values)} fill="none" stroke={l.color} stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round" />
				<!-- Second, thinner pen stroke with different jitter: a sketched double line -->
				<path class="pen2" d={pathOf(l.values)} fill="none" stroke={l.color} stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round" />
				{#each l.values as v, i (i)}
					<circle class="pen" cx={cx(i)} cy={y(v)} r="7" style:fill="color-mix(in srgb, {l.color} 30%, var(--surface))" stroke={l.color} stroke-width="2.5" />
					{#if !(l.key === 'weak' && Math.abs(v - other[i]) < 0.5)}
						<!-- When both lines share a value, only one label is drawn (in the muted colour). -->
						<text
							class="val"
							x={cx(i)}
							y={labelAbove(v, other[i]) ? y(v) - 14 : y(v) + 26}
							text-anchor="middle"
							fill={Math.abs(v - other[i]) < 0.5 ? 'var(--muted)' : l.color}
						>
							{v.toFixed(0)}%
						</text>
					{/if}
				{/each}
				<!-- Direct label at the end of the line -->
				<text class="end" x={cx(last) + 22} y={y(l.values[last])} dominant-baseline="middle" fill={l.color}>{l.label}</text>
			{/each}

			<!-- Click a rating on the chart to select it (the buttons above are the keyboard-accessible control) -->
			{#each points as p, i (p.label)}
				<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
				<rect class="hit" x={cx(i) - step / 2} y={pad.top - 52} width={step} height={innerH + 52 + 50} onclick={() => (selected = p.label)} />
			{/each}
		</svg>
	</div>

	<div class="summary" class:strong={!cmp.weakMore} aria-live="polite">
		<p class="summary-head">
			<b>{heading(sel.label)}</b>
			<span>{count(sel.n)}</span>
		</p>
		<div class="summary-bars">
			{#each lines as l (l.key)}
				{@const v = l.values[selIndex]}
				<div class="sbar">
					<span class="sbar-label">{l.label}</span>
					<span class="sbar-track"><span class="sbar-fill hand-bar" style:width="{v}%" style:--c={l.color}></span></span>
					<span class="sbar-val" style:color={l.color}>{v.toFixed(0)}%</span>
				</div>
			{/each}
		</div>
		<p class="summary-text">
			{#if cmp.kind === 'neither'}
				None feel {phrases[0]} or {phrases[1]}; everyone here is in between.
			{:else if cmp.kind === 'even'}
				About as many feel {phrases[0]} as feel {phrases[1]}.
			{:else if cmp.kind === 'zero'}
				{cmp.hi >= 99.5 ? 'All' : `About ${Math.round(cmp.hi / 10)} in 10`} feel
				{cmp.weakMore ? phrases[1] : phrases[0]}, and none feel {cmp.weakMore ? phrases[0] : phrases[1]}.
			{:else}
				About {Math.round(cmp.hi / 10)} in 10 feel {cmp.weakMore ? phrases[1] : phrases[0]},
				{cmp.big.replace(' more', '')} as many as feel {cmp.weakMore ? phrases[0] : phrases[1]}.
			{/if}
		</p>
	</div>

	{#if caption.length && !compact}
		<div class="caption">
			<p class="caption-head">Key findings</p>
			<ul>
				{#each caption as line}
					<li>{line}</li>
				{/each}
			</ul>
		</div>
	{/if}

	{#if footer && !compact}
		<footer>{footer}</footer>
	{/if}
</figure>

<style>
	.chart {
		margin: 0;
		display: grid;
		align-content: start;
		gap: 1rem;
		padding: 1.25rem 1.25rem 1rem;
		background: var(--surface);
		border: 2px solid color-mix(in srgb, var(--fg) 60%, transparent);
		border-radius: var(--wobble);
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
		line-height: 1.45;
		max-width: 75ch;
	}
	.plot {
		max-width: 54rem;
	}
	.compact .q {
		display: none;
	}
	.plot svg {
		display: block;
		width: 100%;
		height: auto;
		overflow: visible;
	}
	.band-g {
		--band: var(--bad-2);
		transition: transform 300ms ease;
	}
	.band-g.strong {
		--band: var(--good-2);
	}
	.band {
		fill: var(--band);
		fill-opacity: 0.08;
		stroke: var(--band);
		stroke-opacity: 0.6;
		stroke-width: 2;
		stroke-dasharray: 10 4 3 4;
		filter: url(#sketch);
	}
	.hit {
		fill: transparent;
		cursor: pointer;
	}
	.band-title {
		fill: var(--band);
		font-size: 20px;
		font-weight: 700;
		font-variant-numeric: tabular-nums;
	}
	.band-sub {
		fill: var(--muted);
		font-size: 13px;
	}
	.pen {
		filter: url(#sketch);
	}
	.pen2 {
		filter: url(#sketch-alt);
		opacity: 0.55;
	}
	.grid {
		stroke: color-mix(in srgb, var(--fg) 22%, transparent);
		stroke-width: 1.2;
		stroke-dasharray: 14 3 6 3;
		filter: url(#sketch);
	}
	.tick {
		fill: var(--muted);
		font-size: 14px;
		font-variant-numeric: tabular-nums;
	}
	.xl {
		fill: var(--fg);
		font-size: 16px;
	}
	.xl.hl {
		font-weight: 600;
	}
	.val {
		font-size: 17px;
		font-variant-numeric: tabular-nums;
	}
	.end {
		font-size: 16px;
	}
	.picker {
		border: 0;
		margin: 0;
		padding: 0;
	}
	.picker legend {
		padding: 0;
		margin-bottom: 0.5rem;
		font-size: 0.8rem;
		font-weight: 600;
		color: var(--muted);
	}
	.options {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem;
	}
	.options label {
		padding: 0.4rem 0.85rem;
		border: 1px solid var(--line);
		border-radius: var(--wobble);
		background: var(--surface);
		cursor: pointer;
		font-size: 0.85rem;
	}
	.options label:hover {
		border-color: var(--accent);
	}
	.options label.active {
		background: var(--accent);
		border-color: var(--accent);
		color: var(--bg);
		font-weight: 600;
	}
	.options label:has(input:focus-visible) {
		outline: 2px solid var(--accent);
		outline-offset: 2px;
	}
	.options input {
		position: absolute;
		opacity: 0;
		pointer-events: none;
	}
	.summary {
		--band: var(--bad-2);
		display: grid;
		gap: 0.6rem;
		padding: 0.9rem 1rem;
		border: 1px solid color-mix(in srgb, var(--band) 45%, transparent);
		background: color-mix(in srgb, var(--band) 7%, transparent);
		border-radius: var(--wobble);
		max-width: 54rem;
	}
	.summary.strong {
		--band: var(--good-2);
	}
	.summary-head {
		margin: 0;
		font-size: 0.95rem;
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: 0.25rem 0.6rem;
	}
	.summary-head span {
		font-size: 0.75rem;
		color: var(--muted);
		font-variant-numeric: tabular-nums;
	}
	.summary-bars {
		display: grid;
		gap: 0.35rem;
	}
	.sbar {
		display: grid;
		grid-template-columns: 8.5rem 1fr 3rem;
		gap: 0.6rem;
		align-items: center;
		font-size: 0.85rem;
	}
	.sbar-track {
		height: 0.9rem;
		border-bottom: 1.5px dashed color-mix(in srgb, var(--fg) 25%, transparent);
	}
	.sbar-fill {
		display: block;
		height: 100%;
		transition: width 300ms ease;
	}
	.sbar-val {
		text-align: right;
		font-weight: 700;
		font-variant-numeric: tabular-nums;
	}
	.summary-text {
		margin: 0;
		font-size: 0.85rem;
		line-height: 1.45;
	}
	@media (max-width: 480px) {
		.sbar {
			grid-template-columns: 1fr 2.75rem;
		}
		.sbar-label {
			grid-column: 1 / -1;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.band-g,
		.sbar-fill {
			transition: none;
		}
	}
	.caption {
		padding: 0.75rem 0.9rem;
		background: var(--track);
		border-radius: var(--wobble);
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
</style>
